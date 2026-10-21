# DriveMy v2 simulator: report draft

A draft of the report chapters on the driving simulator, for the owner to edit. Each claim points at
the file or test that backs it. Figures marked "emulated" were measured without the target phone; see
`RESULTS.md`.

## 1. Requirements

DriveMy is a progressive web app that prepares Malaysian learners for the JPJ driving licence. Its
theory side (quizzes, mock tests, the KPP theory exam) already existed. This project adds the
practical side: a 3D simulator of the JPJ circuit test (Bahagian II), driven from the driver's seat,
marked by the seven stations of the owner's driving-institute yard, among other cars.

**The seven stations, in test order** (the owner's layout, 20 Oct):

| # | Station | What the learner must do |
|---|---|---|
| 1 | Hill start | Stop with both front tyres on the yellow band, pull the handbrake, hold still 2 s, then move off without rolling back more than 0.30 m. |
| 2 | 3-side parking | Drive past the bay, reverse into it, stop inside the lines; the handbrake held for 1 s says "done"; drive out. |
| 3 | Parallel parking | Reverse into the box beside the kerb, stop inside the lines, say done, drive out. |
| 4 | S-curve | Keep moving through the S, below 18 km/h, tyres off the kerbs. |
| 5 | Z-curve | Take each corner below 12 km/h, tyres off the kerbs. |
| 6 | Ramp test | Stop 0.2–1.0 m short of the pole at the top, hold 2 s, reverse down and out. |
| 7 | Road merging | At the roundabout, give way to the cars going round, join a gap of 3 s or more, leave by the north arm and cross the finish at 15 km/h or more. |

**Marking.** Touching a kerb costs 5 demerits; touching a pole, 20; rolling back more than 0.30 m on
a slope, 20; stopping not fully inside a bay, 10. Twenty demerits fail the run, and so does any
station not cleared. The run carries on after a fail, so the learner rehearses every station.
Three faults end the test at once, as they would a real one: a tyre on a centre line, touching another
car, and running a red light. Every number lives in `docs/v2-plan/rules.json` beside its basis, and `RULES.md` tabulates them.

**Three modes.** Assessment is the full circuit, marked and saved to the learner's results.
Practice is one station at a time, restarted at will, never saved. Free drive is the whole yard among
the traffic, for fun: the rules engine never sees it, so nothing is marked or saved. The simulator
always shows "Practice rehearsal, not official marking".

**Every start runs the same way** (the owner, 21 Oct): the instructor's voice reads the brief, the
engine starts, and only then can the car move. Each brief is read once per visit, so a restart only
starts the engine again.

**Platforms.** Phones held sideways (Android Chrome and iOS Safari) and desktop browsers, with touch
controls on touch phones and the keyboard elsewhere.

## 2. Design

### 2.1 Architecture

The simulator is five modules that meet through one contracts file, `src/sim/contracts.ts`:

| Module | Folder | Job | Depends on |
|---|---|---|---|
| Rules engine | `src/sim/core` | Pure TypeScript. `createSession(circuit, rules, car, mode)` takes one vehicle sample per physics step and returns the session state: which station is current, its status, every fault, the demerits and, at the end, the verdict. No React, no three.js, no Rapier. | the data files |
| World | `src/sim/world` | Builds the yard's meshes and colliders once from `circuit.json`, and caches them, so changing practice station never rebuilds anything. | the map |
| Traffic | `src/sim/traffic` | Pure TypeScript. Five other cars on keep-left loops and a signalled junction, stepped with the physics. It reports a touch, a red light run or a cut-in at the roundabout as events, which the rules session marks; it marks nothing itself. | the map |
| Car | `src/sim/physics` | The 2022 Suzuki Swift on Rapier's ray-cast vehicle: drive, steering, brakes, the brake hold, the first-person camera and the three mirrors. Each step it reports a vehicle sample in the map's frame. | the world's colliders |
| Screens | `src/sim/ui` | The page, the HUD, the verdict, the instructor's voice and saving the result. It shows only what the rules engine decided. | the other four |

The data that defines the test lives in three files, not in code: the map (`docs/circuit-v2/circuit.json`),
the rules (`docs/v2-plan/rules.json`) and the car (`docs/circuit-v2/car-swift-2022.json`).

**One rule enforced by design:** a run's verdict comes only from the rules session. The screen that
shows it takes the session's verdict object and nothing else, and its only buttons start another
attempt or leave. The previous simulator's manual "pass" button is gone (`Verdict.test.tsx`).

### 2.2 The map

The yard is the real ARM Driving Institute circuit in Kota Kinabalu, traced off a drone photo at its
measured scale (`docs/circuit-v2/README.md`, `YARD-TRACE.md`). One map serves every level; practice
only changes where the car starts. The assessment route is 678 m and passes the seven stations in
test order. `docs/circuit-v2/check.py` proves the map's geometry with 39 checks: every lane is wide
enough for the car, every bay fits it with margin, every reversing manoeuvre has a path a real car
can drive (its planners print each plan), the route keeps every tyre off the centre lines, and nothing
overlaps that should not; and each signal shows its lamps through the windscreen of the first and second
car in its queue. The map also carries the other cars' loops, the signal and the road
markings, which follow JKR's Arahan Teknik (Jalan) 2D/85 clause by clause (`traffic_gen.py`).

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

**Traffic.** Each car follows the one ahead with the intelligent driver model, slows for bends and
stops on red. Junctions closer together than a car's length are taken as one chain: a car takes the
whole chain before entering and lets go of each junction as its tail leaves it, so two cars can never
each hold half a crossroads. The cars give way to the learner except at the roundabout, where the
traffic going round has priority. They light their brake lamps, indicate at junction turns and turn
their wheels; the learner's car has the same lamps (`src/sim/traffic/model.ts`).

**Sound and voice.** The engine is the owner's recording: a start clip and a 3 s idle loop whose pitch
and level follow speed and throttle. The instructor's briefs, in English and Malay, were generated once
with Fish Audio from the screen's own strings (`scripts/gen-voice.mjs`) and ship as audio files, so no
key reaches the app.

**The yard's surroundings.** Trees, palms, bougainvillea, street lights, terrace houses, hills, clouds
and the national flag are all made in code from a seeded random (`src/sim/world/Scenery.tsx`): nothing
to download, the same on every visit, and half the woodland on the Low tier.

**Controls.** Keyboard on desktops; on touch phones, a steering pad that holds its angle, pedals that
press harder higher up, and buttons for the indicators, D/R, handbrake, pause and the top-down view.
Switching away from the tab releases every input and pauses; paused time is never marked.

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

**The map** (`check.py`). 39 checks on the map the app imports.

**The car** (`src/sim/physics/vehicle.test.ts`). Rapier runs headless in the tests. The car creeps at
4–6 km/h, reaches 30 km/h in 2.5–3.5 s and stops from it in 4–6 m; on the 12% hill the handbrake or
the brake alone holds it, and with nothing held it rolls back; at walking pace its full-lock radius is
3.43 m ± 0.15; it creeps over a kerb without the body touching it.

**Acceptance runs** (`src/sim/physics/scripted-drive.test.ts`). These drive the real physics car
through the real controls (pedals, wheel, gear, handbrake), on the real colliders, judged by the real
rules engine, with no teleports:

1. **A clean run** from the apron through all seven stations scores 0 demerits and passes.
2. **Among the traffic**, the same run at two moments of the traffic's day passes with 0 demerits:
   no contact, no red light, and no wait over 40 s.
3. **A fault run** commits one fault of each kind on purpose (a rollback, not in the bay, a pole
   touch, the S's speed band, a kerb touch, a ramp stop outside its window, a slow merge). It fails,
   and the verdict lists each fault with its station, the measured value against its limit, and a fix.
4. **No input** never passes.

**Traffic** (`src/sim/traffic/*.test.ts`). Twenty minutes of traffic: no two cars overlap, none runs a
red, every car laps more than four times, and none stands still for a minute. Giving way, the merge
gap, the roundabout cut-in and each event the learner can cause have their own tests.

**Scenery** (`src/sim/world/Scenery.test.ts`). Every shape builds, and nothing stands on the pavement,
in a junction or in a street light.

**Screens** (`src/sim/ui/*.test.*`, `TouchControls.test.tsx`). The verdict renders only the session's
decision; the top-down view works in both modes and the verdict reports its use; each brief is read
once per visit; two syncs started together insert one row; the touch controls appear at 800 × 360 on a touch phone and stay hidden on a
desktop; every string exists in English and Malay.

**In all**, 278 tests in 31 files pass (`npm test`), alongside `npm run build`, the lint and the
map's 39 checks.

**Performance** (`RESULTS.md`). Measured on 19 Oct, before the other cars, the lamps and the yard's
surroundings were added, with `scripts/sim-perf.mjs` in Chrome with a phone's
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
- **Scripted traffic.** Five cars on fixed loops. They never make a mistake, and they give way to the
  learner everywhere except the roundabout. The other learners in the yard are parked mid-test, not
  queueing or taking turns.
- **An automatic gearbox only.** Clutch control, part of the manual test, is not simulated.
- **Emulated performance, and a frame-rate shortfall.** Phone figures come from desktop emulation,
  not the phones themselves, and the Low tier's emulated 20 fps falls short of the 30 fps target. The
  figures predate the traffic and the yard's surroundings.
- **The spoken brief's timing** against the engine start was checked in code and tests, not by ear.
- **The rule's basis is shown in English** in both languages, as `rules.json` records it.

## 6. Future work

- A manual gearbox with a clutch.
- Other learners queueing at each station and taking turns, as in a real yard.
- Free head movement, so a learner can lean in to a mirror, beyond the fixed glances and dragging the
  view.
- A review of the thresholds by a JPJ-licensed instructor.
- A circuit editor, so other institutes' yards can be traced and added.
- Baking the car's materials into one or two texture atlases, so phones draw it in a few calls and
  reach 30 fps.
