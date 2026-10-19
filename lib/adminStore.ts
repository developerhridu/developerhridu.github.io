/**
 * Browser-only state shared by every admin editor: the queue of saved-but-unpublished
 * changes, the publish mode, the status of the latest deploy, and the last commit the
 * CMS made (for Undo). Plain module stores so `lib/github.ts` can use them without React;
 * components read them with `useSyncExternalStore`.
 */

type Listener = () => void;

function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(next: T) {
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode) — the in-memory value still works for this session.
  }
}

// ---------------------------------------------------------------------------
// Pending changes
// ---------------------------------------------------------------------------

export interface StagedFile {
  /** Repo-relative path, e.g. "content/blogs.json". */
  path: string;
  /** Base64 content, or null when the file is staged for deletion. */
  content: string | null;
  /** The file's real sha when it was first staged — checked again at publish time. */
  baseSha: string | null;
  /** Stand-in sha editors hold while the staged version is what they loaded. */
  stagedSha: string;
}

export interface PendingState {
  files: StagedFile[];
  /** One line per save, in order — becomes the publish commit message. */
  messages: string[];
}

const pendingStore = createStore<PendingState>({ files: [], messages: [] });
let stagedCounter = 0;

export const subscribePending = pendingStore.subscribe;
export const getPending = pendingStore.get;

export function getStaged(path: string): StagedFile | undefined {
  return pendingStore.get().files.find((file) => file.path === path);
}

export function stageChanges(
  changes: { path: string; content: string | null }[],
  message: string,
  guard?: { path: string; expectedSha: string }
) {
  const files = [...pendingStore.get().files];
  for (const change of changes) {
    const index = files.findIndex((file) => file.path === change.path);
    const previous = index >= 0 ? files[index] : undefined;
    const next: StagedFile = {
      path: change.path,
      content: change.content,
      // Keep the sha from the first time this file was staged; later saves build on top of it.
      baseSha: previous ? previous.baseSha : guard?.path === change.path ? guard.expectedSha : null,
      stagedSha: `staged-${++stagedCounter}`,
    };
    if (index >= 0) files[index] = next;
    else files.push(next);
  }
  pendingStore.set({ files, messages: [...pendingStore.get().messages, message] });
}

export function clearPending() {
  pendingStore.set({ files: [], messages: [] });
}

/** Data URL for an image that's staged but not yet on the site, so admin previews can show it. */
export function stagedImageSrc(publicPath: string | undefined): string | undefined {
  if (!publicPath?.startsWith("/")) return publicPath;
  const staged = getStaged(`public${publicPath}`);
  if (!staged?.content) return publicPath;
  const ext = publicPath.split(".").pop()?.toLowerCase();
  const mime = ext === "svg" ? "image/svg+xml" : ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${staged.content}`;
}

// ---------------------------------------------------------------------------
// Publish mode
// ---------------------------------------------------------------------------

export type PublishMode = "batch" | "immediate";
const MODE_KEY = "admin_publish_mode";

const isBrowser = typeof window !== "undefined";

const modeStore = createStore<PublishMode>(isBrowser && readStorage(MODE_KEY) === "immediate" ? "immediate" : "batch");

export const subscribePublishMode = modeStore.subscribe;
export const getPublishMode = modeStore.get;

export function setPublishMode(mode: PublishMode) {
  writeStorage(MODE_KEY, mode);
  modeStore.set(mode);
}

// ---------------------------------------------------------------------------
// Deploy status
// ---------------------------------------------------------------------------

export type DeployStatus = "idle" | "queued" | "building" | "live" | "failed" | "unknown";

export interface DeployState {
  status: DeployStatus;
  sha?: string;
  message?: string;
  runUrl?: string;
}

const deployStore = createStore<DeployState>({ status: "idle" });
export const subscribeDeploy = deployStore.subscribe;
export const getDeploy = deployStore.get;
export const setDeploy = deployStore.set;

// ---------------------------------------------------------------------------
// Last CMS commit (for Undo)
// ---------------------------------------------------------------------------

export interface CommitRecord {
  sha: string;
  message: string;
}

const LAST_COMMIT_KEY = "admin_last_commit";

function loadLastCommit(): CommitRecord | null {
  if (!isBrowser) return null;
  try {
    const raw = readStorage(LAST_COMMIT_KEY);
    return raw ? (JSON.parse(raw) as CommitRecord) : null;
  } catch {
    return null;
  }
}

const lastCommitStore = createStore<CommitRecord | null>(loadLastCommit());

export const subscribeLastCommit = lastCommitStore.subscribe;
export const getLastCommit = lastCommitStore.get;

export function setLastCommit(record: CommitRecord | null) {
  writeStorage(LAST_COMMIT_KEY, record ? JSON.stringify(record) : null);
  lastCommitStore.set(record);
}
