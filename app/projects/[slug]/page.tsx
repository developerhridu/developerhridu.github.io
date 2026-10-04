import ArticleDetail from "@/components/ui/ArticleDetail";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectLinks from "@/components/ui/ProjectLinks";
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
    <ArticleDetail
      kind="project"
      entry={project}
      url={url}
      jsonLd={jsonLd}
      related={{ items: linkedCaseStudies, basePath: "/case-studies", heading: "Deep Dives" }}
    >
      <ProjectLinks
        liveUrl={project.liveUrl}
        githubUrl={project.githubUrl}
        className="mt-12"
      />
    </ArticleDetail>
  );
}
