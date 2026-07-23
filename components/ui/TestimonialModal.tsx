"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { X, Quote, Mail, Linkedin, BadgeCheck } from "lucide-react";
import LightboxImage from "@/components/ui/LightboxImage";
import type { Testimonial } from "@/types";

interface TestimonialModalProps {
  testimonial: Testimonial | null;
  onClose: () => void;
}

export default function TestimonialModal({ testimonial, onClose }: TestimonialModalProps) {
  useEffect(() => {
    if (!testimonial) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [testimonial, onClose]);

  return (
    <AnimatePresence>
      {testimonial && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
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

            <div className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                {testimonial.avatar ? (
                  <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 bg-surface-hover">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-accent font-semibold text-xl">
                    {testimonial.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-foreground truncate flex items-center gap-1.5">
                    <span className="truncate">{testimonial.name}</span>
                    <BadgeCheck size={18} className="text-accent shrink-0" aria-label="Verified" />
                  </h2>
                  {(testimonial.role || testimonial.company) && (
                    <p className="text-muted text-sm truncate">
                      {[testimonial.role, testimonial.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {testimonial.email && (
                    <a
                      href={`mailto:${testimonial.email}`}
                      aria-label={`Email ${testimonial.name}`}
                      className="text-muted hover:text-accent transition-colors"
                    >
                      <Mail size={18} />
                    </a>
                  )}
                  {testimonial.linkedinUrl && (
                    <a
                      href={testimonial.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${testimonial.name} on LinkedIn`}
                      className="text-muted hover:text-accent transition-colors"
                    >
                      <Linkedin size={18} />
                    </a>
                  )}
                </div>
              </div>

              <Quote className="w-8 h-8 text-accent/40 mb-2" />
              <p className="text-lg text-foreground mb-8">&ldquo;{testimonial.quote}&rdquo;</p>

              {testimonial.verifyImages && testimonial.verifyImages.length > 0 ? (
                <div className="pt-6 border-t border-border">
                  <p className="text-xs uppercase tracking-wide text-muted mb-3">
                    Verification
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {testimonial.verifyImages.map((image, i) => (
                      <LightboxImage
                        key={image}
                        src={image}
                        alt={`Verification ${i + 1} for ${testimonial.name}'s testimonial`}
                        imgClassName="w-full h-auto rounded-lg border border-border"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="pt-6 border-t border-border text-muted text-sm">
                  No verification photos available for this testimonial.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
