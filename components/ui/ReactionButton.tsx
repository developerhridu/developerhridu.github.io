"use client";

import { useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";
import config from "@/content/config.json";

const WORKER_URL = config.aiChatWorkerUrl.replace(/\/$/, "");

interface ReactionButtonProps {
  type: "blog" | "case-study";
  slug: string;
}

export default function ReactionButton({ type, slug }: ReactionButtonProps) {
  const [count, setCount] = useState<number | null>(null);
  const [reacted, setReacted] = useState(false);
  const [loading, setLoading] = useState(false);
  const storageKey = `reacted:${type}:${slug}`;

  useEffect(() => {
    if (!WORKER_URL) return;
    setReacted(localStorage.getItem(storageKey) === "1");
    fetch(`${WORKER_URL}/reactions?type=${type}&slug=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { count?: number } | null) => {
        if (typeof data?.count === "number") setCount(data.count);
      })
      .catch(() => {});
  }, [type, slug, storageKey]);

  async function toggle() {
    if (!WORKER_URL || loading) return;
    setLoading(true);
    const nextReacted = !reacted;
    try {
      const res = await fetch(`${WORKER_URL}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, slug, action: nextReacted ? "add" : "remove" }),
      });
      if (res.ok) {
        const data = (await res.json()) as { count?: number };
        if (typeof data.count === "number") setCount(data.count);
        setReacted(nextReacted);
        if (nextReacted) localStorage.setItem(storageKey, "1");
        else localStorage.removeItem(storageKey);
      }
    } catch {
      // Reactions are a nice-to-have — never block or error the page.
    } finally {
      setLoading(false);
    }
  }

  if (count === null) return null;

  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <p className="text-sm text-muted">Was this helpful?</p>
      <button
        onClick={() => void toggle()}
        disabled={loading}
        aria-pressed={reacted}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors disabled:opacity-50 ${
          reacted
            ? "bg-accent text-accent-foreground border-accent"
            : "border-border text-muted hover:text-foreground hover:border-accent/40"
        }`}
      >
        <ThumbsUp size={16} fill={reacted ? "currentColor" : "none"} />
        {count.toLocaleString()} {count === 1 ? "person" : "people"} found this helpful
      </button>
    </div>
  );
}
