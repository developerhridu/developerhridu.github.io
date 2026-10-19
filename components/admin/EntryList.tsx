"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Eye, GripVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { inputClass } from "@/components/admin/shared";
import { ReorderControls } from "@/components/admin/ReorderControls";
import { stagedImageSrc } from "@/lib/adminStore";

export interface EntryListProps<T> {
  items: T[] | null;
  loading: boolean;
  getKey: (item: T) => string;
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => ReactNode;
  getThumbnail?: (item: T) => string | undefined;
  isDraft?: (item: T) => boolean;
  /** Extra text the search box matches, beyond title and subtitle. */
  getSearchText?: (item: T) => string;
  /** Page on the live site to open from the row. */
  getViewUrl?: (item: T) => string | null;
  /** Manual order: drag rows or use the arrows (disabled while searching). */
  onMove?: (from: number, to: number) => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onPreview?: (item: T) => void;
  newLabel?: string;
  onNew: () => void;
  toolbar?: ReactNode;
  orderDirty?: boolean;
  saving?: boolean;
  onSaveOrder?: () => void;
  onDiscardOrder?: () => void;
  titleHeading?: string;
  /** Actions for several ticked rows at once (publish, unpublish, delete…). */
  bulkActions?: BulkAction<T>[];
}

export interface BulkAction<T> {
  label: string;
  tone?: "danger";
  run: (items: T[]) => void | Promise<unknown>;
}

