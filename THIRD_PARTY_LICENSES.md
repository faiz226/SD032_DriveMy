# Third-Party Content Licenses

This document records all third-party content (images, datasets, and media) used in DriveMy that are not covered by the main software license.

---

## Colour Vision Test Plates (Ishihara)

**Location:** `public/color-plates/1.jpg` to `25.jpg`
**Used in:** Colour test (`/color-vision`)

The plates are the 25 number plates from the answer key of *Ishihara Charts* (Challenge TB, funded by USAID, 2018), the project's source PDF `Ishihara_Tests.pdf`. Each image is that PDF's own embedded plate image, extracted byte for byte; none is drawn or generated. The PDF is kept outside the repository and must not be committed. The answers and the scoring in `src/content/color-vision.ts` come from the same answer key. Plates 26 to 38 of that key are traced with a finger and are not used.

The Ishihara test itself is published by Kanehara Trading Inc. These copies are used for non-commercial, educational screening in a student project.

> [!NOTE]
> The colour test is practice only and is **not a medical diagnostic tool**. Learners are told to see an optometrist or a doctor for a proper colour vision check.

---

## JPJ Road Sign Images

**Location:** Supabase Storage — `kpp-images` bucket
**Used in:** Theory Module, Road Signs page

Road sign images are reproduced from the **Malaysian Highway Code (Kod Jalan Raya Malaysia)** published by the Road Transport Department (Jabatan Pengangkutan Jalan, JPJ) Malaysia.

| Source | License |
|--------|---------|
| JPJ / Road Transport Department Malaysia | Government public information — reproduced for educational purposes under fair use for non-commercial student learning |

---

## Fonts

**Provider:** self-hosted from npm through Fontsource (`@fontsource-variable/*`, `@fontsource/*`) and bundled with the app; no font CDN is contacted.

| Font | License |
|------|---------|
| Overpass | [SIL Open Font License 1.1](https://scripts.sil.org/OFL) |
| DotGothic16 | [SIL Open Font License 1.1](https://scripts.sil.org/OFL) |
| JetBrains Mono | [SIL Open Font License 1.1](https://scripts.sil.org/OFL) |

---

## Simulator Textures

**Location:** `public/sim/textures/`
**Used in:** the v2 driving simulator's yard

| File | Source | License |
|------|--------|---------|
| `concrete-512.webp`, `concrete-1024.webp` | [ambientCG Concrete030](https://ambientcg.com/view?id=Concrete030), downscaled and lightened to match the yard's pale concrete | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `grass-512.webp`, `grass-1024.webp` | Generated for this project (a periodic noise field in grass colours) | MIT (this project) |

---

## Software Dependencies

All npm dependencies are listed in `package.json`. Individual package licenses can be audited with:

```bash
npx license-checker --summary
```

Key dependency licenses:
- React, React DOM — MIT
- Supabase JS — MIT  
- Phaser 3 — MIT
- Radix UI — MIT
- Hugeicons (free icon set and React component) — MIT
- Tailwind CSS — MIT
- Zustand — MIT
- Zod — MIT
