import { getSeoRoutes } from "@/lib/seo";
import { getProfile } from "@/lib/content";
import { renderOgImage } from "@/lib/ogImage";
import { slugFromOgParam } from "@/lib/ogImageUrl";

export const dynamic = "force-static";

/**
 * Share cards for the static routes (/, /about, /services, …). Entry pages had generated
 * 1200×630 cards already, while every static route fell back to the 400×400 avatar with
 * twitter:card "summary" — a tiny square preview for the most-shared pages on the site.
 */
export async function generateStaticParams() {
  return getSeoRoutes()
    .filter((route) => !route.noIndex)
    .map((route) => ({ slug: `${route.id}.png` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const id = slugFromOgParam((await params).slug);
  const route = getSeoRoutes().find((entry) => entry.id === id);
  const profile = getProfile();
  return renderOgImage({
    kind: profile.title,
    // The SEO title carries the site suffix; the card only needs the page's own name.
    title: route?.title.split("|")[0].trim() ?? profile.name,
    description: route?.description,
    cover: profile.avatar,
  });
}
