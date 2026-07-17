const OWNER = "developerhridu";
const REPO = "developerhridu.github.io";
const BRANCH = "main";

function encodeBase64Unicode(str: string): string {
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
