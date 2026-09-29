"use client";

import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import IconButton from "@/components/ui/IconButton";

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
      <IconButton onClick={onMoveUp} disabled={!canMoveUp} aria-label={`Move ${label} up`}>
        <ArrowUp size={16} />
      </IconButton>
      <IconButton onClick={onMoveDown} disabled={!canMoveDown} aria-label={`Move ${label} down`}>
        <ArrowDown size={16} />
      </IconButton>
      <IconButton onClick={onEdit} aria-label={`Edit ${label}`}>
        <Pencil size={16} />
      </IconButton>
      <IconButton onClick={onDelete} tone="danger" aria-label={`Delete ${label}`}>
        <Trash2 size={16} />
      </IconButton>
    </div>
  );
}
