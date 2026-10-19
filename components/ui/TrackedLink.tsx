"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackClick, type ClickArea } from "@/lib/analytics";

interface TrackedLinkProps {
  href: string;
  area: ClickArea;
  /** What was clicked — a slug for internal links, a hostname for outbound ones. */
  label: string;
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
  target?: string;
  rel?: string;
  title?: string;
}

/**
 * A link that records the click before following it. Rendered as `next/link` for
 * in-site paths and a plain anchor otherwise, so server components (cards, listings)
 * can stay server-rendered and only this leaf runs on the client.
 */
export default function TrackedLink({
  href,
  area,
  label,
  children,
  className,
  "aria-label": ariaLabel,
  target,
  rel,
  title,
}: TrackedLinkProps) {
  const internal = href.startsWith("/") && !target;
  const onClick = () => trackClick(area, label);

  if (internal) {
    return (
      <Link href={href} onClick={onClick} className={className} aria-label={ariaLabel} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
      title={title}
      target={target}
      rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
    >
      {children}
    </a>
  );
}
