"use client";

import { useEffect, useState } from "react";
import { TrendingUp, MessageSquareText, MousePointerClick, Quote as QuoteIcon, RefreshCw, ExternalLink, SearchX, BookOpenCheck, Route, Radar } from "lucide-react";
import { fetchContentFile, GitHubApiError } from "@/lib/github";
import { WORKER_URL } from "@/lib/workerUrl";
import ContentHealth from "@/components/admin/ContentHealth";
import type { SearchTarget } from "@/components/admin/AdminSearch";

const TESTIMONIALS_PATH = "content/testimonials.json";
/** Only these types get view counts, so only these need slug → title lookups. */
const VIEW_SOURCES = [
  { type: "blog", path: "content/blogs.json", arrayKey: "posts", tab: "blog" },
  { type: "case-study", path: "content/case-studies.json", arrayKey: "caseStudies", tab: "case-study" },
];

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

interface LeadEntry {
  kind: "contact" | "testimonial";
  journey: string[];
  referrer: string;
  campaign: string;
  visit: number;
  minutes: number;
  timestamp: string;
}

interface SearchEntry {
  query: string;
  resultCount: number;
  timestamp: string;
}

interface Signal {
  name: string;
  label: string;
  count: number;
}

/** Signals of one name, biggest first. */
function ofName(signals: Signal[], name: string): Signal[] {
  return signals.filter((signal) => signal.name === name).sort((a, b) => b.count - a.count);
}

/**
 * Read-through per article: of the readers who got a quarter of the way in, how many
 * reached the end. A low rate is the clearest sign a piece loses people early — a plain
 * view count cannot distinguish that from a thorough read.
 */
function readThrough(signals: Signal[]) {
  const finished = new Map(ofName(signals, "scroll-100").map((signal) => [signal.label, signal.count]));
  return ofName(signals, "scroll-25")
    .map((signal) => {
      const finish = finished.get(signal.label) ?? 0;
      return {
        label: signal.label,
        start: signal.count,
        finish,
        rate: signal.count > 0 ? Math.round((finish / signal.count) * 100) : 0,
      };
    })
    .sort((a, b) => b.start - a.start);
}

/** "12 started, 5 left without sending (42% abandoned)", or null when nobody has started. */
function formFunnel(signals: Signal[]): string | null {
  const total = (name: string) => ofName(signals, name).reduce((sum, signal) => sum + signal.count, 0);
  const starts = total("form-start");
  if (starts === 0) return null;
  const abandons = total("form-abandon");
  const share = Math.round((abandons / starts) * 100);
  return `${starts} started, ${abandons} left without sending (${share}% abandoned)`;
}

const SIGNAL_PANELS = [
  { name: "referrer", title: "Where visitors come from" },
  { name: "campaign", title: "Tagged links (utm_source)" },
  { name: "section-view", title: "Home sections reached" },
  { name: "visit", title: "Visit number" },
];

