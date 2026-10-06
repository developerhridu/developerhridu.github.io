"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import useValidGitHubToken from "@/components/ui/useValidGitHubToken";

const PAGE_TABS: Record<string, string> = {
  "/about": "profile",
  "/blog": "blog",
  "/case-studies": "case-study",
  "/certifications": "certifications",
  "/contact": "profile",
  "/experience": "experience",
  "/projects": "projects",
  "/resume": "profile",
  "/services": "services",
  "/testimonials": "testimonials",
  "/testimonials/submit": "ui-strings",
};

const ADD_ROUTES = new Set(["/blog", "/case-studies", "/certifications", "/experience", "/projects", "/services"]);

function ValidatedEditButton({ tab, canAdd }: { tab: string; canAdd: boolean }) {
  const hasValidToken = useValidGitHubToken();

  if (!hasValidToken) return null;

  return (
    <div className="absolute right-4 top-20 z-20 flex gap-2 sm:right-6 md:top-6 print:hidden">
      {canAdd && (
        <Link
          href={`/admin?${new URLSearchParams({ tab, action: "new" })}`}
          className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-background/90 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
        >
          <Plus size={16} aria-hidden="true" />
          Add
        </Link>
      )}
      <Link
        href={`/admin?${new URLSearchParams({ tab })}`}
        className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-background/90 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
      >
        <Pencil size={16} aria-hidden="true" />
        Edit
      </Link>
    </div>
  );
}

export default function EditPageButton() {
  const pathname = usePathname();
  const tab = PAGE_TABS[pathname];

  return tab ? <ValidatedEditButton tab={tab} canAdd={ADD_ROUTES.has(pathname)} /> : null;
}
