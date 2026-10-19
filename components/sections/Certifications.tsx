"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { BadgeCheck, Calendar, ExternalLink } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import ThumbnailGallery from "@/components/ui/ThumbnailGallery";
import SectionHeading from "@/components/ui/SectionHeading";
import certificationsData from "@/content/certifications.json";
import uiStrings from "@/content/ui-strings.json";
import { getSectionCopy } from "@/lib/sections";
import { isPublished } from "@/lib/published";
import type { Certification } from "@/types";

interface CertificationsProps {
  showHeading?: boolean;
  noSection?: boolean;
}

export default function Certifications({ showHeading = true, noSection = false }: CertificationsProps) {
  const certifications = ((certificationsData.certifications || []) as Certification[]).filter(isPublished);
  const sectionCopy = getSectionCopy("certifications");

  if (certifications.length === 0) return null;

  const content = (
    <>
      {showHeading && (
        <SectionHeading
          eyebrow={sectionCopy.eyebrow}
          title={sectionCopy.title}
          subtitle={sectionCopy.subtitle}
        />
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {certifications.map((cert, idx) => (
          <motion.div
            key={cert.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
          >
            <GlassCard
              animate={false}
              className="group h-full !p-0 overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10"
            >
              <div className="relative">
                {cert.photos && cert.photos.length > 0 ? (
                  <ThumbnailGallery
                    images={cert.photos}
                    alt={cert.name}
                    wrapperClassName="w-full aspect-[4/3] overflow-hidden bg-white"
                    imgClassName="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-accent/20 via-accent/5 to-transparent">
                    <BadgeCheck className="w-14 h-14 text-accent/70" />
                  </div>
                )}

                <div className="absolute -bottom-6 left-4 z-30 flex -space-x-2">
                  {(cert.icons ?? (cert.icon ? [cert.icon] : [])).map((icon) => (
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
                <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-1">
                  {cert.issuer}
                </p>
                <h3 className="text-base font-bold leading-snug text-foreground line-clamp-2 mb-4">
                  {cert.name}
                </h3>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                  <span className="flex items-center gap-1.5 text-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    {cert.date}
                  </span>
                  {cert.verifyUrl && (
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-medium text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {uiStrings.certifications.verify}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </>
  );

  if (noSection) return content;

  return (
    <section id="certifications" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">{content}</div>
    </section>
  );
}
