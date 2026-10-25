import profile from "@/content/profile.json";
import menu from "@/content/menu.json";
import seo from "@/content/seo.json";
import blogsData from "@/content/blogs.json";
import caseStudiesData from "@/content/case-studies.json";
import projectsData from "@/content/projects.json";
import certificationsData from "@/content/certifications.json";
import servicesData from "@/content/services.json";
import { getPublishedClients } from "@/lib/clients";
import { isPublished } from "@/lib/published";
import type { BlogPost, CaseStudy, Certification, Project, Service } from "@/types";

export interface SearchItem {
  title: string;
  description: string;
  url: string;
  category: string;
  /** Tags and body text, searched but never displayed. */
  keywords?: string;
}

/** How much body text to index per entry — enough to match on, small enough to ship. */
const BODY_CHARS = 600;

/**
 * Strips Markdown down to plain words so a search for a term used in an article body
 * matches it. Without this, only the title and description were searchable, so a 3,500
 * character post was findable by about 200 characters of metadata.
 */
function bodyText(...sources: (string | undefined)[]): string {
  return sources
    .filter(Boolean)
    .join(" ")
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links keep their text
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, BODY_CHARS);
}

function keywords(tags: string[] | undefined, ...bodies: (string | undefined)[]): string {
  return [(tags ?? []).join(" "), bodyText(...bodies)].filter(Boolean).join(" ");
}

/** Page blurbs come from the same place as the real meta descriptions, not a second copy. */
const seoDescriptions: Record<string, string> = Object.fromEntries(
  seo.routes.map((route) => [route.route, route.description]),
);

const staticPages: SearchItem[] = [
  ...menu.navLinks
    .filter((link) => !link.external && link.id !== "admin" && link.published !== false)
    .map((link) => ({
      title: link.name,
      description: seoDescriptions[link.href] ?? (link.href === "/" ? profile.tagline : link.name),
      url: link.href,
      category: "Page",
    })),
  { title: "Resume", description: "Live, printable resume", url: "/resume", category: "Page" },
];

const blogItems: SearchItem[] = ((blogsData.posts ?? []) as BlogPost[]).filter(isPublished).map((post) => ({
  title: post.title,
  description: post.description,
  url: `/blog/${post.slug}`,
  category: "Blog",
  keywords: keywords(post.tags, post.body),
}));

const caseStudyItems: SearchItem[] = ((caseStudiesData.caseStudies ?? []) as CaseStudy[])
  .filter(isPublished)
  .map((study) => ({
    title: study.title,
    description: study.description,
    url: `/case-studies/${study.slug}`,
    category: "Case Study",
    keywords: keywords(study.tags, study.body, ...(study.sections ?? []).map((section) => section.body)),
  }));

const projectItems: SearchItem[] = ((projectsData.projects ?? []) as Project[])
  .filter(isPublished)
  .map((project) => ({
    title: project.title,
    description: project.description,
    url: `/projects/${project.slug}`,
    category: "Project",
    keywords: keywords(project.tags, project.body),
  }));

const clientItems: SearchItem[] = getPublishedClients().map((client) => ({
  title: client.name,
  description: client.description ?? "Client",
  url: `/clients/${client.slug}`,
  category: "Client",
  keywords: keywords(client.tags, client.body),
}));

const certificationItems: SearchItem[] = ((certificationsData.certifications ?? []) as Certification[])
  .filter(isPublished)
  .map((certification) => ({
    title: certification.name,
    description: certification.issuer,
    url: "/certifications",
    category: "Certification",
  }));

const serviceItems: SearchItem[] = ((servicesData.services ?? []) as Service[])
  .filter(isPublished)
  .map((service) => ({
    title: service.title,
    description: service.description,
    url: "/services",
    category: "Service",
  }));

export const searchIndex: SearchItem[] = [
  ...staticPages,
  ...blogItems,
  ...caseStudyItems,
  ...projectItems,
  ...clientItems,
  ...certificationItems,
  ...serviceItems,
];
