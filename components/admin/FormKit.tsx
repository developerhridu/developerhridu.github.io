"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { inputClass } from "@/components/admin/shared";

/** Input class with a red border when the field has an error. */
export function fieldClass(error?: string | null, extra = ""): string {
  return `${inputClass} ${error ? "border-red-500/60 focus:border-red-500" : ""} ${extra}`;
}

/** The card every admin entry form sits in: title, dirty marker, close button, body, preview. */
export function EditorPanel({
  title,
  dirty = false,
  onClose,
  children,
  preview,
}: {
  title: string;
  dirty?: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Live preview rendered beside the form on wide screens. */
  preview?: ReactNode;
}) {
  const form = (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          {title}
          {dirty && (
            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-500">
              Unsaved
            </span>
          )}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-foreground">
          <X size={18} />
        </button>
      </div>
      {children}
    </div>
  );

  if (!preview) return form;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {form}
      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Live preview">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Live preview</p>
        {preview}
      </aside>
    </div>
  );
}

/** A titled group of fields; untitled sections just stack. */
export function FormSection({ title, children, columns = 2 }: { title?: string; children: ReactNode; columns?: 1 | 2 }) {
  return (
    <section className="space-y-4">
      {title && (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-accent pt-3 border-t border-border">{title}</h3>
      )}
      <div className={columns === 2 ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>{children}</div>
    </section>
  );
}

/** Label + control + hint/error. `full` spans both columns of a two-column section. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  full = false,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string | null;
  hint?: ReactNode;
  required?: boolean;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""} data-field-error={error ? "true" : undefined}>
      <label htmlFor={htmlFor} className="block text-xs uppercase tracking-wide text-muted mb-1">
        {label}
        {required && <span className="ml-0.5 text-red-400" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export function CheckboxField({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-accent"
      />
      <span className="text-sm text-foreground">
        {label} {hint && <span className="text-muted">({hint})</span>}
      </span>
    </label>
  );
}

/** Sticky Save / Cancel bar shared by every entry form. */
export function FormActions({
  saving,
  dirty = true,
  onSave,
  onCancel,
}: {
  saving: boolean;
  dirty?: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap items-center gap-3 rounded-b-xl border-t border-border bg-surface/95 px-6 py-4 backdrop-blur">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="px-4 py-2.5 border border-border text-muted hover:text-foreground rounded-lg text-sm transition-colors"
      >
        Cancel
      </button>
      <span className="ml-auto hidden text-xs text-muted sm:inline">
        {dirty ? "Unsaved changes · " : ""}
        <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd>
        {" + "}
        <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">S</kbd> to save
      </span>
    </div>
  );
}
