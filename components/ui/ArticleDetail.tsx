import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import type { ContentSection } from "@/types";
import { estimateReadingTime } from "@/lib/readingTime";
import { markdownComponents } from "@/components/ui/markdownComponents";
import LightboxImage from "@/components/ui/LightboxImage";
import ClientLinks from "@/components/ui/ClientLinks";
import ShareButtons from "@/components/ui/ShareButtons";
import ViewCounter from "@/components/ui/ViewCounter";
import ReactionButton from "@/components/ui/ReactionButton";
import RelatedContent from "@/components/ui/RelatedContent";
import Comments from "@/components/ui/Comments";

const ARTICLE_TYPES = {
  blog: {
    path: "/blog",
    backLabel: "Back to Blog",
    footerLabel: "Back to all posts",
    draftMessage: "This post is a draft — it isn't listed on the blog, sitemap, or RSS feed. Only people with this link can see it.",
  },
  "case-study": {
    path: "/case-studies",
    backLabel: "Back to Case Studies",
    footerLabel: "Back to all case studies",
    draftMessage: "This case study is a draft — it isn't listed on the case studies page, sitemap, or RSS feed. Only people with this link can see it.",
  },
  project: {
    path: "/projects",
    backLabel: "Back to Projects",
    footerLabel: "Back to all projects",
    draftMessage: "This project is a draft — it isn't listed on the projects page or sitemap. Only people with this link can see it.",
  },
};

export interface ArticleDetailProps {
  kind: keyof typeof ARTICLE_TYPES;
  entry: {
    slug: string;
    title: string;
    description: string;
    tags: string[];
    published?: boolean;
    date?: string;
    client?: string;
    image?: string;
    longDescription?: string;
    body?: string;
    sections?: ContentSection[];
  };
  url?: string;
  jsonLd?: Record<string, unknown>;
  related?: ComponentProps<typeof RelatedContent>;
  /** Render the current CMS draft without public navigation or engagement widgets. */
  preview?: boolean;
  /** Content-specific actions placed after the article body. */
  children?: ReactNode;
}

function ArticleBody({ body }: { body?: string }) {
  if (!body?.trim()) return null;

  return (
    <div className="prose-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {body}
      </ReactMarkdown>
    </div>
  );
}

/** Shared design for blog posts, case studies, and project detail pages. */
export default function ArticleDetail({ kind, entry, url, jsonLd, related, preview = false, children }: ArticleDetailProps) {
  const labels = ARTICLE_TYPES[kind];
  const engagementType = kind === "project" ? null : kind;
  const readingMinutes = engagementType
    ? estimateReadingTime(entry.body ?? "", ...(entry.sections?.map((section) => section.body) ?? []))
    : null;

  return (
    <div className={preview ? "" : "pt-16 md:pt-0"}>
      {!preview && jsonLd && <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />}
      <article className={preview ? "py-8" : "py-20"}>
        <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6">
          {!preview && <Link
            href={labels.path}
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            {labels.backLabel}
          </Link>}

          {entry.published === false && (
            <div className="mb-8 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500 text-sm">
              {labels.draftMessage}
            </div>
          )}

          <header className="mb-12">
            <div className="flex flex-wrap gap-2 mb-4">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm uppercase tracking-wide"
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{entry.title}</h1>
            <p className="text-xl text-muted mb-6">{entry.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-muted">
              {entry.date && (
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
              <ClientLinks client={entry.client} />
              {readingMinutes !== null && (
                <span className="flex items-center gap-2">
                  <Clock size={16} />
                  {readingMinutes} min read
                </span>
              )}
              {!preview && engagementType && <ViewCounter type={engagementType} slug={entry.slug} />}
            </div>

            {!preview && url && <div className="mt-4">
              <ShareButtons url={url} title={entry.title} />
            </div>}
          </header>

          <LightboxImage
            src={entry.image}
            alt={entry.title}
            wrapperClassName={`mb-12 rounded-2xl${kind === "project" ? " aspect-video bg-background border border-border" : ""}`}
            imgClassName={kind === "project" ? "w-full h-full object-contain" : "w-full h-auto"}
            initials={kind === "project" ? entry.title.split(" ").map((word) => word[0]).join("") : undefined}
            initialsClassName="text-6xl"
          />

          {entry.longDescription && (
            <p className="text-lg text-muted leading-relaxed mb-8">{entry.longDescription}</p>
          )}
          <ArticleBody body={entry.body} />

          {entry.sections && entry.sections.length > 0 && (
            <div className="mt-8 space-y-8">
              {entry.sections.map((section, index) => (
                <div key={index}>
                  {section.images && section.images.length > 0 && (
                    <div
                      className={`${section.body.trim() ? "mb-6" : ""} ${
                        section.images.length > 1 ? "grid sm:grid-cols-2 gap-4" : ""
                      }`}
                    >
                      {section.images.map((image, imageIndex) => (
                        <LightboxImage
                          key={image}
                          src={image}
                          alt={section.alt || entry.title}
                          wrapperClassName="rounded-2xl"
                          imgClassName="w-full h-auto"
                          initials={String(imageIndex + 1)}
                        />
                      ))}
                    </div>
                  )}
                  <ArticleBody body={section.body} />
                </div>
              ))}
            </div>
          )}

          {children}
          {!preview && engagementType && <ReactionButton type={engagementType} slug={entry.slug} />}
          {related && <RelatedContent {...related} />}
          {!preview && engagementType && <Comments />}

          {!preview && <div className="mt-12 pt-8 border-t border-border">
            <Link
              href={labels.path}
              className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors"
            >
              <ArrowLeft size={16} />
              {labels.footerLabel}
            </Link>
          </div>}
        </div>
      </article>
    </div>
  );
}
