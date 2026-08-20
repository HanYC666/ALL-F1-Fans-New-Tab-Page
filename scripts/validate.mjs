import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
const root = resolve(".");
const manifest = JSON.parse(
  await readFile(join(root, "src/manifest.json"), "utf8"),
);
if (
  manifest.manifest_version !== 3 ||
  manifest.permissions.some((x) =>
    ["tabs", "history", "unlimitedStorage"].includes(x)
  )
) throw new Error("Manifest validation failed");
const files = [];
async function walk(dir) {
  for (const x of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, x.name);
    if (x.isDirectory()) await walk(p);
    else files.push(p);
  }
}
await walk(join(root, "src"));
const text = (await Promise.all(
  files.filter((x) => /\.(js|json|html|css|md)$/.test(x)).map((x) =>
    readFile(x, "utf8")
  ),
)).join("\n");
if (/(?:YOUTUBE_DATA_API_KEY\s*[:=]\s*['"](?!==)|AIza[\w-]{20,})/.test(text)) {
  throw new Error("Possible client secret detected");
}
if (/\beval\s*\(|new Function\s*\(/.test(text)) {
  throw new Error("Unsafe dynamic code detected");
}
console.log(
  `Validated ${files.length} source files; no broad permissions, client secrets, or dynamic code found.`,
);
