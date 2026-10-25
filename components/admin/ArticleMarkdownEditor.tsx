"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type ClipboardEvent } from "react";
import dynamic from "next/dynamic";
import { Upload } from "lucide-react";
import rehypeSanitize from "rehype-sanitize";
import { defaultUrlTransform } from "react-markdown";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { optimizeImage } from "@/components/admin/shared";
import ImageZoomOverlay, { type ZoomImage } from "@/components/ui/ImageZoomOverlay";

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
  const [zoomImages, setZoomImages] = useState<ZoomImage[]>([]);
  const [zoomIndex, setZoomIndex] = useState(0);
  const zoomOpen = zoomImages.length > 0;

  function closeZoom() {
    setZoomImages([]);
  }

  /**
   * Collects the preview's images from the rendered DOM when one is clicked. Reading the
   * DOM rather than the Markdown source means raw HTML <img> tags work too, and
   * `currentSrc` resolves the blob: URLs of images that aren't published yet.
   */
  const openZoomFrom = useCallback((image: HTMLImageElement) => {
    const preview = image.closest(".wmde-markdown");
    const all = preview ? [...preview.querySelectorAll("img")] : [image];
    setZoomIndex(Math.max(0, all.indexOf(image)));
    setZoomImages(
      all.map((each) => ({
        src: each.currentSrc || each.src,
        alt: each.alt || "Preview image",
      })),
    );
  }, []);

  /**
   * Second, independent path to the same zoom. A document listener in the capture phase
   * runs before any handler in the editor can stop the event, covering the case where the
   * `components` override below never applies (raw HTML images, or a future version of the
   * editor rendering its preview differently). It stops the event, so only one fires.
   */
  useEffect(() => {
    function onClickCapture(event: globalThis.MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== "IMG" || target.closest("a")) return;
      const preview = target.closest(".wmde-markdown");
      // Only this editor's preview, not other images on the admin page.
      if (!preview || !editorRef.current?.contains(preview)) return;

      event.preventDefault();
      event.stopPropagation();
      openZoomFrom(target as HTMLImageElement);
    }

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [openZoomFrom]);

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
          components: {
            img: (props) => (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- this replaces Markdown's own <img>; alt comes from the Markdown
              <img
                {...props}
                onClick={(event) => {
                  // A linked image keeps its link rather than zooming.
                  if (event.currentTarget.closest("a")) return;
                  event.preventDefault();
                  event.stopPropagation();
                  openZoomFrom(event.currentTarget);
                }}
              />
            ),
          },
        }}
        textareaProps={{ "aria-label": label, placeholder }}
      />

      {/* Portaled to the body: an ancestor with a transform or overflow would otherwise
          clip or mis-position a `fixed` overlay rendered inside the editor. */}
      {zoomOpen && (
        <ImageZoomOverlay
          images={zoomImages}
          index={zoomIndex}
          onIndexChange={setZoomIndex}
          onClose={closeZoom}
        />
      )}
    </div>
  );
}
