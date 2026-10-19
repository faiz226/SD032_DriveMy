# DriveMy v2: build log

What each work package built, how it was checked, and every decision taken on the way. Newest
last. The report draft (WP6) is written from this file.

## WP0 (15 Oct): the workspace

- **Worktree** `SD032-sim-v2` on branch `feat/sim-v2`, made from `fc6d22e`.
- **The owner's in-progress work** was copied in and committed as a snapshot:
  - the 18 modified files;
  - the untracked tests, one UI component, one migration, the design docs and `skills/`.
- **Left in the main folder only:** `.claude/`, `3D Assets/`, `Blender/`, `Measurement/`,
  `RiggedSwift.blend`, `reports/` and the Blender logs. They are large binaries and generated
  output, which do not belong in git.
- **`.env.local`** was copied across (git ignores it), so the tests that need Supabase settings run.
- **Checks:**
  - the build passes;
  - all 140 tests pass;
  - `check:circuit` passes 44 of 44;
  - `check:car` meets every target.
  - The main folder's `git status` is unchanged.
- **Skipped:** the empty `index.ts` placeholder for each module. Each module gets its files when its
  package is built.

## WP1 (15 Oct): the rules engine

**What was built:**

- `src/sim/core/session.ts`: `createSession`, the eight station rules, the faults and the verdict.
- `src/sim/geom.ts`: the shared geometry, including the indexed kerb test.
- `src/sim/data.ts`: imports `circuit.json`, `rules.json` and the car file.
- **The old score store** (`carStore.ts`) now reads its weights from `rules.json`, and gains `KERB: 5`.
- **Text:** 22 new keys, a reason and a fix for each fault, in English and Malay.

**Tests.** There are 71 in `src/sim/core/session.test.ts`, and all pass. They are driven by a kinematic
Swift (`testkit.ts`): a bicycle model that produces 60 Hz samples.

| Group | Covers |
|---|---|
| Assessment run | All eight stations with no faults (pass). No input never passes. 3 s of top-down view is reported and costs nothing. One fault of each kind (each with its basis, measured value and fix). Later stations crossed early do nothing. Thresholds come from `rules.json`. |
| Hill | A clear stop. Driven over. No handbrake. Short of the band. Holds of 1.95, 2.0 and 2.05 s. Creeping 0.04 and 0.06 m. Rollbacks of 0.29, 0.30 and 0.31 m. The time limit. |
| Side parking | A clear park. Off centre by 0.36, 0.3765 (on the line), 0.40 (one mirror out) and 0.50 m. 0.3° inside and 3° past the heading limit. A pole touch. A handbrake held 0.98 and 1.0 s. Driven out without "done". The time limit. |
| Parallel | A clear park. Half a metre out into the lane. |
| Three-point turn | Three movements. One arc. Four movements. Reverses of 0.29 and 0.31 m. 147° and 149° turned. 7 then 6 km/h. The time limit. |
| S-curve | 10 and 18 km/h. 25 km/h in an assessment (fails). 25 km/h in practice (void, then the restart clears). 1.1 and 1.3 s at 19 km/h. A stop. The time limit. |
| Z-curve | 8, 10 and 12 km/h. 15 km/h (does not clear). 12.5 km/h, then slowing (clears). The time limit. |
| Ramp | A clear run. Gaps of 0.15, 0.19, 0.2, 1.0, 1.01 and 1.1 m. A pole touch. A 0.31 m rollback. The time limit. |
| Merge | 14.9, 15 and 20 km/h. A slow finish in practice, then a retry. |
| Kerbs, drills, old store | One contact counted once. A new contact after 0.5 s clear. `restartStation`. The old store's weights. |

**Decisions.** These are the places where RULES.md was ambiguous. Each is resolved, and written back
into RULES.md and `rules.json`.

1. **Three-point turn speed.** It clears during the third movement at 6 km/h or slower. The PRD's
   3 km/h assumed v1's manual car; the automatic Swift creeps at 5 km/h with no pedal.
