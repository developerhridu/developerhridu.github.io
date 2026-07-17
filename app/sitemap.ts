import { MetadataRoute } from "next";
import { getBlogPosts, getCaseStudies } from "@/lib/content";

export const dynamic = "force-static";

const BASE_URL = "https://developerhridu.github.io";
const LAST_MODIFIED = "2026-07-07";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/projects`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/experience`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/certifications`, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 0.6 },
    ...getBlogPosts().map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt ?? post.date,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    { url: `${BASE_URL}/case-studies`, lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 0.6 },
    ...getCaseStudies().map((study) => ({
      url: `${BASE_URL}/case-studies/${study.slug}`,
      lastModified: study.updatedAt ?? study.date,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    { url: `${BASE_URL}/contact`, lastModified: LAST_MODIFIED, changeFrequency: "yearly", priority: 0.5 },
  ];
}
