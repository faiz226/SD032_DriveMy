# WP1: The rules engine, sim/core (about 1 day)

> **Historical: the brief WP1 was built from.** Since 20 Oct the yard has seven stations (no three-point turn), road merging at the roundabout, and
> other cars with a signalled junction. `RULES.md`, `rules.json` and `../circuit-v2/README.md` are current; where this file differs, they win.

Paste everything below the line into Claude Code started in
`C:\Users\ASUS\Documents\2026\SEM 2\FYP\FYP1 D-Day\SourceCode\SD032-sim-v2`. It can run at the
same time as WP2 and WP3 in separate sessions.

---

Build `src/sim/core`, the DriveMy v2 rules engine. It is pure TypeScript (no React, no three.js,
no Rapier), built against `src/sim/contracts.ts`.

**Read first:**

- `docs/v2-plan/RULES.md`: the decisions and why.
- `docs/v2-plan/rules.json`: the numbers.
- `docs/circuit-v2/README.md`: the circuit data.
- `docs/circuit-v2/prd-excerpt.md`: the PRD's exercise table and negative drives.

**What to build:**

- **`createSession(circuit, rules, car, mode, only?)`**, implementing `Session` from the contracts.
  - Every threshold, weight, time limit and window comes from `rules.json`. Every position comes
    from `circuit.json`. A number typed into the code is a bug.
  - `only` is a practice drill of one station. `restartStation(id)` returns that station's
    `start` from `circuit.json`: the car is moved there, and nothing reloads.
- **Progress along the route.** Track the car's distance along `route.samples` as the nearest
  sample ahead of the last one (search a short window forward). The route crosses itself on the
  middle road and jumps where the car reverses into the side bay and turns round
  (`route.manoeuvres`); a nearest-sample search over the whole route would get both wrong.
- **Session flow.**
  - Only the current station is armed. Stations arm in order 1–8, and driving through a later
    station does nothing to it.
  - A station ends cleared or failed. It fails if its time runs out, if the car passes it by, or on
    its own failure rule. The run then carries on to the next station.
  - The verdict passes only if all eight stations cleared and the demerits stay under the limit.
- **The eight station state machines,** exactly as RULES.md describes:
  - **Hill:**
    - The front tyres' contact points must be on the stop band.
    - Then a 2 s hold, still to within 5 cm, with the handbrake on.
    - Rollback is measured along the slope from the furthest-forward point since the last stop.
  - **Bays:**
    - Judged at the handbrake "done" signal: stopped with the handbrake on for 1 s.
    - The footprint includes the mirrors (`width_mirrors_m`).
    - The heading limit is `L·sin t + W·cos t ≤ width`.
  - **Three-point turn:** a movement is a run of 0.3 m or more in one direction, and the station
    fails when a fourth movement starts.
  - **S:** the speed band, with its 1.2 s grace.
  - **Z:** corner gates that wait while the car is too fast.
  - **Ramp:**
    - The stop window is measured from the front bumper to the pole.
    - Then the hold.
    - Then the reverse out past the mouth gate.
  - **Merge:** the finish speed.
- **Faults from events.**
  - Kerb contacts cost 5 each: once per contact, which ends after 0.5 s clear.
  - Pole and cone hits come from `SimEvent`s.
  - Rollback comes from `VehicleSample.slope`.
- **Fault records.** Each fault carries the station, the position, the measured value, the limit,
  an i18n reason key and a fix key, and the rule's basis string. Add the keys, in English and
  Malay, to the existing translation files.
- **Top-down use.** `step()` takes `topDownOn`. Add up the seconds it is on into
  `SessionState.topDownSeconds`, and copy the total into the verdict. It never costs points.
- **No manual pass.** Nothing outside `sim/core` may mark a run passed.
- **The old store.** Keep `src/stores/carStore.ts` working for the old screens, but give `DEMERIT`
  `KERB: 5` and read the weights from `rules.json`.

**Tests** (vitest, headless). Build traces of `VehicleSample`s by driving a simple kinematic car
(a bicycle model with the Swift's numbers from `docs/circuit-v2/car-swift-2022.json`) along
`route.samples` and the station geometry.

- **For each station,** a positive drive that clears.
- **Negative drives,** each seen failing before you fix anything:
  - Cross every later station early, then complete each in turn.
  - Park straight but just outside the bay; 3° past the heading limit; with one mirror outside.
  - Roll back 0.29, 0.30 and 0.31 m.
  - Drive over the hill without stopping.
  - Stop on the band without the handbrake.
  - Do the three-point turn in one arc, and in four movements.
  - Take the S at 25 km/h.
  - Take a Z corner at 15 km/h, then at 10 km/h.
  - Stop 0.15 m and 1.10 m short of the ramp pole.
  - Touch the pole.
  - Merge at 10 km/h.
  - Stop for 3 s beside a station that is not current. This must cost nothing.
  - Let each time limit run out.
- **How to test:**
  - Each penalty in a separate attempt.
  - Every threshold just below, at, and just above its limit.

**Done when:**

- `npm test` passes with all of the above, and `npm run build` passes.
- One test drives all eight stations in order with no faults, and the verdict passes.
- One test makes one fault of each kind, and the verdict lists each with its basis.
- One test keeps the top-down view on for 3 s, and the verdict reports 3 s with no demerits.

**Report:**

- The test list, with pass or fail.
- Anything in RULES.md you found ambiguous, and how you resolved it. Resolve it yourself; don't
  stop to ask.
