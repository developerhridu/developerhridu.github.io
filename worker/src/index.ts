export interface Env {
  AI: Ai;
}

const CONTENT_BASE =
  "https://raw.githubusercontent.com/developerhridu/developerhridu.github.io/main/content";
const ALLOWED_ORIGINS = ["https://developerhridu.github.io", "http://localhost:3000"];
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin");
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

async function fetchJson(path: string): Promise<unknown> {
  try {
    const res = await fetch(`${CONTENT_BASE}/${path}`, {
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface ProfileData {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  location: string;
  yearsOfExperience: number;
  email: string;
  social?: { github?: string; linkedin?: string };
}

interface ExperienceProject {
  name: string;
  description?: string;
  technologies?: string[];
  highlights?: string[];
}

interface ExperienceEntry {
  role: string;
  company: string;
  period: string;
  location?: string;
  projects?: ExperienceProject[];
}

interface ProjectEntry {
  title: string;
  description: string;
  tags?: string[];
}

interface EducationEntry {
  degree: string;
  institution: string;
  period: string;
}

interface CertificationEntry {
  name: string;
  issuer: string;
  date: string;
}

interface PostEntry {
  title: string;
  description: string;
  published?: boolean;
}

async function buildContext(): Promise<string> {
  const [profile, experience, projects, techStack, education, certifications, blogs, caseStudies] =
    await Promise.all([
      fetchJson("profile.json"),
      fetchJson("experience.json"),
      fetchJson("projects.json"),
      fetchJson("tech-stack.json"),
      fetchJson("education.json"),
      fetchJson("certifications.json"),
      fetchJson("blogs.json"),
      fetchJson("case-studies.json"),
    ]);

  const parts: string[] = [];

  if (profile) {
    const p = profile as ProfileData;
    parts.push(
      `NAME: ${p.name}\nTITLE: ${p.title}\nTAGLINE: ${p.tagline}\nBIO: ${p.bio}\nLOCATION: ${p.location}\nYEARS OF EXPERIENCE: ${p.yearsOfExperience}\nEMAIL: ${p.email}\nGITHUB: ${p.social?.github ?? ""}\nLINKEDIN: ${p.social?.linkedin ?? ""}`
    );
  }

  if (experience) {
    const exps = ((experience as { experiences?: ExperienceEntry[] }).experiences ?? []);
    const text = exps
      .map((e) => {
        const projectsText = (e.projects ?? [])
          .map(
            (proj) =>
              `  - ${proj.name}: ${proj.description ?? ""} Tech: ${(proj.technologies ?? []).join(", ")}. Highlights: ${(proj.highlights ?? []).join("; ")}`
          )
          .join("\n");
        return `${e.role} at ${e.company} (${e.period}, ${e.location ?? ""})\n${projectsText}`;
      })
      .join("\n\n");
    parts.push(`EXPERIENCE:\n${text}`);
  }

  if (projects) {
    const projs = (projects as { projects?: ProjectEntry[] }).projects ?? [];
    const text = projs
      .map((p) => `- ${p.title}: ${p.description} (Tech: ${(p.tags ?? []).join(", ")})`)
      .join("\n");
    parts.push(`PERSONAL/FEATURED PROJECTS:\n${text}`);
  }

  if (techStack) {
    const t = techStack as Record<string, string[]>;
    const text = Object.entries(t)
      .map(([k, v]) => `${k}: ${v.join(", ")}`)
      .join("\n");
    parts.push(`TECH STACK:\n${text}`);
  }

  if (education) {
    const edu = (education as { education?: EducationEntry[] }).education ?? [];
    const text = edu.map((e) => `- ${e.degree}, ${e.institution} (${e.period})`).join("\n");
    parts.push(`EDUCATION:\n${text}`);
  }

  if (certifications) {
    const certs = (certifications as { certifications?: CertificationEntry[] }).certifications ?? [];
    const text = certs.map((c) => `- ${c.name} (${c.issuer}, ${c.date})`).join("\n");
    parts.push(`CERTIFICATIONS:\n${text}`);
  }

  if (blogs) {
    const posts = (blogs as { posts?: PostEntry[] }).posts ?? [];
    const text = posts
      .filter((p) => p.published !== false)
      .map((p) => `- ${p.title}: ${p.description}`)
      .join("\n");
    if (text) parts.push(`BLOG POSTS:\n${text}`);
  }

  if (caseStudies) {
    const studies = (caseStudies as { caseStudies?: PostEntry[] }).caseStudies ?? [];
    const text = studies
      .filter((s) => s.published !== false)
      .map((s) => `- ${s.title}: ${s.description}`)
      .join("\n");
    if (text) parts.push(`CASE STUDIES:\n${text}`);
  }

  return parts.join("\n\n");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders(request) });
    }

    let question: string;
    try {
      const body = await request.json<{ question?: string }>();
      question = (body.question ?? "").trim().slice(0, 500);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(request) },
      });
    }

    if (!question) {
      return new Response(JSON.stringify({ error: "Question is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(request) },
      });
    }

    const context = await buildContext();

    const systemPrompt = `You are a friendly assistant on Mizanur Rahman's portfolio website. Answer visitor questions about Mizanur using ONLY the information below. Speak about him in the third person. Be concise (3-5 sentences max unless listing items). If asked something not covered by this information, say you don't have that detail and suggest the visitor use the Contact page. Do not make up facts.\n\n${context}`;

    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      });

      const answer =
        (result as { response?: string }).response?.trim() ||
        "Sorry, I couldn't come up with an answer to that.";

      return new Response(JSON.stringify({ answer }), {
        headers: { "Content-Type": "application/json", ...corsHeaders(request) },
      });
    } catch {
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders(request) },
      });
    }
  },
};
