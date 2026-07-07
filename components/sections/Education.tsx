"use client";

import { motion } from "framer-motion";
import { GraduationCap, MapPin, Calendar, Award } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import educationData from "@/content/education.json";
import type { Education as EducationType } from "@/types";

interface EducationProps {
  showHeading?: boolean;
  noSection?: boolean;
}

export default function Education({ showHeading = true, noSection = false }: EducationProps) {
  const education = (educationData.education || []) as EducationType[];

  if (education.length === 0) return null;

  const content = (
    <>
      {showHeading && (
        <SectionHeading
          title="Education"
          subtitle="My academic background and qualifications"
        />
      )}

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {education.map((edu, idx) => (
          <motion.div
            key={edu.institution}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <GlassCard className="h-full">
              <div className="flex items-start gap-4">
                {edu.icon ? (
                  <div className="w-14 h-14 rounded-lg bg-white/90 flex items-center justify-center p-3 shrink-0">
                    <img src={edu.icon} alt={edu.institution} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="p-3 bg-violet-500/20 rounded-lg shrink-0">
                    <GraduationCap className="w-8 h-8 text-violet-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {edu.degree}
                  </h3>
                  <p className="text-violet-400 font-medium mb-3">
                    {edu.institution}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{edu.period}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{edu.location}</span>
                    </div>
                    {edu.cgpa && (
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-yellow-400" />
                        <span>CGPA: {edu.cgpa}</span>
                      </div>
                    )}
                  </div>

                  {edu.achievements && edu.achievements.length > 0 && (
                    <ul className="space-y-2">
                      {edu.achievements.map((achievement, aIdx) => (
                        <li
                          key={aIdx}
                          className="flex items-start gap-2 text-sm text-slate-400"
                        >
                          <span className="text-violet-400 mt-1">-</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
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
    <section id="education" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">{content}</div>
    </section>
  );
}
