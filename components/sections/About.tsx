"use client";

import { motion } from "framer-motion";
import { MapPin, Mail } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import profile from "@/content/profile.json";
import skills from "@/content/skills.json";

const skillCategories = [
  { name: "Backend", skills: skills.backend, color: "bg-violet-500" },
  { name: "Frontend", skills: skills.frontend, color: "bg-blue-500" },
  { name: "DevOps", skills: skills.devops, color: "bg-emerald-500" },
  { name: "Tools", skills: skills.tools, color: "bg-orange-500" },
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
            title="About Me"
            subtitle="Get to know me and the technologies I work with"
          />
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Bio Card */}
          <GlassCard hover={false}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {profile.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{profile.name}</h3>
                <p className="text-slate-400">{profile.title}</p>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed mb-6">
              {profile.bio}
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin size={18} />
                <span>{profile.location}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail size={18} />
                <a
                  href={`mailto:${profile.email}`}
                  className="hover:text-white transition-colors"
                >
                  {profile.email}
                </a>
              </div>
            </div>
          </GlassCard>

          {/* Skills Card */}
          <GlassCard hover={false}>
            <h3 className="text-xl font-bold text-white mb-6">Tech Stack</h3>

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
                    <span className="text-sm font-medium text-slate-300">
                      {category.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-slate-300 hover:bg-white/10 hover:border-white/20 transition-colors"
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
          <h3 className="text-xl font-bold text-white mb-6 text-center">Skill Proficiency</h3>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {profile.skills.map((skill, idx) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
              >
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">{skill.name}</span>
                  <span className="text-slate-400">{skill.level}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
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
