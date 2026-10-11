"use client";

import { useEffect, useRef, useState } from "react";
import IconButton from "@/components/ui/IconButton";
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
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Linkedin,
} from "lucide-react";
import { inputClass, slugify, fileToBase64 } from "@/components/admin/shared";
import ClientMultiSelect from "@/components/admin/ClientMultiSelect";
import CaseStudyMultiSelect from "@/components/admin/CaseStudyMultiSelect";
import WorkMultiSelect from "@/components/admin/WorkMultiSelect";
import EditorPreview from "@/components/admin/EditorPreview";
import ArticleMarkdownEditor from "@/components/admin/ArticleMarkdownEditor";
import { ReorderControls } from "@/components/admin/ReorderControls";
import type { ContentSection, Project } from "@/types";
import { parseLinkedInPostText, buildLinkedInEmbedBody } from "@/lib/linkedin";

type Section = ContentSection;

interface Entry {
  id: string;
  slug: string;
  title: string;
  date?: string;
  updatedAt?: string;
  published: boolean;
  description: string;
  tags: string[];
  image?: string;
  titleImages?: string[];
  photos?: string[];
  client?: string;
  body: string;
  sections: Section[];
  longDescription?: string;
  liveUrl?: Project["liveUrl"];
  githubUrl?: Project["githubUrl"];
  caseStudies?: string[];
  featured?: boolean;
  logo?: string;
  url?: string | null;
  projects?: string[];
}

/** Entry as written in the JSON file; clients store their title as `name`. */
type StoredEntry = Omit<Entry, "title"> & { title?: string; name?: string };

function fromStored(kind: ContentKind, stored: StoredEntry): Entry {
  if (kind !== "client") return stored as Entry;
  const { name, ...rest } = stored;
  return { ...rest, title: name ?? "" };
}

function toStored(kind: ContentKind, entry: Entry): StoredEntry {
  if (kind !== "client") return entry;
  const { title, ...rest } = entry;
  return { ...rest, name: title };
}

interface InlineImage {
  draftPath: string;
  file: File;
  objectUrl: string;
  id: string;
}

type ContentKind = "blog" | "case-study" | "project" | "client";

const INLINE_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const INLINE_IMAGE_PATH = /\/images\/(?:blog|case-studies|projects|clients)\/[a-z0-9-]+-inline-[0-9a-f-]+\.(?:png|jpg|webp|gif|avif)\b/g;

function inlineImagePaths(entry: Entry): string[] {
  return [entry.body, ...(entry.sections ?? []).map((section) => section.body)]
    .flatMap((body) => body.match(INLINE_IMAGE_PATH) ?? []);
}

const CONFIG: Record<
  ContentKind,
  {
    path: string;
    arrayKey: string;
    label: string;
    singularLabel: string;
    hasClient: boolean;
    hasLinkedInImport: boolean;
    /** Dated entries are sorted newest first and appear in RSS; undated ones keep a manual order. */
    dated: boolean;
    imageFolder: string;
    viewPath: string;
  }
> = {
  blog: {
    path: "content/blogs.json",
    arrayKey: "posts",
    label: "Blog Posts",
    singularLabel: "Post",
    hasClient: false,
    hasLinkedInImport: true,
    dated: true,
    imageFolder: "blog",
    viewPath: "/blog",
  },
  "case-study": {
    path: "content/case-studies.json",
    arrayKey: "caseStudies",
    label: "Case Studies",
    singularLabel: "Case Study",
    hasClient: true,
    hasLinkedInImport: true,
    dated: true,
    imageFolder: "case-studies",
    viewPath: "/case-studies",
  },
  project: {
    path: "content/projects.json",
    arrayKey: "projects",
    label: "Projects",
    singularLabel: "Project",
    hasClient: true,
    hasLinkedInImport: false,
    dated: false,
    imageFolder: "projects",
    viewPath: "/projects",
  },
  client: {
    path: "content/clients.json",
    arrayKey: "clients",
    label: "Clients",
    singularLabel: "Client",
    hasClient: false,
    hasLinkedInImport: false,
    dated: false,
    imageFolder: "clients",
    viewPath: "/clients",
  },
};

