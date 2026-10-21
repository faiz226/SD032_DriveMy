# DriveMy v2: asset plan for a better-looking yard (and every sound the app needs)

A plan, written 20 Oct 2026. Nothing below is built yet except where marked **done**. It is for the owner,
and for whoever builds it next.

## Where it stands

- **The yard** is five merged meshes built from `circuit.json` (grass, concrete, kerbs, painted lines, and
  "things": sheds, fence, poles), drawn in five calls, with two tiling textures (concrete and grass: 512 px on
  the Low tier, 1024 px on Medium, 232 KB together). The car, not the yard, is what costs draw calls.
- **The light** (20 Oct): a sky-gradient light probe, a hemisphere fill and the sun, with a shadow map on Medium.
- **What makes it look plain**, from `demo/`: flat concrete with visible tiling; boxes for buildings; grass that
  ends at a bare edge under an empty horizon; no trees, signs or people; paint that is uniform and crisp.

**Four limits every item must respect:**

1. **Draw calls on the Low tier.** Phones measured 20 fps against the 30 fps target, bound by draw calls, not
   pixels (`RESULTS.md`). Everything here is merged or instanced: the whole plan may add **at most 6 draw calls on
   Low**, and an item that cannot fit is Medium-only.
2. **Download.** The first drive costs 5.8 MB of Low's 12 MB budget. The plan may add **at most 2 MB on Low**
   (4 MB on Medium), with KTX2 textures and meshopt geometry.
3. **The geometry is evidence.** The circuit was traced off the ARM Driving Institute's drone photo and proved
   by 38 checks. Decoration never moves a kerb, line, pole or bay: `npm run check:circuit` stays 38/38.
4. **Signs are sourced, never generated** (the Jalan rule): Arahan Teknik Jalan shapes only. A plausible but
   wrong sign teaches a learner the wrong answer.

