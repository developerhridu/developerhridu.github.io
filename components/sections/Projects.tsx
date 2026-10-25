"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ExternalLink, Github, Building2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import ProjectModal from "@/components/ui/ProjectModal";
import ThumbnailGallery from "@/components/ui/ThumbnailGallery";
import { coverImages } from "@/lib/coverImages";
import projectsData from "@/content/projects.json";
import uiStrings from "@/content/ui-strings.json";
import { getSectionCopy } from "@/lib/sections";
import { isPublished } from "@/lib/published";
import { trackClick } from "@/lib/analytics";
import { TAGS_PER_CARD } from "@/lib/display";
import type { Project } from "@/types";
import { PAGE_CONTAINER } from "@/components/ui/PageContainer";

type ProjectItem = Project;

interface ProjectsProps {
  showHeading?: boolean;
  showAll?: boolean;
  /** "h1" when this section is the whole page, so the page has one top-level heading. */
  headingAs?: "h1" | "h2";
}

export default function Projects({ showHeading = true, showAll = false, headingAs = "h2" }: ProjectsProps) {
  const projects = (projectsData.projects as Project[]).filter(isPublished);
  const featuredProjects = projects.filter((p) => p.featured);
  const otherProjects = projects.filter((p) => !p.featured);

  const displayProjects = showAll ? projects : featuredProjects;

  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  function openProject(project: ProjectItem) {
    trackClick("project", project.slug);
    setSelectedProject(project);
  }

  const sectionCopy = getSectionCopy("projects");

  return (
    <section id="projects" className="py-20">
      <div className={PAGE_CONTAINER}>
        {showHeading && (
          <SectionHeading
            as={headingAs}
            eyebrow={sectionCopy.eyebrow}
            title={sectionCopy.title}
            subtitle={sectionCopy.subtitle}
          />
        )}

        {/* Featured Projects */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              className="min-w-0"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <GlassCard className="h-full flex flex-col cursor-pointer group" onClick={() => openProject(project)} ariaLabel={`Open details for ${project.title}`}>
                {/* Project Image */}
                <ThumbnailGallery
                  images={coverImages(project)}
                  alt={project.title}
                  wrapperClassName="aspect-video overflow-hidden rounded-lg mb-4 bg-background border border-border"
                  imgClassName="w-full h-full object-contain"
                  initials={project.title.split(" ").map((w) => w[0]).join("")}
                >
                  <div className="absolute bottom-3 right-3 flex items-center justify-center w-9 h-9 rounded-full bg-accent text-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={18} />
                  </div>
                </ThumbnailGallery>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {project.title}
                  </h3>
                  {project.client && (
                    <p className="flex items-center gap-1.5 text-sm text-muted mb-2">
                      <Building2 size={14} />
                      {project.client}
                    </p>
                  )}
                  <p className="text-muted mb-4">{project.description}</p>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono px-2 py-1 bg-accent/10 text-accent border border-accent/20 rounded text-xs uppercase tracking-wide"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
                    >
                      <ExternalLink size={16} />
                      {uiStrings.projects.liveDemo}
                    </a>
                  )}
                  {typeof project.githubUrl === "string" && project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
                    >
                      <Github size={16} />
                      {uiStrings.projects.sourceCode}
                    </a>
                  )}
                  {project.githubUrl && typeof project.githubUrl === "object" && (
                    <>
                      {project.githubUrl.frontend && (
                        <a
                          href={project.githubUrl.frontend}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
                        >
                          <Github size={16} />
                          {uiStrings.projects.frontEnd}
                        </a>
                      )}
                      {project.githubUrl.backend && (
                        <a
                          href={project.githubUrl.backend}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
                        >
                          <Github size={16} />
                          {uiStrings.projects.backEnd}
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
            <h3 className="text-xl font-semibold text-foreground mb-4">
              {uiStrings.projects.otherProjects}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherProjects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  className="min-w-0"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <GlassCard className="h-full cursor-pointer group relative" onClick={() => openProject(project)} ariaLabel={`Open details for ${project.title}`}>
                    <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={16} />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-2 pr-8">
                      {project.title}
                    </h4>
                    {project.client && (
                      <p className="flex items-center gap-1.5 text-xs text-muted mb-2">
                        <Building2 size={13} />
                        {project.client}
                      </p>
                    )}
                    <p className="text-muted text-sm mb-3">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.tags.slice(0, TAGS_PER_CARD).map((tag) => (
                        <span
                          key={tag}
                          className="font-mono px-2 py-0.5 bg-surface border border-border text-muted rounded text-xs uppercase tracking-wide"
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
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
                      >
                        <Github size={14} />
                        {uiStrings.projects.viewCode}
                      </a>
                    )}
                    {project.githubUrl && typeof project.githubUrl === "object" && (
                      <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                        {project.githubUrl.frontend && (
                          <a
                            href={project.githubUrl.frontend}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
                          >
                            <Github size={14} />
                            {uiStrings.projects.frontEnd}
                          </a>
                        )}
                        {project.githubUrl.backend && (
                          <a
                            href={project.githubUrl.backend}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
                          >
                            <Github size={14} />
                            {uiStrings.projects.backEnd}
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

      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </section>
  );
}
