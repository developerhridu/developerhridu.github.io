import ArticleDetail from "@/components/ui/ArticleDetail";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCaseStudies, getCaseStudy, getRelatedCaseStudies, getRelatedItems } from "@/lib/content";
import { toRelatedItem } from "@/lib/related";
import { primaryCoverImage } from "@/lib/coverImages";
import { ogImageUrl } from "@/lib/ogImageUrl";

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
  // Share previews always use the generated 1200×630 card (cover image included).
  const imageUrl = ogImageUrl("case-studies", study.slug);

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
  const cover = primaryCoverImage(study);
  const imageUrl = cover
    ? `${BASE_URL}${cover}`
    : ogImageUrl("case-studies", study.slug);
  const picked = getRelatedItems(study);
  // Nothing picked in the admin: fall back to case studies sharing tags.
  const related = picked.length > 0 ? picked : getRelatedCaseStudies(study).map((item) => toRelatedItem("case-study", item));

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
    <ArticleDetail
      kind="case-study"
      entry={study}
      url={url}
      jsonLd={jsonLd}
      related={related}
    />
  );
}
