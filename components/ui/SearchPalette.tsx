"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type Fuse from "fuse.js";
import { Search, X, Sparkles } from "lucide-react";
import type { SearchItem } from "@/lib/searchIndex";
import { dispatchAskAi } from "@/lib/askAiEvent";
import { WORKER_URL } from "@/lib/workerUrl";
import uiStrings from "@/content/ui-strings.json";
import { SEARCH_RESULTS } from "@/lib/display";
import { useModal } from "@/lib/useModal";

const LISTBOX_ID = "search-results";
const optionId = (index: number) => `search-option-${index}`;

const t = uiStrings.searchPalette;

/** Weighted so a title match still beats a body-text match. */
const FUSE_OPTIONS = {
  keys: [
    { name: "title", weight: 3 },
    { name: "description", weight: 2 },
    { name: "keywords", weight: 1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
};

type SearchEngine = { fuse: Fuse<SearchItem>; index: SearchItem[] };

let enginePromise: Promise<SearchEngine> | null = null;

/** Loads fuse.js and the content index once, on first open. */
function loadEngine(): Promise<SearchEngine> {
  enginePromise ??= Promise.all([import("fuse.js"), import("@/lib/searchIndex")]).then(
    ([{ default: FuseCtor }, { searchIndex }]) => ({
      fuse: new FuseCtor(searchIndex, FUSE_OPTIONS),
      index: searchIndex,
    }),
  );
  return enginePromise;
}

interface SearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const panelRef = useModal<HTMLDivElement>({
    open,
    onClose: () => onOpenChange(false),
    autoFocus: false,
  });
  const [engine, setEngine] = useState<SearchEngine | null>(null);

  useEffect(() => {
    if (!open || engine) return;
    let active = true;
    void loadEngine().then((loaded) => {
      if (active) setEngine(loaded);
    });
    return () => {
      active = false;
    };
  }, [open, engine]);

  // Reset query/selection whenever the dialog transitions open — adjusted during
  // render (React's documented pattern for this) rather than in an effect, since
  // this is deriving state from a prop change, not synchronizing an external system.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }

  const results: SearchItem[] = useMemo(() => {
    if (!engine) return [];
    if (!query.trim()) return engine.index.slice(0, SEARCH_RESULTS);
    return engine.fuse.search(query).slice(0, SEARCH_RESULTS).map((r) => r.item);
  }, [query, engine]);

  // Debounced, best-effort logging of what visitors search for (and whether it
  // found anything) — never blocks or affects the search UI itself.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || !WORKER_URL || !engine) return;
    const timer = setTimeout(() => {
      fetch(`${WORKER_URL}/search-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, resultCount: engine.fuse.search(trimmed).length }),
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [query, engine]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Only the global shortcut lives here — it has to work while the palette is closed,
  // so it cannot come from useModal. Escape is handled by the hook.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  function go(item: SearchItem) {
    onOpenChange(false);
    router.push(item.url);
  }

  function askAi() {
    const trimmed = query.trim();
    if (!trimmed) return;
    onOpenChange(false);
    dispatchAskAi(trimmed);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results.length === 0) {
        askAi();
        return;
      }
      const item = results[activeIndex];
      if (item) go(item);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="print:hidden fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.placeholder}
            className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden outline-none"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={18} className="text-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                role="combobox"
                aria-expanded
                aria-controls={LISTBOX_ID}
                aria-autocomplete="list"
                aria-activedescendant={results[activeIndex] ? optionId(activeIndex) : undefined}
                className="flex-1 min-w-0 bg-transparent text-foreground placeholder-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded"
              />
              <button
                onClick={() => onOpenChange(false)}
                aria-label={t.closeAriaLabel}
                className="text-muted hover:text-foreground transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div id={LISTBOX_ID} role="listbox" aria-label="Search results" className="max-h-96 overflow-y-auto py-2">
              {!engine && (
                <p role="status" className="px-4 py-6 text-center text-sm text-muted">
                  Loading search…
                </p>
              )}
              {engine && results.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted mb-3">{t.noResults.replace("{query}", query)}</p>
                  {query.trim() && (
                    <button
                      onClick={askAi}
                      className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-accent/40 text-accent hover:bg-accent/10 transition-colors"
                    >
                      <Sparkles size={14} />
                      {t.askAi.replace("{query}", query)}
                    </button>
                  )}
                </div>
              )}
              {results.map((item, i) => (
                <button
                  key={`${item.url}-${item.title}`}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => go(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full text-left px-4 py-2.5 flex items-start justify-between gap-3 transition-colors ${
                    i === activeIndex ? "bg-surface-hover" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground truncate">
                      {item.title}
                    </span>
                    <span className="block text-xs text-muted truncate">{item.description}</span>
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted border border-border rounded px-1.5 py-0.5">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[11px] text-muted">
              <span>{t.navigateHint}</span>
              <span>{t.selectHint}</span>
              <span>{t.closeHint}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
