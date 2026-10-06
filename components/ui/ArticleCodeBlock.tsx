"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import powershell from "highlight.js/lib/languages/powershell";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("powershell", powershell);
hljs.registerLanguage("python", python);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

const LANGUAGE_ALIASES: Record<string, string> = {
  "c#": "csharp",
  cs: "csharp",
  js: "javascript",
  ts: "typescript",
  ps1: "powershell",
  pwsh: "powershell",
  shell: "bash",
  sh: "bash",
  html: "xml",
};

const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Bash",
  csharp: "C#",
  css: "CSS",
  html: "HTML",
  javascript: "JavaScript",
  json: "JSON",
  powershell: "PowerShell",
  python: "Python",
  sql: "SQL",
  typescript: "TypeScript",
  xml: "XML",
};

export default function ArticleCodeBlock({ code, language }: { code: string; language?: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const normalizedLanguage = language?.toLowerCase() ?? "";
  const highlighterLanguage = LANGUAGE_ALIASES[normalizedLanguage] ?? normalizedLanguage;
  const label = LANGUAGE_LABELS[normalizedLanguage] ?? LANGUAGE_LABELS[highlighterLanguage] ?? (language || "Plain text");
  let highlighted: string | null = null;

  if (hljs.getLanguage(highlighterLanguage)) {
    try {
      highlighted = hljs.highlight(code, { language: highlighterLanguage, ignoreIllegals: true }).value;
    } catch {
      // Unknown or malformed language definitions fall back to plain code.
    }
  }

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 2000);
  }

  return (
    <div className="article-code-block">
      <div className="article-code-header">
        <span className="article-code-language">{label}</span>
        <button type="button" onClick={() => void copyCode()} className="article-code-copy" aria-label="Copy code">
          {copyState === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          <span aria-live="polite">{copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy"}</span>
        </button>
      </div>
      <pre><code className={highlighted ? "hljs" : undefined}>{highlighted ? <span dangerouslySetInnerHTML={{ __html: highlighted }} /> : code}</code></pre>
    </div>
  );
}
