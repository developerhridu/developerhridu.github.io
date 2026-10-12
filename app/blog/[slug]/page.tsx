import ArticleDetail from "@/components/ui/ArticleDetail";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPosts, getBlogPost, getRelatedBlogPosts, getRelatedItems } from "@/lib/content";
import { toRelatedItem } from "@/lib/related";
import { primaryCoverImage } from "@/lib/coverImages";

const BASE_URL = "https://developerhridu.github.io";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Post Not Found | Portfolio",
    };
  }

  const url = `${BASE_URL}/blog/${post.slug}`;
  const cover = primaryCoverImage(post);
  const imageUrl = cover
    ? `${BASE_URL}${cover}`
    : `${BASE_URL}/og-image/blog/${post.slug}`;

  return {
    title: `${post.title} | Blog | Portfolio`,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: url },
    ...(post.published === false ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      publishedTime: post.date,
      tags: post.tags,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const url = `${BASE_URL}/blog/${post.slug}`;
  const cover = primaryCoverImage(post);
  const imageUrl = cover
    ? `${BASE_URL}${cover}`
    : `${BASE_URL}/og-image/blog/${post.slug}`;
  const picked = getRelatedItems(post);
  // Nothing picked in the admin: fall back to posts sharing tags.
  const related = picked.length > 0 ? picked : getRelatedBlogPosts(post).map((item) => toRelatedItem("blog", item));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: imageUrl,
    datePublished: post.date,
    dateModified: post.updatedAt ?? post.date,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Person", name: "Mizanur Rahman", url: BASE_URL },
    publisher: { "@type": "Person", name: "Mizanur Rahman", url: BASE_URL },
    keywords: post.tags.join(", "),
  };

  return (
    <ArticleDetail
      kind="blog"
      entry={post}
      url={url}
      jsonLd={jsonLd}
      related={related}
    />
  );
}
