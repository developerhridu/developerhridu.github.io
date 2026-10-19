import {
  clearPending,
  getLastCommit,
  getPending,
  getPublishMode,
  getStaged,
  setDeploy,
  setLastCommit,
  stageChanges,
} from "@/lib/adminStore";

const OWNER = "developerhridu";
const REPO = "developerhridu.github.io";
const BRANCH = "main";

export const CONFLICT_MESSAGE =
  "This content was changed somewhere else (another tab, device, or a direct commit) since you opened it. " +
  "Your edits are still in the form — copy anything you need, click Reload to get the latest version, then re-apply them.";

export function encodeBase64Unicode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64Unicode(b64: string): string {
  return decodeURIComponent(escape(atob(b64)));
}

export interface GitHubFile {
  content: string;
  sha: string;
}

export class GitHubApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function isConflictError(err: unknown): boolean {
  return err instanceof GitHubApiError && err.status === 409;
}

async function githubRequest(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new GitHubApiError(body.message || `GitHub API error (${res.status})`, res.status);
  }

  return res.json();
}

/** Reads a repo file — or its saved-but-unpublished version, so editors see their own pending edits. */
export async function fetchContentFile(path: string, token: string): Promise<GitHubFile> {
  const staged = getStaged(path);
  if (staged) {
    if (staged.content === null) throw new GitHubApiError("Not Found", 404);
    return { content: decodeBase64Unicode(staged.content), sha: staged.stagedSha };
  }
  const data = await githubRequest(`${path}?ref=${BRANCH}`, token);
  return { content: decodeBase64Unicode(data.content), sha: data.sha };
}

/** Single-file save; goes through `commitFiles` so it's batched and conflict-checked like every other save. */
export async function updateContentFile(
  path: string,
  content: string,
  sha: string,
  message: string,
  token: string
): Promise<void> {
  await commitFiles([{ path, content: encodeBase64Unicode(content) }], message, token, { path, expectedSha: sha });
}

async function getFileSha(path: string, token: string): Promise<string | null> {
  try {
    const data = await githubRequest(`${path}?ref=${BRANCH}`, token);
    return data.sha;
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 404) return null;
    throw err;
  }
}

/** Creates or overwrites a binary file (e.g. an image) at `path`. `base64Content` must
 *  already be base64-encoded (no data: URL prefix). */
export async function uploadBinaryFile(
  path: string,
  base64Content: string,
  message: string,
  token: string
): Promise<void> {
  const existingSha = await getFileSha(path, token);
  await githubRequest(path, token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: base64Content,
      ...(existingSha ? { sha: existingSha } : {}),
      branch: BRANCH,
    }),
  });
}

/** Deletes a file at `path` if it exists. No-op (does not throw) if it's already gone. */
export async function deleteBinaryFile(path: string, message: string, token: string): Promise<void> {
  const sha = await getFileSha(path, token);
  if (!sha) return;
  await githubRequest(path, token, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      sha,
      branch: BRANCH,
    }),
  });
}

async function githubGitRequest(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new GitHubApiError(body.message || `GitHub API error (${res.status})`, res.status);
  }

  return res.json();
}

export interface FileChange {
  /** Repo-relative path, e.g. "content/blogs.json" or "public/images/blog/x.png". */
  path: string;
  /** Base64-encoded content to create/update the file; null to delete it. */
  content: string | null;
}

export interface CommitResult {
  /** True when the change went to the pending queue instead of the repo. */
  staged: boolean;
  sha?: string;
}

/** Throws a conflict error when `guard.path` no longer matches the version the editor loaded. */
async function assertUnchanged(guard: { path: string; expectedSha: string }, token: string) {
  const staged = getStaged(guard.path);
  const currentSha = staged ? staged.stagedSha : await getFileSha(guard.path, token);
  if (currentSha !== guard.expectedSha) throw new GitHubApiError(CONFLICT_MESSAGE, 409);
}

