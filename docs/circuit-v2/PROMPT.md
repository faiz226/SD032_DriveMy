# Circuit v2 — builder brief (round 1)

Given to the builder model (Sonnet) on 6 Oct 2026. The orchestrator (Opus) audits every
round against the bar and sends back one gap at a time; verdicts are in `AUDIT.md`.

---

Draft a new practice circuit for DriveMy, a browser JPJ (Malaysia) car-licence simulator played
on phones in landscape, first person, in a right-hand-drive Suzuki Swift. Traffic keeps left.

Why: the last circuit was a trace of the real ARM Driving Institute yard, and players found it
narrow and disorganised: no single route, stations scattered, and its S-bend channel was built
2.6 m wide when the real one measures about 3.3 m.

The bar is real and on disk, in this worktree:

- `bar/circuit/reference_aerial_grid.png`: drone photo of the real ARM circuit. The frame is
  about 120 m across (about 0.094 m per pixel, ±5%).
- `bar/circuit/reference_plan_view_only.png`: its blueprint. Its dimension strings are
  unreliable; see `bar/README.md`.
- `docs/circuit-v2/prd-excerpt.md`: the eight exercises' rules, the car, and every current
  number with its status. Its "port the v1 trace" plan is the thing being replaced.

What good looks like:

1. **Organised.** One obvious one-way route from a start apron through the eight exercises in
   order (Hill Start, Side Parking, Parallel Park, 3-Point Turn, S-Curve, Z-Curve, Ramp Test,
   Road Merging) and back. A first-timer can follow it without a map. The route never runs
   through another exercise's station, and no two stations overlap.
2. **Real.** Each station is recognisably the real one in the photo, and never narrower than
   the real one measured there.
3. **Roomy.** Every lane fits the car's swept path at the tightest radius the route asks of it,
   with the clearance stated.
4. **Possible.** Each exercise can be done with this car exactly as the rules define it: for
   example, a three-point turn works in three movements and not in one arc, and each bay
   accepts the car within its heading limit.
5. **Cheap.** Flat ground, kerbs, grass islands, the two slopes, a few booths. It also becomes
   the in-game top-down map, so it must read at about 400 × 200 px.

Never invent a JPJ rule or figure. Every number is measured off the photo, taken from the PRD
excerpt, derived from the car, or labelled "unverified, pending ARM review".

Deliver in `docs/circuit-v2/`: the circuit as one data file in metres (the single source of
truth, with the car read from a config so it can be swapped), a top-down drawing generated from
that file (PNG and SVG), a script that checks points 1–4 from the data and prints the results,
and a one-page README (the route, a table of every station with its numbers and each number's
source, and what is unverified). Write nothing outside that folder.

I will audit your drawing and data against the photo myself and send back the single biggest gap.
