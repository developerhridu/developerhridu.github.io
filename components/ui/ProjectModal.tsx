"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ExternalLink, Github } from "lucide-react";
import LightboxImage from "@/components/ui/LightboxImage";
import ClientBadge from "@/components/ui/ClientBadge";
import { resolveClients } from "@/lib/clients";

interface ProjectModalProps {
  project: {
    id: string;
    title: string;
    description: string;
    longDescription?: string;
    image?: string;
    client?: string;
    tags: string[];
    liveUrl?: string | null;
    githubUrl?: string | null | { frontend?: string; backend?: string };
  } | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const clients = resolveClients(project?.client);

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

            <LightboxImage
              src={project.image}
              alt={project.title}
              wrapperClassName="h-56 md:h-80 rounded-t-2xl overflow-hidden"
              initials={project.title.split(" ").map((w) => w[0]).join("")}
              initialsClassName="text-6xl"
            />

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

              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {project.title}
              </h2>

              {clients.length > 0 && (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted mb-4">
                  {clients.map((c) => (
                    <ClientBadge key={c.id} client={c} iconSize={16} />
                  ))}
                </p>
              )}

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
