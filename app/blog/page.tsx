import { Suspense } from "react";
import { Metadata } from "next";
import { getPublishedBlogPosts } from "@/lib/content";
import { estimateReadingTime } from "@/lib/readingTime";
import SectionHeading from "@/components/ui/SectionHeading";
import ContentListing from "@/components/ui/ContentListing";
import { getSeo } from "@/lib/seo";
import { getSectionCopy } from "@/lib/sections";
import uiStrings from "@/content/ui-strings.json";
import { PAGE_CONTAINER } from "@/components/ui/PageContainer";

export const metadata: Metadata = getSeo("blog");

export default function BlogPage() {
  const posts = [...getPublishedBlogPosts()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const items = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    tags: post.tags,
    date: post.date,
    coverImages: post.coverImages,
    readingMinutes: estimateReadingTime(post.body, ...(post.sections?.map((s) => s.body) ?? [])),
  }));

  const sectionCopy = getSectionCopy("blog");

  return (
    <div className="pt-16 md:pt-0">
      <section className="py-20">
        <div className={PAGE_CONTAINER}>
          <SectionHeading
            as="h1"
            eyebrow={sectionCopy.eyebrow}
            title={sectionCopy.title}
            subtitle={sectionCopy.subtitle}
          />

          {/* ContentListing reads ?tag= with useSearchParams, which needs a boundary under static export. */}
          <Suspense fallback={null}>
            <ContentListing type="blog" items={items} emptyMessage={uiStrings.blogEmptyMessage} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
