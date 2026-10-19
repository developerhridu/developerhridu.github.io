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

function seoLength(text: string, min: number, max: number, label: string): string | null {
  if (!text) return null;
  if (text.length > max) return `${label} is ${text.length} characters — search engines cut it off after ~${max}.`;
  if (text.length < min) return `${label} is only ${text.length} characters — aim for ${min}–${max}.`;
  return null;
}

/** Scans all content for problems worth fixing before (or after) they reach the site. */
export function findIssues(items: AdminItem[], repoImages: Set<string>): Issue[] {
  const issues: Issue[] = [];
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