2. **One continuous arc never clears.** The PRD names three movements (forward, reverse,
   forward), so a U-turn ends as "drove past the station".
3. **Reaching 20 demerits.** The verdict fails and the run carries on (`end_run_at_fail` is now
   false). Otherwise one run could not collect a fault of each kind, as the acceptance test asks.
4. **Numbers that were only in the text are now fields:**
   - stopped means below 0.5 km/h;
   - the parking "done" signal is 1.0 s;
   - a kerb, pole or cone contact ends after 0.5 s clear;
   - a turn movement is 0.3 m, with 3 movements and 148°.
5. **Practice voids.** An S or merge attempt voided for speed waits, unarmed, until
   `restartStation`. `detail.voids` counts the voids for the screen.
6. **Pole touches.** A pole touch is charged to the current station. It also fails the pole's own
   station when that is the one being done.
7. **Rollback values.** A rollback fault reports the worst distance rolled back, not the first
   value over the limit.
8. **Bay lines.** A car exactly on a bay line counts as inside.
9. **Following the route.** Progress along the route searches 8 m ahead, not 40 m. The route
   passes the same road twice (the side-parking band, the middle road), and a wider search jumped
   ahead. Progress holds while the car is on the ramp, which the route only passes beside.
10. **Kerb contact.** A tyre touches a kerb when its centre is on the 0.20 m strip, or within half
    a tyre width of it. Grass beyond the strip is not a kerb. A 1 m grid indexes the ring
    segments, so the check is cheap enough to run four times per physics step.

**Checks:** the build passes; all 211 tests pass (140 existing and 71 new); lint is clean on
`src/sim`.

## WP2 (15 Oct): the yard as a 3D world

**What was built:**

- `src/sim/world/build.ts`: the world, built from `circuit.json` alone and cached, so a level change never
  rebuilds it. It holds:
  - the pavement, with every island and wall as a hole;
  - kerbs on the grass side of every ring, 0.13 × 0.20 m, painted in 1 m yellow and black dashes;
  - both slope decks following their profiles, with their walls subdivided every 0.5 m so their tops
    follow the slope, and a raised end wall on the ramp;
  - the paint: the hill's stop band, the side bay (open at its mouth), the parallel box and the
    finish line;
  - the five striped poles, the booths and the office (blue roofs, as in the plan), and the
    perimeter fence;
  - named markers for every gate, bay, pole, slope, booth, start point and the spawn.
- **Colliders:** one ground box, trimeshes for the kerbs, the slopes and invisible guard rails
  1.2 m above every slope wall (the car cannot fall off), boxes for the buildings and the fence,
  and a body per pole carrying `userData.pole`, so the car can report which pole it touched.
- `src/sim/world/World.tsx`: the world in the scene, with its textures. `Daylight` is the sky, a
  hemisphere fill and the sun, with no environment map, so nothing loads from the network.
  `TopDownCamera` is orthographic and framed to `site.bounds`, north up.
