"use client";

import { motion } from "framer-motion";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}

export default function SectionHeading({ title, subtitle, eyebrow }: SectionHeadingProps) {
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
      <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
