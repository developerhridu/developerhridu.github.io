import { MetadataRoute } from "next";
import config from "@/content/config.json";

export const dynamic = "force-static";

const BASE_URL = config.siteUrl;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The admin UI is useless without a GitHub token, and indexing it only invites probing.
      disallow: ["/admin"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
