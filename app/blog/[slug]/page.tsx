import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getBlogPosts, getBlogPost } from "@/lib/content";
import ContentImage from "@/components/ui/ContentImage";
import { ArrowLeft, Calendar, Tag } from "lucide-react";

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

  return {
    title: `${post.title} | Blog | Portfolio`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="pt-16 md:pt-0">
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
            </div>
          </header>

          {/* Post Image */}
          <ContentImage
            src={post.image}
            alt={post.title}
            wrapperClassName="mb-12 rounded-2xl"
            imgClassName="w-full h-auto"
          />

          {/* Post Content */}
          <div className="prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted prose-a:text-accent prose-strong:text-foreground prose-code:text-accent prose-code:bg-surface-hover prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface prose-pre:border prose-pre:border-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
          </div>

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