export default function Dashboard({ token, onAuthError, onOpen }: DashboardProps) {
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [pendingTestimonials, setPendingTestimonials] = useState<number | null>(null);
  const [recentQuestions, setRecentQuestions] = useState<LogEntry[] | null>(null);
  const [topClicks, setTopClicks] = useState<ClickItem[]>([]);
  const [totalClicks, setTotalClicks] = useState<number | null>(null);
  /** All logged questions, so the tile can show a real count instead of its own cap. */
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  /** Searches that returned nothing — the clearest signal of missing content. */
  const [emptySearches, setEmptySearches] = useState<{ query: string; times: number; last: string }[]>([]);
  /** Raw signal counters: scroll depth, section views, referrers, form starts. */
  const [signals, setSignals] = useState<{ name: string; label: string; count: number }[]>([]);
  /** One record per enquiry: what they read before getting in touch. */
  const [leads, setLeads] = useState<LeadEntry[]>([]);
  const [loading, setLoading] = useState(false);
  /** "blog:my-slug" → entry title, so Most Read shows names rather than raw slugs. */
  const [titles, setTitles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([
      loadViews(),
      loadTestimonials(),
      loadChatLogs(),
      loadClicks(),
      loadSearches(),
      loadTitles(),
      loadSignals(),
      loadLeads(),
    ]);
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

  async function loadSignals() {
    if (!WORKER_URL) return;
    try {
      const res = await fetch(`${WORKER_URL}/signals/top?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: { name: string; label: string; count: number }[] };
      setSignals(data.items ?? []);
    } catch {
      // Behaviour signals are extra context — never block the rest of the dashboard.
    }
  }

  async function loadLeads() {
    if (!WORKER_URL) return;
    try {
      const res = await fetch(`${WORKER_URL}/leads`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = (await res.json()) as { entries?: LeadEntry[] };
      setLeads(data.entries ?? []);
    } catch {
      // Same: optional context.
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

  async function loadTitles() {
    const map = new Map<string, string>();
    await Promise.all(
      VIEW_SOURCES.map(async (source) => {
        try {
          const { content } = await fetchContentFile(source.path, token);
          const entries = (JSON.parse(content)[source.arrayKey] as { slug?: string; title?: string }[]) ?? [];
          for (const entry of entries) {
            if (entry.slug && entry.title) map.set(`${source.type}:${entry.slug}`, entry.title);
          }
        } catch {
          // Falling back to the slug is fine.
        }
      })
    );
    setTitles(map);
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
      const entries = data.entries ?? [];
      setQuestionCount(entries.length);
      setRecentQuestions(entries.slice(0, 5));
    } catch {
      // Chat logs are optional context on this dashboard — fine if unavailable.
    }
  }

  /**
   * Groups the zero-result searches by query. This was only visible in a separate tab,
   * even though "visitors looked for this and found nothing" is the most actionable
   * content signal the site collects.
   */
  async function loadSearches() {
    if (!WORKER_URL) return;
    try {
      const res = await fetch(`${WORKER_URL}/search-log`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = (await res.json()) as { entries?: SearchEntry[] };
      const counts = new Map<string, { query: string; times: number; last: string }>();
      for (const entry of data.entries ?? []) {
        if (entry.resultCount > 0) continue;
        const key = entry.query.trim().toLowerCase();
        if (!key) continue;
        const existing = counts.get(key);
        counts.set(key, {
          query: existing?.query ?? entry.query,
          times: (existing?.times ?? 0) + 1,
          last: !existing || entry.timestamp > existing.last ? entry.timestamp : existing.last,
        });
      }
      setEmptySearches([...counts.values()].sort((a, b) => b.times - a.times).slice(0, 8));
    } catch {
      // Search logs are optional context — never block the rest of the dashboard.
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
            <MessageSquareText size={14} /> Chat Questions
          </div>
          <p className="text-3xl font-bold text-foreground">
            {questionCount === null ? "—" : questionCount.toLocaleString()}
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

      {emptySearches.length > 0 && (
        <div className="mb-8">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
            <SearchX size={15} className="text-accent" /> Searched for, found nothing
          </p>
          <p className="mb-3 text-xs text-muted">What visitors looked for and the site had no answer to.</p>
          <div className="divide-y divide-border rounded-lg border border-border">
            {emptySearches.map((entry) => (
              <div key={entry.query} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="min-w-0 truncate text-foreground">{entry.query}</span>
                <span className="ml-4 shrink-0 text-muted">
                  {entry.times}× · {new Date(entry.last).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {leads.length > 0 && (
        <div className="mb-8">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Route size={15} className="text-accent" /> What they read before getting in touch
          </p>
          <p className="mb-3 text-xs text-muted">
            The path through the site for each enquiry — the one thing a counter can&apos;t tell you.
          </p>
          <div className="divide-y divide-border rounded-lg border border-border">
            {leads.slice(0, 8).map((lead) => (
              <div key={lead.timestamp} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="rounded bg-surface-hover px-1.5 py-0.5 font-medium text-foreground">{lead.kind}</span>
                  <span>{new Date(lead.timestamp).toLocaleString()}</span>
                  <span>via {lead.campaign || lead.referrer}</span>
                  <span>visit #{lead.visit}</span>
                  {lead.minutes > 0 && <span>{lead.minutes} min on site</span>}
                </div>
                <p className="mt-1.5 break-words font-mono text-xs text-foreground">
                  {lead.journey.length > 0 ? lead.journey.join("  →  ") : "(no pages recorded)"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {readThrough(signals).length > 0 && (
        <div className="mb-8">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
            <BookOpenCheck size={15} className="text-accent" /> Read-through
          </p>
          <p className="mb-3 text-xs text-muted">
            Of the readers who got a quarter of the way in, how many reached the end.
          </p>
          <div className="divide-y divide-border rounded-lg border border-border">
            {readThrough(signals)
              .slice(0, 8)
              .map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <span className="min-w-0 truncate text-foreground">{row.label}</span>
                  <span className="shrink-0 text-muted">
                    {row.rate}% finished{" "}
                    <span className="text-xs">
                      ({row.finish}/{row.start})
                    </span>
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {signals.length > 0 && (
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {SIGNAL_PANELS.map((panel) => {
            const rows = ofName(signals, panel.name);
            if (rows.length === 0) return null;
            return (
              <div key={panel.name}>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Radar size={14} className="text-accent" /> {panel.title}
                </p>
                <div className="divide-y divide-border rounded-lg border border-border">
                  {rows.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="min-w-0 truncate text-foreground">{row.label}</span>
                      <span className="ml-4 shrink-0 text-muted">{row.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formFunnel(signals) && (
        <div className="mb-8 rounded-lg border border-border px-4 py-3 text-sm">
          <span className="font-semibold text-foreground">Contact form:</span>{" "}
          <span className="text-muted">{formFunnel(signals)}</span>
        </div>
      )}

      <ContentHealth token={token} onOpen={onOpen} />

      {topItems.length > 0 && (
        <div className="mb-8">
          <p className="text-sm font-semibold text-foreground mb-3">Most Read</p>
          <div className="border border-border rounded-lg divide-y divide-border">
            {topItems.map((item) => {
              const key = `${item.type}:${item.slug}`;
              const tab = VIEW_SOURCES.find((source) => source.type === item.type)?.tab;
              const label = titles.get(key) ?? item.slug;
              const openable = !!(onOpen && tab);
              return (
                <div key={key} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  {openable ? (
                    <button
                      type="button"
                      onClick={() => onOpen?.({ tab: tab!, slug: item.slug })}
                      className="min-w-0 truncate text-left text-foreground hover:text-accent"
                      title={`Edit "${label}"`}
                    >
                      <span className="mr-2 text-muted">[{item.type}]</span>
                      {label}
                    </button>
                  ) : (
                    <span className="min-w-0 truncate text-foreground">
                      <span className="mr-2 text-muted">[{item.type}]</span>
                      {label}
                    </span>
                  )}
                  <span className="shrink-0 text-muted">{item.count.toLocaleString()} views</span>
                </div>
              );
            })}
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
                {/* The answer was already being fetched and then discarded — without it
                    there was no way to tell a good reply from a bad one. */}
                {q.answer && <p className="mt-2 border-t border-border pt-2 text-sm text-muted">{q.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
