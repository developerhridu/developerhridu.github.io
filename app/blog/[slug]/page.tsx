import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getBlogPosts, getBlogPost, getRelatedBlogPosts } from "@/lib/content";
import { estimateReadingTime } from "@/lib/readingTime";
import LightboxImage from "@/components/ui/LightboxImage";
import RelatedContent from "@/components/ui/RelatedContent";
import Comments from "@/components/ui/Comments";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";

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
  const imageUrl = post.image
    ? `${BASE_URL}${post.image}`
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
  const imageUrl = post.image
    ? `${BASE_URL}${post.image}`
    : `${BASE_URL}/og-image/blog/${post.slug}`;
  const readingMinutes = estimateReadingTime(post.body, ...(post.sections?.map((s) => s.body) ?? []));
  const relatedPosts = getRelatedBlogPosts(post);

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
    <div className="pt-16 md:pt-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Blog
          </Link>

          {post.published === false && (
            <div className="mb-8 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500 text-sm">
              This post is a draft — it isn&apos;t listed on the blog, sitemap, or RSS feed. Only people with this link can see it.
            </div>
          )}

          {/* Post Header */}
          <header className="mb-12">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm uppercase tracking-wide"
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {post.title}
            </h1>

            <p className="text-xl text-muted mb-6">{post.description}</p>

            <div className="flex items-center gap-4 text-muted">
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={16} />
                {readingMinutes} min read
              </span>
            </div>
          </header>

          {/* Post Image */}
          <LightboxImage
            src={post.image}
            alt={post.title}
            wrapperClassName="mb-12 rounded-2xl"
            imgClassName="w-full h-auto"
          />

          {/* Post Content */}
          <div className="prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted prose-a:text-accent prose-strong:text-foreground prose-code:text-accent prose-code:bg-surface-hover prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface prose-pre:border prose-pre:border-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
          </div>

          {/* Additional Sections */}
          {post.sections && post.sections.length > 0 && (
            <div className="mt-8 space-y-8">
              {post.sections.map((section, idx) => (
                <div key={idx}>
                  {section.images && section.images.length > 0 && (
                    <div
                      className={`mb-6 ${
                        section.images.length > 1 ? "grid sm:grid-cols-2 gap-4" : ""
                      }`}
                    >
                      {section.images.map((image, imgIdx) => (
                        <LightboxImage
                          key={image}
                          src={image}
                          alt={section.alt || post.title}
                          wrapperClassName="rounded-2xl"
                          imgClassName="w-full h-auto"
                          initials={String(imgIdx + 1)}
                        />
                      ))}
                    </div>
                  )}
                  <div className="prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted prose-a:text-accent prose-strong:text-foreground prose-code:text-accent prose-code:bg-surface-hover prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface prose-pre:border prose-pre:border-border">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.body}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Related Posts */}
          <RelatedContent items={relatedPosts} basePath="/blog" heading="Related Posts" />

          {/* Comments */}
          <Comments />

          {/* Post Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors"
            >
              <ArrowLeft size={16} />
              Back to all posts
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
