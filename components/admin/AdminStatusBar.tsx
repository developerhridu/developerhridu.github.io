"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckCircle2, ChevronDown, CircleAlert, ExternalLink, Loader2, Rocket, Trash2, Undo2 } from "lucide-react";
import {
  clearPending,
  discardPendingGroup,
  getDeploy,
  getLastCommit,
  getPending,
  getPublishMode,
  pendingGroups,
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
import PublishReview from "@/components/admin/PublishReview";

const EMPTY_PENDING: PendingState = { files: [], saves: [] };
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
 * Sticky bar above every admin tab: pending changes (review, publish, discard all or one
 * group), the publish mode switch, live deploy status, and Undo for the last CMS commit.
 */
export default function AdminStatusBar({
  token,
  restoredCount = 0,
  onContentChanged,
}: {
  token: string;
  /** Saves brought back from an earlier session, announced once. */
  restoredCount?: number;
  onContentChanged: () => void;
}) {
  const pending = useSyncExternalStore(subscribePending, getPending, () => EMPTY_PENDING);
  const mode = useSyncExternalStore(subscribePublishMode, getPublishMode, () => "batch" as const);
  const deploy = useSyncExternalStore(subscribeDeploy, getDeploy, () => IDLE_DEPLOY);
  const lastCommit = useSyncExternalStore(subscribeLastCommit, getLastCommit, () => null);
  const [busy, setBusy] = useState<"publish" | "undo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [restoredDismissed, setRestoredDismissed] = useState(false);

  const count = pending.files.length;
  const groups = pendingGroups(pending);

  async function run(kind: "publish" | "undo", action: () => Promise<unknown>) {
    setBusy(kind);
    setError(null);
    try {
      await action();
      setReviewing(false);
      onContentChanged();
    } catch (err) {
      setReviewing(false);
      setError(err instanceof GitHubApiError || err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  function openReview() {
    if (!confirmDiscardEdits()) return;
    setReviewing(true);
  }

  function discardAll() {
    if (!window.confirm(`Discard all ${pending.saves.length} pending save${pending.saves.length === 1 ? "" : "s"}? They were never published.`)) return;
    if (!confirmDiscardEdits()) return;
    clearPending();
    onContentChanged();
  }

  function discardGroup(path: string, saves: number) {
    if (!window.confirm(`Discard ${saves} pending save${saves === 1 ? "" : "s"} to ${describeFile(path)}?`)) return;
    if (!confirmDiscardEdits()) return;
    discardPendingGroup(path);
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
            <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-black">{pending.saves.length}</span>
            pending save{pending.saves.length === 1 ? "" : "s"} · {count} file{count === 1 ? "" : "s"}
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
              onClick={openReview}
              disabled={busy !== null}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            >
              {busy === "publish" ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
              Review &amp; publish
            </button>
            <button
              type="button"
              onClick={discardAll}
              disabled={busy !== null}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-red-400 disabled:opacity-50"
            >
              <Trash2 size={14} /> Discard all
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

      {restoredCount > 0 && !restoredDismissed && count > 0 && (
        <p role="status" className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent">
          Restored {restoredCount} unpublished save{restoredCount === 1 ? "" : "s"} from your last session.
          <button type="button" onClick={() => setRestoredDismissed(true)} className="text-xs hover:underline">
            Dismiss
          </button>
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {expanded && count > 0 && (
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface text-xs">
          {groups.map((group) => {
            const files = [...new Set(group.saves.flatMap((save) => save.paths))].filter((path) => path !== group.path);
            return (
              <li key={group.path} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{describeFile(group.path)}</p>
                  <ul className="mt-1 space-y-0.5 text-muted">
                    {group.saves.map((save, index) => (
                      <li key={index}>• {save.message.replace(/^content:\s*/, "")}</li>
                    ))}
                  </ul>
                  {files.length > 0 && (
                    <p className="mt-1 truncate text-muted" title={files.join("\n")}>
                      + {files.length} image{files.length === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => discardGroup(group.path, group.saves.length)}
                  disabled={busy !== null}
                  className="flex shrink-0 items-center gap-1 rounded border border-border px-2 py-1 text-muted hover:text-red-400 disabled:opacity-50"
                >
                  <Trash2 size={12} /> Discard
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {reviewing && (
        <PublishReview
          token={token}
          pending={pending}
          busy={busy === "publish"}
          onClose={() => setReviewing(false)}
          onConfirm={() => void run("publish", () => publishPending(token))}
        />
      )}
    </div>
  );
}
