"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, Building2, TrendingUp } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import ContentImage from "@/components/ui/ContentImage";
import config from "@/content/config.json";

const WORKER_URL = config.aiChatWorkerUrl.replace(/\/$/, "");

export interface ContentListingItem {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  image?: string;
  client?: string;
  readingMinutes: number;
}

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
            <Link key={item.slug} href={`${viewPath}/${item.slug}`}>
              <GlassCard className="h-full flex flex-col group cursor-pointer">
                <ContentImage
                  src={item.image}
                  alt={item.title}
                  wrapperClassName="h-48 rounded-lg mb-4"
                  imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  initials={item.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                />

                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="font-mono px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded text-xs uppercase tracking-wide"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted text-sm mb-4 line-clamp-2">{item.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {item.client && (
                      <span className="flex items-center gap-1">
                        <Building2 size={14} />
                        {item.client}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {item.readingMinutes} min read
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-accent group-hover:gap-2 transition-all shrink-0">
                    Read more <ArrowRight size={14} />
                  </span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
