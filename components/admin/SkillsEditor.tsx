"use client";

import { useEffect, useState } from "react";
import { fetchContentFile, updateContentFile, GitHubApiError } from "@/lib/github";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { inputClass } from "@/components/admin/shared";

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

interface Proficiency {
  name: string;
  level: number;
}

interface SkillsEditorProps {
  token: string;
  onAuthError: () => void;
}

export default function SkillsEditor({ token, onAuthError }: SkillsEditorProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [proficiency, setProficiency] = useState<Proficiency[]>([]);
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
      const parsed = JSON.parse(content);
      const next: Record<string, string> = {};
      for (const c of CATEGORIES) {
        next[c.key] = Array.isArray(parsed[c.key]) ? parsed[c.key].join(", ") : "";
      }
      setForm(next);
      setProficiency(Array.isArray(parsed.proficiency) ? parsed.proficiency : []);
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

  function updateProficiency(index: number, patch: Partial<Proficiency>) {
    setProficiency((p) => p.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addProficiency() {
    setProficiency((p) => [...p, { name: "", level: 50 }]);
  }

  function removeProficiency(index: number) {
    setProficiency((p) => p.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!fileSha) {
      setError("Missing file version — reload before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const c of CATEGORIES) {
        payload[c.key] = (form[c.key] ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
      payload.proficiency = proficiency.filter((s) => s.name.trim());

      const content = JSON.stringify(payload, null, 2) + "\n";
      await updateContentFile(PATH, content, fileSha, "content: update tech stack", token);
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

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs uppercase tracking-wide text-muted">
              Skill Proficiency
            </label>
            <button
              onClick={addProficiency}
              type="button"
              className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
            >
              <Plus size={14} /> Add Skill
            </button>
          </div>
          <div className="space-y-2">
            {proficiency.map((skill, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={skill.name}
                  onChange={(e) => updateProficiency(i, { name: e.target.value })}
                  placeholder="Skill name"
                  className={inputClass}
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={skill.level}
                  onChange={(e) => updateProficiency(i, { level: Number(e.target.value) })}
                  className={`${inputClass} w-24 shrink-0`}
                />
                <button
                  onClick={() => removeProficiency(i)}
                  aria-label={`Remove ${skill.name || "skill"}`}
                  className="p-2 text-muted hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {proficiency.length === 0 && <p className="text-muted text-xs">No skills yet.</p>}
          </div>
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
