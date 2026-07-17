"use client";

import { useEffect, useState } from "react";
import { fetchContentFile, updateContentFile, uploadBinaryFile, GitHubApiError } from "@/lib/github";
import { Pencil, Trash2, Plus, ExternalLink, X, Upload } from "lucide-react";
import { inputClass, slugify, fileToBase64 } from "@/components/admin/shared";

interface Entry {
  id: string;
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  image?: string;
  client?: string;
  body: string;
}

type ContentKind = "blog" | "case-study";

const CONFIG: Record<
  ContentKind,
  { path: string; arrayKey: string; label: string; hasClient: boolean; imageFolder: string }
> = {
  blog: {
    path: "content/blogs.json",
    arrayKey: "posts",
    label: "Blog Posts",
    hasClient: false,
    imageFolder: "blog",
  },
  "case-study": {
    path: "content/case-studies.json",
    arrayKey: "caseStudies",
    label: "Case Studies",
    hasClient: true,
    imageFolder: "case-studies",
  },
};

function blankEntry(): Entry {
  return {
    id: "",
    slug: "",
    title: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    tags: [],
    image: "",
    client: "",
    body: "",
  };
}

interface BlogCaseStudyManagerProps {
  kind: ContentKind;
  token: string;
  onAuthError: () => void;
}

export default function BlogCaseStudyManager({ kind, token, onAuthError }: BlogCaseStudyManagerProps) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<Entry | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    setEntries(null);
    setEditing(null);
    setError(null);
    setSuccessMsg(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { content, sha } = await fetchContentFile(CONFIG[kind].path, token);
      const parsed = JSON.parse(content);
      setEntries(parsed[CONFIG[kind].arrayKey] ?? []);
      setFileSha(sha);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
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
    setTagsText("");
    setIsNew(true);
    setImageFile(null);
    setSuccessMsg(null);
    setError(null);
  }

  function startEdit(entry: Entry) {
    setEditing({ ...entry });
    setTagsText(entry.tags.join(", "));
    setIsNew(false);
    setImageFile(null);
    setSuccessMsg(null);
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setImageFile(null);
  }

  async function persist(newEntries: Entry[], message: string) {
    if (!fileSha) {
      setError("Missing file version — reload the list before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { [CONFIG[kind].arrayKey]: newEntries };
      const content = JSON.stringify(payload, null, 2) + "\n";
      await updateContentFile(CONFIG[kind].path, content, fileSha, message, token);
      setEntries(newEntries);
      setEditing(null);
      setSuccessMsg(
        "Saved and committed. The site will redeploy automatically — check the Actions tab in a minute or two."
      );
      await load();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.slug.trim()) {
      setError("Title and slug are required.");
      return;
    }

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const slug = editing.slug.trim();
    const current = entries ?? [];
    const slugTaken = current.some((e) => e.slug === slug && e.id !== editing.id);
    if (slugTaken) {
      setError("That slug is already used by another entry.");
      return;
    }

    let image = editing.image;
    if (imageFile) {
      setSaving(true);
      setError(null);
      try {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() || "png";
        const repoPath = `public/images/${CONFIG[kind].imageFolder}/${slug}.${ext}`;
        const base64 = await fileToBase64(imageFile);
        await uploadBinaryFile(repoPath, base64, `content: upload image for ${editing.title}`, token);
        image = `/images/${CONFIG[kind].imageFolder}/${slug}.${ext}`;
      } catch (err) {
        handleApiError(err);
        setSaving(false);
        return;
      }
    }

    const finalEntry: Entry = { ...editing, slug, tags, image };

    if (isNew) {
      const newEntry: Entry = { ...finalEntry, id: Date.now().toString(36) };
      await persist([...current, newEntry], `content: add ${editing.title}`);
    } else {
      const updated = current.map((e) => (e.id === editing.id ? finalEntry : e));
      await persist(updated, `content: update ${editing.title}`);
    }
    setImageFile(null);
  }

  function handleDelete(entry: Entry) {
    if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    const current = entries ?? [];
    void persist(
      current.filter((e) => e.id !== entry.id),
      `content: delete ${entry.title}`
    );
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
          tagsText={tagsText}
          setTagsText={setTagsText}
          hasClient={CONFIG[kind].hasClient}
          saving={saving}
          imageFile={imageFile}
          setImageFile={setImageFile}
          onCancel={cancelEdit}
          onSave={handleSave}
          onTitleBlur={() => {
            if (isNew && editing && !editing.slug) {
              setEditing({ ...editing, slug: slugify(editing.title) });
            }
          }}
        />
      ) : (
        <>
          <button
            onClick={startNew}
            className="mb-4 flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New {kind === "blog" ? "Post" : "Case Study"}
          </button>

          {loading && <p className="text-muted text-sm">Loading…</p>}

          {!loading && entries && entries.length === 0 && (
            <p className="text-muted text-sm">No entries yet.</p>
          )}

          {!loading && entries && entries.length > 0 && (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="text-left font-medium text-muted px-4 py-3">Title</th>
                    <th className="text-right font-medium text-muted px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 min-w-0">
                        <p className="text-foreground font-medium truncate">{entry.title}</p>
                        <p className="text-muted text-xs">
                          {entry.date} · /{entry.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(entry)}
                            aria-label={`Edit ${entry.title}`}
                            className="p-2 text-muted hover:text-foreground transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(entry)}
                            aria-label={`Delete ${entry.title}`}
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
  tagsText,
  setTagsText,
  hasClient,
  saving,
  imageFile,
  setImageFile,
  onCancel,
  onSave,
  onTitleBlur,
}: {
  entry: Entry;
  setEntry: (e: Entry) => void;
  tagsText: string;
  setTagsText: (t: string) => void;
  hasClient: boolean;
  saving: boolean;
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  onCancel: () => void;
  onSave: () => void;
  onTitleBlur: () => void;
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

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">Title</label>
        <input
          value={entry.title}
          onChange={(e) => setEntry({ ...entry, title: e.target.value })}
          onBlur={onTitleBlur}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">Slug</label>
        <input
          value={entry.slug}
          onChange={(e) => setEntry({ ...entry, slug: slugify(e.target.value) })}
          className={inputClass}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Date</label>
          <input
            type="date"
            value={entry.date}
            onChange={(e) => setEntry({ ...entry, date: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Image URL</label>
          <input
            value={entry.image ?? ""}
            onChange={(e) => setEntry({ ...entry, image: e.target.value })}
            placeholder="/images/blog/example.png"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">
          Or Upload Image
        </label>
        <label className={`${inputClass} flex items-center gap-2 cursor-pointer`}>
          <Upload size={16} className="text-muted shrink-0" />
          <span className="truncate">
            {imageFile ? imageFile.name : "Choose an image file…"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {imageFile && (
          <p className="text-muted text-xs mt-1">
            Uploaded to the repo and set as the Image URL when you save.
          </p>
        )}
      </div>

      {hasClient && (
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Client</label>
          <input
            value={entry.client ?? ""}
            onChange={(e) => setEntry({ ...entry, client: e.target.value })}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">Tags (comma separated)</label>
        <input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="next.js, react, tailwind"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">Description</label>
        <textarea
          value={entry.description}
          onChange={(e) => setEntry({ ...entry, description: e.target.value })}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">Body (Markdown)</label>
        <textarea
          value={entry.body}
          onChange={(e) => setEntry({ ...entry, body: e.target.value })}
          rows={16}
          className={`${inputClass} font-mono text-sm`}
        />
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
