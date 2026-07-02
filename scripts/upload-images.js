#!/usr/bin/env node
/**
 * DriveMy — Supabase Storage Image Upload Helper
 *
 * Uploads road sign images from scripts/images/ to the 'kpp-images' bucket
 * and updates the image_url column in kpp_questions.
 *
 * Usage:
 *   node scripts/upload-images.js
 *
 * Requires:
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local (service role needed for storage admin)
 *   - Image files in scripts/images/ named as: {set_id}_{order_index}.{ext}
 *     e.g. quiz-pool_1.png, mock-1_5.jpg
 *
 * The 'kpp-images' bucket must exist with public-read policy.
 * Run the SQL in scripts/setup-storage.sql first if needed.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname, extname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
const envPath = resolve(__dirname, "../.env.local");
if (!existsSync(envPath)) {
  console.error("❌  .env.local not found.");
  process.exit(1);
}

const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  SUPABASE_SERVICE_ROLE_KEY is required for storage uploads.");
  console.error("   Add it to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET = "kpp-images";
const IMAGES_DIR = resolve(__dirname, "images");

// ---------------------------------------------------------------------------
// Ensure bucket exists with public-read policy
// ---------------------------------------------------------------------------
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);

  if (!exists) {
    console.log(`📦  Creating bucket '${BUCKET}'...`);
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
      fileSizeLimit: 2 * 1024 * 1024, // 2 MB
    });
    if (error) {
      console.error(`❌  Failed to create bucket: ${error.message}`);
      process.exit(1);
    }
    console.log(`✅  Bucket '${BUCKET}' created with public-read access.`);
  } else {
    console.log(`✅  Bucket '${BUCKET}' already exists.`);
  }
}

// ---------------------------------------------------------------------------
// Upload images
// ---------------------------------------------------------------------------
async function uploadImages() {
  if (!existsSync(IMAGES_DIR)) {
    console.log(`ℹ️   No images directory found at scripts/images/`);
    console.log(`   Create it and add images named: {set_id}_{order_index}.{ext}`);
    console.log(`   Example: quiz-pool_1.png, mock-1_5.jpg`);
    return;
  }

  const files = readdirSync(IMAGES_DIR).filter((f) =>
    [".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(extname(f).toLowerCase())
  );

  if (files.length === 0) {
    console.log("ℹ️   No image files found in scripts/images/");
    return;
  }

  console.log(`\n📸  Found ${files.length} image(s) to upload...`);
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = resolve(IMAGES_DIR, file);
    const ext = extname(file).toLowerCase();
    const nameWithoutExt = basename(file, ext);

    // Parse filename: {set_id}_{order_index}
    const lastUnderscore = nameWithoutExt.lastIndexOf("_");
    if (lastUnderscore === -1) {
      console.warn(`⚠️   Skipping '${file}' — filename must be {set_id}_{order_index}.{ext}`);
      skipped++;
      continue;
    }

    const setId = nameWithoutExt.slice(0, lastUnderscore);
    const orderIndex = parseInt(nameWithoutExt.slice(lastUnderscore + 1), 10);

    if (isNaN(orderIndex)) {
      console.warn(`⚠️   Skipping '${file}' — order_index must be a number`);
      skipped++;
      continue;
    }

    const storagePath = `${setId}/${orderIndex}${ext}`;
    const mimeTypes = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };
    const contentType = mimeTypes[ext] || "image/png";

    process.stdout.write(`   Uploading ${file} → ${storagePath}... `);

    const fileBuffer = readFileSync(filePath);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, { contentType, upsert: true });

    if (uploadError) {
      console.error(`❌  ${uploadError.message}`);
      errors++;
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // Update kpp_questions
    const { error: updateError } = await supabase
      .from("kpp_questions")
      .update({ image_url: publicUrl })
      .eq("set_id", setId)
      .eq("order_index", orderIndex);

    if (updateError) {
      console.error(`❌  DB update failed: ${updateError.message}`);
      errors++;
    } else {
      console.log(`✅  ${publicUrl}`);
      uploaded++;
    }
  }

  console.log("\n" + "━".repeat(50));
  console.log("📊  Upload Summary:");
  console.log(`   ✅  Uploaded: ${uploaded}`);
  if (skipped > 0) console.log(`   ⏭️   Skipped:  ${skipped}`);
  if (errors > 0) console.log(`   ❌  Errors:   ${errors}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("🚀  DriveMy Image Upload Helper");
  console.log("━".repeat(50));
  await ensureBucket();
  await uploadImages();
  console.log("\n🎉  Done!");
}

main().catch((err) => {
  console.error("❌  Fatal error:", err.message);
  process.exit(1);
});
