import type { RelatedRefs } from "@/types";
import { isPublished } from "@/lib/published";

export type RelatedKind = "project" | "case-study" | "blog" | "client";

/** One card in the Related Content grid. */
export interface RelatedItem {
  kind: RelatedKind;
  slug: string;
  title: string;
  description: string;
  image?: string;
  tags?: string[];
  date?: string;
}

interface SourceItem {
  slug: string;
  title?: string;
  name?: string;
  description?: string;
  image?: string;
  tags?: string[];
  date?: string;
  published?: boolean;
}

/** Everything a related item can be picked from (plain JSON arrays — works on server and in the admin). */
export interface RelatedSources {
  projects: SourceItem[];
  caseStudies: SourceItem[];
  blogs: SourceItem[];
  clients: SourceItem[];
}

const KIND_BY_KEY: [keyof RelatedSources, RelatedKind][] = [
  ["projects", "project"],
  ["caseStudies", "case-study"],
  ["blogs", "blog"],
  ["clients", "client"],
];

export function toRelatedItem(kind: RelatedKind, item: SourceItem): RelatedItem {
  return {
    kind,
    slug: item.slug,
    title: item.title ?? item.name ?? item.slug,
    description: item.description ?? "",
    image: item.image,
    tags: item.tags,
    date: item.date,
  };
}

/** Resolves an entry's picked slugs into cards, in selection order, skipping drafts and missing items. */
export function resolveRelated(refs: RelatedRefs, sources: RelatedSources): RelatedItem[] {
  return KIND_BY_KEY.flatMap(([key, kind]) =>
    (refs[key] ?? [])
      .map((slug) => sources[key].find((item) => item.slug === slug))
      .filter((item): item is SourceItem => !!item && isPublished(item))
      .map((item) => toRelatedItem(kind, item))
  );
}
