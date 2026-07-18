import { Metadata } from "next";
import { getPublishedCaseStudies } from "@/lib/content";
import { estimateReadingTime } from "@/lib/readingTime";
import SectionHeading from "@/components/ui/SectionHeading";
import ContentListing from "@/components/ui/ContentListing";

const BASE_URL = "https://developerhridu.github.io";

export const metadata: Metadata = {
  title: "Case Studies | Mizanur Rahman — Software Engineering Insights",
  description:
    "In-depth case studies on backend architecture, .NET development, microservices patterns, and software engineering practices.",
  alternates: { canonical: `${BASE_URL}/case-studies` },
  openGraph: {
    title: "Case Studies | Mizanur Rahman",
    description:
      "In-depth case studies on backend architecture, .NET development, microservices patterns, and software engineering practices.",
    type: "website",
    url: `${BASE_URL}/case-studies`,
    images: [{ url: `${BASE_URL}/images/profile/dp.png`, width: 400, height: 400, alt: "Mizanur Rahman" }],
  },
  twitter: {
    card: "summary",
    title: "Case Studies | Mizanur Rahman",
    description:
      "In-depth case studies on backend architecture, .NET development, microservices patterns, and software engineering practices.",
    images: [`${BASE_URL}/images/profile/dp.png`],
  },
};

export default function CaseStudiesPage() {
  const caseStudies = [...getPublishedCaseStudies()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const items = caseStudies.map((study) => ({
    slug: study.slug,
    title: study.title,
    description: study.description,
    tags: study.tags,
    date: study.date,
    image: study.image,
    client: study.client,
    readingMinutes: estimateReadingTime(study.body, ...(study.sections?.map((s) => s.body) ?? [])),
  }));

  return (
    <div className="pt-16 md:pt-0">
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="Case Studies"
            title="Case Studies"
            subtitle="In-depth looks at problems I've solved and how I solved them"
          />

          <ContentListing
            type="case-study"
            items={items}
            emptyMessage="No case studies yet. Check back soon!"
          />
        </div>
      </section>
    </div>
  );
}