- **Textures** (`public/sim/textures`):
  - concrete from ambientCG Concrete030 (CC0, already in the owner's `3D Assets`), lightened to the
    yard's pale concrete: 6 KB at 512 px and 28 KB at 1024 px;
  - grass generated as seamless noise: 37 KB and 144 KB.
  - Both are recorded in `THIRD_PARTY_LICENSES.md`.
- `src/sim/dev/SimPreview.tsx` at `/dev/sim`: development only, and absent from the production build.

**Draw calls:** 5 (grass, concrete, kerbs, paint, poles and props), against a budget of about 10.

**Tests** (`src/sim/world/world.test.ts`, 8, all passing):

- every gate, bay, pole, slope, booth, start and the spawn is within 1 cm of its JSON position;
- the pole colliders carry their indices;
- the slopes follow their profiles;
- `kerbContact` hits 0.05 m outside, and misses 0.05 m inside, all 195 ring segments long enough to
  test;
- a tyre patch overlapping a kerb counts, and one clear of it does not;
- the world adds 10 draw calls at most, and ten level changes build no new meshes.

**Screenshot:** `docs/circuit-v2/frames/world-vs-plan.png` shows the straight-down render beside
`circuit-plan.png`. The layouts match.

**Checks:**

- `check:circuit` passes 44 of 44, after this package's changes to `rules.json`;
- the build passes;
- all 219 tests pass;
- lint is clean.

**Skipped (cut line, item 3):** the station number boards.

## WP3 (19 Oct): the car, its physics, controls, camera and mirrors

**What was built:**

- `scripts/swift_web.py`: Blender 5.2, run headless, turns the owner's 2022 Swift glb into three web
  files: the body, one wheel and the steering wheel.
  - Orientation: nose to +X, Y up.
  - Origins: the body at the wheelbase centre, at wheel-centre height; the wheel at its axle,
    scaled to a radius of exactly 0.324 m; the steering wheel at its hub.
  - Budget: interior parts are reduced first, and materials are never merged. The source's blank
    vertex-colour sets are dropped.
  - Measurement: it writes the axles, the hub, the column tilt and the three mirror glasses to
    `measure.json`.
- **The car files** (`public/sim/cars/swift-2022/`): two tiers, with WebP textures.

  | File | Triangles | Low (512 px) | Medium (1024 px) |
  |---|---|---|---|
  | body.glb | 38,252 | 3.52 MB | 4.28 MB |
  | wheel.glb | 2,600 (drawn 4 times) | 0.26 MB | 0.41 MB |
  | steering.glb | 3,200 | 0.35 MB | 0.53 MB |
  | **Car** | **51,852 drawn** | **4.13 MB** (budget 5 MB) | 5.21 MB |

- `src/sim/physics/cars/swift-2022.ts`: the per-car config.
  - Published figures: 900 kg, 61 kW, 113 Nm, CVT.
  - Geometry: the axles; the eye point, 1.20 m above the road and 0.33 m right of centre on the
    hub's line; the three mirror glasses.
  - Steering: rack ratio 9, rim radius 0.168 m, column tilt 23.5°.
- `src/sim/physics/drive.ts`: `car-check.cjs`'s drive layer as pure functions, used by the app and
  the tests alike. It covers engine force and creep, the Ackermann split, the brakes, the brake-hold
  test, the lock schedule and the steering rate.
- `src/sim/physics/vehicle.ts`: the Rapier ray-cast vehicle, with the table's values. Each step it
  emits a `VehicleSample` in the circuit frame, kerb contacts through WP2's `kerbContact`, and pole
  hits from the pole colliders.
- `src/sim/physics/SwiftCar.tsx`: the car in the scene.
  - The vehicle is created through `useRapier()` and removed on unmount.
  - Inputs are applied in `useBeforePhysicsStep`, and the brake hold in `useAfterPhysicsStep`.
  - One wheel mesh is drawn four times. The right pair is turned 180° about the vertical, never
    mirrored.
  - The rim turns at 9 times the road wheels.
  - The first-person camera has a vertical field of view of 50°. At 851 × 393 that is 90° across,
    enough to show both kerbs of a 6 m road and the bonnet line.
- **Mirrors** (`src/sim/physics/mirrors.ts`, `MirrorView.tsx`): the three mirrors are rear-facing
  cameras on the car.
  - Door mirrors: 35° wide, 15° outward, 14° down.
  - Interior mirror: 50° wide, 3° down.
  - Near planes sit past the housings, and the far plane is 60 m. Shadows are not updated.
  - One mirror re-renders each frame, in turn. Each target takes its glass's shape within the
    256 × 128 pixel budget (door 222 × 148, interior 362 × 90).
  - They show on a drei `Hud`, flipped left to right.
- `src/sim/input.ts`: the driver's inputs (zustand), the keyboard, and the release on focus loss.
  `useTouchUi` and a saved `auto`/`on`/`off` override (`drivemy.sim.touch`) are ready for WP4's
  settings to show.
- `src/sim/TouchControls.tsx`:
  - The steering pad holds its angle when let go: 110 px of drag is full lock, and a double tap
    centres it.
  - The pedals press harder higher up.
  - Buttons: D/R, handbrake, pause and the top-down view.
  - The controls show on a device with touch and a coarse pointer, or when the override is on.
    They never depend on screen width.
- `src/sim/world/colliders.ts`: WP2's collider data added to a Rapier world, shared by the scene
  and the headless tests. Removals are guarded against React's strict-mode double mount.
- `/dev/sim` gained `?start=<station>`, `?tier=medium` and `?touch=on`.

**Physics values:** none of the table's values changed. One behaviour was added: below 1 km/h, on
level ground and with no throttle, sideways creep is cancelled after each step. Without it, Rapier's
ray-cast vehicle slides sideways a few millimetres a second while parked. The `vehicle.test.ts` case
"does not creep sideways at rest" needed it. It never acts on a slope, where it could hide a rollback.

**Tests:**

- `vehicle.test.ts` (13):
  - every `car-check.cjs` target, run through `drive.ts`;
  - holding the brake on the hill never selects reverse;
  - the lock schedule and the 0.8 rad/s steering rate;
  - the frame conversion.
- `mirrors.test.ts` (4):
  - a pole moving toward the car's left moves left in all three mirrors;
  - each door mirror shows the flank by the rear wheel along its inner edge, in the lower half;
  - the interior mirror looks straight back;
  - the targets keep each glass's shape within the budget.
- `TouchControls.test.tsx` (5):
  - the steering holds its angle, and a double tap centres it;
  - the pedals release when let go, and the brake never selects reverse;
  - D/R changes only when stopped;
  - the controls show by device or by setting, never by width.
- `scripted-drive.test.ts` (1): one continuous assessment from the spawn to the exit road.
  - It drives only through the controls: the same `Controls` the keyboard and touch layers
    produce, into the same `Vehicle.beforeStep`. There are no teleports.
  - It runs on the real colliders and is judged by the rules engine.
  - Results: all eight stations clear, no tyre touches a kerb, no pole is touched, and the verdict
    passes.
  - Speeds: 15 km/h or less everywhere but the merge leg, and under 10.5 km/h in the S and Z.
  - 387 simulated seconds run in about 1.5 s.

**Decisions:**

- **Merge speed.** The scripted drive's merge leg holds 16 km/h. The spec asks for 15 or less, but
  `rules.json` fails a finish below 15 km/h, so the rule wins. Every other station is held to 15 or
  less. Basis: the rules file is the authority (PRD).
- **Ending manoeuvres.** A manoeuvre ends on how far the car has turned, not on distance travelled,
  because heading does not drift with tyre slip. Basis: test robustness.
- **Leaving the side bay.** The drive leaves the way a learner does: straight out until the rear
  axle is 1.05 m short of the mouth poles' line, then full left lock. Pure pursuit had cut the corner
  onto the east mouth pole. The chosen point leaves about 0.3 m to the pole and 0.4 m to the far
  kerb. Basis: kinematics from the bay geometry, confirmed by the drive.
- **Door-mirror height.** The door mirrors sit 6% of the screen height above the middle. At
  851 × 393 that clears the steering pad and the pedals, as the spec's "above the touch controls"
  asks. Basis: a screenshot at 851 × 393.
- **Mirror target shape.** Each target takes its glass's shape instead of a flat 256 × 128, so
  nothing stretches, at the same pixel count. Basis: the spec's budget.
- **Touch pedals.** Pressure comes from the finger's height on the pedal, with the lowest quarter
  at 25%, so a phone can feather the brake. Basis: decided; no source.
- **Vertex colours.** The source's COLOR_0 is all white and COLOR_1 all zero, so dropping them
  leaves the look unchanged and saves 0.73 MB. Basis: measured.

**Skipped:**

- KTX2 textures: `toktx` is not installed.
- Meshopt geometry: `@gltf-transform/cli` is not installed, and the Low tier meets its budget
  without it.
- The mirror textures on the glb's own glass: optional in the spec.

## WP4 (19 Oct): screens, verdict and results

**What was built:**

- `src/sim/ui/SimulatorPage.tsx`: the simulator at `/simulations/:id`, still behind the protected
  routes.
  - It is a full-screen layer above the app's navigation, as the exam room has its own shell. A
    driving view needs the whole screen, especially on a phone held sideways.
  - `/simulations/assessment` opens the assessment, and `/simulations/<station id>` opens practice
    on that station.
  - The world loads once. Choosing, restarting or switching a station moves the car and resets the
    session; nothing reloads.
  - A progress bar shows while the world and car load.
  - A rotate prompt shows in portrait, and the run pauses.
  - Focus loss pauses, through WP3's release.
- `src/pages/Simulation3DView.tsx` now only re-exports the v2 page. The v1 page is gone, with its
  manual pass button and its made-up completion time.
- `src/sim/ui/run.ts`: the run store. It holds one rules session. The screens get a snapshot about
  ten times a second, and at once whenever a station, a fault or the verdict changes. Each run gets
  a fresh UUID.
- **The HUD** (`Hud.tsx`):
  - Station panel: the number and title, with the tip for 6 s after the station arms, then the
    title alone.
  - The station timer, and the demerit meter in assessment.
  - Fault toasts, each with a synthesised tone and a small camera kick (`scene.tsx`); reduced
    motion turns the kick off.
  - Readouts: speed, D/R and the handbrake.
  - The label "Practice rehearsal, not official marking", always visible under the interior mirror.
  - The top-down toggle in both modes (T, a HUD button, or the touch button).
  - In practice: restart the station, or pick another.
  - The mirrors' three areas stay clear.
- **"Where next":** a floating marker over the next station's entry on `route.samples`, shown until
  the station arms.
- **The verdict** (`Verdict.tsx`) is built only from `SessionState.verdict`.
  - It shows pass or fail, the demerits against the line, the stations not cleared, the seconds
    the top-down view was on, and whether the result saved.
  - Each fault shows its station, a numbered marker on the minimap, the measured value against the
    limit, one fix, and the rule's basis on request.
  - The minimap (`Minimap.tsx`) is drawn from `circuit.json` the way `circuit-minimap.png` is.
  - Buttons: try the assessment again, practise the failed station, or leave.
- **Results** (`src/sim/record.ts`):
  - Each assessment run is one versioned row: `maneuver_id` is `full-circuit`, and `attempt_data`
    holds the schema (`drivemy.simrun/1`), the verdict and every station's status.
  - The row's id is the run's UUID, which is the idempotency key. It is saved through
    `saveSimulationResult`.
  - Offline, the row is queued. The app's existing reconnect sync uploads it exactly once: the id
    persists, the sync holds an in-flight lock, and a duplicate key is checked against the row.
  - Practice runs are never saved.
  - `expandSimRuns` lets the analytics read a run per station, so the readiness score and the
    "x/8 completed" count stay truthful.
- `SimulationsPage` gained an assessment card; the station cards open practice.
- **Strings:** 40 new keys in both languages. The eight tips were rewritten to state only what is
  measured, with no clutch; road merging's tip is the one the spec gives.
- **Development only:** `/dev/sim/:id` shows the page without signing in (nothing saves), and
  `/dev/sim?verdict=demo` shows the verdict screen with a sample failed run.

**Tests (all passing):**

- `run.test.ts` (3): a whole assessment fed through the run store by the kinematic driver clears
  every station, and its verdict reports the top-down seconds. Practice starts at the station's
  start, counts top-down time too, and restarts as a fresh run. A kerb contact makes one toast,
  however long it lasts.
- `Verdict.test.tsx` (5): the verdict renders only what the session decided, with every fault's
  details and map marker. Its only buttons retry, practise or leave. The old manual pass is gone from
  the route.
- `record.test.ts` (3): the run record, its refusal without a verdict, and the per-station read-back.
- `parity.test.ts` (3): English and Malay have the same keys; every key the simulator uses exists;
  no tip mentions the clutch.
- `TouchControls.test.tsx` (+1): the controls show at 800 × 360 with touch and a coarse pointer, and
  stay hidden on a desktop with a mouse.
- `results.service.test.ts` (+1): a run saved offline, then two syncs started together, inserts one
  row under the run's id.

**Decisions:**

- **One record per run, not one per station.** It mirrors the real test, which is one run;
  `expandSimRuns` gives the analytics their per-station view. Basis: the spec ("a versioned record")
  and a truthful readiness score.
- **The run's score is the share of stations cleared.** The column needs a number, and a
  demerit-based score would hide a failed station. Basis: decided.
- **The rule's basis text stays as `rules.json` writes it, in English, in both languages.** It is
  the rule's source note, data rather than interface wording. Basis: decided.
- **The where-next marker is `awas` yellow:** where to go next is progress, the meaning Jalan gives
  that colour.

**Not done:**

- The v1 simulator's components (`SimulationHUD`, `SimulationResults`, `MobileControls`,
  `JPJCircuit`) no longer have a route. They are left for WP6 to remove.
