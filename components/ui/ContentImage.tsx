"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { responsiveSrcSet } from "@/lib/imageLoader";

interface ContentImageProps {
  src?: string;
  alt: string;
  wrapperClassName?: string;
  imgClassName?: string;
  /** Fallback initials shown on a gradient tile when the image is missing or fails to load.
   *  If omitted, the component renders nothing on failure instead of a fallback tile. */
  initials?: string;
  initialsClassName?: string;
  children?: ReactNode;
  /** True for images whose real aspect ratio must be shown as-is (a full-width hero or
   *  screenshot with no fixed container height) — renders a plain lazy-loaded <img>, since
   *  next/image's `fill` mode requires a container with a defined height. False (default)
   *  is for fixed-size containers (avatars, card thumbnails, modal heroes) and uses
   *  next/image with `fill` for real dimension-aware, layout-shift-free rendering. */
  natural?: boolean;
}

export default function ContentImage({
  src,
  alt,
  wrapperClassName,
  imgClassName = "w-full h-full object-cover",
  initials,
  initialsClassName = "text-4xl",
  children,
  natural = false,
}: ContentImageProps) {
  const [broken, setBroken] = useState(false);
  const failed = !src || broken;

  /**
   * On a static export the browser can fetch (and fail) the image before hydration
   * attaches onError, so that event is missed. This ref callback runs when the element is
   * attached and checks its real load state instead. Doing it here rather than in an
   * effect avoids a second render pass for every image on the page. Only the plain <img>
   * (natural) path needs it; next/image's onError has no such gap.
   */
  const checkAlreadyFailed = (element: HTMLImageElement | null) => {
    if (element?.complete && element.naturalWidth === 0) setBroken(true);
  };

  if (failed && initials === undefined) return null;

  return (
    <div
      className={`relative ${wrapperClassName ?? ""} ${
        failed
          ? "bg-gradient-to-br from-accent/20 to-accent-hover/20 flex items-center justify-center"
          : "overflow-hidden"
      }`}
    >
      {failed ? (
        <span className={`${initialsClassName} font-bold text-foreground/20`}>{initials}</span>
      ) : natural ? (
        /* A "natural" image has no known dimensions, which next/image's fill mode requires;
           the srcSet below does the optimising instead. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={checkAlreadyFailed}
          src={src}
          srcSet={responsiveSrcSet(src)}
          sizes="(max-width: 768px) 100vw, 1100px"
          alt={alt}
          loading="lazy"
          className={imgClassName}
          onError={() => setBroken(true)}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          className={imgClassName}
          onError={() => setBroken(true)}
        />
      )}
      {children}
    </div>
  );
}
