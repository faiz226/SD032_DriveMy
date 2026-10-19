# DriveMy v2 simulator: report draft

A draft of the report chapters on the driving simulator, for the owner to edit. Each claim points at
the file or test that backs it. Figures marked "emulated" were measured without the target phone; see
`RESULTS.md`.

## 1. Requirements

DriveMy is a progressive web app that prepares Malaysian learners for the JPJ driving licence. Its
theory side (quizzes, mock tests, the KPP theory exam) already existed. This project adds the
practical side: a 3D simulator of the JPJ circuit test (Bahagian II), driven from the driver's seat,
marked by the same eight stations a learner meets at a driving institute.

**The eight stations, in test order:**

| # | Station | What the learner must do |
|---|---|---|
| 1 | Hill start | Stop with both front tyres on the yellow band, pull the handbrake, hold still 2 s, then move off without rolling back more than 0.30 m. |
| 2 | Side parking | Drive past the bay, reverse into it, stop inside the lines; the handbrake held for 1 s says "done"; drive out. |
| 3 | Parallel parking | Reverse into the box beside the kerb, stop inside the lines, say done, drive out. |
| 4 | Three-point turn | Turn the car round in three movements without touching the kerbs. |
| 5 | S-curve | Keep moving through the S, below 18 km/h, tyres off the kerbs. |
| 6 | Z-curve | Take each corner below 12 km/h, tyres off the kerbs. |
| 7 | Ramp test | Stop 0.2–1.0 m short of the pole at the top, hold 2 s, reverse down and out. |
| 8 | Road merging | Build speed on the approach and cross the finish at 15 km/h or more. |

**Marking.** Touching a kerb costs 5 demerits; touching a pole, 20; rolling back more than 0.30 m on
a slope, 20; stopping not fully inside a bay, 10. Twenty demerits fail the run, and so does any
station not cleared. The run carries on after a fail, so the learner rehearses every station.
Every number lives in `docs/v2-plan/rules.json` beside its basis, and `RULES.md` tabulates them.

**Two modes.** Assessment is the full circuit, marked and saved to the learner's results.
Practice is one station at a time, restarted at will, never saved. The simulator always shows
"Practice rehearsal, not official marking".

**Platforms.** Phones held sideways (Android Chrome and iOS Safari) and desktop browsers, with touch
controls on touch phones and the keyboard elsewhere.

## 2. Design

### 2.1 Architecture

The simulator is four modules that meet through one contracts file, `src/sim/contracts.ts`:

| Module | Folder | Job | Depends on |
|---|---|---|---|
| Rules engine | `src/sim/core` | Pure TypeScript. `createSession(circuit, rules, car, mode)` takes one vehicle sample per physics step and returns the session state: which station is current, its status, every fault, the demerits and, at the end, the verdict. No React, no three.js, no Rapier. | the data files |
| World | `src/sim/world` | Builds the yard's meshes and colliders once from `circuit.json`, and caches them, so changing practice station never rebuilds anything. | the map |
| Car | `src/sim/physics` | The 2022 Suzuki Swift on Rapier's ray-cast vehicle: drive, steering, brakes, the brake hold, the first-person camera and the three mirrors. Each step it reports a vehicle sample in the map's frame. | the world's colliders |
| Screens | `src/sim/ui` | The page, the HUD, the verdict and saving the result. It shows only what the rules engine decided. | the other three |

The data that defines the test lives in three files, not in code: the map (`docs/circuit-v2/circuit.json`),
the rules (`docs/v2-plan/rules.json`) and the car (`docs/circuit-v2/car-swift-2022.json`).

**One rule enforced by design:** a run's verdict comes only from the rules session. The screen that
shows it takes the session's verdict object and nothing else, and its only buttons start another
attempt or leave. The previous simulator's manual "pass" button is gone (`Verdict.test.tsx`).

### 2.2 The map

The yard is the real ARM Driving Institute circuit in Kota Kinabalu, traced off a drone photo at its
measured scale (`docs/circuit-v2/README.md`, `YARD-TRACE.md`). One map serves every level; practice
only changes where the car starts. The assessment route is 581 m and passes the eight stations in
test order. `docs/circuit-v2/check.py` proves the map's geometry with 44 checks: every lane is wide
enough for the car, every bay fits it with margin, every reversing manoeuvre has a path a real car
can drive (its planners print each plan), and nothing overlaps that should not.

### 2.3 Rule decisions and their sources

No official JPJ marking sheet is published. Each threshold therefore carries one of three bases in
`rules.json`: **rubric** (the project's original demerit rubric, such as 20 demerits to fail),
**guides** (published accounts from driving schools and learners, listed in `RULES.md`), or
**decided** (a value the project chose and states as such, such as the 0.2–1.0 m ramp window). The
verdict screen shows a fault's basis on request, so a learner can see how firm each rule is.

## 3. Implementation

The simulator is built inside the existing PWA (React 19, Vite 8, TypeScript 6) with React Three
Fiber 9 and drei 10 for rendering, and Rapier 0.19 (through `@react-three/rapier` 2.2) for physics.

**The car.** Rapier's `DynamicRayCastVehicleController` (a port of Bullet's ray-cast vehicle) carries a
900 kg body box with four ray-cast wheels. The drive layer is a set of pure functions
(`src/sim/physics/drive.ts`), used by the app and the tests alike: Ackermann steering, an automatic's
idle creep, front-wheel drive, brakes, the handbrake, and a brake hold that stops a braked car creeping
down the hill. The car files were built from a licensed Swift model with Blender, headless
(`scripts/swift_web.py`), in two quality tiers.

