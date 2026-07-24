"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import ContentCard, { type ContentCardItem } from "@/components/ui/ContentCard";
import { WORKER_URL } from "@/lib/workerUrl";

export type ContentListingItem = ContentCardItem;

interface ContentListingProps {
  type: "blog" | "case-study";
  items: ContentListingItem[];
  emptyMessage: string;
}

export default function ContentListing({ type, items, emptyMessage }: ContentListingProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [popular, setPopular] = useState<{ slug: string; count: number }[]>([]);

  const viewPath = type === "blog" ? "/blog" : "/case-studies";
  const tags = useMemo(() => Array.from(new Set(items.flatMap((i) => i.tags))).sort(), [items]);
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
            <TrendingUp size={16} className="text-accent" /> Most Read
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
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide border transition-colors ${
              selectedTag === null
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border text-muted hover:text-foreground hover:border-accent/40"
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
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
