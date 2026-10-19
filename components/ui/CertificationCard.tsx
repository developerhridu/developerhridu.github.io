"use client";

import Image from "next/image";
import { BadgeCheck, Calendar, ExternalLink } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import ThumbnailGallery from "@/components/ui/ThumbnailGallery";
import TrackedLink from "@/components/ui/TrackedLink";
import uiStrings from "@/content/ui-strings.json";
import type { Certification } from "@/types";

/** One certificate card — used by the Certifications section and the admin live preview. */
export default function CertificationCard({
  cert,
  linked = true,
}: {
  cert: Pick<Certification, "name" | "issuer" | "date" | "verifyUrl" | "photos" | "icon" | "icons">;
  /** False in the admin preview, so clicking the card doesn't navigate away. */
  linked?: boolean;
}) {
  const clickable = linked && !!cert.verifyUrl;
  const icons = cert.icons ?? (cert.icon ? [cert.icon] : []);

  return (
    <GlassCard
      animate={false}
      className={`group relative h-full !p-0 overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10 ${
        clickable ? "cursor-pointer" : ""
      }`}
    >
      {clickable && (
        <TrackedLink
          href={cert.verifyUrl!}
          area="verify"
          label={cert.name}
          target="_blank"
          aria-label={`Verify ${cert.name} (opens in a new tab)`}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-accent"
        />
      )}
      <div className="relative">
        {cert.photos && cert.photos.length > 0 ? (
          <ThumbnailGallery
            images={cert.photos}
            alt={cert.name || "Certificate"}
            wrapperClassName="w-full aspect-[4/3] overflow-hidden bg-white"
            imgClassName="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-accent/20 via-accent/5 to-transparent">
            <BadgeCheck className="w-14 h-14 text-accent/70" />
          </div>
        )}

        <div className="absolute -bottom-6 left-4 z-30 flex -space-x-2 pointer-events-none">
          {icons.map((icon) => (
            <div
              key={icon}
              className="w-12 h-12 rounded-xl bg-white shadow-lg ring-4 ring-surface flex items-center justify-center p-2"
            >
              <div className="relative w-full h-full">
                <Image src={icon} alt={cert.issuer} fill sizes="32px" className="object-contain" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pt-9 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-1">{cert.issuer}</p>
        <h3 className="text-base font-bold leading-snug text-foreground line-clamp-2 mb-4">{cert.name}</h3>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted">
            <Calendar className="w-3.5 h-3.5" />
            {cert.date}
          </span>
          {cert.verifyUrl && (
            <span
              aria-hidden="true"
              className="flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-medium text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
            >
              {uiStrings.certifications.verify}
              <ExternalLink className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
