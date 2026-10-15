# DriveMy v2: the build plan (14–23 Oct 2026)

Everything is decided, so an AI worker can build from these files alone without asking anyone:

- `RULES.md`: every rule decision and its basis.
- `rules.json`: the numbers.
- `../circuit-v2/`: the map: the real ARM yard, traced and checked.
- `contracts.ts`: how the modules fit together.
- `REFERENCES.md`: the open-source code the car and mirrors borrow from, with licences.
- `physics/`: headless checks that prove the car's physics and the mirror cameras.

The owner's job is to paste each work package into Claude Code, play what it builds, and report
what feels wrong.

## How to run it

1. Paste `WP0-setup.md` into Claude Code started in the **main app folder**. It creates the
   simulator workspace `SD032-sim-v2` and never touches your uncommitted work.
2. Start every later session in
   `C:\Users\ASUS\Documents\2026\SEM 2\FYP\FYP1 D-Day\SourceCode\SD032-sim-v2`, and paste the
   next work package.
3. After each package, read its report. Fix-ups go to the same session: say what's wrong; don't
   paste the next one yet.
4. To go faster, run WP1, WP2 and WP3 at the same time, each in its own session. For that, tell
   each session first: "Work in your own git worktree on a branch made from `feat/sim-v2`, and
   merge it back into `feat/sim-v2` when you are done."

## Schedule

| Day | Work | Paste |
|---|---|---|
| Wed 14 Oct | Workspace, then the rules engine | WP0, then WP1 |
| Thu 15 Oct | The circuit world; the car starts | WP2, then WP3 |
| Fri 16 Oct | The car finishes; screens and verdict start | WP3 (finish), then WP4 |
| Sat 17 – Sun 18 | Buffer for anything running late | — |
| Mon 19 Oct | Phones and the performance gate | WP5 |
| Tue 20 Oct | Final acceptance runs and demo capture; you play the walkthrough | WP6 |
| Wed 21 – Thu 22 | Report and demo preparation, from `REPORT-DRAFT.md` | — |
| Fri 23 Oct | Submission | — |

## Work packages

| WP | What | Needs | Size |
|---|---|---|---|
| 0 | Workspace, docs, contracts, skeleton | — | 30 min |
| 1 | Rules engine (`sim/core`), all rules and their tests | WP0 | 1 day |
| 2 | Circuit world and colliders (`sim/world`) from `circuit.json` | WP0 | 1 day |
| 3 | Swift assets, physics, controls, first-person camera, mirrors (`sim/physics`) | WP0 (wired to WP2 when ready) | 1.5 days |
| 4 | Screens, HUD, verdict, results sync, both languages (`sim/ui`) | WP1–3 | 1 day |
| 5 | Quality tiers, loading, caching, CSP, measured phone targets | WP4 | 1 day |
| 6 | Acceptance runs, owner walkthrough, demo capture, report draft | WP5 | 1 day |

## Acceptance: the release is done when all of these hold

- [ ] Each of the eight stations clears on its positive drive and refuses its negative drives,
      and only while it is current. Tested every threshold just below, at and just above (WP1).
- [ ] One continuous, input-driven assessment run with no teleports scores 0 demerits and passes
      (WP6).
- [ ] A run with one fault of each kind fails, and lists each fault with its measured value, its
      limit and a fix (WP6).
- [ ] An assessment with no input never passes. Nothing outside the rules engine can mark a pass
      (WP4, WP6).
- [ ] `check.py` passes (44 checks) on the map the app imports. The top-down screenshot matches
      the plan (WP2).
- [ ] Holding brake on the hill never selects reverse. The handbrake holds the car on the hill
      (WP3).
- [ ] The car meets every target in `physics/car-check.cjs`, and the mirrors pass the flip and
      flank checks (WP3).
- [ ] Touch controls show on a touch phone at 800 × 360 and stay hidden on a desktop with a mouse
      (WP4).
- [ ] Switching tabs pauses the run and clears every input (WP3, WP4).
- [ ] Two syncs started together insert one row. A run finished offline syncs exactly once (WP4).
- [ ] The top-down view works in both modes, and an assessment verdict reports how long it was used (WP4).
- [ ] Every practice level uses the one world: picking a level moves the car to that station's
      start with no reload (WP2, WP4).
- [ ] Every threshold shows its basis. The simulator always shows "Practice rehearsal, not
      official marking" (WP4).
- [ ] First drive within 15 s on a cold cache at 9/3 Mbps and 80 ms, within 12 MB (WP5).
- [ ] 30 fps or more at p50 on the Low tier, real or emulated, with the label recorded (WP5).
- [ ] The owner's walkthrough is filled in, and what it found is fixed or listed (WP6).

## Cut line

If the schedule slips, drop these in this order:

1. The Medium tier. Low runs everywhere.
2. Toast polish: plain text toasts.
3. The station number boards and decorative markings.
4. The mirrors. The top-down view covers what they show.
5. The offline result queue. Results save only when online.
6. The ramp's reverse-out requirement. The ramp then clears at the stop and hold.

**Never cut:**

- The eight stations' rules.
- Current-only arming.
- The verdict built only from session state.
- Brake kept separate from reverse.
- Inputs cleared on focus loss.
- The time-to-first-drive gate.

## Decisions that were open in the PRD, and where they now live

| Was open | Now | Where |
|---|---|---|
| Submission date | Friday 23 Oct 2026 | PRD |
| Instructor review, criteria approval | None available; every rule decided with a stated basis | `RULES.md` |
| Kerb contact | 5 per contact, tyres only | `RULES.md` |
| Hill stop zone, stillness, hold | 0.6 m band, 5 cm, 2 s, with the handbrake | `RULES.md` |
| Three-point turn, more than 3 movements | Fails the station | `RULES.md` |
| Ramp handbrake | Not required. The ramp is now a stop-before-the-pole station | `RULES.md`, `../circuit-v2/` |
| Top-down view in assessment | On, with its use reported: phone mirrors are small and there is no head movement | `RULES.md` |
| Mirrors | In v2: the interior mirror and both door mirrors, as screen insets | `RULES.md`, WP3 |
| Driving mechanics | Borrowed from open-source code (Rapier's ray-cast vehicle, three.js render targets), proven by headless checks | `REFERENCES.md`, `physics/` |
| The map | The real ARM yard, traced off the drone photo; one map for every level, with a start point per station | `../circuit-v2/` |
| Which lane is the three-point-turn lane | The 7.64 m lane beside the Z | `../circuit-v2/` |
| Hill rise | 1.3 m (12%), kept | `../circuit-v2/` |
| Bay poles | Four corners, 0.3 m outside the lines | `../circuit-v2/` |
| Devices, OS versions | Latest on each phone, or emulation labelled as such | `RULES.md` |
| Network profile | 9/3 Mbps, 80 ms | `RULES.md` |
| Learner sessions | Replaced by the owner's walkthrough (WP6) | `RULES.md` |
| Dev hours | Work is done by AI workers from these packages; you paste, play and report | this file |
