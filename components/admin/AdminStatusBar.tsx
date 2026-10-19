"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckCircle2, ChevronDown, CircleAlert, ExternalLink, Loader2, Rocket, Trash2, Undo2 } from "lucide-react";
import {
  clearPending,
  getDeploy,
  getLastCommit,
  getPending,
  getPublishMode,
  setPublishMode,
  subscribeDeploy,
  subscribeLastCommit,
  subscribePending,
  subscribePublishMode,
  type DeployState,
  type PendingState,
} from "@/lib/adminStore";
import { GitHubApiError, publishPending, undoLastCommit } from "@/lib/github";
import { REPO_ACTIONS_URL } from "@/components/admin/shared";
import { confirmDiscardEdits } from "@/components/admin/useUnsavedGuard";

const EMPTY_PENDING: PendingState = { files: [], messages: [] };
const IDLE_DEPLOY: DeployState = { status: "idle" };

function describeFile(path: string): string {
  if (path.startsWith("public/")) return path.slice("public".length);
  return path.replace(/^content\//, "");
}

function DeployBadge({ deploy }: { deploy: DeployState }) {
  if (deploy.status === "idle") return null;
  const map = {
    queued: { icon: <Loader2 size={14} className="animate-spin" />, text: "Deploy queued…", tone: "text-muted" },
    building: { icon: <Loader2 size={14} className="animate-spin" />, text: "Building the site…", tone: "text-accent" },
    live: { icon: <CheckCircle2 size={14} />, text: "Live on the site", tone: "text-green-500" },
    failed: { icon: <CircleAlert size={14} />, text: "Deploy failed", tone: "text-red-400" },
    unknown: { icon: <CircleAlert size={14} />, text: "Deploy status unknown", tone: "text-muted" },
  } as const;
  const { icon, text, tone } = map[deploy.status];
  return (
    <a
      href={deploy.runUrl ?? REPO_ACTIONS_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={deploy.message}
      className={`flex items-center gap-1.5 text-xs font-medium hover:underline ${tone}`}
    >
      {icon} {text} <ExternalLink size={11} />
    </a>
  );
}

/**
 * Sticky bar above every admin tab: pending changes with Publish/Discard, the publish mode
 * switch, live deploy status, and Undo for the last CMS commit.
 */
export default function AdminStatusBar({ token, onContentChanged }: { token: string; onContentChanged: () => void }) {
  const pending = useSyncExternalStore(subscribePending, getPending, () => EMPTY_PENDING);
  const mode = useSyncExternalStore(subscribePublishMode, getPublishMode, () => "batch" as const);
  const deploy = useSyncExternalStore(subscribeDeploy, getDeploy, () => IDLE_DEPLOY);
  const lastCommit = useSyncExternalStore(subscribeLastCommit, getLastCommit, () => null);
  const [busy, setBusy] = useState<"publish" | "undo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const count = pending.files.length;

  async function run(kind: "publish" | "undo", action: () => Promise<unknown>) {
    setBusy(kind);
    setError(null);
    try {
      await action();
      onContentChanged();
    } catch (err) {
      setError(err instanceof GitHubApiError || err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  function publish() {
    if (!confirmDiscardEdits()) return;
    void run("publish", () => publishPending(token));
  }

  function discard() {
    if (!window.confirm(`Discard ${count} pending change${count === 1 ? "" : "s"}? They were never published.`)) return;
    if (!confirmDiscardEdits()) return;
    clearPending();
    onContentChanged();
  }

  function undo() {
    if (!lastCommit) return;
    const subject = lastCommit.message.split("\n")[0];
    if (!window.confirm(`Undo "${subject}"? This publishes a new commit that restores the previous version.`)) return;
    if (!confirmDiscardEdits()) return;
    void run("undo", () => undoLastCommit(token));
  }

  return (
    <div className="sticky top-16 z-30 mb-6 md:top-2">
      <div
        className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-2.5 text-sm shadow-sm backdrop-blur ${
          count > 0 ? "border-yellow-500/40 bg-yellow-500/10" : "border-border bg-surface/95"
        }`}
      >
        {count > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="flex items-center gap-1.5 font-medium text-foreground"
          >
            <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-black">{count}</span>
            pending change{count === 1 ? "" : "s"} · {pending.messages.length} save{pending.messages.length === 1 ? "" : "s"}
            <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <span className="text-muted">
            {mode === "batch" ? "No pending changes — saves wait here until you publish." : "Saves publish immediately."}
          </span>
        )}

        {count > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={publish}
              disabled={busy !== null}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            >
              {busy === "publish" ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
              Publish all
            </button>
            <button
              type="button"
              onClick={discard}
              disabled={busy !== null}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-red-400 disabled:opacity-50"
            >
              <Trash2 size={14} /> Discard
            </button>
          </div>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
          <DeployBadge deploy={deploy} />
          {lastCommit && count === 0 && (
            <button
              type="button"
              onClick={undo}
              disabled={busy !== null}
              title={`Undo: ${lastCommit.message.split("\n")[0]}`}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground disabled:opacity-50"
            >
              {busy === "undo" ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />} Undo last publish
            </button>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted" title="When on, every Save publishes and redeploys right away.">
            <input
              type="checkbox"
              checked={mode === "immediate"}
              onChange={(e) => setPublishMode(e.target.checked ? "immediate" : "batch")}
              className="h-3.5 w-3.5 accent-accent"
            />
            Publish on every save
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {expanded && count > 0 && (
        <div className="mt-2 grid gap-4 rounded-lg border border-border bg-surface p-4 text-xs sm:grid-cols-2">
          <div>
            <p className="mb-1 font-semibold uppercase tracking-wide text-muted">Saves</p>
            <ul className="space-y-0.5 text-foreground">
              {pending.messages.map((message, index) => (
                <li key={index}>• {message.replace(/^content:\s*/, "")}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 font-semibold uppercase tracking-wide text-muted">Files</p>
            <ul className="space-y-0.5">
              {pending.files.map((file) => (
                <li key={file.path} className={file.content === null ? "text-red-400 line-through" : "text-foreground"}>
                  {describeFile(file.path)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
