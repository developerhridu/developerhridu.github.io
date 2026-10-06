import { Metadata } from "next";
import { getPublishedCaseStudies } from "@/lib/content";
import { estimateReadingTime } from "@/lib/readingTime";
import SectionHeading from "@/components/ui/SectionHeading";
import ContentListing from "@/components/ui/ContentListing";
import { getSeo } from "@/lib/seo";
import { getSectionCopy } from "@/lib/sections";
import uiStrings from "@/content/ui-strings.json";

export const metadata: Metadata = getSeo("case-studies");

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

  const sectionCopy = getSectionCopy("case-studies");

  return (
    <div className="pt-16 md:pt-0">
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow={sectionCopy.eyebrow}
            title={sectionCopy.title}
            subtitle={sectionCopy.subtitle}
          />

          <ContentListing
            type="case-study"
            items={items}
            emptyMessage={uiStrings.caseStudiesEmptyMessage}
          />
        </div>
      </section>
    </div>
  );
}
