"use client";

import { useCallback, useEffect } from "react";
import { useModal } from "@/lib/useModal";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface ZoomImage {
  src: string;
  alt: string;
}

interface ImageZoomOverlayProps {
  images: ZoomImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * Full-size view of one image out of a set, with prev/next, arrow keys, Escape and a
 * click-outside to close. Portaled to the body so an ancestor with a transform or an
 * `overflow` that clips cannot hide or mis-position it.
 */
export default function ImageZoomOverlay({ images, index, onIndexChange, onClose }: ImageZoomOverlayProps) {
  const active = images[index];
  const overlayRef = useModal<HTMLDivElement>({ open: true, onClose });

  const move = useCallback(
    (direction: -1 | 1) => {
      onIndexChange((index + direction + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  // Escape, the Tab trap, the scroll lock and focus restore come from useModal; only the
  // gallery's arrow keys are specific to this overlay.
  useEffect(() => {
    if (images.length < 2) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [images.length, move]);

  if (!active) return null;

  return createPortal(
    <div
      ref={overlayRef}
      data-image-lightbox
      role="dialog"
      aria-modal="true"
      aria-label={`Full image: ${active.alt}`}
      tabIndex={-1}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 outline-none"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close full image"
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface/80 text-foreground transition-colors hover:bg-surface"
      >
        <X size={20} />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); move(-1); }}
            aria-label="Previous image"
            className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-surface/80 text-foreground hover:bg-surface"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); move(1); }}
            aria-label="Next image"
            className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-surface/80 text-foreground hover:bg-surface"
          >
            <ChevronRight size={24} />
          </button>
          <span className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-surface/80 px-3 py-1 text-xs text-muted">
            {index + 1} / {images.length}
          </span>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- the source is already-rendered page content (sometimes a blob: URL) with no known size */}
      <img
        src={active.src}
        alt={active.alt}
        className="relative max-h-full max-w-full rounded-lg object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
