"use client";

import { useState } from "react";
import TestimonialRequestLinks from "@/components/admin/TestimonialRequestLinks";
import { type FileChange } from "@/lib/github";
import { slugify, fileToBase64, confirmDeleteMessage } from "@/components/admin/shared";
import { useContentCrud } from "@/components/admin/useContentCrud";
import { ErrorBanner, SuccessBanner } from "@/components/admin/CrudBanners";
import EntryList from "@/components/admin/EntryList";
import ImageListInput, { SingleImageInput } from "@/components/admin/ImageListInput";
import { CheckboxField, EditorPanel, Field, FormActions, FormSection, fieldClass } from "@/components/admin/FormKit";
import { confirmDiscardEdits, snapshot, useSaveShortcut, useUnsavedGuard } from "@/components/admin/useUnsavedGuard";
import { collectErrors, emailError, errorSummary, focusFirstError, requiredError, urlError, type FieldErrors } from "@/components/admin/validation";

interface Entry {
  id: string;
  name: string;
  role?: string;
  company?: string;
  avatar?: string;
  quote: string;
  email?: string;
  linkedinUrl?: string;
  verifyImages: string[];
  published: boolean;
}

const PATH = "content/testimonials.json";
const ARRAY_KEY = "testimonials";
const IMAGE_FOLDER = "testimonials";

function isManagedImage(imagePath: string | undefined): imagePath is string {
  return !!imagePath && imagePath.startsWith(`/images/${IMAGE_FOLDER}/`);
}

function toRepoPath(publicPath: string): string {
  return `public${publicPath}`;
}

function entryImages(entry: Entry): string[] {
  return [entry.avatar, ...(entry.verifyImages ?? [])].filter((p): p is string => !!p);
}

