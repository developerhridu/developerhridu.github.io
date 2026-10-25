import { getPublishMode } from "@/lib/adminStore";

export const TOKEN_KEY = "gh_pat";
export const TOKEN_CHANGED_EVENT = "github-token-changed";

export const REPO_ACTIONS_URL = "https://github.com/developerhridu/developerhridu.github.io/actions";

export const SAVED_AND_COMMITTED_MESSAGE =
  "Saved and published. The site is redeploying — watch the status bar above.";

export const SAVED_TO_PENDING_MESSAGE =
  "Saved to pending changes. Keep editing, then click Publish in the bar above to put everything live in one deploy.";

/** Success text for the save that just finished, matching the current publish mode. */
export function savedMessage(): string {
  return getPublishMode() === "batch" ? SAVED_TO_PENDING_MESSAGE : SAVED_AND_COMMITTED_MESSAGE;
}

export function confirmDeleteMessage(label: string): string {
  return `Delete "${label}"? This cannot be undone.`;
}

export const inputClass =
  // text-base (16px) is deliberate: iOS Safari zooms the viewport whenever a focused field
  // is smaller than that, which made every tap in the admin jump the layout.
  "w-full px-4 py-3 text-base bg-surface border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Moves `list[from]` to position `to`, returning a new array. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const MAX_IMAGE_EDGE = 1600;
const SKIP_BELOW_BYTES = 250 * 1024;

/**
 * Shrinks a photo before it's committed: longest edge capped at 1600px and re-encoded as
 * WebP. SVG/GIF (vector/animated) and already-small images are returned unchanged, and so
 * is anything the browser can't decode or that wouldn't get smaller.
 */
export async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || /svg|gif/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < SKIP_BELOW_BYTES) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}

/** Git's blob sha (sha1 of "blob <size>\0" + bytes) — matches the shas GitHub reports for repo files. */
export async function gitBlobSha(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = new TextEncoder().encode(`blob ${bytes.length}\0`);
  const data = new Uint8Array(header.length + bytes.length);
  data.set(header);
  data.set(bytes, header.length);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
