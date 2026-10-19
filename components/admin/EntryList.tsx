"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Copy, ExternalLink, Eye, GripVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  onDuplicate?: (item: T) => void;
  onPreview?: (item: T) => void;
  newLabel?: string;
  onNew: () => void;
  toolbar?: ReactNode;
  orderDirty?: boolean;
  saving?: boolean;
  onSaveOrder?: () => void;
  onDiscardOrder?: () => void;
  titleHeading?: string;
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
  onDuplicate,
  onPreview,
  newLabel = "New Entry",
  onNew,
  toolbar,
  orderDirty = false,
  saving = false,
  onSaveOrder,
  onDiscardOrder,
  titleHeading = "Title",
}: EntryListProps<T>) {
  const [query, setQuery] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

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
                    } ${overIndex === index && dragIndex !== index ? "bg-accent/10" : ""}`}
                  >
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
                        {onDuplicate && (
                          <IconButton onClick={() => onDuplicate(item)} aria-label={`Duplicate ${title}`}>
                            <Copy size={16} />
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
