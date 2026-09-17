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
  currentEmployer?: string;
  addressLocality?: string;
  addressCountry?: string;
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

// Section heading copy (eyebrow/title/subtitle shown via SectionHeading)
export interface SectionCopy {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

// Skill category display metadata (label + color), keyed to SkillsCategory
export interface SkillCategoryMeta {
  id: string;
  key: keyof SkillsCategory;
  label: string;
  color: string;
}

// Per-route SEO metadata
export interface SeoRoute {
  id: string;
  route: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  ogType?: string;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
}

// Client types
export interface Client {
  id: string;
  name: string;
  logo?: string;
  /** `null` when cleared in the admin editor — `url` fields there write null, not "". */
  url?: string | null;
  published?: boolean;
}

// Project types
export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  image: string;
  client?: string;
  tags: string[];
  liveUrl: string | null;
  githubUrl: string | null | { frontend?: string; backend?: string };
  featured: boolean;
  published?: boolean;
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
  /** `null` when cleared in the admin editor — `url` fields there write null, not "". */
  verifyUrl?: string | null;
  published?: boolean;
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
  published?: boolean;
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

// Shared UI microcopy (ui-strings.json), mirrored 1:1
export interface UiStrings {
  hero: {
    greeting: string;
    ctaViewProjects: string;
    ctaHireMe: string;
    ctaViewResume: string;
    statYearsExperience: string;
    statProjectsCompleted: string;
    statClients: string;
  };
  about: {
    techStackHeading: string;
    skillProficiencyHeading: string;
  };
  experience: {
    showLess: string;
    readMore: string;
    verify: string;
    viewFullExperience: string;
  };
  projects: {
    otherProjects: string;
    liveDemo: string;
    sourceCode: string;
    viewCode: string;
    frontEnd: string;
    backEnd: string;
  };
  projectModal: {
    liveDemo: string;
    viewLive: string;
    sourceCode: string;
    viewCode: string;
    frontEnd: string;
    backEnd: string;
    closeAriaLabel: string;
  };
  certifications: {
    verify: string;
  };
  educationCertifications: {
    tabEducationLabel: string;
    tabEducationNumber: string;
    tabCertificationsLabel: string;
    tabCertificationsNumber: string;
  };
  contact: {
    letsConnectTitle: string;
    letsConnectIntro: string;
    emailLabel: string;
    locationLabel: string;
    sendMessageTitle: string;
    messageSentTitle: string;
    messageSentBody: string;
    sendAnotherMessage: string;
    nameLabel: string;
    namePlaceholder: string;
    emailFieldLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    errorText: string;
    sending: string;
    sendMessageButton: string;
  };
  testimonialSubmit: {
    thankYouTitle: string;
    thankYouBody: string;
    submitAnother: string;
    notConfiguredTitle: string;
    notConfiguredBody: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    roleLabel: string;
    rolePlaceholder: string;
    companyLabel: string;
    companyPlaceholder: string;
    linkedinLabel: string;
    linkedinPlaceholder: string;
    quoteLabel: string;
    quotePlaceholder: string;
    errorText: string;
    submitting: string;
    submitButton: string;
  };
  testimonials: {
    shareCta: string;
  };
  caseStudies: {
    viewAll: string;
  };
  blogCaseStudyListing: {
    mostRead: string;
    allTag: string;
    readMore: string;
  };
  blogEmptyMessage: string;
  caseStudiesEmptyMessage: string;
  searchPalette: {
    placeholder: string;
    closeAriaLabel: string;
    noResults: string;
    askAi: string;
    navigateHint: string;
    selectHint: string;
    closeHint: string;
  };
  aiChatWidget: {
    headerTitle: string;
    closeChatAriaLabel: string;
    introText: string;
    thinking: string;
    inputPlaceholder: string;
    sendAriaLabel: string;
    launcherPrompt: string;
    dismissAriaLabel: string;
    openAriaLabel: string;
  };
  navbar: {
    searchAriaLabel: string;
    hireMeLabel: string;
    openMenuAriaLabel: string;
    closeMenuAriaLabel: string;
  };
  footer: {
    builtWithTemplate: string;
    hireMeLabel: string;
  };
  notFound: {
    title: string;
    body: string;
    goHome: string;
  };
  resume: {
    summary: string;
    technicalSkills: string;
    experience: string;
    projects: string;
    education: string;
    trainingAndCertifications: string;
    techStackLabel: string;
    verify: string;
    code: string;
    frontend: string;
    backend: string;
    verifyBracket: string;
  };
  socialLabels: {
    github: string;
    linkedin: string;
    leetcode: string;
    upwork: string;
    portfolio: string;
  };
}
