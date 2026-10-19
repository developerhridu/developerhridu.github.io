import { getBlogPosts } from "@/lib/content";
import { renderOgImage } from "@/lib/ogImage";
import { slugFromOgParam } from "@/lib/ogImageUrl";
import { primaryCoverImage } from "@/lib/coverImages";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: `${post.slug}.png` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = slugFromOgParam((await params).slug);
  const post = getBlogPosts().find((p) => p.slug === slug);
  return renderOgImage({
    kind: "Blog",
    title: post?.title ?? "Blog",
    description: post?.description,
    cover: post ? primaryCoverImage(post) : undefined,
  });
}
