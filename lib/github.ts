const OWNER = "developerhridu";
const REPO = "developerhridu.github.io";
const BRANCH = "main";

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

export async function fetchContentFile(path: string, token: string): Promise<GitHubFile> {
  const data = await githubRequest(`${path}?ref=${BRANCH}`, token);
  return { content: decodeBase64Unicode(data.content), sha: data.sha };
}

export async function updateContentFile(
  path: string,
  content: string,
  sha: string,
  message: string,
  token: string
): Promise<void> {
  await githubRequest(path, token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: encodeBase64Unicode(content),
      sha,
      branch: BRANCH,
    }),
  });
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

/**
 * Commits any number of file adds/updates/deletes as a single atomic commit, via the
 * Git Data API (blobs -> tree -> commit -> ref update) — the Contents API used by
 * `updateContentFile`/`uploadBinaryFile`/`deleteBinaryFile` can only touch one file per
 * commit, which is what causes one commit per image on a multi-image save.
 *
 * If `guard` is given, aborts with a conflict error when that file has changed since it
 * was loaded — the same optimistic-concurrency protection `updateContentFile` gets from
 * requiring a matching `sha`.
 */
export async function commitFiles(
  changes: FileChange[],
  message: string,
  token: string,
  guard?: { path: string; expectedSha: string }
): Promise<void> {
  if (changes.length === 0) return;

  if (guard) {
    const currentSha = await getFileSha(guard.path, token);
    if (currentSha !== guard.expectedSha) {
      throw new GitHubApiError("Content has changed since you loaded it — reload before saving.", 409);
    }
  }

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
}
