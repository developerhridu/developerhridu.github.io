"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Check, Copy, FolderPlus, Loader2, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { commitFiles, fetchContentFile, GitHubApiError, listRepoImages, type FileChange, type RepoImage } from "@/lib/github";
import { getPending, stagedImageSrc, subscribePending, type PendingState } from "@/lib/adminStore";
import { fileToBase64, inputClass, savedMessage, slugify } from "@/components/admin/shared";
import { prepareImages, reusedNotice } from "@/components/admin/MediaLibrary";
import { loadAdminContent, referencedImages } from "@/components/admin/adminContent";
import { ErrorBanner, SuccessBanner } from "@/components/admin/CrudBanners";

const EMPTY: PendingState = { files: [], saves: [] };
/** Content files outside the editable lists that can still point at images. */
const EXTRA_FILES = ["content/profile.json", "content/seo.json"];

interface MediaItem {
  path: string;
  size: number;
  pending: "added" | null;
}

function folderOf(publicPath: string): string {
  return publicPath.split("/").slice(2, -1).join("/");
}

function formatSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "Used 3×" (hover lists where) or "Unused", in the image tile's top-right corner. */
function UsageBadge({ uses }: { uses: string[] }) {
  const unique = [...new Set(uses)];
  return (
    <span
      title={unique.length ? `Used by:\n${unique.join("\n")}` : "Not used by any content — safe to delete"}
      className={`absolute right-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
        unique.length ? "bg-accent text-accent-foreground" : "bg-black/60 text-white"
      }`}
    >
      {unique.length ? `Used ${unique.length}×` : "Unused"}
    </span>
  );
}

