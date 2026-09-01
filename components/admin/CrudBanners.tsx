"use client";

import { ExternalLink } from "lucide-react";
import { REPO_ACTIONS_URL } from "@/components/admin/shared";

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center justify-between gap-4 px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg text-accent text-sm">
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