- The hidden in-app browser pane draws about one frame a second, so the full drive could not be
  clicked through there. The flow is proven headless instead: through the run store above, and with
  real physics in WP3's scripted drive.

## WP5 (19 Oct): phones and the performance gate

**What was built:**

- **Quality tiers** (`src/sim/quality.ts`).
  - Low: 512 px textures, a painted shadow under the car, no clearcoat, render scale 0.7–0.85 of the
    device pixel ratio (at most 1.5), and one mirror refreshed every other frame into
    256 × 128-pixel targets.
  - Medium: 1024 px textures, one sun with a 1024 px shadow map kept centred on the car, clearcoat,
    render scale 0.85–1 (at most 2), and all three mirrors every frame at 512 × 256.
  - Android, or 4 GB of memory or less, gets Low; iPhones and desktops get Medium. The simulator's
    settings (on the first panel) override it, and the touch controls' override sits beside it.
  - The tier is fixed before a run starts. The render scale moves within the tier's band to hold the
    frame rate; the tier itself never changes mid-station.
- **The Low tier's car merges cabin trim that looks the same** (`scripts/swift_web.py`): 47 body
  materials instead of 55. Only interior trim may merge, and only when its colours (rounded as the
  eye sees them), finish and textures match; the exterior keeps every material.
