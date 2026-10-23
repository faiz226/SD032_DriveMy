# WP5: Phones and the performance gate (about 1 day)

Paste everything below the line into Claude Code started in
`C:\Users\ASUS\Documents\2026\SEM 2\FYP\FYP1 D-Day\SourceCode\SD032-sim-v2`. Start it after WP4.

---

Make the DriveMy v2 simulator meet its phone targets, and measure them.

**Read first:** `docs/v2-plan/RULES.md`, the "Test conditions" section.

**Quality tiers:**

| | Low (default on Android phones, Redmi 9T class) | Medium (iPhone Xs class and desktops) |
|---|---|---|
| Textures | 512 px | 1024 px |
| Shadows | None; a contact shadow under the car | One sun, 1024 px shadow map |
| Render scale | Dynamic, 0.7–0.85, aiming for 30 fps | 0.85–1.0 |
| Car paint | | Clearcoat |
| Mirrors | One mirror updated per frame, in turn; 256 × 128 targets | All three every frame; 512 × 256 targets |

- Detect the tier, and allow a manual override.
- Quality never changes in the middle of a station.

**Loading:**

- Lazy-load the simulator chunk.
- Runtime-cache the simulator assets: Workbox, never precached, with a size limit above the
  largest file.
- Rapier needs `wasm-unsafe-eval` in the Content-Security-Policy. Add it in `vercel.json`,
  `public/_headers`, and wherever `scripts/csp-hash.mjs` builds the policy.

**Measure** (record every figure in `docs/v2-plan/RESULTS.md`):

- **Time to first drive** and **bytes transferred**.
  - Timed from tapping Start to the car accepting input (`performance.mark` at each end).
  - Cold cache, with Chrome's network throttled to 9 Mbps down, 3 Mbps up and 80 ms round trip.
- **Frame rate.** p50 and p95 frame time over a 10-minute scripted run, from an in-app frame probe.
- **Memory**, where the browser reports it.

**Phones.** Run on a Redmi 9T (Android Chrome) and an iPhone Xs (Safari) if they are to hand.
Otherwise use Chrome DevTools device mode at 851 × 393 with 4× CPU throttling, and label every
figure "emulated".

**Done when:**

- Time to first drive is 15 s or less.
- 12 MB or less is transferred before the first drive.
- On the Low tier, frame rate is 30 fps or more at p50, with p95 reported.
- `RESULTS.md` holds the numbers, each marked real or emulated.

**If a target is missed,** cut in this order and re-measure:

1. Medium tier everywhere becomes Low.
2. Mirror targets halve to 128 × 64.
3. Car texture size.
4. Kerb detail.
5. The interior mirror on the Low tier. The door mirrors stay.

Report what was cut.
