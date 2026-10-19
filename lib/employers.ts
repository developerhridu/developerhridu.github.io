import experienceData from "@/content/experience.json";
import type { Employer, Experience } from "@/types";
import { isPublished } from "@/lib/published";

/** URL slug from the company name, minus any "(Concern of …)"-style aside. */
function employerSlug(experience: Experience): string {
  const slug = experience.company
    .replace(/\(.*?\)/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || experience.id;
}

/** Employers are derived from experience.json — edit them in the admin's Experience tab. */
function toEmployer(experience: Experience): Employer {
  const projects = experience.projects ?? [];
  const productList = projects.map((project) =>
    project.description ? `- **${project.name}** — ${project.description}` : `- **${project.name}**`
  );
  const highlights = projects.flatMap((project) => project.highlights ?? []);

  return {
    id: experience.id,
    slug: employerSlug(experience),
    name: experience.company,
    url: experience.companyUrl ?? null,
    role: experience.role,
    period: experience.period,
    location: experience.location,
    published: experience.published,
    description: experience.summary?.trim() || `${experience.role} at ${experience.company} · ${experience.period}`,
    tags: [...new Set(projects.flatMap((project) => project.technologies ?? []))],
    coverImages: experience.logo ? [experience.logo] : [],
    proofOfWorkImages: experience.photos ?? [],
    body: [
      productList.length ? `## Products\n\n${productList.join("\n")}` : "",
      highlights.length ? `## What I Did\n\n${highlights.map((highlight) => `- ${highlight}`).join("\n")}` : "",
      experience.verifyUrl ? `[Verify employment ↗](${experience.verifyUrl})` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    sections: [],
    ...experience.related,
  };
}

const EMPLOYERS = (experienceData.experiences as Experience[]).map(toEmployer);

/** All employers, including unpublished ones — draft detail pages are still generated for preview. */
export function getEmployers(): Employer[] {
  return EMPLOYERS;
}

export function getPublishedEmployers(): Employer[] {
  return EMPLOYERS.filter(isPublished);
}

export function getEmployer(slug: string): Employer | undefined {
  return EMPLOYERS.find((employer) => employer.slug === slug);
}
