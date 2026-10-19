"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, CircleHelp, CornerDownRight, ExternalLink, Link2, Loader2 } from "lucide-react";
import { checkLinks, extractLinks, type LinkReport } from "@/lib/linkCheck";
import { listRepoImages } from "@/lib/github";
import { useAdminToken } from "@/components/admin/MediaLibrary";

const STATE_UI = {
  ok: { icon: CheckCircle2, tone: "text-green-500", label: "OK" },
  redirect: { icon: CornerDownRight, tone: "text-accent", label: "Redirect" },
  unknown: { icon: CircleHelp, tone: "text-yellow-500", label: "Unclear" },
  broken: { icon: CircleAlert, tone: "text-red-400", label: "Broken" },
} as const;

/** "Check links" for the entry being edited: external URLs, site pages and image paths. */
export default function LinkCheckPanel({ entry }: { entry: unknown }) {
  const token = useAdminToken();
  const [reports, setReports] = useState<LinkReport[] | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!token) return;
    setRunning(true);
    setError(null);
    try {
      const links = extractLinks(entry);
      const images = links.some((link) => link.kind === "image")
        ? new Set((await listRepoImages(token)).map((image) => image.path))
        : new Set<string>();
      setReports(await checkLinks(links, token, images));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Link check failed.");
    } finally {
      setRunning(false);
    }
  }

  const broken = reports?.filter((report) => report.state === "broken").length ?? 0;

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-accent">Links</h3>
        <button
          type="button"
          onClick={() => void run()}
          disabled={running}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:border-accent/40 hover:text-foreground disabled:opacity-50"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
          {reports ? "Check again" : "Check links"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {reports && reports.length === 0 && <p className="text-xs text-muted">No links in this entry.</p>}
      {reports && reports.length > 0 && (
        <>
          <p className={`text-xs ${broken ? "text-red-400" : "text-green-500"}`}>
            {broken ? `${broken} broken of ${reports.length} links.` : `All ${reports.length} links look fine.`}
          </p>
          <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border text-xs">
            {reports.map((report) => {
              const ui = STATE_UI[report.state];
              const Icon = ui.icon;
              return (
                <li key={report.url} className="flex items-start gap-2 px-3 py-2">
                  <Icon size={14} className={`mt-0.5 shrink-0 ${ui.tone}`} aria-label={ui.label} />
                  <div className="min-w-0 flex-1">
                    <a href={report.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 break-all text-foreground hover:underline">
                      {report.url} <ExternalLink size={10} className="shrink-0" />
                    </a>
                    <p className="text-muted">{report.kind === "page" ? "Site page" : report.kind === "image" ? "Image" : "External"} · {report.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