- **Loading.**
  - The 3D engine (three.js, React Three Fiber, drei, Rapier) is its own chunk, loaded only with
    the simulator; it used to ride in the shared vendor chunk every page loads.
  - The simulator's code, car and textures are runtime-cached by the service worker, never
    precached.
  - The car and textures start downloading when the simulator route opens (`src/sim/assets.ts`).
  - On simulator routes the service worker's precache waits until the car is ready.
  - Shaders compile while the car loads.
  - `public/_headers` carries the same Content-Security-Policy as `vercel.json`, and
    `scripts/csp-hash.mjs` checks both, including Rapier's `'wasm-unsafe-eval'`. It now hashes the
    LF form of `index.html`, as served: a Windows checkout's CRLF had made it report false drift.
- **Mirrors without the shader churn.** Mirror targets render with the screen's colour settings, so
  materials no longer switch programs twice a frame; a raw-copy shader shows them.
- **Measurement.**
  - `scripts/sim-perf.mjs` drives a throttled Chrome over the DevTools protocol.
  - The in-app frame probe is `?perf=1`. `?autopilot=1` replays the scripted assessment through
    the driver inputs, and never saves a run.
  - The scripted assessment now lives in `src/sim/physics/pilot.ts`, shared by the test and the
    autopilot.
  - Both switches exist only in development and in performance builds (`VITE_SIM_PERF=1`).

