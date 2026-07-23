"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, Mail } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import profile from "@/content/profile.json";
import techStack from "@/content/tech-stack.json";
import proficiencyData from "@/content/proficiency.json";

const skillCategories = [
  { name: "Backend", skills: techStack.backend, color: "bg-accent" },
  { name: "Architecture", skills: techStack.architecture, color: "bg-pink-500" },
  { name: "Messaging & Caching", skills: techStack.messaging, color: "bg-yellow-500" },
  { name: "Frontend", skills: techStack.frontend, color: "bg-blue-500" },
  { name: "Database", skills: techStack.database, color: "bg-cyan-500" },
  { name: "DevOps & Observability", skills: techStack.devops, color: "bg-emerald-500" },
  { name: "Testing", skills: techStack.testing, color: "bg-orange-500" },
];

interface AboutProps {
  showHeading?: boolean;
}

export default function About({ showHeading = true }: AboutProps) {
  return (
    <section id="about" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {showHeading && (
          <SectionHeading
            eyebrow="About"
            title="About Me"
            subtitle="Get to know me and the technologies I work with"
          />
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Bio Card */}
          <GlassCard hover={false}>
            <div className="flex items-center gap-4 mb-6">
              {profile.avatar ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-border shrink-0">
                  <Image src={profile.avatar} alt={profile.name} fill sizes="80px" className="object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-accent-foreground text-2xl font-bold">
                  {profile.name.split(" ").map(n => n[0]).join("")}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-foreground">{profile.name}</h3>
                <p className="text-muted">{profile.title}</p>
              </div>
            </div>

            <div className="text-muted leading-relaxed mb-6 space-y-4">
              {profile.bio.split("\n\n").map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted">
                <MapPin size={18} />
                <span>{profile.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <Mail size={18} />
                <a
                  href={`mailto:${profile.email}`}
                  className="hover:text-foreground transition-colors"
                >
                  {profile.email}
                </a>
              </div>
            </div>
          </GlassCard>

          {/* Skills Card */}
          <GlassCard hover={false}>
            <h3 className="text-xl font-bold text-foreground mb-6">Tech Stack</h3>

            <div className="space-y-6">
              {skillCategories.map((category, idx) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${category.color}`} />
                    <span className="text-sm font-medium text-muted">
                      {category.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-surface border border-border rounded-lg text-sm text-muted hover:border-accent/40 hover:text-foreground transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Skills with Progress Bars */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-foreground mb-6 text-center">Skill Proficiency</h3>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {proficiencyData.proficiency.map((skill, idx) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
              >
                <div className="flex justify-between mb-1">
                  <span className="text-muted">{skill.name}</span>
                  <span className="text-muted">{skill.level}%</span>
                </div>
                <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent to-accent-hover rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: idx * 0.05 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