/** Before publishing staged files, make sure nothing changed them on GitHub in the meantime. */
async function assertStagedBasesUnchanged(token: string) {
  const checks = getPending().files.filter((file) => file.baseSha);
  const results = await Promise.all(checks.map(async (file) => (await getFileSha(file.path, token)) === file.baseSha));
  if (results.some((ok) => !ok)) throw new GitHubApiError(CONFLICT_MESSAGE, 409);
}

function mergeChanges(base: FileChange[], next: FileChange[]): FileChange[] {
  const byPath = new Map(base.map((change) => [change.path, change]));
  for (const change of next) byPath.set(change.path, change);
  return [...byPath.values()];
}

/** "content: update A" or "content: update A, B and 3 more" plus a bullet list body. */
function combinedMessage(messages: string[]): string {
  const unique = [...new Set(messages)];
  if (unique.length <= 1) return unique[0] ?? "content: update";
  const subjects = unique.map((message) => message.replace(/^content:\s*/, ""));
  const head = subjects.length > 2 ? `${subjects.slice(0, 2).join(", ")} and ${subjects.length - 2} more` : subjects.join(", ");
  return `content: ${head}\n\n${unique.map((message) => `- ${message}`).join("\n")}`;
}

/**
 * Saves file adds/updates/deletes. In batch mode (the default) they join the pending queue
 * and go live together on Publish; in immediate mode they — plus anything still pending —
 * are committed right away as one atomic commit.
 *
 * If `guard` is given, aborts with a conflict error when that file has changed since it
 * was loaded.
 */
export async function commitFiles(
  changes: FileChange[],
  message: string,
  token: string,
  guard?: { path: string; expectedSha: string }
): Promise<CommitResult> {
  if (changes.length === 0) return { staged: false };
  if (guard) await assertUnchanged(guard, token);

  if (getPublishMode() === "batch") {
    stageChanges(changes, message, guard);
    return { staged: true };
  }

  const pending = getPending();
  if (pending.files.length > 0) await assertStagedBasesUnchanged(token);
  const all = mergeChanges(pending.files.map(({ path, content }) => ({ path, content })), changes);
  const sha = await writeCommit(all, combinedMessage([...pending.saves.map((save) => save.message), message]), token);
  clearPending();
  return { staged: false, sha };
}

/** Commits everything in the pending queue as one commit. */
export async function publishPending(token: string): Promise<string | null> {
  const pending = getPending();
  if (pending.files.length === 0) return null;
  await assertStagedBasesUnchanged(token);
  const sha = await writeCommit(
    pending.files.map(({ path, content }) => ({ path, content })),
    combinedMessage(pending.saves.map((save) => save.message)),
    token
  );
  clearPending();
  return sha;
}

/** The version of a file that's live on GitHub, ignoring pending changes. Null when it doesn't exist. */
export async function fetchPublishedFile(path: string, token: string): Promise<GitHubFile | null> {
  try {
    const data = await githubRequest(`${path}?ref=${BRANCH}`, token);
    return { content: decodeBase64Unicode(data.content), sha: data.sha };
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 404) return null;
    throw err;
  }
}

/** Decodes a staged file's base64 content as text. */
export function decodeStagedText(base64: string): string {
  return decodeBase64Unicode(base64);
}

