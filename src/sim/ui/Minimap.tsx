// The yard from above, drawn from circuit.json as docs/circuit-v2/circuit-minimap.png draws it: grass,
// the concrete with its kerbs, the route, and the seven stations by number. The verdict puts each fault on it.
import type { Vec2 } from '../contracts';
import { circuit } from '../data';

const [X0, Y0, X1, Y1] = circuit.site.bounds;
export const W = X1 - X0;
export const H = Y1 - Y0;
/** A circuit point in the map's own units (metres from the site's corner), north up. */
export const toMap = ([x, y]: Vec2): [number, number] => [x - X0, Y1 - y];
const px = (p: Vec2) => toMap(p).map((v) => v.toFixed(2)).join(' ');

export const PAVEMENT = circuit.pavement.map((ring) => `M${ring.map(px).join('L')}Z`).join('');

const SAMPLES = circuit.route.samples;
/** The route's driven pieces up to `upTo` metres: the line jumps where the car reverses into the side bay and turns round. */
export function routePath(upTo = Infinity) {
  let d = '';
  for (let i = 0; i < SAMPLES.length && SAMPLES[i][0] <= upTo; i++) {
    const q = SAMPLES[i];
    const jump = i === 0 || Math.hypot(q[1] - SAMPLES[i - 1][1], q[2] - SAMPLES[i - 1][2]) > 1;
    d += `${jump ? 'M' : 'L'}${px([q[1], q[2]])}`;
  }
  return d;
}
const ROUTE = routePath();

export const STATIONS = circuit.stations.map((st) => {
  const q = SAMPLES.find((s) => s[0] >= st.s_from) ?? SAMPLES[0];
  return { id: st.id, n: st.order, s: st.s_from, at: [q[1], q[2]] as Vec2 };
});

// content colours: the yard's own grass, kerb paint and route line, not the interface's tokens
export const GRASS = '#5f7d45';
export const KERB = '#c9a227';
export const LINE = '#2f6fd0';

export interface MapMark { at: Vec2; label: string }

export function Minimap({ marks = [], label, className }: { marks?: MapMark[]; label: string; className?: string }) {
  const r = Math.max(W, H) * 0.022;
  return (
    <svg viewBox={`0 0 ${W.toFixed(1)} ${H.toFixed(1)}`} className={className} role="img" aria-label={label}>
      <rect width={W} height={H} fill={GRASS} />
      <path d={PAVEMENT} fillRule="evenodd" fill="rgb(var(--concrete))" stroke={KERB} strokeWidth={0.6} />
      <path d={ROUTE} fill="none" stroke={LINE} strokeWidth={0.5} strokeLinejoin="round" opacity={0.8} />
      {STATIONS.map((s) => {
        const [x, y] = px(s.at).split(' ').map(Number);
        return (
          <g key={s.id} transform={`translate(${x} ${y})`}>
            <circle r={r} fill="rgb(var(--asphalt))" />
            <text textAnchor="middle" dominantBaseline="central" fontSize={r * 1.2} fontWeight={700} fill="rgb(var(--paint))">{s.n}</text>
          </g>
        );
      })}
      {marks.map((m, i) => {
        const [x, y] = px(m.at).split(' ').map(Number);
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r={r * 0.95} fill="rgb(var(--berhenti))" stroke="rgb(var(--paint))" strokeWidth={r * 0.18} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={r * 1.05} fontWeight={700} fill="rgb(var(--paint))">{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
