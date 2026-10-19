import ArticleDetail from "@/components/ui/ArticleDetail";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClient, getClients } from "@/lib/clients";
import { getRelatedItems } from "@/lib/content";
import config from "@/content/config.json";
import type { Client } from "@/types";
import { primaryCoverImage } from "@/lib/coverImages";
import { ogImageUrl } from "@/lib/ogImageUrl";

const BASE_URL = config.siteUrl;

interface ClientPageProps {
  params: Promise<{ slug: string }>;
}

function clientImageUrl(client: Client): string | undefined {
  const cover = primaryCoverImage(client);
  return cover ? `${BASE_URL}${cover}` : undefined;
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
  // Share previews use the generated 1200×630 card (logo included) rather than the bare logo.
  const imageUrl = ogImageUrl("clients", client.slug);

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
  const imageUrl = clientImageUrl(client);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: client.name,
    url: client.url ?? url,
    ...(client.description ? { description: client.description } : {}),
    ...(imageUrl ? { logo: imageUrl } : {}),
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
      related={getRelatedItems(client)}
    />
  );
}
