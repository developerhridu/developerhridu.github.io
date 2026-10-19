import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import * as store from "@/lib/adminStore";
import * as shared from "@/components/admin/shared";
import * as validation from "@/components/admin/validation";
import { diffContent } from "@/lib/contentDiff";
import { checkLinks, extractLinks } from "@/lib/linkCheck";
import { findIssues } from "@/components/admin/healthRules";
import { CONTENT_SOURCES, type AdminItem } from "@/components/admin/adminContent";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// --- pending queue -----------------------------------------------------------

test("first stage keeps the real sha as baseSha", () => {
  store.clearPending();
  store.stageChanges([{ path: "content/a.json", content: "QQ==" }], "content: update A", { path: "content/a.json", expectedSha: "real-1" });
  const staged = store.getStaged("content/a.json")!;
  assert.equal(staged.baseSha, "real-1");
  assert.match(staged.stagedSha, /^staged-/);
});

test("re-staging a file keeps the original baseSha and issues a new stagedSha", () => {
  const first = store.getStaged("content/a.json")!.stagedSha;
  store.stageChanges([{ path: "content/a.json", content: "Qg==" }], "content: update A again", { path: "content/a.json", expectedSha: first });
  const staged = store.getStaged("content/a.json")!;
  assert.equal(staged.baseSha, "real-1");
  assert.notEqual(staged.stagedSha, first);
  assert.equal(staged.content, "Qg==");
  assert.equal(store.getPending().files.length, 1);
  assert.equal(store.getPending().saves.length, 2);
});

test("staged images resolve to data URLs; unstaged paths pass through", () => {
  store.stageChanges([{ path: "public/images/x/pic.webp", content: "AAAA" }], "content: add pic");
  assert.equal(store.stagedImageSrc("/images/x/pic.webp"), "data:image/webp;base64,AAAA");
  assert.equal(store.stagedImageSrc("/images/x/other.png"), "/images/x/other.png");
  assert.equal(store.stagedImageSrc("https://example.com/a.png"), "https://example.com/a.png");
});

test("clearPending empties the queue", () => {
  store.clearPending();
  assert.deepEqual(store.getPending(), { files: [], saves: [] });
});

test("discarding one group drops its saves and its uploads, keeps the rest", () => {
  store.clearPending();
  store.stageChanges(
    [{ path: "content/certifications.json", content: "MQ==" }, { path: "public/images/certifications/a.webp", content: "QQ==" }],
    "content: update SQL"
  );
  store.stageChanges([{ path: "content/blogs.json", content: "Mg==" }], "content: update Post");
  store.stageChanges([{ path: "content/certifications.json", content: "Mw==" }], "content: update React");
  const groups = store.pendingGroups();
  assert.deepEqual(groups.map((g) => g.path), ["content/certifications.json", "content/blogs.json"]);
  assert.equal(groups[0].saves.length, 2);

  store.discardPendingGroup("content/certifications.json");
  const left = store.getPending();
  assert.deepEqual(left.files.map((f) => f.path), ["content/blogs.json"]);
  assert.deepEqual(left.saves.map((s) => s.message), ["content: update Post"]);
  store.clearPending();
});

// --- helpers -----------------------------------------------------------------

test("moveItem moves forward, backward, and ignores out-of-range", () => {
  assert.deepEqual(shared.moveItem(["a", "b", "c", "d"], 0, 2), ["b", "c", "a", "d"]);
  assert.deepEqual(shared.moveItem(["a", "b", "c", "d"], 3, 1), ["a", "d", "b", "c"]);
  const same = ["a", "b"];
  assert.equal(shared.moveItem(same, 0, 5), same);
});

test("gitBlobSha matches `git hash-object` (used to spot duplicate uploads)", async () => {
  const file = path.join(root, "public/images/certifications/react-basics.png");
  const expected = execFileSync("git", ["hash-object", file], { cwd: root, encoding: "utf8" }).trim();
  assert.equal(await shared.gitBlobSha(new Blob([readFileSync(file)])), expected);
});

test("savedMessage follows the publish mode", () => {
  store.setPublishMode("batch");
  assert.match(shared.savedMessage(), /pending changes/);
  store.setPublishMode("immediate");
  assert.match(shared.savedMessage(), /published/);
  store.setPublishMode("batch");
});

// --- validation --------------------------------------------------------------

test("urlError accepts https, site paths and empty; rejects junk", () => {
  assert.equal(validation.urlError(""), null);
  assert.equal(validation.urlError("https://example.com/x"), null);
  assert.equal(validation.urlError("/pdf/letter.pdf"), null);
  assert.ok(validation.urlError("example.com"));
  assert.ok(validation.urlError("/relative", { allowRelative: false }));
  assert.ok(validation.urlError("javascript:alert(1)"));
});

