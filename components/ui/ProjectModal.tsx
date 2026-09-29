"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import LightboxImage from "@/components/ui/LightboxImage";
import ProjectLinks from "@/components/ui/ProjectLinks";
import ClientLinks from "@/components/ui/ClientLinks";
import Button from "@/components/ui/Button";
import uiStrings from "@/content/ui-strings.json";

const t = uiStrings.projectModal;
const TITLE_ID = "project-modal-title";

interface ProjectModalProps {
  project: {
    id: string;
    slug: string;
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
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!project) return;

    lastFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      lastFocused.current?.focus();
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
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={TITLE_ID}
            tabIndex={-1}
            className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden outline-none"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — stays put while the body scrolls */}
            <div className="shrink-0 flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
              <h2 id={TITLE_ID} className="text-lg font-bold text-foreground">
                {project.title}
              </h2>
              <button
                onClick={onClose}
                aria-label={t.closeAriaLabel}
                className="shrink-0 -mr-1 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <LightboxImage
                src={project.image}
                alt={project.title}
                wrapperClassName="aspect-video rounded-xl mb-5 bg-background border border-border"
                imgClassName="w-full h-full object-contain"
                initials={project.title.split(" ").map((w) => w[0]).join("")}
                initialsClassName="text-5xl"
              />

              <div className="flex flex-wrap gap-2 mb-3">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono px-2 py-1 bg-accent/10 text-accent border border-accent/20 rounded text-xs uppercase tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <ClientLinks client={project.client} className="text-sm mb-4" />

              <p className="text-muted mb-2">{project.description}</p>
              {project.longDescription && (
                <p className="text-muted text-sm">{project.longDescription}</p>
              )}

              <ProjectLinks
                liveUrl={project.liveUrl}
                githubUrl={project.githubUrl}
                className="mt-6"
              />
            </div>

            {/* Footer — primary action pinned bottom-right */}
            <div className="shrink-0 flex justify-end px-6 py-4 border-t border-border">
              <Button href={`/projects/${project.slug}`} variant="primary">
                {t.viewFullPage}
                <ArrowRight size={18} />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
