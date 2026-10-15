# DriveMy practice yard

The map is the real ARM Driving Institute yard in Kota Kinabalu, traced off the drone photo at
its measured scale and drawn cleanly. Every practice level uses this one map; only the place the
car starts changes. The assessment is one route through the eight stations in test order.

![Yard plan](circuit-plan.png)

How the trace sits on the real yard (red: our kerb lines; blue: the route):

![Yard over the photo](yard-vs-photo.png)

The in-game map, at 400 × 200 px: ![Minimap](circuit-minimap.png)

This replaces two earlier attempts. v1 traced the yard by hand and got it wrong: its layout
overlapped the real one by only 19%, and its S lane was 2.6 m against a real 3.6 m. The first v2
draft rearranged the real stations into a loop, which no longer looked like the yard. The
loop draft is kept in `archive-loop/`.

## The route

Start in the apron at the top left, facing east. Then:

1. **Hill:** east over the strip along the top of the yard.
2. **Side parking:** down to the bottom left, west along the band, reverse into the pocket, then
   drive out.
3. **Parallel park:** north up the lane beside the top-left island; the recess is on your left.
4. **Three-point turn:** east along the top, south through the STOP crossing into the lane
   beside the Z, turn round, come back north.
5. **S-curve:** east along the middle road, then south through the S.
6. **Z-curve:** west along the bottom road, then north through the Z.
7. **Ramp:** east along the middle road, north up the lane by the right-hand islands; the ramp is
   on your right.
8. **Road merging:** east along the top lane, then build speed down the east road to the finish.

The route is 581 m and crosses itself only on the middle road and at the mouth of the
side-parking band, as a real yard does. It breaks twice: where the car reverses into the side
bay and where it turns round in three movements (`route.manoeuvres`).

| # | Station | Route s (m) | As built | Basis |
|---|---|---|---|---|
| 1 | Hill Start | 10–41 | Strip 25.75 × 4.5 m with kerbed walls: up 10.8 m, flat 4.15 m, down 10.8 m. Rise 1.3 m (12%). Yellow stop band 0.6 m long at a third of the rise. | Photo (strip 26.6 × 4.6 m); PRD lengths; rise and band decided |
| 2 | Side Parking | 131–163 | Pocket 4.72 × 5.78 m off a 4.58 m band. Painted bay 2.6 × 5.6 m, four poles 0.3 m outside its corners. | Photo (pocket and band); bay and poles decided |
| 3 | Parallel Park | 185–201 | Recess 6.6 × 3.77 m on the lane's west side, with a painted box 6.6 × 2.5 m against its kerb. Heading limit 10.2°, mirrors included. | Photo (recess); box decided |
| 4 | 3-Point Turn | 267–284 | The 7.64 m lane beside the Z, south of the STOP crossing. | Photo (lane), decided to be the three-point-turn lane |
| 5 | S-Curve | 304–347 | Lane 3.6 m. Two opposite 141° bends at a 7.5 m centreline radius, 3 m straights at each end. | Photo (real S) |
| 6 | Z-Curve | 397–424 | Lane 4.0 m, driven north. Jog 7.73 m between the legs. Square outer corners, inner corners rounded 1 m. | Photo (real Z) |
| 7 | Ramp Test | 482–493 | 4.0 m wide on the open floor at the top right, in line with the hill: a 3 m run-in, 6 m up to a 0.6 m platform (10%), a 7 m platform to an end wall. The pole stands on the centreline 0.4 m before the wall. | The real yard has no ramp; the blueprint draws a structure here. Dimensions decided |
| 8 | Road Merging | 523–574 | The east road, 6.5 m wide; the finish is 50 m down it. No traffic. | Design; no traffic (simulator simplification) |

Exact `s` values are in `circuit.json`.

**Practice start points.** Each station carries `start` (`at`, `heading_deg`): a spot on the route
8 m before the station. Choosing a practice level puts the car there. The map is loaded once.

## What the checks prove

`python check.py` reads only `circuit.json`, the car config and `../v2-plan/rules.json`, and exits
0 only if every check passes. The latest run is 44 of 44 (`check_report.json`).

- **Organised.**
  - The stations come in order along one route.
  - The route crosses itself only inside the declared junctions.
  - No two stations overlap, and the route enters each only on its own turn.
  - Every station and lane stays visible on the 400 × 200 px map.
- **Real.** Measured on the built yard's 5 cm check grid: the S lane 3.51 m (real 3.35–3.76 m), the
  Z lane 3.91 m (real 3.9–4.0 m), the three-point-turn lane 7.50 m (real 7.64 m; the cut lane is
  7.60 m, and the grid reads about 0.05 m short on each side). The hill, the recess and the
  pocket match their real sizes.
- **Roomy.** A pure-pursuit driver steers the Swift through every driven piece of the route.
  - Tyres stay at least 0.35 m from every kerb inside a station, and 0.55 m on the roads between.
  - The Swift's body overhangs a Z kerb by 5 cm at one corner; overhang is not a fault.
