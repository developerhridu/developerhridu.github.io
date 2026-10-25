"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import ImageZoomOverlay, { type ZoomImage } from "@/components/ui/ImageZoomOverlay";
import { responsiveSrcSet } from "@/lib/imageLoader";

/**
 * An image inside an article's Markdown body. It renders exactly the <img> the body used
 * to render — same srcset, sizes and lazy loading — and opens a full-size view on click,
 * so body screenshots are no longer stuck at the article's column width.
 *
 * The handler sits on the <img> itself rather than on a wrapper, so `.prose-content`'s
 * typography rules (which target `img`) keep applying and the page looks unchanged.
 */
export default function MarkdownImage({
  src,
  alt,
  title,
}: {
  src?: string;
  alt: string;
  title?: string;
}) {
  const [zoom, setZoom] = useState<{ images: ZoomImage[]; index: number } | null>(null);

  /**
   * Collects every image in the same article, so the arrows step across section bodies
   * too — the body and each section are separate ReactMarkdown trees with no shared
   * state. `currentSrc` is what the browser actually loaded, which resolves both srcset
   * and the admin preview's blob: URLs for images that aren't published yet.
   */
  function open(image: HTMLImageElement) {
    const container = image.closest("article") ?? image.closest(".prose-content");
    const all = container ? [...container.querySelectorAll("img")] : [image];
    setZoom({
      images: all.map((each) => ({ src: each.currentSrc || each.src, alt: each.alt || alt })),
      index: Math.max(0, all.indexOf(image)),
    });
  }

  function onClick(event: MouseEvent<HTMLImageElement>) {
    // A linked image keeps its link rather than zooming.
    if (event.currentTarget.closest("a")) return;
    event.preventDefault();
    open(event.currentTarget);
  }

  function onKeyDown(event: KeyboardEvent<HTMLImageElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.currentTarget.closest("a")) return;
    event.preventDefault();
    open(event.currentTarget);
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- markdown images have no known size; a lazy <img> with srcset fits best */}
      <img
        src={src}
        srcSet={responsiveSrcSet(src)}
        sizes="(max-width: 768px) 100vw, 900px"
        alt={alt}
        title={title}
        loading="lazy"
        decoding="async"
        role="button"
        tabIndex={0}
        aria-label={alt ? `View full image: ${alt}` : "View full image"}
        className="cursor-zoom-in"
        onClick={onClick}
        onKeyDown={onKeyDown}
      />
      {zoom && (
        <ImageZoomOverlay
          images={zoom.images}
          index={zoom.index}
          onIndexChange={(index) => setZoom((current) => (current ? { ...current, index } : current))}
          onClose={() => setZoom(null)}
        />
      )}
    </>
  );
}
