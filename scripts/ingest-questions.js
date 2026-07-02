#!/usr/bin/env node
/**
 * DriveMy — KPP1 Question Ingestion & Seed Script
 *
 * Usage:
 *   npm run db:seed
 *   — or —
 *   node scripts/ingest-questions.js
 *
 * Requires in .env.local:
 *   VITE_SUPABASE_URL=https://...
 *   SUPABASE_SERVICE_ROLE_KEY=...   ← bypasses RLS; never prefix with VITE_
 *
 * Features:
 *   - Uses service role key so RLS never blocks inserts
 *   - Idempotent: upsert on UNIQUE (set_id, order_index) — safe to re-run
 *   - Validates every question before touching the database
 *   - Batched inserts with progress reporting
 */

// ---------------------------------------------------------------------------
// Imports — all at top level (ES module requirement)
// ---------------------------------------------------------------------------
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { QUIZ_POOL, MOCK_1 as MOCK_1_PART1 } from "./questions-data.js";
import { MOCK_1_PART2 } from "./questions-mock1-part2.js";
import { MOCK_1_PART3 } from "./questions-mock1-part3.js";
import { MOCK_2 } from "./questions-mock2.js";
import { MOCK_3 } from "./questions-mock3.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load .env.local (Node doesn't read it automatically)
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  if (!existsSync(envPath)) {
    console.error("❌  .env.local not found.");
    console.error("   Copy .env.local.example → .env.local and fill in your credentials.");
    process.exit(1);
  }

  const lines = readFileSync(envPath, "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  }
  return env;
}

const env = loadEnv();

const SUPABASE_URL = env["VITE_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];
const ANON_KEY = env["VITE_SUPABASE_ANON_KEY"];

if (!SUPABASE_URL) {
  console.error("❌  VITE_SUPABASE_URL is missing from .env.local");
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error("❌  SUPABASE_SERVICE_ROLE_KEY is missing from .env.local");
  console.error("   Find it in: Supabase Dashboard → Project Settings → API → service_role");
  console.error("   The anon key cannot INSERT into kpp_questions (blocked by RLS).");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Admin client — service role key bypasses RLS for all operations
// ---------------------------------------------------------------------------
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Regular client (anon key) — used only for the pre-flight connectivity check
const supabaseAnon = ANON_KEY
  ? createClient(SUPABASE_URL, ANON_KEY)
  : null;

// ---------------------------------------------------------------------------
// Deterministic shuffle helpers
// ---------------------------------------------------------------------------
/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Returns a function that generates floats in [0, 1).
 */
function seededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Compute a numeric seed from a question's English text. */
function strToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Shuffle question options deterministically using the question text as seed.
 * Updates correct_index to point to the new position of the originally-correct option.
 */
function shuffleOptions(q) {
  const rng = seededRng(strToSeed(q.question_en));
  const n = q.options_en.length;

  // Build index array [0, 1, 2, 3] and Fisher-Yates shuffle it
  const idxMap = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idxMap[i], idxMap[j]] = [idxMap[j], idxMap[i]];
  }

  const shuffled_en = idxMap.map((i) => q.options_en[i]);
  const shuffled_ms = idxMap.map((i) => q.options_ms[i]);
  const new_correct_index = idxMap.indexOf(q.correct_index);

  return {
    ...q,
    options_en: shuffled_en,
    options_ms: shuffled_ms,
    correct_index: new_correct_index,
  };
}

// ---------------------------------------------------------------------------
// Build the full question list
// ---------------------------------------------------------------------------
// Re-index mock-1 order_index sequentially across all 3 source files
const MOCK_1_ALL = [...MOCK_1_PART1, ...MOCK_1_PART2, ...MOCK_1_PART3].map(
  (q, i) => ({ ...q, order_index: i + 1 })
);

const ALL_QUESTIONS = [...QUIZ_POOL, ...MOCK_1_ALL, ...MOCK_2, ...MOCK_3].map(shuffleOptions);

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
const VALID_CATEGORIES = new Set(["road-signs", "traffic-rules", "safety-principles"]);
const VALID_SET_IDS = new Set(["quiz-pool", "mock-1", "mock-2", "mock-3"]);

