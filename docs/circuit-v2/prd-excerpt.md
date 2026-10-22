# PRD excerpt (DriveMy v2 PRD, rev 50, 6 Oct 2026)

Copied verbatim from the PRD for the circuit-v2 builder. The PRD is the source; this file is a snapshot. Note: the PRD below still describes the OLD plan (port v1's traced ARM layout). The new circuit replaces that plan; the exercise rules, the car and the statuses of the numbers still apply.

## The circuit

The world is the JPJ training circuit at ARM Driving Institute, Kota Kinabalu (6.10933° N, 116.19420° E), ported from v1's trace of its drone photograph. It is not a generic track and not a city. Using the circuit beyond the final-year project needs the institute's permission, a pre-monetisation check.

**Scale:** 120 ± 6 m across. The two v1 derivations share one anchor, so they are not independent; a parked car in the photo corroborates the scale to about 5%.

| Feature | Value | Status |
|---|---|---|
| Site width | 120 ± 6 m | Measured, with its bound |
| Kerb height | 0.13 m | v1 value |
| Hill ramp | 25.75 m long; 10.8 m climb rising 1.3 m (12.0%, 6.9°) | Length measured on satellite imagery; rise is a v1 value, unverified |
| Hill stop line | At 33% of the rise | Simulator rule, pending instructor approval |
| Side parking bay | 2.6 × 5.6 m | v1 layout |
| Parallel parking bay | 2.4 × 6.4 m | v1 layout; an earlier draft wrongly gave 2.6 × 5.6 m for both |
| S-curve channel | 2.6 m between the kerb rails' inner faces (2.8 m between rail centres), 1.20 m sine amplitude, ~19.3 m long, tightest radius ~7.8 m | v1 layout |
| S-curve clearance for the Swift | Body about 159 mm a side; wheels about 510 mm a side | Computed with v1's own swept-path formula; an earlier draft's 247 mm was wrong |

**Layout requirements**

- Port v1's traced and widened layout as the frozen reference, with every original kerb marking continuous. Any later layout change re-runs the marking-continuity check against the original trace, not only global IoU.
- No blocked specks under 6 m² on drivable ground.
- Contents match the photograph: kerbs, grass islands, booth buildings, perimeter, pale concrete. No street, no traffic.
- Whether body overhang over a kerb is a fault, or only wheel contact, is pending instructor approval. v1 scores wheel contact.


## The eight exercises

Each exercise clears only when the learner does the thing it is named after, and only while it is the current exercise. Every threshold here is a simulator parameter _pending instructor approval_ unless it is marked as coming from the source rubric.

| # | Exercise | Clears when (all of) | Not cleared, voided or scored | State that must exist |
|---|---|---|---|---|
| 1 | Hill Start | Stops inside the stop zone at the marked line, stays within a stillness distance for a hold time, then moves off and crests without rolling back more than 30 cm along the slope | Rollback over 30 cm: 20, instant fail (source rubric). Stopping short of or past the zone: not cleared | Stopped flag, stop position, distance moved during the hold, worst rollback along the slope |
| 2 | Side Parking | After the commitment event, all four corners of the car's footprint are inside the bay and its heading is within the bay's computed limit (Swift: about 13.9°) | Committed but outside or skewed: not in bay, 10 (source rubric). Cone 5, pole 20 | Commitment state, footprint corners, heading error |
| 3 | Parallel Park | Same rule in the 2.4 m bay (Swift: about 10.5°) | As above | As above |
| 4 | 3-Point Turn | Heading reversed by at least 148°, under 3 km/h, after at least three movements (forward, reverse, forward); the movement count is reported | Kerb 5 (pending), pole 20. Whether more than three movements should block clearing: pending | Movement count, direction, entry heading |
| 5 | S-Curve | Gates passed in order with speed held in 1–18 km/h | More than 1.2 s outside the band voids the attempt (restart, no demerit). Kerb contact 5 (pending) | Gate index, time out of band |
| 6 | Z-Curve | Gates passed in order; a corner gate advances only at or under 12 km/h | Too fast at a corner does not void: that gate waits until the car slows. An earlier draft wrongly said it voids. Kerb 5 (pending) | Gate index, speed in each corner gate |
| 7 | Ramp Test | Gates passed in order over the ramp | Rollback over 30 cm: 20. Whether a handbrake hold is required: pending | Gate index, worst rollback |
| 8 | Road Merging | Finish gate reached at 15 km/h or more. Labelled as a simulator simplification: there is no traffic | Slower arrival voids the attempt | Gate index, speed at the finish |

**Bay heading limit** is the largest yaw t at which the car's footprint, L·sin t + W·cos t, still fits the bay's width. It is computed per bay from the car's real dimensions, never typed in.

**Hill measurement** uses distance moved, not speed. v1 accepted any speed below 1.08 km/h for 0.5 s, which allows about 150 mm of creep, and it accepted stopping anywhere past the line. The stop-zone width, stillness distance and hold time wait on the ARM review.

**Negative drives**, each seen failing before its fix merges:

- Cross every later exercise's route early, then complete each on its own turn.
- Park straight but offset sideways just outside the bay; inside but 3° past the heading limit; with one corner outside.
- Roll back 29, 30 and 31 cm.
- Drive over the hill without stopping; turn in one continuous arc; take the S-curve at 25 km/h; reach the merge at walking pace.
- Stop for 3 s beside a bay that is not current.

Already seen failing in v1: the early ramp latch; a car with 445 mm, and another with 1,145 mm, of body outside the bay both cleared; a stop beside a non-current bay cost 10 points.

**Tips** describe only what is measured: no clutch wording, and road merging says “Build speed on the approach. Join at road speed.”


## Vehicle and driving model

The car is a 2022 Suzuki Swift 1.2 GLX, right-hand drive, and its physics must use the Swift's own measured dimensions. v1 drove a Myvi-sized physics body under a Swift skin; v2 has no reason to.

| Dimension | Value (measured off the model, 1:1 metres) |
|---|---|
| Length | 3.842 m |
| Width, body / over mirrors | 1.730 m / 1.847 m |
| Height | 1.622 m |
| Wheelbase | 2.450 m |
| Track | 1.493 m |
| Tyre radius | 0.324 m |
| Steering column tilt | 23.5° above horizontal |
| Steering rim radius | 0.168 m |
| Driver eye point | 1.20 m above the road, 0.33 m right of centre, on the steering hub's line |

At these dimensions the S-curve leaves the Swift about 159 mm a side for the body and about 510 mm a side for the wheels, against the 2.6 m gap between the rails' inner faces (computed with v1's own swept-path formula). An earlier draft claimed 247 mm by using the 2.8 m rail-centre spacing; that was wrong. Brake and reverse are separate inputs; see Controls.

