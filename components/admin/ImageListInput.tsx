"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, Upload, X } from "lucide-react";
import { inputClass } from "@/components/admin/shared";

export interface ImageListInputProps {
  images: string[];
  pending: File[];
  placeholder?: string;
  onChange: (images: string[]) => void;
  onPendingChange: (files: File[]) => void;
}

/** Thumbnail grid for a list of image paths: reorder, remove, add by URL or upload/drop files. */
export default function ImageListInput({ images, pending, placeholder, onChange, onPendingChange }: ImageListInputProps) {
  const [urlDraft, setUrlDraft] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addFiles(files: FileList | null) {
    const imagesOnly = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (imagesOnly.length > 0) onPendingChange([...pending, ...imagesOnly]);
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!url || images.includes(url)) return;
    onChange([...images, url]);
    setUrlDraft("");
  }

  const tile = "relative group/tile aspect-square rounded-lg border bg-white overflow-hidden";

  return (
    <div className="space-y-3">
      {(images.length > 0 || pending.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {images.map((src, index) => (
            <div key={src} className={`${tile} border-border`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-contain p-1" />
              {index === 0 && (
                <span className="absolute top-1 left-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  Cover
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 p-1 opacity-0 group-hover/tile:opacity-100 focus-within:opacity-100 transition-opacity">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move left" className="p-1 text-white disabled:opacity-30">
                  <ArrowUp size={14} className="-rotate-90" />
                </button>
                <button type="button" onClick={() => onChange(images.filter((_, i) => i !== index))} aria-label="Remove image" className="p-1 text-red-300 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label="Move right" className="p-1 text-white disabled:opacity-30">
                  <ArrowDown size={14} className="-rotate-90" />
                </button>
              </div>
            </div>
          ))}
          {pending.map((file, index) => (
            <div key={`${file.name}-${index}`} className={`${tile} border-dashed border-accent`}>
              <FilePreview file={file} />
              <span className="absolute top-1 left-1 rounded bg-yellow-500 px-1.5 py-0.5 text-[10px] font-semibold text-black">
                New
              </span>
              <button
                type="button"
                onClick={() => onPendingChange(pending.filter((_, i) => i !== index))}
                aria-label={`Remove ${file.name}`}
                className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-red-500"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-colors ${
          dragOver ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
        }`}
      >
        <Upload size={20} className="text-muted" />
        <span className="text-sm text-foreground">Drop images here or click to upload</span>
        <span className="text-xs text-muted">Multiple files allowed · first image is the cover · uploads on Save</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </label>

      <div className="flex gap-2">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder={placeholder ?? "/images/... or https://..."}
          className={inputClass}
        />
        <button
          type="button"
          onClick={addUrl}
          className="flex items-center gap-1 px-3 border border-border rounded-lg text-sm text-muted hover:text-foreground hover:border-accent/40 whitespace-nowrap"
        >
          <Plus size={14} /> Add URL
        </button>
      </div>
    </div>
  );
}

function FilePreview({ file }: { file: File }) {
  const src = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(src), [src]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="w-full h-full object-contain p-1 opacity-80" />;
}
