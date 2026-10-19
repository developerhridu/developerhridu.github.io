// Shared by next.config.ts, lib/imageLoader.ts and scripts/generate-responsive-images.mjs,
// so the widths <Image> asks for are exactly the widths that get generated.
export const IMAGE_SIZES = [96, 256];
export const DEVICE_SIZES = [640, 1080, 1920];
export const IMAGE_WIDTHS = [...IMAGE_SIZES, ...DEVICE_SIZES];
