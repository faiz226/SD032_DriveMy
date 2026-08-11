# Jalan — the DriveMy design system

The canonical reference for this app's visual identity. `src/index.css`,
`tailwind.config.js`, and several components point here.

## The thesis

**The interface is the road surface. The content is the signage.**

DriveMy already contains the most vivid visual language available to it —
octagonal red `BERHENTI`, yellow warning diamonds, blue informational plates.
Before this system, that language was quarantined inside white cards while grey
SaaS chrome surrounded it.

The answer is not to paint the chrome in sign colours. If the chrome looks like
signage, the real signs stop reading as authoritative and become decoration. So
the chrome became what signs sit on: asphalt, concrete, paint. Achromatic and
disciplined, so the only saturated colour on screen belongs to actual road signs
and actual pass/fail states.

That constraint is what makes the restraint earned rather than defaulted. When
in doubt about whether something should carry colour, ask whether it is signage
or road.

## Colour

Six values, each from a real road. Defined in `src/index.css` as RGB triples.

| Token | Hex | Role |
|---|---|---|
| `--asphalt` | `#23211E` | Dark canvas, light-mode ink. Warm bituminous black, deliberately not `#111`. |
| `--concrete` | `#E4E3DE` | Light canvas. A poured JPJ circuit surface. Grey, deliberately not cream. |
| `--paint` | `#F7F5F0` | Road-marking white. Lines, plates, raised surfaces. |
| `--awas` | `#F2B705` | Warning-diamond yellow. The one accent. |
| `--berhenti` | `#C8102E` | Stop, fail, below the pass mark. |
| `--lulus` | `#00703C` | Pass, complete. |

Plus `--sign-info` (`#0057A8` light, lifted in dark) for JPJ informational
plates. Sign-category colours are *content*, which is why they are allowed to be
saturated where the chrome is not.

A neutral ramp `--grade-1` through `--grade-9` derives from asphalt rather than
being a generic grey scale.

### Rules

**`awas`, `berhenti` and `lulus` are reserved.** They mean progress, fail and
pass. Never use them decoratively — a yellow divider or a green card border that
doesn't mean "complete" spends a signal that the system needs elsewhere.

**Never render all three adjacent as a status triad.** That reads as a traffic
light. This app is the road, not the light.

**`awas` is a light hue and cannot carry text on a pale surface.** Measured at
1.41:1 on the card background. Where yellow must label something, set it as a
plate — dark text *on* yellow, which is what a warning sign does anyway.

### Light and dark

Light mode is the circuit in daylight; dark mode is the same road at night.
Both are fully designed; neither is an afterthought.

In dark mode the carriageway is **lighter** than the page — a road ahead is
lighter than the verge under headlights. Building it darker than the page (the
obvious first instinct) made the dashboard hero vanish into the background.

## Type

Two families, three roles. Loaded in `index.html`.

| Role | Face | Used for |
|---|---|---|
| Display | **Archivo**, width 112–118%, weight 800 | Headings and figures only |
| Body | **Barlow** 400/500/600 | Everything else — the working family |
| Plate | **Barlow Condensed** 600/700, uppercase, tracked | Signage only |

Barlow was chosen because its design brief is literally highway signage, and it
handles long Bahasa Melayu strings well. Archivo's width axis lets headings sit
expanded, like a stamped regulatory plate.

### The plate voice is reserved for signage

`.type-plate` — condensed, tracked, uppercase — is the loudest voice in the
system. It is allowed only where the product is genuinely showing a sign: the
L/P plates and markings painted on the road.

This rule exists because it was broken first. An audit of the live render found
**41% of all text** set in condensed caps across three families sharing the work
evenly. At that density the caps stopped reading as "label" and became the
page's ambient texture — the whole surface spoke in one raised voice and nothing
could be emphasised. It now sits at 2%.

Use `.type-label` / `.type-label-strong` for section heads, field labels,
metadata, buttons, table heads — sentence case, normal tracking, body family.
This is an Operate product; it needs a working register far more than a display
one.

