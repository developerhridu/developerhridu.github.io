"use client";

/**
 * What we know about this visit: where it came from, which pages it has seen, and how
 * many times this browser has been here.
 *
 * All of it stays in this browser (sessionStorage for the visit, localStorage for the
 * visit count) until the visitor does something that warrants sending it — reaching a
 * scroll milestone, or submitting the contact form. Nothing is sent per page view beyond
 * the view counter that already existed.
 *
 * Every accessor is wrapped: storage throws in private windows and when site data is
 * blocked, and a tracking helper must never be the reason a page breaks.
 */

const JOURNEY_KEY = "visit_journey";
const REFERRER_KEY = "visit_referrer";
const CAMPAIGN_KEY = "visit_campaign";
const STARTED_KEY = "visit_started";
const VISIT_COUNT_KEY = "visit_count";
/** Caps how many signal beacons one page view may send, so KV can't be flooded. */
const SIGNALS_SENT_KEY = "visit_signals_sent";
const MAX_SIGNALS_PER_SESSION = 40;
/** The journey only needs the recent path; a long crawl isn't more informative. */
const MAX_JOURNEY = 12;

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Storage blocked — tracking degrades, the page doesn't.
  }
}

/** Host of the page that sent them here, or "" when they came directly or from this site. */
function detectReferrer(): string {
  try {
    if (!document.referrer) return "";
    const host = new URL(document.referrer).hostname.replace(/^www\./, "");
    return host === window.location.hostname ? "" : host;
  } catch {
    return "";
  }
}

/** utm_source (or utm_campaign) from the URL that started this session. */
function detectCampaign(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("utm_source") ?? params.get("utm_campaign") ?? "";
  } catch {
    return "";
  }
}

export interface VisitorSession {
  /** Referrer host for this session, "direct" when there was none. */
  referrer: string;
  /** utm_source / utm_campaign, or "" when the link wasn't tagged. */
  campaign: string;
  /** 1 on a first visit, 2 on the next, and so on. */
  visit: number;
  /** Pages seen this session, oldest first. */
  journey: string[];
  /** Whole minutes since this session started. */
  minutes: number;
  /** True the first time this session is seen, so one-per-session signals can fire. */
  isNew: boolean;
}

/**
 * Reads the session, creating it on the first call of a visit. Safe to call repeatedly.
 */
export function getVisitorSession(): VisitorSession {
  const existingStart = readSession(STARTED_KEY);
  const isNew = !existingStart;

  if (isNew) {
    writeSession(STARTED_KEY, String(Date.now()));
    writeSession(REFERRER_KEY, detectReferrer());
    writeSession(CAMPAIGN_KEY, detectCampaign());
  }

  let visit = 1;
  try {
    // localStorage, not sessionStorage: "how many times has this person been back" is
    // the whole point, and it has to outlive the tab.
    const stored = Number(localStorage.getItem(VISIT_COUNT_KEY)) || 0;
    visit = isNew ? stored + 1 : Math.max(stored, 1);
    if (isNew) localStorage.setItem(VISIT_COUNT_KEY, String(visit));
  } catch {
    // Blocked storage: treat every visit as a first visit.
  }

  const started = Number(existingStart ?? Date.now());
  return {
    referrer: readSession(REFERRER_KEY) || "direct",
    campaign: readSession(CAMPAIGN_KEY) || "",
    visit,
    journey: JSON.parse(readSession(JOURNEY_KEY) || "[]") as string[],
    minutes: Math.max(0, Math.round((Date.now() - started) / 60000)),
    isNew,
  };
}

/** Appends a page to this session's journey, ignoring an immediate repeat. */
export function recordPageView(path: string) {
  try {
    const journey = JSON.parse(readSession(JOURNEY_KEY) || "[]") as string[];
    if (journey[journey.length - 1] === path) return;
    writeSession(JOURNEY_KEY, JSON.stringify([...journey, path].slice(-MAX_JOURNEY)));
  } catch {
    writeSession(JOURNEY_KEY, JSON.stringify([path]));
  }
}

/** "1", "2", "3-5" or "6+" — a bucket, because the exact number isn't interesting. */
export function visitBucket(visit: number): string {
  if (visit <= 1) return "1";
  if (visit === 2) return "2";
  if (visit <= 5) return "3-5";
  return "6+";
}

/**
 * True while this session is still under its signal budget, and counts the send.
 * Scroll and section-view signals are frequent, and each one is a KV write.
 */
export function withinSignalBudget(): boolean {
  const sent = Number(readSession(SIGNALS_SENT_KEY)) || 0;
  if (sent >= MAX_SIGNALS_PER_SESSION) return false;
  writeSession(SIGNALS_SENT_KEY, String(sent + 1));
  return true;
}

/** Remembers that a one-per-session signal already fired. */
export function oncePerSession(key: string): boolean {
  const storageKey = `visit_once_${key}`;
  if (readSession(storageKey)) return false;
  writeSession(storageKey, "1");
  return true;
}
