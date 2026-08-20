import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve("."), src = resolve("src"), dist = resolve("dist");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(src, dist, { recursive: true });
const manifest = JSON.parse(
  await readFile(resolve(dist, "manifest.json"), "utf8"),
);
manifest.version = process.env.EXTENSION_VERSION || manifest.version;
await writeFile(
  resolve(dist, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(`Built ${dist}`);
