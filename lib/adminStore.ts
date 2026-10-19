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

export interface PendingSave {
  /** Commit-style message, e.g. "content: update SQL (Advanced)". */
  message: string;
  /** Files this save touched — used to discard one group of changes. */
  paths: string[];
}

export interface PendingState {
  files: StagedFile[];
  /** One entry per save, in order — the messages become the publish commit message. */
  saves: PendingSave[];
}

const EMPTY: PendingState = { files: [], saves: [] };
const pendingStore = createStore<PendingState>(EMPTY);

export const subscribePending = pendingStore.subscribe;
export const getPending = pendingStore.get;

function setPending(next: PendingState) {
  pendingStore.set(next);
  schedulePersist(next);
}

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
      // Unique across sessions, since the queue survives reloads.
      stagedSha: `staged-${crypto.randomUUID()}`,
    };
    if (index >= 0) files[index] = next;
    else files.push(next);
  }
  const save: PendingSave = { message, paths: changes.map((change) => change.path) };
  setPending({ files, saves: [...pendingStore.get().saves, save] });
}

export function clearPending() {
  setPending(EMPTY);
}

export interface PendingGroup {
  /** The content file the saves were about (or the first file touched). */
  path: string;
  saves: PendingSave[];
}

function primaryPath(save: PendingSave): string {
  return save.paths.find((path) => path.startsWith("content/")) ?? save.paths[0] ?? "";
}

/** Pending saves bucketed by the content file they changed, for per-group discard. */
export function pendingGroups(state: PendingState = pendingStore.get()): PendingGroup[] {
  const groups = new Map<string, PendingSave[]>();
  for (const save of state.saves) {
    const key = primaryPath(save);
    groups.set(key, [...(groups.get(key) ?? []), save]);
  }
  return [...groups].map(([path, saves]) => ({ path, saves }));
}

/**
 * Drops every save that touched `path` (later saves of a JSON file build on earlier ones,
 * so they go together) and any staged file only those saves touched — e.g. their uploads.
 */
export function discardPendingGroup(path: string) {
  const { files, saves } = pendingStore.get();
  const kept = saves.filter((save) => !save.paths.includes(path));
  const stillTouched = new Set(kept.flatMap((save) => save.paths));
  setPending({ files: files.filter((file) => stillTouched.has(file.path)), saves: kept });
}

// ---------------------------------------------------------------------------
// Persistence — the queue is saved to IndexedDB so a reload or crash doesn't lose it.
// ---------------------------------------------------------------------------

const DB_NAME = "admin-cms";
const DB_STORE = "kv";
const PENDING_KEY = "pending";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idb<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const request = run(db.transaction(DB_STORE, mode).objectStore(DB_STORE));
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

let persistTimer: ReturnType<typeof setTimeout> | undefined;

function schedulePersist(state: PendingState) {
  if (typeof indexedDB === "undefined") return;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const write = state.files.length === 0
      ? idb("readwrite", (store) => store.delete(PENDING_KEY))
      : idb("readwrite", (store) => store.put(state, PENDING_KEY));
    write.catch(() => {
      // Storage blocked or full — the queue still works for this tab; the reload warning covers the rest.
    });
  }, 250);
}

/** Restores the queue saved by an earlier session. Resolves to the number of restored saves. */
export async function restorePending(): Promise<number> {
  if (typeof indexedDB === "undefined" || pendingStore.get().files.length > 0) return 0;
  try {
    const saved = await idb<PendingState | undefined>("readonly", (store) => store.get(PENDING_KEY));
    if (!saved?.files?.length) return 0;
    pendingStore.set({ files: saved.files, saves: saved.saves ?? [] });
    return saved.saves?.length ?? saved.files.length;
  } catch {
    return 0;
  }
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
