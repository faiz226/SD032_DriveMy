# WP6: Final acceptance, demo capture and report draft (about 1 day)

Paste everything below the line into Claude Code started in
`C:\Users\ASUS\Documents\2026\SEM 2\FYP\FYP1 D-Day\SourceCode\SD032-sim-v2`. Start it after WP5.

---

Prove that DriveMy v2 does what its plan says, capture material for the demo, and draft the
report chapters.

**Read first:**

- `docs/v2-plan/PLAN.md` (the acceptance list).
- `docs/v2-plan/RULES.md`.
- `docs/v2-plan/RESULTS.md`.

**Acceptance runs** (scripted inputs through the real input layer: no teleports, no direct state
writes). For the reversing manoeuvres, script the moves that `docs/circuit-v2/check.py` proves
work (its planners in `lib_geom.py` print each plan):

1. **A clean run.** One continuous assessment run from the apron through all eight stations. It
   scores 0 demerits and passes.
2. **Faults on purpose.** One run with one deliberate fault of each kind:
   - a kerb touch
   - a pole touch
   - a rollback
   - not in the bay
   - a fourth three-point-turn movement
   - S speed outside its band
   - a ramp stop outside its window
   - a slow merge

   It fails, and the verdict lists each fault with the right station, measured value, limit and
   fix.
3. **Nothing.** An assessment with no input never passes.
4. **Every item** on PLAN.md's acceptance list is ticked with its evidence: a test name, a figure,
   or a screenshot.

**Owner walkthrough.** There are no learner sessions; the owner is the stand-in learner. Write
`docs/v2-plan/WALKTHROUGH.md` as a checklist for the owner to fill in after one assessment run and
one practice drill of each station:

- Could I follow the route without the map?
- Did each fault message say what I did and how to fix it?
- Did any control feel wrong on the phone?
- Could I judge the bay lines and the kerb in the mirrors, or did I need the top-down view?
- What one thing would I change?

Then fix whatever the owner reports that fits the time left.

**Demo capture:**

- A straight-down screenshot of the world beside `docs/circuit-v2/circuit-plan.png`.
- A first-person screenshot at each station.
- The verdict screen for the clean run and for the fault run.
- If the machine can record, a 60–90 s screen recording of the clean run.
- Save them all in `docs/v2-plan/demo/`.

**Report draft** (`docs/v2-plan/REPORT-DRAFT.md`, for the owner to edit). The sources are the PRD
excerpt, RULES.md, REFERENCES.md, the circuit docs (`README.md` and `AUDIT.md`), the test list and
`RESULTS.md`.
Chapters:

- **Requirements.** What the simulator is, and the eight stations.
- **Design.**
  - The architecture: modules and contracts.
  - The map: the real ARM yard traced off the drone photo at its measured scale, one map for
    every level, with its checks.
  - The rule decisions and their sources.
- **Implementation.** Built inside the existing PWA with React Three Fiber and Rapier. The car runs
  on Rapier's ray-cast vehicle and the mirrors on three.js render targets; the open-source code
  borrowed is listed with its licences (REFERENCES.md).
- **Testing.** The rule tests, `check.py`, the acceptance runs, and the performance figures, each
  marked real or emulated.
- **Limitations.**
  - No official JPJ marking sheet.
  - Decided dimensions: the ramp, the hill rise, the bay poles.
  - No instructor review and no learner sessions.
  - No traffic.
  - An automatic gearbox only.
- **Future work.** A manual gearbox, traffic, head movement, a review by an instructor, and a
  circuit editor.

**Done when:**

- The three acceptance runs pass as described, as automated tests.
- `WALKTHROUGH.md`, the `demo/` folder and `REPORT-DRAFT.md` exist.
- `npm run build`, `npm test` and `npm run check:circuit` pass.
