import { fetchContentFile } from "@/lib/github";

type Raw = Record<string, unknown>;

interface Source {
  tab: string;
  tabLabel: string;
  path: string;
  arrayKey: string;
  /** Field shown as the item's name. */
  titleField: string;
  subtitleField?: string;
  /** How the editor opens an entry: article editors by slug, the rest by id. */
  openBy: "slug" | "id";
  /** Entries have a cover image / description worth checking in Content health. */
  article?: boolean;
}

export const CONTENT_SOURCES: Source[] = [
  { tab: "blog", tabLabel: "Blog Posts", path: "content/blogs.json", arrayKey: "posts", titleField: "title", subtitleField: "date", openBy: "slug", article: true },
  { tab: "case-study", tabLabel: "Case Studies", path: "content/case-studies.json", arrayKey: "caseStudies", titleField: "title", subtitleField: "date", openBy: "slug", article: true },
  { tab: "projects", tabLabel: "Projects", path: "content/projects.json", arrayKey: "projects", titleField: "title", openBy: "slug", article: true },
  { tab: "clients", tabLabel: "Clients", path: "content/clients.json", arrayKey: "clients", titleField: "name", openBy: "slug", article: true },
  { tab: "experience", tabLabel: "Experience", path: "content/experience.json", arrayKey: "experiences", titleField: "company", subtitleField: "role", openBy: "id" },
  { tab: "certifications", tabLabel: "Certifications", path: "content/certifications.json", arrayKey: "certifications", titleField: "name", subtitleField: "issuer", openBy: "id" },
  { tab: "education", tabLabel: "Education", path: "content/education.json", arrayKey: "education", titleField: "degree", subtitleField: "institution", openBy: "id" },
  { tab: "services", tabLabel: "Services", path: "content/services.json", arrayKey: "services", titleField: "title", openBy: "id" },
  { tab: "testimonials", tabLabel: "Testimonials", path: "content/testimonials.json", arrayKey: "testimonials", titleField: "name", subtitleField: "company", openBy: "id" },
  { tab: "menu", tabLabel: "Menu", path: "content/menu.json", arrayKey: "navLinks", titleField: "name", subtitleField: "href", openBy: "id" },
  { tab: "seo", tabLabel: "SEO / Metadata", path: "content/seo.json", arrayKey: "routes", titleField: "title", subtitleField: "route", openBy: "id" },
  { tab: "sections", tabLabel: "Section Copy", path: "content/sections.json", arrayKey: "sections", titleField: "title", subtitleField: "id", openBy: "id" },
  { tab: "employers", tabLabel: "Employers", path: "content/experience.json", arrayKey: "experiences", titleField: "company", subtitleField: "role", openBy: "id" },
  { tab: "skill-categories", tabLabel: "Skill Categories", path: "content/skill-categories.json", arrayKey: "categories", titleField: "label", subtitleField: "key", openBy: "id" },
  { tab: "proficiency", tabLabel: "Proficiency", path: "content/proficiency.json", arrayKey: "proficiency", titleField: "name", subtitleField: "level", openBy: "id" },
  { tab: "tasks", tabLabel: "Tasks", path: "content/tasks.json", arrayKey: "tasks", titleField: "text", openBy: "id" },
];

/**
 * Content files that are not entry lists but can still reference an image. Anything that
 * scans for image usage has to include these, or an image used only by, say, profile.json
 * looks unused and is offered up for deletion.
 */
export const NON_LIST_CONTENT_FILES = [
  "content/profile.json",
  "content/config.json",
  "content/ui-strings.json",
  "content/faq-script.json",
  "content/tech-stack.json",
  "content/admin-menu.json",
];

export interface AdminItem {
  source: Source;
  label: string;
  sublabel: string;
  published: boolean;
  /** What to pass the editor to open this entry. */
  open: { tab: string; slug?: string; id?: string };
  raw: Raw;
}

export interface AdminContent {
  items: AdminItem[];
  /** Files that couldn't be loaded (e.g. missing), so callers can say so. */
  failed: string[];
}

const str = (value: unknown) => (typeof value === "string" ? value : value == null ? "" : String(value));

/** Loads every editable content file (pending edits included) as one flat, searchable list. */
export async function loadAdminContent(token: string): Promise<AdminContent> {
  const failed: string[] = [];
  const lists = await Promise.all(
    CONTENT_SOURCES.map(async (source) => {
      try {
        const { content } = await fetchContentFile(source.path, token);
        const entries = (JSON.parse(content)[source.arrayKey] as Raw[] | undefined) ?? [];
        return entries.map((raw): AdminItem => ({
          source,
          label: str(raw[source.titleField]) || str(raw.id) || "Untitled",
          sublabel: source.subtitleField ? str(raw[source.subtitleField]) : "",
          published: raw.published !== false,
          open: source.openBy === "slug" ? { tab: source.tab, slug: str(raw.slug) } : { tab: source.tab, id: str(raw.id) },
          raw,
        }));
      } catch {
        failed.push(source.path);
        return [];
      }
    })
  );
  return { items: lists.flat(), failed };
}

/** Every "/images/…" path referenced anywhere inside a value (markdown bodies included). */
export function referencedImages(value: unknown, out = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\/images\/[A-Za-z0-9_\-./%]+\.(?:png|jpe?g|webp|gif|svg|avif)/gi)) out.add(match[0]);
  } else if (Array.isArray(value)) {
    value.forEach((item) => referencedImages(item, out));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => referencedImages(item, out));
  }
  return out;
}
