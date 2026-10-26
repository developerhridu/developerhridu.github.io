"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import ContentCard, { type ContentCardItem } from "@/components/ui/ContentCard";
import { WORKER_URL } from "@/lib/workerUrl";
import uiStrings from "@/content/ui-strings.json";

export type ContentListingItem = ContentCardItem;

/**
 * The selected tag lives in the URL, read as external state rather than through
 * useSearchParams().
 *
 * useSearchParams() opts a component out of prerendering: under `output: export` its
 * Suspense boundary renders the fallback at build time, which left /blog and
 * /case-studies with no article links in the static HTML at all — invisible to any crawler
 * that doesn't run JavaScript, and blank until hydration. Reading location directly keeps
 * the whole grid server-rendered, and useSyncExternalStore is the right primitive for it:
 * the URL is external state that changes outside React.
 */
const TAG_CHANGED_EVENT = "portfolio:tag-filter";

function subscribeToTag(onChange: () => void) {
  window.addEventListener(TAG_CHANGED_EVENT, onChange);
  // Also covers the back/forward buttons.
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener(TAG_CHANGED_EVENT, onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function readTag(): string {
  try {
    return new URLSearchParams(window.location.search).get("tag") ?? "";
  } catch {
    return "";
  }
}

/** No URL on the server, so the prerendered page shows everything — which is what a crawler should see. */
function readTagOnServer(): string {
  return "";
}

interface ContentListingProps {
  type: "blog" | "case-study";
  items: ContentListingItem[];
  emptyMessage: string;
}

export default function ContentListing({ type, items, emptyMessage }: ContentListingProps) {
  const [popular, setPopular] = useState<{ slug: string; count: number }[]>([]);
  const urlTag = useSyncExternalStore(subscribeToTag, readTag, readTagOnServer);

  const viewPath = type === "blog" ? "/blog" : "/case-studies";
  const tags = useMemo(() => Array.from(new Set(items.flatMap((i) => i.tags))).sort(), [items]);

  // An unknown tag in a shared link falls back to showing everything.
  const selectedTag = urlTag && tags.includes(urlTag) ? urlTag : null;

  function selectTag(tag: string | null) {
    try {
      const url = new URL(window.location.href);
      if (tag) url.searchParams.set("tag", tag);
      else url.searchParams.delete("tag");
      // replaceState, not router.replace: the filter is a view of this page, not a new
      // one, and this avoids re-running the route.
      window.history.replaceState(null, "", url);
      window.dispatchEvent(new Event(TAG_CHANGED_EVENT));
    } catch {
      // A failed URL update must not stop the filter working.
    }
  }

  const filtered = selectedTag ? items.filter((i) => i.tags.includes(selectedTag)) : items;

  useEffect(() => {
    if (!WORKER_URL) return;
    fetch(`${WORKER_URL}/views/top?type=${type}&limit=3`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items?: { slug: string; count: number }[] } | null) => {
        if (data?.items) setPopular(data.items);
      })
      .catch(() => {});
  }, [type]);

  const popularItems = popular
    .filter((p) => p.count > 0)
    .map((p) => items.find((i) => i.slug === p.slug))
    .filter((i): i is ContentListingItem => !!i);

  return (
    <>
      {popularItems.length > 0 && (
        <div className="mb-10">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <TrendingUp size={16} className="text-accent" /> {uiStrings.blogCaseStudyListing.mostRead}
          </p>
          <div className="flex flex-wrap gap-3">
            {popularItems.map((item) => (
              <Link
                key={item.slug}
                href={`${viewPath}/${item.slug}`}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-accent/40 text-sm text-muted hover:text-foreground transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8" role="group" aria-label="Filter by tag">
          <button
            onClick={() => selectTag(null)}
            aria-pressed={selectedTag === null}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide border transition-colors ${
              selectedTag === null
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border text-muted hover:text-foreground hover:border-accent/40"
            }`}
          >
            {uiStrings.blogCaseStudyListing.allTag}
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => selectTag(tag)}
              aria-pressed={selectedTag === tag}
              className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide border transition-colors ${
                selectedTag === tag
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-border text-muted hover:text-foreground hover:border-accent/40"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {selectedTag && (
        <p role="status" className="-mt-4 mb-8 text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"} tagged{" "}
          <span className="text-foreground">{selectedTag}</span>
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted text-lg">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <ContentCard key={item.slug} item={item} viewPath={viewPath} showReadMore />
          ))}
        </div>
      )}
    </>
  );
}
