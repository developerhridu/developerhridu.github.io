"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Copy,
} from "lucide-react";
import { inputClass, slugify, fileToBase64, moveItem, savedMessage, confirmDeleteMessage } from "@/components/admin/shared";
import ClientMultiSelect from "@/components/admin/ClientMultiSelect";
import RelatedMultiSelect from "@/components/admin/RelatedMultiSelect";
import EditorPreview from "@/components/admin/EditorPreview";
import ArticleMarkdownEditor from "@/components/admin/ArticleMarkdownEditor";
import EntryList from "@/components/admin/EntryList";
import { ErrorBanner, SuccessBanner } from "@/components/admin/CrudBanners";
import { FormActions, fieldClass } from "@/components/admin/FormKit";
import { MediaPickerButton, prepareImages, reusedNotice, useAdminToken } from "@/components/admin/MediaLibrary";
import { confirmDiscardEdits, snapshot, useSaveShortcut, useUnsavedGuard } from "@/components/admin/useUnsavedGuard";
import { collectErrors, errorSummary, focusFirstError, requiredError, slugError, urlError, type FieldErrors } from "@/components/admin/validation";
import { stagedImageSrc } from "@/lib/adminStore";
import type { ContentSection, Project } from "@/types";
import { parseLinkedInPostText, buildLinkedInEmbedBody } from "@/lib/linkedin";
import { coverImages } from "@/lib/coverImages";

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
  coverImages: string[];
  proofOfWorkImages: string[];
  client?: string;
  body: string;
  sections: Section[];
  longDescription?: string;
  liveUrl?: Project["liveUrl"];
  githubUrl?: Project["githubUrl"];
  featured?: boolean;
  url?: string | null;
  projects?: string[];
  caseStudies?: string[];
  blogs?: string[];
  clients?: string[];
}

/** Entry as written in the JSON file; clients store their title as `name`. */
type StoredEntry = Omit<Entry, "title" | "coverImages" | "proofOfWorkImages"> & {
  title?: string;
  name?: string;
  coverImages?: string[];
  image?: string;
  titleImages?: string[];
  photos?: string[];
  proofOfWorkImage?: string[];
  proofOfWorkImages?: string[];
};

