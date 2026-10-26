import { WORKER_URL } from "@/lib/workerUrl";

/**
 * Whether to send anything to the site's own counters.
 *
 * The Worker URL is the production Worker even when running `next dev`, so without this
 * every local page load would inflate the real numbers — and the person browsing locally
 * is always the site owner, who is exactly who the data should exclude. Google Analytics
 * and Clarity are already dev-safe, because their scripts only load in production.
 */
const COLLECT = process.env.NODE_ENV === "production";

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

  if (!COLLECT || typeof navigator === "undefined" || !WORKER_URL || !label) return;
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

/** Behaviour signals the Worker accepts. Must match SIGNAL_NAMES in worker/src/index.ts. */
export type SignalName =
  | "scroll-25"
  | "scroll-50"
  | "scroll-75"
  | "scroll-100"
  | "section-view"
  | "referrer"
  | "campaign"
  | "copy-contact"
  | "form-start"
  | "form-abandon"
  | "visit";

/** Fire-and-forget POST that survives the page being unloaded mid-flight. */
function beacon(path: string, body: string) {
  if (!COLLECT || typeof navigator === "undefined" || !WORKER_URL) return;
  try {
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(`${WORKER_URL}${path}`, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(`${WORKER_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics must never break a navigation.
  }
}

/**
 * Records a behaviour signal in Google Analytics and in the site's own counters.
 *
 * Unlike trackClick these fire without the visitor pressing anything — scrolling past a
 * milestone, a section coming into view — so the caller is responsible for firing each
 * one only once, and lib/visitorSession.ts caps how many a session may send in total.
 */
export function trackSignal(name: SignalName, label: string) {
  trackEvent(name.replace(/-/g, "_"), { label });
  if (!label) return;
  beacon("/signals", JSON.stringify({ name, label }));
}

export interface LeadContext {
  kind: "contact" | "testimonial";
  journey: string[];
  referrer: string;
  campaign: string;
  visit: number;
  minutes: number;
}

/**
 * Records what someone read before getting in touch. Sent once, on submit — the one
 * moment where the whole path through the site is worth keeping.
 */
export function trackLead(context: LeadContext) {
  beacon("/leads", JSON.stringify(context));
}

/**
 * A conversion click — Hire Me, Book a Call, CV — recorded in both places.
 *
 * These already reported to Google Analytics but never reached the site's own `/clicks`
 * counter, so the admin Dashboard's "Most clicked" panel couldn't see the most valuable
 * clicks on the site. The GA event name is passed in rather than derived, because these
 * events already have history under their current names and `${area}_click` would spell
 * two of them differently ("hire-me_click") and split that history in two.
 */
export function trackConversion(area: ClickArea, gaEvent: string, location: string) {
  trackEvent(gaEvent, { location });
  if (!location) return;
  beacon("/clicks", JSON.stringify({ area, label: location }));
}
