#!/usr/bin/env node
/**
 * Compute the CSP `sha256-...` source expressions for every inline <script>
 * in index.html.
 *
 * index.html carries one inline script that sets the theme and lang classes
 * before first paint (preventing a flash of the wrong theme). Because it must
 * run synchronously before paint, it cannot be moved to an external file
 * without a real visual regression — so the CSP allows it by hash instead of
 * by the far weaker 'unsafe-inline'.
 *
 * A hash pins the exact bytes: change so much as one space in that script and
 * the browser will refuse to run it. When that happens, run this script and
 * paste the new value into the `script-src` directive in vercel.json.
 *
 *   npm run csp:hash
 *
 * Exit codes: 0 = the hashes in vercel.json match index.html
 *             1 = drift detected (or the files could not be parsed)
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "index.html");
const vercelPath = path.join(root, "vercel.json");

const html = readFileSync(htmlPath, "utf8");

// Match <script> elements that have no src attribute — those are the inline
// ones the CSP must account for.
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
  (m) => m[1]
);

if (inlineScripts.length === 0) {
  console.log("No inline <script> found in index.html — 'unsafe-inline' is not needed.");
  process.exit(0);
}

const hashes = inlineScripts.map(
  (body) => `sha256-${createHash("sha256").update(body, "utf8").digest("base64")}`
);

console.log(`Found ${inlineScripts.length} inline script(s) in index.html:\n`);
for (const h of hashes) console.log(`  '${h}'`);

// Verify vercel.json is in sync.
const vercel = readFileSync(vercelPath, "utf8");
const missing = hashes.filter((h) => !vercel.includes(h));

if (missing.length > 0) {
  console.error(
    `\n✖ vercel.json is out of date. Add the following to the script-src directive:\n` +
      missing.map((h) => `    '${h}'`).join("\n")
  );
  process.exit(1);
}

console.log("\n✔ vercel.json script-src is in sync with index.html.");
