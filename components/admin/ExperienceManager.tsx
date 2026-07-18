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

interface Project {
  name: string;
  description?: string;
  technologies: string[];
  highlights: string[];
}

interface Entry {
  id: string;
  company: string;
  logo?: string;
  role: string;
  period: string;
  location?: string;
  projects: Project[];
}

const PATH = "content/experience.json";
const ARRAY_KEY = "experiences";
const IMAGE_FOLDER = "experience";

function isManagedImage(imagePath: string | undefined): imagePath is string {
  return !!imagePath && imagePath.startsWith(`/images/${IMAGE_FOLDER}/`);
}

function toRepoPath(publicPath: string): string {
  return `public${publicPath}`;
}

function blankEntry(): Entry {
  return {
    id: "",
    company: "",
    logo: "",
    role: "",
    period: "",
    location: "",
    projects: [],
  };
}

function blankProject(): Project {
  return { name: "", description: "", technologies: [], highlights: [] };
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

export default function ExperienceManager({
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [projectTechText, setProjectTechText] = useState<string[]>([]);
  const [projectHighlightsText, setProjectHighlightsText] = useState<string[]>([]);

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
        projects: e.projects ?? [],
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
    setLogoFile(null);
    setProjectTechText([]);
    setProjectHighlightsText([]);
    setSuccessMsg(null);
    setError(null);
  }

  function startEdit(entry: Entry) {
    const projects = entry.projects ?? [];
    setEditing({ ...entry, projects });
    setIsNew(false);
    setLogoFile(null);
    setProjectTechText(projects.map((p) => p.technologies.join(", ")));
    setProjectHighlightsText(projects.map((p) => p.highlights.join("\n")));
    setSuccessMsg(null);
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setLogoFile(null);
    setProjectTechText([]);
    setProjectHighlightsText([]);
  }

  function addProject() {
    if (!editing) return;
    setEditing({ ...editing, projects: [...editing.projects, blankProject()] });
    setProjectTechText((prev) => [...prev, ""]);
    setProjectHighlightsText((prev) => [...prev, ""]);
  }

  function updateProject(index: number, patch: Partial<Project>) {
    if (!editing) return;
    setEditing({
      ...editing,
      projects: editing.projects.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    });
  }

  function removeProject(index: number) {
    if (!editing) return;
    setEditing({ ...editing, projects: editing.projects.filter((_, i) => i !== index) });
    setProjectTechText((prev) => prev.filter((_, i) => i !== index));
    setProjectHighlightsText((prev) => prev.filter((_, i) => i !== index));
  }

  function moveProject(index: number, direction: -1 | 1) {
    if (!editing) return;
    const target = index + direction;
    if (target < 0 || target >= editing.projects.length) return;
    const nextProjects = [...editing.projects];
    [nextProjects[index], nextProjects[target]] = [nextProjects[target], nextProjects[index]];
    setEditing({ ...editing, projects: nextProjects });
    setProjectTechText((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setProjectHighlightsText((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
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

  async function cleanupOrphanedLogo(oldPath: string | undefined, stillAlive: Entry[], label: string) {
    if (!isManagedImage(oldPath)) return;
    const stillReferenced = stillAlive.some((e) => e.logo === oldPath);
    if (stillReferenced) return;
    try {
      await deleteBinaryFile(toRepoPath(oldPath), `content: remove orphaned logo for ${label}`, token);
    } catch {
      // Best-effort cleanup — the content change already succeeded either way.
    }
  }

  async function handleSaveOrder() {
    if (!entries) return;
    await persist(entries, "content: reorder experience");
  }

  function discardOrder() {
    void load();
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.company.trim() || !editing.role.trim()) {
      setError("Company and role are required.");
      return;
    }

    const current = entries ?? [];
    const oldLogo = !isNew ? current.find((e) => e.id === editing.id)?.logo : undefined;

    setSaving(true);
    setError(null);

    let logo = editing.logo;
    try {
      if (logoFile) {
        const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
        const slug = slugify(editing.company);
        const repoPath = `public/images/${IMAGE_FOLDER}/${slug}.${ext}`;
        const base64 = await fileToBase64(logoFile);
        await uploadBinaryFile(repoPath, base64, `content: upload logo for ${editing.company}`, token);
        logo = `/images/${IMAGE_FOLDER}/${slug}.${ext}`;
      }
    } catch (err) {
      handleApiError(err);
      setSaving(false);
      return;
    }

    const projects: Project[] = editing.projects.map((p, i) => ({
      name: p.name.trim(),
      description: p.description?.trim() || undefined,
      technologies: (projectTechText[i] ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      highlights: (projectHighlightsText[i] ?? "")
        .split("\n")
        .map((h) => h.trim())
        .filter(Boolean),
    }));

    const finalEntry: Entry = { ...editing, logo, projects };
    let updated: Entry[];

    if (isNew) {
      const newId = makeId(editing.company, current.map((e) => e.id));
      updated = [...current, { ...finalEntry, id: newId }];
    } else {
      updated = current.map((e) => (e.id === editing.id ? finalEntry : e));
    }

    const message = isNew ? `content: add ${editing.company}` : `content: update ${editing.company}`;
    const ok = await persist(updated, message);
    setLogoFile(null);

    if (ok && logoFile && oldLogo && oldLogo !== logo) {
      await cleanupOrphanedLogo(oldLogo, updated, editing.company);
    }
  }

  async function handleDelete(entry: Entry) {
    if (!confirm(`Delete "${entry.company}"? This cannot be undone.`)) return;
    const current = entries ?? [];
    const updated = current.filter((e) => e.id !== entry.id);
    const ok = await persist(updated, `content: delete ${entry.company}`);
    if (ok) {
      await cleanupOrphanedLogo(entry.logo, updated, entry.company);
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
          logoFile={logoFile}
          setLogoFile={setLogoFile}
          projectTechText={projectTechText}
          projectHighlightsText={projectHighlightsText}
          onProjectTechTextChange={(i, v) =>
            setProjectTechText((prev) => prev.map((t, idx) => (idx === i ? v : t)))
          }
          onProjectHighlightsTextChange={(i, v) =>
            setProjectHighlightsText((prev) => prev.map((t, idx) => (idx === i ? v : t)))
          }
          onAddProject={addProject}
          onUpdateProject={updateProject}
          onRemoveProject={removeProject}
          onMoveProject={moveProject}
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
                    <th className="text-left font-medium text-muted px-4 py-3">Company</th>
                    <th className="text-right font-medium text-muted px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={entry.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 min-w-0">
                        <p className="text-foreground font-medium truncate">{entry.company}</p>
                        <p className="text-muted text-xs">
                          {entry.role} · {entry.projects.length}{" "}
                          {entry.projects.length === 1 ? "project" : "projects"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => moveEntry(index, -1)}
                            disabled={index === 0}
                            aria-label={`Move ${entry.company} up`}
                            className="p-2 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            onClick={() => moveEntry(index, 1)}
                            disabled={index === entries.length - 1}
                            aria-label={`Move ${entry.company} down`}
                            className="p-2 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            onClick={() => startEdit(entry)}
                            aria-label={`Edit ${entry.company}`}
                            className="p-2 text-muted hover:text-foreground transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => void handleDelete(entry)}
                            aria-label={`Delete ${entry.company}`}
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
  logoFile,
  setLogoFile,
  projectTechText,
  projectHighlightsText,
  onProjectTechTextChange,
  onProjectHighlightsTextChange,
  onAddProject,
  onUpdateProject,
  onRemoveProject,
  onMoveProject,
  onCancel,
  onSave,
}: {
  entry: Entry;
  setEntry: (e: Entry) => void;
  saving: boolean;
  logoFile: File | null;
  setLogoFile: (f: File | null) => void;
  projectTechText: string[];
  projectHighlightsText: string[];
  onProjectTechTextChange: (index: number, value: string) => void;
  onProjectHighlightsTextChange: (index: number, value: string) => void;
  onAddProject: () => void;
  onUpdateProject: (index: number, patch: Partial<Project>) => void;
  onRemoveProject: (index: number) => void;
  onMoveProject: (index: number, direction: -1 | 1) => void;
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
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Company</label>
          <input
            value={entry.company}
            onChange={(e) => setEntry({ ...entry, company: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Role</label>
          <input
            value={entry.role}
            onChange={(e) => setEntry({ ...entry, role: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Period</label>
          <input
            value={entry.period}
            onChange={(e) => setEntry({ ...entry, period: e.target.value })}
            placeholder="April 2024 - Present"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Location</label>
          <input
            value={entry.location ?? ""}
            onChange={(e) => setEntry({ ...entry, location: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">Logo URL</label>
        <input
          value={entry.logo ?? ""}
          onChange={(e) => setEntry({ ...entry, logo: e.target.value })}
          placeholder="/images/logos/example.png"
          className={inputClass}
        />
        <label className={`${inputClass} mt-2 flex items-center gap-2 cursor-pointer`}>
          <Upload size={16} className="text-muted shrink-0" />
          <span className="truncate">{logoFile ? logoFile.name : "Or upload an image file…"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs uppercase tracking-wide text-muted">Projects</label>
          <button
            onClick={onAddProject}
            type="button"
            className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
          >
            <Plus size={14} /> Add Project
          </button>
        </div>
        <div className="space-y-3">
          {entry.projects.map((project, i) => (
            <div key={i} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Project {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onMoveProject(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move project ${i + 1} up`}
                    className="p-1.5 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => onMoveProject(i, 1)}
                    disabled={i === entry.projects.length - 1}
                    aria-label={`Move project ${i + 1} down`}
                    className="p-1.5 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => onRemoveProject(i)}
                    aria-label={`Remove project ${i + 1}`}
                    className="p-1.5 text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-muted mb-1">
                  Project Name
                </label>
                <input
                  value={project.name}
                  onChange={(e) => onUpdateProject(i, { name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-muted mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={project.description ?? ""}
                  onChange={(e) => onUpdateProject(i, { description: e.target.value })}
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-muted mb-1">
                  Technologies (comma separated)
                </label>
                <input
                  value={projectTechText[i] ?? ""}
                  onChange={(e) => onProjectTechTextChange(i, e.target.value)}
                  placeholder=".NET Core, React, PostgreSQL"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-muted mb-1">
                  Highlights (one per line)
                </label>
                <textarea
                  value={projectHighlightsText[i] ?? ""}
                  onChange={(e) => onProjectHighlightsTextChange(i, e.target.value)}
                  rows={5}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          ))}
          {entry.projects.length === 0 && (
            <p className="text-muted text-xs">No projects yet.</p>
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
