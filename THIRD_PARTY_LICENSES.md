# Third-Party Content Licenses

This document records all third-party content (images, datasets, and media) used in DriveMy that are not covered by the main software license.

---

## Colour Vision Test Plates (Ishihara-style)

**Location:** `public/color-plates/`
**Used in:** Color Vision Test (`/color-vision`)

The pseudo-isochromatic colour plates used in the colour vision screening feature are **SVG plates generated programmatically** using public-domain Ishihara design principles. They are **not** reproductions of the original Ishihara plates published by Kanehara & Co., Ltd., which remain under copyright.

### Design Basis

The plates are constructed using:
- Circular dot patterns (pseudo-isochromatic design, a method first described by Ishihara Shinobu in 1917 — now in the public domain)
- Colour palettes derived from peer-reviewed colour-vision research available in the public domain
- No direct reproduction of any commercially-published plate

### Attribution

| Source | Usage | License |
|--------|-------|---------|
| Pseudo-isochromatic plate design method (Ishihara 1917) | Design basis | Public domain (>100 years) |
| SVG plate generation (`scripts/fetch-color-plates.ts`) | Source script | MIT (this project) |

> [!NOTE]
> These plates are intended for **educational screening only** and are **not a medical diagnostic tool**. Users are advised to consult a certified optometrist for clinical colour vision assessment.

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

**Provider:** Google Fonts CDN (`fonts.googleapis.com`)

| Font | License |
|------|---------|
| Inter | [SIL Open Font License 1.1](https://scripts.sil.org/OFL) |
| Cal Sans | [SIL Open Font License 1.1](https://scripts.sil.org/OFL) |
| JetBrains Mono | [SIL Open Font License 1.1](https://scripts.sil.org/OFL) |

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
- Tailwind CSS — MIT
- Zustand — MIT
- Zod — MIT
