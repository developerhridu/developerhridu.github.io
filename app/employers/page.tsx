import { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Calendar } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import ThumbnailGallery from "@/components/ui/ThumbnailGallery";
import { coverImages } from "@/lib/coverImages";
import SectionHeading from "@/components/ui/SectionHeading";
import { getPublishedEmployers } from "@/lib/employers";
import { getSeo } from "@/lib/seo";
import { getSectionCopy } from "@/lib/sections";

export const metadata: Metadata = getSeo("employers");

export default function EmployersPage() {
  const employers = getPublishedEmployers();
  const sectionCopy = getSectionCopy("employers");

  return (
    <div className="pt-16 md:pt-0">
      <section id="employers" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow={sectionCopy.eyebrow} title={sectionCopy.title} subtitle={sectionCopy.subtitle} />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {employers.map((employer) => (
              <GlassCard key={employer.id} className="relative h-full min-w-0 flex flex-col items-center group cursor-pointer">
                  <Link href={`/employers/${employer.slug}`} className="absolute inset-0 z-10 rounded-xl" aria-label={`View ${employer.name}`} />
                  <ThumbnailGallery
                    images={[...coverImages(employer), ...employer.proofOfWorkImages]}
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
