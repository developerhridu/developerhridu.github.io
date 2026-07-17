import { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogPosts } from "@/lib/content";
import { estimateReadingTime } from "@/lib/readingTime";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import ContentImage from "@/components/ui/ContentImage";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const BASE_URL = "https://developerhridu.github.io";

export const metadata: Metadata = {
  title: "Blog | Mizanur Rahman — Software Engineering Insights",
  description:
    "Technical writing on backend architecture, .NET development, microservices patterns, and software engineering practices.",
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: "Blog | Mizanur Rahman",
    description:
      "Technical writing on backend architecture, .NET development, microservices patterns, and software engineering practices.",
    type: "website",
    url: `${BASE_URL}/blog`,
    images: [{ url: `${BASE_URL}/images/profile/dp.png`, width: 400, height: 400, alt: "Mizanur Rahman" }],
  },
  twitter: {
    card: "summary",
    title: "Blog | Mizanur Rahman",
    description:
      "Technical writing on backend architecture, .NET development, microservices patterns, and software engineering practices.",
    images: [`${BASE_URL}/images/profile/dp.png`],
  },
};

export default function BlogPage() {
  const posts = [...getPublishedBlogPosts()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="pt-16 md:pt-0">
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="Blog"
            title="Blog"
            subtitle="Thoughts, tutorials, and insights on software development"
          />

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted text-lg">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  <GlassCard className="h-full flex flex-col group cursor-pointer">
                    <ContentImage
                      src={post.image}
                      alt={post.title}
                      wrapperClassName="h-48 rounded-lg mb-4"
                      imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      initials={post.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                    />

                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="font-mono px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded text-xs uppercase tracking-wide"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-muted text-sm mb-4 line-clamp-2">
                        {post.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-4 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(post.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {estimateReadingTime(post.body, ...(post.sections?.map((s) => s.body) ?? []))} min read
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
