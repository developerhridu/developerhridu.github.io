import type { NextConfig } from "next";
import path from "path";
import { DEVICE_SIZES, IMAGE_SIZES } from "./lib/imageWidths.mjs";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    // Static export can't resize on request; lib/imageLoader.ts serves the copies that
    // scripts/generate-responsive-images.mjs pre-builds at exactly these widths.
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
    deviceSizes: DEVICE_SIZES,
    imageSizes: IMAGE_SIZES,
  },
  devIndicators: false,
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
