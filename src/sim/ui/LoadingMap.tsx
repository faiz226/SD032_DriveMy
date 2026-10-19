// While the circuit loads: the yard's own map, its route painting itself as the files arrive, a car riding the
// front of the paint, each station's number lighting as it is reached, and the next station's brief beneath.
// A first tour of the route, in test order, while the car loads. Only real progress drives it (drei's
// useProgress), held short of the end until the car is ready; then the lap completes and the map fades.
// With reduced motion nothing moves on its own: the paint jumps to the progress and the map simply goes.
import { useProgress } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { circuit } from '../data';
import { GRASS, H, KERB, LINE, PAVEMENT, STATIONS, toMap, W } from './Minimap';
import { stationName } from './Verdict';

const SAMPLES = circuit.route.samples;
const TOTAL = SAMPLES[SAMPLES.length - 1][0];
const EASE_S = 0.35;      // how quickly the paint catches up with the files
const LINGER_MS = 600;    // the finished lap stays this long before the map fades
const FADE_MS = 400;

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// the route split where the driven line jumps (the reversing moves), each piece with its span of metres, so
// each can be painted by its own dash offset
const PIECES = (() => {
  const out: { d: string; s0: number; s1: number }[] = [];
  SAMPLES.forEach((q, i) => {
    const [x, y] = toMap([q[1], q[2]]);
    const jump = i === 0 || Math.hypot(q[1] - SAMPLES[i - 1][1], q[2] - SAMPLES[i - 1][2]) > 1;
    if (jump) out.push({ d: `M${x.toFixed(2)} ${y.toFixed(2)}`, s0: q[0], s1: q[0] });
    else { out[out.length - 1].d += `L${x.toFixed(2)} ${y.toFixed(2)}`; out[out.length - 1].s1 = q[0]; }
  });
  return out;
})();

/** The car at `s` metres along the route: where, and which way it faces on the map (degrees). */
function carAt(s: number): [number, number, number] {
  let lo = 0;
  let hi = SAMPLES.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (SAMPLES[mid][0] <= s) lo = mid; else hi = mid; }
  const a = SAMPLES[lo];
  const b = SAMPLES[Math.min(lo + 1, SAMPLES.length - 1)];
  const f = b[0] > a[0] ? Math.min(1, Math.max(0, (s - a[0]) / (b[0] - a[0]))) : 0;
  const [x, y] = toMap([a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
  return [x, y, (Math.atan2(-(b[2] - a[2]), b[1] - a[1]) * 180) / Math.PI];
}

export function LoadingMap({ ready }: { ready: boolean }) {
  const { t } = useLanguage();
  const files = useProgress((p) => p.progress);
  const goal = ready ? 100 : Math.min(97, files);   // the lap completes only when the car is really ready
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'fading' | 'gone'>('loading');
  const now = useRef(0);

  // the paint eases toward the goal a frame at a time, and stops once it is there
  useEffect(() => {
    if (reducedMotion()) { now.current = goal; setShown(goal); return; }
    let raf = 0;
    let last = performance.now();
    const step = (time: number) => {
      const dt = Math.min(0.1, (time - last) / 1000);
      last = time;
      const v = now.current + (goal - now.current) * (1 - Math.exp(-dt / EASE_S));
      now.current = Math.abs(goal - v) < 0.05 ? goal : v;
      setShown(now.current);
      if (now.current !== goal) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [goal]);

  // a finished lap lingers, then fades
  useEffect(() => {
    if (!ready || shown < 100) return;
    if (reducedMotion()) { setPhase('gone'); return; }
    const fade = window.setTimeout(() => setPhase('fading'), LINGER_MS);
    const gone = window.setTimeout(() => setPhase('gone'), LINGER_MS + FADE_MS);
    return () => { window.clearTimeout(fade); window.clearTimeout(gone); };
  }, [ready, shown]);

  if (phase === 'gone') return null;
  const s = (shown / 100) * TOTAL;
  const [cx, cy, heading] = carAt(s);
  const next = STATIONS.find((st) => st.s > s) ?? null;
  const pct = Math.round(shown);
  const dot = Math.max(W, H) * 0.022;

  return (
    <div
      className={cn('absolute inset-0 z-20 flex items-center justify-center bg-[rgb(var(--asphalt))] p-4 transition-opacity', phase === 'fading' && 'opacity-0')}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={t('sim.loading', { pct })}
    >
      <div className="flex w-full max-w-2xl flex-col gap-3">
        <p className="type-label-strong text-[rgb(var(--paint))]">{t('sim.loading', { pct })}</p>
        <svg viewBox={`0 0 ${W.toFixed(1)} ${H.toFixed(1)}`} className="max-h-[52vh] w-full rounded-[var(--r-plate)]" aria-hidden>
          <rect width={W} height={H} fill={GRASS} />
          <path d={PAVEMENT} fillRule="evenodd" fill="rgb(var(--concrete))" stroke={KERB} strokeWidth={0.6} />
          {/* the whole route, faint, then the paint over the part already driven */}
          {PIECES.map((p, i) => (
            <path key={`r${i}`} d={p.d} fill="none" stroke={LINE} strokeWidth={0.5} strokeDasharray="1.2 1.2" opacity={0.35} />
          ))}
          {PIECES.map((p, i) => {
            const f = p.s1 > p.s0 ? Math.min(1, Math.max(0, (s - p.s0) / (p.s1 - p.s0))) : s >= p.s0 ? 1 : 0;
            return f > 0 && (
              <path key={`p${i}`} d={p.d} fill="none" stroke={LINE} strokeWidth={1} strokeLinejoin="round" strokeLinecap="round"
                pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - f} />
            );
          })}
          {STATIONS.map((st) => {
            const [x, y] = toMap(st.at);
            const reached = s >= st.s;
            return (
              <g key={st.id} transform={`translate(${x} ${y})`}>
                <circle r={dot} fill={reached ? 'rgb(var(--asphalt))' : 'rgb(var(--paint))'} stroke="rgb(var(--asphalt))" strokeWidth={dot * 0.15} />
                <text textAnchor="middle" dominantBaseline="central" fontSize={dot * 1.2} fontWeight={700}
                  fill={reached ? 'rgb(var(--paint))' : 'rgb(var(--asphalt))'}>{st.n}</text>
              </g>
            );
          })}
          {/* the car: a road-marking pictogram, nose along the route */}
          <g transform={`translate(${cx} ${cy}) rotate(${heading})`}>
            <rect x={-3} y={-1.45} width={6} height={2.9} rx={0.9} fill="rgb(var(--asphalt))" stroke="rgb(var(--paint))" strokeWidth={0.35} />
            <rect x={0.55} y={-1.05} width={1.25} height={2.1} rx={0.3} fill="rgb(var(--paint))" opacity={0.9} />
            <rect x={-2.25} y={-1} width={0.85} height={2} rx={0.25} fill="rgb(var(--paint))" opacity={0.6} />
          </g>
        </svg>
        <div className="min-h-[4.5rem] space-y-1 text-[rgb(var(--paint))]" aria-live="off">
          {next && (
            <>
              <p className="type-label-strong">{t('sim.hud.next')}: {next.n} · {stationName(t, next.id)}</p>
              <p className="type-label text-sm opacity-90">{t(`sim.tips.${next.id}` as TranslationKey)}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
