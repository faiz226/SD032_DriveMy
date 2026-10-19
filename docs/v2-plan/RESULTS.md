# DriveMy v2: performance results (WP5)

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

## Results

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
