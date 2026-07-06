"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Calendar, ExternalLink } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import certificationsData from "@/content/certifications.json";
import type { Certification } from "@/types";

interface CertificationsProps {
  showHeading?: boolean;
}

export default function Certifications({ showHeading = true }: CertificationsProps) {
  const certifications = (certificationsData.certifications || []) as Certification[];

  if (certifications.length === 0) return null;

  return (
    <section id="certifications" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {showHeading && (
          <SectionHeading
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
                  <div className="p-3 bg-violet-500/20 rounded-lg">
                    <BadgeCheck className="w-8 h-8 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {cert.name}
                    </h3>
                    <p className="text-violet-400 font-medium mb-3">
                      {cert.issuer}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{cert.date}</span>
                      </div>
                      {cert.verifyUrl && (
                        <a
                          href={cert.verifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors"
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
      </div>
    </section>
  );
}
