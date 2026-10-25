"use client";

import { useEffect, useRef, useState } from "react";
import { fetchContentFile, updateContentFile, GitHubApiError } from "@/lib/github";
import { ErrorBanner, SuccessBanner } from "@/components/admin/CrudBanners";
import { useLoadedFormGuard } from "@/components/admin/useUnsavedGuard";
import { inputClass, savedMessage } from "@/components/admin/shared";
import { collectErrors, errorSummary, urlError, type FieldErrors } from "@/components/admin/validation";

const PATH = "content/config.json";

type FieldType = "url" | "text" | "number";

interface Field {
  /** Dotted path into config.json, e.g. "aiChatPrompt.repeatEverySeconds". */
  path: string;
  label: string;
  type: FieldType;
  hint?: string;
  placeholder?: string;
  min?: number;
}

interface Group {
  title: string;
  description?: string;
  fields: Field[];
}

/**
 * config.json was the one content file with no editor, so changing a timing, an analytics
 * id or the site URL meant editing JSON by hand. Only the keys listed here are editable;
 * anything else in the file is preserved untouched on save.
 */
const GROUPS: Group[] = [
  {
    title: "Site",
    fields: [
      { path: "siteUrl", label: "Site URL", type: "url", hint: "Used for canonical links, the sitemap, RSS and share cards." },
    ],
  },
  {
    title: "Services",
    description: "Leave a field empty to switch that service off.",
    fields: [
      { path: "aiChatWorkerUrl", label: "AI chat worker URL", type: "url", placeholder: "https://….workers.dev/" },
      { path: "web3formsAccessKey", label: "Web3Forms access key", type: "text", hint: "Public by design — it identifies the contact form, not you." },
      { path: "gaMeasurementId", label: "Google Analytics ID", type: "text", placeholder: "G-XXXXXXXXXX" },
      { path: "clarityProjectId", label: "Microsoft Clarity project ID", type: "text", hint: "Enables heatmaps and session replay. Mentioned on /privacy." },
    ],
  },
  {
    title: "Comments (giscus)",
    description: "All four are needed before comments appear.",
    fields: [
      { path: "giscus.repo", label: "Repository", type: "text", placeholder: "owner/repo" },
      { path: "giscus.repoId", label: "Repository ID", type: "text" },
      { path: "giscus.category", label: "Category", type: "text" },
      { path: "giscus.categoryId", label: "Category ID", type: "text" },
    ],
  },
  {
    title: "“Ask AI” prompt",
    description: "Seconds. The teaser bubble above the chat button.",
    fields: [
      { path: "aiChatPrompt.firstDelaySeconds", label: "First shown after", type: "number", min: 0.5 },
      { path: "aiChatPrompt.repeatEverySeconds", label: "Repeats every", type: "number", min: 0.5 },
      { path: "aiChatPrompt.visibleForSeconds", label: "Stays visible for", type: "number", min: 0.5 },
    ],
  },
  {
    title: "Client logo spin",
    description: "Seconds for one full loop — a bigger number is slower.",
    fields: [
      { path: "clientSpin.orbitLapSeconds", label: "Desktop orbit lap", type: "number", min: 2 },
      { path: "clientSpin.bandLoopSeconds", label: "Mobile band loop", type: "number", min: 2 },
    ],
  },
  {
    title: "List lengths",
    description: "How many items are shown before a list is cut off.",
    fields: [
      { path: "display.highlightsPerJob", label: "Highlights per job", type: "number", min: 1 },
      { path: "display.tagsPerCard", label: "Tags per card", type: "number", min: 1 },
      { path: "display.searchResults", label: "Search results", type: "number", min: 1 },
    ],
  },
];

const ALL_FIELDS = GROUPS.flatMap((group) => group.fields);

function readPath(source: Record<string, unknown>, path: string): string {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object") return (current as Record<string, unknown>)[key];
    return undefined;
  }, source);
  return value === undefined || value === null ? "" : String(value);
}

/** Writes into a nested copy, creating objects as needed, leaving every other key alone. */
function writePath(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let node = target;
  for (const key of keys.slice(0, -1)) {
    const existing = node[key];
    node[key] = existing && typeof existing === "object" ? { ...(existing as Record<string, unknown>) } : {};
    node = node[key] as Record<string, unknown>;
  }
  node[keys[keys.length - 1]] = value;
}

function validate(form: Record<string, string>): FieldErrors {
  return collectErrors(
    ALL_FIELDS.map((field): [string, string | null] => {
      const value = (form[field.path] ?? "").trim();
      if (field.type === "url") return [field.path, urlError(value, { allowRelative: false })];
      if (field.type === "number" && value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return [field.path, "Enter a number."];
        if (field.min !== undefined && parsed < field.min) return [field.path, `Must be ${field.min} or more.`];
      }
      return [field.path, null];
    })
  );
}

export default function SiteConfigEditor({ token, onAuthError }: { token: string; onAuthError: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  /** The file as loaded, so keys this editor doesn't know about survive a save. */
  const loadedRef = useRef<Record<string, unknown>>({});
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
      loadedRef.current = parsed;
      setForm(Object.fromEntries(ALL_FIELDS.map((field) => [field.path, readPath(parsed, field.path)])));
      setFileSha(sha);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  function handleApiError(err: unknown) {
    if (err instanceof GitHubApiError && (err.status === 401 || err.status === 403)) onAuthError();
    else setError(err instanceof Error ? err.message : "Something went wrong.");
  }

  async function handleSave() {
    if (!fileSha) {
      setError("Missing file version — reload before saving.");
      return;
    }
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(errorSummary(errors));
      return;
    }
    setFieldErrors({});
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ...loadedRef.current };
      for (const field of ALL_FIELDS) {
        const value = (form[field.path] ?? "").trim();
        if (field.type === "number") {
          // An emptied number falls back to the code's default, so drop the key.
          writePath(payload, field.path, value === "" ? undefined : Number(value));
        } else {
          writePath(payload, field.path, value);
        }
      }
      const content = JSON.stringify(payload, null, 2) + "\n";
      await updateContentFile(PATH, content, fileSha, "content: update site configuration", token);
      setSuccessMsg(`${savedMessage()} Timings and list lengths are read at build time, so they take effect after the next deploy.`);
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

      {GROUPS.map((group) => (
        <section key={group.title} className="rounded-xl border border-border bg-surface p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
          {group.description && <p className="mt-1 text-xs text-muted">{group.description}</p>}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => {
              const fieldError = fieldErrors[field.path];
              return (
                <div key={field.path} data-field-error={fieldError ? "true" : undefined}>
                  <label htmlFor={field.path} className="block text-xs uppercase tracking-wide text-muted mb-1">
                    {field.label}
                  </label>
                  <input
                    id={field.path}
                    value={form[field.path] ?? ""}
                    onChange={(event) => setForm({ ...form, [field.path]: event.target.value })}
                    placeholder={field.placeholder}
                    inputMode={field.type === "number" ? "decimal" : undefined}
                    aria-invalid={fieldError ? true : undefined}
                    aria-describedby={fieldError ? `${field.path}-error` : undefined}
                    className={`${inputClass} ${fieldError ? "border-red-500/60" : ""}`}
                  />
                  {fieldError ? (
                    <p id={`${field.path}-error`} className="mt-1 text-xs text-red-400">
                      {fieldError}
                    </p>
                  ) : (
                    field.hint && <p className="mt-1 text-xs text-muted">{field.hint}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <button
        onClick={() => void handleSave()}
        disabled={saving}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? "Saving…" : dirty ? "Save changes" : "Save"}
      </button>
    </div>
  );
}
