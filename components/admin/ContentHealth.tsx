"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, FileWarning, ImageOff, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { listRepoImages } from "@/lib/github";
import { loadAdminContent } from "@/components/admin/adminContent";
import { findIssues, type Issue } from "@/components/admin/healthRules";
import type { SearchTarget } from "@/components/admin/AdminSearch";


const GROUP_ORDER = ["Broken images", "Missing details", "SEO text", "Drafts"];
const SEVERITY_UI = {
  error: { icon: ImageOff, tone: "text-red-400" },
  warning: { icon: TriangleAlert, tone: "text-yellow-500" },
  info: { icon: FileWarning, tone: "text-muted" },
} as const;

export default function ContentHealth({ token, onOpen }: { token: string; onOpen?: (target: SearchTarget) => void }) {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>("Broken images");

  async function scan() {
    setIssues(null);
    setError(null);
    try {
      const [content, images] = await Promise.all([loadAdminContent(token), listRepoImages(token)]);
      setIssues(findIssues(content.items, new Set(images.map((image) => image.path))));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't scan content.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadAdminContent(token), listRepoImages(token)])
      .then(([content, images]) => {
        if (!cancelled) setIssues(findIssues(content.items, new Set(images.map((image) => image.path))));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't scan content.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const groups = GROUP_ORDER.map((group) => ({ group, items: (issues ?? []).filter((issue) => issue.group === group) })).filter(
    (group) => group.items.length > 0
  );
  const problems = (issues ?? []).filter((issue) => issue.severity !== "info").length;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Content health</p>
        <button type="button" onClick={() => void scan()} className="flex items-center gap-1 text-xs text-muted hover:text-foreground">
          <RefreshCw size={12} /> Re-scan
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!issues && !error && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> Checking every entryâ€¦
        </p>
      )}
      {issues && groups.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-green-500">
          <CheckCircle2 size={16} /> Everything looks good.
        </p>
      )}
      {issues && groups.length > 0 && (
        <>
          <p className={`mb-3 flex items-center gap-2 text-sm ${problems ? "text-yellow-500" : "text-muted"}`}>
            {problems ? <CircleAlert size={16} /> : <CheckCircle2 size={16} className="text-green-500" />}
            {problems ? `${problems} thing${problems === 1 ? "" : "s"} to fix` : "No problems â€” just notes"}
          </p>
          <div className="divide-y divide-border rounded-lg border border-border">
            {groups.map(({ group, items }) => (
              <div key={group}>
                <button
                  type="button"
                  onClick={() => setOpen(open === group ? null : group)}
                  aria-expanded={open === group}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-surface"
                >
                  {group}
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">{items.length}</span>
                </button>
                {open === group && (
                  <ul className="divide-y divide-border border-t border-border">
                    {items.map((issue, index) => {
                      const { icon: Icon, tone } = SEVERITY_UI[issue.severity];
                      return (
                        <li key={index}>
                          <button
                            type="button"
                            onClick={() => onOpen?.(issue.item.open)}
                            className="flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface"
                          >
                            <Icon size={14} className={`mt-0.5 shrink-0 ${tone}`} />
                            <span className="min-w-0">
                              <span className="font-medium text-foreground">{issue.item.label}</span>
                              <span className="text-muted"> Â· {issue.item.source.tabLabel}</span>
                              <span className="block text-xs text-muted">{issue.message}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
