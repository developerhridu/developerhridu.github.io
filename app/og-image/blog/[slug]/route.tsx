import { getBlogPosts } from "@/lib/content";
import { renderOgImage } from "@/lib/ogImage";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPosts().find((p) => p.slug === slug);
  return renderOgImage(post?.title ?? "Blog", "Blog");
}
