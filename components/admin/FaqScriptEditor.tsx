"use client";

import { useEffect, useState } from "react";
import { fetchContentFile, updateContentFile, GitHubApiError } from "@/lib/github";
import { ExternalLink } from "lucide-react";
import { inputClass } from "@/components/admin/shared";

const PATH = "content/faq-script.json";

interface FormState {
  greetingAnswer: string;
  greetings: string;
  emptyQueryAnswer: string;
  fallbackAnswer: string;
  starterQuestions: string;
}

interface FaqScriptEditorProps {
  token: string;
  onAuthError: () => void;
}

export default function FaqScriptEditor({ token, onAuthError }: FaqScriptEditorProps) {
  const [form, setForm] = useState<FormState>({
    greetingAnswer: "",
    greetings: "",
    emptyQueryAnswer: "",
    fallbackAnswer: "",
    starterQuestions: "",
  });
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { content, sha } = await fetchContentFile(PATH, token);
      const parsed = JSON.parse(content) as {
        greetingAnswer?: string;
        greetings?: string[];
        emptyQueryAnswer?: string;
        fallbackAnswer?: string;
        starterQuestions?: string[];
      };
      setForm({
        greetingAnswer: parsed.greetingAnswer ?? "",
        greetings: (parsed.greetings ?? []).join(", "),
        emptyQueryAnswer: parsed.emptyQueryAnswer ?? "",
        fallbackAnswer: parsed.fallbackAnswer ?? "",
        starterQuestions: (parsed.starterQuestions ?? []).join("\n"),
      });
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
      const payload = {
        greetingAnswer: form.greetingAnswer.trim(),
        greetings: form.greetings
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        emptyQueryAnswer: form.emptyQueryAnswer.trim(),
        fallbackAnswer: form.fallbackAnswer.trim(),
        starterQuestions: form.starterQuestions
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const content = JSON.stringify(payload, null, 2) + "\n";
      await updateContentFile(PATH, content, fileSha, "content: update FAQ bot script", token);
      setSuccessMsg(
        "Saved and committed. The site will redeploy automatically — check the Actions tab in a minute or two."
      );
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
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg text-accent text-sm">
          <span>{successMsg}</span>
          <a
            href="https://github.com/developerhridu/developerhridu.github.io/actions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 whitespace-nowrap hover:underline"
          >
            View Actions <ExternalLink size={12} />
          </a>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">
            Greeting answer ({"{name}"} placeholder)
          </label>
          <textarea
            value={form.greetingAnswer}
            onChange={(e) => setForm({ ...form, greetingAnswer: e.target.value })}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">
            Greetings the bot recognizes (comma separated)
          </label>
          <input
            value={form.greetings}
            onChange={(e) => setForm({ ...form, greetings: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">
            Empty-query answer ({"{name}"} placeholder)
          </label>
          <textarea
            value={form.emptyQueryAnswer}
            onChange={(e) => setForm({ ...form, emptyQueryAnswer: e.target.value })}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Fallback answer</label>
          <textarea
            value={form.fallbackAnswer}
            onChange={(e) => setForm({ ...form, fallbackAnswer: e.target.value })}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">
            Starter questions (one per line)
          </label>
          <textarea
            value={form.starterQuestions}
            onChange={(e) => setForm({ ...form, starterQuestions: e.target.value })}
            rows={5}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
