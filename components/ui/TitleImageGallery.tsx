"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LightboxImage from "@/components/ui/LightboxImage";

interface TitleImageGalleryProps {
  images: string[];
  alt: string;
  /** Spacing and layout for the gallery as a whole. */
  className?: string;
  /** Styling for the image frame. */
  wrapperClassName?: string;
  imgClassName?: string;
  initials?: string;
  initialsClassName?: string;
}

const NAV_BUTTON_CLASS =
  "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-foreground shadow hover:bg-surface transition-colors";

/** Title image with previous/next navigation when an entry has more than one. */
export default function TitleImageGallery({
  images,
  alt,
  className,
  wrapperClassName,
  imgClassName,
  initials,
  initialsClassName,
}: TitleImageGalleryProps) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  if (count <= 1) {
    return (
      <div className={className}>
        <LightboxImage
          src={images[0]}
          alt={alt}
          wrapperClassName={wrapperClassName}
          imgClassName={imgClassName}
          initials={initials}
          initialsClassName={initialsClassName}
        />
      </div>
    );
  }

  const current = Math.min(index, count - 1);

  function move(direction: -1 | 1) {
    setIndex((value) => (value + direction + count) % count);
  }

  return (
    <div
      className={`relative ${className ?? ""}`.trim()}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${alt} images`}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") move(-1);
        if (e.key === "ArrowRight") move(1);
      }}
    >
      <LightboxImage
        key={current}
        src={images[current]}
        alt={`${alt} — photo ${current + 1}`}
        wrapperClassName={wrapperClassName}
        imgClassName={imgClassName}
        initials={initials}
        initialsClassName={initialsClassName}
        fixedSize
        galleryImages={images}
        galleryIndex={current}
      />
      <button type="button" onClick={() => move(-1)} aria-label="Previous image" className={`${NAV_BUTTON_CLASS} left-3`}>
        <ChevronLeft size={22} />
      </button>
      <button type="button" onClick={() => move(1)} aria-label="Next image" className={`${NAV_BUTTON_CLASS} right-3`}>
        <ChevronRight size={22} />
      </button>
      <div className="mt-4 flex items-center justify-center gap-2">
        {images.map((image, i) => (
          <button
            key={`${image}-${i}`}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show image ${i + 1} of ${count}`}
            aria-current={i === current}
            className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-accent" : "w-2 bg-border hover:bg-muted"}`}
          />
        ))}
      </div>
    </div>
  );
}
