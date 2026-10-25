export type FieldErrors = Record<string, string>;

/** Empty is allowed (fields are optional unless marked required); otherwise http(s) or a site path. */
export function urlError(value: unknown, { allowRelative = true }: { allowRelative?: boolean } = {}): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (allowRelative && text.startsWith("/")) return null;
  try {
    const url = new URL(text);
    if (url.protocol === "http:" || url.protocol === "https:") return null;
  } catch {
    // Fall through to the error below.
  }
  return allowRelative ? "Enter a full link (https://…) or a site path (/…)." : "Enter a full link starting with https://";
}

export function emailError(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? null : "Enter a valid email address.";
}

export function requiredError(value: unknown, label: string): string | null {
  return String(value ?? "").trim() ? null : `${label} is required.`;
}

export function slugError(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text) return "Slug is required.";
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text) ? null : "Use lowercase letters, numbers and dashes only.";
}

/**
 * Fails when another entry already uses this value. Without it a duplicate seo.json route
 * or skill-categories key saved cleanly and broke the page that looked it up.
 */
export function uniqueError(value: unknown, taken: string[], label: string): string | null {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return null;
  return taken.some((other) => other.trim().toLowerCase() === text)
    ? `Another entry already uses this ${label.toLowerCase()}.`
    : null;
}

/** Fails on an icon key the site cannot render — it would silently show a placeholder. */
export function iconKeyError(value: unknown, allowed: readonly string[]): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (allowed.includes(text)) return null;
  const suggestion = allowed.find((key) => key.startsWith(text.slice(0, 3)));
  return `Unknown icon "${text}". ${suggestion ? `Did you mean "${suggestion}"? ` : ""}Pick one of: ${allowed.slice(0, 8).join(", ")}…`;
}

/** Builds an errors object from `[key, error | null]` pairs, dropping the passing ones. */
export function collectErrors(checks: [string, string | null][]): FieldErrors {
  return Object.fromEntries(checks.filter((check): check is [string, string] => !!check[1]));
}

export function errorSummary(errors: FieldErrors): string {
  const count = Object.keys(errors).length;
  return `Fix ${count === 1 ? "the highlighted field" : `the ${count} highlighted fields`} before saving.`;
}

/** Scrolls the first invalid field (marked with data-field-error) into view. */
export function focusFirstError() {
  requestAnimationFrame(() => {
    const field = document.querySelector<HTMLElement>("[data-field-error='true']");
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
    field?.querySelector<HTMLElement>("input, textarea, select")?.focus({ preventScroll: true });
  });
}