**Driving model (MVP: automatic)**

- Gear is D or R, chosen by the throttle and reverse inputs. Idle creep in D with the brake released, tuned to the real CVT (confirm target speed on a real car).
- Steering lock 0.62 rad at standstill, narrowing to 0.16 rad by 45 km/h. Steering moves toward the requested angle at a fixed rate, never snaps. Keep full lock at walking pace: parking and the three-point turn need it.
- Mass, power and braking from the published Swift figures, then tuned by feel against measured targets (0–30 km/h time, braking distance from 30 km/h). v1's force constants are engine-specific and do not transfer.
- **Speed is horizontal speed only.** v1 counted vertical suspension bounce and read 7.1 km/h on a parked car, which swung the steering lock and the rim 145°.
- **No sideways creep at rest.** Below 1 km/h with no input, cancel sideways velocity on level ground only. On a slope, cancelling it would hide rollback, which the hill exercise exists to catch.
- **Kerbs are detected at the wheels.** The body's underside sits about 0.34 m up and a kerb is 0.13 m, so a body-only collider never touches a kerb. v1 lost its kerb scoring that way.
- Poles, cones and walls collide with the body. Cones topple and count once.

**Visual rig**

- Steering rim angle = road-wheel angle × 9 (the rack ratio); full lock turns the rim about 320°. A left input turns it anticlockwise as seen from the driver's seat.
- One wheel mesh, instanced four times; its visual radius equals the physics radius exactly. The far side is rotated 180° about the vertical, never mirrored with a negative scale.

**Later: manual gearbox (Class D).** Gears 1–5, N and R; clutch pedal with a biting point; stall below the engine's minimum speed under load; real rev model driving the tachometer. The stall fault goes live with it.