function validateQuestion(q, idx) {
  const errs = [];
  if (!q.question_en?.trim()) errs.push("missing question_en");
  if (!q.question_ms?.trim()) errs.push("missing question_ms");
  if (!Array.isArray(q.options_en) || q.options_en.length !== 4)
    errs.push("options_en must have exactly 4 items");
  if (!Array.isArray(q.options_ms) || q.options_ms.length !== 4)
    errs.push("options_ms must have exactly 4 items");
  if (typeof q.correct_index !== "number" || q.correct_index < 0 || q.correct_index > 3)
    errs.push("correct_index must be 0–3");
  if (!VALID_CATEGORIES.has(q.category))
    errs.push(`invalid category "${q.category}"`);
  if (!VALID_SET_IDS.has(q.set_id))
    errs.push(`invalid set_id "${q.set_id}"`);
  if (typeof q.order_index !== "number" || q.order_index < 1)
    errs.push("order_index must be a positive integer");

  if (errs.length > 0) {
    console.error(
      `  ❌  [${idx + 1}] ${q.set_id}/${q.order_index}: ${errs.join(", ")}`
    );
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function seed() {
  console.log("🚀  DriveMy — KPP1 Question Ingestion Pipeline");
  console.log("━".repeat(52));
  console.log(`   URL:  ${SUPABASE_URL}`);
  console.log(`   Auth: service role key ✓ (RLS bypassed)`);
  console.log();

  // ── Question counts ──────────────────────────────────────────────────────
  const bySets = ALL_QUESTIONS.reduce((acc, q) => {
    acc[q.set_id] = (acc[q.set_id] || 0) + 1;
    return acc;
  }, {});

  console.log(`📊  Questions loaded: ${ALL_QUESTIONS.length} total`);
  for (const [setId, count] of Object.entries(bySets)) {
    const expected = setId === "quiz-pool" ? null : 50;
    const flag = expected && count !== expected ? " ⚠️  (expected 50)" : "";
    console.log(`     ${setId.padEnd(12)} ${count}${flag}`);
  }
  console.log();

  // ── Validate ─────────────────────────────────────────────────────────────
  console.log("🔍  Validating all questions...");
  let allValid = true;
  ALL_QUESTIONS.forEach((q, i) => {
    if (!validateQuestion(q, i)) allValid = false;
  });

  if (!allValid) {
    console.error("\n❌  Validation failed — fix the errors above before seeding.");
    process.exit(1);
  }
  console.log("  ✅  All questions valid.\n");

  // ── Verify mock sets are exactly 50 ──────────────────────────────────────
  for (const setId of ["mock-1", "mock-2", "mock-3"]) {
    const count = ALL_QUESTIONS.filter((q) => q.set_id === setId).length;
    if (count !== 50) {
      console.error(`❌  ${setId} has ${count} questions — expected exactly 50.`);
      process.exit(1);
    }
  }

  // ── Pre-flight: verify table exists ──────────────────────────────────────
  console.log("🔌  Checking database connectivity...");
  const { error: pingError } = await supabaseAdmin
    .from("kpp_questions")
    .select("id")
    .limit(1);

  if (pingError) {
    console.error(`❌  Cannot reach kpp_questions: ${pingError.message}`);
    if (pingError.message.includes("does not exist")) {
      console.error(
        "   Run supabase/setup_schema.sql in the Supabase SQL Editor first."
      );
    }
    process.exit(1);
  }
  console.log("  ✅  Table kpp_questions is reachable.\n");

  // ── Prepare rows ─────────────────────────────────────────────────────────
  const rows = ALL_QUESTIONS.map((q) => ({
    category: q.category,
    set_id: q.set_id,
    order_index: q.order_index,
    question_en: q.question_en.trim(),
    question_ms: q.question_ms.trim(),
    options_en: q.options_en.map((o) => o.trim()),
    options_ms: q.options_ms.map((o) => o.trim()),
    correct_index: q.correct_index,
    explanation_en: q.explanation_en?.trim() ?? null,
    explanation_ms: q.explanation_ms?.trim() ?? null,
    image_url: q.image_url ?? null,
    source_url: q.source_url ?? null,
  }));

  // ── Upsert in batches of 50 ───────────────────────────────────────────────
  const BATCH = 50;
  let upserted = 0;
  let failed = 0;
  const totalBatches = Math.ceil(rows.length / BATCH);

  console.log(`📤  Upserting ${rows.length} rows in ${totalBatches} batches...`);

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const batchNum = Math.floor(i / BATCH) + 1;

    process.stdout.write(`  Batch ${String(batchNum).padStart(2)}/${totalBatches} `);
    process.stdout.write(`(${batch[0].set_id} #${batch[0].order_index}–#${batch[batch.length - 1].order_index})... `);

    const { data, error } = await supabaseAdmin
      .from("kpp_questions")
      .upsert(batch, {
        onConflict: "set_id,order_index",
        ignoreDuplicates: false,
      })
      .select("id");

    if (error) {
      console.error(`\n  ❌  ${error.message}`);
      if (error.message.includes("unique") || error.message.includes("constraint")) {
        console.error(
          "  💡  Unique constraint missing. Run supabase/migrations/001_add_unique_constraint.sql"
        );
      }
      failed += batch.length;
    } else {
      console.log(`✅  ${data?.length ?? batch.length} rows`);
      upserted += data?.length ?? batch.length;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log();
  console.log("━".repeat(52));
  console.log("📊  Ingestion complete:");
  console.log(`     ✅  Upserted : ${upserted}`);
  if (failed > 0) {
    console.log(`     ❌  Failed   : ${failed}`);
    process.exit(1);
  }
  console.log();
  console.log("🎉  Done! Your KPP1 question bank is ready.");
  console.log("   Next steps:");
  console.log("   1. npm run dev  — start the app");
  console.log("   2. Test /quizzes and /mock-test pages");
  console.log("   3. Add images to scripts/images/ then: npm run db:upload-images");
}

seed().catch((err) => {
  console.error("❌  Fatal:", err.message);
  process.exit(1);
});
