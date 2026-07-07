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
  const baseStyles = "inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300";

  const variants = {
    primary: "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40",
    secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40"
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
