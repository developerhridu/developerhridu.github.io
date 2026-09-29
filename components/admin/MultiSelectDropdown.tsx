"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
  /** Rendered before the label in both the list and the chip — a logo, say. */
  icon?: ReactNode;
  /** Rendered after the label in the list only — a "draft" marker, say. */
  note?: ReactNode;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  emptyMessage: string;
  /** Clients are stored by display name, whose casing may drift from the source list. */
  caseInsensitive?: boolean;
}

export default function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder,
  emptyMessage,
  caseInsensitive = false,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const same = (a: string, b: string) =>
    caseInsensitive ? a.toLowerCase() === b.toLowerCase() : a === b;

  function toggle(value: string) {
    const isSelected = selected.some((s) => same(s, value));
    onChange(
      isSelected ? selected.filter((s) => !same(s, value)) : [...selected, value]
    );
  }

  if (options.length === 0) {
    return <p className="text-muted text-xs">{emptyMessage}</p>;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-background border border-border text-left text-sm text-foreground hover:border-accent/40 transition-colors"
      >
        <span className={selected.length === 0 ? "text-muted" : ""}>
          {selected.length === 0 ? placeholder : `${selected.length} selected`}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((value) => {
            const option = options.find((o) => same(o.value, value));
            return (
              <span
                key={value}
                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-accent/10 border border-accent/30 text-xs text-foreground"
              >
                {option?.icon}
                {option?.label ?? value}
                <button
                  type="button"
                  onClick={() => toggle(value)}
                  aria-label={`Remove ${option?.label ?? value}`}
                  className="text-muted hover:text-foreground"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {open && (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-border bg-surface shadow-xl p-1"
        >
          {options.map((option) => {
            const isSelected = selected.some((s) => same(s, option.value));
            return (
              <label
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`flex items-start gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                  isSelected ? "bg-accent/10 text-foreground" : "text-muted hover:bg-surface-hover"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(option.value)}
                  className="w-3.5 h-3.5 mt-0.5 shrink-0 accent-accent"
                />
                {option.icon}
                <span>
                  {option.label}
                  {option.note}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
