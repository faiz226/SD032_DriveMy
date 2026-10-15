# Circuit v2: audit trail

## What happened

The plan was for a builder model (Sonnet) to draft the circuit from `PROMPT.md`, and for the
orchestrator (Opus) to audit each round against the bar, one gap at a time. The builder never
produced a round: it stopped on a usage limit three times, the last time before writing a file.
On 12 Oct, week 2 began and the owner asked for the planning to be finished so building could
start. The orchestrator then drafted the circuit itself and checked it with scripts.

**This audit is therefore not independent:** the drafter and the checker are the same model. Two
things offset that, without replacing an outside review:

- The yardstick below was measured before drafting started.
- `check.py` reads only `circuit.json`, not the generator.

A fresh-context critic comparing `stations-vs-real.png` and `circuit-plan.png` against the photo
is still worth running when the builder model is available again.

## The yardstick, measured before drafting

The photo measurements use `bar/circuit/reference_aerial_grid.png` at 0.0943 m per pixel (120 m
across the frame, ±5% per the PRD). The car is the PRD's Swift: 3.842 × 1.730 m, wheelbase
2.450 m, track 1.493 m, steer lock 0.62 rad. Equal overhangs are assumed, as v1 did.

| What | Value | How it was measured |
|---|---|---|
| Real S lane, kerb to kerb | 3.35–3.76 m (p10–p90), median about 3.6 m | Lane mask, thinned to a centreline, inscribed width along it; scanlines across the straight legs give 3.2–3.6 m |
| Real S shape | Two opposite bends of about 141°, at about 7.5 m and 7.1 m centreline radius | Curvature along the traced centreline |
| v1's S channel | 2.6 m | PRD; narrower than the real one |
| Real Z | Lane 3.9–4.0 m; jog 7.7 m corner to corner; legs about 7 m and 6 m; square outer corners; inner corners rounded about 1 m | Scanlines across the lower-middle block |
| Real lane beside the Z | 7.45 m | Scanlines; taken to be the three-point-turn lane (an inference) |
| Real station lanes between islands | about 5.85 m | Scanlines across the upper row |
| Real spine road | about 5.6 m | Scanlines |
| Real hill strip | about 26 × 4.5 m | Kerb lines at the top of the photo |
| Real parallel recesses | about 2.5 × 6.6 m and 3.1 × 5.9 m | Upper-left island; upper-row islands |
| Real lower-left station | Lane about 4.6 m with a 4.9 × 5.8 m recess | Lower-left block |
| Swift rear-axle radius at full lock | 3.43 m | wheelbase / tan(0.62) |
| Swift outer front corner at full lock | 5.33 m | This gives 4.92 m at the outer front tyre, close to Suzuki's 4.8 m kerb-to-kerb figure |
| Body swept width at full lock / 6 m / 8 m | 2.76 / 2.42 / 2.27 m | Steady-arc envelope |
| Bay heading limit for a 2.6 / 2.5 / 2.4 m bay | 13.9° / 12.2° / 10.5° | PRD formula |
| Three-point turn possible in three movements | Road 6.0 m and up (body inside the kerbs); 5.5 m and up (tyres only) | Kinematic search, 0.05 m margin |
| One-arc U-turn possible | Road about 9.75 m (tyres) or 10.0 m (body) | Same search |
| Reverse 90° into a 2.6 × 5.6 m bay | Possible from a 4.0 m aisle or wider | Kinematic search, bay boxed on three sides |
| Parallel park into a 6.4 × 2.4 m recess | Possible in one two-arc reverse from a 3.5 m road or wider | Kinematic search, recess kerbed on three sides |

## Verdict on the draft: passes, with the open items below

`check.py`: 42 of 42 (`check_report.json`). Against the brief's five points:

1. **Organised. Yes.**
   - It is one loop with every turn a left, and stations 1–8 come in order.
   - No route crossing, no overlap, and no station entered out of turn.
   - The closest gap between stations is 1.5 m, which is 3.2 px on the 400 × 200 map.
   - The narrowest lane is 7.7 px on the map.
2. **Real. Yes, for every station measured.**
   - S: 3.6 m lane, 141° bends at 7.5 m.
   - Z: 4.0 m lane, 7.7 m jog.
   - Three-point turn: 7.45 m.
   - Hill: 25.75 × 4.5 m.
   - Parallel recess: 6.6 × 2.5 m.
   - Reverse pocket: 4.9 × 5.8 m.
   - Roads: 6.0 m.
   - `stations-vs-real.png` sets each station beside the real one at the same scale.
3. **Roomy. Yes.**
   - Tightest tyre clearance: 0.45 m in the Z, 0.55 m in the S, and 1.0 m or more on every
     circulation road.
   - Tightest body clearance: 0.05 m in the Z, which is why the Z uses the real upper width of
     4.0 m (at 3.9 m the body overhung the kerb by 5 cm).