function isManagedImage(imagePath: string | undefined, kind: ContentKind): imagePath is string {
  return !!imagePath && imagePath.startsWith(`/images/${CONFIG[kind].imageFolder}/`);
}

function toRepoPath(publicPath: string): string {
  return `public${publicPath}`;
}

function entryImagePaths(entry: Entry): string[] {
  return [
    entry.image,
    ...(entry.titleImages ?? []),
    ...(entry.photos ?? []),
    ...(entry.sections ?? []).flatMap((s) => s.images ?? []),
    ...inlineImagePaths(entry),
  ].filter(Boolean) as string[];
}

function referencedImagePaths(list: Entry[]): Set<string> {
  return new Set(list.flatMap(entryImagePaths));
}

/** Uploads any chosen files over their URL slots and returns the non-empty image URLs. */
async function resolveImageList(
  urls: string[],
  files: (File | null)[],
  publicPathFor: (index: number, ext: string) => string,
  changes: FileChange[]
): Promise<string[]> {
  const resolved: string[] = [];
  for (let i = 0; i < urls.length; i++) {
    let url = urls[i];
    const file = files[i];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      url = publicPathFor(i, ext);
      changes.push({ path: toRepoPath(url), content: await fileToBase64(file) });
    }
    if (url.trim()) resolved.push(url.trim());
  }
  return resolved;
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

const KIND_DEFAULTS: Record<ContentKind, () => Partial<Entry>> = {
  blog: () => ({ date: new Date().toISOString().slice(0, 10) }),
  "case-study": () => ({ date: new Date().toISOString().slice(0, 10) }),
  project: () => ({ longDescription: "", liveUrl: null, githubUrl: null, caseStudies: [], featured: false }),
  client: () => ({ logo: "", url: null, projects: [], caseStudies: [] }),
};

function blankEntry(kind: ContentKind): Entry {
  return {
    id: "",
    slug: "",
    title: "",
    ...KIND_DEFAULTS[kind](),
    published: false,
    description: "",
    tags: [],
    image: "",
    client: "",
    body: "",
    sections: [],
  };
}

interface EditorProps {
  kind: ContentKind;
  token: string;
  onAuthError: () => void;
  initialSlug?: string;
  initialNew?: boolean;
}

