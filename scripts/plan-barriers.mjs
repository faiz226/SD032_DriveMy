// Plans the closed-road barriers into docs/circuit-v2/guidance.json from circuit.json: a barrier goes across the
// mouth of every side lane whose stop line is further than 3 m from the route (a lane the test never uses), 2.2 m
// beyond that stop line and away from the junction, plus two by hand: behind the spawn and past the exit road.
import { readFileSync, writeFileSync } from "node:fs";
const c = JSON.parse(readFileSync("docs/circuit-v2/circuit.json", "utf8"));
const S = c.route.samples;
const dRoute = (p) => Math.min(...S.map((s) => Math.hypot(s[1] - p[0], s[2] - p[1])));
const J = [...c.junctions, ...c.traffic.junctions].filter((j) => j.polygon);
const centre = (poly) => [poly.reduce((a, p) => a + p[0], 0) / poly.length, poly.reduce((a, p) => a + p[1], 0) / poly.length];
const barriers = [];
for (const [a, b] of c.markings.stop_lines) {
  const horizontal = Math.abs(a[1] - b[1]) < 1e-6;
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (!horizontal || dRoute(mid) <= 3) continue;
  let best;
  for (const j of J) { const ct = centre(j.polygon); const d = Math.hypot(ct[0] - mid[0], ct[1] - mid[1]); if (!best || d < best.d) best = { d, ct }; }
  const away = Math.sign(mid[1] - best.ct[1]) || 1;
  const y = +(a[1] + away * 2.2).toFixed(2);
  // keep the strip 1.8 m clear of the route, trimming its ends in if a corner of the route comes close
  let x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]);
  const clear = (x) => dRoute([x, y]) >= 1.8;
  while (x0 < x1 && !clear(x0)) x0 += 0.1;
  while (x1 > x0 && !clear(x1)) x1 -= 0.1;
  if (x1 - x0 < 2) { console.log("dropped, too close to the route:", mid); continue; }
  barriers.push({ a: [+x0.toFixed(2), y], b: [+x1.toFixed(2), y], note: `closed side lane at x ${mid[0].toFixed(1)}` });
}
barriers.push({ a: [28.5, 56], b: [28.5, 66], note: "behind the spawn: no driving back out of the course" });
barriers.push({ a: [9.6, 54.5], b: [16.6, 54.5], note: "past the exit road: the course ends here" });
writeFileSync("docs/circuit-v2/guidance.json", JSON.stringify({ note: "Closed-road barriers (see scripts/plan-barriers.mjs). Each is a strip across a road, a--b in metres, with an invisible collider behind it.", barriers }, null, 1) + "\n");
console.log(barriers.length, "barriers");
