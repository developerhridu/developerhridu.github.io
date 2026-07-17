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
  location: string;
  yearsOfExperience: number;
  projectsCompleted: number;
  social: {
    github: string;
    linkedin: string;
    leetcode: string;
  };
  resumeUrl: string;
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
export interface Experience {
  id: string;
  company: string;
  logo?: string;
  role: string;
  period: string;
  location?: string;
  description: string;
  highlights: string[];
  technologies: string[];
}

// Education types
export interface Education {
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

// Tech stack / skills type
export interface SkillsCategory {
  backend: string[];
  architecture: string[];
  messaging: string[];
  frontend: string[];
  database: string[];
  devops: string[];
  testing: string[];
  proficiency: Skill[];
}

// Blog post types
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  image?: string;
  body: string;
}

// Case study types
export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  date: string;
  client?: string;
  description: string;
  tags: string[];
  image?: string;
  body: string;
}
