# The testers' walkthroughs: what was done (2 Nov)

Three testers (Adam, Areefa and Faiz) filled in the owner walkthrough (`WALKTHROUGH.md`) on 21–22 Oct, and the
owner added notes and photos of a real yard on 2 Nov. Each finding below is fixed on branch `fix/sim-feedback`;
the details are in `BUILD-LOG.md` under 2 Nov.

| Finding (who) | What was done | Commit |
|---|---|---|
| Lines not properly drawn: no line along the road's sides, none before a junction's exit, none at the roundabout (owner) | An edge line along every kerb; a solid stop line at each junction's way in and each station lane's way out; give-way lines and triangles at the roundabout | 54469d5 |
| No poles at the 3-side bay; mark the ideal place to stop (Areefa, Faiz, owner) | The bay's poles are gone; two reference poles on the grass line up with the door mirrors at the stop, and the tip says so | 54469d5 |
| The parallel box's line sits too deep; it should run between the kerb corners (Faiz) | The painted box is the whole recess, kerb corner to kerb corner | 54469d5 |
| The hill's yellow line is near the peak, with a pole guiding it (Faiz) | The band sits 0.78 m short of the crest, with a guide pole each side level with the door mirrors | bc883dd |
| "S = reverse, W = go" is what people expect; the gear change is confusing (Adam, Areefa) | The keys change gear by default (S again at a stop reverses); Realistic gears in Settings keeps the R key | 6dcc0da |
| See the sides with Shift+A/D (Areefa) | Shift+A and Shift+D look left and right, still steering | 6dcc0da |
| Hard to judge the bay lines and kerb from the seat; better with the car in view (Areefa, Adam) | The view from behind the car works in every mode (an assessment's verdict notes it). A dip of the door mirrors in reverse was tried and taken out: the owner preferred the steady view (3 Nov) | 6dcc0da |
| Fix the side mirror's position (Adam) | Moved level with the right mirror on 2 Nov, then put back at the screen's edge on 3 Nov: the owner preferred it there | 3 Nov |
| The ramp must be rebuilt: front tyres on a platform, the pole moved aside, out through the front (Faiz) | Platform, pole moved aside after a held stop, a down-slope off the far end onto the east road | 6246035 |
| At the ramp, learners turn into the lane with a car in it (Adam) | The twin ramp moved north: ours is the first turn | 6246035 |
| Could not follow the route without the top-down view (Areefa, Adam) | A way arrow at the top of the screen points at the route ahead, with the metres to the next station | 90ea03a |
| After one practice, nowhere obvious to go next (Adam) | The end-of-drill panel offers Next station | 90ea03a |
| Explain each station step by step, with tips (Areefa, Faiz) | Four to six numbered steps per station with reference points (half the car past the kerb's corner, checked with Q or E, before turning; close to the outside kerb), on the briefing screen and in practice | 90ea03a |
| Failed road merging without knowing it (Faiz) | A void attempt says why and how to fix it | 90ea03a |
| White tyres on our car (Faiz) | The tyres are rubber, no longer mirrors of the sky | c74154d |
| No phone controls: the local server has no network option (Faiz) | `npm run dev:phone`, and how to open it on a phone | b458349 |
| Add ambience sound (Faiz) | The birds come through the cabin; far-off traffic runs under the wind | 0ae525f |
| Change the voice (Areefa) | A Malay male voice for Malay and an English male voice for English, chosen by the owner from samples | 14b2b18 |

## Limitations

- No new route arrows are painted on the road beyond the junctions' existing ones: the way arrow on the
  screen gives the route itself.
- The note that the view from behind the car was used in an assessment shows on the verdict but is not saved
  with the result (no database change).
- Fish Audio's speech-to-text does not know Malay, so the Malay lines were checked by ear only.
