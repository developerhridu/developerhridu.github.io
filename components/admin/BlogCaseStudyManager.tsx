"use client";

import { useEffect, useState } from "react";
import {
  fetchContentFile,
  commitFiles,
  encodeBase64Unicode,
  GitHubApiError,
  type FileChange,
} from "@/lib/github";
import {
  Pencil,
  Trash2,
  Plus,
  ExternalLink,
  X,
  Upload,
  Eye,
  ArrowUp,
  ArrowDown,
  Linkedin,
} from "lucide-react";
import { inputClass, slugify, fileToBase64 } from "@/components/admin/shared";
import ClientMultiSelect from "@/components/admin/ClientMultiSelect";
import { parseLinkedInPostText, buildLinkedInEmbedBody } from "@/lib/linkedin";

interface Section {
  images?: string[];
  alt?: string;
  body: string;
}

interface Entry {
  id: string;
  slug: string;
  title: string;
  date: string;
  updatedAt?: string;
  published: boolean;
  description: string;
  tags: string[];
  image?: string;
  client?: string;
  body: string;
  sections: Section[];
}

type ContentKind = "blog" | "case-study";

const CONFIG: Record<
  ContentKind,
  {
    path: string;
    arrayKey: string;
    label: string;
    hasClient: boolean;
    hasLinkedInImport: boolean;
    imageFolder: string;
    viewPath: string;
  }
> = {
  blog: {
    path: "content/blogs.json",
    arrayKey: "posts",
    label: "Blog Posts",
    hasClient: false,
    hasLinkedInImport: true,
    imageFolder: "blog",
    viewPath: "/blog",
  },
  "case-study": {
    path: "content/case-studies.json",
    arrayKey: "caseStudies",
    label: "Case Studies",
    hasClient: true,
    hasLinkedInImport: true,
    imageFolder: "case-studies",
    viewPath: "/case-studies",
  },
};

function isManagedImage(imagePath: string | undefined, kind: ContentKind): imagePath is string {
  return !!imagePath && imagePath.startsWith(`/images/${CONFIG[kind].imageFolder}/`);
}

function toRepoPath(publicPath: string): string {
  return `public${publicPath}`;
}

function referencedImagePaths(list: Entry[]): Set<string> {
  return new Set(
    list.flatMap(
      (e) => [e.image, ...(e.sections ?? []).flatMap((s) => s.images ?? [])].filter(Boolean) as string[]
    )
  );
}

function makeUniqueSlug(base: string, existingSlugs: string[]): string {
  const baseSlug = slugify(base) || "post";
  let candidate = baseSlug;
  let n = 2;
  while (existingSlugs.includes(candidate)) {
    candidate = `${baseSlug}-${n}`;
    n++;
  }
  return candidate;
}

