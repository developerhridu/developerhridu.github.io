"use client";

import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import experienceData from "@/content/experience.json";

interface ExperienceProps {
  showHeading?: boolean;
}

export default function Experience({ showHeading = true }: ExperienceProps) {
  const experiences = experienceData.experiences;

  return (
    <section id="experience" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {showHeading && (
          <SectionHeading
            title="Experience"
            subtitle="My professional journey and the roles I've held"
          />
        )}

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 md:left-1/2 transform md:-translate-x-px h-full w-0.5 bg-gradient-to-b from-violet-500 to-purple-600" />

          {/* Experience Items */}
          <div className="space-y-12">
            {experiences.map((exp, idx) => (
              <motion.div
                key={exp.company}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`relative flex flex-col md:flex-row gap-8 ${
                  idx % 2 === 0 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-0 md:left-1/2 transform translate-x-0 md:-translate-x-1/2 w-4 h-4 bg-violet-500 rounded-full border-4 border-slate-900" />

                {/* Content */}
                <div className="md:w-1/2 pl-8 md:pl-0">
                  <GlassCard>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        {exp.logo && (
                          <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-white/5">
                            <img
                              src={exp.logo}
                              alt={exp.company}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {exp.role}
                          </h3>
                          <p className="text-violet-400 font-medium">
                            {exp.company}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-slate-400 whitespace-nowrap">
                        {exp.period}
                      </span>
                    </div>

                    <p className="text-slate-300 mb-4">{exp.description}</p>

                    {/* Highlights */}
                    <ul className="space-y-2 mb-4">
                      {exp.highlights.map((highlight, hIdx) => (
                        <li
                          key={hIdx}
                          className="flex items-start gap-2 text-sm text-slate-400"
                        >
                          <span className="text-violet-400 mt-1">-</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-2">
                      {exp.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 bg-white/5 text-slate-400 rounded text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block md:w-1/2" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
