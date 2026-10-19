import { getProjects, getProject } from "@/lib/content";
import { renderOgImage } from "@/lib/ogImage";
import { slugFromOgParam } from "@/lib/ogImageUrl";
import { primaryCoverImage } from "@/lib/coverImages";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getProjects().map((project) => ({ slug: `${project.slug}.png` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const project = getProject(slugFromOgParam((await params).slug));
  return renderOgImage({
    kind: "Project",
    title: project?.title ?? "Project",
    description: project?.description,
    cover: project ? primaryCoverImage(project) : undefined,
  });
}