function fromStored(kind: ContentKind, stored: StoredEntry): Entry {
  const { name, title, image, titleImages, coverImages: storedCoverImages, photos, proofOfWorkImage, proofOfWorkImages, ...rest } = stored;
  return {
    ...rest,
    title: kind === "client" ? name ?? "" : title ?? "",
    coverImages: coverImages({ coverImages: storedCoverImages, image, titleImages }),
    proofOfWorkImages: proofOfWorkImages ?? proofOfWorkImage ?? photos ?? [],
  };
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
    ...entry.coverImages,
    ...entry.proofOfWorkImages,
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
  blog: () => ({ date: new Date().toISOString().slice(0, 10), featured: false }),
  "case-study": () => ({ date: new Date().toISOString().slice(0, 10), featured: false }),
  project: () => ({ longDescription: "", liveUrl: null, githubUrl: null, featured: false }),
  client: () => ({ url: null }),
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
    coverImages: [],
    proofOfWorkImages: [],
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
  const [coverImageFiles, setCoverImageFiles] = useState<(File | null)[]>([]);
  const [sectionImageFiles, setSectionImageFiles] = useState<(File | null)[][]>([]);
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([]);
  const [inlineImages, setInlineImages] = useState<InlineImage[]>([]);
  const inlineImagesRef = useRef<InlineImage[]>([]);
  const [loadedOrderIds, setLoadedOrderIds] = useState<string[]>([]);

  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [linkedInText, setLinkedInText] = useState("");
  /** Snapshot of the form when it was opened — "" marks a prefilled draft as unsaved from the start. */
  const [opened, setOpened] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const pendingFiles =
    coverImageFiles.some(Boolean) || photoFiles.some(Boolean) || sectionImageFiles.some((files) => files.some(Boolean)) || inlineImages.length > 0;
  const dirty = !!editing && (snapshot({ editing, tagsText }) !== opened || pendingFiles);
  useUnsavedGuard(dirty);
  useSaveShortcut(() => void handleSave(), !!editing && !saving);

  function markOpened(entry: Entry, tags: string, startDirty = false) {
    setOpened(startDirty ? "" : snapshot({ editing: entry, tagsText: tags }));
    setFieldErrors({});
  }

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
    if (!confirmDiscardEdits(dirty)) return;
    clearInlineImages();
    setMode("edit");
    const blank = blankEntry(kind);
    setEditing(blank);
    setTagsText("");
    markOpened(blank, "");
    setIsNew(true);
    setCoverImageFiles([]);
    setSectionImageFiles([]);
    setPhotoFiles([]);
    setSuccessMsg(null);
    setError(null);
  }

  function startEdit(entry: Entry, nextMode: "edit" | "view" = "edit") {
    if (!confirmDiscardEdits(dirty)) return;
    clearInlineImages();
    setMode(nextMode);
    const sections = entry.sections ?? [];
    setEditing({ ...entry, sections });
    setTagsText(entry.tags.join(", "));
    markOpened({ ...entry, sections }, entry.tags.join(", "));
    setIsNew(false);
    setCoverImageFiles(entry.coverImages.map(() => null));
    setSectionImageFiles(sections.map((s) => (s.images ?? []).map(() => null)));
    setPhotoFiles(entry.proofOfWorkImages.map(() => null));
    setSuccessMsg(null);
    setError(null);
  }

  function cancelEdit() {
    if (!confirmDiscardEdits(dirty)) return;
    clearInlineImages();
    setEditing(null);
    setCoverImageFiles([]);
    setSectionImageFiles([]);
    setPhotoFiles([]);
    setFieldErrors({});
  }

  /** Opens a new draft pre-filled from `entry` (images shared by path; never published). */
  function duplicate(entry: Entry) {
    if (!confirmDiscardEdits(dirty)) return;
    clearInlineImages();
    setMode("edit");
    const slug = makeUniqueSlug(`${entry.slug}-copy`, (entries ?? []).map((e) => e.slug));
    const copy: Entry = { ...entry, sections: entry.sections ?? [], id: "", slug, title: `${entry.title} (copy)`, published: false, featured: false };
    setEditing(copy);
    setTagsText(entry.tags.join(", "));
    setIsNew(true);
    setCoverImageFiles(copy.coverImages.map(() => null));
    setSectionImageFiles(copy.sections.map((s) => (s.images ?? []).map(() => null)));
    setPhotoFiles(copy.proofOfWorkImages.map(() => null));
    markOpened(copy, entry.tags.join(", "), true);
    setSuccessMsg(null);
    setError(null);
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

    if (!confirmDiscardEdits(dirty)) return;
    clearInlineImages();
    setMode("edit");
    const draft = {
      ...blankEntry(kind),
      title: parsed.title,
      slug,
      description: parsed.description,
      body: buildLinkedInEmbedBody(linkedInUrl.trim(), parsed.body),
    };
    setEditing(draft);
    setTagsText(parsed.tags.join(", "));
    markOpened(draft, parsed.tags.join(", "), true);
    setIsNew(true);
    setCoverImageFiles([]);
    setSectionImageFiles([]);
    setPhotoFiles([]);
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
    setEditing({ ...editing, proofOfWorkImages: [...editing.proofOfWorkImages, ""] });
    setPhotoFiles((previous) => [...previous, null]);
  }

  function updatePhoto(index: number, value: string) {
    if (!editing) return;
    setEditing({ ...editing, proofOfWorkImages: editing.proofOfWorkImages.map((photo, i) => i === index ? value : photo) });
  }

  function removePhoto(index: number) {
    if (!editing) return;
    setEditing({ ...editing, proofOfWorkImages: editing.proofOfWorkImages.filter((_, i) => i !== index) });
    setPhotoFiles((previous) => previous.filter((_, i) => i !== index));
  }

  function movePhoto(index: number, direction: -1 | 1) {
    if (!editing) return;
    const target = index + direction;
    const photos = [...editing.proofOfWorkImages];
    if (target < 0 || target >= photos.length) return;
    [photos[index], photos[target]] = [photos[target], photos[index]];
    setEditing({ ...editing, proofOfWorkImages: photos });
    setPhotoFiles((previous) => {
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addCoverImage() {
    if (!editing) return;
    setEditing({ ...editing, coverImages: [...editing.coverImages, ""] });
    setCoverImageFiles((previous) => [...previous, null]);
  }

  /** Adds picked cover files (optimized; ones already on the site reuse the existing path). */
  async function addCoverFiles(files: File[]) {
    if (files.length === 0) return;
    const prepared = await prepareImages(files, token);
    const reused = prepared.filter((item) => item.existing).length;
    setEditing((previous) => previous ? {
      ...previous,
      coverImages: [...previous.coverImages, ...prepared.map((item) => item.existing ?? "")],
    } : previous);
    setCoverImageFiles((previous) => [...previous, ...prepared.map((item) => item.file ?? null)]);
    if (reused > 0) setSuccessMsg(reusedNotice(reused));
  }

  function addCoverPaths(paths: string[]) {
    setEditing((previous) => previous ? { ...previous, coverImages: [...previous.coverImages, ...paths] } : previous);
    setCoverImageFiles((previous) => [...previous, ...paths.map(() => null)]);
  }

  function addPhotoPaths(paths: string[]) {
    setEditing((previous) => previous ? { ...previous, proofOfWorkImages: [...previous.proofOfWorkImages, ...paths] } : previous);
    setPhotoFiles((previous) => [...previous, ...paths.map(() => null)]);
  }

  function updateCoverImage(index: number, value: string) {
    if (!editing) return;
    setEditing({ ...editing, coverImages: editing.coverImages.map((image, i) => i === index ? value : image) });
  }

  function removeCoverImage(index: number) {
    if (!editing) return;
    setEditing({ ...editing, coverImages: editing.coverImages.filter((_, i) => i !== index) });
    setCoverImageFiles((previous) => previous.filter((_, i) => i !== index));
  }

  function moveCoverImage(index: number, direction: -1 | 1) {
    if (!editing) return;
    const target = index + direction;
    if (target < 0 || target >= editing.coverImages.length) return;
    const images = [...editing.coverImages];
    [images[index], images[target]] = [images[target], images[index]];
    setEditing({ ...editing, coverImages: images });
    setCoverImageFiles((previous) => {
      const files = [...previous];
      [files[index], files[target]] = [files[target], files[index]];
      return files;
    });
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
      setFieldErrors({});
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

  async function handleSave() {
    if (!editing || saving) return;

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const slug = editing.slug.trim();
    const current = entries ?? [];
    const slugTaken = current.some((e) => e.slug === slug && e.id !== editing.id);
    const github = editing.githubUrl;
    const errors = collectErrors([
      ["title", requiredError(editing.title, "Title")],
      ["slug", slugError(slug) ?? (slugTaken ? "That slug is already used by another entry." : null)],
      ["liveUrl", kind === "project" ? urlError(editing.liveUrl, { allowRelative: false }) : null],
      ["githubUrl", kind === "project" && typeof github === "string" ? urlError(github, { allowRelative: false }) : null],
      ["githubFrontend", kind === "project" && github && typeof github === "object" ? urlError(github.frontend, { allowRelative: false }) : null],
      ["githubBackend", kind === "project" && github && typeof github === "object" ? urlError(github.backend, { allowRelative: false }) : null],
      ["url", kind === "client" ? urlError(editing.url, { allowRelative: false }) : null],
    ]);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(errorSummary(errors));
      if (mode === "view") setMode("edit");
      focusFirstError();
      return;
    }
    setFieldErrors({});

    const previousEntry = !isNew ? current.find((e) => e.id === editing.id) : undefined;
    const oldManagedPaths = [...new Set(previousEntry ? entryImagePaths(previousEntry) : [])]
      .filter((p) => isManagedImage(p, kind));

    setSaving(true);
    setError(null);

    const changes: FileChange[] = [];
    let body = editing.body;
    let sections: Section[];
    let photos: string[];
    let savedCoverImages: string[];

    try {
      const imageFolder = `/images/${CONFIG[kind].imageFolder}`;
      savedCoverImages = await resolveImageList(
        editing.coverImages, coverImageFiles,
        (_i, ext) => `${imageFolder}/${slug}-cover-${crypto.randomUUID()}.${ext}`, changes
      );
      photos = await resolveImageList(
        editing.proofOfWorkImages, photoFiles, (_i, ext) => `${imageFolder}/${slug}-proof-${crypto.randomUUID()}.${ext}`, changes
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
      coverImages: savedCoverImages,
      body,
      proofOfWorkImages: photos,
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
    }
    if (kind !== "client") finalEntry.featured = editing.featured ?? false;
    if (kind === "client") {
      finalEntry.url = editing.url?.trim() || null;
    }
    finalEntry.projects = editing.projects ?? [];
    finalEntry.caseStudies = editing.caseStudies ?? [];
    finalEntry.blogs = editing.blogs ?? [];
    finalEntry.clients = editing.clients ?? [];
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
      setCoverImageFiles(savedCoverImages.map(() => null));
      setSectionImageFiles(sections.map((s) => (s.images ?? []).map(() => null)));
      setPhotoFiles(photos.map(() => null));
    }
  }

  async function handleDelete(entry: Entry) {
    if (!confirm(confirmDeleteMessage(entry.title))) return;
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

  function moveEntry(from: number, to: number) {
    setEntries((previous) => (previous ? moveItem(previous, from, to) : previous));
  }

  const sortedEntries = !CONFIG[kind].dated
    ? entries
    : entries && [...entries].sort(
      (a, b) => new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime()
    );
  const inlineImageUrls = Object.fromEntries(inlineImages.map((image) => [image.draftPath, image.objectUrl]));

  return (
    <div>
      <ErrorBanner message={error} onReload={() => void load()} />
      <SuccessBanner message={successMsg} />

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
              {!isNew && (
                <button
                  type="button"
                  onClick={() => duplicate(editing)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground disabled:opacity-50"
                >
                  <Copy size={14} /> Duplicate
                </button>
              )}
              {dirty && (
                <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-500">
                  Unsaved
                </span>
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
              {editing.proofOfWorkImages.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-3">
                  <span className="mr-1 text-sm text-muted">Reorder proof of work images:</span>
                  {editing.proofOfWorkImages.map((_, index) => (
                    <div key={index} className="inline-flex items-center gap-1">
                      <span className="text-xs text-muted">{index + 1}</span>
                      <IconButton onClick={() => movePhoto(index, -1)} disabled={index === 0} aria-label={`Move photo ${index + 1} left`} size="sm">
                        <ArrowLeft size={14} />
                      </IconButton>
                      <IconButton onClick={() => movePhoto(index, 1)} disabled={index === editing.proofOfWorkImages.length - 1} aria-label={`Move photo ${index + 1} right`} size="sm">
                        <ArrowRight size={14} />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
              <EditorPreview
                kind={kind}
                entry={{ ...editing, website: editing.url ?? undefined, tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean) }}
                coverImageFiles={coverImageFiles}
                sectionImageFiles={sectionImageFiles}
                photoFiles={photoFiles}
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
              dirty={dirty}
              fieldErrors={fieldErrors}
              onDuplicate={!isNew ? () => duplicate(editing) : undefined}
              coverImageFiles={coverImageFiles}
              onAddCoverFiles={(files) => void addCoverFiles(files)}
              onAddCoverPaths={addCoverPaths}
              onAddPhotoPaths={addPhotoPaths}
              sectionImageFiles={sectionImageFiles}
              photoFiles={photoFiles}
              inlineImageUrls={inlineImageUrls}
              onAddInlineImage={addInlineImage}
              onAddPhoto={addPhoto}
              onUpdatePhoto={updatePhoto}
              onRemovePhoto={removePhoto}
              onPhotoFileChange={(index, file) => setPhotoFiles((prev) => prev.map((item, i) => i === index ? file : item))}
              onAddCoverImage={addCoverImage}
              onUpdateCoverImage={updateCoverImage}
              onRemoveCoverImage={removeCoverImage}
              onMoveCoverImage={moveCoverImage}
              onCoverImageFileChange={(index, file) => setCoverImageFiles((prev) => prev.map((item, i) => i === index ? file : item))}
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

          <EntryList<Entry>
            items={sortedEntries}
            loading={loading}
            getKey={(entry) => entry.id}
            getTitle={(entry) => entry.title}
            getSubtitle={(entry) => `${entry.date ? `${entry.date} · ` : ""}/${entry.slug}`}
            getThumbnail={(entry) => entry.coverImages[0]}
            isDraft={(entry) => !entry.published}
            getSearchText={(entry) => [entry.description, entry.tags.join(" "), entry.client ?? ""].join(" ")}
            getViewUrl={(entry) => `${CONFIG[kind].viewPath}/${encodeURIComponent(entry.slug)}`}
            onMove={!CONFIG[kind].dated ? moveEntry : undefined}
            onEdit={(entry) => startEdit(entry)}
            onPreview={(entry) => startEdit(entry, "view")}
            onDuplicate={duplicate}
            onDelete={(entry) => void handleDelete(entry)}
            onNew={startNew}
            newLabel={`New ${CONFIG[kind].singularLabel}`}
            toolbar={
              CONFIG[kind].hasLinkedInImport && !showLinkedInImport ? (
                <button
                  type="button"
                  onClick={() => setShowLinkedInImport(true)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-border text-muted hover:text-foreground rounded-lg text-sm font-medium transition-colors"
                >
                  <Linkedin size={16} />
                  Import from LinkedIn
                </button>
              ) : undefined
            }
            orderDirty={orderDirty}
            saving={saving}
            onSaveOrder={() => { if (entries) void commit([], entries, `content: reorder ${CONFIG[kind].label}`); }}
            onDiscardOrder={() => void load()}
          />
        </>
      )}
    </div>
  );
}

function FileThumb({ file }: { file: File }) {
  const src = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(src), [src]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-full w-full object-contain" />;
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
  onMove,
  onFileChange,
  onAddPaths,
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
  onMove?: (index: number, direction: -1 | 1) => void;
  onFileChange: (index: number, file: File | null) => void;
  /** Appends paths picked from the media library. */
  onAddPaths?: (paths: string[]) => void;
}) {
  const token = useAdminToken();
  const [notice, setNotice] = useState<string | null>(null);

  /** Optimizes the picked file; an image already on the site fills in its path instead of uploading again. */
  async function pickFile(index: number, list: FileList | null) {
    const picked = list?.[0];
    if (!picked) return;
    const [prepared] = await prepareImages([picked], token);
    if (prepared.existing) {
      onUpdate(index, prepared.existing);
      onFileChange(index, null);
      setNotice(reusedNotice(1));
    } else {
      onFileChange(index, prepared.file ?? null);
      setNotice(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <label className="block text-xs uppercase tracking-wide text-muted">{label}</label>
        <div className="flex items-center gap-3">
          {onAddPaths && <MediaPickerButton multiple onPick={onAddPaths} className="border-0 px-0 text-xs text-accent hover:text-accent-hover" />}
          <button onClick={onAdd} type="button" className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover capitalize">
            <Plus size={14} /> Add {itemName}
          </button>
        </div>
      </div>
      {notice && <p className="mb-2 text-xs text-accent">{notice}</p>}
      <div className="space-y-2">
        {images.map((image, index) => (
          <div key={index} className="flex items-start gap-2">
            {(files[index] || image) && (
              <span className="mt-1 h-12 w-12 shrink-0 overflow-hidden rounded border border-border bg-white">
                {files[index] ? (
                  <FileThumb file={files[index]!} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={stagedImageSrc(image)} alt="" className="h-full w-full object-contain" />
                )}
              </span>
            )}
            <div className="flex-1">
              <input value={image} onChange={(e) => onUpdate(index, e.target.value)} placeholder={placeholder} className={inputClass} />
              <label className={`${inputClass} mt-2 flex items-center gap-2 cursor-pointer`}>
                <Upload size={16} className="text-muted shrink-0" />
                <span className="truncate">{files[index]?.name ?? `Or upload a ${itemName}…`}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void pickFile(index, e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <div className="flex flex-col items-center gap-1">
              {onMove && (
                <>
                  <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Move ${itemName} ${index + 1} up`} className="p-1.5 text-muted hover:text-foreground disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => onMove(index, 1)} disabled={index === images.length - 1} aria-label={`Move ${itemName} ${index + 1} down`} className="p-1.5 text-muted hover:text-foreground disabled:opacity-30"><ArrowDown size={14} /></button>
                </>
              )}
              <button type="button" onClick={() => onRemove(index)} aria-label={`Remove ${itemName} ${index + 1}`} className="p-1.5 text-muted hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
            </div>
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
  dirty,
  fieldErrors,
  onDuplicate,
  coverImageFiles,
  onAddCoverFiles,
  onAddCoverPaths,
  onAddPhotoPaths,
  sectionImageFiles,
  photoFiles,
  inlineImageUrls,
  onAddInlineImage,
  onAddPhoto,
  onUpdatePhoto,
  onRemovePhoto,
  onPhotoFileChange,
  onAddCoverImage,
  onUpdateCoverImage,
  onRemoveCoverImage,
  onMoveCoverImage,
  onCoverImageFileChange,
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
  dirty: boolean;
  fieldErrors: FieldErrors;
  onDuplicate?: () => void;
  coverImageFiles: (File | null)[];
  onAddCoverFiles: (files: File[]) => void;
  onAddCoverPaths: (paths: string[]) => void;
  onAddPhotoPaths: (paths: string[]) => void;
  sectionImageFiles: (File | null)[][];
  photoFiles: (File | null)[];
  inlineImageUrls: Record<string, string>;
  onAddInlineImage: (file: File) => string;
  onAddPhoto: () => void;
  onUpdatePhoto: (index: number, value: string) => void;
  onRemovePhoto: (index: number) => void;
  onPhotoFileChange: (index: number, file: File | null) => void;
  onAddCoverImage: () => void;
  onUpdateCoverImage: (index: number, value: string) => void;
  onRemoveCoverImage: (index: number) => void;
  onMoveCoverImage: (index: number, direction: -1 | 1) => void;
  onCoverImageFileChange: (index: number, file: File | null) => void;
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
  const token = useAdminToken();
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

      <div data-field-error={fieldErrors.title ? "true" : undefined}>
        <label htmlFor="entry-title" className="block text-xs uppercase tracking-wide text-muted mb-1">
          Title <span className="text-red-400" aria-hidden="true">*</span>
        </label>
        <input
          id="entry-title"
          value={entry.title}
          onChange={(e) => setEntry({ ...entry, title: e.target.value })}
          onBlur={onTitleBlur}
          className={fieldClass(fieldErrors.title)}
        />
        {fieldErrors.title && <p role="alert" className="mt-1 text-xs text-red-400">{fieldErrors.title}</p>}
      </div>

      <div data-field-error={fieldErrors.slug ? "true" : undefined}>
        <label htmlFor="entry-slug" className="block text-xs uppercase tracking-wide text-muted mb-1">
          Slug <span className="text-red-400" aria-hidden="true">*</span>
        </label>
        <input
          id="entry-slug"
          value={entry.slug}
          onChange={(e) => setEntry({ ...entry, slug: slugify(e.target.value) })}
          className={fieldClass(fieldErrors.slug)}
        />
        {fieldErrors.slug ? (
          <p role="alert" className="mt-1 text-xs text-red-400">{fieldErrors.slug}</p>
        ) : (
          <p className="mt-1 text-xs text-muted">Page address: {CONFIG[kind].viewPath}/{entry.slug || "…"}</p>
        )}
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

      {kind !== "client" && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={entry.featured ?? false}
            onChange={(e) => setEntry({ ...entry, featured: e.target.checked })}
            className="w-4 h-4 accent-accent"
          />
          <span className="text-sm text-foreground">Featured (shown on the home page when published)</span>
        </label>
      )}

      <div>
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">
          Cover / Thumbnail Images
        </label>
        <label className={`${inputClass} flex items-center gap-2 cursor-pointer`}>
          <Upload size={16} className="text-muted shrink-0" />
          <span className="truncate">
            Choose one or more image files…
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              onAddCoverFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </label>
        <p className="text-muted text-xs mt-1">
          The first image is the default thumbnail. Use the arrows to change the order. Uploads are resized and converted to WebP.
        </p>
      </div>

      <ImageListField
        label="Image URLs and uploads"
        itemName="cover image"
        images={entry.coverImages}
        files={coverImageFiles}
        placeholder={`/images/${CONFIG[kind].imageFolder}/example.png`}
        emptyText="Add an image URL or upload files. Multiple images show gallery navigation."
        onAdd={onAddCoverImage}
        onUpdate={onUpdateCoverImage}
        onRemove={onRemoveCoverImage}
        onMove={onMoveCoverImage}
        onFileChange={onCoverImageFileChange}
        onAddPaths={onAddCoverPaths}
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
                            onChange={async (e) => {
                              const picked = e.target.files?.[0];
                              e.target.value = "";
                              if (!picked) return;
                              const [prepared] = await prepareImages([picked], token);
                              if (prepared.existing) onUpdateSectionImageUrl(i, j, prepared.existing);
                              onSectionImageFileChange(i, j, prepared.file ?? null);
                            }}
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
        label="Proof of Work Images"
        itemName="proof of work image"
        images={entry.proofOfWorkImages}
        files={photoFiles}
        placeholder={`/images/${CONFIG[kind].imageFolder}/example-photo.png`}
        emptyText="No proof of work images added."
        onAdd={onAddPhoto}
        onUpdate={onUpdatePhoto}
        onRemove={onRemovePhoto}
        onFileChange={onPhotoFileChange}
        onAddPaths={onAddPhotoPaths}
      />

      <div className="border-t border-border pt-4">
        <label className="block text-xs uppercase tracking-wide text-muted mb-1">Related Content</label>
        <RelatedMultiSelect
          value={entry}
          exclude={entry.slug ? `${kind}:${entry.slug}` : undefined}
          onChange={(refs) => setEntry({ ...entry, ...refs })}
        />
      </div>

      {kind === "project" && <ProjectLinkFields entry={entry} setEntry={setEntry} fieldErrors={fieldErrors} />}
      {kind === "client" && <ClientFields entry={entry} setEntry={setEntry} fieldErrors={fieldErrors} />}

      <FormActions saving={saving} dirty={dirty} onSave={onSave} onCancel={onCancel} onDuplicate={onDuplicate} />
    </div>
  );
}

type LinkFieldsProps = { entry: Entry; setEntry: (entry: Entry) => void; fieldErrors: FieldErrors };

function ClientFields({ entry, setEntry, fieldErrors }: LinkFieldsProps) {
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-accent">Client Details</h3>
      <div data-field-error={fieldErrors.url ? "true" : undefined}>
        <label htmlFor="client-url" className="block text-xs uppercase tracking-wide text-muted mb-1">Website URL</label>
        <input
          id="client-url"
          type="url"
          value={entry.url ?? ""}
          onChange={(e) => setEntry({ ...entry, url: e.target.value })}
          placeholder="https://example.com"
          className={fieldClass(fieldErrors.url)}
        />
        {fieldErrors.url && <p role="alert" className="mt-1 text-xs text-red-400">{fieldErrors.url}</p>}
      </div>
    </div>
  );
}

function ProjectLinkFields({ entry, setEntry, fieldErrors }: LinkFieldsProps) {
  const repositories = typeof entry.githubUrl === "object" ? entry.githubUrl : null;
  const fields = [
    {
      key: "live",
      label: "Live URL",
      value: entry.liveUrl ?? "",
      error: fieldErrors.liveUrl,
      onChange: (value: string) => setEntry({ ...entry, liveUrl: value }),
    },
    {
      key: "repository",
      label: "GitHub URL (single repo)",
      value: typeof entry.githubUrl === "string" ? entry.githubUrl : "",
      error: fieldErrors.githubUrl,
      onChange: (value: string) => setEntry({ ...entry, githubUrl: value }),
    },
    {
      key: "frontend",
      label: "GitHub Frontend URL",
      value: repositories?.frontend ?? "",
      error: fieldErrors.githubFrontend,
      onChange: (value: string) => setEntry({ ...entry, githubUrl: { ...repositories, frontend: value } }),
    },
    {
      key: "backend",
      label: "GitHub Backend URL",
      value: repositories?.backend ?? "",
      error: fieldErrors.githubBackend,
      onChange: (value: string) => setEntry({ ...entry, githubUrl: { ...repositories, backend: value } }),
    },
  ];

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-accent">Project Links</h3>
      <p className="text-xs text-muted">Use a single GitHub repository or separate frontend and backend repositories.</p>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} data-field-error={field.error ? "true" : undefined}>
            <label htmlFor={`project-${field.key}`} className="block text-xs uppercase tracking-wide text-muted mb-1">
              {field.label}
            </label>
            <input
              id={`project-${field.key}`}
              type="url"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder="https://…"
              className={fieldClass(field.error)}
            />
            {field.error && <p role="alert" className="mt-1 text-xs text-red-400">{field.error}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
