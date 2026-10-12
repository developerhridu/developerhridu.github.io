export interface CoverImageSource {
  coverImages?: string[];
  /** Read older content until it is saved with coverImages. */
  image?: string;
  titleImages?: string[];
}

export function coverImages(entry: CoverImageSource): string[] {
  const images = entry.coverImages ?? [entry.image, ...(entry.titleImages ?? [])];
  return images.filter((image): image is string => !!image?.trim());
}

export function primaryCoverImage(entry: CoverImageSource): string | undefined {
  return coverImages(entry)[0];
}
