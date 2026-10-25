"use client";

/**
 * Form-filler and grammar extensions stamp their own attributes (`fdprocessedid`,
 * `data-gramm`, …) onto every button and input as soon as the HTML arrives — before React
 * hydrates. React then reports a hydration mismatch for each one. The app cannot prevent
 * it: the markup is correct, a visitor's extension changed the DOM.
 *
 * So in development we drop only the hydration warnings whose diff is one of these known
 * extension attributes. Any other hydration warning — a real one — still reaches the
 * console and the dev overlay. React does not log these in production, so nothing ships.
 *
 * The patch runs at module scope, not in an effect: it must be in place before hydration,
 * and it must wrap Next's own console.error (which feeds the dev overlay) rather than be
 * wrapped by it, so our filter runs first and can return before the overlay is told.
 */

const EXTENSION_ATTRIBUTES = [
  "fdprocessedid",
  "data-gramm",
  "data-gramm_editor",
  "data-grammarly-shadow-root",
  "data-gr-ext-installed",
  "data-new-gr-c-s-check-loaded",
  "data-lt-installed",
  "cz-shortcut-listen",
];

function isExtensionHydrationWarning(args: unknown[]): boolean {
  const text = args.filter((arg) => typeof arg === "string").join(" ");
  if (!text.includes("hydrat")) return false;
  return EXTENSION_ATTRIBUTES.some((attribute) => text.includes(attribute));
}

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const flag = "__extensionHydrationFilter";
  const store = window as unknown as Record<string, boolean>;
  // Guard against Fast Refresh re-running this module and stacking wrappers.
  if (!store[flag]) {
    store[flag] = true;
    for (const level of ["error", "warn"] as const) {
      const original = console[level];
      console[level] = (...args: unknown[]) => {
        if (isExtensionHydrationWarning(args)) return;
        original.apply(console, args as Parameters<typeof original>);
      };
    }
  }
}

/** Renders nothing; importing it installs the filter. */
export default function ExtensionHydrationFilter() {
  return null;
}
