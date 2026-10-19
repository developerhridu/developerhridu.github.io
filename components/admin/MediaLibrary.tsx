"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Images, RefreshCw, Search, X } from "lucide-react";
import { listRepoImages, type RepoImage } from "@/lib/github";
import { gitBlobSha, inputClass, optimizeImage } from "@/components/admin/shared";

const AdminTokenContext = createContext<string | null>(null);

/** Gives deeply nested admin widgets (image pickers) the GitHub token without prop drilling. */
export function AdminTokenProvider({ token, children }: { token: string; children: ReactNode }) {
  return <AdminTokenContext.Provider value={token}>{children}</AdminTokenContext.Provider>;
}

export function useAdminToken(): string | null {
  return useContext(AdminTokenContext);
}

let libraryCache: Promise<RepoImage[]> | null = null;

function loadLibrary(token: string, force = false): Promise<RepoImage[]> {
  if (!libraryCache || force) {
    libraryCache = listRepoImages(token).catch((err) => {
      libraryCache = null;
      throw err;
    });
  }
  return libraryCache;
}

export interface PreparedImage {
  /** File to upload (already optimized) — absent when an identical image is already in the repo. */
  file?: File;
  /** Public path of the identical image already in the repo. */
  existing?: string;
}

/**
 * Optimizes picked images and swaps any that already exist in the repo (byte-identical,
 * before or after optimization) for the existing path, so the same picture isn't stored twice.
 */
export async function prepareImages(files: File[], token: string | null): Promise<PreparedImage[]> {
  let bySha = new Map<string, string>();
  if (token) {
    try {
      bySha = new Map((await loadLibrary(token)).map((image) => [image.sha, image.path]));
    } catch {
      // Library unavailable — upload without the duplicate check.
    }
  }
  return Promise.all(
    files.map(async (original) => {
      const originalMatch = bySha.size ? bySha.get(await gitBlobSha(original)) : undefined;
      if (originalMatch) return { existing: originalMatch };
      const optimized = await optimizeImage(original);
      const optimizedMatch = bySha.size && optimized !== original ? bySha.get(await gitBlobSha(optimized)) : undefined;
      return optimizedMatch ? { existing: optimizedMatch } : { file: optimized };
    })
  );
}

/** Optimizes + dedupes a single picked file (logo/avatar inputs). */
export async function prepareImage(files: FileList | null, token: string | null): Promise<PreparedImage | null> {
  const file = files?.[0];
  if (!file) return null;
  return (await prepareImages([file], token))[0];
}

export function reusedNotice(count: number): string {
  return count === 1
    ? "That image is already on the site, so the existing copy was reused."
    : `${count} images are already on the site, so the existing copies were reused.`;
}

function MediaPickerDialog({
  multiple,
  onClose,
  onPick,
}: {
  multiple: boolean;
  onClose: () => void;
  onPick: (paths: string[]) => void;
}) {
  const token = useAdminToken();
  const [images, setImages] = useState<RepoImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

  function refresh(force: boolean) {
    if (!token) return;
    setError(null);
    loadLibrary(token, force)
      .then(setImages)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Couldn't load images."));
  }

  useEffect(() => {
    refresh(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const folders = useMemo(
    () => [...new Set((images ?? []).map((image) => image.path.split("/")[2]).filter(Boolean))].sort(),
    [images]
  );
  const visible = (images ?? []).filter(
    (image) =>
      (folder === "all" || image.path.split("/")[2] === folder) &&
      image.path.toLowerCase().includes(query.trim().toLowerCase())
  );

  function toggle(path: string) {
    if (!multiple) {
      onPick([path]);
      return;
    }
    setSelected((previous) => (previous.includes(path) ? previous.filter((p) => p !== path) : [...previous, path]));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose an existing image"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Images size={18} className="text-accent" /> Media library
          </h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => refresh(true)} aria-label="Refresh" className="p-2 text-muted hover:text-foreground">
              <RefreshCw size={16} />
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-muted hover:text-foreground">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-3 border-b border-border px-5 py-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by file name…"
              className={`${inputClass} pl-9 py-2`}
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["all", ...folders].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setFolder(name)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  folder === name ? "bg-accent text-accent-foreground" : "border border-border text-muted hover:text-foreground"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!images && !error && <p className="text-sm text-muted">Loading images…</p>}
          {images && visible.length === 0 && <p className="text-sm text-muted">No images match.</p>}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {visible.map((image) => {
              const isSelected = selected.includes(image.path);
              return (
                <button
                  key={image.path}
                  type="button"
                  onClick={() => toggle(image.path)}
                  title={image.path}
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-white transition-colors ${
                    isSelected ? "border-accent" : "border-transparent hover:border-accent/50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.path} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1 py-0.5 text-[10px] text-white">
                    {image.path.split("/").pop()}
                  </span>
                  {isSelected && (
                    <span className="absolute right-1 top-1 rounded-full bg-accent p-0.5 text-accent-foreground">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {multiple && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
            <span className="text-sm text-muted">{selected.length} selected</span>
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => onPick(selected)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            >
              Add {selected.length || ""} image{selected.length === 1 ? "" : "s"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** "Choose existing" button that opens the media library and returns the picked public paths. */
export function MediaPickerButton({
  multiple = false,
  onPick,
  label = "Choose existing",
  className = "",
}: {
  multiple?: boolean;
  onPick: (paths: string[]) => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 text-sm text-muted hover:border-accent/40 hover:text-foreground ${className}`}
      >
        <Images size={14} /> {label}
      </button>
      {open && (
        <MediaPickerDialog
          multiple={multiple}
          onClose={() => setOpen(false)}
          onPick={(paths) => {
            setOpen(false);
            onPick(paths);
          }}
        />
      )}
    </>
  );
}
