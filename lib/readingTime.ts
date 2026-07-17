export function estimateReadingTime(...texts: string[]): number {
  const wordCount = texts
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}