**Done (21 Oct), in code rather than from the files below** (`src/sim/world/Scenery.tsx`, `build.ts`, `World.tsx`):
the horizon (item 6: two rings of hazy hills, clouds, a painted sky, grass running on to the haze), fog matched to
the horizon (item 5, the fog half), trees (item 9: rain trees and palms, instanced, half the woodland on Low),
light and shade over the grass (item 3, by noise instead of a second texture), windows and doors on the booths and
the office (instead of item 7's model), and from Phase 4 the flag. Also beyond the plan: bougainvillea, street
lights and terrace houses. Its draw calls on the Low tier are not yet measured against limit 1.

## The look: one palette, each colour with a job

Following game-juice's palette pillar and Jalan's thesis (the road is the interface, the signage is the content):

| Role | Colour | Why |
|---|---|---|
| Asphalt, recedes | warm mid grey `#5b5a57`, aged `#6d6b66` | most of the screen; must not compete |
| Concrete apron | `#8e8b84` | separates parking areas from the road, as on the real yard |
| Grass, recedes | desaturated tropical green `#5f7f3f`, dry patches `#8a8a5a` | real KK grass is patchy, not lawn-green |
| Paint, the signal | JPJ white `#e9e7df` (worn), yellow `#e3b52c`, kerb yellow and black | the brightest things in the scene, as on a real yard |
| Markers | the app's `paint` and `awas` tokens | station starts and the "where next" chevron stay the app's own |
| Sky | horizon haze `#dfe9ef` to zenith `#7fb2e5` | a tropical morning; the light probe already uses these |
| Fog | the horizon colour, from about 120 m | the site edge dissolves instead of ending |
| Sun | about 9:30 a.m. in Kota Kinabalu: high (about 45 deg), from the east-north-east | short, soft shadows that still show a kerb's height |

## Phase 1: ground, sky and horizon (most of the screen, least cost), about 1 day

| # | Asset | Source | Low | Medium |
|---|---|---|---|---|
| 1 | Asphalt: albedo and roughness tiling at 1024 px, plus a 256 px macro map (stains, polish along the driven line) blended in so the tiling never shows | `3D Assets/Textures/Road001` (ambientCG, CC0) | +0 calls, +400 KB | +0, +900 KB (2048) |
| 2 | Concrete apron | `3D Assets/Textures/Concrete030` (ambientCG, CC0) | +0, +250 KB | +0, +600 KB |
| 3 | Grass: two grass textures mixed by a noise map, darker along the fence line | ambientCG grass sets (CC0) | +0, +250 KB | +0, +500 KB |
| 4 | Worn paint: a wear mask on the paint mesh, so lines are faded and chipped, not printed | a 256 px noise texture | +0, +40 KB | same |
| 5 | Fog matched to the horizon; the sun turned to the 9:30 a.m. angle | code only | +0 | +0 |
| 6 | Horizon: one cylinder round the site carrying a tree-line and hills band (alpha), and a ground disc beyond the fence | a CC0 panorama, or a painted tree-line silhouette (not a sign, so allowed) | +1 call, +300 KB | +1, +600 KB |

## Phase 2: buildings and set dressing, about 1 day

| # | Asset | Source | Low | Medium |
|---|---|---|---|---|
| 7 | The institute office and a waiting shed | `3D Assets/Small house.glb` (4.3 MB) cut to about 8k triangles and one atlas material, under 300 KB | +1 | +1 |
| 8 | Perimeter fence, one module instanced along the boundary | `3D Assets/concrete_fence.glb` | +1 | +1 |
| 9 | Trees: two or three kinds common in Sabah (rain tree, palm, angsana), low poly and instanced; billboards past 40 m, and billboards only on Low | Poly Haven or Quaternius (CC0) | +2 | +3 |
| 10 | Traffic cones at station starts | `3D Assets/traffic_cones.glb` is 15 MB: rebuild as one cone under 1k triangles, instanced | +1 | +1 |
| 11 | Concrete barriers by the ramp and the merge | `3D Assets/concrete_barrier.glb`, cut down, merged with item 8 | +0 | +0 |
| 12 | Station boards: number and name at each station start, Jalan plate style, both languages, from one canvas atlas | made in the app | +1 | +1 |
| 13 | Give Way and Stop signs at the merge | `src/assets/signs` (verified sources only) merged with item 12 | +0 | +0 |

Phase 2 totals **6 draw calls on Low** with Phase 1: the limit.

## Phase 3: light that sells it, about half a day

| # | Asset | Low | Medium |
|---|---|---|---|
| 14 | Baked ambient occlusion: kerbs, walls and buildings darken the ground beside them. Baked once in Blender into a lightmap on the ground's second UV set | +0 calls, +300 KB (1024) | +0, +600 KB (2048) |
| 15 | Contact shadows under props (cones, barriers, the office), baked into the same lightmap | +0 | +0 |
| 16 | Medium only: SMAA and a faint vignette. No bloom: nothing in a daylight yard should glow | none | +2 passes |

## Phase 4: life (after submission)

The ambience bed below; trees swaying (a vertex shader, Medium only); a flag at the office; a few birds crossing
the sky; a second car parked by the office.

## Sound: what exists and what the app still needs

**Done (20 Oct):** the engine start and idle loop (the owner's recording, pitched with speed), the fault tone
(synthesised), and the instructor voice (Fish Audio text-to-speech, English and BM: the station briefs and
four outcomes, `scripts/gen-voice.mjs`; the free-drive brief since 21 Oct).

**Still needed, most useful first:**

| Where | Sound | Notes |
|---|---|---|
| Rules | station starts (soft chime), station cleared (rising chime), station failed (low buzz) | the three moments a learner most needs to hear |
| Rules | tyre over a kerb (rubber thump and scrub), pole touched (plastic knock) | a sound for the fault itself, under the fault tone |
| Car | handbrake pulled and released (ratchet), gear selector D and R (click) | every control the learner touches should answer |
| Car | engine off on leaving; a second, higher engine loop to cross-fade with under throttle | the single loop thins out above 20 km/h |
| Ambience | the yard: birds, light wind, cicadas, distant traffic and motorcycles | one 30 to 60 s seamless loop; muffled inside the car with a Web Audio low-pass, no second file |
| Rules | the last 10 s of a station's time (soft ticks); verdict pass (short, warm); verdict fail (neutral, never mocking) | Jalan's voice: factual, not consoling |
| Car | indicator tick, horn, door shut and seatbelt click at the start | immersion; only if indicators or a horn are added |
| Voice | fault callouts (kerb, pole, rolled back, not in the bay), a "begin" line | the same script, more keys |
| App | quiz answer right and wrong; mock test time warning and time up; result reveal | outside the simulator; keep every other tap silent |

Sources: freesound.org (CC0 or CC-BY, attribution recorded), Pixabay sounds (royalty-free), or recorded. Every
file's source and licence goes in `REFERENCES.md` before it is committed.

## Pipeline

- **Build:** Blender (`3D Assets/`, `Blender/`) to glTF, one file per prop family; `gltf-transform` to weld,
  simplify, meshopt-compress and convert textures to KTX2 (UASTC for normal maps, ETC1S for colour). Low and
  Medium variants, as the car has.
- **Draw:** instanced with drei's `Instances`; still props merged into the "things" family; small props share one
  texture atlas.
- **Load:** after the car, added to `assets.ts`'s per-tier preload; runtime-cached by the service worker (the
  `sim-assets` rule already covers `/sim/**`).
- **Licences:** record each asset's source and licence before committing. ambientCG and Poly Haven are CC0. The
  models in `3D Assets/` have no recorded source yet (`metal_barrier__game_ready__4k.glb` looks like a Sketchfab
  download): check each before shipping it.

## How it is accepted

- **Before and after**, from five fixed viewpoints (first person at the spawn, the side-parking bay, top-down,
  explore over the S and Z, the ramp), captured with `scripts/sim-demo.mjs`.
- **Phones:** `scripts/sim-perf.mjs` on the Low tier: first drive 12 MB or less and 15 s or less, frame time no
  worse than today's 49.9 ms p50.
- **Nothing moved:** `npm run check:circuit` 44/44 and `npm test` green.

**Recommendation for the deadline (Fri 23 Oct):** Phase 1 only, about a day. It changes most of what the screen
shows for one extra draw call. Phases 2 to 4 go in the report as future work.
