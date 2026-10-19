// The CMS save/publish/undo code against an in-memory fake of the GitHub API it calls.
// Runs in its own process (node --test isolates files), so replacing fetch/setTimeout is safe.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as store from "@/lib/adminStore";
import * as gh from "@/lib/github";

type Commit = { sha: string; tree: string; parents: string[]; message: string };
type FileEntry = { content: string; sha: string };

let files = new Map<string, FileEntry>();
const trees = new Map<string, Map<string, FileEntry>>();
const commits = new Map<string, Commit>();
const blobs = new Map<string, string>();
const calls: string[] = [];
let head = "";
let counter = 0;

const b64 = (s: string) => Buffer.from(s).toString("base64");
const unb64 = (s: string) => Buffer.from(s, "base64").toString();

function snapshotTree(): string {
  const sha = `tree-${++counter}`;
  trees.set(sha, new Map(files));
  return sha;
}
function seed(path: string, content: string) {
  files.set(path, { content, sha: `blob-${++counter}` });
}
function commitNow(message: string) {
  const sha = `commit-${++counter}`;
  commits.set(sha, { sha, tree: snapshotTree(), parents: head ? [head] : [], message });
  head = sha;
}

seed("content/a.json", b64('{"v":1}'));
seed("content/b.json", b64('{"v":1}'));
commitNow("initial");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const href = String(input);
  const method = init?.method ?? "GET";
  calls.push(`${method} ${href.replace("https://api.github.com/repos/developerhridu/developerhridu.github.io/", "")}`);
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;

  const contents = href.match(/\/contents\/(.+?)\?ref=main$/);
  if (contents) {
    const file = files.get(contents[1]);
    return file ? json({ content: file.content, sha: file.sha }) : json({ message: "Not Found" }, 404);
  }
  if (href.endsWith("/git/ref/heads/main")) return json({ object: { sha: head } });
  const commitGet = href.match(/\/git\/commits\/(.+)$/);
  if (commitGet && method === "GET") {
    const c = commits.get(commitGet[1])!;
    return json({ sha: c.sha, tree: { sha: c.tree }, parents: c.parents.map((sha) => ({ sha })) });
  }
  if (href.endsWith("/git/blobs")) {
    const sha = `blob-${++counter}`;
    blobs.set(sha, body.content);
    return json({ sha });
  }
  if (href.endsWith("/git/trees")) {
    const base = new Map(trees.get(body.base_tree)!);
    for (const entry of body.tree) {
      if (entry.sha === null) {
        if (!base.has(entry.path)) return json({ message: "tree.path does not exist" }, 422);
        base.delete(entry.path);
      } else base.set(entry.path, { content: blobs.get(entry.sha)!, sha: entry.sha });
    }
    const sha = `tree-${++counter}`;
    trees.set(sha, base);
    return json({ sha });
  }
  if (href.endsWith("/git/commits") && method === "POST") {
    const sha = `commit-${++counter}`;
    commits.set(sha, { sha, tree: body.tree, parents: body.parents, message: body.message });
    return json({ sha });
  }
  if (href.endsWith("/git/refs/heads/main") && method === "PATCH") {
    head = body.sha;
    files = new Map(trees.get(commits.get(head)!.tree)!);
    return json({});
  }
  if (href.includes("/actions/runs")) {
    return json({ workflow_runs: [{ status: "completed", conclusion: "success", html_url: "https://example/run" }] });
  }
  return json({ message: `unhandled ${method} ${href}` }, 500);
}) as typeof fetch;

// Deploy polling waits 5s between checks — run timers immediately here.
globalThis.setTimeout = ((fn: () => void) => {
  queueMicrotask(fn);
  return 0;
}) as unknown as typeof setTimeout;

const commitCount = () => calls.filter((c) => c === "POST git/commits").length;

test("batch mode: save is staged, nothing is committed", async () => {
  store.setPublishMode("batch");
  const { sha } = await gh.fetchContentFile("content/a.json", "t");
  const result = await gh.commitFiles(
    [{ path: "content/a.json", content: b64('{"v":2}') }, { path: "public/images/x/new.webp", content: b64("IMG") }],
    "content: update A",
    "t",
    { path: "content/a.json", expectedSha: sha }
  );
  assert.equal(result.staged, true);
  assert.equal(commitCount(), 0);
  assert.equal(store.getPending().files.length, 2);
});

test("reads return the staged version with its stand-in sha", async () => {
  const file = await gh.fetchContentFile("content/a.json", "t");
  assert.equal(file.content, '{"v":2}');
  assert.match(file.sha, /^staged-/);
});

