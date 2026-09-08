/**
 * Generates components/ui/icons/techBrandPaths.ts from the `simple-icons` dev dependency.
 *
 * simple-icons is ~25MB, so it is never imported at runtime — only the handful of brand
 * paths listed below are inlined into the generated file, keeping the client bundle small.
 *
 * To add a brand: add its slug here, run `node scripts/generate-tech-icons.mjs`, then map
 * the skill name to the slug in components/ui/icons/TechIcon.tsx.
 */
import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const si = require("simple-icons");
// simple-icons does not expose ./package.json via "exports", so read it off disk.
const { version } = JSON.parse(readFileSync("node_modules/simple-icons/package.json", "utf8"));

const SLUGS = [
  "dotnet",
  "rabbitmq",
  "apachekafka",
  "redis",
  "angular",
  "typescript",
  "javascript",
  "react",
  "html5",
  "bootstrap",
  "postgresql",
  "mongodb",
  "docker",
  "git",
  "github",
  "githubactions",
  "gitlab",
  "elasticsearch",
  "jasmine",
  "postman",
  "apachejmeter",
  "k6",
];

const entries = [];
const missing = [];

for (const slug of SLUGS) {
  const icon = si["si" + slug.charAt(0).toUpperCase() + slug.slice(1)];
  if (!icon) {
    missing.push(slug);
    continue;
  }
  entries.push([slug, icon]);
}

if (missing.length > 0) {
  console.error(`Unknown simple-icons slug(s): ${missing.join(", ")}`);
  process.exit(1);
}

const body = entries
  .map(([slug, icon]) => `  ${slug}: { title: ${JSON.stringify(icon.title)}, path: ${JSON.stringify(icon.path)} },`)
  .join("\n");

const out = `// AUTO-GENERATED — do not edit by hand.
// Source: simple-icons v${version} (icon paths are CC0-1.0).
// Regenerate: node scripts/generate-tech-icons.mjs

export interface BrandIcon {
  title: string;
  /** 24x24 viewBox path data. */
  path: string;
}

export const brandIcons = {
${body}
} satisfies Record<string, BrandIcon>;

export type BrandSlug = keyof typeof brandIcons;
`;

writeFileSync("components/ui/icons/techBrandPaths.ts", out);
console.log(
  `Wrote components/ui/icons/techBrandPaths.ts — ${entries.length} icons, ` +
    `${(out.length / 1024).toFixed(1)} KB (simple-icons v${version}).`
);
