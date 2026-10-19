// Pre-builds the resized WebP copies that lib/imageLoader.ts points <Image> srcsets at.
// GitHub Pages can't resize on the fly, so every raster image under public/images gets a
// copy per width in public/_img/<width>/<path>.webp. Incremental: images whose content hash
// matches the manifest (and whose copies exist) are skipped — hashes, not mtimes, because CI
// checkouts give every file a fresh timestamp.
import { createHash } from "node:crypto";
import { access, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
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

// Drop copies whose source image was renamed, moved or deleted — otherwise they ship in out/
// and (via the CI cache) come back on every run.
const expected = new Set(sources.flatMap((source) => {
  const relative = path.relative(sourceDir, source).split(path.sep).join("/");
  return IMAGE_WIDTHS.map((width) => path.join(outDir, String(width), `${relative}.webp`));
}));
let pruned = 0;
for (const width of IMAGE_WIDTHS) {
  const widthDir = path.join(outDir, String(width));
  if (!(await exists(widthDir))) continue;
  for (const file of await walk(widthDir)) {
    if (!expected.has(file)) {
      await rm(file);
      pruned++;
    }
  }
  // Remove folders the deletions left empty (deepest first).
  const dirs = (await readdir(widthDir, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort((a, b) => b.length - a.length);
  for (const dir of dirs) if ((await readdir(dir)).length === 0) await rm(dir, { recursive: true });
}

await mkdir(outDir, { recursive: true });
await writeFile(manifestPath, JSON.stringify({ settings, files: nextManifest }, null, 2));
console.log(`responsive images: ${sources.length} sources, ${written} files written, ${skipped} sources up to date${pruned ? `, ${pruned} stale files pruned` : ""}`);
if (failures.length) {
  console.error(`responsive images: ${failures.length} failed\n  ${failures.join("\n  ")}`);
  process.exitCode = 1;
}
