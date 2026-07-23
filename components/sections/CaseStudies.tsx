import Link from "next/link";
import { Calendar, Clock, ArrowRight, Building2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import ContentImage from "@/components/ui/ContentImage";
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
              <Link key={study.slug} href={`/case-studies/${study.slug}`}>
                <GlassCard className="h-full flex flex-col group cursor-pointer">
                  <ContentImage
                    src={study.image}
                    alt={study.title}
                    wrapperClassName="h-48 rounded-lg mb-4"
                    imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    initials={study.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                  />

                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {study.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="font-mono px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded text-xs uppercase tracking-wide"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {study.title}
                    </h3>
                    <p className="text-muted text-sm mb-4 line-clamp-2">{study.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(study.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {study.client && (
                        <span className="flex items-center gap-1">
                          <Building2 size={14} />
                          {study.client}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {readingMinutes} min read
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </Link>
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
