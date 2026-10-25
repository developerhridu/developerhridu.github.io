"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import Education from "@/components/sections/Education";
import Certifications from "@/components/sections/Certifications";
import uiStrings from "@/content/ui-strings.json";
import { getSectionCopy } from "@/lib/sections";

type Tab = "education" | "certifications";

const tabs: { id: Tab; label: string; number: string }[] = [
  {
    id: "certifications",
    label: uiStrings.educationCertifications.tabCertificationsLabel,
    number: uiStrings.educationCertifications.tabCertificationsNumber,
  },
  {
    id: "education",
    label: uiStrings.educationCertifications.tabEducationLabel,
    number: uiStrings.educationCertifications.tabEducationNumber,
  },
];

export default function EducationCertifications() {
  const [activeTab, setActiveTab] = useState<Tab>("certifications");
  const sectionCopy = getSectionCopy("education-certifications");

  return (
    <section id="education-certifications" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow={sectionCopy.eyebrow}
          title={sectionCopy.title}
          subtitle={sectionCopy.subtitle}
        />

        {/* Tab bar: an even two-column control on phones (the long label would otherwise wrap
            the pill onto two ragged rows), and the centred lozenge from `sm` up. */}
        <div className="flex justify-center mb-10 sm:mb-12">
          <div
            role="tablist"
            aria-label={sectionCopy.title}
            className="grid w-full max-w-md grid-cols-2 gap-1.5 rounded-2xl border border-border bg-surface p-1.5 sm:inline-flex sm:w-auto sm:max-w-none sm:items-center sm:gap-2 sm:rounded-full sm:p-2"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`edu-cert-tab-${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls="edu-cert-panel"
                onClick={() => setActiveTab(tab.id)}
                className={`relative rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors sm:rounded-full sm:px-6 sm:py-3 sm:text-sm ${
                  activeTab === tab.id ? "text-accent-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="education-cert-tab-pill"
                    className="absolute inset-0 rounded-xl bg-accent sm:rounded-full"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative flex items-center justify-center gap-1.5 sm:gap-3">
                  {tab.label}
                  <span className={activeTab === tab.id ? "text-accent-foreground/70" : "text-muted"}>
                    {tab.number}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <motion.div
          key={activeTab}
          id="edu-cert-panel"
          role="tabpanel"
          aria-labelledby={`edu-cert-tab-${activeTab}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "education" ? (
            <Education showHeading={false} noSection />
          ) : (
            <Certifications showHeading={false} noSection />
          )}
        </motion.div>
      </div>
    </section>
  );
}
