import { Briefcase, Calendar } from "lucide-react";
import TrackedLink from "@/components/ui/TrackedLink";
import GlassCard from "@/components/ui/GlassCard";
import ThumbnailGallery from "@/components/ui/ThumbnailGallery";

export interface EmployerCardData {
  slug: string;
  name: string;
  role?: string;
  period?: string;
  images: string[];
}

/** Card on /employers — also rendered by the admin Experience live preview. */
export default function EmployerCard({ employer, linked = true }: { employer: EmployerCardData; linked?: boolean }) {
  return (
    <GlassCard className="relative h-full min-w-0 flex flex-col items-center group cursor-pointer">
      {linked && (
        <TrackedLink
          href={`/employers/${employer.slug}`}
          area="employer"
          label={employer.slug}
          className="absolute inset-0 z-10 rounded-xl"
          aria-label={`View ${employer.name}`}
        />
      )}
      <ThumbnailGallery
        images={employer.images}
        alt={employer.name}
        wrapperClassName="w-full h-28 overflow-hidden rounded-lg mb-4 bg-white/90"
        imgClassName="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        initials={employer.name.split(" ").slice(0, 2).map((word) => word[0]).join("")}
      />
      <h2 className="text-base font-semibold text-foreground text-center group-hover:text-accent transition-colors">
        {employer.name}
      </h2>
      {employer.role && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-accent text-center">
          <Briefcase size={12} className="shrink-0" />
          {employer.role}
        </p>
      )}
      {employer.period && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted text-center">
          <Calendar size={12} className="shrink-0" />
          {employer.period}
        </p>
      )}
    </GlassCard>
  );
}
