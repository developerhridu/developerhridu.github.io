import { getProjects, getProject } from "@/lib/content";
import { renderOgImage } from "@/lib/ogImage";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  return renderOgImage(project?.title ?? "Project", "Project");
}
