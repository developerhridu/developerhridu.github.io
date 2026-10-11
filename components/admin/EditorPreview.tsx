"use client";

import { useEffect, useMemo, useState } from "react";
import ArticleDetail, { type ArticleDetailProps } from "@/components/ui/ArticleDetail";
import ProjectLinks from "@/components/ui/ProjectLinks";
import WorkDone, { pickBySlugs } from "@/components/ui/WorkDone";
import projectsData from "@/content/projects.json";
import caseStudiesData from "@/content/case-studies.json";
import type { Project } from "@/types";

interface EditorPreviewProps {
  kind: ArticleDetailProps["kind"];
  entry: ArticleDetailProps["entry"] & Partial<Pick<Project, "liveUrl" | "githubUrl">> & {
    /** Client work-done slugs. */
    projects?: string[];
    caseStudies?: string[];
  };
  imageFile: File | null;
  sectionImageFiles: (File | null)[][];
  photoFiles: (File | null)[];
  titleImageFiles: (File | null)[];
  inlineImageUrls: Record<string, string>;
}

export default function EditorPreview({ kind, entry, imageFile, sectionImageFiles, photoFiles, titleImageFiles, inlineImageUrls }: EditorPreviewProps) {
  const files = useMemo(
    () => [...new Set([imageFile, ...titleImageFiles, ...sectionImageFiles.flat(), ...photoFiles].filter((file): file is File => file !== null))],
    [imageFile, titleImageFiles, sectionImageFiles, photoFiles]
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
    titleImages: (entry.titleImages ?? []).map((image, index) => titleImageFiles[index] ? imageUrls.get(titleImageFiles[index]!) ?? "" : image).filter((image) => image.trim()),
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
      {kind === "client" && (
        <WorkDone
          projects={pickBySlugs(projectsData.projects, entry.projects)}
          caseStudies={pickBySlugs(caseStudiesData.caseStudies, entry.caseStudies)}
        />
      )}
    </ArticleDetail>
  );
}
