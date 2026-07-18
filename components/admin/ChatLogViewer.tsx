"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import config from "@/content/config.json";
import { inputClass } from "@/components/admin/shared";

const WORKER_URL = config.aiChatWorkerUrl.replace(/\/$/, "");
const KEY_STORAGE = "worker_admin_key";

interface LogEntry {
  question: string;
  answer: string;
  timestamp: string;
}

export default function ChatLogViewer() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(KEY_STORAGE);
    if (saved) setAdminKey(saved);
  }, []);

  useEffect(() => {
    if (adminKey) void load(adminKey);
  }, [adminKey]);

  async function load(key: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${WORKER_URL}/logs`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.status === 401) {
        localStorage.removeItem(KEY_STORAGE);
        setAdminKey(null);
        setError("Key rejected. Paste the current Worker admin key.");
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

  function handleKeySubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    localStorage.setItem(KEY_STORAGE, trimmed);
    setAdminKey(trimmed);
    setKeyInput("");
  }

  if (!adminKey) {
    return (
      <div className="max-w-md">
        <p className="text-muted text-sm mb-4">
          Paste the AI Chat Worker&apos;s admin key to view visitor questions.
        </p>
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleKeySubmit} className="space-y-4">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Worker admin key"
            className={inputClass}
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted text-sm">
          Last {entries?.length ?? 0} visitor question{entries?.length === 1 ? "" : "s"}, newest first.
        </p>
        <button
          onClick={() => void load(adminKey)}
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
