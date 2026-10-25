import config from "@/content/config.json";

const BASE_URL = config.siteUrl;

interface Crumb {
  name: string;
  path: string;
}

/**
 * BreadcrumbList JSON-LD for a detail page. Detail pages sit two levels deep with no
 * breadcrumb markup before this, so search engines had no section context for them.
 */
export function breadcrumbJsonLd(crumbs: Crumb[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...crumbs].map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${BASE_URL}${crumb.path === "/" ? "" : crumb.path}`,
    })),
  };
}
