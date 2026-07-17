import fs from "fs";
import path from "path";
import { Profile, Project, Experience, Education, SkillsCategory, Certification, BlogPost, CaseStudy } from "@/types";

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
  const filePath = path.join(contentDirectory, "skills.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents);
}

export function getCertifications(): Certification[] {
  const filePath = path.join(contentDirectory, "certifications.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(fileContents);
  return data.certifications;
}

export function getBlogPosts(): BlogPost[] {
  const filePath = path.join(contentDirectory, "blogs.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(fileContents);
  return data.posts;
}

export function getBlogPost(slug: string): BlogPost | null {
  return getBlogPosts().find((post) => post.slug === slug) ?? null;
}

export function getCaseStudies(): CaseStudy[] {
  const filePath = path.join(contentDirectory, "case-studies.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(fileContents);
  return data.caseStudies;
}

export function getCaseStudy(slug: string): CaseStudy | null {
  return getCaseStudies().find((study) => study.slug === slug) ?? null;
}
