"use client";

import { ExternalLink, RefreshCw } from "lucide-react";
import { REPO_ACTIONS_URL } from "@/components/admin/shared";
import { CONFLICT_MESSAGE } from "@/lib/github";

export function ErrorBanner({ message, onReload }: { message: string | null; onReload?: () => void }) {
  if (!message) return null;
  // Callers pass the error's message text, so this compares against the same constant the
  // commit layer throws — isConflictError() is for the Error object itself.
  const conflict = message.startsWith(CONFLICT_MESSAGE);
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
      <span className="min-w-0 flex-1">
        {conflict && <strong className="block text-red-300">Someone else changed this</strong>}
        {message}
      </span>
      {conflict && onReload && (
        <button
          type="button"
          onClick={onReload}
          className="flex items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10"
        >
          <RefreshCw size={12} /> Reload
        </button>
      )}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="mb-4 flex items-center justify-between gap-4 px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg text-accent text-sm">
      <span>{message}</span>
      <a
        href={REPO_ACTIONS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 whitespace-nowrap hover:underline"
      >
        View Actions <ExternalLink size={12} />
      </a>
    </div>
  );
}
