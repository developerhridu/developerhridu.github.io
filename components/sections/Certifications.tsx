"use client";

import { motion } from "framer-motion";
import CertificationCard from "@/components/ui/CertificationCard";
import SectionHeading from "@/components/ui/SectionHeading";
import certificationsData from "@/content/certifications.json";
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
            <CertificationCard cert={cert} />
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
