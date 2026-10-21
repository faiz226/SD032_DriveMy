---
name: jalan
description: "DriveMy's design system — the 'Jalan' identity built from Malaysian JPJ road and signage vernacular. Use this before writing or changing ANY user-facing code in this repository: components, pages, CSS, Tailwind config, copy, or translations. Also use it when asked to add a screen, restyle something, fix spacing or colour, make the UI feel more polished, review a page's design, or add motion. It defines the colour tokens, the three type roles, the road-marking grammar, surface components, the licence model that drives the dashboard, and the voice rules — and it exists specifically to stop UI work drifting back to generic defaults like uniform rounded cards, Inter, decorative accent colour, or all-caps labels everywhere."
---

# Jalan — DriveMy's design system

The full reference is **[DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md)** at the
repo root. Read it before any substantial UI work. This file is the short
version plus the rules that get broken most.

## The thesis, in one line

**The interface is the road surface. The content is the signage.**

JPJ signs are already the most vivid thing in this app. The chrome's job is to
be asphalt and paint underneath them, never to compete. When deciding whether
something should carry colour, ask: is this signage, or is it road?

## Before you write UI code

1. **Read `DESIGN_SYSTEM.md`.** It has the tokens, the type roles, the marking
   grammar, and the reasoning.
2. **Use the primitives in `src/components/ui/road.tsx`** — `Bay`, `Plate`,
   `Carriageway`, `RoadRule`, `LPlate`, `Figure`, `SectionHead`. If you find
   yourself writing a card by hand with `bg-card border rounded-lg`, a
   primitive already exists.
3. **Read the licence model in `src/lib/licence.ts`** if the work touches
   progress, marks, or gating. It is the single source of truth — never
   recompute readiness locally.

## The rules that get broken

These are listed because each one was actually violated during the build, not
hypothetically.

**Reserved colours stay reserved.** `awas` (yellow) means in-progress,
`berhenti` (red) means fail, `lulus` (green) means pass. A yellow divider or a
green card edge that doesn't mean "complete" spends a signal the system needs
elsewhere. Never render all three adjacent as a status triad — that reads as a
traffic light, and this app is the road, not the light.

**`awas` cannot carry text on a pale surface.** It measured 1.41:1 on the card
background. Where yellow must label something, make it a plate — dark text *on*
yellow, which is what a warning sign does anyway.

**The plate voice is for signage only.** `.type-plate` (condensed, tracked,
uppercase) belongs on the L/P plates and markings painted on the road. Every
other label — section heads, buttons, metadata, table heads — is `.type-label`
in sentence case. An audit once found 41% of all on-screen text in condensed
caps, at which point the caps stopped meaning "label" and became texture. It
sits at 2% now; keep it there.

**A marking must mean what it says.** `locked` is a prerequisite someone has
not met. An empty list is `open`, not `locked`.

**No orchestrated page-load sequences.** These are Operate surfaces — the user
is in a task, not watching an intro. Motion is state feedback: the readiness
road paints itself when marks actually move, not on every visit.

**Only three radii exist**: `0` for bays and rules, `4px` for plates, full round
for genuinely circular things. Every Tailwind radius is pinned to `4px`, so
reaching for `rounded-2xl` to get something softer will not work and should not
be attempted. Squircles are not part of this system either — corner smoothing is
invisible below ~12px, and the hard corner is the identity.

**A curve joins smoothly or it is a corner on purpose** — never almost-tangent.
After touching any path data run `node .screenshots/curvature.mjs`, which
separates intentional corners from unintended breaks. It caught a 90° break
sitting in the middle of `parallel-parking`'s entry curve that had passed
visual review.

## Assets

Two rules, both learned the hard way. Full brief in
[docs/asset-generation.md](../../../docs/asset-generation.md).

**Road signs are sourced, never generated.** They are standardised under
Arahan Teknik Jalan, and a plausible-but-wrong sign teaches a learner the wrong
answer on a licence exam. A previous scrape saved 74 Wikimedia error pages as
`.svg`/`.jpg`/`.png` because it sent no User-Agent, and six sign files ended up
holding a different sign than their name claimed.

**Open an image before you wire it to a caption.** The photographs in
`src/assets/signs/photos/` are not all verified; one named `stop.jpg` held a
No U-Turn sign.

**Icons are generated as SVG code, never as raster images**, against the
construction spec — 24px grid, 2px stroke, `butt` caps, `miter` joins,
`currentColor`. Rounded terminals are what generic looks like and they
contradict `--r-bay: 0px`.

## Operate vs Persuade

Which rules apply depends on the surface, not the product.

- **Operate** — every authenticated page. The learner is in a task and the
  interface should disappear. Scanability and consistency outrank expression.
- **Persuade** — the landing page only. The visitor is deciding, so display type
  may carry the voice and the road vernacular goes louder.

Do not import the landing page's boldness into a dashboard, or the dashboard's
restraint into the landing page.

## Voice

Signage register: imperative, short, unhedged. Signs do not apologise.

- Numbers are concrete — "8 marks of headroom", not "you're doing well".
- Never claim what the app cannot know. The readiness figure is a composite, not
  a predicted exam mark.
- Failure is factual, never consoling: "38/50. Pass mark is 42. Four short."
- Controls name their action — "Start quiz", not "Master the Road".
- Sentence case for headings and labels.
- BM is co-equal, not a translation. Real JPJ terms (KPP, litar, bukit, markah
  lulus) stay in both languages.

Any new user-facing string needs a key in **both** `src/lib/translations/en.ts`
and `ms.ts` — `TranslationKey` is derived from `en.ts`, so a missing MS key is a
type error and a missing EN key silently renders the key name.

## The floor

Non-negotiable, and currently all green:

- Contrast passes AA in **both** themes.
- Focus is visible on every tabbable element — a painted `awas` marker, not a
  soft ring.
- `prefers-reduced-motion` leaves nothing animating.
- Touch targets are declared on the components that need them (`.tap`,
  `.tap-sm`). Do not reintroduce a blanket rule on every element — the previous
  one inflated inline links and fought every layout.

## Verify

```bash
npm run build && npm test
```

For visual work, the harnesses in `.screenshots/` (gitignored) measure what
eyeballing misses: `audit.mjs` for contrast and focus in both themes,
`typeaudit.mjs` for type treatments and uppercase share, `motion.mjs` for
reduced-motion. Run them rather than assuming.

**Point them at the right server.** They default to `localhost:5173`, and if a
second checkout of this repo is running there you will silently measure the
wrong application — the numbers look plausible and are meaningless. Pass the
port explicitly:

```bash
BASE_URL=http://localhost:3000 node .screenshots/typeaudit.mjs
```

## Do not act on

`docs/design-system-inconsistencies.md` describes the pre-Jalan state. Its
prescriptions — delete dark mode, `#111111` primary, Cal Sans — are superseded
and would undo this system.
