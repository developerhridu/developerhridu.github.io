import { WORKER_URL } from "@/lib/workerUrl";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(action: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", action, params);
  }
}

/** Groups a click so the dashboard can rank "which project", "which verify link", and so on. */
export type ClickArea =
  | "project"
  | "case-study"
  | "blog"
  | "client"
  | "employer"
  | "certification"
  | "verify"
  | "outbound"
  | "resume"
  | "booking"
  | "hire-me"
  | "social";

/** Host of an external URL ("github.com"), used as the label for outbound clicks. */
export function linkLabel(href: string): string {
  try {
    return new URL(href, window.location.origin).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

/**
 * Records a click in both Google Analytics and the site's own counter (the admin
 * Dashboard's "Most clicked" panel). Uses `sendBeacon` because most tracked clicks
 * navigate away immediately, which cancels an in-flight `fetch`.
 */
export function trackClick(area: ClickArea, label: string) {
  trackEvent(`${area}_click`, { label });

  if (typeof navigator === "undefined" || !WORKER_URL || !label) return;
  const body = JSON.stringify({ area, label });
  try {
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(`${WORKER_URL}/clicks`, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(`${WORKER_URL}/clicks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics must never break a navigation.
  }
}