function blankEntry(): Entry {
  return {
    id: "",
    name: "",
    role: "",
    company: "",
    avatar: "",
    quote: "",
    email: "",
    linkedinUrl: "",
    verifyImages: [],
    published: false,
  };
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

function normalizeLoaded(list: Entry[]): Entry[] {
  return list.map((e) => ({
    ...e,
    verifyImages: e.verifyImages ?? [],
    published: e.published ?? true,
  }));
}

function validate(entry: Entry): FieldErrors {
  return collectErrors([
    ["name", requiredError(entry.name, "Name")],
    ["quote", requiredError(entry.quote, "Quote")],
    ["email", emailError(entry.email)],
    ["linkedinUrl", urlError(entry.linkedinUrl, { allowRelative: false })],
    ["avatar", urlError(entry.avatar)],
  ]);
}

export default function TestimonialsManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const crud = useContentCrud<Entry>({ path: PATH, arrayKey: ARRAY_KEY, label: "testimonials", token, onAuthError, normalizeLoaded });
  const { entries, saving, setSaving, setError, commit, reportError, clearMessages } = crud;

  const [editing, setEditing] = useState<Entry | null>(null);
  const [opened, setOpened] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [verifyFiles, setVerifyFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const dirty = !!editing && (snapshot(editing) !== opened || !!avatarFile || verifyFiles.length > 0);
  useUnsavedGuard(dirty);

  function open(entry: Entry, asNew: boolean) {
    setEditing(entry);
    setOpened(snapshot(entry));
    setIsNew(asNew);
    setAvatarFile(null);
    setVerifyFiles([]);
    setFieldErrors({});
    clearMessages();
  }

  function startNew() {
    if (confirmDiscardEdits(dirty)) open(blankEntry(), true);
  }

  function startEdit(entry: Entry) {
    if (confirmDiscardEdits(dirty)) open({ ...entry, verifyImages: entry.verifyImages ?? [] }, false);
  }

  function cancelEdit() {
    if (!confirmDiscardEdits(dirty)) return;
    setEditing(null);
    setAvatarFile(null);
    setVerifyFiles([]);
    setFieldErrors({});
  }

  function update(patch: Partial<Entry>) {
    setEditing((previous) => (previous ? { ...previous, ...patch } : previous));
    const keys = Object.keys(patch);
    if (keys.some((key) => fieldErrors[key])) {
      setFieldErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !keys.includes(key))));
    }
  }

  async function handleSave() {
    if (!editing || saving) return;
    const errors = validate(editing);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(errorSummary(errors));
      focusFirstError();
      return;
    }
    setFieldErrors({});

    const current = entries ?? [];
    const previousEntry = !isNew ? current.find((e) => e.id === editing.id) : undefined;
    const oldManagedPaths = previousEntry ? entryImages(previousEntry).filter(isManagedImage) : [];

    setSaving(true);
    setError(null);

    const slug = slugify(editing.name);
    const changes: FileChange[] = [];
    let avatar = editing.avatar;
    const verifyImages = [...editing.verifyImages];

    try {
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "png";
        avatar = `/images/${IMAGE_FOLDER}/${slug}.${ext}`;
        changes.push({ path: toRepoPath(avatar), content: await fileToBase64(avatarFile) });
      }
      for (const file of verifyFiles) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
        const publicPath = `/images/${IMAGE_FOLDER}/${slug}-verify-${crypto.randomUUID()}.${ext}`;
        changes.push({ path: toRepoPath(publicPath), content: await fileToBase64(file) });
        verifyImages.push(publicPath);
      }
    } catch (err) {
      reportError(err);
      setSaving(false);
      return;
    }

    const finalEntry: Entry = { ...editing, avatar, verifyImages };
    const updated = isNew
      ? [...current, { ...finalEntry, id: makeId(editing.name, current.map((e) => e.id)) }]
      : current.map((e) => (e.id === editing.id ? finalEntry : e));

    const stillReferenced = new Set(updated.flatMap(entryImages));
    for (const oldPath of oldManagedPaths) {
      if (!stillReferenced.has(oldPath)) changes.push({ path: toRepoPath(oldPath), content: null });
    }

    const message = isNew ? `content: add ${editing.name}` : `content: update ${editing.name}`;
    if (await commit(changes, updated, message)) {
      setEditing(null);
      setAvatarFile(null);
      setVerifyFiles([]);
    }
  }

  useSaveShortcut(() => void handleSave(), !!editing && !saving);

  async function handleDelete(entry: Entry) {
    if (!confirm(confirmDeleteMessage(entry.name))) return;
    const updated = (entries ?? []).filter((e) => e.id !== entry.id);
    const stillReferenced = new Set(updated.flatMap(entryImages));
    const changes: FileChange[] = entryImages(entry)
      .filter((p) => isManagedImage(p) && !stillReferenced.has(p))
      .map((p) => ({ path: toRepoPath(p), content: null }));
    await commit(changes, updated, `content: delete ${entry.name}`);
  }

  return (
    <div>
      <ErrorBanner message={crud.error} onReload={() => void crud.reload()} />
      <SuccessBanner message={crud.successMsg} />

      {editing ? (
        <EditorPanel title={isNew ? "New testimonial" : `Edit: ${editing.name || "testimonial"}`} dirty={dirty} onClose={cancelEdit}>
          <FormSection title="Person">
            <Field label="Name" htmlFor="t-name" required error={fieldErrors.name}>
              <input id="t-name" value={editing.name} onChange={(e) => update({ name: e.target.value })} className={fieldClass(fieldErrors.name)} />
            </Field>
            <Field label="Role" htmlFor="t-role">
              <input id="t-role" value={editing.role ?? ""} onChange={(e) => update({ role: e.target.value })} className={fieldClass()} />
            </Field>
            <Field label="Company" htmlFor="t-company">
              <input id="t-company" value={editing.company ?? ""} onChange={(e) => update({ company: e.target.value })} className={fieldClass()} />
            </Field>
            <Field label="Email" htmlFor="t-email" error={fieldErrors.email} hint="Never shown on the site.">
              <input id="t-email" type="email" value={editing.email ?? ""} onChange={(e) => update({ email: e.target.value })} placeholder="name@example.com" className={fieldClass(fieldErrors.email)} />
            </Field>
            <Field label="LinkedIn URL" htmlFor="t-linkedin" full error={fieldErrors.linkedinUrl}>
              <input id="t-linkedin" type="url" value={editing.linkedinUrl ?? ""} onChange={(e) => update({ linkedinUrl: e.target.value })} placeholder="https://www.linkedin.com/in/…" className={fieldClass(fieldErrors.linkedinUrl)} />
            </Field>
            <Field label="Avatar" htmlFor="t-avatar" full error={fieldErrors.avatar}>
              <SingleImageInput
                id="t-avatar"
                value={editing.avatar ?? ""}
                file={avatarFile}
                placeholder="https://… or /images/testimonials/example.png"
                invalid={!!fieldErrors.avatar}
                onChange={(avatar) => update({ avatar })}
                onFileChange={setAvatarFile}
              />
            </Field>
          </FormSection>

          <FormSection title="Testimonial" columns={1}>
            <Field label="Quote" htmlFor="t-quote" required error={fieldErrors.quote}>
              <textarea id="t-quote" value={editing.quote} onChange={(e) => update({ quote: e.target.value })} rows={4} className={fieldClass(fieldErrors.quote, "resize-y")} />
            </Field>
            <CheckboxField
              checked={editing.published}
              onChange={(published) => update({ published })}
              label="Published"
              hint="visible on the Testimonials section & page — unchecked stays a draft"
            />
            <Field label="Verification photos" hint="Screenshots proving the testimonial is genuine (e.g. a LinkedIn recommendation).">
              <ImageListInput
                images={editing.verifyImages}
                pending={verifyFiles}
                placeholder="/images/testimonials/example-verify.png"
                onChange={(verifyImages) => update({ verifyImages })}
                onPendingChange={setVerifyFiles}
              />
            </Field>
          </FormSection>

          <FormActions
            saving={saving}
            dirty={dirty}
            onSave={() => void handleSave()}
            onCancel={cancelEdit}
          />
        </EditorPanel>
      ) : (
        <>
          <TestimonialRequestLinks />
          <EntryList<Entry>
            items={entries}
            loading={crud.loading}
            getKey={(entry) => entry.id}
            getTitle={(entry) => entry.name}
            getSubtitle={(entry) =>
              `${[entry.role, entry.company].filter(Boolean).join(" · ") || "—"} · ${entry.verifyImages.length} ${
                entry.verifyImages.length === 1 ? "verify image" : "verify images"
              }`
            }
            getThumbnail={(entry) => entry.avatar}
            isDraft={(entry) => !entry.published}
            getSearchText={(entry) => entry.quote}
            getViewUrl={() => "/testimonials"}
            onMove={crud.moveEntry}
            onEdit={startEdit}
            onDelete={(entry) => void handleDelete(entry)}
            onNew={startNew}
            orderDirty={crud.orderDirty}
            saving={saving}
            onSaveOrder={() => void crud.saveOrder()}
            onDiscardOrder={crud.discardOrder}
            titleHeading="Name"
          />
        </>
      )}
    </div>
  );
}