function blankEntry(): Entry {
  return {
    id: "",
    slug: "",
    title: "",
    date: new Date().toISOString().slice(0, 10),
    published: false,
    description: "",
    tags: [],
    image: "",
    client: "",
    body: "",
    sections: [],
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
  const [sectionImageFiles, setSectionImageFiles] = useState<(File | null)[][]>([]);

  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [linkedInText, setLinkedInText] = useState("");

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
      const loaded: Entry[] = (parsed[CONFIG[kind].arrayKey] ?? []).map((e: Entry) => ({
        ...e,
        sections: e.sections ?? [],
        published: e.published ?? true,
      }));
      setEntries(loaded);
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
    setSectionImageFiles([]);
    setSuccessMsg(null);
    setError(null);
  }

  function startEdit(entry: Entry) {
    const sections = entry.sections ?? [];
    setEditing({ ...entry, sections });
    setTagsText(entry.tags.join(", "));
    setIsNew(false);
    setImageFile(null);
    setSectionImageFiles(sections.map((s) => (s.images ?? []).map(() => null)));
    setSuccessMsg(null);
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setImageFile(null);
    setSectionImageFiles([]);
  }

  function cancelLinkedInImport() {
    setShowLinkedInImport(false);
    setLinkedInUrl("");
    setLinkedInText("");
  }

  function createDraftFromLinkedIn() {
    if (!linkedInUrl.trim() || !linkedInText.trim()) {
      setError("Paste both the post URL and the post text.");
      return;
    }

    const parsed = parseLinkedInPostText(linkedInText);
    const slug = makeUniqueSlug(parsed.title, (entries ?? []).map((e) => e.slug));

    setEditing({
      ...blankEntry(),
      title: parsed.title,
      slug,
      description: parsed.description,
      body: buildLinkedInEmbedBody(linkedInUrl.trim(), parsed.body),
    });
    setTagsText(parsed.tags.join(", "));
    setIsNew(true);
    setImageFile(null);
    setSectionImageFiles([]);
    setError(null);
    setSuccessMsg(null);
    cancelLinkedInImport();
  }

  function addSection() {
    if (!editing) return;
    setEditing({ ...editing, sections: [...editing.sections, { images: [], alt: "", body: "" }] });
    setSectionImageFiles((prev) => [...prev, []]);
  }

  function updateSection(index: number, patch: Partial<Section>) {
    if (!editing) return;
    setEditing({
      ...editing,
      sections: editing.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  }

  function removeSection(index: number) {
    if (!editing) return;
    setEditing({ ...editing, sections: editing.sections.filter((_, i) => i !== index) });
    setSectionImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSection(index: number, direction: -1 | 1) {
    if (!editing) return;
    const target = index + direction;
    if (target < 0 || target >= editing.sections.length) return;
    const nextSections = [...editing.sections];
    [nextSections[index], nextSections[target]] = [nextSections[target], nextSections[index]];
    setEditing({ ...editing, sections: nextSections });
    setSectionImageFiles((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addSectionImage(sectionIndex: number) {
    if (!editing) return;
    setEditing({
      ...editing,
      sections: editing.sections.map((s, i) =>
        i === sectionIndex ? { ...s, images: [...(s.images ?? []), ""] } : s
      ),
    });
    setSectionImageFiles((prev) => prev.map((files, i) => (i === sectionIndex ? [...files, null] : files)));
  }

  function updateSectionImageUrl(sectionIndex: number, imageIndex: number, value: string) {
    if (!editing) return;
    setEditing({
      ...editing,
      sections: editing.sections.map((s, i) =>
        i === sectionIndex
          ? { ...s, images: (s.images ?? []).map((img, j) => (j === imageIndex ? value : img)) }
          : s
      ),
    });
  }

  function removeSectionImage(sectionIndex: number, imageIndex: number) {
    if (!editing) return;
    setEditing({
      ...editing,
      sections: editing.sections.map((s, i) =>
        i === sectionIndex ? { ...s, images: (s.images ?? []).filter((_, j) => j !== imageIndex) } : s
      ),
    });
    setSectionImageFiles((prev) =>
      prev.map((files, i) => (i === sectionIndex ? files.filter((_, j) => j !== imageIndex) : files))
    );
  }

  function setSectionImageFile(sectionIndex: number, imageIndex: number, file: File | null) {
    setSectionImageFiles((prev) =>
      prev.map((files, i) => (i === sectionIndex ? files.map((f, j) => (j === imageIndex ? file : f)) : files))
    );
  }

  async function commit(changes: FileChange[], newEntries: Entry[], message: string): Promise<boolean> {
    if (!fileSha) {
      setError("Missing file version — reload the list before saving.");
      return false;
    }
    const payload = { [CONFIG[kind].arrayKey]: newEntries };
    const content = JSON.stringify(payload, null, 2) + "\n";
    const allChanges = [...changes, { path: CONFIG[kind].path, content: encodeBase64Unicode(content) }];

    setSaving(true);
    setError(null);
    try {
      await commitFiles(allChanges, message, token, { path: CONFIG[kind].path, expectedSha: fileSha });
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

    const previousEntry = !isNew ? current.find((e) => e.id === editing.id) : undefined;
    const oldManagedPaths = [
      previousEntry?.image,
      ...(previousEntry?.sections ?? []).flatMap((s) => s.images ?? []),
    ].filter((p): p is string => isManagedImage(p, kind));

    setSaving(true);
    setError(null);

    const changes: FileChange[] = [];
    let image = editing.image;
    let sections: Section[];

    try {
      if (imageFile) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() || "png";
        const repoPath = `public/images/${CONFIG[kind].imageFolder}/${slug}.${ext}`;
        const base64 = await fileToBase64(imageFile);
        changes.push({ path: repoPath, content: base64 });
        image = `/images/${CONFIG[kind].imageFolder}/${slug}.${ext}`;
      }

      const uploadedSections: Section[] = [];
      for (let i = 0; i < editing.sections.length; i++) {
        const sectionImages = editing.sections[i].images ?? [];
        const files = sectionImageFiles[i] ?? [];
        const uploadedImages: string[] = [];
        for (let j = 0; j < sectionImages.length; j++) {
          let url = sectionImages[j];
          const file = files[j];
          if (file) {
            const ext = file.name.split(".").pop()?.toLowerCase() || "png";
            const repoPath = `public/images/${CONFIG[kind].imageFolder}/${slug}-section-${i}-${j}.${ext}`;
            const base64 = await fileToBase64(file);
            changes.push({ path: repoPath, content: base64 });
            url = `/images/${CONFIG[kind].imageFolder}/${slug}-section-${i}-${j}.${ext}`;
          }
          uploadedImages.push(url);
        }
        uploadedSections.push({
          ...editing.sections[i],
          images: uploadedImages.filter((u) => u.trim()),
        });
      }
      sections = uploadedSections.filter((s) => s.body.trim());
    } catch (err) {
      handleApiError(err);
      setSaving(false);
      return;
    }

    const finalEntry: Entry = {
      ...editing,
      slug,
      tags,
      image,
      sections,
      updatedAt: new Date().toISOString(),
    };
    let updated: Entry[];

    if (isNew) {
      const newEntry: Entry = { ...finalEntry, id: Date.now().toString(36) };
      updated = [...current, newEntry];
    } else {
      updated = current.map((e) => (e.id === editing.id ? finalEntry : e));
    }

    const stillReferenced = referencedImagePaths(updated);
    for (const oldPath of oldManagedPaths) {
      if (!stillReferenced.has(oldPath)) changes.push({ path: toRepoPath(oldPath), content: null });
    }

    const message = isNew ? `content: add ${editing.title}` : `content: update ${editing.title}`;
    await commit(changes, updated, message);
    setImageFile(null);
    setSectionImageFiles(sections.map((s) => (s.images ?? []).map(() => null)));
  }

  async function handleDelete(entry: Entry) {
    if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    const current = entries ?? [];
    const updated = current.filter((e) => e.id !== entry.id);

    const oldPaths = [entry.image, ...(entry.sections ?? []).flatMap((s) => s.images ?? [])].filter(
      (p): p is string => isManagedImage(p, kind)
    );
    const stillReferenced = referencedImagePaths(updated);
    const changes: FileChange[] = oldPaths
      .filter((p) => !stillReferenced.has(p))
      .map((p) => ({ path: toRepoPath(p), content: null }));

    await commit(changes, updated, `content: delete ${entry.title}`);
  }

  const sortedEntries = entries
    ? [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : null;

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
          sectionImageFiles={sectionImageFiles}
          onAddSection={addSection}
          onUpdateSection={updateSection}
          onRemoveSection={removeSection}
          onMoveSection={moveSection}
          onAddSectionImage={addSectionImage}
          onUpdateSectionImageUrl={updateSectionImageUrl}
          onRemoveSectionImage={removeSectionImage}
          onSectionImageFileChange={setSectionImageFile}
          onCancel={cancelEdit}
          onSave={() => void handleSave()}
          onTitleBlur={() => {
            if (isNew && editing && !editing.slug) {
              setEditing({ ...editing, slug: slugify(editing.title) });
            }
          }}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              onClick={startNew}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              New {kind === "blog" ? "Post" : "Case Study"}
            </button>
            {CONFIG[kind].hasLinkedInImport && !showLinkedInImport && (
              <button
                onClick={() => setShowLinkedInImport(true)}
                className="flex items-center gap-1.5 px-4 py-2 border border-border text-muted hover:text-foreground rounded-lg text-sm font-medium transition-colors"
              >
                <Linkedin size={16} />
                Import from LinkedIn
              </button>
            )}
          </div>

          {showLinkedInImport && (
            <div className="mb-4 bg-surface border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Import from LinkedIn</h2>
                <button
                  onClick={cancelLinkedInImport}
                  aria-label="Close"
                  className="text-muted hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-muted text-sm">
                Paste the post&apos;s URL (from its <span className="whitespace-nowrap">•••</span> menu →
                &quot;Copy link to post&quot;) and its text. This creates a draft with the post embedded and
                its text as the body — review and edit before publishing.
              </p>
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted mb-1">
                  LinkedIn Post URL
                </label>
                <input
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/posts/..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted mb-1">Post Text</label>
                <textarea
                  value={linkedInText}
                  onChange={(e) => setLinkedInText(e.target.value)}
                  rows={8}
                  placeholder="Paste the post's text here…"
                  className={`${inputClass} font-mono text-sm`}
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={createDraftFromLinkedIn}
                  className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors"
                >
                  Create Draft
                </button>
                <button
                  onClick={cancelLinkedInImport}
                  className="px-4 py-2.5 border border-border text-muted hover:text-foreground rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading && <p className="text-muted text-sm">Loading…</p>}

          {!loading && sortedEntries && sortedEntries.length === 0 && (
            <p className="text-muted text-sm">No entries yet.</p>
          )}

          {!loading && sortedEntries && sortedEntries.length > 0 && (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="text-left font-medium text-muted px-4 py-3">Title</th>
                    <th className="text-right font-medium text-muted px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 min-w-0">
                        <p className="text-foreground font-medium truncate flex items-center gap-2">
                          {entry.title}
                          {!entry.published && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                              Draft
                            </span>
                          )}
                        </p>
                        <p className="text-muted text-xs">
                          {entry.date} · /{entry.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`${CONFIG[kind].viewPath}/${entry.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View ${entry.title}`}
                            className="p-2 text-muted hover:text-foreground transition-colors"
                          >
                            <Eye size={16} />
                          </a>
                          <button
                            onClick={() => startEdit(entry)}
                            aria-label={`Edit ${entry.title}`}
                            className="p-2 text-muted hover:text-foreground transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => void handleDelete(entry)}
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
  sectionImageFiles,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onMoveSection,
  onAddSectionImage,
  onUpdateSectionImageUrl,
  onRemoveSectionImage,
  onSectionImageFileChange,
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
  sectionImageFiles: (File | null)[][];
  onAddSection: () => void;
  onUpdateSection: (index: number, patch: Partial<Section>) => void;
  onRemoveSection: (index: number) => void;
  onMoveSection: (index: number, direction: -1 | 1) => void;
  onAddSectionImage: (sectionIndex: number) => void;
  onUpdateSectionImageUrl: (sectionIndex: number, imageIndex: number, value: string) => void;
  onRemoveSectionImage: (sectionIndex: number, imageIndex: number) => void;
  onSectionImageFileChange: (sectionIndex: number, imageIndex: number, file: File | null) => void;
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
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">
            Cover / Thumbnail Image URL
          </label>
          <input
            value={entry.image ?? ""}
            onChange={(e) => setEntry({ ...entry, image: e.target.value })}
            placeholder="/images/blog/example.png"
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={entry.published}
          onChange={(e) => setEntry({ ...entry, published: e.target.checked })}
          className="w-4 h-4 accent-accent"
        />
        <span className="text-sm text-foreground">
          Published <span className="text-muted">(visible in listings, sitemap &amp; RSS — unchecked stays a draft, still previewable via View)</span>
        </span>
      </label>

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">
          Or Upload Cover Image
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
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Client(s)</label>
          <ClientMultiSelect
            value={entry.client ?? ""}
            onChange={(value) => setEntry({ ...entry, client: value })}
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

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs uppercase tracking-wide text-muted">Content Sections</label>
          <button
            onClick={onAddSection}
            type="button"
            className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
          >
            <Plus size={14} /> Add Section
          </button>
        </div>
        <div className="space-y-3">
          {entry.sections.map((section, i) => (
            <div key={i} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Section {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onMoveSection(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move section ${i + 1} up`}
                    className="p-1.5 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => onMoveSection(i, 1)}
                    disabled={i === entry.sections.length - 1}
                    aria-label={`Move section ${i + 1} down`}
                    className="p-1.5 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => onRemoveSection(i)}
                    aria-label={`Remove section ${i + 1}`}
                    className="p-1.5 text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs uppercase tracking-wide text-muted">
                    Images (optional — zero, one, or many)
                  </label>
                  <button
                    onClick={() => onAddSectionImage(i)}
                    type="button"
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
                  >
                    <Plus size={12} /> Add Image
                  </button>
                </div>
                <div className="space-y-2">
                  {(section.images ?? []).map((image, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <div className="flex-1">
                        <input
                          value={image}
                          onChange={(e) => onUpdateSectionImageUrl(i, j, e.target.value)}
                          placeholder="/images/blog/example-section.png"
                          className={inputClass}
                        />
                        <label className={`${inputClass} mt-2 flex items-center gap-2 cursor-pointer`}>
                          <Upload size={16} className="text-muted shrink-0" />
                          <span className="truncate">
                            {sectionImageFiles[i]?.[j]
                              ? sectionImageFiles[i][j]!.name
                              : "Or upload an image file…"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onSectionImageFileChange(i, j, e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </div>
                      <button
                        onClick={() => onRemoveSectionImage(i, j)}
                        aria-label={`Remove image ${j + 1} from section ${i + 1}`}
                        className="p-1.5 mt-1 text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(section.images ?? []).length === 0 && (
                    <p className="text-muted text-xs">No images — text-only section.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-muted mb-1">
                  Image Alt Text (optional — applies to all images in this section, falls back to the entry
                  title)
                </label>
                <input
                  value={section.alt ?? ""}
                  onChange={(e) => onUpdateSection(i, { alt: e.target.value })}
                  placeholder="Describe what these images show"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-muted mb-1">
                  Section Body (Markdown)
                </label>
                <textarea
                  value={section.body}
                  onChange={(e) => onUpdateSection(i, { body: e.target.value })}
                  rows={8}
                  className={`${inputClass} font-mono text-sm`}
                />
              </div>
            </div>
          ))}
          {entry.sections.length === 0 && (
            <p className="text-muted text-xs">No additional sections yet.</p>
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
