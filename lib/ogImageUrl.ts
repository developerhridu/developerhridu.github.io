import config from "@/content/config.json";

export type OgKind = "blog" | "case-studies" | "projects" | "clients" | "employers";

/**
 * Absolute URL of an entry's generated share card. The route's slug param carries the
 * ".png" so the static export writes a real .png file — GitHub Pages serves files without
 * an extension as application/octet-stream, which some link previews reject.
 */
export function ogImageUrl(kind: OgKind, slug: string): string {
  return `${config.siteUrl}/og-image/${kind}/${slug}.png`;
}

/** The entry slug from an og-image route param ("my-post.png" → "my-post"). */
export function slugFromOgParam(param: string): string {
  return param.replace(/\.png$/, "");
}
