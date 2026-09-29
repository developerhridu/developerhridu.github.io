import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import { markdownComponents } from "@/components/ui/markdownComponents";
import ProjectDetail from "@/components/ui/ProjectDetail";
import ShareButtons from "@/components/ui/ShareButtons";
import RelatedContent from "@/components/ui/RelatedContent";
import { getProjects, getProject, getPublishedCaseStudies } from "@/lib/content";
import config from "@/content/config.json";

const BASE_URL = config.siteUrl;

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return { title: "Project Not Found | Portfolio" };
  }

  const url = `${BASE_URL}/projects/${project.slug}`;
  const imageUrl = project.image
    ? `${BASE_URL}${project.image}`
    : `${BASE_URL}/og-image/projects/${project.slug}`;

  return {
    title: `${project.title} | Projects | Portfolio`,
    description: project.description,
    keywords: project.tags,
    alternates: { canonical: url },
    ...(project.published === false ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: project.title,
      description: project.description,
      type: "article",
      url,
      tags: project.tags,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: project.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
      images: [imageUrl],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  const url = `${BASE_URL}/projects/${project.slug}`;
  const imageUrl = project.image
    ? `${BASE_URL}${project.image}`
    : `${BASE_URL}/og-image/projects/${project.slug}`;

  const linkedCaseStudies = getPublishedCaseStudies().filter((study) =>
    (project.caseStudies ?? []).includes(study.slug)
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    image: imageUrl,
    url,
    creator: { "@type": "Person", name: "Mizanur Rahman", url: BASE_URL },
    keywords: project.tags.join(", "),
    ...(project.client ? { about: project.client } : {}),
    ...(project.liveUrl ? { sameAs: project.liveUrl } : {}),
  };

  return (
    <div className="pt-16 md:pt-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </Link>

          {project.published === false && (
            <div className="mb-8 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500 text-sm">
              This project is a draft — it isn&apos;t listed on the projects page or sitemap. Only
              people with this link can see it.
            </div>
          )}

          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <ProjectDetail
              project={project}
              as="h1"
              imageWrapperClassName="h-56 md:h-80"
              titleClassName="text-3xl md:text-4xl"
            />
          </div>

          <div className="mt-6">
            <ShareButtons url={url} title={project.title} />
          </div>

          {project.body && (
            <div className="mt-12 prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted prose-a:text-accent prose-strong:text-foreground prose-code:text-accent prose-code:bg-surface-hover prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface prose-pre:border prose-pre:border-border">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {project.body}
              </ReactMarkdown>
            </div>
          )}

          <RelatedContent
            items={linkedCaseStudies}
            basePath="/case-studies"
            heading="Deep Dives"
          />

          <div className="mt-12 pt-8 border-t border-border">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors"
            >
              <ArrowLeft size={16} />
              Back to all projects
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
