# WP3: The car, its physics, controls, camera and mirrors (about 1.5 days)

Paste everything below the line into Claude Code started in
`C:\Users\ASUS\Documents\2026\SEM 2\FYP\FYP1 D-Day\SourceCode\SD032-sim-v2`. It can run at the
same time as WP1 and WP2. Wire it to WP2's world once that lands.

---

Build the DriveMy v2 car: its web assets, its Rapier physics, the controls, the first-person
camera and the mirrors. The car is a 2022 Suzuki Swift 1.2 GLX: right-hand drive, automatic,
traffic keeps left.

**Read first:**

- `src/sim/contracts.ts`.
- `docs/v2-plan/RULES.md`.
- `docs/v2-plan/REFERENCES.md`: the open-source code this car borrows from, and the pitfalls
  already found.
- `docs/v2-plan/physics/car-check.cjs`: a headless check that proves the physics recipe below.
  Run it first: `node docs/v2-plan/physics/car-check.cjs node_modules/@dimforge/rapier3d-compat`.
- `docs/circuit-v2/car-swift-2022.json`: the PRD's measured dimensions.
- `docs/circuit-v2/prd-excerpt.md`: the Vehicle section.

**Assets.** The source is
`C:\Users\ASUS\Documents\2026\SEM 2\FYP\FYP1 D-Day\SourceCode\SD032_DriveMy_BolehEdit\2022_suzuki_swift_1.2_glx.glb`.

- **Pipeline.** The Godot-era pipeline is in the old worktree's `scripts/swift_rig.py` and
  `swift_optimise.py`. It separates the body, one wheel and the steering wheel, and fixes their
  pivots. Adapt it for three.js, or redo it with Blender headless and `@gltf-transform/cli`.
- **Orientation.** Glb files face **+X**, with **Y up**, so that `rotation.y = heading`. Body
  origin at the wheelbase centre at wheel-centre height. Wheel origin at the axle centre, with
  radius exactly 0.324 m. Steering-wheel origin at the hub.
- **Tiers.**
  - Low: about 40–60k triangles for the whole car, interior included, with 512 px textures.
  - Medium: the same mesh with 1024 px textures.
  - Keep the exterior looking like the real Swift: reduce interior parts first, and never merge
    materials to save draw calls.
  - KTX2 textures if `toktx` is available, otherwise WebP. Meshopt geometry.
- **Output and budget.** Write to `public/sim/cars/swift-2022/`. Report the triangles and bytes per
  file. The Low-tier car must transfer 5 MB or less in total.
- **Per-car config.** Write `src/sim/physics/cars/swift-2022.ts`, extending the JSON with:
  - axle positions
  - eye point: 1.20 m above the road, 0.33 m right of centre, on the steering hub's line
  - the three mirror positions, read from the glb: the interior mirror and both door-mirror
    glasses
  - rack ratio 9 (rim angle = steering angle × 9)
  - rim radius 0.168 m and column tilt 23.5°
  - mass about 900 kg (published kerb weight), power 61 kW, torque 113 Nm, CVT
  - every physics value in the table below

**Physics.** Use Rapier's ray-cast vehicle, which is already installed
(`@dimforge/rapier3d-compat` 0.19.2). There is no React wrapper for it: create it with
`useRapier().world.createVehicleController(chassis)` and remove it on unmount with
`removeVehicleController`. `physics/car-check.cjs` holds a working version of everything below.
Port its drive layer to `src/sim/physics/drive.ts` as pure functions, and use the same functions
in the app and in the tests.

- **Stepping.** `<Physics timeStep={1/60}>`, never `"vary"`. In `useBeforePhysicsStep`, set every
  wheel's steering, engine force and brake, then call `updateVehicle(1/60)`. Apply the brake hold
  in `useAfterPhysicsStep`.
- **Starting values.** These meet every target in the headless check. Tune only if a test says so.