/** Reverts the last CMS commit — only while it's still the newest commit on the branch. */
export async function undoLastCommit(token: string): Promise<void> {
  const last = getLastCommit();
  if (!last) throw new Error("There's no CMS save to undo.");
  if (getPending().files.length > 0) throw new Error("Publish or discard your pending changes before undoing.");

  const ref = await githubGitRequest(`ref/heads/${BRANCH}`, token);
  if (ref.object.sha !== last.sha) {
    setLastCommit(null);
    throw new GitHubApiError("Can't undo — newer commits landed after your last save. Revert it on GitHub instead.", 409);
  }
  const commit = await githubGitRequest(`commits/${last.sha}`, token);
  const parentSha = commit.parents?.[0]?.sha;
  if (!parentSha) throw new Error("This commit has no parent to go back to.");
  const parent = await githubGitRequest(`commits/${parentSha}`, token);
  const firstLine = last.message.split("\n")[0];
  const revert = await githubGitRequest("commits", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: `revert: ${firstLine}`, tree: parent.tree.sha, parents: [last.sha] }),
  });
  await githubGitRequest(`refs/heads/${BRANCH}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha: revert.sha }),
  });
  setLastCommit(null);
  void trackDeploy(revert.sha, `revert: ${firstLine}`, token);
}

export interface RepoImage {
  /** Public path, e.g. "/images/blog/x.png". */
  path: string;
  /** Git blob sha — equal shas mean byte-identical files. */
  sha: string;
  size: number;
}

/** Every image under public/images on the branch, in one API call. */
export async function listRepoImages(token: string): Promise<RepoImage[]> {
  const tree = await githubGitRequest(`trees/${BRANCH}?recursive=1`, token);
  return (tree.tree as { path: string; type: string; sha: string; size?: number }[])
    .filter((item) => item.type === "blob" && item.path.startsWith("public/images/") && /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(item.path))
    .map((item) => ({ path: item.path.slice("public".length), sha: item.sha, size: item.size ?? 0 }));
}

const RUNS_URL = `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs`;

async function fetchRun(sha: string, token: string) {
  const query = `${RUNS_URL}?head_sha=${sha}&per_page=1`;
  let res = await fetch(query, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    cache: "no-store",
  });
  // Fine-grained tokens often lack Actions access; the repo is public, so retry anonymously.
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    res = await fetch(query, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
  }
  if (!res.ok) return null;
  const data = await res.json();
  return (data.workflow_runs?.[0] as { status: string; conclusion: string | null; html_url: string } | undefined) ?? null;
}

/** Polls the deploy workflow for `sha` and reports Queued → Building → Live/Failed. */
export async function trackDeploy(sha: string, message: string, token: string): Promise<void> {
  setDeploy({ status: "queued", sha, message });
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    let run;
    try {
      run = await fetchRun(sha, token);
    } catch {
      continue;
    }
    if (!run) continue;
    if (run.status === "completed") {
      const ok = run.conclusion === "success";
      // A newer commit cancels this run (concurrency group) — that's fine, its deploy covers this one.
      const status = ok ? "live" : run.conclusion === "cancelled" ? "unknown" : "failed";
      setDeploy({ status, sha, message, runUrl: run.html_url });
      return;
    }
    setDeploy({ status: run.status === "in_progress" ? "building" : "queued", sha, message, runUrl: run.html_url });
  }
  setDeploy({ status: "unknown", sha, message });
}

async function writeCommit(changes: FileChange[], message: string, token: string): Promise<string> {
  const sha = await createCommit(changes, message, token);
  setLastCommit({ sha, message });
  void trackDeploy(sha, message, token);
  return sha;
}

/** Commits changes as one atomic commit via the Git Data API (blobs → tree → commit → ref update). */
async function createCommit(allChanges: FileChange[], message: string, token: string): Promise<string> {
  // A file staged and then deleted before publishing never existed on GitHub; deleting it would fail.
  const deletionExists = await Promise.all(
    allChanges.map(async (change) => change.content !== null || (await getFileSha(change.path, token)) !== null)
  );
  const changes = allChanges.filter((_, index) => deletionExists[index]);
  if (changes.length === 0) throw new Error("Nothing left to publish.");

  const ref = await githubGitRequest(`ref/heads/${BRANCH}`, token);
  const latestCommitSha = ref.object.sha;

  const latestCommit = await githubGitRequest(`commits/${latestCommitSha}`, token);
  const baseTreeSha = latestCommit.tree.sha;

  const treeEntries = await Promise.all(
    changes.map(async (change) => {
      if (change.content === null) {
        return { path: change.path, mode: "100644", type: "blob", sha: null };
      }
      const blob = await githubGitRequest("blobs", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: change.content, encoding: "base64" }),
      });
      return { path: change.path, mode: "100644", type: "blob", sha: blob.sha };
    })
  );

  const newTree = await githubGitRequest("trees", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  });

  const newCommit = await githubGitRequest("commits", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, tree: newTree.sha, parents: [latestCommitSha] }),
  });

  await githubGitRequest(`refs/heads/${BRANCH}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha: newCommit.sha }),
  });
  return newCommit.sha as string;
}
