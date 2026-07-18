import profile from "@/content/profile.json";
import blogsData from "@/content/blogs.json";
import caseStudiesData from "@/content/case-studies.json";
import projectsData from "@/content/projects.json";

export interface SearchItem {
  title: string;
  description: string;
  url: string;
  category: string;
}

const staticPages: SearchItem[] = [
  { title: "Home", description: profile.tagline, url: "/", category: "Page" },
  {
    title: "About",
    description: "Background, tech stack, and skill proficiency",
    url: "/about",
    category: "Page",
  },
  {
    title: "Projects",
    description: "Real-world backend and full-stack projects",
    url: "/projects",
    category: "Page",
  },
  {
    title: "Experience",
    description: "Professional journey and roles held",
    url: "/experience",
    category: "Page",
  },
  {
    title: "Training & Certifications",
    description: "Education and completed certifications",
    url: "/certifications",
    category: "Page",
  },
  {
    title: "Case Studies",
    description: "Deep dives into specific problems solved in production",
    url: "/case-studies",
    category: "Page",
  },
  {
    title: "Testimonials",
    description: "Feedback and recommendations from people I've worked with",
    url: "/testimonials",
    category: "Page",
  },
  { title: "Blog", description: "Technical writing and tutorials", url: "/blog", category: "Page" },
  { title: "Resume", description: "Live, printable resume", url: "/resume", category: "Page" },
  { title: "Contact", description: "Get in touch", url: "/contact", category: "Page" },
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
