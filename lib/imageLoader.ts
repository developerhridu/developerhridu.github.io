import { IMAGE_WIDTHS } from "@/lib/imageWidths.mjs";

/** Pre-generated copies only exist for raster files under /images after a production build. */
function hasVariants(src: string): boolean {
  return process.env.NODE_ENV === "production" && src.startsWith("/images/") && /\.(png|jpe?g|webp|avif)$/i.test(src.split("?")[0]);
}

/** Path of the pre-built WebP copy closest to (and at least) `width` pixels wide. */
export function responsiveUrl(src: string, width: number): string {
  if (!hasVariants(src)) return src;
  const size = IMAGE_WIDTHS.find((candidate) => candidate >= width) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
  return `/_img/${size}${src.slice("/images".length)}.webp`;
}

/** srcset for plain <img> tags, matching what next/image builds with this loader. */
export function responsiveSrcSet(src: string | undefined): string | undefined {
  if (!src || !hasVariants(src)) return undefined;
  return IMAGE_WIDTHS.map((width) => `${responsiveUrl(src, width)} ${width}w`).join(", ");
}

/**
 * next/image loader for the static export: maps each srcset width to its pre-generated
 * file (scripts/generate-responsive-images.mjs). Anything else — SVG, GIF, external URLs,
 * dev mode — is served as-is; the width query just satisfies next/image's loader check.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (hasVariants(src)) return responsiveUrl(src, width);
  if (/^(data|blob):/.test(src)) return src;
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
