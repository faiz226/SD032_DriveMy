# DriveMy v2: performance results (WP5, re-measured 21 Oct)

**Every figure here is emulated.** No Redmi 9T or iPhone Xs was to hand, so the runs used Chrome's
device emulation, as `RULES.md` allows. The raw output of each run is in `perf/`.

## How it was measured

`scripts/sim-perf.mjs` opens the simulator's performance build in a fresh Chrome profile and lets the
autopilot (`?autopilot=1`, the same scripted assessment the tests drive) drive the circuit.

| Condition | Low tier (the phone run) | Medium tier (reference) |
|---|---|---|
| Viewport | 851 × 393 at 2.75 device pixels per CSS pixel | 1280 × 720 at 1 |
| CPU | 4× throttling | none |
| Network | 9 Mbps down, 3 Mbps up, 80 ms round trip | same |
| Cache | cold: a fresh profile, HTTP cache on, as on a first visit | same |
| User agent | Android (Redmi 9T), so the tier detected is Low; touch on | desktop Chrome, so Medium |
| GPU | the laptop's Intel Iris Xe through ANGLE (Direct3D 11), standing in for the phone's | same |

- **Time to first drive** runs from navigation start to the car's first driven physics step
  (`performance.mark('sim:drive')`). The autopilot presses Start as soon as the car is ready, so no
  human reaction time is included.
- **Bytes** are everything the page downloaded before that step.
- **Frame time** comes from the in-app probe (`?perf=1`): every frame over 10 minutes of driving.
- **Memory** is Chrome's JavaScript heap.

**One caution.** The laptop was also running other heavy programs (an IDE, several assistants, a
browser), which took 3–50% of the CPU during the runs. Identical one-minute trials varied by up to 2×.
The table reports the one official 10-minute run, not the best trial.

## Results (19 Oct)

The 21 Oct re-measure, after the other cars and the landscape, is at the end.

**Low tier** (phone), 19 Oct 2026, `perf/low-emulated.json`:

| Measure | Result | Target | |
|---|---|---|---|
| Time to first drive | 9.5 s | 15 s or less | met |
| Transferred before the first drive | 5.8 MB in 71 requests | 12 MB or less | met |
| Frame time, p50 | 49.9 ms (20 fps) | 30 fps or more | **missed** |
| Frame time, p95 | 96.7 ms (10 fps) | reported | |
| Frame time, p99 | 122 ms | reported | |
| JavaScript heap | 24 MB used of 59 MB | reported | |
| Draw calls per frame | 71 (about 120 on a frame that refreshes a mirror) | reported | |

**Medium tier** (desktop reference: no CPU throttling, the same network), 3 minutes,
`perf/medium-desktop.json`:

