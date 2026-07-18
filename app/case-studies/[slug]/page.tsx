import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCaseStudies, getCaseStudy, getRelatedCaseStudies } from "@/lib/content";
import { estimateReadingTime } from "@/lib/readingTime";
import LightboxImage from "@/components/ui/LightboxImage";
import RelatedContent from "@/components/ui/RelatedContent";
import Comments from "@/components/ui/Comments";
import { ArrowLeft, Calendar, Clock, Tag, Building2 } from "lucide-react";
import ViewCounter from "@/components/ui/ViewCounter";

const BASE_URL = "https://developerhridu.github.io";

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getCaseStudies().map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug);

  if (!study) {
    return {
      title: "Case Study Not Found | Portfolio",
    };
  }

  const url = `${BASE_URL}/case-studies/${study.slug}`;
  const imageUrl = study.image
    ? `${BASE_URL}${study.image}`
    : `${BASE_URL}/og-image/case-studies/${study.slug}`;

  return {
    title: `${study.title} | Case Studies | Portfolio`,
    description: study.description,
    keywords: study.tags,
    alternates: { canonical: url },
    ...(study.published === false ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: study.title,
      description: study.description,
      type: "article",
      url,
      publishedTime: study.date,
      tags: study.tags,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: study.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: study.title,
      description: study.description,
      images: [imageUrl],
    },
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const study = getCaseStudy(slug);

  if (!study) {
    notFound();
  }

  const url = `${BASE_URL}/case-studies/${study.slug}`;
  const imageUrl = study.image
    ? `${BASE_URL}${study.image}`
    : `${BASE_URL}/og-image/case-studies/${study.slug}`;
  const readingMinutes = estimateReadingTime(study.body, ...(study.sections?.map((s) => s.body) ?? []));
  const relatedCaseStudies = getRelatedCaseStudies(study);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: study.title,
    description: study.description,
    image: imageUrl,
    datePublished: study.date,
    dateModified: study.updatedAt ?? study.date,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Person", name: "Mizanur Rahman", url: BASE_URL },
    publisher: { "@type": "Person", name: "Mizanur Rahman", url: BASE_URL },
    keywords: study.tags.join(", "),
    ...(study.client ? { about: study.client } : {}),
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
            href="/case-studies"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Case Studies
          </Link>

          {study.published === false && (
            <div className="mb-8 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500 text-sm">
              This case study is a draft — it isn&apos;t listed on the case studies page, sitemap, or RSS feed. Only people with this link can see it.
            </div>
          )}

          {/* Header */}
          <header className="mb-12">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {study.tags.map((tag) => (
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
              {study.title}
            </h1>

            <p className="text-xl text-muted mb-6">{study.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-muted">
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                {new Date(study.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {study.client && (
                <span className="flex items-center gap-2">
                  <Building2 size={16} />
                  {study.client}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Clock size={16} />
                {readingMinutes} min read
              </span>
              <ViewCounter type="case-study" slug={study.slug} />
            </div>
          </header>

          {/* Image */}
          <LightboxImage
            src={study.image}
            alt={study.title}
            wrapperClassName="mb-12 rounded-2xl"
            imgClassName="w-full h-auto"
          />

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted prose-a:text-accent prose-strong:text-foreground prose-code:text-accent prose-code:bg-surface-hover prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface prose-pre:border prose-pre:border-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{study.body}</ReactMarkdown>
          </div>

          {/* Additional Sections */}
          {study.sections && study.sections.length > 0 && (
            <div className="mt-8 space-y-8">
              {study.sections.map((section, idx) => (
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
                          alt={section.alt || study.title}
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

          {/* Related Case Studies */}
          <RelatedContent items={relatedCaseStudies} basePath="/case-studies" heading="Related Case Studies" />

          {/* Comments */}
          <Comments />

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <Link
              href="/case-studies"
              className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors"
            >
              <ArrowLeft size={16} />
              Back to all case studies
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