test("emailError, slugError and requiredError", () => {
  assert.equal(validation.emailError("a@b.co"), null);
  assert.ok(validation.emailError("not-an-email"));
  assert.equal(validation.slugError("my-post-2"), null);
  assert.ok(validation.slugError("My Post"));
  assert.ok(validation.slugError(""));
  assert.ok(validation.requiredError("  ", "Name"));
});

test("collectErrors drops passing checks", () => {
  assert.deepEqual(validation.collectErrors([["a", null], ["b", "bad"]]), { b: "bad" });
});

// --- review diff -------------------------------------------------------------

test("diffContent reports added, removed and changed entries by id", () => {
  const before = JSON.stringify({ certifications: [{ id: "a", name: "SQL", date: "July 2026", updatedAt: "x" }, { id: "b", name: "C#", date: "2024" }] });
  const after = JSON.stringify({ certifications: [{ id: "a", name: "SQL", date: "June 2024", updatedAt: "y" }, { id: "c", name: "React", date: "2023" }] });
  const result = diffContent(before, after);
  const byKind = Object.fromEntries(result.entries.map((e) => [e.kind, e]));
  assert.deepEqual(byKind.changed.fields, [{ field: "date", before: "July 2026", after: "June 2024" }]);
  assert.equal(byKind.changed.label, "SQL");
  assert.equal(byKind.added.label, "React");
  assert.equal(byKind.removed.label, "C#");
});

test("diffContent ignores updatedAt-only edits and detects pure reorders", () => {
  const a = JSON.stringify({ posts: [{ id: "1", title: "A", updatedAt: "1" }, { id: "2", title: "B" }] });
  const b = JSON.stringify({ posts: [{ id: "2", title: "B" }, { id: "1", title: "A", updatedAt: "2" }] });
  const result = diffContent(a, b);
  assert.equal(result.entries.length, 0);
  assert.equal(result.reordered, true);
});

test("diffContent handles object files (profile.json) field by field", () => {
  const result = diffContent(JSON.stringify({ name: "A", social: { github: "x" } }), JSON.stringify({ name: "A", social: { github: "y" } }));
  assert.deepEqual(result.entries[0].fields, [{ field: "social.github", before: "x", after: "y" }]);
});

test("diffContent treats a brand-new file as all-added", () => {
  assert.equal(diffContent(null, JSON.stringify({ posts: [{ id: "1", title: "Hello" }] })).entries[0].kind, "added");
});

// --- links -------------------------------------------------------------------

test("extractLinks finds markdown links, bare URLs, link fields, pages and images", () => {
  const found = extractLinks({
    body: "See [docs](https://example.com/docs) and https://bare.dev/x. ![a](/images/blog/a.png) [home](/about) [top](#top) [mail](mailto:a@b.c)",
    liveUrl: "https://live.example.com",
    sections: [{ body: "![draft](/__draft-inline-image/123)" }],
  });
  assert.deepEqual(Object.fromEntries(found.map((l) => [l.url, l.kind])), {
    "https://example.com/docs": "external",
    "https://bare.dev/x": "external",
    "/images/blog/a.png": "image",
    "/about": "page",
    "https://live.example.com": "external",
  });
});

test("checkLinks checks images against the repo list and pending changes", async () => {
  store.clearPending();
  store.stageChanges([{ path: "public/images/new.webp", content: "QQ==" }], "content: add");
  const reports = await checkLinks(
    [
      { url: "/images/exists.png", kind: "image" },
      { url: "/images/missing.png", kind: "image" },
      { url: "/images/new.webp", kind: "image" },
    ],
    "t",
    new Set(["/images/exists.png"])
  );
  assert.deepEqual(Object.fromEntries(reports.map((r) => [r.url, r.state])), {
    "/images/missing.png": "broken",
    "/images/exists.png": "ok",
    "/images/new.webp": "ok",
  });
  store.clearPending();
});

// --- content health ----------------------------------------------------------

test("findIssues flags drafts, missing description/cover, broken images and SEO lengths", () => {
  const source = (tab: string) => CONTENT_SOURCES.find((s) => s.tab === tab)!;
  const item = (tab: string, raw: Record<string, unknown>): AdminItem => ({
    source: source(tab),
    label: String(raw.title),
    sublabel: "",
    published: raw.published !== false,
    open: { tab },
    raw,
  });
  const issues = findIssues(
    [
      item("blog", { title: "Draft post", published: false, description: "", coverImages: [], body: "![x](/images/blog/gone.png)" }),
      item("blog", { title: "Good post", description: "d".repeat(130), coverImages: ["/images/blog/ok.png"] }),
      item("seo", { title: "t".repeat(75), description: "short" }),
    ],
    new Set(["/images/blog/ok.png"])
  );
  assert.deepEqual(issues.map((i) => `${i.group}:${i.item.label}`).sort(), [
    "Broken images:Draft post",
    "Drafts:Draft post",
    "Missing details:Draft post",
    "Missing details:Draft post",
    `SEO text:${"t".repeat(75)}`,
    `SEO text:${"t".repeat(75)}`,
  ]);
});
