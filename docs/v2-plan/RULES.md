# DriveMy v2: the decisions (14 Oct 2026)

No instructor, reviewer or test learner is available, so every open question was decided on
14 Oct. Each decision gives its basis. `rules.json` is the machine-readable copy that the app
imports; this file explains it. The simulator labels itself "practice rehearsal, not official
marking", and every threshold shows its basis in the UI.

**Kinds of basis:**

- **rubric:** the app's original JPJ demerit weights (the v1 simulator's score store, `src/stores/carStore.ts`, removed in WP6; see git history).
- **guides:** unofficial Malaysian driving-school notes and learner accounts (sources below).
  They disagree in places, and no official JPJ marking sheet was found.
- **PRD:** already decided in the PRD.
- **decided:** a simulator choice made here, with the reason given.

## Scoring

| Item | Decision | Basis |
|---|---|---|
| Pass | All eight stations cleared, in order, with fewer than 20 demerits | rubric (20 = fail) + decided |
| Cone | 5 | rubric |
| Pole | 20, which fails the run | rubric; guides: touching a pole fails |
| Rollback | 20 for more than 0.30 m backwards along a slope while not in reverse | rubric |
| Not in bay | 10 | rubric |
| **Kerb** | **5 per contact.** A contact is a tyre over a kerb; it counts once and ends after 0.5 s clear. Body overhang is not a fault. | decided: guides list touching a kerb or line as a minor fault worth 2–5 points; 5 matches the rubric's minor weight |
| Stall | 5 (cannot happen with the automatic gearbox) | rubric |
| **Centre line** | **Automatic fail; the test ends at once.** A tyre's contact patch touching the broken white line between the two lanes of a two-way road, read as one continuous line (a tyre in the gap between two dashes is across it). The route keeps every tyre 0.4 m or more off every centre line, and the lines break where the route turns, as at a real junction. | the owner, 20 Oct |

## Stations

Every station has a **time limit**, timed from when the car reaches the station on the route
(basis: guides, the lp-services KPP notes). A station fails if:

- its time runs out,
- the car drives past it without doing it, or
- it fails one of its own rules below.

**A failed station fails the run.** The run then carries on, so the learner still rehearses the
remaining stations, and the verdict lists everything. Reaching 20 demerits works the same way: the
verdict is a fail from then on, and the run carries on (`end_run_at_fail` is false).

| # | Station | Time | Cleared when | Fails when | Basis |
|---|---|---|---|---|---|
| 1 | Hill Start | 3 min | Both front tyres stop on the yellow stop band. The car holds still (5 cm at most) for 2 s with the handbrake on. It then moves off over the crest with no rollback. | Crosses the crest without that stop; rollback (also 20 demerits) | guides: front tyre on the yellow line, handbrake on, 3 min. decided: 2 s hold, 5 cm |
| 2 | Side Parking | 5 min | The learner signals "done" by stopping with the handbrake on for 1 s. At that moment the whole car, **mirrors included** (1.847 m wide), is inside the painted bay, within the heading limit. | Touches a pole (also 20). Outside at "done" costs 10 (not in bay) but still counts as done. | rubric; guides: the right mirror must be inside the box, a pole touch fails. decided: handbrake as the "done" signal |
| 3 | Parallel Park | 5 min | Same as Side Parking, in the painted 6.6 × 2.5 m box inside the real recess (6.6 × 3.77 m). The heading limit is 10.2° with mirrors. | Same as Side Parking | rubric + guides + decided |
| 4 | 3-Point Turn | 3 min | During the **third** movement, the heading is reversed by at least 148° at 6 km/h or slower. A movement is a run of at least 0.3 m in one direction. | A fourth movement starts first; or the car leaves without turning round (one arc never clears) | PRD (148°; forward, reverse, forward) + guides (three movements at most, 3 min). decided 15 Oct: 6 km/h, not the PRD's 3, because the automatic Swift creeps at 5 km/h with no pedal |
| 5 | S-Curve | 3 min | Gates passed in order, with the speed held at 1–18 km/h | More than 1.2 s outside the band (assessment). Practice mode restarts the drill instead. | PRD |
| 6 | Z-Curve | 3 min | Gates passed in order. A corner gate counts only at 12 km/h or slower; too fast does not fail, the gate just waits. | Time limit, or passing it by | PRD |
| 7 | Ramp Test | 5 min | Drive up the ramp. Stop with the front bumper **0.2–1.0 m short of the pole**. Hold still for 2 s. Then reverse back down and out past the mouth. | Touching the pole (also 20). Driving on after stopping only outside the window (the verdict shows the measured gap) | guides: a DA learner, "climb onto the cement block, don't hit the pole in the middle"; 5 min. decided: the stop window, the hold, the reverse out |
| 8 | Road Merging | none | Cross the finish gate at 15 km/h or faster. There is no traffic: a simulator simplification. | Slower (assessment). Practice mode allows a retry. | PRD |