- **Possible.**
  - **Three-point turn:** done in three movements, but impossible in one arc.
  - **Side bay:** one full-lock reverse arc, mirrors inside the lines, all four poles untouched.
  - **Parallel box:** one two-arc reverse, mirrors inside.
  - **Hill:** the whole stop band sits on the up-slope.
  - **Ramp:** in and up with the tyres 0.60 m from the walls; it stops 0.81 m short of the pole,
    inside the 0.2–1.0 m window; then it reverses back out into the lane, facing on.
  - **Merge:** 50 m to reach 15 km/h.
  - **Practice:** every station's start point is on the road, clear of the kerbs.
- **Cheap.** Flat ground plus two slopes; 18 kerb rings, 947 vertices; a 134 KB data file; four
  booths, one office and five poles.

## Files

| File | What it is |
|---|---|
| `circuit.json` | The single source of truth the game loads (format below) |
| `generate.py` | Writes `circuit.json` from the traced outlines and the parameter table at its top. Change numbers there, never in `circuit.json` |
| `YARD-TRACE.md` | The pixel outlines read off the drone photo, and how |
| `check.py` | The checks above. `--car other.json` re-runs them for another car |
| `render.py` | Writes `circuit-plan.png` and `.svg`, `circuit-minimap.png` and `yard-vs-photo.png` |
| `lib_geom.py` | The car model (bicycle kinematics), the raster clearance field and the manoeuvre planners |
| `car-swift-2022.json` | The PRD's Swift dimensions, plus two stated assumptions |
| `AUDIT.md` | The yardstick, the verdicts, and why the map changed |
| `archive-loop/` | The loop draft this replaced |
| `PROMPT.md`, `prd-excerpt.md` | The original builder brief and its PRD snapshot |

Regenerate after any change:

```bash
python docs/circuit-v2/generate.py && python docs/circuit-v2/check.py && python docs/circuit-v2/render.py
```

## circuit.json format

- **Frame.** Metres, with x east, y north and z up. Photo pixel (px, py) is at
  x = px × 0.0943, y = (750 − py) × 0.0943. In three.js, use `X = x, Y = z, Z = -y`; car yaw equals
  the heading.
- **`site.bounds`** is `[x0, y0, x1, y1]`. The ground is grass everywhere except the pavement.
- **`pavement`** and **`kerbs.rings`** are the same rings, read even-odd: ring 0 is the yard's edge,
  and every other ring is a hole (an island, or a thin wall along the hill and the ramp). Build
  the pavement mesh from them with holes.
- **`kerbs`** gives `height` 0.13 and `width` 0.20. The kerb sits on the grass side of each ring.
- **`slopes`**: `hill` (heading east along the strip) and `ramp` (heading east from its foot).
  Each has `start`, `heading_deg`, `width` and a `profile` of `[along, z]` points, with solid
  side walls and kerbs on the deck edges.
- **`stations`** are in `order` 1–8, each with `s_from`, `s_to`, `gates` and a practice `start`.
  Per station:
  - **hill-start:** `slope`, `stop_line_height`, `stop_band`.
  - **side-parking:** the `pocket` and the painted `bay` (`centre`, `axis_deg` from the back to the
    mouth, `length`, `width`).
  - **parallel-parking:** the recess as `pocket` and the painted box as `bay`.
  - **three-point-turn:** the turning `box`: corner 0 to 1 runs across the lane, 0 to 3 the way in.
  - **s-curve** and **z-curve:** gates; the Z also has `legs` and `fillets`.
  - **ramp-test:** the `box`, the `pole`, and the `axis` (the slope's foot and heading), with gates
    `mouth` and `platform`.
  - **road-merging:** the `finish` gate.
- **`junctions`**: the polygons where the route may cross itself.
- **`route.samples`** has columns `[s, x, y, heading_deg, width, tag]`, one row every 0.25 m.
  **`route.manoeuvres`** lists the two places the line jumps, with `s_from`, `s_to` and a note.
  Track progress along the route by the nearest sample ahead of the last one, so the jumps and
  the crossings never confuse it.
- **`obstacles.poles`** gives `station`, `at`, `radius`, `height`, an optional `base_z` (the ramp
  pole stands on the 0.6 m platform), and `status`.
- **`props`** holds the booths and the office as boxes, and the fence.
- **`spawn`** gives `at`, `heading_deg` and `handbrake`.
- **`parameters`** lists every number with its `source` (photo, PRD, car, design or decided) and a
  note.

## Decided on 14 Oct (no instructor available)

Each of these has its reasons in `../v2-plan/RULES.md`:

- The map is the real yard, not a rearrangement of its stations.
- The 7.64 m lane beside the Z is the three-point-turn lane.
- The hill rise stays at 1.3 m (12%).
- The ramp stands on the open floor at the top right, where the blueprint draws a structure; its
  dimensions are decided.
- The side bay is painted 2.6 × 5.6 m with four corner poles; the parallel box is painted
  6.6 × 2.5 m inside the real recess.
- Mirrors count in both bays. Body overhang over a kerb is not a fault.

Two figures remain assumptions, stated in the car config: the tyre width (185 mm) and equal
front and rear overhangs.