/** The list half of every admin editor, so they all search, sort and act the same way. */
export default function EntryList<T>({
  items,
  loading,
  getKey,
  getTitle,
  getSubtitle,
  getThumbnail,
  isDraft,
  getSearchText,
  getViewUrl,
  onMove,
  onEdit,
  onDelete,
  onPreview,
  newLabel = "New Entry",
  onNew,
  toolbar,
  orderDirty = false,
  saving = false,
  onSaveOrder,
  onDiscardOrder,
  titleHeading = "Title",
  bulkActions,
}: EntryListProps<T>) {
  const [query, setQuery] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const all = items ?? [];
  const needle = query.trim().toLowerCase();
  const rows = all
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (!needle) return true;
      const subtitle = getSubtitle?.(item);
      const haystack = [getTitle(item), typeof subtitle === "string" ? subtitle : "", getSearchText?.(item) ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  const canReorder = !!onMove && !needle;
  const canSelect = !!bulkActions?.length;
  // Ticked rows that still exist (entries can disappear after a delete or reload).
  const selectedItems = all.filter((item) => selected.has(getKey(item)));
  const visibleKeys = rows.map(({ item }) => getKey(item));
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selected.has(key));

  function toggle(key: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((previous) => {
      const next = new Set(previous);
      visibleKeys.forEach((key) => (allVisibleSelected ? next.delete(key) : next.add(key)));
      return next;
    });
  }

  async function runBulk(action: BulkAction<T>) {
    await action.run(selectedItems);
    setSelected(new Set());
  }

  function drop(target: number) {
    if (dragIndex !== null && onMove) onMove(dragIndex, target);
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          {newLabel}
        </button>
        {toolbar}
        {all.length > 3 && (
          <div className="relative ml-auto w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${all.length} entries…`}
              aria-label="Search entries"
              className={`${inputClass} py-2 pl-8 text-sm`}
            />
          </div>
        )}
        {orderDirty && onSaveOrder && onDiscardOrder && (
          <ReorderControls saving={saving} onSave={onSaveOrder} onDiscard={onDiscardOrder} />
        )}
      </div>

      {canSelect && selectedItems.length > 0 && (
        <div role="toolbar" aria-label="Bulk actions" className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm">
          <span className="font-medium text-foreground">{selectedItems.length} selected</span>
          {bulkActions!.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={saving}
              onClick={() => void runBulk(action)}
              className={`rounded-lg border px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                action.tone === "danger"
                  ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                  : "border-border bg-surface text-foreground hover:border-accent/40"
              }`}
            >
              {action.label}
            </button>
          ))}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted hover:text-foreground">
            Clear selection
          </button>
        </div>
      )}

      {loading && <p className="text-muted text-sm">Loading…</p>}
      {!loading && items && items.length === 0 && <p className="text-muted text-sm">No entries yet.</p>}
      {!loading && items && items.length > 0 && rows.length === 0 && (
        <p className="text-muted text-sm">Nothing matches “{query}”.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                {canSelect && (
                  <th className="w-10 pl-4">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label={allVisibleSelected ? "Unselect all shown entries" : "Select all shown entries"}
                      className="h-4 w-4 accent-accent"
                    />
                  </th>
                )}
                {canReorder && <th className="w-8" aria-label="Drag to reorder" />}
                <th className="text-left font-medium text-muted px-4 py-3">{titleHeading}</th>
                <th className="text-right font-medium text-muted px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ item, index }) => {
                const title = getTitle(item) || "Untitled";
                const thumbnail = getThumbnail?.(item);
                const viewUrl = getViewUrl?.(item);
                return (
                  <tr
                    key={getKey(item)}
                    draggable={canReorder}
                    onDragStart={(e) => {
                      setDragIndex(index);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      if (dragIndex === null) return;
                      e.preventDefault();
                      setOverIndex(index);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      drop(index);
                    }}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    className={`border-b border-border last:border-b-0 transition-colors ${
                      dragIndex === index ? "opacity-40" : ""
                    } ${overIndex === index && dragIndex !== index ? "bg-accent/10" : ""} ${selected.has(getKey(item)) ? "bg-accent/5" : ""}`}
                  >
                    {canSelect && (
                      <td className="w-10 pl-4">
                        <input
                          type="checkbox"
                          checked={selected.has(getKey(item))}
                          onChange={() => toggle(getKey(item))}
                          aria-label={`Select ${title}`}
                          className="h-4 w-4 accent-accent"
                        />
                      </td>
                    )}
                    {canReorder && (
                      <td className="pl-3 text-muted cursor-grab active:cursor-grabbing" title="Drag to reorder">
                        <GripVertical size={16} />
                      </td>
                    )}
                    <td className="px-4 py-3 min-w-0">
                      <div className="flex items-center gap-3">
                        {getThumbnail && (
                          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-white">
                            {thumbnail && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={stagedImageSrc(thumbnail)} alt="" loading="lazy" className="h-full w-full object-contain p-0.5" />
                            )}
                          </span>
                        )}
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="flex max-w-full items-center gap-2 text-left font-medium text-foreground hover:text-accent"
                          >
                            <span className="truncate">{title}</span>
                            {isDraft?.(item) && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                                Draft
                              </span>
                            )}
                          </button>
                          {getSubtitle && <p className="truncate text-xs text-muted">{getSubtitle(item)}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canReorder && (
                          <>
                            <IconButton onClick={() => onMove?.(index, index - 1)} disabled={saving || index === 0} aria-label={`Move ${title} up`}>
                              <ArrowUp size={16} />
                            </IconButton>
                            <IconButton onClick={() => onMove?.(index, index + 1)} disabled={saving || index === all.length - 1} aria-label={`Move ${title} down`}>
                              <ArrowDown size={16} />
                            </IconButton>
                          </>
                        )}
                        {viewUrl && (
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${title} on the site`}
                            title="Open on site"
                            className="p-2 text-muted hover:text-foreground transition-colors"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        {onPreview && (
                          <IconButton onClick={() => onPreview(item)} aria-label={`Preview ${title}`}>
                            <Eye size={16} />
                          </IconButton>
                        )}
                        <IconButton onClick={() => onEdit(item)} aria-label={`Edit ${title}`}>
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton onClick={() => onDelete(item)} tone="danger" aria-label={`Delete ${title}`}>
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {onMove && needle && rows.length > 0 && (
        <p className="mt-2 text-xs text-muted">Clear the search to reorder.</p>
      )}
    </div>
  );
}