### Available utilities

`.type-display` · `.type-figure` (tabular, for scores and timers) ·
`.type-plate` · `.type-label` · `.type-label-strong`

## Radius

Road geometry has almost no curves. Three values, each with a reason:

| Token | Value | For |
|---|---|---|
| `--r-bay` | `0px` | Painted bays, rules, kerbs |
| `--r-plate` | `4px` | Informational plates — the small corner a JPJ plate has |
| — | `9999px` | Only genuinely circular things: discs, avatars, sign roundels |

Every Tailwind radius (`sm` through `3xl`) is pinned to `--r-plate` so a stray
`rounded-2xl` cannot reintroduce a fourth value.

## Curves

Curves are rare here by design, but where a road bends the geometry follows the
road, not the drawing tool.

**A curve joins its neighbour smoothly or it is a corner on purpose.** There is
no third state. A join that is *nearly* tangent reads as a mistake at large
sizes and as a smudge at small ones. `z-curve`'s angular turns are corners and
should stay corners; `parallel-parking`'s entry curve is smooth and had a 90°
break in it for a while, which the eye missed and the harness did not.

**Curvature continuity (G2) is the ideal, not the floor.** Real road alignment
puts a transition spiral between a straight and an arc because a driver cannot
change steering angle instantly — Arahan Teknik Jalan specifies them, and it is
the same reason this system's curves should ramp rather than snap. In practice a
cubic cannot be curvature-continuous against straights at *both* ends without
degenerating, so the current icons are tangent-continuous (G1) with known
curvature breaks. That is an accepted trade at 40px, recorded rather than
hidden.

```bash
node .screenshots/curvature.mjs
```

Reports every join, separates intentional corners from unintended breaks, and
exits non-zero on a G2 break. Run it after touching any path data.

**Squircles are not part of this system.** Corner smoothing is invisible below
about 12px and every radius here is 0 or 4px; `corner-shape` is also
Chromium-only. The hard corner is the identity, not a limitation.

## The road-marking grammar

The system's structural language. **A line's pattern states permission**, the
same way it does on a Malaysian road — so a line is never just a line.

| Marking | Class | Means |
|---|---|---|
| Double solid | `.mark-locked` | Locked — prerequisite unmet, you may not cross |
| Single solid | `.mark-closed` | Closed — finished, nothing left here |
| Broken | `.mark-open` | Open — available to start or continue |
| Broken, painted yellow | `.mark-progress` | In progress — this is where you left off |

Use the `RoadRule` component rather than the classes directly. Vertical variants
exist via `.mark-v`.

The grammar has to mean what it says. An empty activity list is `open`, not
`locked` — an empty history is not a prerequisite someone failed to meet.

## Surfaces

| Surface | Class / component | What it is |
|---|---|---|
| Bay | `.bay` / `<Bay>` | A painted parking bay — rectangle, no radius, paint on one edge. The kerb colour is the status. |
| Plate | `.plate` / `<Plate>` | An informational surface — 4px corner, hairline edge. |
| Carriageway | `.carriageway` / `<Carriageway>` | The dark road surface. Contents opt into the on-road palette. |

Bay states: `open` · `progress` · `done` · `fail`.

Primitives live in `src/components/ui/road.tsx`: `RoadRule`, `Bay`, `Plate`,
`Carriageway`, `LPlate`, `Figure`, `SectionHead`.

## The signature

**Jarak ke Lulus** (`src/components/dashboard/ReadinessRoad.tsx`) — the
learner's whole route from nothing to a P licence, drawn as a stretch of road
with two checkpoints painted across it.

Solid double line behind is marks earned; broken line ahead is what is open; the
L plate stands at 60 marks and the P at 100. Plates render as dashed outlines
until their gate is met.

A gauge cannot show a threshold, let alone two. A road can — and the two
thresholds are the entire shape of this qualification.

