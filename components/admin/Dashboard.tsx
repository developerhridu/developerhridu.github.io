"use client";

import { useEffect, useState } from "react";
import { TrendingUp, MessageSquareText, MousePointerClick, Quote as QuoteIcon, RefreshCw, ExternalLink } from "lucide-react";
import { fetchContentFile, GitHubApiError } from "@/lib/github";
import { WORKER_URL } from "@/lib/workerUrl";
import ContentHealth from "@/components/admin/ContentHealth";
import type { SearchTarget } from "@/components/admin/AdminSearch";

const TESTIMONIALS_PATH = "content/testimonials.json";

interface DashboardProps {
  token: string;
  onAuthError: () => void;
  /** Opens an entry in its editor (used by Content health). */
  onOpen?: (target: SearchTarget) => void;
}

interface LogEntry {
  question: string;
  answer: string;
  timestamp: string;
}

interface TopItem {
  type: string;
  slug: string;
  count: number;
}

interface ClickItem {
  area: string;
  label: string;
  count: number;
}

export default function Dashboard({ token, onAuthError, onOpen }: DashboardProps) {
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [pendingTestimonials, setPendingTestimonials] = useState<number | null>(null);
  const [recentQuestions, setRecentQuestions] = useState<LogEntry[] | null>(null);
  const [topClicks, setTopClicks] = useState<ClickItem[]>([]);
  const [totalClicks, setTotalClicks] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadViews(), loadTestimonials(), loadChatLogs(), loadClicks()]);
    setLoading(false);
  }

  async function loadViews() {
    if (!WORKER_URL) return;
    try {
      const res = await fetch(`${WORKER_URL}/views/top?limit=5`);
      if (!res.ok) return;
      const data = (await res.json()) as { items?: TopItem[]; total?: number };
      setTopItems(data.items ?? []);
      setTotalViews(data.total ?? 0);
    } catch {
      // Views are a nice-to-have on the dashboard — don't block the rest.
    }
  }

  async function loadClicks() {
    if (!WORKER_URL) return;
    try {
      const res = await fetch(`${WORKER_URL}/clicks/top?limit=12`);
      if (!res.ok) return;
      const data = (await res.json()) as { items?: ClickItem[]; total?: number };
      setTopClicks(data.items ?? []);
      setTotalClicks(data.total ?? 0);
    } catch {
      // Click counts are a nice-to-have — don't block the rest of the dashboard.
    }
  }

  async function loadTestimonials() {
    try {
      const { content } = await fetchContentFile(TESTIMONIALS_PATH, token);
      const parsed = JSON.parse(content) as { testimonials?: { published?: boolean }[] };
      setPendingTestimonials((parsed.testimonials ?? []).filter((t) => t.published === false).length);
    } catch (err) {
      if (err instanceof GitHubApiError && (err.status === 401 || err.status === 403)) {
        onAuthError();
      }
    }
  }

  async function loadChatLogs() {
    if (!WORKER_URL) return;
    try {
      const res = await fetch(`${WORKER_URL}/logs`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = (await res.json()) as { entries?: LogEntry[] };
      setRecentQuestions((data.entries ?? []).slice(0, 5));
    } catch {
      // Chat logs are optional context on this dashboard — fine if unavailable.
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">A quick look at how the site&apos;s doing.</p>
        <button
          onClick={() => void loadAll()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted hover:text-foreground rounded-lg text-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wide mb-2">
            <TrendingUp size={14} /> Total Views
          </div>
          <p className="text-3xl font-bold text-foreground">
            {totalViews === null ? "—" : totalViews.toLocaleString()}
          </p>
        </div>
        <div className="p-5 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wide mb-2">
            <QuoteIcon size={14} /> Pending Testimonials
          </div>
          <p className="text-3xl font-bold text-foreground">
            {pendingTestimonials === null ? "—" : pendingTestimonials}
          </p>
        </div>
        <div className="p-5 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wide mb-2">
            <MousePointerClick size={14} /> Tracked Clicks
          </div>
          <p className="text-3xl font-bold text-foreground">
            {totalClicks === null ? "—" : totalClicks.toLocaleString()}
          </p>
        </div>
        <div className="p-5 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wide mb-2">
            <MessageSquareText size={14} /> Recent Chat Questions
          </div>
          <p className="text-3xl font-bold text-foreground">
            {recentQuestions === null ? "—" : recentQuestions.length}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">Most clicked</p>
          <a
            href="https://clarity.microsoft.com/projects"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Open heatmaps in Clarity <ExternalLink size={11} />
          </a>
        </div>
        {topClicks.length === 0 ? (
          <p className="rounded-lg border border-border px-4 py-3 text-sm text-muted">
            No clicks recorded yet. Counts start once the site is deployed and visitors click a card or link.
          </p>
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border">
            {topClicks.map((item) => (
              <div key={`${item.area}:${item.label}`} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="min-w-0 truncate text-foreground">
                  <span className="mr-2 text-muted">[{item.area}]</span>
                  {item.label}
                </span>
                <span className="ml-4 shrink-0 text-muted">{item.count.toLocaleString()} clicks</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ContentHealth token={token} onOpen={onOpen} />

      {topItems.length > 0 && (
        <div className="mb-8">
          <p className="text-sm font-semibold text-foreground mb-3">Most Read</p>
          <div className="border border-border rounded-lg divide-y divide-border">
            {topItems.map((item) => (
              <div
                key={`${item.type}:${item.slug}`}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="text-foreground truncate">
                  <span className="text-muted mr-2">[{item.type}]</span>
                  {item.slug}
                </span>
                <span className="text-muted shrink-0 ml-4">{item.count.toLocaleString()} views</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentQuestions && recentQuestions.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Recent Chat Questions</p>
          <div className="space-y-2">
            {recentQuestions.map((q, i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <p className="text-xs text-muted mb-1">{new Date(q.timestamp).toLocaleString()}</p>
                <p className="text-sm text-foreground">{q.question}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
