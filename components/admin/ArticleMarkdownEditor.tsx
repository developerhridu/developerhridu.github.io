"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import rehypeSanitize from "rehype-sanitize";
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

export default function ArticleMarkdownEditor({
  value,
  onChange,
  label,
  height = 420,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  height?: number;
  placeholder?: string;
}) {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, getServerTheme);

  return (
    <div data-color-mode={theme} className="article-markdown-editor">
      <MDEditor
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        height={height}
        visibleDragbar
        previewOptions={{ rehypePlugins: [rehypeSanitize] }}
        textareaProps={{ "aria-label": label, placeholder }}
      />
    </div>
  );
}
