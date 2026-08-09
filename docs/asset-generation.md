# Generating assets for DriveMy

Briefs for producing icons and motion that belong to the Jalan system instead
of looking machine-made. Read `DESIGN_SYSTEM.md` first — these prompts assume
its vocabulary.

## Three rules before you generate anything

**Road signs are sourced, never generated.** Malaysian signs are standardised
under Arahan Teknik Jalan. A generated sign that looks plausible but is wrong
teaches a learner the wrong answer on a licence exam, which is a correctness
bug wearing a design costume. Take signs from the official spec or from
properly-licensed Wikimedia SVG. The earlier scrape failed because Wikimedia
rejects requests without a User-Agent — set one and it works.

**Icons are generated as SVG code, not as images.** Image models cannot make
clean vector icons; they make raster approximations with wobbly strokes and
drifting weights, which is most of what reads as "AI slop". Ask a coding model
for SVG markup against the spec below.

**Don't replace the icon library.** 65 distinct icons are in use across 138
import sites. Regenerating all of them is a large, risky project with a modest
payoff. Generate only the icons no library can provide — see below.

---

## What to actually generate: the eight circuit maneuvers

`src/lib/licence.ts` defines the eight JPJ circuit maneuvers, and no icon
library has any of them. They currently render as text rows in
`ManeuverScoresBar` and `CircuitMarks`. They are also the one place where a
custom icon is unarguably better than a generic one, because each maneuver *is*
a path — which is the Jalan road-marking idiom exactly.

Paste this whole block.

```text
You are drawing eight icons for DriveMy, a Malaysian JPJ driving-theory app.
They represent the eight maneuvers of the JPJ circuit test (litar).

THE IDEA
Each maneuver is a path a car takes through a marked course. Draw the PATH,
seen from directly above, as if it were painted on the ground. Do not draw a
car, a person, a steering wheel, or a cone. The path is the subject. This
matches the product's design system, where a line's pattern states permission
and the interface is the road surface.

CONSTRUCTION SPEC — follow exactly
- 24x24 viewBox. Live area 20x20, centred: 2px optical padding on every side.
- Stroke width 2. No other weight, within an icon or across the set.
- stroke-linecap="butt", stroke-linejoin="miter". Road paint has hard ends; it
  does not have rounded terminals. This is the most important line here.
- Corner radius 0 on any enclosing form. Right angles stay right angles.
- Snap coordinates to a 0.5 grid so strokes land on pixel boundaries.
- fill="none", stroke="currentColor". Never hardcode a hex. One colour only.
- One opacity: 1. No faded second layer to fake depth.
- Straight lines, circles, and arcs centred on the grid. If a shape needs a
  bezier to read, simplify the metaphor instead.
- Direction of travel, where it matters, is a single arrowhead built from two
  straight strokes. The same arrowhead at the same size in every icon.

THE EIGHT
1. hill-start       an incline, the car holding position then pulling away
2. side-parking     reversing into a bay at the side of the road
3. parallel-parking entering a gap between two vehicles along the kerb
4. three-point-turn reversing direction in three movements
5. s-curve          an S-shaped narrow lane, driven forward
6. z-curve          a Z-shaped lane with sharp angled turns
7. ramp-test        stopping on a ramp and moving off without rolling back
8. road-merging     joining a main carriageway from a slip road

BANNED — these are the tells that make a set look machine-made
rounded caps or joins; gradients; glows; drop shadows; bevels; 3D or
isometric projection; perspective; sparkles or stars; motion lines and speed
whooshes; mixed fill-and-stroke; varying stroke weight; cartoon cars; cones
or bollards as decoration; any second colour.

METHOD — this matters more than the spec
1. Before drawing, write one line per icon naming the shape you will draw.
   If you cannot describe it in three words, the metaphor is wrong. Fix it
   before drawing.
2. Draw all eight in ONE pass. Producing them one at a time is what makes
   stroke weights and metaphors drift apart.
3. Reuse geometry. The kerb line, the bay, and the arrowhead are the same
   shapes at the same sizes wherever they appear.

SELF-CHECK before output
- At 16px, does any icon collapse into mush? Simplify it.
- With labels covered, is each of the eight distinguishable from the other
  seven by silhouette alone? s-curve and z-curve are the risk — make the
  z-curve's corners unmistakably angular.
- Does any icon need colour to be understood? It must not.

OUTPUT
Raw SVG markup per icon, in one code block per icon, named by maneuver id.
No wrapper element, no <title>, no id attributes, no inline styles, no
comments. Only viewBox, stroke attributes, and paths.
```

### Why these constraints

