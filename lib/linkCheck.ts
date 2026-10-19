import { WORKER_URL } from "@/lib/workerUrl";
import { getStaged } from "@/lib/adminStore";

export type LinkKind = "external" | "page" | "image";
export type LinkState = "ok" | "broken" | "redirect" | "unknown";

export interface LinkReport {
  url: string;
  kind: LinkKind;
  state: LinkState;
  /** Status code, redirect target or error, for display. */
  detail: string;
}

const URL_IN_TEXT = /https?:\/\/[^\s<>()"'\]`]+[^\s<>()"'\].,;:!?`]/g;
const MARKDOWN_TARGET = /\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const HREF_FIELDS = /^(url|liveUrl|githubUrl|frontend|backend|verifyUrl|href|website|companyUrl|linkedinUrl)$/;

/** Every link in an entry: markdown targets, bare URLs in text, and URL-ish fields. */
export function extractLinks(value: unknown): { url: string; kind: LinkKind }[] {
  const found = new Map<string, LinkKind>();
  const add = (raw: string) => {
    const url = raw.trim();
    if (!url || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("/__draft")) return;
    if (/^https?:\/\//i.test(url)) found.set(url, "external");
    else if (url.startsWith("/images/")) found.set(url.split(/[?#]/)[0], "image");
    else if (url.startsWith("/")) found.set(url.split("#")[0], "page");
  };
  const walk = (node: unknown, key = "") => {
    if (typeof node === "string") {
      if (HREF_FIELDS.test(key)) add(node);
      for (const match of node.matchAll(MARKDOWN_TARGET)) add(match[1]);
      for (const match of node.matchAll(URL_IN_TEXT)) add(match[0]);
    } else if (Array.isArray(node)) {
      node.forEach((item) => walk(item, key));
    } else if (node && typeof node === "object") {
      for (const [childKey, child] of Object.entries(node)) walk(child, childKey);
    }
  };
  walk(value);
  return [...found].map(([url, kind]) => ({ url, kind }));
}

async function checkPage(url: string): Promise<LinkReport> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    return res.ok
      ? { url, kind: "page", state: "ok", detail: String(res.status) }
      : { url, kind: "page", state: "broken", detail: `${res.status} on this site` };
  } catch {
    return { url, kind: "page", state: "unknown", detail: "Couldn't reach the site" };
  }
}

function checkImage(url: string, repoImages: Set<string>): LinkReport {
  const staged = getStaged(`public${url}`);
  if (staged) {
    return staged.content === null
      ? { url, kind: "image", state: "broken", detail: "Deleted in your pending changes" }
      : { url, kind: "image", state: "ok", detail: "New (pending)" };
  }
  return repoImages.has(decodeURI(url)) || repoImages.has(url)
    ? { url, kind: "image", state: "ok", detail: "In the repo" }
    : { url, kind: "image", state: "broken", detail: "File not found in public/images" };
}

/** Without the worker: no-cors can only tell "the server answered" from "nothing there". */
async function checkReachable(url: string): Promise<LinkReport> {
  try {
    await fetch(url, { mode: "no-cors", cache: "no-store", signal: AbortSignal.timeout(8000) });
    return { url, kind: "external", state: "unknown", detail: "Server responded (status hidden by the browser)" };
  } catch {
    return { url, kind: "external", state: "broken", detail: "Unreachable (DNS, timeout or blocked)" };
  }
}

async function checkExternal(urls: string[], token: string): Promise<LinkReport[]> {
  if (urls.length === 0) return [];
  if (WORKER_URL) {
    try {
      const res = await fetch(`${WORKER_URL}/check-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ urls }),
      });
      if (res.ok) {
        const { results } = (await res.json()) as {
          results: { url: string; status: number; ok: boolean; finalUrl?: string; error?: string }[];
        };
        const byUrl = new Map(results.map((result) => [result.url, result]));
        return urls.map((url): LinkReport => {
          const result = byUrl.get(url);
          if (!result) return { url, kind: "external", state: "unknown", detail: "Skipped (private or invalid address)" };
          if (!result.ok) return { url, kind: "external", state: "broken", detail: result.error ?? `HTTP ${result.status}` };
          if (result.finalUrl) return { url, kind: "external", state: "redirect", detail: `Redirects to ${result.finalUrl}` };
          return { url, kind: "external", state: "ok", detail: `HTTP ${result.status}` };
        });
      }
    } catch {
      // Worker unreachable or not deployed yet — fall back to the browser-only check.
    }
  }
  return Promise.all(urls.map(checkReachable));
}

export async function checkLinks(
  links: { url: string; kind: LinkKind }[],
  token: string,
  repoImages: Set<string>
): Promise<LinkReport[]> {
  const external = links.filter((link) => link.kind === "external").map((link) => link.url);
  const [externalReports, pageReports] = await Promise.all([
    checkExternal(external, token),
    Promise.all(links.filter((link) => link.kind === "page").map((link) => checkPage(link.url))),
  ]);
  const imageReports = links.filter((link) => link.kind === "image").map((link) => checkImage(link.url, repoImages));
  const order: Record<LinkState, number> = { broken: 0, unknown: 1, redirect: 2, ok: 3 };
  return [...externalReports, ...pageReports, ...imageReports].sort((a, b) => order[a.state] - order[b.state]);
}
