"use client";

import { useEffect, useRef, useState } from "react";
import { fetchContentFile, updateContentFile, GitHubApiError } from "@/lib/github";
import { ErrorBanner, SuccessBanner } from "@/components/admin/CrudBanners";
import { useLoadedFormGuard } from "@/components/admin/useUnsavedGuard";
import { inputClass, savedMessage } from "@/components/admin/shared";

const PATH = "content/tech-stack.json";
const CATEGORIES: { key: string; label: string }[] = [
  { key: "backend", label: "Backend" },
  { key: "architecture", label: "Architecture" },
  { key: "messaging", label: "Messaging & Caching" },
  { key: "frontend", label: "Frontend" },
  { key: "database", label: "Database" },
  { key: "devops", label: "DevOps & Observability" },
  { key: "testing", label: "Testing" },
];

interface SkillsEditorProps {
  token: string;
  onAuthError: () => void;
}

export default function SkillsEditor({ token, onAuthError }: SkillsEditorProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  /** The file exactly as loaded, so categories this editor doesn't list survive a save. */
  const loadedRef = useRef<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const dirty = useLoadedFormGuard(form, loading, saving, () => void handleSave());

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { content, sha } = await fetchContentFile(PATH, token);
      const parsed = JSON.parse(content) as Record<string, unknown>;
      // Kept so a save patches the real file rather than rebuilding it from CATEGORIES,
      // which dropped any category added through the skill-categories tab.
      loadedRef.current = parsed;
      const next: Record<string, string> = {};
      for (const c of CATEGORIES) {
        const value = parsed[c.key];
        next[c.key] = Array.isArray(value) ? value.join(", ") : "";
      }
      setForm(next);
      setFileSha(sha);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  function handleApiError(err: unknown) {
    if (err instanceof GitHubApiError && (err.status === 401 || err.status === 403)) {
      onAuthError();
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Something went wrong.");
    }
  }

  async function handleSave() {
    if (!fileSha) {
      setError("Missing file version — reload before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ...loadedRef.current };
      for (const c of CATEGORIES) {
        payload[c.key] = (form[c.key] ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
      const content = JSON.stringify(payload, null, 2) + "\n";
      await updateContentFile(PATH, content, fileSha, "content: update tech stack", token);
      setSuccessMsg(savedMessage());
      await load();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted text-sm">Loading…</p>;

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} onReload={() => void load()} />
      <SuccessBanner message={successMsg} />

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        {CATEGORIES.map((c) => (
          <div key={c.key}>
            <label className="block text-xs uppercase tracking-wide text-muted mb-1">
              {c.label} (comma separated)
            </label>
            <input
              value={form[c.key] ?? ""}
              onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
              className={inputClass}
            />
          </div>
        ))}

        <div className="pt-2">
          <button
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
            title={!saving && !dirty ? "No changes to save" : undefined}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : dirty ? "Save changes" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
