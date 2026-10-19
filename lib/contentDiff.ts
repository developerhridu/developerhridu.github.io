/**
 * Human-readable differences between the live and pending version of a content JSON file,
 * for the "review before publishing" dialog.
 */

export interface FieldChange {
  /** Dotted field path, e.g. "title", "social.github", "photos[2]". */
  field: string;
  before: string | null;
  after: string | null;
}

export interface EntryChange {
  kind: "added" | "removed" | "changed";
  /** Display name of the entry (its title/name/label…). */
  label: string;
  fields: FieldChange[];
}

export interface FileDiff {
  /** Entries for array-of-records files (blogs.json…), or one pseudo-entry for object files (profile.json…). */
  entries: EntryChange[];
  /** True when only the order of entries changed. */
  reordered: boolean;
}

type Json = unknown;
const LABEL_KEYS = ["title", "name", "company", "label", "degree", "route", "text", "id", "slug"];
/** Bookkeeping fields that change on every save and aren't worth reviewing. */
const IGNORED_FIELDS = new Set(["updatedAt"]);

function isRecord(value: Json): value is Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function display(value: Json): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

/** Flattens nested objects/arrays to `path → primitive` so changes can be listed field by field. */
function flatten(value: Json, prefix = "", out = new Map<string, string>()): Map<string, string> {
  if (Array.isArray(value)) {
    if (value.length === 0 && prefix) out.set(prefix, "[]");
    value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, out));
  } else if (isRecord(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0 && prefix) out.set(prefix, "{}");
    for (const key of keys) {
      if (IGNORED_FIELDS.has(key)) continue;
      flatten(value[key], prefix ? `${prefix}.${key}` : key, out);
    }
  } else if (prefix) {
    out.set(prefix, value === null || value === undefined ? "" : display(value));
  }
  return out;
}

export function diffFields(before: Json, after: Json): FieldChange[] {
  const a = flatten(before);
  const b = flatten(after);
  const keys = [...new Set([...a.keys(), ...b.keys()])];
  return keys
    .filter((key) => a.get(key) !== b.get(key))
    .map((key) => ({ field: key, before: a.get(key) ?? null, after: b.get(key) ?? null }));
}

function entryKey(entry: Json, index: number): string {
  if (isRecord(entry)) {
    for (const key of ["id", "slug"]) if (typeof entry[key] === "string" && entry[key]) return `${key}:${entry[key]}`;
  }
  return `index:${index}`;
}

function entryLabel(entry: Json): string {
  if (isRecord(entry)) {
    for (const key of LABEL_KEYS) if (typeof entry[key] === "string" && entry[key]) return entry[key] as string;
  }
  return "Entry";
}

/** The single top-level array of records, when the file is shaped like `{ "posts": [...] }`. */
function recordArray(doc: Json): Json[] | null {
  if (!isRecord(doc)) return null;
  const keys = Object.keys(doc);
  if (keys.length !== 1 || !Array.isArray(doc[keys[0]])) return null;
  return doc[keys[0]] as Json[];
}

export function diffContent(beforeText: string | null, afterText: string): FileDiff {
  const before: Json = beforeText ? JSON.parse(beforeText) : {};
  const after: Json = JSON.parse(afterText);

  const beforeList = recordArray(before) ?? (beforeText ? null : []);
  const afterList = recordArray(after);
  if (!afterList || !beforeList) {
    const fields = diffFields(before, after);
    return { entries: fields.length ? [{ kind: "changed", label: "Settings", fields }] : [], reordered: false };
  }

  const beforeByKey = new Map(beforeList.map((entry, index) => [entryKey(entry, index), entry]));
  const afterKeys = afterList.map((entry, index) => entryKey(entry, index));
  const entries: EntryChange[] = [];

  afterList.forEach((entry, index) => {
    const previous = beforeByKey.get(afterKeys[index]);
    if (previous === undefined) {
      entries.push({ kind: "added", label: entryLabel(entry), fields: diffFields({}, entry) });
      return;
    }
    const fields = diffFields(previous, entry);
    if (fields.length) entries.push({ kind: "changed", label: entryLabel(entry), fields });
  });
  const afterKeySet = new Set(afterKeys);
  for (const [key, entry] of beforeByKey) {
    if (!afterKeySet.has(key)) entries.push({ kind: "removed", label: entryLabel(entry), fields: [] });
  }

  const sharedBefore = [...beforeByKey.keys()].filter((key) => afterKeySet.has(key));
  const sharedAfter = afterKeys.filter((key) => beforeByKey.has(key));
  const reordered = sharedBefore.join("|") !== sharedAfter.join("|");
  return { entries, reordered };
}
