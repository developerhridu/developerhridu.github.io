"use client";

import { useRef, useState, useSyncExternalStore, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import { Upload } from "lucide-react";
import rehypeSanitize from "rehype-sanitize";
import { defaultUrlTransform } from "react-markdown";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

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

  function chooseImage() {
    const textarea = editorRef.current?.querySelector("textarea");
    selectionRef.current = textarea
      ? { start: textarea.selectionStart, end: textarea.selectionEnd }
      : { start: value.length, end: value.length };
    fileInputRef.current?.click();
  }

  function insertImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const path = onAddImage(file);
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[\[\]\\]/g, "").trim() || "Image";
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
    <div ref={editorRef} data-color-mode={theme} className="article-markdown-editor w-full min-w-0">
      <div className="mb-2 flex justify-end">
        <button type="button" onClick={chooseImage} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-accent hover:bg-surface-hover">
          <Upload size={14} aria-hidden="true" /> Insert local image
        </button>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="hidden" aria-label="Choose an image for the article" onChange={insertImage} />
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
    </div>
  );
}
