// Module hooks so Node's test runner can import the app's TypeScript directly:
// resolves the "@/…" path alias and loads JSON imports the way the bundler does.
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const base = path.join(root, specifier.slice(2));
    const file = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")].find(
      (candidate) => existsSync(candidate) && !candidate.endsWith(path.sep)
    );
    return next(pathToFileURL(file ?? base).href, context);
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith(".json")) {
    const text = await readFile(fileURLToPath(url), "utf8");
    return { format: "module", source: `export default ${text};`, shortCircuit: true };
  }
  return next(url, context);
}