| Measure | Result |
|---|---|
| Time to first drive | 15.2 s (7.1 MB: the 1024 px car and textures). The load gate is for phones. |
| Frame time, p50 / p95 / p99 | 12.4 / 15.1 / 18.2 ms (81 / 66 / 55 fps) |
| JavaScript heap | 32 MB used of 88 MB |
| Draw calls per frame | about 300 (all three mirrors every frame, plus the sun's shadow map) |

## What WP5 changed to get here

Measured one change at a time, in one-minute trials; each line says what the trial showed.

1. **The 3D engine left the first page load.** three.js, React Three Fiber and Rapier had been bundled
   with every page; now they load only with the simulator. The shared library file every page loads
   fell from 3.8 MB to 0.6 MB.
2. **The mirrors stopped re-compiling their view of every material.** three.js renders into a
   texture with different colour settings from the screen, so each material switched shader programs
   twice a frame. The mirror targets now use the screen's colour settings. The profiler showed the
   program lookups fall from about 10% of the frame to 3%.
3. **One mirror refreshes every other frame on the Low tier**, in turn, at 8-bit colour.
4. **The speed readout updates when the speed changes by 0.5 km/h**, not on every physics step.
5. **Shaders compile while the car loads**, not on the first driven frames.
6. **The car and textures start downloading when the route opens**, alongside the engine's code.
7. **The service worker waits on simulator routes:** its 4 MB precache starts once the car is ready.
8. **The Low tier's car has 47 body materials instead of 55:** cabin trim that looks the same is
   merged (`scripts/swift_web.py`; the exterior keeps every material). The Low tier also drops the
   paint's clearcoat and draws a painted shadow under the car instead of a shadow map.

## The frame-rate target and the cut list

WP5's cut list, if a target is missed: (1) Medium everywhere becomes Low; (2) mirror targets halve to
128 × 64; (3) smaller car textures; (4) less kerb detail; (5) no interior mirror on the Low tier.

**None of them was applied.** The trials show why. The frame time is bound by the CPU's cost of issuing
draw calls, not by the GPU filling pixels. With all three mirrors switched off (`?mirrors=0`), the Low
tier still ran at only 25–27 fps p50 in the trials. Cuts 2–4 reduce GPU work, and cut 1 is already
the case on a phone. Cut 5 removes one mirror from the rotation, but the cost per frame is one mirror
render every other frame either way.

**What would reach 30 fps** is far fewer draw calls for the car: baking its 47 body materials into
one or two texture atlases, so the body draws in two or three calls instead of about 47. That is a
day's Blender work, too large for the time left, and is listed as future work.

The two load targets are met with room to spare.

## 21 Oct: after the other cars, the lamps and the land round the yard

Re-measured the same way after the 20–21 Oct work: five moving cars and three parked ones, a signalled
junction, lamps on every car, the trees, hills, clouds, terraces and street lights. The first run showed both
loading and driving had slowed, so the cause was found by profiling, fixed where it was cheap, and the runs
repeated.

**Low tier** (phone), after the fixes, `perf/low-emulated-21oct.json`:

| Measure | 19 Oct | 21 Oct | Target | |
|---|---|---|---|---|
| Time to first drive | 9.5 s | 19.3 s | 15 s or less | **missed** |
| Transferred before the first drive | 5.8 MB in 71 requests | 6.1 MB in 72 requests | 12 MB or less | met |
| Frame time, p50 | 49.9 ms (20 fps) | 33.6 ms (30 fps) | 30 fps or more | borderline |
| Frame time, p95 | 96.7 ms (10 fps) | 103.5 ms (10 fps) | reported | |
| Frame time, p99 | 122 ms | 159 ms | reported | |
| JavaScript heap | 24 MB used of 59 MB | 30 MB used of 98 MB | reported | |
| Draw calls per frame | 71 (about 120 refreshing a mirror) | 86 (about 155 refreshing a mirror) | reported | |
| Triangles per frame | not recorded | 0.5 M (1.0 M refreshing a mirror) | reported | |

The frame rate is not steady over the drive. Minute by minute it ran at 13–18 fps for the first four minutes
(the start, the hill and the bays, where most of the yard, its traffic and its trees are in view) and 24–31 fps
after. The p50 of the whole run is the figure the target names, but the start of the drive is well under it.

"First drive" now also includes the start sequence (the brief, then the engine): here 1.2 s, since a headless
browser has no sound and the brief is skipped. With sound, the brief adds its own length.

**Medium tier** (desktop reference: no CPU throttling, the same network), 3 minutes,
`perf/medium-desktop-21oct.json`:

| Measure | 19 Oct | 21 Oct |
|---|---|---|
| Time to first drive | 15.2 s (7.1 MB) | 31.4 s (7.3 MB). The load gate is for phones. |
| Frame time, p50 / p95 / p99 | 12.4 / 15.1 / 18.2 ms (81 / 66 / 55 fps) | 23.6 / 38.2 / 60.5 ms (42 / 26 / 17 fps) |
| JavaScript heap | 32 MB used of 88 MB | 48 MB used of 96 MB |
| Draw calls per frame | about 300 | about 395 |
| Triangles per frame | not recorded | 2.0 M |

On Medium every tree was drawn in the main view, each of the three mirrors and the sun's shadow map, at full
detail: the first 21 Oct run gave 22 fps p50 and 2.4 M triangles. The woodland outside the fence now has coarse
crowns and casts no shadow (the trees inside the fence keep both), which doubled the frame rate to 42 fps.

**Why it slowed: the 19 Oct build and the 21 Oct one, side by side.** Both were built and timed in one session,
alternately, so the laptop's other load affects both alike. Before the fixes, loading took 8.5–11.9 s on the
19 Oct build and 16.7–23.8 s on the 21 Oct one; the profile of each shows where the difference went:

| Loading cost (Low, 4x CPU throttling) | 19 Oct | 21 Oct, before the fixes |
|---|---|---|
| Shader programs: compiling, and waiting for them on first use | 0.7–0.8 s | 3.4–3.8 s |
| Placing the trees | none | 3.0 s |
| The other cars' geometry, built twice | none | 0.9 s |
| Building the yard | 0.55 s | 1.0–1.5 s |
| The traffic model | none | 0.3 s |

While driving, the profile's largest single cost was the traffic model's projection of points onto paths:
a fifth of the main thread.

**What was fixed** (each measured by profiling, under the phone's conditions):

1. **The projection** compares squared distances and takes segment lengths from the stored path, with no square
   roots in its loop, and a car skips any body further away in a straight line than its look-ahead. A fifth of
   the main thread became about 4%.
2. **Placing the trees** rules kerb rings out by their bounding boxes, stops at the first near side, and checks
   spacing against a grid's neighbouring cells only. 3.0 s became about 1.0 s, with the same trees.
3. **The clouds** were 65 sprites, each its own draw call; they are now one mesh. Draw calls fell from 97–109 to
   86–88 on frames without a mirror.
4. **The other cars** leave out the cabin's insides, hidden behind their dark opaque glass (a third of the body's
   triangles), and are built once for the parked and the moving cars.
5. **The terraces and street lights** are drawn with the yard's own material, so they need no shader programs of
   their own: 45 programs became 43.
6. **The trees:** the rain trees' crowns are coarser (a quarter of the triangles) on the Low tier, and on Medium
   for the woodland outside the fence, which no longer casts shadows.

**What remains, and what would recover the load target.** Most of the remaining load time is shader programs:
22 of the 43 are the Swift's own materials. Baking the car's materials into one or two texture atlases, the
future work already listed for the frame rate, would remove most of those and recover several seconds. Building
the distant scenery (the woodland, terraces and hills) after the car is ready, while the instructor reads the
brief, would take it out of the wait as well. Neither was done in the time left.
