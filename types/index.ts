// Profile types
export interface Skill {
  name: string;
  level: number;
}

export interface Profile {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  avatar: string;
  email: string;
  phone?: string;
  location: string;
  yearsOfExperience: number;
  projectsCompleted: number;
  social: {
    github: string;
    linkedin: string;
    leetcode: string;
    upwork?: string;
  };
  portfolioUrl?: string;
  resumeUrl: string;
  openToWork?: boolean;
  openToWorkLabel?: string;
}

// Project types
export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  image: string;
  tags: string[];
  liveUrl: string | null;
  githubUrl: string | null | { frontend?: string; backend?: string };
  featured: boolean;
}

// Experience types
export interface ExperienceProject {
  name: string;
  description?: string;
  technologies: string[];
  highlights: string[];
}

export interface Experience {
  id: string;
  company: string;
  companyUrl?: string;
  logo?: string;
  role: string;
  period: string;
  location?: string;
  verifyUrl?: string;
  projects: ExperienceProject[];
}

// Education types
export interface Education {
  id: string;
  degree: string;
  institution: string;
  icon?: string;
  period: string;
  location: string;
  cgpa?: string;
  achievements?: string[];
}

// Certification types
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  icon?: string;
  icons?: string[];
  date: string;
  verifyUrl?: string;
}

// Testimonial types
export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  company?: string;
  avatar?: string;
  quote: string;
  email?: string;
  linkedinUrl?: string;
  verifyImages?: string[];
  published?: boolean;
}

// Service types
export interface Service {
  id: string;
  title: string;
  description: string;
  icon?: string;
  highlights?: string[];
}

// Tech stack / skills type
export interface SkillsCategory {
  backend: string[];
  architecture: string[];
  messaging: string[];
  frontend: string[];
  database: string[];
  devops: string[];
  testing: string[];
}

// Shared content section type (any number of images + required body)
export interface ContentSection {
  images?: string[];
  alt?: string;
  body: string;
}

// Blog post types
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  updatedAt?: string;
  published?: boolean;
  description: string;
  tags: string[];
  image?: string;
  body: string;
  sections?: ContentSection[];
}

// Case study types
export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  date: string;
  updatedAt?: string;
  published?: boolean;
  client?: string;
  description: string;
  tags: string[];
  image?: string;
  body: string;
  sections?: ContentSection[];
}
