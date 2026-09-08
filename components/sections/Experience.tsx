"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronDown, ChevronUp, ExternalLink, MapPin } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import experienceData from "@/content/experience.json";

interface ExperienceProps {
  showHeading?: boolean;
  /** /experience passes this: every highlight renders expanded, and the Read-more
   *  toggles and the "View Full Experience" footer link are hidden. */
  showAll?: boolean;
}

const VISIBLE_HIGHLIGHTS = 3;

function ProjectHighlights({ highlights, showAll }: { highlights: string[]; showAll: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = !showAll && highlights.length > VISIBLE_HIGHLIGHTS;
  const visible = showAll || expanded ? highlights : highlights.slice(0, VISIBLE_HIGHLIGHTS);

  return (
    <>
      <ul className={`space-y-2 ${hasMore ? "mb-2" : ""}`}>
        {visible.map((highlight, hIdx) => (
          <li key={hIdx} className="flex items-start gap-2 text-sm text-muted">
            <span className="text-accent mt-1">-</span>
            {highlight}
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
        >
          {expanded ? (
            <>
              Show less <ChevronUp size={12} />
            </>
          ) : (
            <>
              Read more ({highlights.length - VISIBLE_HIGHLIGHTS} more) <ChevronDown size={12} />
            </>
          )}
        </button>
      )}
    </>
  );
}

export default function Experience({ showHeading = true, showAll = false }: ExperienceProps) {
  const experiences = experienceData.experiences;

  return (
    <section id="experience" className="py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {showHeading && (
          <SectionHeading
            eyebrow="Experience"
            title="Experience"
            subtitle="My professional journey and the roles I've held"
          />
        )}

        <div className="relative">
          {/* Timeline line — centred on the 16px dot (which spans 0–16, centre 8) */}
          <div
            aria-hidden
            className="absolute left-[7px] top-0 h-full w-0.5 bg-gradient-to-b from-accent via-accent-hover to-transparent"
          />

          {/* Experience Items */}
          <div className="space-y-8 lg:space-y-10">
            {experiences.map((exp, idx) => (
              <motion.div
                key={exp.company}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="relative pl-6 sm:pl-8"
              >
                {/* Timeline dot */}
                <div
                  aria-hidden
                  className="absolute left-0 top-8 w-4 h-4 rounded-full bg-accent border-4 border-background"
                />

                <GlassCard animate={false}>
                  <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-x-10">
                    {/* Lane 1 — meta: horizontal header below lg, vertical rail at lg */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6 lg:mb-0 lg:flex-col lg:flex-nowrap lg:justify-start lg:gap-3">
                      <div className="flex items-start gap-3">
                        {exp.logo && (
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-surface-hover">
                            <Image src={exp.logo} alt={exp.company} fill sizes="44px" className="object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-lg lg:text-xl font-bold text-foreground leading-snug">
                            {exp.role}
                          </h3>
                          {exp.companyUrl ? (
                            <a
                              href={exp.companyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-accent font-medium hover:text-accent-hover transition-colors"
                            >
                              {exp.company}
                            </a>
                          ) : (
                            <p className="text-sm text-accent font-medium">{exp.company}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 lg:flex-col lg:items-start lg:gap-1">
                        <span className="flex items-center gap-1.5 text-sm text-muted">
                          <Calendar className="w-4 h-4 shrink-0" />
                          {exp.period}
                        </span>
                        {exp.location && (
                          <span className="flex items-center gap-1.5 text-sm text-muted">
                            <MapPin className="w-4 h-4 shrink-0" />
                            {exp.location}
                          </span>
                        )}
                        {exp.verifyUrl && (
                          <a
                            href={exp.verifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                          >
                            <ExternalLink size={12} />
                            <span>Verify</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Lanes 2 + 3 — projects, with the tech chips as a right rail at xl */}
                    <div className="space-y-6">
                      {exp.projects.map((project) => (
                        <div
                          key={project.name}
                          className="pl-3 border-l-2 border-accent/30 xl:grid xl:grid-cols-[minmax(0,1fr)_11rem] xl:gap-x-8 xl:items-start"
                        >
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-1">
                              {project.name}
                            </h4>
                            {project.description && (
                              <p className="text-sm text-muted mb-2">{project.description}</p>
                            )}

                            {project.highlights.length > 0 && (
                              <ProjectHighlights highlights={project.highlights} showAll={showAll} />
                            )}
                          </div>

                          {project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3 xl:mt-0">
                              {project.technologies.map((tech) => (
                                <span
                                  key={tech}
                                  className="font-mono px-2 py-0.5 bg-surface border border-border text-muted rounded text-xs uppercase tracking-wide"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {!showAll && (
          <div className="text-center mt-10">
            <Link
              href="/experience"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border hover:border-accent/40 rounded-lg text-sm text-muted hover:text-foreground transition-colors"
            >
              View Full Experience
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
