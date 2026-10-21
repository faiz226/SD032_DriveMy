# DriveMy v2: the decisions (14 Oct 2026, updated 21 Oct)

No instructor, reviewer or test learner is available, so every open question was decided on
14 Oct. Each decision gives its basis. **21 Oct:** the owner's layout has seven stations (the
three-point turn is gone; its lane is an ordinary road), road merging happens at the roundabout,
and the yard has other cars and a signalled junction, so the centre line, a collision and a red
light now end a test. `rules.json` is the machine-readable copy that the app
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
| Pass | All seven stations cleared, in order, with fewer than 20 demerits | rubric (20 = fail) + decided |
| Cone | 5 | rubric |
| Pole | 20, which fails the run | rubric; guides: touching a pole fails |
| Rollback | 20 for more than 0.30 m backwards along a slope while not in reverse | rubric |
| Not in bay | 10 | rubric |
| **Kerb** | **5 per contact.** A contact is a tyre over a kerb; it counts once and ends after 0.5 s clear. Body overhang is not a fault. | decided: guides list touching a kerb or line as a minor fault worth 2–5 points; 5 matches the rubric's minor weight |
| Stall | 5 (cannot happen with the automatic gearbox) | rubric |
| **Centre line** | **Automatic fail; the test ends at once.** A tyre's contact patch touching the broken white line between the two lanes of a two-way road, read as one continuous line (a tyre in the gap between two dashes is across it). The route keeps every tyre 0.4 m or more off every centre line, and the lines break where the route turns, as at a real junction. | the owner, 20 Oct |
| **Collision** | **Automatic fail; the test ends at once.** The car's body touching another car's (moving or parked). One contact counts once. | decided 20 Oct with the owner's traffic: a real test stops at a collision; the same weight as a pole |
| **Red light** | **Automatic fail; the test ends at once.** The front bumper crossing a signal's stop line, in its direction, while its light is red. Amber is not marked. | decided 20 Oct with the owner's traffic lights: running a red light ends a real test |

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
| 2 | 3-Side Parking | 5 min | The learner signals "done" by stopping with the handbrake on for 1 s. At that moment the whole car, **mirrors included** (1.847 m wide), is inside the painted bay, within the heading limit. | Touches a pole (also 20). Outside at "done" costs 10 (not in bay) but still counts as done. | rubric; guides: the right mirror must be inside the box, a pole touch fails. decided: handbrake as the "done" signal |
| 3 | Parallel Park | 5 min | Same as Side Parking, in the painted 6.6 × 2.5 m box inside the real recess (6.6 × 3.77 m). The heading limit is 10.2° with mirrors. | Same as Side Parking | rubric + guides + decided |
| 4 | S-Curve | 3 min | Gates passed in order, with the speed held at 1–18 km/h | More than 1.2 s outside the band (assessment). Practice mode restarts the drill instead. | PRD |
| 5 | Z-Curve | 3 min | Gates passed in order. A corner gate counts only at 12 km/h or slower; too fast does not fail, the gate just waits. | Time limit, or passing it by | PRD |
| 6 | Ramp Test | 5 min | Drive up the ramp. Stop with the front bumper **0.2–1.0 m short of the pole**. Hold still for 2 s. Then reverse back down and out past the mouth. | Touching the pole (also 20). Driving on after stopping only outside the window (the verdict shows the measured gap) | guides: a DA learner, "climb onto the cement block, don't hit the pole in the middle"; 5 min. decided: the stop window, the hold, the reverse out |
| 7 | Road Merging | none | At the roundabout: give way at its entry to the cars going round (clockwise: traffic keeps left), join a gap, go round, leave by the north arm, and cross the finish gate at 15 km/h or faster. | Crossing the give-way line with a car going round less than 3 s from the join, or in it (merge.noYield); slower than 15 km/h at the finish (assessment; practice allows a retry) | PRD + the owner, 20 Oct (a vehicle joins moving traffic and gives way to it; at the roundabout) + decided (a 3 s gap) |

**Handbrake.** It is required on the hill. On the ramp, the brake alone may hold the car. The
handbrake is also the "I'm done" signal in both parking bays.

## The map (see docs/circuit-v2)

- **The real yard.** The map is the ARM Driving Institute yard, traced off the drone photo at its
  measured scale. Every practice level uses this one map; only the start point changes.
- **The lane between the Z and S blocks** (the three-point turn's until 20 Oct) is an ordinary two-way
  road; its crossroads with the spine road and lane C-D is one junction, J2.
- **Roundabout:** road merging joins the traffic going round it, clockwise, on a circle 9 m from its
  middle. The give-way line crosses the approach lane 3.7 m before the circle (JKR: 1.2 m to 10 m).
- **The other cars:** five, on keep-left loops at a yard's pace (20 to 30 km/h): one round each of
  islands C and D each way, one round the outer roads, two round the roundabout. They follow the car
  ahead, stop on red, take a junction one at a time, give way to the learner except where they have
  priority (the roundabout), indicate at junction turns and light their brake lamps. J1 (the spine
  road at lane D-E) has signals: east-west 12 s green, north-south 10 s, 3 s amber, 1 s all-red.
- **Other learners:** parked mid-test on the twin hill, the twin ramp and the second 3-side bay (in
  island F's notch). They are scenery: solid, never marked.
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

| | Assessment | Practice | Free drive (the owner, 20 Oct) |
|---|---|---|---|
| Marked | Yes | Yes, one station | **Nothing**: the rules engine never sees it |
| Mirrors | Interior mirror and both door mirrors, as in the real test | Same | Same |
| Top-down view | On, and the verdict reports how long it was used (no penalty). Mirrors on a phone are small, the driver cannot move their head, and the bay lines never enter the windscreen view (v1 measured it), so the view stays available. | On | On |
| View from behind the car (V) | No | No | Yes; drag to swing it round the car |
| "Where next" marker | On | On | Off |
| Restart | No; the run carries on | Yes; teleports to the station start | "Back to the start" |
| Result uploaded | Yes, exactly once | No | No |

Every start and restart runs the same way (the owner, 21 Oct): the instructor reads the brief (each
brief once per visit, so a restart goes straight on), the engine starts, and only then is the car
free to move.

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
