import { getPending } from "@/lib/adminStore";
import { referencedImages, type AdminItem } from "@/components/admin/adminContent";

export type Severity = "error" | "warning" | "info";

export interface Issue {
  severity: Severity;
  group: string;
  item: AdminItem;
  message: string;
}

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/**
 * Markdown images written as `![](path)` — no alt text. Screen readers announce nothing
 * for these, and nothing else in the admin flags them.
 */
function imagesMissingAlt(value: unknown, found: string[] = []): string[] {
  if (typeof value === "string") {
    for (const match of value.matchAll(/!\[\s*\]\(([^)\s]+)/g)) found.push(match[1]);
  } else if (Array.isArray(value)) {
    value.forEach((entry) => imagesMissingAlt(entry, found));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => imagesMissingAlt(entry, found));
  }
  return found;
}

/** Duplicate slugs break routing: two entries fight over the same URL. */
function duplicateValues(items: AdminItem[], field: string): Set<string> {
  const seen = new Map<string, number>();
  for (const item of items) {
    const value = str(item.raw[field]).toLowerCase();
    if (value) seen.set(value, (seen.get(value) ?? 0) + 1);
  }
  return new Set([...seen].filter(([, count]) => count > 1).map(([value]) => value));
}

function seoLength(text: string, min: number, max: number, label: string): string | null {
  if (!text) return null;
  if (text.length > max) return `${label} is ${text.length} characters — search engines cut it off after ~${max}.`;
  if (text.length < min) return `${label} is only ${text.length} characters — aim for ${min}–${max}.`;
  return null;
}

/** Scans all content for problems worth fixing before (or after) they reach the site. */
export function findIssues(items: AdminItem[], repoImages: Set<string>): Issue[] {
  const issues: Issue[] = [];
  /** Duplicate slugs, checked per content type rather than across the whole site. */
  const duplicateSlugs = new Map<string, Set<string>>();
  for (const tab of new Set(items.map((item) => item.source.tab))) {
    duplicateSlugs.set(tab, duplicateValues(items.filter((item) => item.source.tab === tab), "slug"));
  }
  const staged = new Map(getPending().files.map((file) => [file.path, file.content]));
  const imageExists = (path: string) => {
    const pending = staged.get(`public${path}`);
    if (pending !== undefined) return pending !== null;
    return repoImages.has(path) || repoImages.has(decodeURI(path));
  };

  for (const item of items) {
    const { raw, source } = item;

    if (!item.published) issues.push({ severity: "info", group: "Drafts", item, message: "Draft — not visible on the site." });

    if (source.article) {
      if (!str(raw.description)) {
        issues.push({ severity: "warning", group: "Missing details", item, message: "No description (used for cards and search-engine snippets)." });
      } else if (source.tab === "blog" || source.tab === "case-study") {
        const message = seoLength(str(raw.description), 70, 160, "Description");
        if (message) issues.push({ severity: "info", group: "SEO text", item, message });
      }
      const covers = Array.isArray(raw.coverImages) ? raw.coverImages : raw.image ? [raw.image] : [];
      if (covers.length === 0) issues.push({ severity: "warning", group: "Missing details", item, message: "No cover image — cards fall back to initials." });
    }

    if (source.tab === "services" && !str(raw.description)) {
      issues.push({ severity: "warning", group: "Missing details", item, message: "No description." });
    }

    if (source.tab === "seo") {
      const title = seoLength(str(raw.title), 30, 60, "Title");
      const description = seoLength(str(raw.description), 120, 160, "Description");
      if (!str(raw.description)) issues.push({ severity: "warning", group: "SEO text", item, message: "No meta description." });
      if (title) issues.push({ severity: "info", group: "SEO text", item, message: title });
      if (description) issues.push({ severity: "info", group: "SEO text", item, message: description });
    }

    const noAlt = imagesMissingAlt(raw);
    if (noAlt.length > 0) {
      issues.push({
        severity: "warning",
        group: "Accessibility",
        item,
        message: `${noAlt.length === 1 ? "An image has" : `${noAlt.length} images have`} no alt text: ${noAlt
          .slice(0, 3)
          .map((path) => path.split("/").pop())
          .join(", ")}${noAlt.length > 3 ? "…" : ""}. Describe it inside the square brackets.`,
      });
    }

    const slug = str(raw.slug).toLowerCase();
    if (slug && duplicateSlugs.get(source.tab)?.has(slug)) {
      issues.push({
        severity: "error",
        group: "Duplicate slugs",
        item,
        message: `Another ${source.tabLabel.toLowerCase()} entry uses the slug "${slug}" — they fight over the same URL.`,
      });
    }

    const missing = [...referencedImages(raw)].filter((path) => !imageExists(path));
    if (missing.length > 0) {
      issues.push({
        severity: "error",
        group: "Broken images",
        item,
        message: `${missing.length === 1 ? "Image" : `${missing.length} images`} not found: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`,
      });
    }
  }
  return issues;
}
