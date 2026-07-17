import { Metadata } from "next";
import Link from "next/link";
import { getCaseStudies } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import ContentImage from "@/components/ui/ContentImage";
import { Calendar, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Case Studies | Mizanur Rahman — Software Engineering Insights",
  description:
    "In-depth case studies on backend architecture, .NET development, microservices patterns, and software engineering practices.",
};

export default function CaseStudiesPage() {
  const caseStudies = [...getCaseStudies()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="pt-16 md:pt-0">
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="Case Studies"
            title="Case Studies"
            subtitle="In-depth looks at problems I've solved and how I solved them"
          />

          {caseStudies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted text-lg">No case studies yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {caseStudies.map((study) => (
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
                      <p className="text-muted text-sm mb-4 line-clamp-2">
                        {study.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-4 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(study.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-sm text-accent group-hover:gap-2 transition-all">
                        Read more <ArrowRight size={14} />
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
