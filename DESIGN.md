---
name: DriveMy
description: A JPJ licence trainer drawn as a Malaysian expressway at night, where the learner drives toward their P licence.
colors:
  road-yellow: "#F2B705"
  road-yellow-ink: "#8F6500"
  sign-ink: "#111111"
  expressway-green: "#0A7A45"
  expressway-green-deep: "#08683C"
  information-blue: "#0A5FBF"
  plate-red: "#C8102E"
  vms-amber: "#FFB000"
  asphalt: "#050F1A"
  marking-white: "#F7F5F0"
  night-sky: "#051627"
  night-card: "#0C2236"
  night-ink: "#F3F8FC"
  night-muted: "#9DB6C9"
  night-line: "#22405D"
  day-sky: "#E8F0F7"
  day-card: "#FFFFFF"
  day-ink: "#0B1A2A"
  day-muted: "#455F77"
  day-line: "#D3DEE8"
  pass-green: "#0F7344"
  fail-red: "#C42634"
typography:
  display:
    fontFamily: "Overpass Variable, system-ui, sans-serif"
    fontSize: "clamp(6.5rem, 19vw, 13.75rem)"
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "Overpass Variable, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Overpass Variable, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Overpass Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Overpass Variable, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 800
    lineHeight: 1.4
  vms:
    fontFamily: "DotGothic16, monospace"
    fontSize: "clamp(1.625rem, 4vw, 2.625rem)"
    fontWeight: 400
    lineHeight: 1.2
rounded:
  plate: "9px"
  control: "12px"
  tile: "16px"
  vms: "18px"
  panel: "20px"
  hero: "24px"
  pill: "9999px"
spacing:
  gutter: "16px"
  gutter-wide: "24px"
  panel-gap: "24px"
  layout-width: "1120px"
components:
  button-primary:
    backgroundColor: "{colors.night-ink}"
    textColor: "{colors.night-sky}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 20px"
  button-brand:
    backgroundColor: "{colors.road-yellow}"
    textColor: "{colors.sign-ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 20px"
  button-outline:
    backgroundColor: "{colors.night-card}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.control}"
    height: "44px"
  vms-action:
    backgroundColor: "{colors.day-card}"
    textColor: "{colors.sign-ink}"
    rounded: "{rounded.control}"
    height: "56px"
    padding: "0 32px"
  panel:
    backgroundColor: "{colors.night-card}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.panel}"
  gantry-sign:
    backgroundColor: "{colors.expressway-green}"
    textColor: "{colors.day-card}"
    rounded: "{rounded.hero}"
  vms-board:
    backgroundColor: "#050504"
    textColor: "{colors.vms-amber}"
    rounded: "{rounded.vms}"
    padding: "28px 40px"
  pill:
    textColor: "{colors.night-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: DriveMy

## Overview

**Creative North Star: "Susur keluar"**

A susur keluar is the slip road off a Malaysian expressway. DriveMy is drawn as that expressway at night: the learner is on the road, the interface is the dark carriageway and sky, and everything worth reading is signage. The overhead gantry tells them how far they are from their P licence, the variable message sign tells them what to do next, a yellow hatchback drives along a road of lit cat's eyes to their score, and the modules are lanes at a toll plaza they drive through. Night is the signature theme and the default; day is a clear sunrise version of the same road, one tap away in the header.

The look is premium because it is specific. Every saturated colour on screen is a real road object: expressway green for the gantry, road-marking yellow for progress and action, VMS amber for the next step, L-plate red for the plates. The chrome around them stays quiet navy or pale sky so the signs carry the meaning. Motion belongs to the road: the car drives to the score and idles with its engine on, the studs light up one after another, the barrier lifts as you drive into a lane. All of it settles to its final state instantly under reduced motion.

The learner is busy, often on a phone, and preparing for a government test. Copy is plain and honest ("Not a JPJ record"), numbers are concrete, and the whole app works in English and Bahasa Malaysia as equals.

**Key Characteristics:**
- Night expressway by default, sunrise day theme with the same objects.
- Signage carries content; chrome stays neutral and recedes.
- One road yellow for progress and action, always with dark ink on it.
- Real Malaysian road furniture: gantry sign, VMS, cat's eyes, toll plaza, L and P plates.
- Overpass throughout, a dot-matrix face only on the VMS.
- Motion with a physical cause, nothing animated for show, nothing left running except the idling car.

## Colors

A deep navy night with three road colours doing all the talking, and a pale sky by day.