test("a second save on top of staged content is accepted", async () => {
  const { sha } = await gh.fetchContentFile("content/a.json", "t");
  await gh.commitFiles([{ path: "content/a.json", content: b64('{"v":3}') }], "content: update A again", "t", { path: "content/a.json", expectedSha: sha });
  assert.equal((await gh.fetchContentFile("content/a.json", "t")).content, '{"v":3}');
});

test("saving with a stale sha is rejected as a conflict", async () => {
  await assert.rejects(
    gh.commitFiles([{ path: "content/a.json", content: b64("{}") }], "content: stale", "t", { path: "content/a.json", expectedSha: "blob-old" }),
    (err: unknown) => gh.isConflictError(err) && (err as Error).message === gh.CONFLICT_MESSAGE
  );
});

test("an image staged then deleted before publishing is dropped, not sent as a delete", async () => {
  await gh.commitFiles([{ path: "public/images/x/temp.webp", content: b64("T") }], "content: add temp", "t");
  await gh.commitFiles([{ path: "public/images/x/temp.webp", content: null }], "content: remove temp", "t");
  assert.equal(store.getStaged("public/images/x/temp.webp")!.content, null);
});

test("fetchPublishedFile reads GitHub's version, ignoring pending edits", async () => {
  assert.equal((await gh.fetchPublishedFile("content/a.json", "t"))!.content, '{"v":1}');
  assert.equal(await gh.fetchPublishedFile("content/missing.json", "t"), null);
});

test("Publish all: one commit with every staged file and a combined message", async () => {
  const sha = await gh.publishPending("t");
  assert.equal(commitCount(), 1);
  assert.equal(head, sha);
  assert.equal(unb64(files.get("content/a.json")!.content), '{"v":3}');
  assert.equal(unb64(files.get("public/images/x/new.webp")!.content), "IMG");
  assert.equal(files.has("public/images/x/temp.webp"), false);
  const message = commits.get(sha!)!.message;
  assert.match(message, /^content: update A, update A again and 2 more/);
  assert.match(message, /- content: remove temp/);
  assert.equal(store.getPending().files.length, 0);
  assert.equal(store.getLastCommit()!.sha, sha);
});

test("publish refuses when GitHub changed a staged file meanwhile, and keeps the queue", async () => {
  const { sha } = await gh.fetchContentFile("content/b.json", "t");
  await gh.commitFiles([{ path: "content/b.json", content: b64('{"v":"mine"}') }], "content: update B", "t", { path: "content/b.json", expectedSha: sha });
  files.set("content/b.json", { content: b64('{"v":"theirs"}'), sha: `blob-${++counter}` });
  commitNow("external edit");
  await assert.rejects(gh.publishPending("t"), (err: unknown) => gh.isConflictError(err));
  assert.equal(store.getPending().files.length, 1);
  store.clearPending();
});

test("Undo is refused once newer commits landed after the CMS commit", async () => {
  await assert.rejects(gh.undoLastCommit("t"), /newer commits/);
  assert.equal(store.getLastCommit(), null);
});

test("immediate mode commits right away; Undo restores the previous tree", async () => {
  store.setPublishMode("immediate");
  const before = unb64(files.get("content/a.json")!.content);
  const { sha } = await gh.fetchContentFile("content/a.json", "t");
  const result = await gh.commitFiles([{ path: "content/a.json", content: b64('{"v":"immediate"}') }], "content: quick fix", "t", { path: "content/a.json", expectedSha: sha });
  assert.equal(result.staged, false);
  assert.equal(unb64(files.get("content/a.json")!.content), '{"v":"immediate"}');

  await gh.undoLastCommit("t");
  assert.equal(unb64(files.get("content/a.json")!.content), before);
  assert.match(commits.get(head)!.message, /^revert: content: quick fix/);
  store.setPublishMode("batch");
});

test("updateContentFile (skills / UI strings / FAQ) is staged like everything else", async () => {
  const { sha } = await gh.fetchContentFile("content/b.json", "t");
  const commitsBefore = commitCount();
  await gh.updateContentFile("content/b.json", '{"v":"via update"}', sha, "content: update tech stack", "t");
  assert.equal(commitCount(), commitsBefore);
  assert.equal((await gh.fetchContentFile("content/b.json", "t")).content, '{"v":"via update"}');
  store.clearPending();
});

test("deploy tracking ends in Live for a successful run", async () => {
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(store.getDeploy().status, "live");
});