**Results:** `RESULTS.md`. Both load targets are met (first drive 9.5 s, 5.8 MB). The Low tier's frame
rate is not: 20 fps p50, emulated. RESULTS.md shows the trial evidence that the cut list cannot reach
30 fps (it is bound by draw calls, not pixels), and names the remaining lever: baking the car into a
texture atlas.

**Decisions:**

- **Not cutting.** The cut list was not applied; RESULTS.md gives the evidence.
- **Render scale.** It is a fraction of the device pixel ratio, capped (1.5 Low, 2 Medium), so a
  2.75× phone screen is not drawn at full density. Basis: decided, from the spec's 0.7–0.85 and
  0.85–1 bands.
- **Low-tier mirror refresh.** Every other frame. It halves the mirrors' cost per frame. Basis:
  measured.
- **Poles became pass-through sensors** (the same day, for WP6). JPJ yard poles are light and
  flexible: touching one is still a 20-demerit fault and fails the station, but the car is no longer
  caught on a fixed post. Basis: decided; the yard's own poles.

## WP6 (19 Oct): acceptance, walkthrough, demo and report draft

**Acceptance runs** (`src/sim/physics/scripted-drive.test.ts`). Each drives the physics car through
the controls alone, on the real colliders, judged by the rules engine, with no teleports. All pass:

