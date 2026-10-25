"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Eye } from "lucide-react";
import { WORKER_URL } from "@/lib/workerUrl";
import { TOKEN_KEY, TOKEN_CHANGED_EVENT } from "@/components/admin/shared";

/**
 * Whether an admin token is present, read as external state rather than copied into
 * component state inside an effect (which triggers a second render pass before paint).
 */
function subscribeToToken(onChange: () => void) {
  window.addEventListener(TOKEN_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(TOKEN_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function hasToken(): boolean {
  try {
    return !!localStorage.getItem(TOKEN_KEY);
  } catch {
    return false;
  }
}

/** The server has no localStorage, so the count is hidden until hydration says otherwise. */
function hasTokenOnServer(): boolean {
  return false;
}

interface ViewCounterProps {
  type: "blog" | "case-study";
  slug: string;
}

export default function ViewCounter({ type, slug }: ViewCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const isOwner = useSyncExternalStore(subscribeToToken, hasToken, hasTokenOnServer);

  useEffect(() => {
    // Tracking runs for every visitor regardless of who's viewing — only the
    // rendered count below is restricted to the site owner.
    if (!WORKER_URL) return;
    const storageKey = `viewed:${type}:${slug}`;
    const alreadyViewed = localStorage.getItem(storageKey) === "1";
    const query = `type=${encodeURIComponent(type)}&slug=${encodeURIComponent(slug)}`;

    async function run() {
      try {
        const res = alreadyViewed
          ? await fetch(`${WORKER_URL}/views?${query}`)
          : await fetch(`${WORKER_URL}/views`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type, slug }),
            });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (typeof data.count === "number") setCount(data.count);
        if (!alreadyViewed) localStorage.setItem(storageKey, "1");
      } catch {
        // Fail silently — a view counter should never break the page.
      }
    }
    void run();
  }, [type, slug]);

  if (count === null || !isOwner) return null;

  return (
    <span className="flex items-center gap-2">
      <Eye size={16} />
      {count.toLocaleString()} {count === 1 ? "view" : "views"}
    </span>
  );
}