/** Folder-by-folder view of public/images: upload into a folder, delete images, copy paths. */
export default function MediaManager({ token, onAuthError }: { token: string; onAuthError: () => void }) {
  const pending = useSyncExternalStore(subscribePending, getPending, () => EMPTY);
  const [repoImages, setRepoImages] = useState<RepoImage[] | null>(null);
  const [folder, setFolder] = useState("all");
  const [newFolder, setNewFolder] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  /** image path → entries that use it ("Certifications: SQL (Advanced)"…); null while loading. */
  const [usage, setUsage] = useState<Map<string, string[]> | null>(null);

  /** Scans all content (pending edits included) once and indexes which entries use each image. */
  async function scanUsage(): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    const add = (path: string, who: string) => map.set(path, [...(map.get(path) ?? []), who]);
    const { items: content } = await loadAdminContent(token);
    for (const item of content) for (const path of referencedImages(item.raw)) add(path, `${item.source.tabLabel}: ${item.label}`);
    for (const file of EXTRA_FILES) {
      try {
        const { content: text } = await fetchContentFile(file, token);
        for (const path of referencedImages(JSON.parse(text))) add(path, file.replace("content/", ""));
      } catch {
        // Missing file — nothing to count.
      }
    }
    return map;
  }

  useEffect(() => {
    let cancelled = false;
    scanUsage().then((map) => !cancelled && setUsage(map), () => !cancelled && setUsage(new Map()));
    return () => {
      cancelled = true;
    };
    // Re-scan when pending changes move (a save may add or drop a reference).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, pending]);

  function handleError(err: unknown) {
    if (err instanceof GitHubApiError && (err.status === 401 || err.status === 403)) onAuthError();
    else setError(err instanceof Error ? err.message : "Something went wrong.");
  }

  async function load() {
    setError(null);
    try {
      setRepoImages(await listRepoImages(token));
    } catch (err) {
      handleError(err);
    }
  }

  useEffect(() => {
    let cancelled = false;
    listRepoImages(token)
      .then((images) => !cancelled && setRepoImages(images))
      .catch((err: unknown) => !cancelled && handleError(err));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /** Repo images with pending uploads added and pending deletes removed. */
  const items = useMemo<MediaItem[]>(() => {
    const staged = new Map(pending.files.filter((f) => f.path.startsWith("public/images/")).map((f) => [f.path.slice("public".length), f]));
    const list: MediaItem[] = (repoImages ?? [])
      .filter((image) => staged.get(image.path)?.content !== null)
      .map((image) => ({ path: image.path, size: image.size, pending: null }));
    const known = new Set(list.map((item) => item.path));
    for (const [path, file] of staged) {
      if (file.content !== null && !known.has(path)) list.push({ path, size: Math.round((file.content.length * 3) / 4), pending: "added" });
    }
    return list.sort((a, b) => a.path.localeCompare(b.path));
  }, [repoImages, pending]);

  const folders = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(folderOf(item.path), (counts.get(folderOf(item.path)) ?? 0) + 1);
    return [...counts].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const visible = items.filter(
    (item) => (folder === "all" || folderOf(item.path) === folder) && item.path.toLowerCase().includes(query.trim().toLowerCase())
  );
  const uploadFolder = folder === "all" ? "" : folder;

  function createFolder() {
    const name = newFolder
      .split("/")
      .map((part) => slugify(part))
      .filter(Boolean)
      .join("/");
    if (!name) return;
    setFolder(name);
    setNewFolder("");
    setSuccess(`Folder "${name}" selected — upload images to create it.`);
  }

  async function upload(list: FileList | null) {
    const files = Array.from(list ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0 || !uploadFolder) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const prepared = await prepareImages(files, token);
      const taken = new Set(items.map((item) => item.path));
      const changes: FileChange[] = [];
      for (const item of prepared) {
        if (!item.file) continue;
        const ext = item.file.name.split(".").pop()?.toLowerCase() || "png";
        const base = slugify(item.file.name.replace(/\.[^.]+$/, "")) || "image";
        let name = `${base}.${ext}`;
        for (let n = 2; taken.has(`/images/${uploadFolder}/${name}`); n++) name = `${base}-${n}.${ext}`;
        taken.add(`/images/${uploadFolder}/${name}`);
        changes.push({ path: `public/images/${uploadFolder}/${name}`, content: await fileToBase64(item.file) });
      }
      const reused = prepared.length - changes.length;
      if (changes.length > 0) {
        await commitFiles(changes, `content: add ${changes.length} image${changes.length === 1 ? "" : "s"} to ${uploadFolder}`, token);
      }
      setSuccess(
        [changes.length ? `${changes.length} image${changes.length === 1 ? "" : "s"} added to ${uploadFolder}. ${savedMessage()}` : "", reused ? reusedNotice(reused) : ""]
          .filter(Boolean)
          .join(" ")
      );
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  /** Entries that still point at `path` (fresh scan), so deleting doesn't silently break pages. */
  async function usagesOf(path: string): Promise<string[]> {
    return (await scanUsage()).get(path) ?? [];
  }

  async function remove(item: MediaItem) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const uses = await usagesOf(item.path);
      const warning = uses.length
        ? `\n\nStill used by:\n• ${uses.slice(0, 8).join("\n• ")}${uses.length > 8 ? `\n…and ${uses.length - 8} more` : ""}\n\nThose pages will show a broken image.`
        : "";
      if (!window.confirm(`Delete ${item.path}?${warning}`)) return;
      await commitFiles([{ path: `public${item.path}`, content: null }], `content: delete image ${item.path.split("/").pop()}`, token);
      setSuccess(`Deleted ${item.path}. ${savedMessage()}`);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function copyPath(path: string) {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(path);
      setTimeout(() => setCopied((current) => (current === path ? null : current)), 1500);
    } catch {
      setError("Couldn't copy — select the path and copy it manually.");
    }
  }

  return (
    <div>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[["all", items.length] as const, ...folders].map(([name, count]) => (
          <button
            key={name}
            type="button"
            onClick={() => setFolder(name)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              folder === name ? "bg-accent text-accent-foreground" : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {name} <span className="opacity-70">{count}</span>
          </button>
        ))}
        {folder !== "all" && !folders.some(([name]) => name === folder) && (
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{folder} (new)</span>
        )}
        <button type="button" onClick={() => void load()} aria-label="Refresh" className="ml-auto p-2 text-muted hover:text-foreground">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search file names…" className={`${inputClass} py-2 pl-8 text-sm`} />
        </div>
        <div className="flex gap-2">
          <input
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
            placeholder="new-folder"
            aria-label="New folder name"
            className={`${inputClass} w-36 py-2 text-sm`}
          />
          <button type="button" onClick={createFolder} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 text-sm text-muted hover:text-foreground">
            <FolderPlus size={14} /> Folder
          </button>
        </div>
        <label
          className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${
            uploadFolder && !busy ? "cursor-pointer bg-accent text-accent-foreground hover:bg-accent-hover" : "cursor-not-allowed bg-surface text-muted"
          }`}
          title={uploadFolder ? `Upload to /images/${uploadFolder}` : "Pick a folder first"}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploadFolder ? `Upload to ${uploadFolder}` : "Pick a folder to upload"}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={!uploadFolder || busy}
            className="hidden"
            onChange={(e) => {
              void upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {!repoImages && !error && <p className="text-sm text-muted">Loading images…</p>}
      {repoImages && visible.length === 0 && <p className="text-sm text-muted">No images here yet.</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {visible.map((item) => (
          <figure key={item.path} className="group overflow-hidden rounded-lg border border-border bg-surface">
            <div className="relative aspect-square bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={stagedImageSrc(item.path)} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
              {item.pending && (
                <span className="absolute left-1 top-1 rounded bg-yellow-500 px-1.5 py-0.5 text-[10px] font-semibold text-black">Pending</span>
              )}
              {usage && <UsageBadge uses={usage.get(item.path) ?? usage.get(decodeURI(item.path)) ?? []} />}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-black/70 p-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                <button type="button" onClick={() => void copyPath(item.path)} aria-label={`Copy path of ${item.path}`} className="p-1 text-white">
                  {copied === item.path ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button type="button" onClick={() => void remove(item)} disabled={busy} aria-label={`Delete ${item.path}`} className="p-1 text-red-300 hover:text-red-400 disabled:opacity-40">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <figcaption className="px-2 py-1.5 text-[11px]">
              <span className="block truncate text-foreground" title={item.path}>{item.path.split("/").pop()}</span>
              <span className="text-muted">{folder === "all" ? `${folderOf(item.path)} · ` : ""}{formatSize(item.size)}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
