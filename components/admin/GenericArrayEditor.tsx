"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchContentFile,
  commitFiles,
  encodeBase64Unicode,
  GitHubApiError,
  type FileChange,
} from "@/lib/github";
import { slugify, fileToBase64, moveItem, savedMessage, confirmDeleteMessage } from "@/components/admin/shared";
import ClientMultiSelect from "@/components/admin/ClientMultiSelect";
import CaseStudyMultiSelect from "@/components/admin/CaseStudyMultiSelect";
import ImageListInput, { SingleImageInput } from "@/components/admin/ImageListInput";
import EntryList from "@/components/admin/EntryList";
import { ErrorBanner, SuccessBanner } from "@/components/admin/CrudBanners";
import { CheckboxField, EditorPanel, Field, FormActions, FormSection, fieldClass } from "@/components/admin/FormKit";
import { confirmDiscardEdits, snapshot, useSaveShortcut, useUnsavedGuard } from "@/components/admin/useUnsavedGuard";
import { collectErrors, errorSummary, focusFirstError, requiredError, urlError, type FieldErrors } from "@/components/admin/validation";
import { renderPreview, type PreviewKind } from "@/components/admin/previews";
import { clearDraft, DraftBanner, useDraftRecovery } from "@/components/admin/useDraftRecovery";
import { bulkMessage, standardBulkActions } from "@/components/admin/bulkActions";
import type { CounterRange } from "@/components/admin/FormKit";

type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "tags"
  | "list"
  | "boolean"
  | "url"
  | "image"
  | "images"
  | "number"
  | "clients"
  | "caseStudies";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  /** Short help shown under the field. */
  hint?: string;
  /** Must be filled in before saving (the title field always is). */
  required?: boolean;
  defaultBoolean?: boolean;
  min?: number;
  max?: number;
  /** Heading this field is grouped under. Fields without one land in the first, unlabelled group. */
  section?: string;
  /** Overrides the type's default column span in the two-column grid. */
  width?: "half" | "full";
  /** Textarea height. Defaults to 3 rows (5 for `list`). */
  rows?: number;
  /** Shows a live character count with the recommended range (SEO titles/descriptions). */
  counter?: CounterRange;
  /** Image fields: folder under /images that uploads go to, instead of the config's own `imageFolder`
   *  (logos go to `logos`, which no editor auto-deletes from, so they can be shared safely). */
  uploadFolder?: string;
  /** Image fields: key of the field whose value names the uploaded file (default: the title field). */
  nameFrom?: string;
}

/** Long-form and picker inputs need the full row; short scalars pair up two-across. */
const FULL_WIDTH_TYPES: FieldType[] = ["textarea", "list", "image", "images", "clients", "caseStudies"];

function isFullWidth(field: FieldDef): boolean {
  return field.width ? field.width === "full" : FULL_WIDTH_TYPES.includes(field.type);
}

function groupFields(fields: FieldDef[]): { section: string | null; fields: FieldDef[] }[] {
  const groups: { section: string | null; fields: FieldDef[] }[] = [];
  for (const field of fields) {
    const section = field.section ?? null;
    const last = groups[groups.length - 1];
    if (last && last.section === section) last.fields.push(field);
    else groups.push({ section, fields: [field] });
  }
  return groups;
}

type RawEntry = Record<string, unknown>;
type FormState = Record<string, string | boolean>;

export interface ArrayConfig {
  path: string;
  arrayKey: string;
  label: string;
  titleField: string;
  subtitleField?: string;
  subtitleFormat?: (value: unknown) => string;
  imageFolder?: string;
  /** Detail-page base path; rows with a `slug` link to `${viewPath}/${slug}`. */
  viewPath?: string;
  /** Page on the site where these entries appear (used when there's no per-entry page). */
  sitePath?: string | ((entry: RawEntry) => string | null);
  /** Live preview rendered beside the form. */
  preview?: PreviewKind;
  fields: FieldDef[];
  extraNormalizeIn?: (raw: RawEntry) => Record<string, string>;
  extraTransformOut?: (out: RawEntry, form: FormState) => RawEntry;
}

