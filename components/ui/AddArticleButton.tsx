"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import useValidGitHubToken from "@/components/ui/useValidGitHubToken";

type ArticleKind = "blog" | "case-study" | "project";

const ADMIN_TABS: Record<ArticleKind, string> = {
  blog: "blog",
  "case-study": "case-study",
  project: "projects",
};

export default function AddArticleButton({ kind }: { kind: ArticleKind }) {
  const hasValidToken = useValidGitHubToken();
  if (!hasValidToken) return null;

  const params = new URLSearchParams({ tab: ADMIN_TABS[kind], action: "new" });
  return (
    <div className="mb-6 flex justify-end">
      <Link
        href={`/admin?${params.toString()}`}
        className="inline-flex items-center gap-2 rounded-lg border border-accent/40 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
      >
        <Plus size={16} aria-hidden="true" />
        Add
      </Link>
    </div>
  );
}
