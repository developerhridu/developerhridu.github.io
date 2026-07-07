"use client";

import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import projectsData from "@/content/projects.json";

interface ProjectsProps {
  showHeading?: boolean;
  showAll?: boolean;
}

export default function Projects({ showHeading = true, showAll = false }: ProjectsProps) {
  const projects = projectsData.projects;
  const featuredProjects = projects.filter((p) => p.featured);
  const otherProjects = projects.filter((p) => !p.featured);

  const displayProjects = showAll ? projects : featuredProjects;

  return (
    <section id="projects" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {showHeading && (
          <SectionHeading
            title="Projects"
            subtitle="A selection of projects I've worked on"
          />
        )}

        {/* Featured Projects */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {displayProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <GlassCard className="h-full flex flex-col">
                {/* Project Image */}
                {project.image ? (
                  <div className="h-48 rounded-lg mb-4 overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white/20">
                      {project.title.split(" ").map((w) => w[0]).join("")}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {project.title}
                  </h3>
                  <p className="text-slate-400 mb-4">{project.description}</p>
                  {project.longDescription && (
                    <p className="text-slate-300 text-sm mb-4">
                      {project.longDescription}
                    </p>
                  )}

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="flex gap-4 pt-4 border-t border-white/10">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      <ExternalLink size={16} />
                      Live Demo
                    </a>
                  )}
                  {typeof project.githubUrl === "string" && project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      <Github size={16} />
                      Source Code
                    </a>
                  )}
                  {project.githubUrl && typeof project.githubUrl === "object" && (
                    <>
                      {project.githubUrl.frontend && (
                        <a
                          href={project.githubUrl.frontend}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          <Github size={16} />
                          Front-End
                        </a>
                      )}
                      {project.githubUrl.backend && (
                        <a
                          href={project.githubUrl.backend}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          <Github size={16} />
                          Back-End
                        </a>
                      )}
                    </>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Other Projects (only show on showAll or when there are non-featured) */}
        {!showAll && otherProjects.length > 0 && (
          <>
            <h3 className="text-xl font-semibold text-white mb-4">
              Other Projects
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherProjects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <GlassCard className="h-full">
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {project.title}
                    </h4>
                    <p className="text-slate-400 text-sm mb-3">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-white/5 text-slate-400 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {typeof project.githubUrl === "string" && project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        <Github size={14} />
                        View Code
                      </a>
                    )}
                    {project.githubUrl && typeof project.githubUrl === "object" && (
                      <div className="flex gap-3">
                        {project.githubUrl.frontend && (
                          <a
                            href={project.githubUrl.frontend}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                          >
                            <Github size={14} />
                            Front-End
                          </a>
                        )}
                        {project.githubUrl.backend && (
                          <a
                            href={project.githubUrl.backend}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                          >
                            <Github size={14} />
                            Back-End
                          </a>
                        )}
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
