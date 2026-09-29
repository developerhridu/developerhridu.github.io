"use client";

import type { ReactNode } from "react";

interface IconButtonProps {
  children: ReactNode;
  /** Required — an icon-only control has no accessible name without it. */
  "aria-label": string;
  onClick?: () => void;
  size?: "sm" | "md";
  tone?: "default" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}

const sizes = {
  sm: "p-1.5",
  md: "p-2",
};

const tones = {
  default: "text-muted hover:text-foreground disabled:hover:text-muted",
  danger: "text-muted hover:text-red-400 disabled:hover:text-muted",
};

/** Icon-only button. Replaces the near-identical class strings that were
 *  repeated across the admin editors. */
export default function IconButton({
  children,
  "aria-label": ariaLabel,
  onClick,
  size = "md",
  tone = "default",
  disabled,
  type = "button",
  className = "",
}: IconButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`rounded-lg transition-colors disabled:opacity-30 ${sizes[size]} ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}
