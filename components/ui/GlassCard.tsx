"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  /** Set false when the caller already wraps the card in its own reveal animation —
   *  two nested whileInView tweens multiply their opacities and visibly jitter. */
  animate?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  hover = true,
  onClick,
  animate = true,
}: GlassCardProps) {
  const classes = `
        card-corners bg-surface border border-border
        rounded-xl p-6
        ${hover ? "hover:bg-surface-hover hover:border-accent/40 transition-all duration-300" : ""}
        ${className}
      `;

  if (!animate) {
    return (
      <div className={classes} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