**Handbrake.** It is required on the hill. On the ramp, the brake alone may hold the car. The
handbrake is also the "I'm done" signal in both parking bays.

## The map (see docs/circuit-v2)

- **The real yard.** The map is the ARM Driving Institute yard, traced off the drone photo at its
  measured scale. Every practice level uses this one map; only the start point changes.
- **Three-point-turn lane:** 7.64 m, the real lane beside the Z. It sits inside the window this car
  needs: at least 6.0 m to turn in three movements, below 9.5 m so a single U-turn is impossible.
- **Hill:** the real strip along the top of the yard. Rise 1.3 m over 10.8 m (12%): v1's value; no
  public JPJ gradient was found.
- **Ramp:** the real yard has none, so it stands on the open floor at the top right, where the
  blueprint draws a structure. 4.0 m wide.
  - Its slope runs 6 m up to a 0.6 m-high platform (10%).
  - The platform is 7 m long, with the pole on the centreline 0.4 m before the end wall.
  - These dimensions are decided; there is no public source.
- **Side bay:**
  - A painted 2.6 × 5.6 m bay inside the real 4.72 × 5.78 m pocket.
  - Four poles, one at each corner of the bay, 0.3 m outside the lines.
- **Parallel box:** a painted 6.6 × 2.5 m box against the kerb of the real 6.6 × 3.77 m recess.

## Modes

| | Assessment | Practice |
|---|---|---|
| Mirrors | Interior mirror and both door mirrors, as in the real test | Same |
| Top-down view | On, and the verdict reports how long it was used (no penalty). Mirrors on a phone are small, the driver cannot move their head, and the bay lines never enter the windscreen view (v1 measured it), so the view stays available. | On |
| "Where next" marker | On | On |
| Restart a drill | No; the run carries on | Yes; teleports to the station start |
| Result uploaded | Yes, exactly once | No |

## Test conditions and process

- **Phones:**
  - Redmi 9T in Android Chrome: landscape 851 × 393 CSS px before browser chrome.
  - iPhone Xs in iOS Safari: 812 × 375.
  - Use the latest versions each phone takes.
  - Without the phone to hand, use Chrome DevTools device mode with 4× CPU throttling and label
    the figure "emulated".
- **Network for the load gate:** 9 Mbps down, 3 Mbps up, 80 ms round trip, cold cache. Time to
  first drive must be 15 s or less, within 12 MB transferred.
- **No external review and no learner sessions.** Instead, the owner plays a full assessment run
  and a practice run with the checklist in WP6. Every rule is proven with scripted positive and
  negative drives (WP1).
- **Work:** done by AI workers from the briefs in this folder. The owner pastes the briefs, plays
  the build and reports what feels wrong.
- **Borrowed mechanics.** Driving, braking and mirrors follow published open-source code, listed
  with licences in `REFERENCES.md`. Nothing is taken from commercial games.

## Sources

The "guides" are all unofficial, and they disagree on some numbers. That is why each rule above
states which part is decided.

- [lp-services: KPP practical part II notes](https://lp-services.blogspot.com/p/bhg-2.html): per-element time limits (hill 3 min, side parking 5 min, three-point turn 3 min, S 3 min, Z 3 min, ramp 5 min).
- [A DA (auto) learner's account](https://gadisremajamoden.blogspot.com/2016/03/pengalamanku-ambil-lesen-memandu-da.html): the auto-only ramp, a cement block and a pole you must not hit.
- [Ann Noura: JPJ car test parts](https://annnoura.com/ujian-memandu-kereta-jpj-bahagian-ujian/): tanjakan (ramp) is auto-only.
- [Ujian JPJ Kereta (blog)](http://taksukatoto.blogspot.com/2017/06/ujian-jpj.html): the hill within 3 min; the parking box must contain the right mirror.
- [kpp-test: reasons for failing](https://www.kpp-test.com/ms/help/jpj-road-test-fail-points): touching a line in side parking is a minor fault.
- [belajarmemandu: three-point turn](https://belajarmemandu.net/pergerakan-tiga-penjuru/) and [belajarmemandu: hill](https://belajarmemandu.net/mendaki-dan-menuruni-bukit/): three movements at most; stop with the front wheel on the yellow line and the handbrake on.
