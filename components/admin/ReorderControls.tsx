"use client";

interface ReorderControlsProps {
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function ReorderControls({ saving, onSave, onDiscard }: ReorderControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Order changed</span>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save order"}
      </button>
      <button
        onClick={onDiscard}
        disabled={saving}
        className="px-3 py-1.5 border border-border text-muted hover:text-foreground rounded-lg text-xs transition-colors"
      >
        Discard
      </button>
    </div>
  );
}