### Primary
- **Road Yellow** (#F2B705): progress and action. The lit cat's eyes, the car, active tab, primary brand buttons, selected answers, progress fills below the pass line. Always paired with Sign Ink text when it is a fill.
- **Road Yellow Ink** (#8F6500 by day; Road Yellow itself at night): the same yellow when it has to be text or an edge on a light surface, at 5.2:1 on white.

### Secondary
- **Expressway Green** (#0A7A45, deepening to #08683C): the gantry sign and nothing else structural. The sign is lit from the front, so its gradient starts at #0A8049 to keep white text at 5:1 or better.

### Tertiary
- **Information Blue** (#0A5FBF): JKR information signs, the honesty note, info chips and the blue lane board.

### Neutral
- **Night Sky** (#051627): the page at night, behind a fixed sky layer with stars, a green glow overhead and the last orange of sunset low on the right.
- **Night Card** (#0C2236): panels and tiles at night, with a faint blue street-light sheen across the top.
- **Night Ink** (#F3F8FC) and **Night Muted** (#9DB6C9): text at night; muted holds 8.4:1 on a card.
- **Night Line** (#22405D): borders and dividers at night.
- **Day Sky** (#E8F0F7), **Day Card** (#FFFFFF), **Day Ink** (#0B1A2A), **Day Muted** (#455F77, 6.6:1 on white), **Day Line** (#D3DEE8): the same roles by day.
- **Asphalt** (#050F1A) and **Marking White** (#F7F5F0): the road itself and its paint.

### Signal
- **Pass Green** (#0F7344 by day, #3DD68C at night): passed, done, target reached.
- **Fail Red** (#C42634 by day, #FF6B6B at night): failed, below the pass mark, destructive actions.
- **Plate Red** (#C8102E): the L on the L-plate, class signs, the height-limit bar and barrier stripes.
- **VMS Amber** (#FFB000): the variable message sign's dot matrix and the in-progress lane light, nowhere else.

### Named Rules
**The Signage Rule.** Saturated colour appears only as a road object or a state. If it is neither signage nor status, it is navy, sky or white.

**The Ink-on-Yellow Rule.** Yellow never carries light text. A yellow fill gets Sign Ink (#111111); yellow text on a light surface uses Road Yellow Ink.

## Typography

**Display Font:** Overpass Variable (with system-ui)
**Body Font:** Overpass Variable (with system-ui)
**Label/Mono Font:** DotGothic16 for the VMS only; JetBrains Mono Variable for code

**Character:** Overpass is an open interpretation of the highway sign alphabet, so the whole app speaks in road-sign letterforms, from the gantry's giant figure to a chip label. DotGothic16 is the dot-matrix voice of a variable message sign and is kept for exactly that.

### Hierarchy
- **Display** (900, clamp(6.5rem, 19vw, 13.75rem), 0.8, -0.05em, tabular): the points-to-go figure on the gantry. One per screen.
- **Headline** (800, 1.875rem rising to 2.25rem at 768px, 1.2, -0.02em): page titles, balanced wrapping.
- **Title** (800, 1.5rem rising to 1.75rem, 1.2): section titles such as "Pick a lane" and "Scoreboard".
- **Body** (400, 1rem, 1.5 for UI and 1.625 for running text): descriptions and notes, pretty wrapping, around 65ch at most.
- **Label** (600 to 800, 0.8125rem): chips, metadata, axis numbers. Sentence case; no tracked uppercase eyebrows.
- **VMS** (DotGothic16 400, clamp(1.625rem, 4vw, 2.625rem)): the next step's title on the message sign.

### Named Rules
**The One Matrix Rule.** DotGothic16 appears only inside the VMS board. Anywhere else it is a costume.

**The Sentence Case Rule.** Headings, buttons and labels are sentence case in both languages; real JPJ terms (KPP, RPK, RSM, litar) stay as they are.

## Layout

Content sits in a centred column 1120px wide with a 16px gutter, 24px from 768px up. The sticky glass header is 72px tall. From 1024px it carries a one-line pill navigation with five groups; below 1024px a glass tab bar fixed to the bottom carries the same five groups, and groups with several pages open a bottom sheet. The main area pads its bottom so the tab bar never covers content. A timed exam removes both header and tab bar.

The dashboard reads top to bottom like a drive: greeting, the gantry sign, the VMS with the next step (right under the sign, so a phone shows it after one short scroll and a 1440x900 screen shows it without scrolling), the road with the car, the toll plazas, the scoreboard, the travel log, and the honesty note. Under 768px each toll plaza keeps its full width and slides sideways, with the plaza name riding along at the left edge.

## Elevation & Depth

At night depth comes from light, not shadow: small shadows switch off and only lifted surfaces (popovers, dialogs, hovered tiles) get a deep black drop. Glow is reserved for things that emit light in a real road scene. By day, surfaces use soft navy-tinted shadows, while the road objects keep their own lights.

### Shadow Vocabulary
- **Resting** (`0 1px 2px rgb(11 26 42 / 0.05), 0 4px 12px -4px rgb(11 26 42 / 0.1)` by day, none at night): panels at rest.
- **Lifted** (`0 2px 4px rgb(11 26 42 / 0.05), 0 18px 30px -14px rgb(11 26 42 / 0.28)` by day, `0 18px 30px -14px rgb(0 0 0 / 0.7)` at night): hovered tiles, menus.
- **Sign illumination** (`0 0 90px rgb(18 170 100 / 0.45)`): the gantry sign's floodlight.

### Named Rules
**The Light-Source Rule.** A glow needs a lamp: sign illumination, the VMS, cat's eyes, lane lights, the car's headlight. Buttons and cards never glow.

## Shapes

Controls are 12px, tiles 16px, panels 20px, and the big road objects (gantry sign, road, toll plaza) 24px. The VMS frame is 18px. Chips are full pills. Real-world objects keep their real geometry: L and P plates are 9px-cornered squares, the class sign is a 4px-cornered plate, studs are circles, and the hatchback is drawn from the side.

## Components

### Buttons
- **Shape:** gently rounded (12px), 44px tall by default, 36px small, 52px large.
- **Primary:** ink, like a car's start button: Day Ink with white text by day, Night Ink with Night Sky text at night.
- **Brand:** Road Yellow with Sign Ink, for the one forward action in a view.
- **Outline / Ghost / Link:** card-coloured with a line, transparent, or Road Yellow Ink underlined text.
- **Hover / Focus / Press:** colour shifts in 200ms; press scales to 0.97; focus draws a 2px ring in Road Yellow (Road Yellow Ink by day), offset 2px from the button.
- **Everything else focusable:** a 2px Road Yellow outline outside a 2px ink ring, so it reads on the sky, a white card and the green sign.

### Chips
- **Style:** a tinted lozenge (muted, yellow, green, red or blue at about a quarter strength) with ink text at weight 800, so every tone keeps full contrast in both themes. An optional 14px icon leads the label.

### Cards / Containers
- **Panel:** 20px corners, Night Card or Day Card with the street-light sheen, a 1px line, resting shadow.
- **Tile:** 16px corners; lifts 2px on hover and presses to 0.985. States: selected (yellow tint with an ink edge), progress, done (green tint), fail (red tint), locked (transparent, muted).

### Inputs / Fields
- **Style:** 44px tall, 12px corners, a line border, label above, error text below.
- **Focus:** the border turns Road Yellow Ink with a soft ring of the same colour at 20%.

### Navigation
- **Header (1024px and up):** pill group; the active pill is solid ink with inverted text and slides between items. Language toggle, theme toggle and a yellow initials avatar with the account menu sit at the right.
- **Tab bar (below 1024px):** five icon-and-label tabs on glass; the active tab is Road Yellow Ink with a soft yellow lozenge behind the icon.

### Gantry Sign
The expressway green panel with a 5px green outer rim and a 4px white line inside it, on two grey posts. It holds the page title, the points-to-go display figure, the theory and practical split, and two plate rows: the L-plate for the KPP theory test and a dashed P-plate until the licence target is reached.

### VMS Board
A black board in an 18px bronze-brown frame with a dot-matrix mask: "Up next" label, the step title in DotGothic16 amber, one line of detail, and a white 56px action button ringed in amber.

### Journey Road
A 140px stretch of night road between two painted edge lines. Fifty cat's eyes light up to the score one after another; the yellow hatchback drives there in 1.1s with its nose lifting as it pulls away and exhaust puffs behind, then idles with a small engine shake. Tapping the car sounds the horn with a short road-safety line. The road is a labelled meter for assistive technology, and its P marker sits over 100.

### Toll Plaza
One plaza per group of three modules: a green tiled roof, a white gable with a fan window, and a dark fascia with the plaza name. Each lane has a white pipe frame with a red class sign, a numbered lane light (green when open or done, amber in progress), a blue, yellow or white lane board in the style of payment lanes but with no payment brands, the red and white 2.1 m height bar that never moves, a white notice board with the module's title, detail and status chip, and a barrier arm by the booth that swings upright on hover, focus or tap. A perspective approach road with lane arrows runs toward the viewer.

## Do's and Don'ts

### Do:
- **Do** take every colour, radius and shadow from the tokens in `src/index.css` and `tailwind.config.js`.
- **Do** import icons only from `src/components/ui/icons.tsx` (Hugeicons free set, stroke weight from the adapter).
- **Do** put Sign Ink (#111111) on every yellow fill.
- **Do** give every animated element a physical cause and a final state that reads the same with reduced motion.
- **Do** keep the honesty copy: readiness is practice, "Not a JPJ record".
- **Do** check both themes and the 375px, 768px, 1024px and 1440px widths before shipping a screen.

### Don't:
- **Don't** use the old Jalan system, its docs or its skill on this app.
- **Don't** put payment brand names or logos on the toll lane boards.
- **Don't** glow anything that is not a light source.
- **Don't** use DotGothic16 outside the VMS board.
- **Don't** use em dashes in interface copy.
- **Don't** add tracked uppercase eyebrows above section titles.
