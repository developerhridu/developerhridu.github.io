import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import type { SeoRoute } from "@/types";
import { getProfile } from "@/lib/content";
import config from "@/content/config.json";

const SITE_URL = config.siteUrl;

export function getSeoRoutes(): SeoRoute[] {
  const filePath = path.join(process.cwd(), "content", "seo.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents).routes;
}

export function getSeo(id: string): Metadata {
  const route = getSeoRoutes().find((r) => r.id === id);
  if (!route) return {};

  const profile = getProfile();
  const canonical = `${SITE_URL}${route.route}`;
  const ogTitle = route.ogTitle ?? route.title;
  const ogDescription = route.ogDescription ?? route.description;
  const twitterTitle = route.twitterTitle ?? route.title;
  const twitterDescription = route.twitterDescription ?? route.description;
  const imageAlt = route.imageAlt ?? profile.name;
  // Without an explicit image, use this route's generated 1200x630 card rather than the
  // 400x400 avatar, so a shared link previews as a full-width banner.
  const generatedCard = `${SITE_URL}/og-image/page/${route.id}.png`;
  const image = route.image ?? generatedCard;
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;
  const wideCard = !route.image;

  return {
    title: route.title,
    description: route.description,
    ...(route.keywords ? { keywords: route.keywords } : {}),
    ...(route.noIndex ? { robots: { index: false, follow: false } } : {}),
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: (route.ogType as "website" | "profile") ?? "website",
      url: canonical,
      images: [
        wideCard
          ? { url: imageUrl, width: 1200, height: 630, alt: imageAlt }
          : { url: imageUrl, width: 400, height: 400, alt: imageAlt },
      ],
    },
    twitter: {
      card: wideCard ? "summary_large_image" : "summary",
      title: twitterTitle,
      description: twitterDescription,
      images: [imageUrl],
    },
  };
}
