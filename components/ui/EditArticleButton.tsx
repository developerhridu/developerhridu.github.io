"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { TOKEN_CHANGED_EVENT, TOKEN_KEY } from "@/components/admin/shared";

type ArticleKind = "blog" | "case-study" | "project";

const ADMIN_TABS: Record<ArticleKind, string> = {
  blog: "blog",
  "case-study": "case-study",
  project: "projects",
};

export default function EditArticleButton({ kind, slug }: { kind: ArticleKind; slug: string }) {
  const [hasValidToken, setHasValidToken] = useState(false);

  useEffect(() => {
    let controller: AbortController | undefined;

    async function validateToken() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setHasValidToken(false);

      try {
        const token = localStorage.getItem(TOKEN_KEY)?.trim();
        if (!token) return;

        const response = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          cache: "no-store",
          signal: request.signal,
        });

        if (!request.signal.aborted) {
          setHasValidToken(response.ok && localStorage.getItem(TOKEN_KEY)?.trim() === token);
        }
      } catch {
        if (!request.signal.aborted) setHasValidToken(false);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === TOKEN_KEY || event.key === null) void validateToken();
    }

    void validateToken();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(TOKEN_CHANGED_EVENT, validateToken);
    window.addEventListener("focus", validateToken);
    return () => {
      controller?.abort();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(TOKEN_CHANGED_EVENT, validateToken);
      window.removeEventListener("focus", validateToken);
    };
  }, []);

  if (!hasValidToken) return null;

  const params = new URLSearchParams({ tab: ADMIN_TABS[kind], slug });
  return (
    <Link
      href={`/admin?${params.toString()}`}
      className="inline-flex items-center gap-2 rounded-lg border border-accent/40 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
    >
      <Pencil size={16} aria-hidden="true" />
      Edit
    </Link>
  );
}
