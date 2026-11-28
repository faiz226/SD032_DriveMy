import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AXIA_SIDE } from "./axiaSide";

type Lang = "en" | "bm";

/** The Axia's flat side view, traced from the owner's photo (see axiaSide.ts). Faces right. */
function CarSide() {
  return (
    <g>
      <path d={AXIA_SIDE.body} fill="currentColor" />
      {AXIA_SIDE.windows.map((d) => <path key={d} d={d} className="fill-background" opacity="0.85" />)}
      {AXIA_SIDE.wheels.map(([cx, cy, r]) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r={r} className="fill-foreground" />
          <circle cx={cx} cy={cy} r={r * 0.45} className="fill-background" />
        </g>
      ))}
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
    <div className="space-y-2.5">
      <svg viewBox="0 0 640 120" role="img" aria-label={label} className="w-full overflow-hidden rounded-xl border border-border bg-muted/30">
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
          <g transform={`translate(0 ${86 - AXIA_SIDE.wheels[0][1] * (CAR_W / 120) - AXIA_SIDE.wheels[0][2] * (CAR_W / 120)}) scale(${CAR_W / 120})`}>
            <CarSide />
          </g>
        </motion.g>
      </svg>
      {!reduce && (
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="tap-sm inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer"
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
  [14, 15],
  [16, 48],
  [70, 57],
  [174, 83],
];

/** Small top-down pictures for the three hazard drills. Malaysian left-hand traffic moving left to right: travel lane & shoulder are on the top edge, overtaking lane is on the bottom. */
export function HazardVisual({ id, lang }: { id: string; lang: Lang }) {
  const copy = CAPTIONS[id];
  if (!copy) return null;
  const labels = lang === "en" ? copy.en : copy.ms;
  return (
    <figure className="space-y-1.5">
      <svg viewBox="0 0 260 100" role="img" aria-label={lang === "en" ? copy.altEn : copy.altMs} className="w-full overflow-hidden rounded-xl border border-border bg-muted/30">
        {id === "drill-cito" && (
          <g>
            <rect y="12" width="260" height="76" className="fill-muted" />
            <path d="M0 50 H260" className="stroke-background" strokeWidth="2" strokeDasharray="12 10" />
            {/* Slower lorry in the left (top) lane going east */}
            <rect x="120" y="20" width="56" height="22" rx="3" className="fill-muted-foreground/60" />
            {/* Learner car starts in the left (top) lane, signals right (bottom edge), checks right blind spot, overtakes in the right (bottom) lane */}
            <TopCar x={30} y={23} />
            <path d="M64 31 C100 31 104 69 150 69 H200" fill="none" className="stroke-brand" strokeWidth="2.5" strokeDasharray="6 5" />
            <path d="M200 69 l-7 -5 v10z" className="fill-brand" />
            <circle cx="33" cy="39" r="3" className="fill-warning" />
            <circle cx="62" cy="39" r="3" className="fill-warning" />
            <path d="M44 39 L30 65 L62 61 Z" className="fill-info/25 stroke-info" strokeDasharray="3 3" />
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
            <path d="M0 64 H130 C190 64 200 64 214 32 C222 14 240 12 260 12" fill="none" className="stroke-muted" strokeWidth="38" />
            <path d="M0 64 H130 C190 64 200 64 214 32 C222 14 240 12 260 12" fill="none" className="stroke-background" strokeWidth="2" strokeDasharray="10 8" />
            {/* Slowing zone & car in the left (top) lane before entering the bend */}
            <rect x="46" y="42" width="94" height="24" rx="6" className="fill-warning/30 stroke-warning" strokeDasharray="4 3" />
            <TopCar x={56} y={46} />
            <path d="M96 54 h26 l-6 -5 m6 5 l-6 5" fill="none" className="stroke-foreground" strokeWidth="2" />
          </g>
        )}
        {id === "drill-breakdown" && (
          <g>
            {/* Emergency shoulder on the left (top) edge of an eastbound Malaysian expressway */}
            <rect y="24" width="260" height="62" className="fill-muted" />
            <rect y="24" width="260" height="16" className="fill-muted-foreground/25" />
            <path d="M0 40 H260" className="stroke-background" strokeWidth="2" />
            <path d="M0 63 H260" className="stroke-background" strokeWidth="2" strokeDasharray="12 10" />
            <TopCar x={168} y={24} className="text-muted-foreground" />
            <circle cx="170" cy="26" r="2.8" className="fill-warning" />
            <circle cx="170" cy="38" r="2.8" className="fill-warning" />
            <path d="M40 38 L52 38 L46 27 Z" className="fill-destructive" />
            <path d="M46 15 H168" className="stroke-foreground" strokeWidth="1.5" />
            <path d="M46 11 v8 M168 11 v8" className="stroke-foreground" strokeWidth="1.5" />
            <text x="107" y="12" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-foreground">
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
