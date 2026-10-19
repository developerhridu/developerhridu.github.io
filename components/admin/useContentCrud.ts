"use client";

import { useEffect, useState } from "react";
import {
  fetchContentFile,
  commitFiles,
  encodeBase64Unicode,
  GitHubApiError,
  type FileChange,
} from "@/lib/github";
import { moveItem, savedMessage } from "@/components/admin/shared";

interface ContentCrudOptions<T extends { id: string }> {
  path: string;
  arrayKey: string;
  /** Human-readable name used in the "content: reorder <label>" commit message. */
  label: string;
  token: string;
  onAuthError: () => void;
  /** Applies per-entry defaults/coercion to what was loaded from the JSON file. */
  normalizeLoaded?: (entries: T[]) => T[];
}

/**
 * Shared engine behind every admin content-array editor: load a JSON array from the
 * repo, track drag-reordering, and commit add/update/delete/reorder changes back via
 * the GitHub Contents API. Editing-form state stays with the caller since its shape
 * differs per content type.
 */
export function useContentCrud<T extends { id: string }>({
  path,
  arrayKey,
  label,
  token,
  onAuthError,
  normalizeLoaded,
}: ContentCrudOptions<T>) {
  const [entries, setEntries] = useState<T[] | null>(null);
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadedOrderIds, setLoadedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  function reportError(err: unknown) {
    if (err instanceof GitHubApiError && (err.status === 401 || err.status === 403)) {
      onAuthError();
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Something went wrong.");
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { content, sha } = await fetchContentFile(path, token);
      const parsed = JSON.parse(content);
      const raw = (parsed[arrayKey] as T[]) ?? [];
      const loaded = normalizeLoaded ? normalizeLoaded(raw) : raw;
      setEntries(loaded);
      setLoadedOrderIds(loaded.map((e) => e.id));
      setFileSha(sha);
    } catch (err) {
      reportError(err);
    } finally {
      setLoading(false);
    }
  }

  const orderDirty =
    entries !== null && entries.map((e) => e.id).join("|") !== loadedOrderIds.join("|");

  /** Moves the entry at `from` to `to` (drag-and-drop or the up/down arrows). */
  function moveEntry(from: number, to: number) {
    setEntries((prev) => (prev ? moveItem(prev, from, to) : prev));
  }

  async function commit(changes: FileChange[], newEntries: T[], message: string): Promise<boolean> {
    if (!fileSha) {
      setError("Missing file version — reload the list before saving.");
      return false;
    }
    const payload = { [arrayKey]: newEntries };
    const content = JSON.stringify(payload, null, 2) + "\n";
    const allChanges = [...changes, { path, content: encodeBase64Unicode(content) }];

    setSaving(true);
    setError(null);
    try {
      await commitFiles(allChanges, message, token, { path, expectedSha: fileSha });
      setEntries(newEntries);
      setSuccessMsg(savedMessage());
      await load();
      return true;
    } catch (err) {
      reportError(err);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveOrder() {
    if (!entries) return;
    await commit([], entries, `content: reorder ${label}`);
  }

  function discardOrder() {
    void load();
  }

  function clearMessages() {
    setError(null);
    setSuccessMsg(null);
  }

  return {
    entries,
    setEntries,
    loading,
    saving,
    setSaving,
    error,
    setError,
    successMsg,
    orderDirty,
    moveEntry,
    commit,
    saveOrder,
    discardOrder,
    clearMessages,
    reportError,
    reload: load,
  };
}
