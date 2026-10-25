"use client";

import { motion } from "framer-motion";
import CertificationCard from "@/components/ui/CertificationCard";
import SectionHeading from "@/components/ui/SectionHeading";
import certificationsData from "@/content/certifications.json";
import { getSectionCopy } from "@/lib/sections";
import { isPublished } from "@/lib/published";
import type { Certification } from "@/types";
import { PAGE_CONTAINER } from "@/components/ui/PageContainer";

interface CertificationsProps {
  showHeading?: boolean;
  noSection?: boolean;
  /** "h1" when this section is the whole page, so the page has one top-level heading. */
  headingAs?: "h1" | "h2";
}

export default function Certifications({ showHeading = true, noSection = false, headingAs = "h2" }: CertificationsProps) {
  const certifications = ((certificationsData.certifications || []) as Certification[]).filter(isPublished);
  const sectionCopy = getSectionCopy("certifications");

  if (certifications.length === 0) return null;

  const content = (
    <>
      {showHeading && (
        <SectionHeading
            as={headingAs}
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
      <div className={PAGE_CONTAINER}>{content}</div>
    </section>
  );
}