export default function Editor({ kind, token, onAuthError, initialSlug, initialNew = false }: EditorProps) {
  const pendingSlug = useRef(initialSlug);
  const pendingNew = useRef(initialNew);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<Entry | null>(null);
  const [mode, setMode] = useState<"edit" | "view">("edit");
  const [tagsText, setTagsText] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sectionImageFiles, setSectionImageFiles] = useState<(File | null)[][]>([]);
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([]);
  const [titleImageFiles, setTitleImageFiles] = useState<(File | null)[]>([]);
  const [inlineImages, setInlineImages] = useState<InlineImage[]>([]);
  const inlineImagesRef = useRef<InlineImage[]>([]);
  const [loadedOrderIds, setLoadedOrderIds] = useState<string[]>([]);

  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [linkedInText, setLinkedInText] = useState("");

  useEffect(() => {
    clearInlineImages();
    setEntries(null);
    setEditing(null);
    setError(null);
    setSuccessMsg(null);
    setShowLinkedInImport(false);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  useEffect(() => () => {
    inlineImagesRef.current.forEach((image) => URL.revokeObjectURL(image.objectUrl));
    inlineImagesRef.current = [];
  }, []);

  function clearInlineImages() {
    inlineImagesRef.current.forEach((image) => URL.revokeObjectURL(image.objectUrl));
    inlineImagesRef.current = [];
    setInlineImages([]);
  }

  function addInlineImage(file: File): string {
    if (!INLINE_IMAGE_EXTENSIONS[file.type]) {
      throw new Error("Choose a PNG, JPEG, WebP, GIF, or AVIF image.");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Choose an image smaller than 10 MB.");
    }
    const id = crypto.randomUUID();
    const image = {
      id,
      file,
      draftPath: `/__draft-inline-image/${id}`,
      objectUrl: URL.createObjectURL(file),
    };
    inlineImagesRef.current = [...inlineImagesRef.current, image];
    setInlineImages(inlineImagesRef.current);
    return image.draftPath;
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { content, sha } = await fetchContentFile(CONFIG[kind].path, token);
      const parsed = JSON.parse(content);
      const loaded: Entry[] = (parsed[CONFIG[kind].arrayKey] ?? []).map((stored: StoredEntry) => {
        const e = fromStored(kind, stored);
        return {
          ...e,
          description: e.description ?? "",
          tags: e.tags ?? [],
          body: e.body ?? "",
          sections: e.sections ?? [],
          published: e.published ?? true,
        };
      });
      setEntries(loaded);
      setLoadedOrderIds(loaded.map((entry) => entry.id));
      setFileSha(sha);
      if (pendingSlug.current) {
        const slug = pendingSlug.current;
        pendingSlug.current = undefined;
        const entry = loaded.find((item) => item.slug === slug);
        if (entry) startEdit(entry);
        else setError(`Could not find ${CONFIG[kind].singularLabel.toLowerCase()} "${slug}" in the CMS.`);
      } else if (pendingNew.current) {
        pendingNew.current = false;
        startNew();
      }
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
    clearInlineImages();
    setMode("edit");
    setEditing(blankEntry(kind));
    setTagsText("");
    setIsNew(true);
    setImageFile(null);
    setSectionImageFiles([]);
    setPhotoFiles([]);
    setTitleImageFiles([]);
    setSuccessMsg(null);
    setError(null);
  }

  function startEdit(entry: Entry, nextMode: "edit" | "view" = "edit") {
    clearInlineImages();
    setMode(nextMode);
    const sections = entry.sections ?? [];
    setEditing({ ...entry, sections });
    setTagsText(entry.tags.join(", "));
    setIsNew(false);
    setImageFile(null);
    setSectionImageFiles(sections.map((s) => (s.images ?? []).map(() => null)));
    setPhotoFiles((entry.photos ?? []).map(() => null));
    setTitleImageFiles((entry.titleImages ?? []).map(() => null));
    setSuccessMsg(null);
    setError(null);
  }

  function cancelEdit() {
    clearInlineImages();
    setEditing(null);
    setImageFile(null);
    setSectionImageFiles([]);
    setPhotoFiles([]);
    setTitleImageFiles([]);
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

    clearInlineImages();
    setMode("edit");
    setEditing({
      ...blankEntry(kind),
      title: parsed.title,
      slug,
      description: parsed.description,
      body: buildLinkedInEmbedBody(linkedInUrl.trim(), parsed.body),
    });
    setTagsText(parsed.tags.join(", "));
    setIsNew(true);
    setImageFile(null);
    setSectionImageFiles([]);
    setPhotoFiles([]);
    setTitleImageFiles([]);
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

  function addPhoto() {
    if (!editing) return;
    setEditing({ ...editing, photos: [...(editing.photos ?? []), ""] });
    setPhotoFiles((previous) => [...previous, null]);
  }

  function updatePhoto(index: number, value: string) {
    if (!editing) return;
    setEditing({ ...editing, photos: (editing.photos ?? []).map((photo, i) => i === index ? value : photo) });
  }

  function removePhoto(index: number) {
    if (!editing) return;
    setEditing({ ...editing, photos: (editing.photos ?? []).filter((_, i) => i !== index) });
    setPhotoFiles((previous) => previous.filter((_, i) => i !== index));
  }

  function movePhoto(index: number, direction: -1 | 1) {
    if (!editing) return;
    const target = index + direction;
    const photos = [...(editing.photos ?? [])];
    if (target < 0 || target >= photos.length) return;
    [photos[index], photos[target]] = [photos[target], photos[index]];
    setEditing({ ...editing, photos });
    setPhotoFiles((previous) => {
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addTitleImage() {
    if (!editing) return;
    setEditing({ ...editing, titleImages: [...(editing.titleImages ?? []), ""] });
    setTitleImageFiles((previous) => [...previous, null]);
  }

  function updateTitleImage(index: number, value: string) {
    if (!editing) return;
    setEditing({ ...editing, titleImages: (editing.titleImages ?? []).map((image, i) => i === index ? value : image) });
  }

  function removeTitleImage(index: number) {
    if (!editing) return;
    setEditing({ ...editing, titleImages: (editing.titleImages ?? []).filter((_, i) => i !== index) });
    setTitleImageFiles((previous) => previous.filter((_, i) => i !== index));
  }

  async function commit(changes: FileChange[], newEntries: Entry[], message: string): Promise<boolean> {
    if (!fileSha) {
      setError("Missing file version — reload the list before saving.");
      return false;
    }
    const payload = { [CONFIG[kind].arrayKey]: newEntries.map((entry) => toStored(kind, entry)) };
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
    const oldManagedPaths = [...new Set(previousEntry ? entryImagePaths(previousEntry) : [])]
      .filter((p) => isManagedImage(p, kind));

    setSaving(true);
    setError(null);

    const changes: FileChange[] = [];
    let image = editing.image;
    let body = editing.body;
    let sections: Section[];
    let photos: string[];
    let titleImages: string[];

    try {
      if (imageFile) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() || "png";
        const repoPath = `public/images/${CONFIG[kind].imageFolder}/${slug}.${ext}`;
        const base64 = await fileToBase64(imageFile);
        changes.push({ path: repoPath, content: base64 });
        image = `/images/${CONFIG[kind].imageFolder}/${slug}.${ext}`;
      }

      const imageFolder = `/images/${CONFIG[kind].imageFolder}`;
      photos = await resolveImageList(
        editing.photos ?? [], photoFiles, (i, ext) => `${imageFolder}/${slug}-photo-${i}.${ext}`, changes
      );
      titleImages = await resolveImageList(
        editing.titleImages ?? [], titleImageFiles, (i, ext) => `${imageFolder}/${slug}-title-${i}.${ext}`, changes
      );

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
      sections = uploadedSections.filter((s) => s.body.trim() || (s.images?.length ?? 0) > 0);

      for (const inline of inlineImages) {
        if (!body.includes(inline.draftPath) && !sections.some((section) => section.body.includes(inline.draftPath))) continue;
        const ext = INLINE_IMAGE_EXTENSIONS[inline.file.type];
        const url = `/images/${CONFIG[kind].imageFolder}/${slug}-inline-${inline.id}.${ext}`;
        changes.push({ path: toRepoPath(url), content: await fileToBase64(inline.file) });
        body = body.replaceAll(inline.draftPath, url);
        sections = sections.map((section) => ({ ...section, body: section.body.replaceAll(inline.draftPath, url) }));
      }
      if ([body, ...sections.map((section) => section.body)].some((text) => /\/__draft-inline-image\/[0-9a-f-]+/.test(text))) {
        throw new Error("An inline image is no longer available. Remove it from the Markdown and insert it again.");
      }
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
      body,
      photos,
      titleImages: titleImages.length > 0 ? titleImages : undefined,
      sections,
      updatedAt: new Date().toISOString(),
    };
    if (kind === "project") {
      finalEntry.liveUrl = editing.liveUrl?.trim() || null;
      const github = editing.githubUrl;
      if (github && typeof github === "object") {
        const frontend = github.frontend?.trim();
        const backend = github.backend?.trim();
        finalEntry.githubUrl = frontend || backend
          ? { ...(frontend ? { frontend } : {}), ...(backend ? { backend } : {}) }
          : null;
      } else {
        finalEntry.githubUrl = github?.trim() || null;
      }
      finalEntry.featured = editing.featured ?? false;
      finalEntry.caseStudies = editing.caseStudies ?? [];
    }
    if (kind === "client") {
      finalEntry.url = editing.url?.trim() || null;
      finalEntry.logo = editing.logo?.trim() || undefined;
      finalEntry.projects = editing.projects ?? [];
      finalEntry.caseStudies = editing.caseStudies ?? [];
    }
    let updated: Entry[];

    if (isNew) {
      // Client ids appear in testimonial request links, so they stay readable.
      const newEntry: Entry = { ...finalEntry, id: kind === "client" ? slug : Date.now().toString(36) };
      updated = [...current, newEntry];
    } else {
      updated = current.map((e) => (e.id === editing.id ? finalEntry : e));
    }

    const stillReferenced = referencedImagePaths(updated);
    for (const oldPath of oldManagedPaths) {
      if (!stillReferenced.has(oldPath)) changes.push({ path: toRepoPath(oldPath), content: null });
    }

    const message = isNew ? `content: add ${editing.title}` : `content: update ${editing.title}`;
    if (await commit(changes, updated, message)) {
      clearInlineImages();
      setImageFile(null);
      setSectionImageFiles(sections.map((s) => (s.images ?? []).map(() => null)));
      setPhotoFiles(photos.map(() => null));
      setTitleImageFiles(titleImages.map(() => null));
    }
  }

  async function handleDelete(entry: Entry) {
    if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    const current = entries ?? [];
    const updated = current.filter((e) => e.id !== entry.id);

    const oldPaths = [...new Set(entryImagePaths(entry))].filter((p) => isManagedImage(p, kind));
    const stillReferenced = referencedImagePaths(updated);
    const changes: FileChange[] = oldPaths
      .filter((p) => !stillReferenced.has(p))
      .map((p) => ({ path: toRepoPath(p), content: null }));

    await commit(changes, updated, `content: delete ${entry.title}`);
  }

  const orderDirty = !CONFIG[kind].dated && entries !== null &&
    entries.map((entry) => entry.id).join("|") !== loadedOrderIds.join("|");

  function moveEntry(index: number, direction: -1 | 1) {
    setEntries((previous) => {
      if (!previous) return previous;
      const target = index + direction;
      if (target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const sortedEntries = !CONFIG[kind].dated
    ? entries
    : entries && [...entries].sort(
      (a, b) => new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime()
    );
  const inlineImageUrls = Object.fromEntries(inlineImages.map((image) => [image.draftPath, image.objectUrl]));

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
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2" role="group" aria-label="Article mode">
              {(["edit", "view"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    mode === value ? "bg-accent text-accent-foreground" : "border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {value === "edit" ? <Pencil size={16} /> : <Eye size={16} />}
                  {value === "edit" ? "Edit" : "View"}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!isNew && (
                <a
                  href={`${CONFIG[kind].viewPath}/${encodeURIComponent(entries?.find((entry) => entry.id === editing.id)?.slug ?? editing.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
                >
                  Open live page <ExternalLink size={14} />
                </a>
              )}
              {mode === "view" && (
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              )}
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="text-sm text-muted hover:text-foreground disabled:opacity-50"
              >
                Back to {CONFIG[kind].label}
              </button>
            </div>
          </div>
          {mode === "view" ? (
            <div className="border border-border rounded-xl overflow-hidden">
              <p className="border-b border-border px-6 py-3 text-sm text-muted">Preview of your current edits.</p>
              {(editing.photos ?? []).length > 1 && (
                <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-3">
                  <span className="mr-1 text-sm text-muted">Reorder photos:</span>
                  {(editing.photos ?? []).map((_, index) => (
                    <div key={index} className="inline-flex items-center gap-1">
                      <span className="text-xs text-muted">{index + 1}</span>
                      <IconButton onClick={() => movePhoto(index, -1)} disabled={index === 0} aria-label={`Move photo ${index + 1} left`} size="sm">
                        <ArrowLeft size={14} />
                      </IconButton>
                      <IconButton onClick={() => movePhoto(index, 1)} disabled={index === (editing.photos?.length ?? 0) - 1} aria-label={`Move photo ${index + 1} right`} size="sm">
                        <ArrowRight size={14} />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
              <EditorPreview
                kind={kind}
                entry={{ ...editing, tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean) }}
                imageFile={imageFile}
                sectionImageFiles={sectionImageFiles}
                photoFiles={photoFiles}
                titleImageFiles={titleImageFiles}
                inlineImageUrls={inlineImageUrls}
              />
            </div>
          ) : (
            <EntryForm
              kind={kind}
              entry={editing}
              setEntry={setEditing}
              tagsText={tagsText}
              setTagsText={setTagsText}
              hasClient={CONFIG[kind].hasClient}
              saving={saving}
              imageFile={imageFile}
              setImageFile={setImageFile}
              sectionImageFiles={sectionImageFiles}
              photoFiles={photoFiles}
              inlineImageUrls={inlineImageUrls}
              onAddInlineImage={addInlineImage}
              onAddPhoto={addPhoto}
              onUpdatePhoto={updatePhoto}
              onRemovePhoto={removePhoto}
              onPhotoFileChange={(index, file) => setPhotoFiles((prev) => prev.map((item, i) => i === index ? file : item))}
              titleImageFiles={titleImageFiles}
              onAddTitleImage={addTitleImage}
              onUpdateTitleImage={updateTitleImage}
              onRemoveTitleImage={removeTitleImage}
              onTitleImageFileChange={(index, file) => setTitleImageFiles((prev) => prev.map((item, i) => i === index ? file : item))}
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
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              onClick={startNew}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              New {CONFIG[kind].singularLabel}
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
            {orderDirty && (
              <ReorderControls
                saving={saving}
                onSave={() => { if (entries) void commit([], entries, `content: reorder ${CONFIG[kind].label}`); }}
                onDiscard={() => void load()}
              />
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
                  {sortedEntries.map((entry, index) => (
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
                          {entry.date ? `${entry.date} · ` : ""}/{entry.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {!CONFIG[kind].dated && (
                            <>
                              <IconButton
                                onClick={() => moveEntry(index, -1)}
                                disabled={saving || index === 0}
                                aria-label={`Move ${entry.title} up`}
                              >
                                <ArrowUp size={16} />
                              </IconButton>
                              <IconButton
                                onClick={() => moveEntry(index, 1)}
                                disabled={saving || index === sortedEntries.length - 1}
                                aria-label={`Move ${entry.title} down`}
                              >
                                <ArrowDown size={16} />
                              </IconButton>
                            </>
                          )}
                          <IconButton
                            onClick={() => startEdit(entry, "view")}
                            aria-label={`View ${entry.title}`}
                          >
                            <Eye size={16} />
                          </IconButton>
                          <IconButton
                            onClick={() => startEdit(entry)}
                            aria-label={`Edit ${entry.title}`}
                          >
                            <Pencil size={16} />
                          </IconButton>
                          <IconButton
                            onClick={() => void handleDelete(entry)}
                            aria-label={`Delete ${entry.title}`}
                            tone={"danger"}
                          >
                            <Trash2 size={16} />
                          </IconButton>
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

/** Editable list of image URLs, each with an optional file upload. */
function ImageListField({
  label,
  itemName,
  images,
  files,
  placeholder,
  emptyText,
  onAdd,
  onUpdate,
  onRemove,
  onFileChange,
}: {
  label: string;
  itemName: string;
  images: string[];
  files: (File | null)[];
  placeholder: string;
  emptyText: string;
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onFileChange: (index: number, file: File | null) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs uppercase tracking-wide text-muted">{label}</label>
        <button onClick={onAdd} type="button" className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover capitalize">
          <Plus size={14} /> Add {itemName}
        </button>
      </div>
      <div className="space-y-2">
        {images.map((image, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1">
              <input value={image} onChange={(e) => onUpdate(index, e.target.value)} placeholder={placeholder} className={inputClass} />
              <label className={`${inputClass} mt-2 flex items-center gap-2 cursor-pointer`}>
                <Upload size={16} className="text-muted shrink-0" />
                <span className="truncate">{files[index]?.name ?? `Or upload a ${itemName}…`}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(index, e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <button type="button" onClick={() => onRemove(index)} aria-label={`Remove ${itemName} ${index + 1}`} className="p-1.5 mt-1 text-muted hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
          </div>
        ))}
        {images.length === 0 && <p className="text-muted text-xs">{emptyText}</p>}
      </div>
    </div>
  );
}

function EntryForm({
  kind,
  entry,
  setEntry,
  tagsText,
  setTagsText,
  hasClient,
  saving,
  imageFile,
  setImageFile,
  sectionImageFiles,
  photoFiles,
  inlineImageUrls,
  onAddInlineImage,
  onAddPhoto,
  onUpdatePhoto,
  onRemovePhoto,
  onPhotoFileChange,
  titleImageFiles,
  onAddTitleImage,
  onUpdateTitleImage,
  onRemoveTitleImage,
  onTitleImageFileChange,
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
  kind: ContentKind;
  entry: Entry;
  setEntry: (e: Entry) => void;
  tagsText: string;
  setTagsText: (t: string) => void;
  hasClient: boolean;
  saving: boolean;
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  sectionImageFiles: (File | null)[][];
  photoFiles: (File | null)[];
  inlineImageUrls: Record<string, string>;
  onAddInlineImage: (file: File) => string;
  onAddPhoto: () => void;
  onUpdatePhoto: (index: number, value: string) => void;
  onRemovePhoto: (index: number) => void;
  onPhotoFileChange: (index: number, file: File | null) => void;
  titleImageFiles: (File | null)[];
  onAddTitleImage: () => void;
  onUpdateTitleImage: (index: number, value: string) => void;
  onRemoveTitleImage: (index: number) => void;
  onTitleImageFileChange: (index: number, file: File | null) => void;
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

      <div className="space-y-4">
        {CONFIG[kind].dated && (
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted mb-1">Date</label>
            <input
              type="date"
              value={entry.date ?? ""}
              onChange={(e) => setEntry({ ...entry, date: e.target.value })}
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">
            Cover / Thumbnail Image URL
          </label>
          <input
            value={entry.image ?? ""}
            onChange={(e) => setEntry({ ...entry, image: e.target.value })}
            placeholder={`/images/${CONFIG[kind].imageFolder}/example.png`}
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
          Published <span className="text-muted">(visible in listings and sitemap{CONFIG[kind].dated && " & RSS"} — unchecked stays a draft, still previewable via View)</span>
        </span>
      </label>

      {kind === "project" && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={entry.featured ?? false}
            onChange={(e) => setEntry({ ...entry, featured: e.target.checked })}
            className="w-4 h-4 accent-accent"
          />
          <span className="text-sm text-foreground">Featured</span>
        </label>
      )}

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

      <ImageListField
        label="Additional Title Images (optional)"
        itemName="title image"
        images={entry.titleImages ?? []}
        files={titleImageFiles}
        placeholder={`/images/${CONFIG[kind].imageFolder}/example-title.png`}
        emptyText="Shown after the cover image with previous/next buttons on the article page."
        onAdd={onAddTitleImage}
        onUpdate={onUpdateTitleImage}
        onRemove={onRemoveTitleImage}
        onFileChange={onTitleImageFileChange}
      />

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

      {kind === "project" && (
        <div>
          <label htmlFor="project-long-description" className="block text-xs uppercase tracking-wide text-muted mb-1">
            Long Description
          </label>
          <textarea
            id="project-long-description"
            value={entry.longDescription ?? ""}
            onChange={(e) => setEntry({ ...entry, longDescription: e.target.value })}
            rows={4}
            className={`${inputClass} resize-y`}
          />
        </div>
      )}

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">Body (Markdown)</label>
        <ArticleMarkdownEditor
          value={entry.body}
          onChange={(body) => setEntry({ ...entry, body })}
          label="Article body"
          inlineImageUrls={inlineImageUrls}
          onAddImage={onAddInlineImage}
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
                  <IconButton
                    onClick={() => onMoveSection(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move section ${i + 1} up`}
                    size={"sm"}
                  >
                    <ArrowUp size={14} />
                  </IconButton>
                  <IconButton
                    onClick={() => onMoveSection(i, 1)}
                    disabled={i === entry.sections.length - 1}
                    aria-label={`Move section ${i + 1} down`}
                    size={"sm"}
                  >
                    <ArrowDown size={14} />
                  </IconButton>
                  <IconButton
                    onClick={() => onRemoveSection(i)}
                    aria-label={`Remove section ${i + 1}`}
                    size={"sm"}
                    tone={"danger"}
                  >
                    <Trash2 size={14} />
                  </IconButton>
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
                          placeholder={`/images/${CONFIG[kind].imageFolder}/example-section.png`}
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
                  Section Body (Markdown, optional)
                </label>
                <ArticleMarkdownEditor
                  value={section.body}
                  onChange={(body) => onUpdateSection(i, { body })}
                  label={`Section ${i + 1} body`}
                  inlineImageUrls={inlineImageUrls}
                  onAddImage={onAddInlineImage}
                  height={420}
                  desktopHeight={580}
                  placeholder="Optional text to accompany the images. Leave blank for an image-only section."
                />
              </div>
            </div>
          ))}
          {entry.sections.length === 0 && (
            <p className="text-muted text-xs">No additional sections yet.</p>
          )}
        </div>
      </div>

      <ImageListField
        label="Photo Gallery (optional)"
        itemName="photo"
        images={entry.photos ?? []}
        files={photoFiles}
        placeholder={`/images/${CONFIG[kind].imageFolder}/example-photo.png`}
        emptyText="No gallery photos added."
        onAdd={onAddPhoto}
        onUpdate={onUpdatePhoto}
        onRemove={onRemovePhoto}
        onFileChange={onPhotoFileChange}
      />

      {kind === "project" && <ProjectLinkFields entry={entry} setEntry={setEntry} />}
      {kind === "client" && <ClientFields entry={entry} setEntry={setEntry} />}

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

function ClientFields({ entry, setEntry }: { entry: Entry; setEntry: (entry: Entry) => void }) {
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-accent">Client Details</h3>
      <div>
        <label htmlFor="client-logo" className="block text-xs uppercase tracking-wide text-muted mb-1">Logo URL</label>
        <input
          id="client-logo"
          value={entry.logo ?? ""}
          onChange={(e) => setEntry({ ...entry, logo: e.target.value })}
          placeholder="/images/logos/example.png"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="client-url" className="block text-xs uppercase tracking-wide text-muted mb-1">Website URL</label>
        <input
          id="client-url"
          value={entry.url ?? ""}
          onChange={(e) => setEntry({ ...entry, url: e.target.value })}
          placeholder="https://example.com"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">Work Done (projects &amp; case studies)</label>
        <WorkMultiSelect
          projects={entry.projects ?? []}
          caseStudies={entry.caseStudies ?? []}
          onChange={(work) => setEntry({ ...entry, ...work })}
        />
      </div>
    </div>
  );
}

function ProjectLinkFields({ entry, setEntry }: { entry: Entry; setEntry: (entry: Entry) => void }) {
  const repositories = typeof entry.githubUrl === "object" ? entry.githubUrl : null;
  const fields = [
    {
      key: "live",
      label: "Live URL",
      value: entry.liveUrl ?? "",
      onChange: (value: string) => setEntry({ ...entry, liveUrl: value }),
    },
    {
      key: "repository",
      label: "GitHub URL (single repo)",
      value: typeof entry.githubUrl === "string" ? entry.githubUrl : "",
      onChange: (value: string) => setEntry({ ...entry, githubUrl: value }),
    },
    {
      key: "frontend",
      label: "GitHub Frontend URL",
      value: repositories?.frontend ?? "",
      onChange: (value: string) => setEntry({ ...entry, githubUrl: { ...repositories, frontend: value } }),
    },
    {
      key: "backend",
      label: "GitHub Backend URL",
      value: repositories?.backend ?? "",
      onChange: (value: string) => setEntry({ ...entry, githubUrl: { ...repositories, backend: value } }),
    },
  ];

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-accent">Project Links</h3>
      <p className="text-xs text-muted">Use a single GitHub repository or separate frontend and backend repositories.</p>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label htmlFor={`project-${field.key}`} className="block text-xs uppercase tracking-wide text-muted mb-1">
              {field.label}
            </label>
            <input
              id={`project-${field.key}`}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className={inputClass}
            />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">Related Case Studies</label>
        <CaseStudyMultiSelect
          value={(entry.caseStudies ?? []).join(", ")}
          onChange={(value) => setEntry({ ...entry, caseStudies: value.split(",").map((slug) => slug.trim()).filter(Boolean) })}
        />
      </div>
    </div>
  );
}
