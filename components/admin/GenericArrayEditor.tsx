"use client";

import { useEffect, useState } from "react";
import {
  fetchContentFile,
  commitFiles,
  encodeBase64Unicode,
  GitHubApiError,
  type FileChange,
} from "@/lib/github";
import { Pencil, Trash2, Plus, ExternalLink, X, Upload, ArrowUp, ArrowDown } from "lucide-react";
import { inputClass, slugify, fileToBase64 } from "@/components/admin/shared";
import ClientMultiSelect from "@/components/admin/ClientMultiSelect";

type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "tags"
  | "list"
  | "boolean"
  | "url"
  | "image"
  | "number"
  | "clients";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultBoolean?: boolean;
  min?: number;
  max?: number;
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
  fields: FieldDef[];
  extraNormalizeIn?: (raw: RawEntry) => Record<string, string>;
  extraTransformOut?: (out: RawEntry, form: FormState) => RawEntry;
}

function normalizeIn(raw: RawEntry, config: ArrayConfig): FormState {
  const form: FormState = {};
  for (const f of config.fields) {
    if (f.type === "boolean") {
      form[f.key] = (raw[f.key] as boolean | undefined) ?? f.defaultBoolean ?? false;
    } else if (f.type === "tags") {
      form[f.key] = Array.isArray(raw[f.key]) ? (raw[f.key] as string[]).join(", ") : "";
    } else if (f.type === "list") {
      form[f.key] = Array.isArray(raw[f.key]) ? (raw[f.key] as string[]).join("\n") : "";
    } else {
      form[f.key] = raw[f.key] != null ? String(raw[f.key]) : "";
    }
  }
  return { ...form, ...(config.extraNormalizeIn?.(raw) ?? {}) };
}

