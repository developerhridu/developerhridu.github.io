"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import useValidGitHubToken from "@/components/ui/useValidGitHubToken";

type ArticleKind = "blog" | "case-study" | "project" | "client";

const ADMIN_TABS: Record<ArticleKind, string> = {
  blog: "blog",
  "case-study": "case-study",
  project: "projects",
  client: "clients",
};

export default function EditArticleButton({ kind, slug }: { kind: ArticleKind; slug: string }) {
  const hasValidToken = useValidGitHubToken();

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
