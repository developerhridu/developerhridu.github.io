// Pre-builds the resized WebP copies that lib/imageLoader.ts points <Image> srcsets at.
// GitHub Pages can't resize on the fly, so every raster image under public/images gets a
// copy per width in public/_img/<width>/<path>.webp. Incremental: images whose content hash
// matches the manifest (and whose copies exist) are skipped — hashes, not mtimes, because CI
// checkouts give every file a fresh timestamp.
import { createHash } from "node:crypto";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { IMAGE_WIDTHS } from "../lib/imageWidths.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const sourceDir = path.join(root, "public", "images");
const outDir = path.join(root, "public", "_img");
const RASTER = /\.(png|jpe?g|webp|avif)$/i;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => (entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))
  );
  return files.flat();
}

const exists = (file) => access(file).then(() => true, () => false);
const manifestPath = path.join(outDir, "manifest.json");
const settings = `${IMAGE_WIDTHS.join(",")}|q75`;

let manifest = {};
try {
  const saved = JSON.parse(await readFile(manifestPath, "utf8"));
  if (saved.settings === settings) manifest = saved.files ?? {};
} catch {
  // First run (or settings changed): build everything.
}

const sources = (await walk(sourceDir)).filter((file) => RASTER.test(file));
const nextManifest = {};
let written = 0;
let skipped = 0;
const failures = [];

// Small batches keep memory flat on CI runners.
for (let i = 0; i < sources.length; i += 6) {
  await Promise.all(
    sources.slice(i, i + 6).map(async (source) => {
      const relative = path.relative(sourceDir, source).split(path.sep).join("/");
      const buffer = await readFile(source);
      const hash = createHash("sha1").update(buffer).digest("hex");
      const outputs = IMAGE_WIDTHS.map((width) => ({ width, file: path.join(outDir, String(width), `${relative}.webp`) }));
      if (manifest[relative] === hash && (await Promise.all(outputs.map(({ file }) => exists(file)))).every(Boolean)) {
        nextManifest[relative] = hash;
        skipped++;
        return;
      }
      try {
        for (const { width, file } of outputs) {
          await mkdir(path.dirname(file), { recursive: true });
          await sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 75 }).toFile(file);
          written++;
        }
        nextManifest[relative] = hash;
      } catch (err) {
        failures.push(`${relative}: ${err.message}`);
      }
    })
  );
}

await mkdir(outDir, { recursive: true });
await writeFile(manifestPath, JSON.stringify({ settings, files: nextManifest }, null, 2));
console.log(`responsive images: ${sources.length} sources, ${written} files written, ${skipped} sources up to date`);
if (failures.length) {
  console.error(`responsive images: ${failures.length} failed\n  ${failures.join("\n  ")}`);
  process.exitCode = 1;
}
