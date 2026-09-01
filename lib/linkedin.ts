/** Pulls the numeric activity id out of a plain LinkedIn post URL (share link or embed URN). */
export function extractLinkedInActivityId(url: string): string | null {
  const match = url.match(/activity[:-](\d{15,21})/i);
  return match ? match[1] : null;
}

export interface ParsedLinkedInPost {
  title: string;
  tags: string[];
  description: string;
  body: string;
}

const HASHTAG_LINE = /^(#[\w-]+\s*)+$/;

/**
 * Splits a pasted LinkedIn post into blog-post fields: trailing hashtag-only lines
 * become tags (and are stripped from the body so they don't repeat as visible text),
 * the first remaining line becomes the title, and a short lead becomes the description.
 */
export function parseLinkedInPostText(rawText: string): ParsedLinkedInPost {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();

  const hashtagLines: string[] = [];
  while (lines.length > 0 && HASHTAG_LINE.test(lines[lines.length - 1].trim())) {
    hashtagLines.unshift(lines.pop()!.trim());
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();

  const tags: string[] = [];
  for (const line of hashtagLines) {
    for (const token of line.split(/\s+/)) {
      const tag = token.replace(/^#/, "").toLowerCase();
      if (tag && !tags.includes(tag)) tags.push(tag);
    }
  }

  const body = lines.join("\n").trim();
  const firstLine = lines.find((l) => l.trim() !== "")?.trim() ?? "Untitled LinkedIn Post";
  const title = firstLine.length > 100 ? `${firstLine.slice(0, 97).trimEnd()}…` : firstLine;

  const flatText = body.replace(/\s+/g, " ").trim();
  const description = flatText.length > 160 ? `${flatText.slice(0, 157).trimEnd()}…` : flatText;

  return { title, tags, description, body };
}

/** Composes the blog-post markdown body: the live embed up top, the written post below. */
export function buildLinkedInEmbedBody(url: string, postBody: string): string {
  return `\`\`\`linkedin\n${url}\n\`\`\`\n\n${postBody}`;
}
