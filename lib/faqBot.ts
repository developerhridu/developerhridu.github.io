import Fuse from "fuse.js";
import profile from "@/content/profile.json";
import experienceData from "@/content/experience.json";
import projectsData from "@/content/projects.json";
import techStack from "@/content/tech-stack.json";
import educationData from "@/content/education.json";
import certificationsData from "@/content/certifications.json";

interface Intent {
  id: string;
  phrases: string[];
  answer: () => string;
}

const intents: Intent[] = [
  {
    id: "projects",
    phrases: [
      "what projects has mizanur worked on",
      "what projects has he worked on",
      "show me his projects",
      "what has he built",
      "tell me about his projects",
      "portfolio projects",
      "what has he made",
    ],
    answer: () => {
      const featured = projectsData.projects.filter((p) => p.featured).slice(0, 5);
      const list = featured.map((p) => `• ${p.title} — ${p.description}`).join("\n");
      return `He's worked on ${projectsData.projects.length}+ projects. A few highlights:\n\n${list}\n\nSee the Projects page for the full list.`;
    },
  },
  {
    id: "tech-stack",
    phrases: [
      "what technologies does he use",
      "what tech stack does he use",
      "what languages does he know",
      "what does he work with",
      "skills",
      "tech stack",
      "programming languages",
    ],
    answer: () => {
      const parts = [
        `Backend: ${techStack.backend.join(", ")}`,
        `Frontend: ${techStack.frontend.join(", ")}`,
        `Database: ${techStack.database.join(", ")}`,
        `Architecture: ${techStack.architecture.join(", ")}`,
        `Messaging & Caching: ${techStack.messaging.join(", ")}`,
        `DevOps: ${techStack.devops.join(", ")}`,
        `Testing: ${techStack.testing.join(", ")}`,
      ];
      return `His core tech stack:\n\n${parts.join("\n")}`;
    },
  },
  {
    id: "microservices",
    phrases: [
      "tell me about his microservices experience",
      "microservices experience",
      "does he know microservices",
      "distributed systems experience",
      "architecture experience",
      "backend architecture",
    ],
    answer: () =>
      "Yes — he's architected multi-tenant, microservices-based SaaS platforms in production. At TechnoNext, he led development of a multi-tenant OTA SaaS spanning 36+ services (Microservices, .NET Core, RabbitMQ, MSSQL/PostgreSQL, MongoDB), supporting both B2B & B2C models with isolated per-client configurations, plus 8 supplier integrations (Sabre, Travelport, NDC, and more). He's also worked with event-driven design, CQRS, and clean architecture patterns.",
  },
  {
    id: "why-hire",
    phrases: [
      "why should i hire him",
      "why hire mizanur",
      "should i hire him",
      "is he a good fit",
      "why choose him",
      "what makes him a good hire",
    ],
    answer: () =>
      `${profile.tagline}. With ${profile.yearsOfExperience}+ years shipping production systems across travel, food delivery, and recruitment platforms, he's delivered measurable results — like cutting a client's ADM penalties by ~$23K-$27K with an automated booking-cancellation service, and reducing production failure rates by 30% through better observability. Check out the Case Studies page for the details, or the Contact page to reach out directly.`,
  },
  {
    id: "experience",
    phrases: [
      "what is his work experience",
      "where has he worked",
      "work history",
      "employment history",
      "career background",
      "companies he worked at",
    ],
    answer: () => {
      const list = experienceData.experiences
        .map((e) => `• ${e.role} at ${e.company} (${e.period})`)
        .join("\n");
      return `His work history:\n\n${list}\n\nSee the Experience page for the specific projects and impact at each company.`;
    },
  },
  {
    id: "education",
    phrases: [
      "what is his education",
      "where did he study",
      "degree",
      "university",
      "education background",
      "academic background",
    ],
    answer: () => {
      const list = educationData.education
        .map((e) => `• ${e.degree}, ${e.institution} (${e.period})`)
        .join("\n");
      return `Education:\n\n${list}`;
    },
  },
  {
    id: "certifications",
    phrases: [
      "what certifications does he have",
      "does he have any certifications",
      "any certifications",
      "certifications",
      "training courses",
      "credentials",
      "courses he has completed",
    ],
    answer: () => {
      const names = certificationsData.certifications.map((c) => c.name).join(", ");
      return `He holds ${certificationsData.certifications.length} certifications and training credentials, including: ${names}. Full details with verification links are on the Training & Certifications page.`;
    },
  },
  {
    id: "contact",
    phrases: [
      "how can i contact him",
      "how do i reach him",
      "contact info",
      "email address",
      "get in touch",
      "phone number",
    ],
    answer: () =>
      `You can reach him at ${profile.email}${profile.phone ? ` or ${profile.phone}` : ""}, or use the Contact page. He's also on GitHub (${profile.social.github}) and LinkedIn (${profile.social.linkedin}).`,
  },
  {
    id: "resume",
    phrases: ["can i see his resume", "cv", "resume", "download resume", "download cv"],
    answer: () =>
      "You can view his live, always up-to-date resume at /resume — it includes a Print / Save as PDF option.",
  },
  {
    id: "writing",
    phrases: ["does he have a blog", "case studies", "articles", "does he write", "technical writing"],
    answer: () =>
      "Yes — check out the Blog for technical writing, and Case Studies for deep dives into specific problems he's solved in production.",
  },
];

const GREETING_ANSWER = () =>
  `Hi! I can answer questions about ${profile.name}'s experience, projects, tech stack, and background. Try one of the suggestions below, or ask your own question.`;

const GREETINGS = new Set([
  "hi",
  "hello",
  "hey",
  "yo",
  "hii",
  "hiya",
  "good morning",
  "good evening",
  "good afternoon",
]);

const searchCorpus = intents.flatMap((intent) =>
  intent.phrases.map((phrase) => ({ phrase, intentId: intent.id }))
);

const fuse = new Fuse(searchCorpus, {
  keys: ["phrase"],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 3,
});

export interface ChatAnswer {
  text: string;
  matched: boolean;
}

const FALLBACK_ANSWER =
  "I don't have a good answer for that yet. Try asking about his projects, tech stack, experience, education, or how to get in touch.";

export function askFaqBot(query: string): ChatAnswer {
  const trimmed = query.trim();
  if (!trimmed) {
    return { text: "Ask me something about Mizanur's experience, projects, or skills!", matched: false };
  }

  const normalized = trimmed.toLowerCase().replace(/[!?.,]/g, "").trim();
  const firstWord = normalized.split(/\s+/)[0];
  if (GREETINGS.has(normalized) || GREETINGS.has(firstWord)) {
    return { text: GREETING_ANSWER(), matched: true };
  }

  const results = fuse.search(trimmed);
  if (results.length === 0) {
    return { text: FALLBACK_ANSWER, matched: false };
  }

  const intent = intents.find((i) => i.id === results[0].item.intentId);
  if (!intent) {
    return { text: FALLBACK_ANSWER, matched: false };
  }

  return { text: intent.answer(), matched: true };
}

export const STARTER_QUESTIONS = [
  "What projects has Mizanur worked on?",
  "What technologies does he use?",
  "Tell me about his microservices experience.",
  "Why should I hire him?",
];
