import { Metadata } from "next";
import { getPublishedBlogPosts } from "@/lib/content";
import { estimateReadingTime } from "@/lib/readingTime";
import SectionHeading from "@/components/ui/SectionHeading";
import ContentListing from "@/components/ui/ContentListing";

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

  const items = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    tags: post.tags,
    date: post.date,
    image: post.image,
    readingMinutes: estimateReadingTime(post.body, ...(post.sections?.map((s) => s.body) ?? [])),
  }));

  return (
    <div className="pt-16 md:pt-0">
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="Blog"
            title="Blog"
            subtitle="Thoughts, tutorials, and insights on software development"
          />

          <ContentListing type="blog" items={items} emptyMessage="No blog posts yet. Check back soon!" />
        </div>
      </section>
    </div>
  );
}
