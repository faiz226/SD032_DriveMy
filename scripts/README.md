# DriveMy — Question Ingestion Pipeline

This directory contains the KPP1 question bank and the scripts to seed it into Supabase.

---

## Question Bank Summary

| Set | Questions | Purpose |
|-----|-----------|---------|
| `quiz-pool` | 60 | Practice quizzes (random selection) |
| `mock-1` | 50 | Full mock exam set 1 |
| `mock-2` | 50 | Full mock exam set 2 |
| `mock-3` | 50 | Full mock exam set 3 |
| **Total** | **210** | |

**Categories:** `road-signs` · `traffic-rules` · `safety-principles`

All questions are bilingual (English + Bahasa Malaysia) and based on the official JPJ KPP1 syllabus.

---

## Setup (one-time)

### 1. Configure environment

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   ← needed for seeding (bypasses RLS)
```

Find these in: **Supabase Dashboard → Project Settings → API**

### 2. Run the database schema

In **Supabase Dashboard → SQL Editor**, run:

```
supabase/setup_schema.sql
```

If you already ran the schema without the unique constraint, also run:

```
supabase/migrations/001_add_unique_constraint.sql
```

### 3. Seed the question bank

```bash
npm run db:seed
```

This is **idempotent** — running it again will update existing questions rather than duplicate them.

---

## Uploading Road Sign Images (optional)

1. Place image files in `scripts/images/` named as:
   ```
   {set_id}_{order_index}.{ext}
   ```
   Examples: `quiz-pool_1.png`, `mock-1_5.jpg`, `quiz-pool_9.webp`

2. Run the storage setup SQL in Supabase Dashboard:
   ```
   scripts/setup-storage.sql
   ```

3. Upload images and update `image_url` in the database:
   ```bash
   npm run db:upload-images
   ```

Images are stored in the `kpp-images` Supabase Storage bucket with public-read access.

---

## File Structure

```
scripts/
├── README.md                  ← this file
├── ingest-questions.js        ← main seed script (run with npm run db:seed)
├── upload-images.js           ← image upload helper
├── setup-storage.sql          ← Supabase Storage bucket setup SQL
├── questions-data.js          ← quiz-pool (60 q) + mock-1 part 1 (20 q)
├── questions-mock1-part2.js   ← mock-1 part 2 (10 q, indices 21-30)
├── questions-mock1-part3.js   ← mock-1 part 3 (20 q, indices 31-50)
├── questions-mock2.js         ← mock-2 (50 q)
├── questions-mock3.js         ← mock-3 (50 q)
└── images/                    ← place road sign images here (create if needed)
```

---

## Adding More Questions

1. Add question objects to the appropriate data file following the existing format
2. Increment `order_index` sequentially within each `set_id`
3. Re-run `npm run db:seed` — the upsert will add new questions without touching existing ones

### Question object format

```js
{
  category: "road-signs",          // "road-signs" | "traffic-rules" | "safety-principles"
  set_id: "quiz-pool",             // "quiz-pool" | "mock-1" | "mock-2" | "mock-3"
  order_index: 61,                 // sequential integer within the set
  question_en: "What does ... ?",
  question_ms: "Apakah ... ?",
  options_en: ["Option A", "Option B", "Option C", "Option D"],  // exactly 4
  options_ms: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
  correct_index: 0,                // 0-3 (index of the correct option)
  explanation_en: "Because ...",   // optional but recommended
  explanation_ms: "Kerana ...",    // optional but recommended
  image_url: null,                 // set after uploading via upload-images.js
  source_url: "https://www.jpj.gov.my",
}
```

---

## Troubleshooting

**`RLS policy` error during seed**
→ Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`. The anon key is blocked by Row Level Security for INSERT operations.

**`unique constraint` error**
→ Run `supabase/migrations/001_add_unique_constraint.sql` in Supabase SQL Editor first.

**`VITE_SUPABASE_ANON_KEY` missing**
→ The old env var was `VITE_SUPABASE_PUBLISHABLE_KEY`. Rename it in your `.env.local`.
