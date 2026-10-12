"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ContentImage from "@/components/ui/ContentImage";

interface ThumbnailGalleryProps {
  images: string[];
  alt: string;
  wrapperClassName: string;
  imgClassName: string;
  initials?: string;
  children?: ReactNode;
}

export default function ThumbnailGallery({ images, alt, wrapperClassName, imgClassName, initials, children }: ThumbnailGalleryProps) {
  const [index, setIndex] = useState(0);
  const current = Math.min(index, Math.max(images.length - 1, 0));

  function move(event: React.MouseEvent<HTMLButtonElement>, direction: -1 | 1) {
    event.preventDefault();
    event.stopPropagation();
    setIndex((previous) => (previous + direction + images.length) % images.length);
  }

  return (
    <div className={`relative ${wrapperClassName}`}>
      <ContentImage
        key={images[current] ?? "fallback"}
        src={images[current]}
        alt={images.length > 1 ? `${alt}, image ${current + 1} of ${images.length}` : alt}
        wrapperClassName="w-full h-full"
        imgClassName={imgClassName}
        initials={initials}
      />
      {children}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => move(event, -1)}
            aria-label={`Previous image of ${alt}`}
            className="absolute z-20 left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={(event) => move(event, 1)}
            aria-label={`Next image of ${alt}`}
            className="absolute z-20 right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ChevronRight size={18} />
          </button>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white pointer-events-none">
            {current + 1} / {images.length}
          </span>
        </>
      )}
    </div>
  );
}
