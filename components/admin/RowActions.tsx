"use client";

import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface RowActionsProps {
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RowActions({
  label,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={onMoveUp}
        disabled={!canMoveUp}
        aria-label={`Move ${label} up`}
        className="p-2 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
      >
        <ArrowUp size={16} />
      </button>
      <button
        onClick={onMoveDown}
        disabled={!canMoveDown}
        aria-label={`Move ${label} down`}
        className="p-2 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted"
      >
        <ArrowDown size={16} />
      </button>
      <button
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        className="p-2 text-muted hover:text-foreground transition-colors"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={onDelete}
        aria-label={`Delete ${label}`}
        className="p-2 text-muted hover:text-red-400 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
