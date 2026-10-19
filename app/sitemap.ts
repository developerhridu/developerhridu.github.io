import { MetadataRoute } from "next";
import { getPublishedBlogPosts, getPublishedCaseStudies, getPublishedProjects } from "@/lib/content";
import { getPublishedClients } from "@/lib/clients";
import { getPublishedEmployers } from "@/lib/employers";

export const dynamic = "force-static";

const BASE_URL = "https://developerhridu.github.io";

type Entry = MetadataRoute.Sitemap[number];

/** A parseable ISO date, or undefined — no date is better than a wrong one. */
function validDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

/** When an entry last changed: the CMS's updatedAt, else its publish date. */
function changedAt(entry: { updatedAt?: string; date?: string }): string | undefined {
  return validDate(entry.updatedAt) ?? validDate(entry.date);
}

/** A listing page changes whenever its newest entry does. */
function newest(dates: (string | undefined)[]): string | undefined {
  const known = dates.filter((date): date is string => !!date).sort();
  return known[known.length - 1];
}

function page(path: string, priority: number, changeFrequency: Entry["changeFrequency"], lastModified?: string): Entry {
  return { url: `${BASE_URL}${path}`, priority, changeFrequency, ...(lastModified ? { lastModified } : {}) };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPublishedBlogPosts().map((post) => ({ slug: post.slug, at: changedAt(post) }));
  const studies = getPublishedCaseStudies().map((study) => ({ slug: study.slug, at: changedAt(study) }));
  const projects = getPublishedProjects().map((project) => ({ slug: project.slug, at: changedAt(project as { updatedAt?: string }) }));
  const clients = getPublishedClients().map((client) => ({ slug: client.slug, at: changedAt(client) }));
  const employers = getPublishedEmployers().map((employer) => ({ slug: employer.slug }));
  const latestContent = newest([...posts, ...studies, ...projects, ...clients].map((entry) => entry.at));

  return [
    page("", 1, "monthly", latestContent),
    page("/about", 0.8, "monthly"),
    page("/projects", 0.9, "monthly", newest(projects.map((p) => p.at))),
    ...projects.map((p) => page(`/projects/${p.slug}`, 0.6, "monthly", p.at)),
    page("/experience", 0.8, "monthly"),
    page("/certifications", 0.7, "monthly"),
    page("/resume", 0.7, "monthly"),
    page("/blog", 0.6, "weekly", newest(posts.map((p) => p.at))),
    ...posts.map((p) => page(`/blog/${p.slug}`, 0.5, "monthly", p.at)),
    page("/case-studies", 0.6, "weekly", newest(studies.map((s) => s.at))),
    ...studies.map((s) => page(`/case-studies/${s.slug}`, 0.5, "monthly", s.at)),
    page("/clients", 0.7, "monthly", newest(clients.map((c) => c.at))),
    ...clients.map((c) => page(`/clients/${c.slug}`, 0.5, "monthly", c.at)),
    page("/employers", 0.7, "monthly"),
    ...employers.map((e) => page(`/employers/${e.slug}`, 0.5, "monthly")),
    page("/testimonials", 0.5, "monthly"),
    page("/contact", 0.5, "yearly"),
  ];
}
