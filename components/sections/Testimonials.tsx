"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Quote, Linkedin, Mail, Maximize2, BadgeCheck, PenLine } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import TestimonialModal from "@/components/ui/TestimonialModal";
import testimonialsData from "@/content/testimonials.json";
import type { Testimonial } from "@/types";

interface TestimonialsProps {
  showHeading?: boolean;
  noSection?: boolean;
}

export default function Testimonials({ showHeading = true, noSection = false }: TestimonialsProps) {
  const testimonials = ((testimonialsData.testimonials || []) as Testimonial[]).filter(
    (t) => t.published !== false
  );
  const [selected, setSelected] = useState<Testimonial | null>(null);

  if (testimonials.length === 0) return null;

  const content = (
    <>
      {showHeading && (
        <SectionHeading
          eyebrow="Testimonials"
          title="What People Say"
          subtitle="Feedback from people I've worked with"
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, idx) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
          >
            <GlassCard
              className="h-full flex flex-col cursor-pointer group relative"
              onClick={() => setSelected(testimonial)}
            >
              <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={14} />
              </div>

              <Quote className="w-8 h-8 text-accent/40 mb-3 shrink-0" />
              <p className="text-muted flex-1 mb-4 line-clamp-4">&ldquo;{testimonial.quote}&rdquo;</p>

              <div className="flex items-center gap-3">
                {testimonial.avatar ? (
                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-surface-hover">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-accent font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate flex items-center gap-1">
                    <span className="truncate">{testimonial.name}</span>
                    <BadgeCheck size={15} className="text-accent shrink-0" aria-label="Verified" />
                  </p>
                  {(testimonial.role || testimonial.company) && (
                    <p className="text-muted text-sm truncate">
                      {[testimonial.role, testimonial.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
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
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <Link
          href="/testimonials/submit"
          className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          <PenLine size={16} />
          Worked with me? Share your experience
        </Link>
      </div>

      <TestimonialModal testimonial={selected} onClose={() => setSelected(null)} />
    </>
  );

  if (noSection) return content;

  return (
    <section id="testimonials" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">{content}</div>
    </section>
  );
}
