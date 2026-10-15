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
