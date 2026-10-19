"use client";

import type { ReactNode } from "react";
import CertificationCard from "@/components/ui/CertificationCard";
import EmployerCard from "@/components/ui/EmployerCard";
import { stagedImageSrc } from "@/lib/adminStore";
import { slugify } from "@/components/admin/shared";

export type PreviewKind = "certification" | "employer";

type RawEntry = Record<string, unknown>;

const str = (value: unknown) => (typeof value === "string" ? value : "");
const list = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []);
/** Staged (unpublished) images aren't on the site yet — show them from the pending queue. */
const srcs = (paths: string[]) => paths.map((path) => stagedImageSrc(path) ?? path);

/** Renders the public component for an entry being edited, from the admin's form values. */
export function renderPreview(kind: PreviewKind, entry: RawEntry): ReactNode {
  if (kind === "certification") {
    const icon = str(entry.icon);
    return (
      <div className="max-w-[300px]">
        <CertificationCard
          linked={false}
          cert={{
            name: str(entry.name) || "Certificate name",
            issuer: str(entry.issuer) || "Issuer",
            date: str(entry.date),
            verifyUrl: str(entry.verifyUrl) || null,
            photos: srcs(list(entry.photos)),
            icon: icon ? stagedImageSrc(icon) : undefined,
            icons: entry.icons ? srcs(list(entry.icons)) : undefined,
          }}
        />
      </div>
    );
  }

  const name = str(entry.company) || "Company";
  return (
    <div className="max-w-[260px]">
      <EmployerCard
        linked={false}
        employer={{
          slug: slugify(name),
          name,
          role: str(entry.role),
          period: str(entry.period),
          images: srcs([str(entry.logo), ...list(entry.photos)].filter(Boolean)),
        }}
      />
      {str(entry.summary) && <p className="mt-3 text-sm text-muted">{str(entry.summary)}</p>}
    </div>
  );
}
