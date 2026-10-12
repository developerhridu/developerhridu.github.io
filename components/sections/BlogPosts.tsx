import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import ContentCard from "@/components/ui/ContentCard";
import { getFeaturedBlogPosts } from "@/lib/content";
import { estimateReadingTime } from "@/lib/readingTime";
import { getSectionCopy } from "@/lib/sections";
import uiStrings from "@/content/ui-strings.json";

export default function BlogPosts() {
  const posts = [...getFeaturedBlogPosts()]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (posts.length === 0) return null;

  const sectionCopy = getSectionCopy("blog");

  return (
    <section id="blog" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow={sectionCopy.eyebrow}
          title={sectionCopy.title}
          subtitle={sectionCopy.subtitle}
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {posts.map((post) => (
            <ContentCard
              key={post.slug}
              viewPath="/blog"
              item={{
                slug: post.slug,
                title: post.title,
                description: post.description,
                tags: post.tags,
                date: post.date,
                image: post.image,
                readingMinutes: estimateReadingTime(
                  post.body,
                  ...(post.sections?.map((section) => section.body) ?? [])
                ),
              }}
            />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border hover:border-accent/40 rounded-lg text-sm text-muted hover:text-foreground transition-colors"
          >
            {uiStrings.blog.viewAll}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
