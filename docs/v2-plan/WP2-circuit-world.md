# WP2: The circuit world, sim/world plus its colliders (about 1 day)

Paste everything below the line into Claude Code started in
`C:\Users\ASUS\Documents\2026\SEM 2\FYP\FYP1 D-Day\SourceCode\SD032-sim-v2`. It can run at the
same time as WP1 and WP3.

---

Build the DriveMy practice yard into `src/sim/world`, from data. It is the real ARM Driving
Institute yard, traced off the drone photo and already checked. Your job is to turn it into the
3D world and its colliders, not to redesign it. Every practice level uses this one world: build
it once and never rebuild it when the level changes.

**Read first:**

- `docs/circuit-v2/README.md`: the format, the frame, and the route.
- `docs/circuit-v2/circuit-plan.png`: what the world must look like from above.
- `docs/circuit-v2/yard-vs-photo.png`: the same kerb lines over the real yard.
- `docs/v2-plan/RULES.md` and `src/sim/contracts.ts`.

**Build:**

- **Placement.** Place everything from `docs/circuit-v2/circuit.json`; hand-place nothing. The
  three.js frame is `X = x, Y = z, Z = -y`, and car yaw equals the circuit heading.
- **Ground.**
  - Grass over `site.bounds`.
  - The pavement as one mesh built from `kerbs.rings`, read even-odd: ring 0 is the yard's edge,
    and every other ring is a hole (an island, or a thin wall along the hill and the ramp).
  - Real CC0 concrete and grass textures, at 512 px on the Low tier.
- **Kerbs** along every ring.
  - 0.13 m high and 0.20 m wide, on the grass side, yellow and black in 1 m dashes.
  - One instanced or merged mesh.
  - Where a ring runs over a slope, the kerb follows the slope's height.
- **The two slopes,** from `slopes[]`.
  - The hill is the strip along the top of the yard, driven east.
  - The ramp stands on the open floor at the top right, in line with the hill: a flat run-in,
    a slope up to a 0.6 m platform, and an end wall.
  - Each has a deck following its profile, solid walls along its sides, and kerbs on the deck
    edges. The thin wall rings in `kerbs.rings` mark where those walls stand.
  - Use trimesh colliders. The car must not be able to fall off either.
- **Markings.** Paint only what the rules name: the PRD found that a flat arrow on the road never
  enters the driver's view. Route guidance is a floating marker, built in WP4.
  - The hill's yellow stop band (`stations[hill-start].stop_band`).
  - The two painted boxes from each `bay`: the side-parking bay (open at its mouth) and the
    6.6 × 2.5 m box inside the parallel recess.
  - The road-merging finish line.
  - Optionally, a small number board at each station (1–8).
- **Obstacles and props.**
  - The five poles from `obstacles.poles`: red and white, 1.2 m tall, standing on `base_z` when it
    is given. They are solid against the car body.
  - Booths and the office as simple boxes.
- **Spawn and start points.** Export `spawn` (position and heading) for the assessment, and every
  station's `start` for practice. Changing level moves the car to that start; nothing reloads.
- **For the rules engine:**
  - **`kerbContact(point): number | null`.** It returns the kerb ring index when a tyre contact
    point lies on a kerb strip. A strip runs from the pavement edge out 0.20 m into the grass. Use
    a spatial index over the ring segments.
  - **Pole collisions.** Every pole collider carries its index, so WP3 can turn body–pole
    collisions into `obstacle-hit` events.
- **Top-down camera.** An orthographic top-down camera framed to `site.bounds`. Practice mode and
  the acceptance screenshot both use it.

**Rule for changes.** Don't change geometry in the app. If something is wrong:

1. Change `docs/circuit-v2/generate.py`.
2. Run `generate.py`, then `check.py`, then `render.py`.
3. Use the new `circuit.json`.

**Done when:**

- `npm run check:circuit` prints PASS (44 checks).
- A test loads `circuit.json` and finds each of these in the scene, within 1 cm of its JSON
  position:
  - every gate
  - every bay
  - every pole
  - both slopes
  - every booth
  - the spawn and every station's start
- A test of `kerbContact` agrees with the rings: points 0.05 m outside an edge hit; points
  0.05 m inside miss.
- A straight-down orthographic screenshot framed to `site.bounds` shows the same layout as
  `circuit-plan.png`. Save both side by side in `docs/circuit-v2/frames/world-vs-plan.png`.
- Switching practice level ten times in a row builds no new meshes (count them).
- On the Low tier, the world adds about 10 draw calls at most.
