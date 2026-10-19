"use client";

import { useEffect, useRef, useState } from "react";
import { getPending } from "@/lib/adminStore";

const dirtySources = new Set<symbol>();
let beforeUnloadInstalled = false;

function installBeforeUnload() {
  if (beforeUnloadInstalled || typeof window === "undefined") return;
  beforeUnloadInstalled = true;
  window.addEventListener("beforeunload", (event) => {
    // Unsaved form edits and unpublished pending changes both live only in this tab.
    if (dirtySources.size > 0 || getPending().files.length > 0) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
}

export function hasUnsavedEdits(): boolean {
  return dirtySources.size > 0;
}

/** Asks before throwing away unsaved form edits; true when it's fine to continue. */
export function confirmDiscardEdits(dirty = hasUnsavedEdits()): boolean {
  return !dirty || window.confirm("You have unsaved changes in this form. Discard them?");
}

/** Marks the calling form as having unsaved edits while `dirty` is true (tab switches and reloads then ask first). */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    installBeforeUnload();
    if (!dirty) return;
    const id = Symbol("dirty-form");
    dirtySources.add(id);
    return () => {
      dirtySources.delete(id);
    };
  }, [dirty]);
}

/** Ctrl+S / ⌘S runs `onSave` while `enabled`. */
export function useSaveShortcut(onSave: () => void, enabled: boolean) {
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });
  useEffect(() => {
    if (!enabled) return;
    function handleKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        onSaveRef.current();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [enabled]);
}

/** Stable JSON snapshot used to tell whether a form changed since it was opened. */
export function snapshot(value: unknown): string {
  return JSON.stringify(value ?? null);
}

/**
 * For always-open forms (profile, skills, UI strings…): remembers the form as it was when
 * loading finished, then wires the unsaved guard and Ctrl+S. Returns whether it's dirty.
 */
export function useLoadedFormGuard(form: unknown, loading: boolean, saving: boolean, onSave: () => void): boolean {
  const current = snapshot(form);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [wasLoading, setWasLoading] = useState(loading);
  // Adjust state during render when a load finishes (React's recommended alternative to an effect).
  if (wasLoading !== loading) {
    setWasLoading(loading);
    if (!loading) setBaseline(current);
  }
  const dirty = !loading && baseline !== null && current !== baseline;
  useUnsavedGuard(dirty);
  useSaveShortcut(onSave, !loading && !saving);
  return dirty;
}
