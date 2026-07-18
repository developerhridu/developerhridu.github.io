import fs from "fs";
import path from "path";
import { Profile, Project, Experience, Education, SkillsCategory, Certification, BlogPost, CaseStudy, Skill, Testimonial } from "@/types";

const contentDirectory = path.join(process.cwd(), "content");

export function getProfile(): Profile {
  const filePath = path.join(contentDirectory, "profile.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents);
}

export function getProjects(): Project[] {
  const filePath = path.join(contentDirectory, "projects.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(fileContents);
  return data.projects;
}

export function getFeaturedProjects(): Project[] {
  return getProjects().filter((project) => project.featured);
}

export function getExperiences(): Experience[] {
  const filePath = path.join(contentDirectory, "experience.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(fileContents);
  return data.experiences;
}

export function getEducation(): Education[] {
  const filePath = path.join(contentDirectory, "education.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(fileContents);
  return data.education;
}

export function getSkillsCategory(): SkillsCategory {
  const filePath = path.join(contentDirectory, "tech-stack.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents);
}

export function getProficiency(): Skill[] {
  const filePath = path.join(contentDirectory, "proficiency.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(fileContents);
  return data.proficiency;
}

export function getCertifications(): Certification[] {
  const filePath = path.join(contentDirectory, "certifications.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(fileContents);
  return data.certifications;
}

export function getTestimonials(): Testimonial[] {
  const filePath = path.join(contentDirectory, "testimonials.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(fileContents);
  return data.testimonials;
}

export function getBlogPosts(): BlogPost[] {
  const filePath = path.join(contentDirectory, "blogs.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(fileContents);
  return data.posts;
}

export function getPublishedBlogPosts(): BlogPost[] {
  return getBlogPosts().filter((post) => post.published !== false);
}

export function getBlogPost(slug: string): BlogPost | null {
  return getBlogPosts().find((post) => post.slug === slug) ?? null;
}

export function getRelatedBlogPosts(current: BlogPost, limit = 3): BlogPost[] {
  return getPublishedBlogPosts()
    .filter((post) => post.slug !== current.slug)
    .map((post) => ({
      post,
      score: post.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .sort(
      (a, b) =>
        b.score - a.score || new Date(b.post.date).getTime() - new Date(a.post.date).getTime()
    )
    .slice(0, limit)
    .map(({ post }) => post);
}

export function getCaseStudies(): CaseStudy[] {
  const filePath = path.join(contentDirectory, "case-studies.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(fileContents);
  return data.caseStudies;
}

export function getPublishedCaseStudies(): CaseStudy[] {
  return getCaseStudies().filter((study) => study.published !== false);
}

export function getCaseStudy(slug: string): CaseStudy | null {
  return getCaseStudies().find((study) => study.slug === slug) ?? null;
}

export function getRelatedCaseStudies(current: CaseStudy, limit = 3): CaseStudy[] {
  return getPublishedCaseStudies()
    .filter((study) => study.slug !== current.slug)
    .map((study) => ({
      study,
      score: study.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .sort(
      (a, b) =>
        b.score - a.score || new Date(b.study.date).getTime() - new Date(a.study.date).getTime()
    )
    .slice(0, limit)
    .map(({ study }) => study);
}
