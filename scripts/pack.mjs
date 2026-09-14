import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync, rmSync } from "node:fs";

const root = resolve(".");
const dist = resolve(root, "dist");
const zipFile = resolve(root, "f1-fans-new-tab.zip");

// First run build
execSync("node scripts/build.mjs", { stdio: "inherit" });

if (existsSync(zipFile)) {
  rmSync(zipFile);
}

try {
  // Zip the contents of dist directory
  execSync(`cd "${dist}" && zip -r "${zipFile}" ./*`, { stdio: "inherit" });
  console.log(`\n🎉 Successfully packaged Chrome Extension: ${zipFile}`);
} catch (err) {
  console.error("Packaging failed:", err.message);
  process.exit(1);
}