**The mirrors.** The interior mirror and both door mirrors are rear-facing cameras on the car,
rendered into small textures and shown flipped left to right, as mirrors are. Door mirrors are aimed
so the car's flank by the rear tyre runs along their inner edge, where learners watch the bay lines.

**Controls.** Keyboard on desktops; on touch phones, a steering pad that holds its angle, pedals that
press harder higher up, and D/R, handbrake, pause and top-down buttons. Switching away from the tab
releases every input and pauses; paused time is never marked.

**Results.** Each assessment run is saved as one versioned record under the run's own ID, so a retry
or an offline sync can never save it twice. Offline, the record waits in the device's queue and
uploads once on reconnect.

**Borrowed code.** Driving, braking and mirrors follow published open-source patterns, listed with
their licences in `REFERENCES.md`: Rapier (Apache-2.0), Bruno Simon's 2025 portfolio car (MIT), pmndrs
racing-game's structure (MIT), and the three.js render-target pattern (MIT). Nothing comes from
commercial games.

## 4. Testing

**Rule tests** (`src/sim/core/session.test.ts`). Every station is driven by a scripted kinematic car
that clears it, and refused by drives that break each rule. Every threshold is tested just below, at
and just above its value.

**The map** (`check.py`). 44 checks on the map the app imports.

**The car** (`src/sim/physics/vehicle.test.ts`). Rapier runs headless in the tests. The car creeps at
4–6 km/h, reaches 30 km/h in 2.5–3.5 s and stops from it in 4–6 m; on the 12% hill the handbrake or
the brake alone holds it, and with nothing held it rolls back; at walking pace its full-lock radius is
3.43 m ± 0.15; it creeps over a kerb without the body touching it.

**Acceptance runs** (`src/sim/physics/scripted-drive.test.ts`). These drive the real physics car
through the real controls (pedals, wheel, gear, handbrake), on the real colliders, judged by the real
rules engine, with no teleports:

1. **A clean run** from the apron through all eight stations scores 0 demerits and passes.
2. **A fault run** commits one fault of each kind on purpose (a rollback, not in the bay, a pole
   touch, a fourth three-point-turn movement, the S's speed band, a kerb touch, a ramp stop outside
   its window, a slow merge). It fails, and the verdict lists each fault with its station, the
   measured value against its limit, and a fix.
3. **No input** never passes.

**Screens** (`src/sim/ui/*.test.*`, `TouchControls.test.tsx`). The verdict renders only the session's
decision; the top-down view works in both modes and the verdict reports its use; two syncs started
together insert one row; the touch controls appear at 800 × 360 on a touch phone and stay hidden on a
desktop; every string exists in English and Malay.

**In all**, 266 tests in 26 files pass (`npm test`), alongside `npm run build` and the map's 44
checks.

**Performance** (`RESULTS.md`). Measured with `scripts/sim-perf.mjs` in Chrome with a phone's
conditions (851 × 393, 4× CPU throttling, 9/3 Mbps, 80 ms, cold cache). Every figure is marked
emulated: no Redmi 9T or iPhone Xs was to hand, and a laptop GPU stands in for the phone's.

| Measure (Low tier, emulated) | Result | Target |
|---|---|---|
| Time to first drive | 9.5 s | 15 s or less: met |
| Transferred before it | 5.8 MB | 12 MB or less: met |
| Frame rate, p50 | 20 fps | 30 fps or more: not met |

The frame rate is bound by the cost of issuing draw calls on a throttled CPU: even with the mirrors
switched off the Low tier reached only 25–27 fps in trials. On a laptop without throttling, the Medium
tier runs at 81 fps p50.

## 5. Limitations

- **No official JPJ marking sheet.** Thresholds come from the rubric, published guides, or are
  decided, and each says which.
- **Decided dimensions.** The ramp, the hill's rise and the bay poles were not measured on site.
- **No instructor review and no learner sessions.** The owner's walkthrough (`WALKTHROUGH.md`)
  stands in for a learner.
- **No traffic.** Road merging is judged by speed at the finish alone.
- **An automatic gearbox only.** Clutch control, part of the manual test, is not simulated.
- **Emulated performance, and a frame-rate shortfall.** Phone figures come from desktop emulation,
  not the phones themselves, and the Low tier's emulated 20 fps falls short of the 30 fps target.
- **The rule's basis is shown in English** in both languages, as `rules.json` records it.

## 6. Future work

- A manual gearbox with a clutch.
- Traffic on the merge and at the junctions.
- Head movement, so a learner can lean to check a mirror or the bay lines.
- A review of the thresholds by a JPJ-licensed instructor.
- A circuit editor, so other institutes' yards can be traced and added.
- Baking the car's materials into one or two texture atlases, so phones draw it in a few calls and
  reach 30 fps.
