import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Tag } from "lucide-react";
import { markdownComponents } from "@/components/ui/markdownComponents";
import LightboxImage from "@/components/ui/LightboxImage";
import ProjectLinks from "@/components/ui/ProjectLinks";
import ClientLinks from "@/components/ui/ClientLinks";
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

          <header className="mb-12">
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm uppercase tracking-wide"
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{project.title}</h1>

            <p className="text-xl text-muted mb-6">{project.description}</p>

            <ClientLinks client={project.client} />

            <div className="mt-4">
              <ShareButtons url={url} title={project.title} />
            </div>
          </header>

          <LightboxImage
            src={project.image}
            alt={project.title}
            wrapperClassName="mb-12 rounded-2xl"
            imgClassName="w-full h-auto"
            initials={project.title.split(" ").map((w) => w[0]).join("")}
            initialsClassName="text-6xl"
          />

          {project.longDescription && (
            <p className="text-lg text-muted leading-relaxed mb-8">{project.longDescription}</p>
          )}

          {project.body && (
            <div className="prose-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {project.body}
              </ReactMarkdown>
            </div>
          )}

          <ProjectLinks
            liveUrl={project.liveUrl}
            githubUrl={project.githubUrl}
            className="mt-12"
          />

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
