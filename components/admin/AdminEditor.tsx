"use client";

import { useEffect, useState } from "react";
import { fetchContentFile, updateContentFile, GitHubApiError } from "@/lib/github";
import { Pencil, Trash2, Plus, LogOut, ExternalLink, X } from "lucide-react";
import profileData from "@/content/profile.json";

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
  { path: string; arrayKey: string; label: string; hasClient: boolean }
> = {
  blog: { path: "content/blogs.json", arrayKey: "posts", label: "Blog Posts", hasClient: false },
  "case-study": {
    path: "content/case-studies.json",
    arrayKey: "caseStudies",
    label: "Case Studies",
    hasClient: true,
  },
};

const PASSWORD_OK_KEY = "admin_pw_ok";
const TOKEN_KEY = "gh_pat";

const inputClass =
  "w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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

export default function AdminEditor() {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [kind, setKind] = useState<ContentKind>("blog");
  const [entries, setEntries] = useState<Record<ContentKind, Entry[] | null>>({
    blog: null,
    "case-study": null,
  });
  const [fileSha, setFileSha] = useState<Record<ContentKind, string | null>>({
    blog: null,
    "case-study": null,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<Entry | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(PASSWORD_OK_KEY) === "1") setUnlocked(true);
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) setToken(savedToken);
  }, []);

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) return;
    localStorage.setItem(TOKEN_KEY, trimmed);
    setToken(trimmed);
    setTokenInput("");
    setError(null);
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === profileData.password) {
      sessionStorage.setItem(PASSWORD_OK_KEY, "1");
      setUnlocked(true);
      setPasswordError(null);
      setPasswordInput("");
    } else {
      setPasswordError("Incorrect password.");
    }
  }

  useEffect(() => {
    if (token && entries[kind] === null) {
      void loadKind(kind, token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, kind]);

  async function loadKind(k: ContentKind, tok: string) {
    setLoading(true);
    setError(null);
    try {
      const { content, sha } = await fetchContentFile(CONFIG[k].path, tok);
      const parsed = JSON.parse(content);
      setEntries((prev) => ({ ...prev, [k]: parsed[CONFIG[k].arrayKey] ?? [] }));
      setFileSha((prev) => ({ ...prev, [k]: sha }));
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  function handleApiError(err: unknown) {
    if (err instanceof GitHubApiError && (err.status === 401 || err.status === 403)) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setError("Token rejected. It may be invalid, expired, or missing repo access — please paste a new one.");
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Something went wrong.");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(PASSWORD_OK_KEY);
    setUnlocked(false);
    setEntries({ blog: null, "case-study": null });
    setFileSha({ blog: null, "case-study": null });
    setEditing(null);
  }

  function startNew() {
    setEditing(blankEntry());
    setTagsText("");
    setIsNew(true);
    setSuccessMsg(null);
    setError(null);
  }

  function startEdit(entry: Entry) {
    setEditing({ ...entry });
    setTagsText(entry.tags.join(", "));
    setIsNew(false);
    setSuccessMsg(null);
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function persist(newEntries: Entry[], message: string) {
    if (!token) return;
    const sha = fileSha[kind];
    if (!sha) {
      setError("Missing file version — reload the list before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { [CONFIG[kind].arrayKey]: newEntries };
      const content = JSON.stringify(payload, null, 2) + "\n";
      await updateContentFile(CONFIG[kind].path, content, sha, message, token);
      setEntries((prev) => ({ ...prev, [kind]: newEntries }));
      setEditing(null);
      setSuccessMsg(
        "Saved and committed. The site will redeploy automatically — check the Actions tab in a minute or two."
      );
      await loadKind(kind, token); // refresh sha for subsequent edits
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.slug.trim()) {
      setError("Title and slug are required.");
      return;
    }

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const current = entries[kind] ?? [];
    const slugTaken = current.some(
      (e) => e.slug === editing.slug.trim() && e.id !== editing.id
    );
    if (slugTaken) {
      setError("That slug is already used by another entry.");
      return;
    }

    if (isNew) {
      const newEntry: Entry = {
        ...editing,
        id: Date.now().toString(36),
        slug: editing.slug.trim(),
        tags,
      };
      void persist([...current, newEntry], `content: add ${editing.title}`);
    } else {
      const updated = current.map((e) =>
        e.id === editing.id ? { ...editing, slug: editing.slug.trim(), tags } : e
      );
      void persist(updated, `content: update ${editing.title}`);
    }
  }

  function handleDelete(entry: Entry) {
    if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    const current = entries[kind] ?? [];
    void persist(
      current.filter((e) => e.id !== entry.id),
      `content: delete ${entry.title}`
    );
  }

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Content Editor</h1>
        <p className="text-muted text-sm mb-6">Enter the admin password to continue.</p>
        {passwordError && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {passwordError}
          </div>
        )}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Password"
            className={inputClass}
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Content Editor</h1>
        <p className="text-muted text-sm mb-6">Paste Token</p>
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleTokenSubmit} className="space-y-4">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="github_pat_..."
            className={inputClass}
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  const currentEntries = entries[kind];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Content Editor</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border">
        {(Object.keys(CONFIG) as ContentKind[]).map((k) => (
          <button
            key={k}
            onClick={() => {
              setKind(k);
              setEditing(null);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              kind === k
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {CONFIG[k].label}
          </button>
        ))}
      </div>

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

          {!loading && currentEntries && currentEntries.length === 0 && (
            <p className="text-muted text-sm">No entries yet.</p>
          )}

          {!loading && currentEntries && currentEntries.length > 0 && (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="text-left font-medium text-muted px-4 py-3">Title</th>
                    <th className="text-right font-medium text-muted px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEntries.map((entry) => (
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
