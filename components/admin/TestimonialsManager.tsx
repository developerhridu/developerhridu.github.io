"use client";

import { useState } from "react";
import { type FileChange } from "@/lib/github";
import { Plus, X, Upload, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { inputClass, slugify, fileToBase64, confirmDeleteMessage } from "@/components/admin/shared";
import { useContentCrud } from "@/components/admin/useContentCrud";
import { ErrorBanner, SuccessBanner } from "@/components/admin/CrudBanners";
import { ReorderControls } from "@/components/admin/ReorderControls";
import { RowActions } from "@/components/admin/RowActions";

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

function referencedImagePaths(list: Entry[]): Set<string> {
  return new Set(
    list.flatMap((e) => [e.avatar, ...(e.verifyImages ?? [])].filter(Boolean) as string[])
  );
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

export default function TestimonialsManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const {
    entries,
    loading,
    saving,
    setSaving,
    error,
    setError,
    successMsg,
    orderDirty,
    moveEntry,
    commit,
    saveOrder,
    discardOrder,
    clearMessages,
    reportError,
  } = useContentCrud<Entry>({
    path: PATH,
    arrayKey: ARRAY_KEY,
    label: "testimonials",
    token,
    onAuthError,
    normalizeLoaded,
  });

  const [editing, setEditing] = useState<Entry | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [verifyImageFiles, setVerifyImageFiles] = useState<(File | null)[]>([]);

  function startNew() {
    setEditing(blankEntry());
    setIsNew(true);
    setAvatarFile(null);
    setVerifyImageFiles([]);
    clearMessages();
  }

  function startEdit(entry: Entry) {
    const verifyImages = entry.verifyImages ?? [];
    setEditing({ ...entry, verifyImages });
    setIsNew(false);
    setAvatarFile(null);
    setVerifyImageFiles(verifyImages.map(() => null));
    clearMessages();
  }

  function cancelEdit() {
    setEditing(null);
    setAvatarFile(null);
    setVerifyImageFiles([]);
  }

  function addVerifyImage() {
    if (!editing) return;
    setEditing({ ...editing, verifyImages: [...editing.verifyImages, ""] });
    setVerifyImageFiles((prev) => [...prev, null]);
  }

  function updateVerifyImageUrl(index: number, value: string) {
    if (!editing) return;
    setEditing({
      ...editing,
      verifyImages: editing.verifyImages.map((v, i) => (i === index ? value : v)),
    });
  }

  function removeVerifyImage(index: number) {
    if (!editing) return;
    setEditing({ ...editing, verifyImages: editing.verifyImages.filter((_, i) => i !== index) });
    setVerifyImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function moveVerifyImage(index: number, direction: -1 | 1) {
    if (!editing) return;
    const target = index + direction;
    if (target < 0 || target >= editing.verifyImages.length) return;
    const next = [...editing.verifyImages];
    [next[index], next[target]] = [next[target], next[index]];
    setEditing({ ...editing, verifyImages: next });
    setVerifyImageFiles((prev) => {
      const nextFiles = [...prev];
      [nextFiles[index], nextFiles[target]] = [nextFiles[target], nextFiles[index]];
      return nextFiles;
    });
  }

  function setVerifyImageFile(index: number, file: File | null) {
    setVerifyImageFiles((prev) => prev.map((f, i) => (i === index ? file : f)));
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.name.trim() || !editing.quote.trim()) {
      setError("Name and quote are required.");
      return;
    }

    const current = entries ?? [];
    const previousEntry = !isNew ? current.find((e) => e.id === editing.id) : undefined;
    const oldManagedPaths = [previousEntry?.avatar, ...(previousEntry?.verifyImages ?? [])].filter(
      (p): p is string => isManagedImage(p)
    );

    setSaving(true);
    setError(null);

    const slug = slugify(editing.name);
    const changes: FileChange[] = [];
    let avatar = editing.avatar;
    let verifyImages: string[];

    try {
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "png";
        const repoPath = `public/images/${IMAGE_FOLDER}/${slug}.${ext}`;
        const base64 = await fileToBase64(avatarFile);
        changes.push({ path: repoPath, content: base64 });
        avatar = `/images/${IMAGE_FOLDER}/${slug}.${ext}`;
      }

      const uploaded: string[] = [];
      for (let i = 0; i < editing.verifyImages.length; i++) {
        let url = editing.verifyImages[i];
        const file = verifyImageFiles[i];
        if (file) {
          const ext = file.name.split(".").pop()?.toLowerCase() || "png";
          const repoPath = `public/images/${IMAGE_FOLDER}/${slug}-verify-${i}.${ext}`;
          const base64 = await fileToBase64(file);
          changes.push({ path: repoPath, content: base64 });
          url = `/images/${IMAGE_FOLDER}/${slug}-verify-${i}.${ext}`;
        }
        uploaded.push(url);
      }
      verifyImages = uploaded.filter((v) => v.trim());
    } catch (err) {
      reportError(err);
      setSaving(false);
      return;
    }

    const finalEntry: Entry = { ...editing, avatar, verifyImages };
    let updated: Entry[];

    if (isNew) {
      const newId = makeId(editing.name, current.map((e) => e.id));
      updated = [...current, { ...finalEntry, id: newId }];
    } else {
      updated = current.map((e) => (e.id === editing.id ? finalEntry : e));
    }

    const stillReferenced = referencedImagePaths(updated);
    for (const oldPath of oldManagedPaths) {
      if (!stillReferenced.has(oldPath)) changes.push({ path: toRepoPath(oldPath), content: null });
    }

    const message = isNew ? `content: add ${editing.name}` : `content: update ${editing.name}`;
    const success = await commit(changes, updated, message);
    if (success) setEditing(null);
    setAvatarFile(null);
    setVerifyImageFiles(verifyImages.map(() => null));
  }

  async function handleDelete(entry: Entry) {
    if (!confirm(confirmDeleteMessage(entry.name))) return;
    const current = entries ?? [];
    const updated = current.filter((e) => e.id !== entry.id);

    const oldPaths = [entry.avatar, ...(entry.verifyImages ?? [])].filter(
      (p): p is string => isManagedImage(p)
    );
    const stillReferenced = referencedImagePaths(updated);
    const changes: FileChange[] = oldPaths
      .filter((p) => !stillReferenced.has(p))
      .map((p) => ({ path: toRepoPath(p), content: null }));

    await commit(changes, updated, `content: delete ${entry.name}`);
  }

  return (
    <div>
      <ErrorBanner message={error} />
      <SuccessBanner message={successMsg} />

      {editing ? (
        <EntryForm
          entry={editing}
          setEntry={setEditing}
          saving={saving}
          avatarFile={avatarFile}
          setAvatarFile={setAvatarFile}
          verifyImageFiles={verifyImageFiles}
          onAddVerifyImage={addVerifyImage}
          onUpdateVerifyImageUrl={updateVerifyImageUrl}
          onRemoveVerifyImage={removeVerifyImage}
          onMoveVerifyImage={moveVerifyImage}
          onVerifyImageFileChange={setVerifyImageFile}
          onCancel={cancelEdit}
          onSave={() => void handleSave()}
        />
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
              <ReorderControls saving={saving} onSave={() => void saveOrder()} onDiscard={discardOrder} />
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
                    <th className="text-left font-medium text-muted px-4 py-3">Name</th>
                    <th className="text-right font-medium text-muted px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={entry.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 min-w-0">
                        <p className="text-foreground font-medium truncate flex items-center gap-2">
                          {entry.name}
                          {!entry.published && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                              Draft
                            </span>
                          )}
                        </p>
                        <p className="text-muted text-xs">
                          {[entry.role, entry.company].filter(Boolean).join(" · ") || "—"} ·{" "}
                          {entry.verifyImages.length}{" "}
                          {entry.verifyImages.length === 1 ? "verify image" : "verify images"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <RowActions
                          label={entry.name}
                          canMoveUp={index !== 0}
                          canMoveDown={index !== entries.length - 1}
                          onMoveUp={() => moveEntry(index, -1)}
                          onMoveDown={() => moveEntry(index, 1)}
                          onEdit={() => startEdit(entry)}
                          onDelete={() => void handleDelete(entry)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EntryForm({
  entry,
  setEntry,
  saving,
  avatarFile,
  setAvatarFile,
  verifyImageFiles,
  onAddVerifyImage,
  onUpdateVerifyImageUrl,
  onRemoveVerifyImage,
  onMoveVerifyImage,
  onVerifyImageFileChange,
  onCancel,
  onSave,
}: {
  entry: Entry;
  setEntry: (e: Entry) => void;
  saving: boolean;
  avatarFile: File | null;
  setAvatarFile: (f: File | null) => void;
  verifyImageFiles: (File | null)[];
  onAddVerifyImage: () => void;
  onUpdateVerifyImageUrl: (index: number, value: string) => void;
  onRemoveVerifyImage: (index: number) => void;
  onMoveVerifyImage: (index: number, direction: -1 | 1) => void;
  onVerifyImageFileChange: (index: number, file: File | null) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {entry.id ? "Edit entry" : "New entry"}
        </h2>
        <button onClick={onCancel} aria-label="Close" className="text-muted hover:text-foreground">
          <X size={18} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Name</label>
          <input
            value={entry.name}
            onChange={(e) => setEntry({ ...entry, name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Role</label>
          <input
            value={entry.role ?? ""}
            onChange={(e) => setEntry({ ...entry, role: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Company</label>
          <input
            value={entry.company ?? ""}
            onChange={(e) => setEntry({ ...entry, company: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Email</label>
          <input
            value={entry.email ?? ""}
            onChange={(e) => setEntry({ ...entry, email: e.target.value })}
            placeholder="name@example.com"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">LinkedIn URL</label>
        <input
          value={entry.linkedinUrl ?? ""}
          onChange={(e) => setEntry({ ...entry, linkedinUrl: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">Quote</label>
        <textarea
          value={entry.quote}
          onChange={(e) => setEntry({ ...entry, quote: e.target.value })}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={entry.published}
          onChange={(e) => setEntry({ ...entry, published: e.target.checked })}
          className="w-4 h-4 accent-accent"
        />
        <span className="text-sm text-foreground">
          Published{" "}
          <span className="text-muted">
            (visible on the Testimonials section &amp; page — unchecked stays a draft)
          </span>
        </span>
      </label>

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">Avatar</label>
        <input
          value={entry.avatar ?? ""}
          onChange={(e) => setEntry({ ...entry, avatar: e.target.value })}
          placeholder="https://... or /images/testimonials/example.png"
          className={inputClass}
        />
        <label className={`${inputClass} mt-2 flex items-center gap-2 cursor-pointer`}>
          <Upload size={16} className="text-muted shrink-0" />
          <span className="truncate">{avatarFile ? avatarFile.name : "Or upload an image file…"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs uppercase tracking-wide text-muted">
            Verification Photos
          </label>
          <button
            onClick={onAddVerifyImage}
            type="button"
            className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
          >
            <Plus size={14} /> Add Image
          </button>
        </div>
        <div className="space-y-3">
          {entry.verifyImages.map((image, i) => (
            <div key={i} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Image {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onMoveVerifyImage(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move image ${i + 1} up`}
                    className="p-1.5 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => onMoveVerifyImage(i, 1)}
                    disabled={i === entry.verifyImages.length - 1}
                    aria-label={`Move image ${i + 1} down`}
                    className="p-1.5 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => onRemoveVerifyImage(i)}
                    aria-label={`Remove image ${i + 1}`}
                    className="p-1.5 text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-muted mb-1">
                  Image URL
                </label>
                <input
                  value={image}
                  onChange={(e) => onUpdateVerifyImageUrl(i, e.target.value)}
                  placeholder="/images/testimonials/example-verify-0.png"
                  className={inputClass}
                />
                <label className={`${inputClass} mt-2 flex items-center gap-2 cursor-pointer`}>
                  <Upload size={16} className="text-muted shrink-0" />
                  <span className="truncate">
                    {verifyImageFiles[i] ? verifyImageFiles[i]!.name : "Or upload an image file…"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onVerifyImageFileChange(i, e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          ))}
          {entry.verifyImages.length === 0 && (
            <p className="text-muted text-xs">No verification photos yet.</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2.5 border border-border text-muted hover:text-foreground rounded-lg text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
