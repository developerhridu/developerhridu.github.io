"use client";

import { motion } from "framer-motion";
import { ReactNode, KeyboardEvent } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  /** Set false when the caller already wraps the card in its own reveal animation —
   *  two nested whileInView tweens multiply their opacities and visibly jitter. */
  animate?: boolean;
  /** Describes what activating the card does, for screen readers. Only used with onClick. */
  ariaLabel?: string;
}

export default function GlassCard({
  children,
  className = "",
  hover = true,
  onClick,
  animate = true,
  ariaLabel,
}: GlassCardProps) {
  const classes = `
        card-corners bg-surface border border-border
        rounded-xl p-6
        ${hover ? "hover:bg-surface-hover hover:border-accent/40 transition-all duration-300" : ""}
        ${className}
      `;

  /**
   * A card with an onClick is a button, so it has to be reachable and operable by keyboard.
   * Without this, the project and testimonial modals could only be opened with a mouse.
   * Cards without an onClick stay plain containers — no role, no tab stop.
   */
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onClick || (event.key !== "Enter" && event.key !== " ")) return;
    // Ignore keys meant for a link or button rendered inside the card.
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    onClick();
  }

  const interactive = onClick
    ? {
        role: "button",
        tabIndex: 0,
        "aria-label": ariaLabel,
        onClick,
        onKeyDown,
      }
    : {};

  if (!animate) {
    return (
      <div className={classes} {...interactive}>
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
      {...interactive}
    >
      {children}
    </motion.div>
  );
}
