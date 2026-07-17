"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary";
  href?: string;
  download?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  href,
  download,
  target,
  rel,
  onClick,
  className = ""
}: ButtonProps) {
  const baseStyles = "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300";

  const variants = {
    primary: "bg-accent hover:bg-accent-hover text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/30",
    secondary: "bg-surface hover:bg-surface-hover text-foreground border border-border hover:border-accent/40"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {href ? (
        <a
          href={href}
          download={download}
          target={target}
          rel={rel}
          onClick={onClick}
          className={`${baseStyles} ${variants[variant]} ${className}`}
        >
          {children}
        </a>
      ) : (
        <button
          onClick={onClick}
          className={`${baseStyles} ${variants[variant]} ${className}`}
        >
          {children}
        </button>
      )}
    </motion.div>
  );
}
