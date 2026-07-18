import { getCaseStudies } from "@/lib/content";
import { renderOgImage } from "@/lib/ogImage";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getCaseStudies().map((study) => ({ slug: study.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = getCaseStudies().find((s) => s.slug === slug);
  return renderOgImage(study?.title ?? "Case Study", "Case Study");
}
