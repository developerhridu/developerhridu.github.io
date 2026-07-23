"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import config from "@/content/config.json";

const WORKER_URL = config.aiChatWorkerUrl.replace(/\/$/, "");

interface LogEntry {
  query: string;
  resultCount: number;
  timestamp: string;
}

interface SearchLogViewerProps {
  token: string;
  onAuthError: () => void;
}

export default function SearchLogViewer({ token, onAuthError }: SearchLogViewerProps) {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${WORKER_URL}/search-log`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      if (res.status === 501) {
        setError("Search logging isn't configured on the Worker yet — see worker/README.md.");
        return;
      }
      if (!res.ok) {
        setError(`Request failed (${res.status}).`);
        return;
      }
      const data = (await res.json()) as { entries: LogEntry[] };
      setEntries(data.entries ?? []);
    } catch {
      setError("Couldn't reach the Worker. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const noResultCount = entries?.filter((e) => e.resultCount === 0).length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted text-sm">
          Last {entries?.length ?? 0} search{entries?.length === 1 ? "" : "es"}, newest first
          {noResultCount > 0 && (
            <span className="text-yellow-500"> · {noResultCount} found nothing</span>
          )}
          .
        </p>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted hover:text-foreground rounded-lg text-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && !entries && <p className="text-muted text-sm">Loading…</p>}

      {entries && entries.length === 0 && !loading && (
        <p className="text-muted text-sm">No searches logged yet.</p>
      )}

      {entries && entries.length > 0 && (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left font-medium text-muted px-4 py-3">Query</th>
                <th className="text-left font-medium text-muted px-4 py-3">Results</th>
                <th className="text-left font-medium text-muted px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 text-foreground font-medium">{entry.query}</td>
                  <td className="px-4 py-3">
                    {entry.resultCount === 0 ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                        No matches
                      </span>
                    ) : (
                      <span className="text-muted">{entry.resultCount}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
