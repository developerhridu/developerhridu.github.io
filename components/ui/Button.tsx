"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  href?: string;
  download?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  "aria-label"?: string;
}

const variants = {
  primary:
    "bg-accent hover:bg-accent-hover text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/30",
  secondary:
    "bg-surface hover:bg-surface-hover text-foreground border border-border hover:border-accent/40",
  ghost: "text-muted hover:text-foreground hover:bg-surface-hover",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  download,
  target,
  rel,
  onClick,
  className = "",
  type = "button",
  disabled,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = `inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none ${sizes[size]} ${variants[variant]} ${className}`;

  // An in-app path routes through next/link so it's a client-side transition;
  // anything external, downloadable or opening in a new tab stays a plain anchor.
  const isInternal =
    !!href && href.startsWith("/") && !target && !download;

  return (
    <motion.div
      className="inline-flex"
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
    >
      {isInternal ? (
        <Link href={href} onClick={onClick} className={classes} aria-label={ariaLabel}>
          {children}
        </Link>
      ) : href ? (
        <a
          href={href}
          download={download}
          target={target}
          rel={rel}
          onClick={onClick}
          className={classes}
          aria-label={ariaLabel}
        >
          {children}
        </a>
      ) : (
        <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          className={classes}
          aria-label={ariaLabel}
        >
          {children}
        </button>
      )}
    </motion.div>
  );
}
