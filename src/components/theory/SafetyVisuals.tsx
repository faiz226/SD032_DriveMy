import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

type Lang = "en" | "bm";

/** A flat side-view hatchback, drawn by hand (not traced from a photo). Faces right. 120 x 48. */
function CarSide() {
  return (
    <g>
      <path d="M4 36 L4 28 Q4 23 10 22 L28 20 Q37 8 52 7 L74 7 Q88 8 96 20 L110 23 Q117 25 117 31 L117 36 Z" fill="currentColor" />
      <path d="M34 20 Q41 11 51 10.5 L60 10.5 L60 20 Z M64 10.5 L74 10.5 Q82 11 89 20 L64 20 Z" className="fill-background" opacity="0.85" />
      <circle cx="28" cy="36" r="8.5" className="fill-foreground" />
      <circle cx="92" cy="36" r="8.5" className="fill-foreground" />
      <circle cx="28" cy="36" r="3.5" className="fill-background" />
      <circle cx="92" cy="36" r="3.5" className="fill-background" />
    </g>
  );
}

const PX_PER_M = 2.6; // 200 m fits the road
const START_X = 96; // where the car's nose starts
const CAR_W = 92; // drawn car width (not to scale)

interface StoppingSceneProps {
  lang: Lang;
  speedKmh: number;
  thinkingMeters: number;
  brakingMeters: number;
  wet: boolean;
}

/**
 * The car at the chosen speed. Press play: it keeps its speed through the thinking distance, then slows to a stop
 * over the braking distance. Reduced motion shows the finished picture with no movement.
 */
export function StoppingScene({ lang, speedKmh, thinkingMeters, brakingMeters, wet }: StoppingSceneProps) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const mps = speedKmh / 3.6;
  const tThink = thinkingMeters / mps;
  const tBrake = (2 * brakingMeters) / mps; // constant slowing: distance = speed x time / 2
  const total = tThink + tBrake;
  const x0 = START_X - CAR_W;
  const xThink = x0 + thinkingMeters * PX_PER_M;
  const xStop = x0 + (thinkingMeters + brakingMeters) * PX_PER_M;
  const label =
    lang === "en"
      ? `A car at ${speedKmh} km/h on a ${wet ? "wet" : "dry"} road: ${thinkingMeters} metres thinking distance, ${brakingMeters} metres braking distance, ${thinkingMeters + brakingMeters} metres to stop.`
      : `Kereta pada ${speedKmh} km/j di jalan ${wet ? "basah" : "kering"}: jarak berfikir ${thinkingMeters} meter, jarak membrek ${brakingMeters} meter, ${thinkingMeters + brakingMeters} meter untuk berhenti.`;
  const playing = run > 0 && !reduce;
  return (
    <div className="space-y-2">
      <svg viewBox="0 0 640 120" role="img" aria-label={label} className="w-full overflow-hidden rounded-lg border border-border bg-muted/30">
        <rect x="0" y="62" width="640" height="46" className={wet ? "fill-info/30" : "fill-muted"} />
        <path d="M0 85 H640" className="stroke-background" strokeWidth="2" strokeDasharray="14 12" />
        {wet &&
          [60, 170, 290, 410, 520].map((x) => <path key={x} d={`M${x} 70 q4 7 0 10 q-4 -3 0 -10`} className="fill-info/60" />)}
        <rect x={START_X} y="92" width={thinkingMeters * PX_PER_M} height="10" rx="3" className="fill-brand" />
        <rect x={START_X + thinkingMeters * PX_PER_M} y="92" width={brakingMeters * PX_PER_M} height="10" rx="3" className="fill-destructive" />
        <g transform={`translate(${START_X + (thinkingMeters + brakingMeters) * PX_PER_M} 0)`}>
          <path d="M0 108 V46" className="stroke-foreground" strokeWidth="2" />
          <path d="M0 46 H18 L13 53 L18 60 H0" className="fill-foreground" />
        </g>
        <motion.g
          key={run}
          className="text-brand"
          initial={{ x: reduce ? xStop : x0 }}
          animate={{ x: playing ? [x0, xThink, xStop] : reduce ? xStop : x0 }}
          transition={playing ? { duration: total, times: [0, tThink / total, 1], ease: ["linear", "easeOut"] } : { duration: 0 }}
        >
          <g transform={`translate(0 36) scale(${CAR_W / 120})`}>
            <CarSide />
          </g>
        </motion.g>
      </svg>
      {!reduce && (
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
        >
          {run === 0 ? (lang === "en" ? "Play" : "Main") : lang === "en" ? "Play again" : "Main semula"}
        </button>
      )}
    </div>
  );
}

