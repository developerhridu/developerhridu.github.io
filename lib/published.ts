/** Shared visibility convention: a missing `published` key counts as published. */
export function isPublished<T extends { published?: boolean }>(item: T): boolean {
  return item.published !== false;
}
