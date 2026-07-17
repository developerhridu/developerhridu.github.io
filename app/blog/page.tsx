import { Metadata } from "next";
import Link from "next/link";
import { getAllBlogPosts } from "@/lib/mdx";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import { Calendar, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog | Mizanur Rahman — Software Engineering Insights",
  description:
    "Technical writing on backend architecture, .NET development, microservices patterns, and software engineering practices.",
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

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
                    {post.image ? (
                      <div className="h-48 rounded-lg mb-4 overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-accent/20 to-accent-hover/20 rounded-lg mb-4 flex items-center justify-center">
                        <span className="text-4xl font-bold text-foreground/20">
                          {post.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                        </span>
                      </div>
                    )}

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
