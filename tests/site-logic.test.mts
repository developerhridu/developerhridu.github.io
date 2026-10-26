import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { askFaqBot, STARTER_QUESTIONS } from "@/lib/faqBot";
import { searchIndex } from "@/lib/searchIndex";
import imageLoader, { responsiveSrcSet, responsiveUrl } from "@/lib/imageLoader";
import { HIGHLIGHTS_PER_JOB, SEARCH_RESULTS, TAGS_PER_CARD } from "@/lib/display";
import { ORBIT_LAP_SECONDS, BAND_LOOP_SECONDS } from "@/lib/clientSpin";
import { breadcrumbJsonLd } from "@/lib/breadcrumbs";
import { estimateReadingTime } from "@/lib/readingTime";
import { ogImageUrl, slugFromOgParam } from "@/lib/ogImageUrl";
import { getPublishedTestimonials, getTestimonials } from "@/lib/testimonials";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (file: string) => JSON.parse(readFileSync(path.join(root, file), "utf8"));

// --- faqBot: the offline chat fallback every visitor hits when the Worker is down ------

test("askFaqBot handles an empty question without pretending to answer", () => {
  const answer = askFaqBot("   ");
  assert.equal(answer.matched, false);
  assert.ok(answer.text.length > 0);
});

test("askFaqBot greets, matches a real intent, and falls back on nonsense", () => {
  assert.equal(askFaqBot("hello").matched, true, "a greeting should be recognised");
  assert.equal(askFaqBot("Hi there").matched, true, "greeting detection uses the first word");

  const matched = askFaqBot("What technologies does he work with?");
  assert.equal(matched.matched, true);
  assert.ok(matched.text.trim().length > 0);

  const nonsense = askFaqBot("zzzqqq vvvv wxyz");
  assert.equal(nonsense.matched, false);
  assert.equal(nonsense.text, readJson("content/faq-script.json").fallbackAnswer);
});

test("askFaqBot answers every starter question it offers", () => {
  assert.ok(STARTER_QUESTIONS.length > 0);
  for (const question of STARTER_QUESTIONS) {
    const answer = askFaqBot(question);
    assert.equal(answer.matched, true, `starter question went unanswered: "${question}"`);
    assert.ok(answer.text.trim().length > 0, `empty answer for "${question}"`);
  }
});

test("askFaqBot never leaks an unreplaced {placeholder}", () => {
  for (const question of ["hello", ...STARTER_QUESTIONS, "who is he"]) {
    assert.doesNotMatch(askFaqBot(question).text, /\{[a-zA-Z]+\}/, `unreplaced placeholder for "${question}"`);
  }
});

// --- searchIndex: what ⌘K can actually find -------------------------------------------

test("searchIndex covers every content type and no unpublished entry", () => {
  const categories = new Set(searchIndex.map((item) => item.category));
  for (const expected of ["Page", "Blog", "Case Study", "Project", "Client", "Certification", "Service"]) {
    assert.ok(categories.has(expected), `nothing indexed for "${expected}"`);
  }

  const unpublishedClients = (readJson("content/clients.json").clients as { published?: boolean; name: string }[])
    .filter((client) => client.published === false)
    .map((client) => client.name);
  for (const name of unpublishedClients) {
    assert.ok(!searchIndex.some((item) => item.title === name), `unpublished client "${name}" is indexed`);
  }
});

