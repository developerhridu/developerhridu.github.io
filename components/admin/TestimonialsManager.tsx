"use client";

import { useEffect, useState } from "react";
import {
  fetchContentFile,
  updateContentFile,
  uploadBinaryFile,
  deleteBinaryFile,
  GitHubApiError,
} from "@/lib/github";
import {
  Pencil,
  Trash2,
  Plus,
  ExternalLink,
  X,
  Upload,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { inputClass, slugify, fileToBase64 } from "@/components/admin/shared";

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

export default function TestimonialsManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadedOrderIds, setLoadedOrderIds] = useState<string[]>([]);

  const [editing, setEditing] = useState<Entry | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [verifyImageFiles, setVerifyImageFiles] = useState<(File | null)[]>([]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { content, sha } = await fetchContentFile(PATH, token);
      const parsed = JSON.parse(content);
      const loaded: Entry[] = (parsed[ARRAY_KEY] ?? []).map((e: Entry) => ({
        ...e,
        verifyImages: e.verifyImages ?? [],
      }));
      setEntries(loaded);
      setLoadedOrderIds(loaded.map((e) => e.id));
      setFileSha(sha);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  const orderDirty =
    entries !== null && entries.map((e) => e.id).join("|") !== loadedOrderIds.join("|");

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
    setEditing(blankEntry());
    setIsNew(true);
    setAvatarFile(null);
    setVerifyImageFiles([]);
    setSuccessMsg(null);
    setError(null);
  }

  function startEdit(entry: Entry) {
    const verifyImages = entry.verifyImages ?? [];
    setEditing({ ...entry, verifyImages });
    setIsNew(false);
    setAvatarFile(null);
    setVerifyImageFiles(verifyImages.map(() => null));
    setSuccessMsg(null);
    setError(null);
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

  async function persist(newEntries: Entry[], message: string): Promise<boolean> {
    if (!fileSha) {
      setError("Missing file version — reload the list before saving.");
      return false;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { [ARRAY_KEY]: newEntries };
      const content = JSON.stringify(payload, null, 2) + "\n";
      await updateContentFile(PATH, content, fileSha, message, token);
      setEntries(newEntries);
      setEditing(null);
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

  async function cleanupOrphanedImages(oldPaths: string[], stillAlive: Entry[], label: string) {
    for (const oldPath of oldPaths) {
      if (!isManagedImage(oldPath)) continue;
      const stillReferenced = stillAlive.some(
        (e) => e.avatar === oldPath || (e.verifyImages ?? []).includes(oldPath)
      );
      if (stillReferenced) continue;
      try {
        await deleteBinaryFile(toRepoPath(oldPath), `content: remove orphaned image for ${label}`, token);
      } catch {
        // Best-effort cleanup — the content change already succeeded either way.
      }
    }
  }

  async function handleSaveOrder() {
    if (!entries) return;
    await persist(entries, "content: reorder testimonials");
  }

  function discardOrder() {
    void load();
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
    let avatar = editing.avatar;
    let verifyImages: string[];

    try {
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "png";
        const repoPath = `public/images/${IMAGE_FOLDER}/${slug}.${ext}`;
        const base64 = await fileToBase64(avatarFile);
        await uploadBinaryFile(repoPath, base64, `content: upload avatar for ${editing.name}`, token);
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
          await uploadBinaryFile(repoPath, base64, `content: upload verification image for ${editing.name}`, token);
          url = `/images/${IMAGE_FOLDER}/${slug}-verify-${i}.${ext}`;
        }
        uploaded.push(url);
      }
      verifyImages = uploaded.filter((v) => v.trim());
    } catch (err) {
      handleApiError(err);
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

    const message = isNew ? `content: add ${editing.name}` : `content: update ${editing.name}`;
    const ok = await persist(updated, message);
    setAvatarFile(null);
    setVerifyImageFiles(verifyImages.map(() => null));

    if (ok && oldManagedPaths.length > 0) {
      await cleanupOrphanedImages(oldManagedPaths, updated, editing.name);
    }
  }

  async function handleDelete(entry: Entry) {
    if (!confirm(`Delete "${entry.name}"? This cannot be undone.`)) return;
    const current = entries ?? [];
    const updated = current.filter((e) => e.id !== entry.id);
    const ok = await persist(updated, `content: delete ${entry.name}`);
    if (ok) {
      const oldPaths = [entry.avatar, ...(entry.verifyImages ?? [])].filter(
        (p): p is string => isManagedImage(p)
      );
      await cleanupOrphanedImages(oldPaths, updated, entry.name);
    }
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
                    <th className="text-left font-medium text-muted px-4 py-3">Name</th>
                    <th className="text-right font-medium text-muted px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={entry.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 min-w-0">
                        <p className="text-foreground font-medium truncate">{entry.name}</p>
                        <p className="text-muted text-xs">
                          {[entry.role, entry.company].filter(Boolean).join(" · ") || "—"} ·{" "}
                          {entry.verifyImages.length}{" "}
                          {entry.verifyImages.length === 1 ? "verify image" : "verify images"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => moveEntry(index, -1)}
                            disabled={index === 0}
                            aria-label={`Move ${entry.name} up`}
                            className="p-2 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            onClick={() => moveEntry(index, 1)}
                            disabled={index === entries.length - 1}
                            aria-label={`Move ${entry.name} down`}
                            className="p-2 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            onClick={() => startEdit(entry)}
                            aria-label={`Edit ${entry.name}`}
                            className="p-2 text-muted hover:text-foreground transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => void handleDelete(entry)}
                            aria-label={`Delete ${entry.name}`}
                            className="p-2 text-muted hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
