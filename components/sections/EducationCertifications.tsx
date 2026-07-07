"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import Education from "@/components/sections/Education";
import Certifications from "@/components/sections/Certifications";

type Tab = "education" | "certifications";

const tabs: { id: Tab; label: string; number: string }[] = [
  { id: "education", label: "Education", number: "01" },
  { id: "certifications", label: "Training & Certifications", number: "02" },
];

export default function EducationCertifications() {
  const [activeTab, setActiveTab] = useState<Tab>("education");

  return (
    <section id="education-certifications" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          title="Education & Certifications"
          subtitle="My academic background and completed courses"
        />

        {/* Tab Bar */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex flex-wrap items-center gap-2 p-2 rounded-full border border-white/10 bg-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-3 rounded-full text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="education-cert-tab-pill"
                    className="absolute inset-0 rounded-full bg-violet-600"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative flex items-center gap-3">
                  {tab.label}
                  <span className={activeTab === tab.id ? "text-white/70" : "text-slate-500"}>
                    {tab.number}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <motion.div
          key={activeTab}
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
