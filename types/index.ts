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
    twitter: string;
  };
  resumeUrl: string;
  skills: Skill[];
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
  githubUrl: string;
  featured: boolean;
}

// Experience types
export interface Experience {
  company: string;
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
  period: string;
  location: string;
  cgpa?: string;
  achievements?: string[];
}

// Skills category type (for skills page)
export interface SkillsCategory {
  backend: string[];
  frontend: string[];
  devops: string[];
  tools: string[];
}

// Blog post types
export interface BlogPostMeta {
  title: string;
  date: string;
  description: string;
  tags: string[];
  image?: string;
  slug: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}
