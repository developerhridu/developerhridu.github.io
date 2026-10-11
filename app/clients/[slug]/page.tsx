import ArticleDetail from "@/components/ui/ArticleDetail";
import WorkDone, { pickBySlugs } from "@/components/ui/WorkDone";
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
  return client.image ? `${BASE_URL}${client.image}` : undefined;
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
  const projects = pickBySlugs(getPublishedProjects(), client.projects);
  const caseStudies = pickBySlugs(getPublishedCaseStudies(), client.caseStudies);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: client.name,
    url: client.url ?? url,
    ...(client.description ? { description: client.description } : {}),
    ...(client.image ? { logo: `${BASE_URL}${client.image}` } : {}),
  };

  return (
    <ArticleDetail
      kind="client"
      entry={{
        ...client,
        title: client.name,
        description: client.description ?? "",
        tags: client.tags ?? [],
        website: client.url ?? undefined,
      }}
      url={url}
      jsonLd={jsonLd}
    >
      <WorkDone projects={projects} caseStudies={caseStudies} />
    </ArticleDetail>
  );
}