**On honesty:** a plate lights when its gate is met, which is deliberately not
the same as reaching its position. A learner can hold their L at 53 marks with
paper marks still on the table. The plate tells the truth about the licence, the
position tells the truth about the marks. Both are stated rather than reconciled
into one number that means neither.

The licence model is in `src/lib/licence.ts` and is the single source of truth
for marks and gates. Never recompute readiness locally — that is how the
progress page ended up quoting a different number than the dashboard.

## Icons

`phosphor-react`, at three weights with a rule for each. The mix is deliberate;
a fourth weight, or `fill` used decoratively, is drift.

| Weight | Used for |
|---|---|
| `regular` | The default. Everything not named below. |
| `fill` | A resolved state or a primary trigger — `CheckCircle`/`XCircle` on a graded answer, `Warning`, `Play`, `Lightning`. Filled means "this happened" or "this starts it". |
| `bold` | Optical compensation for small or thin glyphs only — the 12px `Check` in a checkbox, `Minus`/`Plus` on a slider, the 16px `ArrowRight` beside a strong label. Never at large sizes. |

Icons are road, not signage: they sit quieter than a real sign and never
compete with one. Custom icons — where no library has the concept, such as the
eight circuit maneuvers — are drawn as overhead paths in the road-marking
idiom. The spec and the generation prompt are in
[docs/asset-generation.md](docs/asset-generation.md).

## Motion

Motion earns its place or it does not ship. See the `web-animation` skill for
the general craft; the project-specific rules:

- **No orchestrated page-load sequences.** Product loads into a task; users
  don't want to watch it load.
- **Motion is state feedback.** The readiness road paints itself when marks
  actually move, not on every visit.
- **Only `transform` and `opacity`.** The one exception is the sidebar collapse,
  a deliberate container resize, which carries a documented waiver.
- Cut in the rebuild: a ten-step stagger ladder, `spin-slow`, `pulse-success`.

## Voice

**Signage register.** Signs are imperative, short, and unhedged. They do not
apologise or explain themselves.

- **Numbers are load-bearing and concrete.** "8 marks of headroom", not "you're
  doing well."
- **Never claim what the app cannot know.** The readiness figure is a composite,
  not a predicted exam mark. State gaps in points against the line.
- **Failure is factual, never consoling.** "38/50. Pass mark is 42. Four short."
- **Controls name their action.** "Start quiz", not "Master the Road".
- **Sentence case** for headings and labels.
- **BM is co-equal, not a translation.** Real JPJ terms (KPP, JPJ, litar, bukit,
  markah lulus) stay in both languages, because a Malaysian learner says them in
  both.

## Two modes

Which rules apply depends on the *surface*, not the product.

**Operate** — every authenticated page. The learner is in a task and the
interface should disappear. Scanability and consistency outrank expression.
Brand lives in precise details.

**Persuade** — the landing page only. The visitor is deciding, so display type
may carry the voice and the road vernacular goes louder than it ever does
inside the app.

A tool's landing page is still Persuade; a dashboard inside a beautiful brand is
still Operate.

## The floor

Verified in the rebuild and expected to hold:

- Contrast: **0 failures** both themes. `--grade-6` was darkened from 4.43:1 to
  4.9:1 to clear AA.
- Focus visible on every tabbable element — a painted `awas` marker, not a soft
  ring.
- `prefers-reduced-motion`: **0** elements animating.
- Touch targets sized on the components that need them (`.tap`, `.tap-sm`), not
  forced onto every element in the document.

## Verifying

```bash
npm run build && npm test
```

The screenshot and audit harnesses used during the rebuild live in
`.screenshots/` (gitignored) — `audit.mjs` measures contrast and focus in both
themes, `typeaudit.mjs` counts type treatments and uppercase share, `motion.mjs`
checks reduced-motion.

## History

`docs/design-system-inconsistencies.md` describes the *pre-Jalan* state and its
prescriptions (delete dark mode, `#111111`, Cal Sans) are superseded. Do not act
on it.
