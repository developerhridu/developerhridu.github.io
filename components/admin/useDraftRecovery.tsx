"use client";

import { useEffect, useState } from "react";
import { History, X } from "lucide-react";
import { snapshot } from "@/components/admin/useUnsavedGuard";

const PREFIX = "admin_draft:";

interface StoredDraft<T> {
  value: T;
  at: number;
}

function readDraft<T>(key: string): StoredDraft<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as StoredDraft<T>) : null;
  } catch {
    return null;
  }
}

function writeDraft(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ value, at: Date.now() }));
  } catch {
    // Storage full or blocked — recovery just isn't available this time.
  }
}

/** Forget the autosaved copy of a form (after it's saved or deliberately discarded). */
export function clearDraft(key: string | null) {
  if (!key) return;
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing to clear.
  }
}

/**
 * Autosaves an open form to localStorage while it has unsaved edits, and offers the saved
 * copy back the next time the same entry is opened (e.g. after the tab was closed).
 * `key` identifies the entry (null when no form is open).
 */
export function useDraftRecovery<T>(key: string | null, value: T, dirty: boolean) {
  const current = snapshot(value);

  useEffect(() => {
    if (!key || !dirty) return;
    const timer = setTimeout(() => writeDraft(key, JSON.parse(current)), 600);
    return () => clearTimeout(timer);
  }, [key, dirty, current]);

  const [state, setState] = useState<{ key: string | null; draft: StoredDraft<T> | null }>({ key: null, draft: null });
  // Read the stored copy whenever a different entry is opened (adjusting state during render).
  if (state.key !== key) setState({ key, draft: key ? readDraft<T>(key) : null });

  const offer = !dirty && state.draft && snapshot(state.draft.value) !== current ? state.draft : null;

  return {
    /** The autosaved copy to offer, if it differs from what's in the form. */
    draft: offer,
    /** Hide the offer (the copy is kept until the next save/discard overwrites it). */
    dismiss: () => {
      clearDraft(key);
      setState({ key, draft: null });
    },
    /** Hide the offer after the caller restored `draft.value`. */
    accepted: () => setState({ key, draft: null }),
  };
}

export function DraftBanner({ at, onRestore, onDismiss }: { at: number; onRestore: () => void; onDismiss: () => void }) {
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
      <span className="flex items-center gap-2 text-foreground">
        <History size={16} className="shrink-0 text-accent" />
        You have unsaved edits to this entry from {new Date(at).toLocaleString()}.
        <span className="text-muted">(Picked image files aren&apos;t kept — re-add them after restoring.)</span>
      </span>
      <span className="flex items-center gap-2">
        <button type="button" onClick={onRestore} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent-hover">
          Restore
        </button>
        <button type="button" onClick={onDismiss} aria-label="Discard autosaved edits" className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted hover:text-foreground">
          <X size={12} /> Discard
        </button>
      </span>
    </div>
  );
}
