# WP4: Screens, verdict and results (about 1 day)

Paste everything below the line into Claude Code started in
`C:\Users\ASUS\Documents\2026\SEM 2\FYP\FYP1 D-Day\SourceCode\SD032-sim-v2`. Start it after
WP1–WP3 have merged into `feat/sim-v2`.

---

Put the DriveMy v2 simulator together in the app.

**Read first:**

- `src/sim/contracts.ts`.
- `docs/v2-plan/RULES.md` and `rules.json`.
- The app's design-system skill and docs. The app is styled with its own system ("Jalan"), so
  follow it.

**Build:**

- **The route.** Replace `src/pages/Simulation3DView.tsx`'s simulator with the v2 one. Keep it
  behind the existing protected route. Remove the old "Finish Maneuver" manual pass entirely.
- **Loading and orientation.**
  - A progress bar while loading.
  - A rotate prompt in portrait.
  - Pause on focus loss (WP3 clears the inputs).
- **Mode choice.** *Assessment* is the full run, scored and uploaded. *Practice* is a list of the
  eight drills: pick one and restart it at will. Every drill uses the one world, loaded once:
  picking or restarting a drill moves the car to that station's `start` and resets the session,
  with no loading screen.
- **In-run HUD:**
  - **Station panel:** its number, title and tip for 6 s, then shrunk.
  - **Station timer:** counting down the time limit.
  - **Demerit meter:** assessment only.
  - **Fault toasts:** each with a short sound and a small camera kick. One contact with one kerb
    or pole shows once.
  - **"Where next" marker:** a floating marker at the next station's start, using
    `route.samples`.
  - **Readouts:** speed, gear (D/R) and the handbrake.
  - **Label:** "Practice rehearsal, not official marking", always visible.
  - **Top-down view toggle:** WP2's camera, in both modes. Phone-sized mirrors are small and the
    driver cannot move their head, so it stays available. In assessment, log the seconds it is on;
    the verdict shows them, with no penalty.
  - **Mirrors:** WP3 draws them. Keep their three areas clear: the top centre and the left and
    right edges above the touch controls.
- **Verdict:**
  - **Built only from `SessionState.verdict`:** pass or fail, demerits and failed stations.
  - **Each fault:**
    - its station
    - a marker at `at` on a small top-down map drawn from `circuit.json` (match
      `docs/circuit-v2/circuit-minimap.png`)
    - the measured value against the limit
    - one corrective action (`fixKey`)
    - the rule's basis, on request
  - **Buttons:** try the assessment again, or practise the failed station.
- **Results.**
  - Save each assessment run as a versioned record through the existing results service.
  - Use an idempotency key, so two syncs started together insert one row.
  - An already-open, signed-in session that goes offline keeps working, and its result syncs
    exactly once on reconnect.
  - Practice runs are not uploaded.
- **Languages.** Every string goes in both `en.ts` and `ms.ts`. Tips describe only what is
  measured: no clutch wording. Road merging's tip is "Build speed on the approach. Join at road
  speed."

**Done when** (vitest and testing-library):

- The verdict renders only from session state, and no button or path can pass a run.
- The top-down toggle works in both modes, and an assessment verdict reports the seconds it was on.
- Two syncs started together insert one row.
- Every new i18n key exists in both languages.
- Touch controls show at 800 × 360 with touch and a coarse pointer, and stay hidden on a desktop
  with a mouse.
- `npm run build`, `npm test` and `npm run check:circuit` pass.
