import type { BulkAction } from "@/components/admin/EntryList";

/**
 * The standard Publish / Unpublish / Delete bulk actions. Each callback receives the ticked
 * entries and should make one save for all of them.
 */
export function standardBulkActions<T>({
  noun,
  onSetPublished,
  onDelete,
}: {
  /** Plural, lowercase: "certifications", "posts"… */
  noun: string;
  /** Omit for content without a published flag. */
  onSetPublished?: (items: T[], published: boolean) => Promise<unknown>;
  onDelete: (items: T[]) => Promise<unknown>;
}): BulkAction<T>[] {
  const actions: BulkAction<T>[] = [];
  if (onSetPublished) {
    actions.push(
      { label: "Publish", run: (items) => onSetPublished(items, true) },
      { label: "Unpublish (draft)", run: (items) => onSetPublished(items, false) }
    );
  }
  actions.push({
    label: "Delete",
    tone: "danger",
    run: (items) => {
      if (!window.confirm(`Delete ${items.length} ${items.length === 1 ? "entry" : noun}? This can't be undone once published.`)) return;
      return onDelete(items);
    },
  });
  return actions;
}

export function bulkMessage(verb: "publish" | "unpublish" | "delete", count: number, noun: string): string {
  return `content: ${verb} ${count} ${count === 1 ? noun.replace(/s$/, "") : noun}`;
}
