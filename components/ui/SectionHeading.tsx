"use client";

import { motion } from "framer-motion";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /**
   * Heading level. Sections on a page default to "h2"; a listing page passes "h1" so the
   * document has exactly one top-level heading. 11 of 13 routes used to start at h2.
   */
  as?: "h1" | "h2";
}

export default function SectionHeading({ title, subtitle, eyebrow, as: Heading = "h2" }: SectionHeadingProps) {
  return (
    <motion.div
      className="text-center mb-16"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {eyebrow && (
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
          — {eyebrow}
        </p>
      )}
      <Heading className="text-4xl md:text-5xl font-bold text-foreground mb-4">
        {title}
      </Heading>
      {subtitle && (
        <p className="text-muted text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
