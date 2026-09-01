export const TOKEN_KEY = "gh_pat";

export const REPO_ACTIONS_URL = "https://github.com/developerhridu/developerhridu.github.io/actions";

export const SAVED_AND_COMMITTED_MESSAGE =
  "Saved and committed. The site will redeploy automatically — check the Actions tab in a minute or two.";

export function confirmDeleteMessage(label: string): string {
  return `Delete "${label}"? This cannot be undone.`;
}

export const inputClass =
  "w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
