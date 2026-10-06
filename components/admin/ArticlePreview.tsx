"use client";

import { useEffect, useMemo, useState } from "react";
import ArticleDetail, { type ArticleDetailProps } from "@/components/ui/ArticleDetail";
import ProjectLinks from "@/components/ui/ProjectLinks";
import type { Project } from "@/types";

interface ArticlePreviewProps {
  kind: ArticleDetailProps["kind"];
  entry: ArticleDetailProps["entry"] & Partial<Pick<Project, "liveUrl" | "githubUrl">>;
  imageFile: File | null;
  sectionImageFiles: (File | null)[][];
  photoFiles: (File | null)[];
  inlineImageUrls: Record<string, string>;
}

export default function ArticlePreview({ kind, entry, imageFile, sectionImageFiles, photoFiles, inlineImageUrls }: ArticlePreviewProps) {
  const files = useMemo(
    () => [...new Set([imageFile, ...sectionImageFiles.flat(), ...photoFiles].filter((file): file is File => file !== null))],
    [imageFile, sectionImageFiles, photoFiles]
  );
  const [imageUrls, setImageUrls] = useState<Map<File, string>>(new Map());

  useEffect(() => {
    const urls = new Map(files.map((file) => [file, URL.createObjectURL(file)]));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Local file URLs are created and released with the preview lifecycle.
    setImageUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  if (files.some((file) => !imageUrls.has(file))) {
    return <p role="status" className="text-sm text-muted p-6">Preparing images...</p>;
  }

  const previewEntry = {
    ...entry,
    image: imageFile ? imageUrls.get(imageFile) : entry.image,
    sections: (entry.sections ?? []).map((section, index) => ({
      ...section,
      images: (section.images ?? []).map((image, imageIndex) => {
        const file = sectionImageFiles[index]?.[imageIndex];
        return file ? imageUrls.get(file) ?? "" : image;
      }).filter((image) => image.trim()),
    })).filter((section) => section.body.trim() || section.images.length > 0),
    photos: (entry.photos ?? []).map((photo, index) => photoFiles[index] ? imageUrls.get(photoFiles[index]!) ?? "" : photo).filter((photo) => photo.trim()),
  };

  return (
    <ArticleDetail kind={kind} entry={previewEntry} preview previewImageUrls={inlineImageUrls}>
      {kind === "project" && (
        <ProjectLinks liveUrl={entry.liveUrl} githubUrl={entry.githubUrl} className="mt-12" />
      )}
    </ArticleDetail>
  );
}