const CAPTIONS: Record<string, { en: string[]; ms: string[]; altEn: string; altMs: string }> = {
  "drill-cito": {
    en: ["1 Mirror", "2 Signal", "3 Blind spot", "4 Move"],
    ms: ["1 Cermin", "2 Isyarat", "3 Titik buta", "4 Gerak"],
    altEn: "Top view: a car in the left lane checks its mirror, signals, checks the blind spot, then moves right to pass a lorry.",
    altMs: "Pandangan atas: sebuah kereta di lorong kiri memeriksa cermin, memberi isyarat, memeriksa titik buta, kemudian bergerak ke kanan untuk memotong sebuah lori.",
  },
  "drill-under-oversteer": {
    en: ["Slow down here", "Then take the bend"],
    ms: ["Perlahan di sini", "Kemudian ikut selekoh"],
    altEn: "Top view: a car on a straight road before a bend. The slowing zone is before the bend.",
    altMs: "Pandangan atas: sebuah kereta di jalan lurus sebelum selekoh. Zon memperlahankan kenderaan ialah sebelum selekoh.",
  },
  "drill-breakdown": {
    en: ["Hazard lights on", "Warning sign within 50 m behind"],
    ms: ["Lampu kecemasan dinyalakan", "Tanda amaran dalam 50 m di belakang"],
    altEn: "Top view: a car stopped on the shoulder with hazard lights on and a warning triangle within 50 metres behind it.",
    altMs: "Pandangan atas: sebuah kereta berhenti di bahu jalan dengan lampu kecemasan menyala dan segi tiga amaran dalam jarak 50 meter di belakangnya.",
  },
};

function TopCar({ x, y, className = "text-brand" }: { x: number; y: number; className?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} className={className}>
      <rect width="34" height="16" rx="5" fill="currentColor" />
      <rect x="20" y="3" width="8" height="10" rx="2" className="fill-background" opacity="0.8" />
    </g>
  );
}

const CITO_BADGES: [number, number][] = [
  [14, 88],
  [16, 52],
  [66, 40],
  [170, 20],
];

/** Small top-down pictures for the three hazard drills. Traffic drives on the left and moves to the right of the picture. */
export function HazardVisual({ id, lang }: { id: string; lang: Lang }) {
  const copy = CAPTIONS[id];
  if (!copy) return null;
  const labels = lang === "en" ? copy.en : copy.ms;
  return (
    <figure className="space-y-1.5">
      <svg viewBox="0 0 260 100" role="img" aria-label={lang === "en" ? copy.altEn : copy.altMs} className="w-full overflow-hidden rounded-lg border border-border bg-muted/30">
        {id === "drill-cito" && (
          <g>
            <rect y="12" width="260" height="76" className="fill-muted" />
            <path d="M0 50 H260" className="stroke-background" strokeWidth="2" strokeDasharray="12 10" />
            <rect x="120" y="58" width="56" height="22" rx="3" className="fill-muted-foreground/60" />
            <TopCar x={30} y={60} />
            <path d="M64 68 C100 68 104 30 150 30 H200" fill="none" className="stroke-brand" strokeWidth="2.5" strokeDasharray="6 5" />
            <path d="M200 30 l-7 -5 v10z" className="fill-brand" />
            <circle cx="33" cy="60" r="3" className="fill-warning motion-safe:animate-pulse" />
            <path d="M44 60 L30 34 L62 38 Z" className="fill-info/25 stroke-info" strokeDasharray="3 3" />
            {CITO_BADGES.map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="8" className="fill-foreground" />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="700" className="fill-background">
                  {i + 1}
                </text>
              </g>
            ))}
          </g>
        )}
        {id === "drill-under-oversteer" && (
          <g>
            <path d="M0 62 H130 C190 62 200 62 214 30 C222 12 240 10 260 10" fill="none" className="stroke-muted" strokeWidth="30" />
            <path d="M0 62 H130 C190 62 200 62 214 30 C222 12 240 10 260 10" fill="none" className="stroke-background" strokeWidth="2" strokeDasharray="10 8" />
            <rect x="48" y="44" width="92" height="36" rx="6" className="fill-warning/30 stroke-warning" strokeDasharray="4 3" />
            <TopCar x={62} y={54} />
            <path d="M100 62 h26 l-6 -5 m6 5 l-6 5" fill="none" className="stroke-foreground" strokeWidth="2" />
          </g>
        )}
        {id === "drill-breakdown" && (
          <g>
            <rect y="14" width="260" height="62" className="fill-muted" />
            <rect y="62" width="260" height="14" className="fill-muted-foreground/25" />
            <path d="M0 40 H260" className="stroke-background" strokeWidth="2" strokeDasharray="12 10" />
            <TopCar x={168} y={66} className="text-muted-foreground" />
            <circle cx="170" cy="68" r="2.8" className="fill-warning motion-safe:animate-pulse" />
            <circle cx="170" cy="80" r="2.8" className="fill-warning motion-safe:animate-pulse" />
            <path d="M40 70 L52 70 L46 59 Z" className="fill-destructive" />
            <path d="M46 88 H168" className="stroke-foreground" strokeWidth="1.5" />
            <path d="M46 84 v8 M168 84 v8" className="stroke-foreground" strokeWidth="1.5" />
            <text x="107" y="97" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-foreground">
              50 m
            </text>
          </g>
        )}
      </svg>
      <figcaption className="flex flex-wrap gap-1.5 text-[0.8125rem] text-muted-foreground">
        {labels.map((t) => (
          <span key={t} className="rounded-md bg-muted px-2 py-0.5">
            {t}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
