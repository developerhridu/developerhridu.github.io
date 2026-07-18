import profile from "@/content/profile.json";
import menu from "@/content/menu.json";
import blogsData from "@/content/blogs.json";
import caseStudiesData from "@/content/case-studies.json";
import projectsData from "@/content/projects.json";

export interface SearchItem {
  title: string;
  description: string;
  url: string;
  category: string;
}

const pageDescriptions: Record<string, string> = {
  home: profile.tagline,
  about: "Background, tech stack, and skill proficiency",
  experience: "Professional journey and roles held",
  services: "How I can help with your next project",
  projects: "Real-world backend and full-stack projects",
  "training-certifications": "Education and completed certifications",
  "case-studies": "Deep dives into specific problems solved in production",
  testimonials: "Feedback and recommendations from people I've worked with",
  blogs: "Technical writing and tutorials",
  contact: "Get in touch",
};

// Sourced from menu.json, same published !== false convention as blog/case-study posts.
const staticPages: SearchItem[] = [
  ...menu.navLinks
    .filter((link) => !link.external && link.published !== false)
    .map((link) => ({
      title: link.name,
      description: pageDescriptions[link.id] ?? link.name,
      url: link.href,
      category: "Page",
    })),
  { title: "Resume", description: "Live, printable resume", url: "/resume", category: "Page" },
];

const blogItems: SearchItem[] = (blogsData.posts ?? [])
  .filter((p) => p.published !== false)
  .map((p) => ({ title: p.title, description: p.description, url: `/blog/${p.slug}`, category: "Blog" }));

const caseStudyItems: SearchItem[] = (caseStudiesData.caseStudies ?? [])
  .filter((s) => s.published !== false)
  .map((s) => ({
    title: s.title,
    description: s.description,
    url: `/case-studies/${s.slug}`,
    category: "Case Study",
  }));

const projectItems: SearchItem[] = (projectsData.projects ?? []).map((p) => ({
  title: p.title,
  description: p.description,
  url: "/projects",
  category: "Project",
}));

export const searchIndex: SearchItem[] = [...staticPages, ...blogItems, ...caseStudyItems, ...projectItems];