function transformOut(form: FormState, config: ArrayConfig): RawEntry {
  const out: RawEntry = {};
  for (const f of config.fields) {
    const val = form[f.key];
    if (f.type === "boolean") {
      out[f.key] = Boolean(val);
    } else if (f.type === "tags") {
      out[f.key] = String(val ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (f.type === "list") {
      out[f.key] = String(val ?? "")
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);
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
    if (f.type !== "image") continue;
    const val = entry[f.key];
    if (typeof val === "string" && val.startsWith(prefix)) paths.push(val);
  }
  return paths;
}

function toRepoPath(publicPath: string): string {
  return `public${publicPath}`;
}

interface GenericArrayEditorProps {
  config: ArrayConfig;
  token: string;
  onAuthError: () => void;
}

export default function GenericArrayEditor({ config, token, onAuthError }: GenericArrayEditorProps) {
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
  const [imageFiles, setImageFiles] = useState<Record<string, File | null>>({});
  const [loadedOrderIds, setLoadedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    setEntries(null);
    setEditingIndex(null);
    setError(null);
    setSuccessMsg(null);
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
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  const orderDirty =
    entries !== null && entries.map((e) => String(e.id)).join("|") !== loadedOrderIds.join("|");

  function moveEntry(index: number, direction: -1 | 1) {
    setEntries((prev) => {
      if (!prev) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleApiError(err: unknown) {
    if (err instanceof GitHubApiError && (err.status === 401 || err.status === 403)) {
      onAuthError();
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Something went wrong.");
    }
  }

  function startNew() {
    setForm(blankForm(config));
    setImageFiles({});
    setIsNew(true);
    setEditingId(null);
    setEditingIndex(-1);
    setSuccessMsg(null);
    setError(null);
  }

  function startEdit(index: number) {
    setForm(normalizeIn(entries![index], config));
    setImageFiles({});
    setIsNew(false);
    setEditingId(String(entries![index].id));
    setEditingIndex(index);
    setSuccessMsg(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditingId(null);
    setImageFiles({});
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
      setSuccessMsg(
        "Saved and committed. The site will redeploy automatically — check the Actions tab in a minute or two."
      );
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

  function discardOrder() {
    void load();
  }

  async function handleSave() {
    if (editingIndex === null) return;
    const titleVal = String(form[config.titleField] ?? "").trim();
    if (!titleVal) {
      setError(`${config.fields.find((f) => f.key === config.titleField)?.label ?? "Title"} is required.`);
      return;
    }

    const previousEntry = !isNew ? entries?.find((e) => String(e.id) === editingId) : undefined;
    const oldManagedPaths = previousEntry ? managedImagePaths(previousEntry, config) : [];

    const workingForm = { ...form };
    const changes: FileChange[] = [];

    const imageFields = config.fields.filter((f) => f.type === "image");
    if (imageFields.length > 0) {
      setSaving(true);
      setError(null);
      try {
        for (const field of imageFields) {
          const file = imageFiles[field.key];
          if (!file) continue;
          const ext = file.name.split(".").pop()?.toLowerCase() || "png";
          const slug = slugify(titleVal);
          const repoPath = `public/images/${config.imageFolder}/${slug}${
            imageFields.length > 1 ? `-${field.key}` : ""
          }.${ext}`;
          const base64 = await fileToBase64(file);
          changes.push({ path: repoPath, content: base64 });
          workingForm[field.key] = `/images/${config.imageFolder}/${slug}${
            imageFields.length > 1 ? `-${field.key}` : ""
          }.${ext}`;
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
      const outEntry = { id: newId, ...transformOut(workingForm, config) };
      updated = [...current, outEntry];
    } else {
      const outEntry = { id: editingId, ...transformOut(workingForm, config) };
      updated = current.map((e) => (String(e.id) === editingId ? outEntry : e));
    }

    for (const p of oldManagedPaths) {
      const stillReferenced = updated.some((e) => managedImagePaths(e, config).includes(p));
      if (!stillReferenced) changes.push({ path: toRepoPath(p), content: null });
    }

    const message = isNew ? `content: add ${titleVal}` : `content: update ${titleVal}`;
    await commit(changes, updated, message);
    setImageFiles({});
  }

  async function handleDelete(index: number) {
    const current = entries ?? [];
    const target = current[index];
    const label = String(target?.[config.titleField] ?? "this entry");
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;

    const updated = current.filter((e) => String(e.id) !== String(target?.id));
    const candidatePaths = target ? managedImagePaths(target, config) : [];
    const changes: FileChange[] = candidatePaths
      .filter((p) => !updated.some((e) => managedImagePaths(e, config).includes(p)))
      .map((p) => ({ path: toRepoPath(p), content: null }));

    await commit(changes, updated, `content: delete ${label}`);
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-center justify-between gap-4 px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg text-accent text-sm">
          <span>{successMsg}</span>
          <a
            href="https://github.com/developerhridu/developerhridu.github.io/actions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 whitespace-nowrap hover:underline"
          >
            View Actions <ExternalLink size={12} />
          </a>
        </div>
      )}

      {editingIndex !== null ? (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{isNew ? "New entry" : "Edit entry"}</h2>
            <button onClick={cancelEdit} aria-label="Close" className="text-muted hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          {config.fields.map((field) => (
            <div key={field.key}>
              {field.type === "boolean" ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form[field.key])}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-sm text-foreground">{field.label}</span>
                </label>
              ) : (
                <>
                  <label className="block text-xs uppercase tracking-wide text-muted mb-1">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={String(form[field.key] ?? "")}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  ) : field.type === "list" ? (
                    <textarea
                      value={String(form[field.key] ?? "")}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      rows={5}
                      className={`${inputClass} resize-none`}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "date" ? (
                    <input
                      type="date"
                      value={String(form[field.key] ?? "")}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className={inputClass}
                    />
                  ) : field.type === "number" ? (
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      value={String(form[field.key] ?? "")}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className={inputClass}
                    />
                  ) : field.type === "clients" ? (
                    <ClientMultiSelect
                      value={String(form[field.key] ?? "")}
                      onChange={(value) => setForm({ ...form, [field.key]: value })}
                    />
                  ) : (
                    <input
                      value={String(form[field.key] ?? "")}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  )}
                  {field.type === "image" && (
                    <>
                      <label className={`${inputClass} mt-2 flex items-center gap-2 cursor-pointer`}>
                        <Upload size={16} className="text-muted shrink-0" />
                        <span className="truncate">
                          {imageFiles[field.key] ? imageFiles[field.key]!.name : "Or upload an image file…"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            setImageFiles({ ...imageFiles, [field.key]: e.target.files?.[0] ?? null })
                          }
                        />
                      </label>
                      {imageFiles[field.key] && (
                        <p className="text-muted text-xs mt-1">
                          Uploaded to the repo and set as the URL above when you save.
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="px-4 py-2.5 border border-border text-muted hover:text-foreground rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={startNew}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              New Entry
            </button>
            {orderDirty && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Order changed</span>
                <button
                  onClick={() => void handleSaveOrder()}
                  disabled={saving}
                  className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save order"}
                </button>
                <button
                  onClick={discardOrder}
                  disabled={saving}
                  className="px-3 py-1.5 border border-border text-muted hover:text-foreground rounded-lg text-xs transition-colors"
                >
                  Discard
                </button>
              </div>
            )}
          </div>

          {loading && <p className="text-muted text-sm">Loading…</p>}

          {!loading && entries && entries.length === 0 && (
            <p className="text-muted text-sm">No entries yet.</p>
          )}

          {!loading && entries && entries.length > 0 && (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="text-left font-medium text-muted px-4 py-3">
                      {config.fields.find((f) => f.key === config.titleField)?.label ?? "Title"}
                    </th>
                    <th className="text-right font-medium text-muted px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const title = String(entry[config.titleField] ?? "Untitled");
                    return (
                      <tr key={String(entry.id)} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-3 min-w-0">
                          <p className="text-foreground font-medium truncate">{title}</p>
                          {config.subtitleField && entry[config.subtitleField] != null && (
                            <p className="text-muted text-xs">
                              {config.subtitleFormat
                                ? config.subtitleFormat(entry[config.subtitleField])
                                : String(entry[config.subtitleField])}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => moveEntry(index, -1)}
                              disabled={index === 0}
                              aria-label={`Move ${title} up`}
                              className="p-2 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              onClick={() => moveEntry(index, 1)}
                              disabled={index === entries.length - 1}
                              aria-label={`Move ${title} down`}
                              className="p-2 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              onClick={() => startEdit(index)}
                              aria-label={`Edit ${title}`}
                              className="p-2 text-muted hover:text-foreground transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => void handleDelete(index)}
                              aria-label={`Delete ${title}`}
                              className="p-2 text-muted hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
