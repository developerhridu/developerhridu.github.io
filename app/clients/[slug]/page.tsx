import ArticleDetail from "@/components/ui/ArticleDetail";
import RelatedContent from "@/components/ui/RelatedContent";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClient, getClients } from "@/lib/clients";
import { getPublishedCaseStudies, getPublishedProjects } from "@/lib/content";
import config from "@/content/config.json";
import type { Client } from "@/types";

const BASE_URL = config.siteUrl;

interface ClientPageProps {
  params: Promise<{ slug: string }>;
}

function clientImageUrl(client: Client): string | undefined {
  const image = client.image || client.logo;
  return image ? `${BASE_URL}${image}` : undefined;
}

export async function generateStaticParams() {
  return getClients().map((client) => ({ slug: client.slug }));
}

export async function generateMetadata({ params }: ClientPageProps): Promise<Metadata> {
  const { slug } = await params;
  const client = getClient(slug);

  if (!client) {
    return { title: "Client Not Found | Portfolio" };
  }

  const url = `${BASE_URL}/clients/${client.slug}`;
  const description = client.description ?? `Work done for ${client.name}.`;
  const imageUrl = clientImageUrl(client);

  return {
    title: `${client.name} | Clients | Portfolio`,
    description,
    keywords: client.tags,
    alternates: { canonical: url },
    ...(client.published === false ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: client.name,
      description,
      type: "profile",
      url,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: client.name }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: client.name,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { slug } = await params;
  const client = getClient(slug);

  if (!client) {
    notFound();
  }

  const url = `${BASE_URL}/clients/${client.slug}`;
  const projects = getPublishedProjects().filter((project) => (client.projects ?? []).includes(project.slug));
  const caseStudies = getPublishedCaseStudies().filter((study) => (client.caseStudies ?? []).includes(study.slug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: client.name,
    url: client.url ?? url,
    ...(client.description ? { description: client.description } : {}),
    ...(client.logo ? { logo: `${BASE_URL}${client.logo}` } : {}),
  };

  return (
    <ArticleDetail
      kind="client"
      entry={{
        ...client,
        title: client.name,
        description: client.description ?? "",
        tags: client.tags ?? [],
        image: client.image || client.logo,
      }}
      url={url}
      jsonLd={jsonLd}
      related={{ items: caseStudies, basePath: "/case-studies", heading: "Case Studies" }}
    >
      <RelatedContent items={projects} basePath="/projects" heading="Projects" />
    </ArticleDetail>
  );
}
