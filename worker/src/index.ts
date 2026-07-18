export interface Env {
  AI: Ai;
  // Both optional: only present once you opt in via `wrangler kv namespace create`
  // and `wrangler secret put` — see worker/README.md. Absent = logging silently no-ops.
  CHAT_LOG?: KVNamespace;
  ADMIN_KEY?: string;
}

const REPO_OWNER = "developerhridu";
const CONTENT_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/developerhridu.github.io/main/content`;
const ALLOWED_ORIGINS = ["https://developerhridu.github.io", "http://localhost:3000"];
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin");
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

async function logQa(env: Env, question: string, answer: string) {
  if (!env.CHAT_LOG) return;
  try {
    const key = `qa:${Date.now()}:${crypto.randomUUID()}`;
    await env.CHAT_LOG.put(
      key,
      JSON.stringify({ question, answer, timestamp: new Date().toISOString() }),
      { expirationTtl: 60 * 60 * 24 * 90 } // keep 90 days
    );
  } catch {
    // Best-effort logging only — never let this affect the actual chat response.
  }
}

/** True if `token` is a valid GitHub token belonging to the repo owner — lets the admin
 *  panel reuse the same GitHub PAT it already collected instead of a separate secret. */
async function isRepoOwnerToken(token: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "hridu-portfolio-ai-chat-worker",
      },
    });
    if (!res.ok) return false;
    const data = await res.json<{ login?: string }>();
    return data.login === REPO_OWNER;
  } catch {
    return false;
  }
}

async function handleLogs(request: Request, env: Env): Promise<Response> {
  if (!env.CHAT_LOG) {
    return new Response(JSON.stringify({ error: "Logging is not configured for this Worker" }), {
      status: 501,
      headers: { "Content-Type": "application/json", ...corsHeaders(request) },
    });
  }

  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const isAdminKey = !!token && !!env.ADMIN_KEY && token === env.ADMIN_KEY;
  const isAuthorized = isAdminKey || (!!token && (await isRepoOwnerToken(token)));

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders(request) },
    });
  }

  const list = await env.CHAT_LOG.list({ prefix: "qa:", limit: 100 });
  const sortedKeys = [...list.keys].sort((a, b) => b.name.localeCompare(a.name));
  const entries = await Promise.all(
    sortedKeys.map(async (k) => {
      const value = await env.CHAT_LOG!.get(k.name);
      return value ? JSON.parse(value) : null;
    })
  );

  return new Response(JSON.stringify({ entries: entries.filter(Boolean) }), {
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
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
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (request.method === "GET" && url.pathname === "/logs") {
      return handleLogs(request, env);
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders(request) });
    }

    let question: string;
    let history: { role: "user" | "assistant"; content: string }[];
    try {
      const body = await request.json<{
        question?: string;
        history?: { role?: string; content?: string }[];
      }>();
      question = (body.question ?? "").trim().slice(0, 500);
      history = Array.isArray(body.history)
        ? body.history
            .filter(
              (m): m is { role: "user" | "assistant"; content: string } =>
                (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
            )
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }))
        : [];
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
          ...history,
          { role: "user", content: question },
        ],
      });

      const answer =
        (result as { response?: string }).response?.trim() ||
        "Sorry, I couldn't come up with an answer to that.";

      ctx.waitUntil(logQa(env, question, answer));

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