function normalizeIn(raw: RawEntry, config: ArrayConfig): FormState {
  const form: FormState = {};
  for (const f of config.fields) {
    if (f.type === "boolean") {
      form[f.key] = (raw[f.key] as boolean | undefined) ?? f.defaultBoolean ?? false;
    } else if (f.type === "tags" || f.type === "caseStudies") {
      form[f.key] = Array.isArray(raw[f.key]) ? (raw[f.key] as string[]).join(", ") : "";
    } else if (f.type === "list" || f.type === "images") {
      form[f.key] = Array.isArray(raw[f.key]) ? (raw[f.key] as string[]).join("\n") : "";
    } else {
      form[f.key] = raw[f.key] != null ? String(raw[f.key]) : "";
    }
  }
  return { ...form, ...(config.extraNormalizeIn?.(raw) ?? {}) };
}

function splitLines(val: unknown): string[] {
  return String(val ?? "")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
}

function transformOut(form: FormState, config: ArrayConfig): RawEntry {
  const out: RawEntry = {};
  for (const f of config.fields) {
    const val = form[f.key];
    if (f.type === "boolean") {
      out[f.key] = Boolean(val);
    } else if (f.type === "tags" || f.type === "caseStudies") {
      out[f.key] = String(val ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (f.type === "list") {
      out[f.key] = splitLines(val);
    } else if (f.type === "images") {
      const images = splitLines(val);
      if (images.length > 0) out[f.key] = images;
    } else if (f.type === "url") {
      const trimmed = String(val ?? "").trim();
      out[f.key] = trimmed || null;
    } else if (f.type === "number") {
      out[f.key] = Number(val) || 0;
    } else {
      out[f.key] = String(val ?? "").trim();
    }
  }
  return config.extraTransformOut ? config.extraTransformOut(out, form) : out;
}

function blankForm(config: ArrayConfig): FormState {
  return normalizeIn({}, config);
}

function makeId(base: string, existingIds: string[]): string {
  const baseSlug = slugify(base) || "item";
  let candidate = baseSlug;
  let n = 2;
  while (existingIds.includes(candidate)) {
    candidate = `${baseSlug}-${n}`;
    n++;
  }
  return candidate;
}

/** Image paths on `entry` that were uploaded through this admin (i.e. live under this
 *  content type's own folder) — the only ones safe to auto-delete. */
function managedImagePaths(entry: RawEntry, config: ArrayConfig): string[] {
  if (!config.imageFolder) return [];
  const prefix = `/images/${config.imageFolder}/`;
  const paths: string[] = [];
  for (const f of config.fields) {
    const val = entry[f.key];
    if (f.type === "image") {
      if (typeof val === "string" && val.startsWith(prefix)) paths.push(val);
    } else if (f.type === "images" && Array.isArray(val)) {
      for (const p of val) if (typeof p === "string" && p.startsWith(prefix)) paths.push(p);
    }
  }
  return paths;
}

/** First image an entry shows (for list thumbnails), checking its image fields in order. */
function entryThumbnail(entry: RawEntry, config: ArrayConfig): string | undefined {
  for (const f of config.fields) {
    if (f.type !== "image" && f.type !== "images") continue;
    const val = entry[f.key];
    if (typeof val === "string" && val) return val;
    if (Array.isArray(val) && typeof val[0] === "string") return val[0];
  }
  if (typeof entry.icon === "string") return entry.icon;
  return undefined;
}

function hasImageFields(config: ArrayConfig): boolean {
  return config.fields.some((f) => f.type === "image" || f.type === "images");
}

function entryViewUrl(entry: RawEntry, config: ArrayConfig): string | null {
  if (config.viewPath && typeof entry.slug === "string" && entry.slug.trim()) {
    return `${config.viewPath}/${encodeURIComponent(entry.slug)}`;
  }
  if (typeof config.sitePath === "function") return config.sitePath(entry);
  return config.sitePath ?? null;
}

function toRepoPath(publicPath: string): string {
  return `public${publicPath}`;
}

function validate(form: FormState, config: ArrayConfig): FieldErrors {
  return collectErrors(
    config.fields.flatMap((f): [string, string | null][] => {
      const value = form[f.key];
      const checks: [string, string | null][] = [];
      if (f.required || f.key === config.titleField) checks.push([f.key, requiredError(value, f.label)]);
      if (f.type === "url") checks.push([f.key, urlError(value)]);
      if (f.type === "image") checks.push([f.key, urlError(value)]);
      if (f.type === "number" && String(value ?? "").trim()) {
        const n = Number(value);
        const outOfRange = Number.isNaN(n) || (f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max);
        checks.push([f.key, outOfRange ? `Enter a number${f.min !== undefined && f.max !== undefined ? ` from ${f.min} to ${f.max}` : ""}.` : null]);
      }
      return checks;
    })
  );
}

interface GenericArrayEditorProps {
  config: ArrayConfig;
  token: string;
  onAuthError: () => void;
  initialNew?: boolean;
  /** Entry to open as soon as the list loads (from search or the Dashboard). */
  initialEditId?: string;
}

export default function GenericArrayEditor({ config, token, onAuthError, initialNew = false, initialEditId }: GenericArrayEditorProps) {
  const pendingEditId = useRef(initialEditId);
  const [entries, setEntries] = useState<RawEntry[] | null>(null);
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<FormState>({});
  const [openedForm, setOpenedForm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [imageFiles, setImageFiles] = useState<Record<string, File | null>>({});
  const [imageListFiles, setImageListFiles] = useState<Record<string, File[]>>({});
  const [loadedOrderIds, setLoadedOrderIds] = useState<string[]>([]);

  const hasPublishedField = config.fields.some((f) => f.key === "published");
  const editing = editingIndex !== null;
  const pendingUploads =
    Object.values(imageFiles).some(Boolean) || Object.values(imageListFiles).some((files) => files.length > 0);
  const dirty = editing && (snapshot(form) !== openedForm || pendingUploads);

  useUnsavedGuard(dirty);
  useSaveShortcut(() => void handleSave(), editing && !saving);

  const draftKey = editing ? `${config.path}:${editingId ?? "new"}` : null;
  const recovery = useDraftRecovery(draftKey, form, dirty);

  const pendingFiles = useMemo(
    () => [...Object.values(imageFiles).filter((f): f is File => !!f), ...Object.values(imageListFiles).flat()],
    [imageFiles, imageListFiles]
  );
  const previewUrls = useMemo(
    () => new Map(config.preview ? pendingFiles.map((file) => [file, URL.createObjectURL(file)]) : []),
    [pendingFiles, config.preview]
  );
  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls]);

  useEffect(() => {
    setEntries(null);
    setError(null);
    setSuccessMsg(null);
    if (initialNew) openForm(blankForm(config), true, null);
    else setEditingIndex(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.path]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { content, sha } = await fetchContentFile(config.path, token);
      const parsed = JSON.parse(content);
      const loaded = (parsed[config.arrayKey] as RawEntry[]) ?? [];
      setEntries(loaded);
      setLoadedOrderIds(loaded.map((e) => String(e.id)));
      setFileSha(sha);
      // Opened from search or the Dashboard: jump straight into that entry.
      if (pendingEditId.current) {
        const index = loaded.findIndex((e) => String(e.id) === pendingEditId.current);
        pendingEditId.current = undefined;
        if (index >= 0) openForm(normalizeIn(loaded[index], config), false, String(loaded[index].id), index);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  const orderDirty =
    entries !== null && entries.map((e) => String(e.id)).join("|") !== loadedOrderIds.join("|");

  function handleApiError(err: unknown) {
    if (err instanceof GitHubApiError && (err.status === 401 || err.status === 403)) {
      onAuthError();
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Something went wrong.");
    }
  }

  function openForm(next: FormState, asNew: boolean, id: string | null, index = -1) {
    setForm(next);
    setOpenedForm(snapshot(next));
    setFieldErrors({});
    setImageFiles({});
    setImageListFiles({});
    setIsNew(asNew);
    setEditingId(id);
    setEditingIndex(index);
    setSuccessMsg(null);
    setError(null);
  }

  function startNew() {
    if (!confirmDiscardEdits(dirty)) return;
    openForm(blankForm(config), true, null);
  }

  function startEdit(index: number) {
    if (!confirmDiscardEdits(dirty)) return;
    openForm(normalizeIn(entries![index], config), false, String(entries![index].id), index);
  }

  function cancelEdit() {
    if (!confirmDiscardEdits(dirty)) return;
    if (dirty) clearDraft(draftKey);
    setEditingIndex(null);
    setEditingId(null);
    setImageFiles({});
    setImageListFiles({});
    setFieldErrors({});
  }

  function updateField(key: string, value: string | boolean) {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
  }

  async function commit(changes: FileChange[], newEntries: RawEntry[], message: string): Promise<boolean> {
    if (!fileSha) {
      setError("Missing file version — reload the list before saving.");
      return false;
    }
    const payload = { [config.arrayKey]: newEntries };
    const content = JSON.stringify(payload, null, 2) + "\n";
    const allChanges = [...changes, { path: config.path, content: encodeBase64Unicode(content) }];

    setSaving(true);
    setError(null);
    try {
      await commitFiles(allChanges, message, token, { path: config.path, expectedSha: fileSha });
      setEntries(newEntries);
      setEditingIndex(null);
      setEditingId(null);
      setSuccessMsg(savedMessage());
      await load();
      return true;
    } catch (err) {
      handleApiError(err);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOrder() {
    if (!entries) return;
    await commit([], entries, `content: reorder ${config.label}`);
  }

  async function handleSave() {
    if (editingIndex === null || saving) return;
    const errors = validate(form, config);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(errorSummary(errors));
      focusFirstError();
      return;
    }
    setFieldErrors({});
    const titleVal = String(form[config.titleField] ?? "").trim();

    const previousEntry = !isNew ? entries?.find((e) => String(e.id) === editingId) : undefined;
    const oldManagedPaths = previousEntry ? managedImagePaths(previousEntry, config) : [];

    const workingForm = { ...form };
    const changes: FileChange[] = [];

    const imageFields = config.fields.filter((f) => f.type === "image");
    const imageListFields = config.fields.filter((f) => f.type === "images");
    if (imageFields.length > 0 || imageListFields.length > 0) {
      setSaving(true);
      setError(null);
      try {
        for (const field of imageListFields) {
          const files = imageListFiles[field.key] ?? [];
          if (files.length === 0) continue;
          const uploaded: string[] = [];
          const folder = field.uploadFolder ?? config.imageFolder;
          const base = slugify(String(workingForm[field.nameFrom ?? config.titleField] ?? titleVal)) || slugify(titleVal);
          for (const file of files) {
            const ext = file.name.split(".").pop()?.toLowerCase() || "png";
            const publicPath = field.uploadFolder
              ? `/images/${folder}/${base}-${crypto.randomUUID().slice(0, 8)}.${ext}`
              : `/images/${folder}/${base}-${field.key}-${crypto.randomUUID()}.${ext}`;
            changes.push({ path: toRepoPath(publicPath), content: await fileToBase64(file) });
            uploaded.push(publicPath);
          }
          workingForm[field.key] = [...splitLines(workingForm[field.key]), ...uploaded].join("\n");
        }
        for (const field of imageFields) {
          const file = imageFiles[field.key];
          if (!file) continue;
          const ext = file.name.split(".").pop()?.toLowerCase() || "png";
          const folder = field.uploadFolder ?? config.imageFolder;
          const base = slugify(String(workingForm[field.nameFrom ?? config.titleField] ?? titleVal)) || slugify(titleVal);
          const publicPath = `/images/${folder}/${base}${
            imageFields.length > 1 && !field.uploadFolder ? `-${field.key}` : ""
          }.${ext}`;
          changes.push({ path: toRepoPath(publicPath), content: await fileToBase64(file) });
          workingForm[field.key] = publicPath;
        }
      } catch (err) {
        handleApiError(err);
        setSaving(false);
        return;
      }
    }

    const current = entries ?? [];
    let updated: RawEntry[];

    if (isNew) {
      const newId = makeId(titleVal, current.map((e) => String(e.id)));
      updated = [...current, { id: newId, ...transformOut(workingForm, config) }];
    } else {
      const outEntry = { id: editingId, ...transformOut(workingForm, config) };
      updated = current.map((e) => (String(e.id) === editingId ? outEntry : e));
    }

    for (const p of oldManagedPaths) {
      const stillReferenced = updated.some((e) => managedImagePaths(e, config).includes(p));
      if (!stillReferenced) changes.push({ path: toRepoPath(p), content: null });
    }

    const message = isNew ? `content: add ${titleVal}` : `content: update ${titleVal}`;
    const ok = await commit(changes, updated, message);
    if (ok) {
      clearDraft(draftKey);
      setImageFiles({});
      setImageListFiles({});
    }
  }

  async function bulkSetPublished(items: RawEntry[], published: boolean) {
    const ids = new Set(items.map((e) => String(e.id)));
    const updated = (entries ?? []).map((e) => (ids.has(String(e.id)) ? { ...e, published } : e));
    await commit([], updated, bulkMessage(published ? "publish" : "unpublish", items.length, config.label.toLowerCase()));
  }

  async function bulkDelete(items: RawEntry[]) {
    const ids = new Set(items.map((e) => String(e.id)));
    const updated = (entries ?? []).filter((e) => !ids.has(String(e.id)));
    const stillUsed = new Set(updated.flatMap((e) => managedImagePaths(e, config)));
    const changes: FileChange[] = [...new Set(items.flatMap((e) => managedImagePaths(e, config)))]
      .filter((p) => !stillUsed.has(p))
      .map((p) => ({ path: toRepoPath(p), content: null }));
    await commit(changes, updated, bulkMessage("delete", items.length, config.label.toLowerCase()));
  }

  async function handleDelete(entry: RawEntry) {
    const current = entries ?? [];
    const label = String(entry[config.titleField] ?? "this entry");
    if (!confirm(confirmDeleteMessage(label))) return;

    const updated = current.filter((e) => String(e.id) !== String(entry.id));
    const changes: FileChange[] = managedImagePaths(entry, config)
      .filter((p) => !updated.some((e) => managedImagePaths(e, config).includes(p)))
      .map((p) => ({ path: toRepoPath(p), content: null }));

    await commit(changes, updated, `content: delete ${label}`);
  }

  function previewEntry(): RawEntry {
    // Picked-but-not-uploaded files show via temporary object URLs.
    const withUploads: FormState = { ...form };
    for (const field of config.fields) {
      if (field.type === "images" && imageListFiles[field.key]?.length) {
        const urls = imageListFiles[field.key].map((file) => previewUrls.get(file)).filter(Boolean);
        withUploads[field.key] = [...splitLines(form[field.key]), ...urls].join("\n");
      }
      const single = field.type === "image" ? imageFiles[field.key] : null;
      if (single) withUploads[field.key] = previewUrls.get(single) ?? "";
    }
    return transformOut(withUploads, config);
  }

  return (
    <div>
      <ErrorBanner message={error} onReload={() => void load()} />
      <SuccessBanner message={successMsg} />

      {editing ? (
        <EditorPanel
          title={isNew ? `New ${config.label} entry` : `Edit: ${String(form[config.titleField] || "entry")}`}
          dirty={dirty}
          onClose={cancelEdit}
          preview={config.preview ? renderPreview(config.preview, previewEntry()) : undefined}
        >
          {recovery.draft && (
            <DraftBanner
              at={recovery.draft.at}
              onRestore={() => {
                setForm(recovery.draft!.value);
                recovery.accepted();
              }}
              onDismiss={recovery.dismiss}
            />
          )}
          {groupFields(config.fields).map((group, groupIndex) => (
            <FormSection key={group.section ?? `group-${groupIndex}`} title={group.section ?? undefined}>
              {group.fields.map((field) => {
                const fieldError = fieldErrors[field.key];
                const required = field.required || field.key === config.titleField;
                const value = String(form[field.key] ?? "");
                const inputId = `field-${config.arrayKey}-${field.key}`;

                if (field.type === "boolean") {
                  return (
                    <CheckboxField
                      key={field.key}
                      checked={Boolean(form[field.key])}
                      onChange={(checked) => updateField(field.key, checked)}
                      label={field.label}
                      hint={field.hint}
                    />
                  );
                }

                return (
                  <Field
                    key={field.key}
                    label={field.label}
                    htmlFor={inputId}
                    error={fieldError}
                    hint={field.hint}
                    required={required}
                    full={isFullWidth(field)}
                    counter={field.counter ? { value, range: field.counter } : undefined}
                  >
                    {field.type === "textarea" || field.type === "list" ? (
                      <textarea
                        id={inputId}
                        value={value}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        rows={field.rows ?? (field.type === "list" ? 5 : 3)}
                        placeholder={field.placeholder}
                        className={fieldClass(fieldError, "resize-y")}
                      />
                    ) : field.type === "images" ? (
                      <ImageListInput
                        images={splitLines(form[field.key])}
                        pending={imageListFiles[field.key] ?? []}
                        placeholder={field.placeholder}
                        onChange={(images) => updateField(field.key, images.join("\n"))}
                        onPendingChange={(files) => setImageListFiles((previous) => ({ ...previous, [field.key]: files }))}
                      />
                    ) : field.type === "image" ? (
                      <SingleImageInput
                        id={inputId}
                        value={value}
                        file={imageFiles[field.key] ?? null}
                        placeholder={field.placeholder ?? `/images/${config.imageFolder ?? "logos"}/example.png`}
                        invalid={!!fieldError}
                        onChange={(next) => updateField(field.key, next)}
                        onFileChange={(file) => setImageFiles((previous) => ({ ...previous, [field.key]: file }))}
                      />
                    ) : field.type === "clients" ? (
                      <ClientMultiSelect value={value} onChange={(next) => updateField(field.key, next)} />
                    ) : field.type === "caseStudies" ? (
                      <CaseStudyMultiSelect value={value} onChange={(next) => updateField(field.key, next)} />
                    ) : (
                      <input
                        id={inputId}
                        type={field.type === "date" ? "date" : field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                        min={field.min}
                        max={field.max}
                        value={value}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className={fieldClass(fieldError)}
                      />
                    )}
                  </Field>
                );
              })}
            </FormSection>
          ))}

          <FormActions
            saving={saving}
            dirty={dirty}
            onSave={() => void handleSave()}
            onCancel={cancelEdit}
          />
        </EditorPanel>
      ) : (
        <EntryList<RawEntry>
          items={entries}
          loading={loading}
          getKey={(entry) => String(entry.id)}
          getTitle={(entry) => String(entry[config.titleField] ?? "Untitled")}
          getSubtitle={
            config.subtitleField
              ? (entry) => {
                  const value = entry[config.subtitleField!];
                  if (value == null || value === "") return "";
                  return config.subtitleFormat ? config.subtitleFormat(value) : String(value);
                }
              : undefined
          }
          getThumbnail={hasImageFields(config) ? (entry) => entryThumbnail(entry, config) : undefined}
          isDraft={hasPublishedField ? (entry) => entry.published === false : undefined}
          getSearchText={(entry) => config.fields.map((f) => (typeof entry[f.key] === "string" ? entry[f.key] : "")).join(" ")}
          getViewUrl={(entry) => entryViewUrl(entry, config)}
          onMove={(from, to) => setEntries((previous) => (previous ? moveItem(previous, from, to) : previous))}
          onEdit={(entry) => startEdit(entries!.indexOf(entry))}
          onDelete={(entry) => void handleDelete(entry)}
          onNew={startNew}
          orderDirty={orderDirty}
          saving={saving}
          onSaveOrder={() => void handleSaveOrder()}
          onDiscardOrder={() => void load()}
          titleHeading={config.fields.find((f) => f.key === config.titleField)?.label ?? "Title"}
          bulkActions={standardBulkActions<RawEntry>({
            noun: config.label.toLowerCase(),
            onSetPublished: hasPublishedField ? bulkSetPublished : undefined,
            onDelete: bulkDelete,
          })}
        />
      )}
    </div>
  );
}
