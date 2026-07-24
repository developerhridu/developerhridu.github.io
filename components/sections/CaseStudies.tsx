import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import ContentCard from "@/components/ui/ContentCard";
import { getPublishedCaseStudies } from "@/lib/content";
import { estimateReadingTime } from "@/lib/readingTime";

const FEATURED_COUNT = 3;

export default function CaseStudies() {
  const caseStudies = [...getPublishedCaseStudies()]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, FEATURED_COUNT);

  if (caseStudies.length === 0) return null;

  return (
    <section id="case-studies" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Case Studies"
          title="Case Studies"
          subtitle="In-depth looks at problems I've solved and how I solved them"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {caseStudies.map((study) => {
            const readingMinutes = estimateReadingTime(
              study.body,
              ...(study.sections?.map((s) => s.body) ?? [])
            );

            return (
              <ContentCard
                key={study.slug}
                viewPath="/case-studies"
                item={{
                  slug: study.slug,
                  title: study.title,
                  description: study.description,
                  tags: study.tags,
                  date: study.date,
                  image: study.image,
                  client: study.client,
                  readingMinutes,
                }}
              />
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border hover:border-accent/40 rounded-lg text-sm text-muted hover:text-foreground transition-colors"
          >
            View All Case Studies
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
