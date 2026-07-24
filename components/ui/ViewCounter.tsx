"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { WORKER_URL } from "@/lib/workerUrl";
import { TOKEN_KEY } from "@/components/admin/shared";

interface ViewCounterProps {
  type: "blog" | "case-study";
  slug: string;
}

export default function ViewCounter({ type, slug }: ViewCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    setIsOwner(!!localStorage.getItem(TOKEN_KEY));
  }, []);

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
