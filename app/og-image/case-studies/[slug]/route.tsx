import { getCaseStudies } from "@/lib/content";
import { renderOgImage } from "@/lib/ogImage";
import { slugFromOgParam } from "@/lib/ogImageUrl";
import { primaryCoverImage } from "@/lib/coverImages";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getCaseStudies().map((study) => ({ slug: `${study.slug}.png` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = slugFromOgParam((await params).slug);
  const study = getCaseStudies().find((s) => s.slug === slug);
  return renderOgImage({
    kind: "Case Study",
    title: study?.title ?? "Case Study",
    description: study?.description,
    cover: study ? primaryCoverImage(study) : undefined,
  });
}
