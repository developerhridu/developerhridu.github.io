"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { WORKER_URL } from "@/lib/workerUrl";

interface LogEntry {
  question: string;
  answer: string;
  timestamp: string;
}

interface ChatLogViewerProps {
  token: string;
  onAuthError: () => void;
}

export default function ChatLogViewer({ token, onAuthError }: ChatLogViewerProps) {
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
      const res = await fetch(`${WORKER_URL}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      if (res.status === 501) {
        setError("Logging isn't configured on the Worker yet — see worker/README.md.");
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted text-sm">
          Last {entries?.length ?? 0} visitor question{entries?.length === 1 ? "" : "s"}, newest first.
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
        <p className="text-muted text-sm">No questions logged yet.</p>
      )}

      {entries && entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <p className="text-xs text-muted mb-2">{new Date(entry.timestamp).toLocaleString()}</p>
              <p className="text-foreground font-medium mb-2">{entry.question}</p>
              <p className="text-muted text-sm">{entry.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
