"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, Upload, X } from "lucide-react";
import { inputClass } from "@/components/admin/shared";
import { stagedImageSrc } from "@/lib/adminStore";
import { MediaPickerButton, prepareImages, reusedNotice, useAdminToken } from "@/components/admin/MediaLibrary";

export interface ImageListInputProps {
  images: string[];
  pending: File[];
  placeholder?: string;
  onChange: (images: string[]) => void;
  onPendingChange: (files: File[]) => void;
}

/** Thumbnail grid for a list of image paths: reorder, remove, add by URL or upload/drop files. */
export default function ImageListInput({ images, pending, placeholder, onChange, onPendingChange }: ImageListInputProps) {
  const token = useAdminToken();
  const [urlDraft, setUrlDraft] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  async function addFiles(files: FileList | null) {
    const imagesOnly = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (imagesOnly.length === 0) return;
    setProcessing(true);
    setNotice(null);
    try {
      const prepared = await prepareImages(imagesOnly, token);
      const reused = prepared.flatMap((item) => (item.existing && !images.includes(item.existing) ? [item.existing] : []));
      const uploads = prepared.flatMap((item) => (item.file ? [item.file] : []));
      if (reused.length > 0) {
        onChange([...images, ...reused]);
        setNotice(reusedNotice(reused.length));
      }
      if (uploads.length > 0) onPendingChange([...pending, ...uploads]);
    } finally {
      setProcessing(false);
    }
  }

  function addPaths(paths: string[]) {
    const fresh = paths.filter((path) => !images.includes(path));
    if (fresh.length > 0) onChange([...images, ...fresh]);
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
              <img src={stagedImageSrc(src)} alt="" className="w-full h-full object-contain p-1" />
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
          void addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-colors ${
          dragOver ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
        }`}
      >
        <Upload size={20} className="text-muted" />
        <span className="text-sm text-foreground">
          {processing ? "Optimizing images…" : "Drop images here or click to upload"}
        </span>
        <span className="text-xs text-muted">
          Multiple files allowed · first image is the cover · resized &amp; converted to WebP · uploads on Save
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {notice && <p className="text-xs text-accent">{notice}</p>}

      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
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
        <MediaPickerButton multiple onPick={addPaths} className="py-2" />
      </div>
    </div>
  );
}

/**
 * One image (logo, avatar, icon): path field, upload (optimized + deduped), media-library
 * pick, and a thumbnail of whatever will be saved.
 */
export function SingleImageInput({
  id,
  value,
  file,
  placeholder,
  invalid = false,
  onChange,
  onFileChange,
}: {
  id?: string;
  value: string;
  file: File | null;
  placeholder?: string;
  invalid?: boolean;
  onChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
}) {
  const token = useAdminToken();
  const [notice, setNotice] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function pick(files: FileList | null) {
    const picked = files?.[0];
    if (!picked) return;
    setProcessing(true);
    setNotice(null);
    try {
      const [prepared] = await prepareImages([picked], token);
      if (prepared.existing) {
        onChange(prepared.existing);
        onFileChange(null);
        setNotice(reusedNotice(1));
      } else if (prepared.file) {
        onFileChange(prepared.file);
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex gap-3">
      <div className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-lg border border-border bg-white">
        {file ? (
          <FilePreview file={file} />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stagedImageSrc(value)} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <span className="flex h-full items-center justify-center text-[10px] text-gray-400">No image</span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <input
          id={id}
          value={file ? "" : value}
          disabled={!!file}
          onChange={(e) => onChange(e.target.value)}
          placeholder={file ? `Uploads ${file.name} on Save` : placeholder}
          className={`${inputClass} py-2 ${invalid ? "border-red-500/60" : ""}`}
        />
        <div className="flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:border-accent/40 hover:text-foreground">
            <Upload size={14} /> {processing ? "Optimizing…" : file ? "Replace upload" : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void pick(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <MediaPickerButton
            onPick={([path]) => {
              onFileChange(null);
              onChange(path);
            }}
            className="py-1.5"
          />
          {file && (
            <button type="button" onClick={() => onFileChange(null)} className="px-2 text-sm text-muted hover:text-red-400">
              Cancel upload
            </button>
          )}
        </div>
        {notice && <p className="text-xs text-accent">{notice}</p>}
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
