"use client";

import { useEffect, useState } from "react";
import { FileJson, ImageIcon, Loader2, Rocket, X } from "lucide-react";
import { decodeStagedText, fetchPublishedFile } from "@/lib/github";
import { diffContent, type FileDiff } from "@/lib/contentDiff";
import { stagedImageSrc, type PendingState } from "@/lib/adminStore";

interface ReviewedFile {
  path: string;
  kind: "content" | "image" | "other";
  status: "added" | "changed" | "deleted";
  diff?: FileDiff;
  error?: string;
}

const KIND_STYLES = {
  added: "bg-green-500/10 text-green-500 border-green-500/30",
  changed: "bg-accent/10 text-accent border-accent/30",
  removed: "bg-red-500/10 text-red-400 border-red-500/30",
  deleted: "bg-red-500/10 text-red-400 border-red-500/30",
} as const;

function Badge({ kind }: { kind: keyof typeof KIND_STYLES }) {
  return (
    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${KIND_STYLES[kind]}`}>
      {kind}
    </span>
  );
}

function Value({ value }: { value: string | null }) {
  if (value === null || value === "") return <span className="italic text-muted">empty</span>;
  return <span className="break-words">{value.length > 220 ? `${value.slice(0, 220)}…` : value}</span>;
}

/** "Review before publishing": per-file, per-entry diff of the pending queue against the live site. */
export default function PublishReview({
  token,
  pending,
  busy,
  onClose,
  onConfirm,
}: {
  token: string;
  pending: PendingState;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [files, setFiles] = useState<ReviewedFile[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      pending.files.map(async (file): Promise<ReviewedFile> => {
        const kind = file.path.endsWith(".json") ? "content" : file.path.startsWith("public/images/") ? "image" : "other";
        try {
          const live = await fetchPublishedFile(file.path, token);
          const status = file.content === null ? "deleted" : live ? "changed" : "added";
          if (kind !== "content" || file.content === null) return { path: file.path, kind, status };
          return { path: file.path, kind, status, diff: diffContent(live?.content ?? null, decodeStagedText(file.content)) };
        } catch (err) {
          return { path: file.path, kind, status: "changed", error: err instanceof Error ? err.message : "Couldn't compare." };
        }
      })
    ).then((result) => {
      if (!cancelled) setFiles(result);
    });
    return () => {
      cancelled = true;
    };
  }, [pending, token]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const contentFiles = files?.filter((file) => file.kind !== "image") ?? [];
  const images = files?.filter((file) => file.kind === "image") ?? [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => !busy && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Review changes before publishing"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-foreground">Review before publishing</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="p-2 text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
          {!files && (
            <p className="flex items-center gap-2 text-muted">
              <Loader2 size={16} className="animate-spin" /> Comparing with the live site…
            </p>
          )}

          {contentFiles.map((file) => (
            <section key={file.path} className="rounded-lg border border-border">
              <header className="flex items-center gap-2 border-b border-border px-4 py-2">
                <FileJson size={16} className="text-accent" />
                <span className="font-medium text-foreground">{file.path.replace(/^content\//, "")}</span>
                {file.status !== "changed" && <Badge kind={file.status} />}
                {file.diff?.reordered && <span className="text-xs text-muted">· order changed</span>}
              </header>
              <div className="divide-y divide-border">
                {file.error && <p className="px-4 py-3 text-red-400">{file.error}</p>}
                {file.diff && file.diff.entries.length === 0 && !file.diff.reordered && (
                  <p className="px-4 py-3 text-muted">No visible changes (formatting only).</p>
                )}
                {file.diff?.entries.map((entry, index) => (
                  <div key={`${entry.label}-${index}`} className="px-4 py-3">
                    <p className="mb-2 flex items-center gap-2 font-medium text-foreground">
                      <Badge kind={entry.kind} /> <span className="truncate">{entry.label}</span>
                    </p>
                    {entry.kind === "changed" && (
                      <ul className="space-y-1.5 text-xs">
                        {entry.fields.slice(0, 12).map((field) => (
                          <li key={field.field} className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)]">
                            <span className="font-mono text-muted">{field.field}</span>
                            <span>
                              <span className="text-red-400 line-through decoration-red-400/50"><Value value={field.before} /></span>
                              <span className="mx-1.5 text-muted">→</span>
                              <span className="text-green-500"><Value value={field.after} /></span>
                            </span>
                          </li>
                        ))}
                        {entry.fields.length > 12 && <li className="text-muted">…and {entry.fields.length - 12} more fields</li>}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {images.length > 0 && (
            <section className="rounded-lg border border-border">
              <header className="flex items-center gap-2 border-b border-border px-4 py-2">
                <ImageIcon size={16} className="text-accent" />
                <span className="font-medium text-foreground">Images</span>
              </header>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                {images.map((file) => {
                  const publicPath = file.path.slice("public".length);
                  return (
                    <figure key={file.path} className="space-y-1">
                      <div className="aspect-square overflow-hidden rounded border border-border bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={stagedImageSrc(publicPath)} alt="" className={`h-full w-full object-contain ${file.status === "deleted" ? "opacity-40" : ""}`} />
                      </div>
                      <figcaption className="flex items-center gap-1 text-[11px]">
                        <Badge kind={file.status} />
                        <span className="truncate text-muted">{publicPath.split("/").pop()}</span>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <span className="text-xs text-muted">
            {pending.saves.length} save{pending.saves.length === 1 ? "" : "s"} · {pending.files.length} file{pending.files.length === 1 ? "" : "s"} · one deploy
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground">
              Keep editing
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy || !files}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />} Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
