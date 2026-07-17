"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ExternalLink, Github } from "lucide-react";

interface ProjectModalProps {
  project: {
    id: string;
    title: string;
    description: string;
    longDescription?: string;
    image?: string;
    tags: string[];
    liveUrl?: string | null;
    githubUrl?: string | null | { frontend?: string; backend?: string };
  } | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    if (!project) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-accent hover:bg-accent-hover text-accent-foreground transition-colors"
            >
              <X size={18} />
            </button>

            {project.image ? (
              <div className="h-56 md:h-80 overflow-hidden rounded-t-2xl">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-56 md:h-80 rounded-t-2xl bg-gradient-to-br from-accent/20 to-accent-hover/20 flex items-center justify-center">
                <span className="text-6xl font-bold text-foreground/20">
                  {project.title.split(" ").map((w) => w[0]).join("")}
                </span>
              </div>
            )}

            <div className="p-6 md:p-8">
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

              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                {project.title}
              </h2>

              <p className="text-muted mb-2">{project.description}</p>
              {project.longDescription && (
                <p className="text-muted text-sm mb-6">
                  {project.longDescription}
                </p>
              )}

              <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-border">
                {project.liveUrl && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted mb-1">
                      Live Demo
                    </p>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors"
                    >
                      <ExternalLink size={16} />
                      View Live
                    </a>
                  </div>
                )}

                {typeof project.githubUrl === "string" && project.githubUrl && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted mb-1">
                      Source Code
                    </p>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors"
                    >
                      <Github size={16} />
                      View Code
                    </a>
                  </div>
                )}

                {project.githubUrl && typeof project.githubUrl === "object" && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted mb-1">
                      Source Code
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {project.githubUrl.frontend && (
                        <a
                          href={project.githubUrl.frontend}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors"
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
                          className="flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors"
                        >
                          <Github size={16} />
                          Back-End
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
