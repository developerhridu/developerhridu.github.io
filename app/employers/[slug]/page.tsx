import ArticleDetail from "@/components/ui/ArticleDetail";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEmployer, getEmployers } from "@/lib/employers";
import { getRelatedItems } from "@/lib/content";
import config from "@/content/config.json";
import type { Employer } from "@/types";
import { primaryCoverImage } from "@/lib/coverImages";
import { ogImageUrl } from "@/lib/ogImageUrl";

const BASE_URL = config.siteUrl;

interface EmployerPageProps {
  params: Promise<{ slug: string }>;
}

function employerImageUrl(employer: Employer): string | undefined {
  const cover = primaryCoverImage(employer);
  return cover ? `${BASE_URL}${cover}` : undefined;
}

// Static export can't render unlisted slugs; 404 them instead of throwing in dev.
export const dynamicParams = false;

export async function generateStaticParams() {
  return getEmployers().map((employer) => ({ slug: employer.slug }));
}

export async function generateMetadata({ params }: EmployerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const employer = getEmployer(slug);

  if (!employer) {
    return { title: "Employer Not Found | Portfolio" };
  }

  const url = `${BASE_URL}/employers/${employer.slug}`;
  const description = employer.description ?? `My work at ${employer.name}.`;
  // Share previews use the generated 1200×630 card (logo included) rather than the bare logo.
  const imageUrl = ogImageUrl("employers", employer.slug);

  return {
    title: `${employer.name} | Employers | Portfolio`,
    description,
    keywords: employer.tags,
    alternates: { canonical: url },
    ...(employer.published === false ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: employer.name,
      description,
      type: "profile",
      url,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: employer.name }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: employer.name,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function EmployerPage({ params }: EmployerPageProps) {
  const { slug } = await params;
  const employer = getEmployer(slug);

  if (!employer) {
    notFound();
  }

  const url = `${BASE_URL}/employers/${employer.slug}`;
  const imageUrl = employerImageUrl(employer);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: employer.name,
    url: employer.url ?? url,
    ...(employer.description ? { description: employer.description } : {}),
    ...(imageUrl ? { logo: imageUrl } : {}),
  };

  return (
    <ArticleDetail
      kind="employer"
      entry={{
        ...employer,
        title: employer.name,
        description: employer.description ?? "",
        tags: employer.tags ?? [],
        website: employer.url ?? undefined,
      }}
      url={url}
      jsonLd={jsonLd}
      related={getRelatedItems(employer)}
    />
  );
}
