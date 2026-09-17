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
  const image = route.image ?? profile.avatar;
  const imageAlt = route.imageAlt ?? profile.name;
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

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
      images: [{ url: imageUrl, width: 400, height: 400, alt: imageAlt }],
    },
    twitter: {
      card: "summary",
      title: twitterTitle,
      description: twitterDescription,
      images: [imageUrl],
    },
  };
}
