# DriveMy v2: open-source references for driving and mirrors (14 Oct 2026)

The car's driving, braking and mirrors follow published open-source code, so nothing has to be
invented. This file lists what to borrow, where it lives, and its licence. Licences were checked
on GitHub on 14 Oct 2026.

**Rules for workers:**

- **Adapt, don't paste.** Write our own code following the pattern. If more than a few lines are
  reused from an MIT or Apache-2.0 source, keep its copyright notice in `THIRD_PARTY_NOTICES.md`.
- **GPL sources are for reading only.** Their code cannot go into this app.
- **No reverse engineering.** Every source below publishes its code. Mechanics are never pulled
  out of commercial games (Mario Kart, Need for Speed and so on): the project has no right to
  their code, and a final-year project cannot contain it. The REA toolkit
  ([morluto/rea](https://github.com/morluto/rea), MIT) is therefore not needed. Its own README
  limits it to lawful uses such as research and interoperability.

## Use these

| What | Source | Licence | What to take |
|---|---|---|---|
| The car's physics | Rapier's `DynamicRayCastVehicleController`. It is already installed: `@dimforge/rapier3d-compat` 0.19.2, under `@react-three/rapier` 2.2.0. Create it with `useRapier().world.createVehicleController(chassis)`. It is a port of Bullet's ray-cast vehicle. API: `node_modules/@dimforge/rapier3d-compat/control/ray_cast_vehicle_controller.d.ts`. Source: [dimforge/rapier](https://github.com/dimforge/rapier/blob/master/src/control/ray_cast_vehicle_controller.rs). | Apache-2.0 | Suspension, tyre grip, steering, engine force and brakes. Start from the values in WP3, which `physics/car-check.cjs` proves. |
| A shipped web car on the same controller | Bruno Simon's 2025 portfolio, [`sources/Game/Physics/PhysicsVehicle.js`](https://github.com/brunosimon/folio-2025/blob/main/sources/Game/Physics/PhysicsVehicle.js) | MIT | The wiring: one `addWheel` per wheel, then the per-wheel setters; inputs set before `updateVehicle(1/60)` on every step; a stopped/started test with two thresholds. Its numbers suit a toy car of mass 2.5, so don't copy them. |
| React layout for a car | pmndrs [`racing-game`](https://github.com/pmndrs/racing-game), `src/models/vehicle/` (Vehicle, Chassis, Wheel) | MIT code, CC0 assets | Splitting the car into chassis, wheel and vehicle components, and a small zustand store for held keys. Its physics is cannon, not Rapier: take the structure only. |
| Mirrors | three.js manual, ["Render Targets"](https://threejs.org/manual/en/rendertargets.html). drei's `useFBO` and `Hud` (installed: drei 10.7.7). | MIT | Render a rear-facing camera into a small texture, show it on a quad, and flip it left to right with `texture.repeat.x = -1` and `texture.offset.x = 1`. |

## Read for ideas only

| Project | Licence | Why it is not used |
|---|---|---|
| [SuperTuxKart](https://github.com/supertuxkart/stk-code), the open-source Mario Kart | GPL-3.0 | Its kart physics (`src/physics/btKart.cpp`) grows out of the same Bullet ray-cast vehicle that Rapier ports, tuned for arcade racing. It is C++ and GPL, and adds nothing a 5–20 km/h test needs. |

## What the headless check found (`physics/car-check.cjs`)

These matter to anyone tuning the car. Each was seen in Rapier's source or in the check.

- **A driven wheel's brake is ignored.** While a wheel has engine force, Rapier skips its brake.
  So any brake sets every wheel's engine force to 0.
- **Suspension force scales with the car's mass.** Rapier multiplies spring and damper forces by
  the chassis mass, so stiffness is per kilogram. Values from toy examples don't transfer.
- **Reverse from rest needs an awake car.** Only positive engine force wakes a sleeping chassis.
  Create the chassis with `canSleep` off.
- **The forward-axis setter is a property.** The typings name it `setIndexForwardAxis`, but it is
  assigned, not called. The defaults (X forward, Y up) already match the car, so leave it alone.
- **`currentVehicleSpeed()` is the 3D speed.** Compute horizontal speed for `VehicleSample`.
- **A braked car creeps down slopes.** The wheel impulses act before gravity is integrated, so a
  braked car slides down the 12% hill about 2 cm a second. The fix is the brake hold in WP3: while
  nearly stopped with enough brake held, pin the car along its own axis after each step. It then
  holds with no drift at all.
- **Parallel steering understeers.** Both front wheels at one angle gave a 3.67 m turning radius,
  not 3.43 m. Ackermann steering, one angle per wheel, gives 3.45 m.
- **The body box must clear the kerbs.** Creeping over a 0.13 m kerb, a box whose bottom sat
  0.12 m above the road hit it; at 0.16 m it cleared. WP3 uses 0.20 m, for margin when the nose
  dips under braking.
