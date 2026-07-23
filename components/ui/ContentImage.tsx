"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";

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
  const imgRef = useRef<HTMLImageElement>(null);
  const failed = !src || broken;

  useEffect(() => {
    // On static export, the browser can fetch (and fail) the image before
    // hydration attaches onError, silently missing the event. Catch that by
    // checking the element's actual load state once mounted. Only applies to
    // the plain <img> (natural) path — next/image's onError doesn't have this gap.
    if (!natural) return;
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      setBroken(true);
    }
  }, [src, natural]);

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
        <img
          ref={imgRef}
          src={src}
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