`butt` caps and `miter` joins do the heavy lifting. Every default icon library
ships rounded terminals, so rounded terminals are what "generic" looks like —
and they contradict `--r-bay: 0px` and the painted-line grammar. Hard ends are
both more specific to this product and less like everything else.

The same block works for any other custom icon: swap the eight-item list and
the "THE IDEA" paragraph, keep the spec, the ban list, and the method.

---

## Prompt — motion

```text
You are adding motion to DriveMy, a Malaysian JPJ driving-theory app. Every
authenticated screen is an Operate surface: the learner is inside a task and
the interface should disappear. The landing page is the only Persuade surface.

BEFORE ANIMATING ANYTHING
Name which job the motion does: feedback, orientation, continuity, or one
deliberate delight moment. If it does none of them, do not animate it. Say so
and stop.

THE FREQUENCY RULE
The more often it plays, the shorter and subtler it must be. A control touched
fifty times a session gets about 100ms of opacity or colour. A once-ever moment
can afford 500ms and real choreography. Never animate keyboard-initiated
actions — they repeat constantly and motion makes them feel slow.

HARD CONSTRAINTS
- transform and opacity only. Never height, width, top, left, margin, or
  padding: they force a layout recalculation every frame.
- No page-load sequences, no entrance staggers. This product loads into a
  task, not an intro.
- Motion is state feedback. It fires when something actually changed, not on
  every visit or mount.
- Never scale to 0 — elements vanishing into a point look like a bug. Use
  scale(0.95) with opacity 0.
- UI interactions finish under 500ms. Nothing loops without a way to stop it.
- prefers-reduced-motion: reduce leaves ZERO elements animating, not "less".
  Gate JS animations on matchMedia rather than starting them and hoping.
- Focus stays visible for the whole animation, and text holds its contrast
  ratio at every frame, not only the last one.

BANNED
spring bounce on anything routine; confetti; particle bursts; shimmer
skeletons; floating or levitating idle motion; parallax; rotating loaders on
fast operations; anything that asks for attention twice.

OUTPUT
Plain CSS transitions or keyframes wherever they can do the job. Reach for a
library only if CSS genuinely cannot express it, and say why. No Lottie, no
video, no GIF.

SELF-CHECK
Interrupt it halfway: does it retarget smoothly or snap? Throttle the CPU 6x:
does it hold frame rate? Count the elements in motion at once — more than two
or three and they compete.
```

The `web-animation` skill carries the general craft (timing tables, easing,
technology selection). These are the project-specific overrides.

---

## Icon weight rule

`phosphor-react` is used at three weights, and inspection showed the mix is
principled rather than careless. It is written down here so it stays that way:

- **`regular`** is the default and covers everything not named below.
- **`fill`** marks a resolved state or a primary trigger — `CheckCircle` and
  `XCircle` on a graded answer, `Warning`, `Play`, `Lightning`. Filled means
  "this has happened" or "this starts the thing".
- **`bold`** is optical compensation for small or thin glyphs only: the 12px
  `Check` inside a checkbox, the `Minus`/`Plus` on a slider, the 16px
  `ArrowRight` beside a strong label. Do not use it at large sizes.

A fourth weight, or `fill` used decoratively, is drift.

## Asset state

Cleaned up 2026-08-09. Current state:

| Item | Result |
|---|---|
| Wikimedia error HTML saved with image extensions | 74 deleted |
| Unreferenced JPEG-as-PNG duplicate signs | 10 deleted |
| Template leftovers (`hero.png`, `react.svg`, `vite.svg`, `public/icons.svg`) | deleted |
| Misnamed sign files whose content contradicted the filename | 6 pairs renamed |
| `signs/svg/` (which held PNGs) and `signs/real/` | collapsed to `signs/` + `signs/photos/` |

Every sign in `src/assets/signs/` was opened and checked against its filename
before renaming. `stop.png` is the BERHENTI octagon; the English "STOP" variant
that was also present has been deleted, because Malaysian stop signs read
BERHENTI.

**Unverified:** the photographs in `src/assets/signs/photos/` that
`TheoryPage` does not import have not been checked one by one. One of them was
proven wrong — a file named `stop.jpg` held a photograph of a No U-Turn sign,
now renamed. Assume the rest are suspect until opened. Do not wire a photo
into a question without looking at it first.

**Format:** six signs exist as both `.png` and `.svg`; the PNGs are what
`TheoryPage` imports. Three signs (`no-horn`, `speed-60`, `end-of-restriction`)
have no SVG. Sourcing those three would let the whole set move to SVG, which is
the right format for flat signage — sharper at every size, and smaller.