4. **Possible. Yes.**
   - Three-point turn: in three movements, but not in one arc (84–92° against the 148° needed).
   - Reverse into the bay in one full-lock arc, with the poles untouched.
   - Parallel park in one two-arc reverse.
   - The stop line sits on the up-slope.
   - The merge has 34 m to reach 15 km/h.
5. **Cheap. Yes.**
   - Two slopes, one kerb ring of 723 vertices.
   - A 145 KB data file.
   - Four booths, one office and two poles.

**The biggest remaining gap was the instructor's confirmation** of five things:

- the hill rise;
- the ramp-test structure;
- the three-point-turn lane;
- where the side-bay poles stand;
- whether body overhang over a kerb counts.

On 14 Oct the owner said no instructor is available, so all five were decided instead (Round 2,
below).

**Second is a human drive.** The roomy and possible checks use a kinematic driver and planners,
not a person on a phone in first person. The first in-game drive-through should confirm that the
S and Z feel right at walking pace on touch controls.

## Round 2 (14 Oct): the open items decided

The owner has no instructor or reviewer to ask, and asked for every open item to be decided.
What changed in the circuit:

- **Ramp test.** It was "the hill again". It is now a dead-end stub, 4.0 m wide:
  - a 6 m slope up to a 0.6 m platform;
  - a pole on the centreline, 0.4 m before the end wall;
  - the learner stops 0.2–1.0 m short of the pole, holds, and reverses out.

  The basis is a DA (auto) learner's account: the ramp is a cement block you drive up onto, with
  one pole in the middle that you must not hit. The dimensions are decided, not measured.
- **Side bay.** Four poles, one at each corner of the bay, 0.3 m outside the lines.
- **Bay rules.** Both bays now judge the car with its mirrors in (1.847 m wide). One learner
  account says the right mirror must be inside the box.
- **Hill.** A 0.6 m yellow stop band, centred on the 33% stop line.
- **Rule numbers** (times, windows, speeds, penalties) moved to `../v2-plan/rules.json`. This
  folder now holds only geometry.

`check.py` now has 45 checks, and all pass. The new ones:

- The whole stop band sits on the up-slope.
- The Swift reverses into the side bay with all four poles untouched and its mirrors inside.
- It parallel-parks with its mirrors inside the recess.
- The ramp:
  - It drives in and up with its tyres 0.70 m clear of the kerbs.
  - It stops 0.82 m short of the pole, inside the 0.2–1.0 m window.
  - It then reverses back out into the lane, facing on.

The site shrank to 122.9 × 93.0 m and the route to about 300 m, because the ramp is no longer a
long strip in line with the road.

## Round 3 (14 Oct): the map becomes the real yard

The owner showed the yard they wanted: the real ARM yard, drawn cleanly. The loop above kept the
real stations' sizes but rearranged them, so it no longer looked like the yard. The map is now
the yard itself:

- **Traced at the measured scale.** Every island, the roundabout, the yard edge, the hill strip,
  the Z and the S were read off the drone photo at 0.0943 m/px (`YARD-TRACE.md`). The roundabout
  and the curved edges were fitted to the kerb paint. `yard-vs-photo.png` draws our kerbs over
  the photo.
- **Stations at their real places.** Hill on the top strip; side parking in the bottom-left
  island's pocket; parallel parking in the top-left island's recess, with a painted 6.6 × 2.5 m
  box; the three-point turn in the lane beside the Z; the S and the Z in the bottom row.
- **The ramp.** The real yard has none. It stands on the open floor at the top right, in line
  with the hill, where the blueprint draws a structure.
- **One map for every level.** Each station carries a practice start point.
- **Checks for a yard.** The route may cross itself, but only inside the declared junctions (the
  middle road and the side-parking band's mouth). It breaks twice, where the car reverses into the
  side bay and turns round, so the driver is checked piece by piece. Lane widths are now measured
  on the built yard, not just read from parameters.
- **The three-point-turn lane re-read.** The trace puts it at 81 px between the Z and S blocks,
  7.64 m. Round 1's scanline read of 7.45 m is replaced; the two differ by 2 px, inside the
  photo's ±5% scale.

`check.py` now has 44 checks, and all pass. The site is 115 × 68 m of yard (126 × 84 m with the
grass margin) and the route is 581 m.

## Known limits of the checks

- The car is a kinematic bicycle model, with no tyre slip and no suspension. That is right for
  low-speed geometry, but not for physics feel.
- Clearance is sampled on a 5 cm raster, so values are ±0.05 m.
- Overhangs are assumed equal. The real Swift's front overhang may be a few centimetres longer.
  That would shave the Z's body clearance first.
- The manoeuvre planners try a fixed family of moves. A plan they cannot find might still exist,
  but every plan they do find is a real, collision-free one.
