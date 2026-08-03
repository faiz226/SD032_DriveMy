#!/usr/bin/env node
/**
 * Dependency-vulnerability gate for CI.
 *
 * Replaces a bare `npm audit --audit-level=high`. That command has one failure
 * mode that matters: when an advisory has no available fix, the gate stays red
 * forever, the team learns to ignore it, and it stops protecting anything. This
 * repo had exactly that — CI was failing at the audit step, which also blocked
 * the `supabase db push` job gated behind it.
 *
 * Behaviour:
 *   - Fails on ANY advisory at or above --level (default: high) that is not
 *     explicitly listed in .audit-allowlist.json.
 *   - ALSO fails on any allowlist entry whose `reviewBy` date has passed, so an
 *     accepted risk cannot quietly become permanent.
 *   - ALSO fails on any allowlist entry that no longer matches a live advisory,
 *     so the file cannot accumulate stale exceptions.
 *
 * Usage: npm run audit:gate
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowlistPath = path.join(root, ".audit-allowlist.json");

const RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const levelArg = process.argv.find((a) => a.startsWith("--level="));
const minLevel = levelArg ? levelArg.split("=")[1] : "high";
const minRank = RANK[minLevel] ?? RANK.high;

// `npm audit` exits non-zero when it finds anything, so tolerate that and parse.
let raw;
try {
  // A single command string, not execFile+args+shell — the latter triggers
  // DEP0190. `npm` resolves via the shell on both Windows and POSIX this way.
  raw = execSync("npm audit --json", {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (err) {
  // npm audit exits non-zero whenever it finds anything, which is the normal
  // path here — the JSON report is still on stdout.
  raw = err.stdout;
  if (!raw) {
    console.error("✖ audit-gate: could not run `npm audit --json`.");
    console.error(err.stderr || err.message);
    process.exit(1);
  }
}

if (!raw) {
  console.error("✖ audit-gate: `npm audit --json` produced no output.");
  process.exit(1);
}

let report;
try {
  report = JSON.parse(raw);
} catch {
  console.error("✖ audit-gate: could not parse `npm audit --json` output.");
  process.exit(1);
}

const allowlist = existsSync(allowlistPath)
  ? JSON.parse(readFileSync(allowlistPath, "utf8")).allow ?? []
  : [];

// Collect every GHSA id at or above the threshold, with its package.
const found = new Map(); // ghsa -> { pkg, severity, title }
for (const [pkg, v] of Object.entries(report.vulnerabilities ?? {})) {
  if ((RANK[v.severity] ?? 0) < minRank) continue;
  for (const via of v.via ?? []) {
    if (typeof via === "string" || !via.url) continue;
    const ghsa = via.url.split("/").pop();
    if (!found.has(ghsa)) {
      found.set(ghsa, { pkg, severity: via.severity ?? v.severity, title: via.title });
    }
  }
}

const allowed = new Map(allowlist.map((e) => [e.ghsa, e]));
const today = new Date().toISOString().slice(0, 10);

const unexpected = [...found.entries()].filter(([ghsa]) => !allowed.has(ghsa));
const expired = allowlist.filter((e) => !e.reviewBy || e.reviewBy < today);
const stale = allowlist.filter((e) => !found.has(e.ghsa));

let failed = false;

if (unexpected.length > 0) {
  failed = true;
  console.error(`\n✖ ${unexpected.length} un-triaged advisory(ies) at severity >= ${minLevel}:\n`);
  for (const [ghsa, info] of unexpected) {
    console.error(`  ${info.severity.toUpperCase().padEnd(8)} ${info.pkg}`);
    console.error(`    ${info.title}`);
    console.error(`    https://github.com/advisories/${ghsa}\n`);
  }
  console.error(
    "  Fix them, or — only with a real applicability argument — add an entry to\n" +
      "  .audit-allowlist.json with a reviewBy date.\n"
  );
}

if (expired.length > 0) {
  failed = true;
  console.error(`\n✖ ${expired.length} allowlist entry(ies) past their review date:\n`);
  for (const e of expired) {
    console.error(`  ${e.ghsa} (${e.package}) — reviewBy ${e.reviewBy ?? "MISSING"}`);
  }
  console.error("\n  Re-verify the exception still holds, then extend reviewBy or remove it.\n");
}

if (stale.length > 0) {
  failed = true;
  console.error(`\n✖ ${stale.length} allowlist entry(ies) no longer match any advisory:\n`);
  for (const e of stale) console.error(`  ${e.ghsa} (${e.package}) — resolved, delete this entry`);
  console.error("");
}

if (failed) process.exit(1);

const counts = report.metadata?.vulnerabilities ?? {};
console.log(
  `✔ audit-gate passed (level >= ${minLevel}). ` +
    `Totals: ${JSON.stringify(counts)}. ` +
    `${allowlist.length} documented exception(s), all within review date.`
);
