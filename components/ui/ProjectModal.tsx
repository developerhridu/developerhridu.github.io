"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import ProjectDetail from "@/components/ui/ProjectDetail";
import Button from "@/components/ui/Button";
import uiStrings from "@/content/ui-strings.json";

const t = uiStrings.projectModal;

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
              aria-label={t.closeAriaLabel}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-accent hover:bg-accent-hover text-accent-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <ProjectDetail
              project={project}
              as="h2"
              imageWrapperClassName="h-56 md:h-80 rounded-t-2xl overflow-hidden"
            />

            <div className="px-6 md:px-8 pb-6 md:pb-8">
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
