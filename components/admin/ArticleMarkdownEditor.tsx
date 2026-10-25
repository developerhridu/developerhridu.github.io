"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type ClipboardEvent } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import rehypeSanitize from "rehype-sanitize";
import { defaultUrlTransform } from "react-markdown";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { optimizeImage } from "@/components/admin/shared";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted">Loading editor…</div>,
});

function subscribeToTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function getServerTheme(): "dark" {
  return "dark";
}

function subscribeToDesktop(callback: () => void) {
  const media = window.matchMedia("(min-width: 1024px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getIsDesktop() {
  return window.matchMedia("(min-width: 1024px)").matches;
}

function getServerIsDesktop() {
  return false;
}

/** One image in the live preview, collected from the rendered DOM when a zoom opens. */
interface PreviewImage {
  src: string;
  alt: string;
}

export default function ArticleMarkdownEditor({
  value,
  onChange,
  label,
  height = 600,
  desktopHeight = 820,
  placeholder,
  onAddImage,
  inlineImageUrls,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  height?: number;
  desktopHeight?: number;
  placeholder?: string;
  onAddImage: (file: File) => string;
  inlineImageUrls: Record<string, string>;
}) {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, getServerTheme);
  const isDesktop = useSyncExternalStore(subscribeToDesktop, getIsDesktop, getServerIsDesktop);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [imageError, setImageError] = useState<string | null>(null);
  /** Images in the preview at the moment of the click, and which one is shown. */
  const [zoomImages, setZoomImages] = useState<PreviewImage[]>([]);
  const [zoomIndex, setZoomIndex] = useState(0);
  const zoomOpen = zoomImages.length > 0;
  const zoomed = zoomImages[zoomIndex];

  const moveZoom = useCallback((direction: -1 | 1) => {
    setZoomIndex((index) => (index + direction + zoomImages.length) % zoomImages.length);
  }, [zoomImages.length]);

  function closeZoom() {
    setZoomImages([]);
  }

  /**
   * Opens a full view when a preview image is clicked. The images are read from the
   * rendered DOM rather than through a `previewOptions.components` override: that way
   * inline blob: URLs for not-yet-published uploads and plain HTML <img> tags both work,
   * and @uiw/react-md-editor's own sanitization and URL handling are left untouched.
   *
   * Listening on the document in the capture phase, instead of with React's onClick, is
   * what makes it fire at all — the editor stops click events inside its preview, so a
   * bubbling handler on the wrapper never sees them.
   */
  useEffect(() => {
    function onClickCapture(event: globalThis.MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== "IMG") return;
      // Only images in this editor's preview, not elsewhere on the admin page.
      const preview = target.closest(".wmde-markdown");
      if (!preview || !editorRef.current?.contains(preview)) return;
      if (target.closest("a")) return; // A linked image keeps its link.

      event.preventDefault();
      event.stopPropagation();

      const all = [...preview.querySelectorAll("img")];
      const images = all.map((image) => ({
        // currentSrc resolves srcset and blob: URLs to what the browser actually loaded.
        src: image.currentSrc || image.src,
        alt: image.alt || "Preview image",
      }));
      setZoomIndex(Math.max(0, all.indexOf(target as HTMLImageElement)));
      setZoomImages(images);
    }

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, []);

  useEffect(() => {
    if (!zoomOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeZoom();
      if (zoomImages.length > 1 && event.key === "ArrowRight") {
        event.preventDefault();
        moveZoom(1);
      }
      if (zoomImages.length > 1 && event.key === "ArrowLeft") {
        event.preventDefault();
        moveZoom(-1);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [zoomOpen, zoomImages.length, moveZoom]);

  function chooseImage() {
    const textarea = editorRef.current?.querySelector("textarea");
    selectionRef.current = textarea
      ? { start: textarea.selectionStart, end: textarea.selectionEnd }
      : { start: value.length, end: value.length };
    fileInputRef.current?.click();
  }

  async function insertImage(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    await insertFile(picked);
  }

  /** Pasting a screenshot uploads it (optimized) and drops a Markdown image at the cursor. */
  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const item = [...event.clipboardData.items].find((entry) => entry.kind === "file" && entry.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (!file) return;
    event.preventDefault();
    const textarea = editorRef.current?.querySelector("textarea");
    selectionRef.current = textarea
      ? { start: textarea.selectionStart, end: textarea.selectionEnd }
      : { start: value.length, end: value.length };
    // Clipboard images are all called "image.png"; the saved path gets a unique id either way.
    const named = file.name && file.name !== "image.png" ? file : new File([file], "pasted-image.png", { type: file.type });
    void insertFile(named);
  }

  async function insertFile(picked: File) {
    try {
      const file = await optimizeImage(picked);
      const path = onAddImage(file);
      const alt = picked.name.replace(/\.[^.]+$/, "").replace(/[\[\]\\]/g, "").trim() || "Image";
      const markdown = `![${alt}](${path})`;
      const { start, end } = selectionRef.current;
      onChange(value.slice(0, start) + markdown + value.slice(end));
      setImageError(null);
      requestAnimationFrame(() => {
        const textarea = editorRef.current?.querySelector("textarea");
        textarea?.focus();
        textarea?.setSelectionRange(start + markdown.length, start + markdown.length);
      });
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Could not add this image.");
    }
  }

  return (
    <div
      ref={editorRef}
      data-color-mode={theme}
      onPaste={handlePaste}
      className="article-markdown-editor w-full min-w-0"
    >
      <div className="mb-2 flex items-center justify-end gap-3">
        <span className="text-xs text-muted">Tip: paste a screenshot straight into the text.</span>
        <button type="button" onClick={chooseImage} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-accent hover:bg-surface-hover">
          <Upload size={14} aria-hidden="true" /> Insert local image
        </button>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="hidden" aria-label="Choose an image for the article" onChange={(event) => void insertImage(event)} />
      </div>
      {imageError && <p role="alert" className="mb-2 text-xs text-red-400">{imageError}</p>}
      <MDEditor
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        height={isDesktop ? desktopHeight : height}
        visibleDragbar
        previewOptions={{
          rehypePlugins: [rehypeSanitize],
          urlTransform: (url) => inlineImageUrls[url] ?? defaultUrlTransform(url),
        }}
        textareaProps={{ "aria-label": label, placeholder }}
      />

      {/* Portaled to the body: an ancestor with a transform or overflow would otherwise
          clip or mis-position a `fixed` overlay rendered inside the editor. */}
      {zoomOpen && zoomed && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Full image: ${zoomed.alt}`}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          onClick={closeZoom}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
          <button
            type="button"
            onClick={closeZoom}
            aria-label="Close full image"
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface/80 text-foreground transition-colors hover:bg-surface"
          >
            <X size={20} />
          </button>
          {zoomImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); moveZoom(-1); }}
                aria-label="Previous image"
                className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-surface/80 text-foreground hover:bg-surface"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); moveZoom(1); }}
                aria-label="Next image"
                className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-surface/80 text-foreground hover:bg-surface"
              >
                <ChevronRight size={24} />
              </button>
              <span className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-surface/80 px-3 py-1 text-xs text-muted">
                {zoomIndex + 1} / {zoomImages.length}
              </span>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element -- the src comes from the rendered preview (often a blob: URL) and has no known size */}
          <img
            src={zoomed.src}
            alt={zoomed.alt}
            className="relative max-h-full max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>,
        document.body,
      )}
    </div>
  );
}