| Part | Value |
|---|---|
| Body | One box collider, 3.842 × 1.730 m, from 0.20 m above the road to the roof (1.622 m, the PRD's measured height). Mass 900 kg through `setMassProperties`, with the centre of mass 0.55 m above the road and a box's inertia. `canSleep` off. |
| Axes | Forward +X, up +Y: Rapier's defaults, so leave them. Axle +Z. |
| Wheels | 0 front-left, 1 front-right, 2 rear-left, 3 rear-right (left is −Z). x ±1.225, z ±0.7465. Direction (0, −1, 0). Rest length 0.20 m. Radius 0.324 m. Mount height 0.20 − 9.81 / (4 × stiffness) = 0.077 m, so the settled wheel centre sits at the body origin. |
| Suspension | Stiffness 20 (Rapier multiplies by the car's mass). Compression damping 1.5, relaxation 2.2. Travel 0.20 m. Maximum force 9000 N. |
| Grip | Friction slip 1.2. Side friction stiffness 1.0. |
| Steering | The input is one angle, as in a bicycle model, limited by the lock schedule below. Split it per wheel (Ackermann): R = 2.45 / tan(angle), inner = atan(2.45 / (R − 0.7465)), outer = atan(2.45 / (R + 0.7465)). |
| Drive | Front wheels only. With s the speed in the selected gear's direction: creep force per front wheel = clamp(1000 × (1.389 − s), −200, 300) N. With throttle: the larger of creep and throttle × 1350 × max(0.3, 1 − s / 25) N. |
| Brake | Pedal × 26 on each wheel (an impulse limit per 1/60 s step). Any brake sets every wheel's engine force to 0, because Rapier ignores a wheel's brake while it has engine force. |
| Handbrake | Rear wheels, 20 each. |
| Brake hold | While the speed is under 0.1 m/s, if the held brakes can resist the slope and the engine, pin the car along its own axis after each step: remove the movement along the axis since the hold began, and the velocity along it. Held brakes count only on wheels touching the ground with no engine force. Without the hold, a braked car slides down the hill about 2 cm a second. |

- **Gears.** D or R. R can only be selected below 1 km/h.
- **Creep.** It settles at 4–6 km/h on level ground. On the 12% hill it cannot hold the car: with
  no brake, no handbrake and no throttle, the car rolls back. That is what makes the hill's
  rollback rule possible.
- **Steering schedule.**
  - Lock is 0.62 rad at standstill, narrowing to 0.16 rad by 45 km/h.
  - Full lock is kept at walking pace.
  - The steering angle moves toward the requested angle at 0.8 rad/s and never snaps.
- **Speed.** Horizontal speed only. Don't use `currentVehicleSpeed()`: it is the 3D speed.
- **Brake and reverse are separate.** Holding the brake never selects reverse.
- **Each physics step,** emit a `VehicleSample` in the circuit frame (`X = x, Y = z, Z = -y`) and its
  `SimEvent`s:
  - Kerb contacts: test each wheel's contact point (`wheelContactPoint`) with WP2's
    `kerbContact`.
  - Pole hits: from Rapier collision events on the pole colliders.
- **Slope.** Fill in `VehicleSample.slope` (id, and distance along the slope axis) whenever the car
  is on the hill or the ramp.

**Controls:**

- **Keyboard:**
  - W / ↑ throttle; S / ↓ brake (never reverse); A / D or ← / → steer.
  - R toggles D/R. It works only when stopped; otherwise show a "Stop first" toast.
  - Space toggles the handbrake; P or Esc pauses; T toggles the top-down view.
- **Touch:**
  - Left thumb: a steering control that holds its angle. Double-tap it to centre.
  - Right thumb: brake and throttle pedals.
  - Buttons: D/R, handbrake, pause and the top-down view. The top-down view is in both modes; WP4
    logs its use in assessment.
- **Which controls show.** Touch controls appear when the device has touch and a coarse pointer,
  with a manual override in the simulator's settings. They do not depend on screen width.
- **Losing focus.** On blur, `visibilitychange` to hidden, or `pagehide`: clear every held input
  and pause. Time paused is never scored.

**Camera and cockpit:**

- **First-person camera** at the eye point.
- **Field of view.** Choose one where both kerbs of a 6 m road and the bonnet line show at
  851 × 393.
- **Readouts.** A digital speed readout, and D/R and handbrake indicators.
- **Steering rim.** It turns with the steering angle × 9. A left input turns it anticlockwise as
  seen from the seat.
- **Wheels.** One wheel mesh, instanced four times. Rotate the far side 180° about the vertical;
  never mirror it with a negative scale.
- **Needles are Later.** Do not build them.

**Mirrors.** The interior mirror and both door mirrors, as in the real test. The pattern is the
three.js render-target one in `REFERENCES.md`.

- **Cameras.** Three rear-facing cameras, children of the car, at the three mirror positions.
  - Door mirrors: 35° wide, turned about 15° outward and 14° down, so the car's flank by the rear
    tyre shows along the inner edge, in the lower half. That is where learners watch the bay lines
    and the kerb.
  - Interior mirror: 50° wide, 3° down, looking through the rear window.
  - These aims were checked by projecting points through three.js cameras (14 Oct). Adjust them
    only if the glb's mirror positions differ much from 0.92 m off the centreline.
  - Near plane past the mirror housing; far plane 60 m; no shadows.
- **Display.** Render each camera into its own small target (`useFBO`). Show the three as quads
  on a drei `Hud` overlay, flipped left to right with `texture.repeat.x = -1` and
  `texture.offset.x = 1`. At 851 × 393:
  - the interior mirror top centre, about 240 × 60 px;
  - the door mirrors at the left and right edges, about 150 × 100 px, above the touch controls.
- **Cost.** The quality tier (WP5) sets each target's size and how many mirrors update per frame.
  Until WP5: render one mirror per frame, in turn, into 256 × 128 targets.
- **Also, optionally:** the same textures on the glb's own mirror glass, at no extra render cost.

**Done when** (vitest, with `@dimforge/rapier3d-compat` running headless):

- **Every check in `physics/car-check.cjs` passes** in vitest, through `src/sim/physics/drive.ts`:
  - creep settles at 4–6 km/h, and reverse creep at −4 to −6 km/h;
  - 0–30 km/h takes 2.5–3.5 s, and braking from 30 km/h stops in 4–6 m;
  - on the hill, the handbrake alone and the brake alone each hold, moving at most 0.05 m in 5 s;
  - on the hill, with nothing held the car rolls back more than 0.30 m within 2 s, and with a 10%
    brake more than 0.30 m within 3 s;
  - releasing the handbrake with 40% throttle rolls back under 0.05 m, and 60% throttle climbs at
    least 2 m in 5 s;
  - at walking pace, the full-lock rear-axle radius is 3.43 m ± 0.15;
  - creeping over a 0.13 m kerb: no wheel leaves the ground and the body never touches it.
- **Hill reverse.** Holding S at rest on the hill never selects reverse.
- **Steering schedule.** Steering lock follows the PRD's schedule.
- **Frame conversion.** A unit test checks it.
- **Mirrors**, tested without rendering: project points through each mirror camera and apply the
  display flip.
  - A pole behind the car, moved toward the car's left, moves left in all three mirrors.
  - Each door mirror shows the car's own flank, by the rear wheel, at its inner edge: the right
    edge of the left mirror and the left edge of the right mirror.
- **Scripted drive.**
  - The driver produces steering, throttle and brake through the same input layer as the
    keyboard, with no teleports.
  - It follows each driven piece of `route.samples` (the line breaks at the two manoeuvres) from
    the spawn to the exit road, at 15 km/h or less, and 10 km/h
    or less in the S and Z.
  - No tyre touches a kerb.
- **Size.** The Low-tier car transfers 5 MB or less.
- **Report:** triangles and bytes for each file, and every physics value that changed from the
  table, with the test that needed it.
