"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, LayoutGrid, Loader2, Search, X } from "lucide-react";
import { loadAdminContent, type AdminItem } from "@/components/admin/adminContent";

export interface SearchTarget {
  tab: string;
  slug?: string;
  id?: string;
}

interface Result {
  key: string;
  title: string;
  detail: string;
  draft: boolean;
  target: SearchTarget;
}

/** Ctrl+K palette for the admin: jump to any entry in any tab, or to a tab itself. */
export default function AdminSearch({
  token,
  tabs,
  onClose,
  onSelect,
}: {
  token: string;
  tabs: { key: string; label: string }[];
  onClose: () => void;
  onSelect: (target: SearchTarget) => void;
}) {
  const [items, setItems] = useState<AdminItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadAdminContent(token).then(({ items: loaded }) => {
      if (!cancelled) setItems(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const results = useMemo<Result[]>(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = (text: string) => words.every((word) => text.includes(word));
    const tabResults: Result[] = tabs
      .filter((tab) => words.length === 0 || matches(tab.label.toLowerCase()))
      .map((tab) => ({ key: `tab:${tab.key}`, title: tab.label, detail: "Open tab", draft: false, target: { tab: tab.key } }));
    if (words.length === 0) return tabResults;
    const entryResults: Result[] = (items ?? [])
      .filter((item) => matches(`${item.label} ${item.sublabel} ${item.source.tabLabel} ${String(item.raw.description ?? "")}`.toLowerCase()))
      .slice(0, 40)
      .map((item) => ({
        key: `${item.source.tab}:${item.open.slug ?? item.open.id}`,
        title: item.label,
        detail: [item.source.tabLabel, item.sublabel].filter(Boolean).join(" · "),
        draft: !item.published,
        target: item.open,
      }));
    return [...entryResults, ...tabResults];
  }, [items, query, tabs]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      onSelect(results[active].target);
    } else if (event.key === "Escape") {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-[12vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the CMS"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search size={18} className="text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search posts, projects, certificates, tabs…"
            aria-label="Search the CMS"
            className="flex-1 bg-transparent py-3.5 text-sm text-foreground placeholder-muted outline-none"
          />
          {!items && <Loader2 size={16} className="animate-spin text-muted" />}
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-muted hover:text-foreground">
            <X size={16} />
          </button>
        </div>
        <ul ref={listRef} role="listbox" className="flex-1 overflow-y-auto py-1">
          {results.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Nothing matches “{query}”.</li>}
          {results.map((result, index) => (
            <li key={result.key} role="option" aria-selected={index === active} data-index={index}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => onSelect(result.target)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${index === active ? "bg-accent/10" : ""}`}
              >
                {result.detail === "Open tab" && <LayoutGrid size={14} className="shrink-0 text-muted" />}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <span className="truncate">{result.title}</span>
                    {result.draft && (
                      <span className="shrink-0 rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 text-[10px] font-semibold uppercase text-yellow-500">
                        Draft
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted">{result.detail}</span>
                </span>
                {index === active && <CornerDownLeft size={14} className="shrink-0 text-muted" />}
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted">↑↓ to move · Enter to open · Esc to close</p>
      </div>
    </div>
  );
}
