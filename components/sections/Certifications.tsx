"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Calendar, ExternalLink } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import certificationsData from "@/content/certifications.json";
import type { Certification } from "@/types";

interface CertificationsProps {
  showHeading?: boolean;
  noSection?: boolean;
}

export default function Certifications({ showHeading = true, noSection = false }: CertificationsProps) {
  const certifications = (certificationsData.certifications || []) as Certification[];

  if (certifications.length === 0) return null;

  const content = (
    <>
      {showHeading && (
        <SectionHeading
          eyebrow="Certifications"
          title="Training & Certifications"
          subtitle="Courses and certifications I've completed"
        />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {certifications.map((cert, idx) => (
          <motion.div
            key={cert.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
          >
            <GlassCard className="h-full">
              <div className="flex items-start gap-4">
                {cert.icons && cert.icons.length > 0 ? (
                  <div className="flex -space-x-2 shrink-0">
                    {cert.icons.map((icon) => (
                      <div
                        key={icon}
                        className="w-11 h-11 rounded-lg bg-white/90 border-2 border-background flex items-center justify-center p-2"
                      >
                        <img src={icon} alt={cert.issuer} className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                ) : cert.icon ? (
                  <div className="w-14 h-14 rounded-lg bg-white/90 flex items-center justify-center p-3 shrink-0">
                    <img src={cert.icon} alt={cert.issuer} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="p-3 bg-accent/10 rounded-lg shrink-0">
                    <BadgeCheck className="w-8 h-8 text-accent" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {cert.name}
                  </h3>
                  <p className="text-accent font-medium mb-3">
                    {cert.issuer}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{cert.date}</span>
                    </div>
                    {cert.verifyUrl && (
                      <a
                        href={cert.verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-accent hover:text-accent-hover transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Verify</span>
                      </a>
                    )}
                  </div>
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