test("searchIndex entries are well formed and body text is stripped of markdown", () => {
  for (const item of searchIndex) {
    assert.ok(item.title.trim(), "every item needs a title");
    assert.ok(item.url.startsWith("/"), `url should be a site path: ${item.url}`);
    if (item.keywords) {
      assert.doesNotMatch(item.keywords, /```/, `code fences should be stripped: ${item.title}`);
      assert.doesNotMatch(item.keywords, /!\[/, `image markup should be stripped: ${item.title}`);
      assert.ok(item.keywords.length <= 1000, `keywords should stay small: ${item.title}`);
    }
  }
});

test("searchIndex indexes tags, so a tag search can match", () => {
  const post = (readJson("content/blogs.json").posts as { title: string; tags?: string[] }[]).find(
    (entry) => (entry.tags ?? []).length > 0
  );
  assert.ok(post, "expected at least one tagged post");
  const indexed = searchIndex.find((item) => item.title === post!.title);
  assert.ok(indexed?.keywords?.includes(post!.tags![0]), "the post's first tag should be searchable");
});

test("page descriptions come from seo.json rather than a second copy", () => {
  const about = searchIndex.find((item) => item.url === "/about");
  const seoAbout = (readJson("content/seo.json").routes as { route: string; description: string }[]).find(
    (route) => route.route === "/about"
  );
  assert.equal(about?.description, seoAbout?.description);
});

// --- imageLoader: every image URL on the site -----------------------------------------

test("imageLoader passes images through in development and leaves data/blob URLs alone", () => {
  // NODE_ENV is "test" here, so hasVariants() is false — the dev/author behaviour.
  assert.equal(responsiveSrcSet("/images/logos/hstu.png"), undefined);
  assert.equal(responsiveUrl("/images/logos/hstu.png", 640), "/images/logos/hstu.png");
  assert.equal(imageLoader({ src: "data:image/png;base64,AAA", width: 640 }), "data:image/png;base64,AAA");
  assert.equal(imageLoader({ src: "blob:http://localhost/x", width: 640 }), "blob:http://localhost/x");
  assert.equal(imageLoader({ src: "/images/logos/hstu.png", width: 640 }), "/images/logos/hstu.png?w=640");
  assert.equal(imageLoader({ src: "/x.svg?v=2", width: 640 }), "/x.svg?v=2&w=640");
});

// --- config-driven values: a bad value must not break a page --------------------------

test("display limits are whole numbers of at least 1", () => {
  for (const [name, value] of [
    ["highlightsPerJob", HIGHLIGHTS_PER_JOB],
    ["tagsPerCard", TAGS_PER_CARD],
    ["searchResults", SEARCH_RESULTS],
  ] as const) {
    assert.ok(Number.isInteger(value), `${name} should be an integer`);
    assert.ok(value >= 1, `${name} should be at least 1, got ${value}`);
  }
});

test("spin speeds are positive and no faster than the 2-second floor", () => {
  for (const [name, value] of [
    ["orbitLapSeconds", ORBIT_LAP_SECONDS],
    ["bandLoopSeconds", BAND_LOOP_SECONDS],
  ] as const) {
    assert.ok(Number.isFinite(value) && value >= 2, `${name} should be >= 2, got ${value}`);
  }
});

// --- SEO helpers ----------------------------------------------------------------------

test("breadcrumbJsonLd builds an absolute, correctly positioned trail starting at Home", () => {
  const { siteUrl } = readJson("content/config.json");
  const trail = breadcrumbJsonLd([
    { name: "Blog", path: "/blog" },
    { name: "A Post", path: "/blog/a-post" },
  ]);
  assert.equal(trail["@type"], "BreadcrumbList");
  const items = trail.itemListElement as { position: number; name: string; item: string }[];
  assert.deepEqual(
    items.map((entry) => [entry.position, entry.name, entry.item]),
    [
      [1, "Home", siteUrl],
      [2, "Blog", `${siteUrl}/blog`],
      [3, "A Post", `${siteUrl}/blog/a-post`],
    ]
  );
});

test("ogImageUrl keeps the .png extension GitHub Pages needs, and slugFromOgParam reverses it", () => {
  const { siteUrl } = readJson("content/config.json");
  assert.equal(ogImageUrl("blog", "my-post"), `${siteUrl}/og-image/blog/my-post.png`);
  assert.equal(slugFromOgParam("my-post.png"), "my-post");
  assert.equal(slugFromOgParam("my-post"), "my-post");
});

test("estimateReadingTime counts every section and never returns zero", () => {
  assert.equal(estimateReadingTime(""), 1, "an empty body should still read as 1 minute");
  const long = "word ".repeat(1000);
  assert.ok(estimateReadingTime(long) > 1);
  assert.ok(
    estimateReadingTime(long, long) > estimateReadingTime(long),
    "section bodies should count towards the estimate"
  );
});

// --- testimonials: the PII filter -----------------------------------------------------

test("getPublishedTestimonials drops unpublished entries, which carry unreviewed emails", () => {
  const all = getTestimonials();
  const published = getPublishedTestimonials();
  assert.ok(all.length >= published.length);
  assert.ok(published.every((entry) => entry.published !== false));

  const hidden = all.filter((entry) => entry.published === false);
  for (const entry of hidden) {
    assert.ok(!published.some((shown) => shown.id === entry.id), `"${entry.name}" should not be published`);
  }
});

// --- visitor session: the logic behind the behaviour signals ---------------------------

test("visitBucket groups visit numbers instead of keeping an exact count", async () => {
  const { visitBucket } = await import("@/lib/visitorSession");
  assert.equal(visitBucket(0), "1", "a missing count is treated as a first visit");
  assert.equal(visitBucket(1), "1");
  assert.equal(visitBucket(2), "2");
  assert.equal(visitBucket(3), "3-5");
  assert.equal(visitBucket(5), "3-5");
  assert.equal(visitBucket(6), "6+");
  assert.equal(visitBucket(500), "6+");
});

test("visitorSession helpers survive storage being unavailable", async () => {
  // No window/sessionStorage under the test runner, which is the same situation as a
  // private window with site data blocked: every helper must no-op, never throw.
  const session = await import("@/lib/visitorSession");
  assert.doesNotThrow(() => session.recordPageView("/blog"));
  assert.doesNotThrow(() => session.oncePerSession("anything"));
  assert.doesNotThrow(() => session.withinSignalBudget());
});

/** Names from a `export type X = | "a" | "b";` union, including the last one. */
function unionMembers(source: string, declaration: string): string[] {
  const from = source.indexOf(declaration);
  assert.ok(from >= 0, `declaration not found: ${declaration}`);
  const block = source.slice(from, source.indexOf(";", from));
  return [...block.matchAll(/"([a-z0-9-]+)"/g)].map((match) => match[1]);
}

/** Names from a `const X = [ "a", "b" ] as const;` array. */
function arrayMembers(source: string, declaration: string): string[] {
  const from = source.indexOf(declaration);
  assert.ok(from >= 0, `declaration not found: ${declaration}`);
  const block = source.slice(from, source.indexOf("] as const", from));
  return [...block.matchAll(/"([a-z0-9-]+)"/g)].map((match) => match[1]);
}

test("every signal the client can send is one the Worker accepts", () => {
  // The two lists are in different projects and cannot import each other, so this is the
  // only thing stopping a client signal from being silently rejected with a 400.
  const clientSignals = unionMembers(
    readFileSync(path.join(root, "lib/analytics.ts"), "utf8"),
    "export type SignalName ="
  );
  const workerSignals = arrayMembers(readFileSync(path.join(root, "worker/src/index.ts"), "utf8"), "const SIGNAL_NAMES");

  assert.equal(clientSignals.length, 11, "expected the full client signal union");
  assert.ok(workerSignals.includes("visit"), "the last union member must be extracted too");
  for (const name of clientSignals) {
    assert.ok(workerSignals.includes(name), `client sends "${name}" but the Worker rejects it`);
  }
});

test("every click area the client sends is one the Worker accepts", () => {
  const clientAreas = unionMembers(readFileSync(path.join(root, "lib/analytics.ts"), "utf8"), "export type ClickArea =");
  const workerAreas = arrayMembers(readFileSync(path.join(root, "worker/src/index.ts"), "utf8"), "const CLICK_AREAS");
  assert.equal(clientAreas.length, 12, "expected the full client click-area union");
  for (const area of clientAreas) {
    assert.ok(workerAreas.includes(area), `client sends click area "${area}" but the Worker rejects it`);
  }
});