1. **A clean run** from the apron through all eight stations: 0 demerits, a pass.
2. **One fault of each kind on purpose** (`pilot.assessment(true)`):
   - a rollback on the hill;
   - stopping 1.6 m short in the side bay;
   - sweeping the inner side through the east mouth pole on the way out;
   - a fourth three-point-turn movement (140° in three);
   - a 2.5 s stop in the S;
   - the left tyres over a Z kerb;
   - a ramp stop 1.6 m short of the pole;
   - crossing the finish at 10 km/h.

   The run fails, and the verdict lists each fault with its station, a fix and its basis; the
   rollback, ramp and merge faults also carry the measured value against the limit.
3. **No input** for three minutes: no verdict, and no station cleared.

**Rule change for the fault run.** A ramp stop outside the window used to surface only as "drove past
without completing". The rules engine now remembers the gap at the last stop on the ramp and fails it
as `ramp.window` ("1.60 m" against "0.2-1.0 m"). The change is in `rules.json`, `RULES.md` and both
languages, with a rule test.

**PLAN.md's acceptance list** is ticked with its evidence. Two items stay open:

- the Low tier's 30 fps (20 fps emulated; see `RESULTS.md`);
- the owner's walkthrough, which `WALKTHROUGH.md` sets out for the owner to fill in.

**Also:**

- `input.test.ts`: switching tabs releases every input and pauses; R changes gear only when stopped;
  holding S never selects reverse.
- **The v1 simulator is removed.** Its components (`SimulationHUD`, `SimulationResults`,
  `MobileControls`, `JPJCircuit`) and its score store (`src/stores/carStore.ts`) had no route since
  WP4. `rules.json` and `RULES.md` now say the rubric's weights came from that store, which git
  history keeps.

**Demo capture** (`scripts/sim-demo.mjs`, saved in `demo/`):

- a first-person screenshot at each station;
- both verdicts;
- the yard from above;
- `clean-run.mp4`, the clean run's first 80 s;
- `world-vs-plan.png` from WP2.

The autopilot drives through the same inputs as the keyboard.

**Report draft:** `REPORT-DRAFT.md`, with the chapters WP6 lists, for the owner to edit.
