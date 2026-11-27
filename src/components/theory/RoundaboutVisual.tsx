import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "@/components/ui/icons";
import {
  CENTRE,
  EXIT_BADGE,
  EXIT_SPECS,
  indicatorAt,
  routePath,
  type ApproachLane,
  type RoundaboutExit,
  type SignalAction,
} from "./roundabout";

type Lang = "en" | "bm";

interface RoundaboutVisualProps {
  lang: Lang;
  solved: Record<string, boolean>;
  onSolved: (exit: RoundaboutExit) => void;
}

const LANES: { id: ApproachLane; en: string; ms: string }[] = [
  { id: "left", en: "Left lane (outer)", ms: "Lorong kiri (luar)" },
  { id: "right", en: "Right lane (inner)", ms: "Lorong kanan (dalam)" },
];
const SIGNALS: { id: SignalAction; en: string; ms: string; shortEn: string; shortMs: string }[] = [
  { id: "left-entry", en: "Left on entry, keep it on", ms: "Kiri semasa masuk, kekalkan", shortEn: "Signal left on entry and keep it on", shortMs: "Isyarat kiri semasa masuk dan kekalkan" },
  { id: "none-entry-left-exit", en: "None, then left", ms: "Tiada, kemudian kiri", shortEn: "No signal on entry, then left past the exit before yours", shortMs: "Tiada isyarat semasa masuk, kemudian kiri selepas susur sebelum susur anda" },
  { id: "right-entry-left-exit", en: "Right, then left", ms: "Kanan, kemudian kiri", shortEn: "Signal right on entry, then left before your exit", shortMs: "Isyarat kanan semasa masuk, kemudian kiri sebelum keluar" },
];
const TRIP_MS = 4200;

/**
 * The roundabout is the whole lesson: tap an exit on it, pick a lane and a signal, and a car drives the route with its
 * indicators blinking as chosen. The verdict is drawn on the picture. Reduced motion shows the finished route.
 */
export function RoundaboutVisual({ lang, solved, onSolved }: RoundaboutVisualProps) {
  const en = lang === "en";
  const reduce = useReducedMotion();
  const [exit, setExit] = useState<RoundaboutExit | null>(null);
  const [lane, setLane] = useState<ApproachLane | null>(null);
  const [signal, setSignal] = useState<SignalAction | null>(null);
  const [checked, setChecked] = useState(false);
  const [run, setRun] = useState(0);
  const [progress, setProgress] = useState(0);
  const [blink, setBlink] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);
  const [car, setCar] = useState<{ x: number; y: number; rotate: number } | null>(null);

  const spec = EXIT_SPECS.find((item) => item.id === exit) ?? null;
  const driven = spec && lane ? routePath(spec.id, lane) : null;
  const shown = spec ? routePath(spec.id, spec.correctLane) : null;
  const laneOk = !!spec && lane === spec.correctLane;
  const signalOk = !!spec && signal === spec.correctSignal;
  const right = laneOk && signalOk;

  // The car drives whenever a run starts.
  useEffect(() => {
    if (!run) return;
    const place = (share: number) => {
      const el = pathRef.current;
      if (!el || typeof el.getTotalLength !== "function") return;
      const length = el.getTotalLength();
      const at = el.getPointAtLength(share * length);
      const ahead = el.getPointAtLength(Math.min(length, share * length + 1));
      setCar({ x: at.x, y: at.y, rotate: (Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI });
    };
    if (reduce) {
      setProgress(1);
      setBlink(false);
      place(1);
      return;
    }
    let frame = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const share = Math.min(1, (now - began) / TRIP_MS);
      setProgress(share);
      place(share);
      setBlink(Math.floor((now - began) / 330) % 2 === 0);
      if (share < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, reduce]);

  const start = () => setRun((n) => n + 1);
  const choose = (next: RoundaboutExit) => {
    setExit(next);
    setLane(null);
    setSignal(null);
    setChecked(false);
    setRun(0);
    setProgress(0);
    setCar(null);
  };

  const side = indicatorAt(signal, progress);
  const lampOn = !!side && blink && progress < 1;

  const verdict = (() => {
    if (!checked || !spec) return null;
    if (right) return { ok: true, line: en ? "Correct. " + spec.titleEn + "." : "Betul. " + spec.titleMs + "." };
    if (!laneOk) {
      return {
        ok: false,
        line: en
          ? `Wrong lane: use the ${spec.correctLane} lane for this exit.`
          : `Lorong salah: gunakan lorong ${spec.correctLane === "left" ? "kiri" : "kanan"} untuk susur ini.`,
      };
    }
    const wanted = SIGNALS.find((item) => item.id === spec.correctSignal)!;
    return { ok: false, line: en ? `Wrong signal: ${wanted.shortEn}.` : `Isyarat salah: ${wanted.shortMs}.` };
  })();

  const test = () => {
    if (!spec || !lane || !signal) return;
    setChecked(true);
    start();
    if (lane === spec.correctLane && signal === spec.correctSignal) onSolved(spec.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {!spec
            ? en ? "Tap the exit you want." : "Ketik susur keluar yang anda mahu."
            : !lane
              ? en ? "Pick a lane." : "Pilih lorong."
              : !signal
                ? en ? "Pick your signals." : "Pilih isyarat anda."
                : en ? "Test it." : "Uji."}
        </p>
        <span className="pill pill-neutral">
          {Object.keys(solved).length}/4 {en ? "exits mastered" : "susur dikuasai"}
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[460px]">
        <svg
          viewBox="0 0 220 210"
          className="h-auto w-full rounded-2xl border border-border bg-muted/40"
          role="group"
          aria-label={en ? "Roundabout. Tap an exit." : "Bulatan. Ketik satu susur keluar."}
        >
          <path d="M 110 8 V 202 M 12 108 H 208" stroke="#2B2A27" strokeWidth="64" />
          <circle cx={CENTRE.x} cy={CENTRE.y} r="56" fill="#2B2A27" />
          <path d="M 110 8 V 62 M 110 154 V 202 M 12 108 H 64 M 156 108 H 208" stroke="#e8e7e2" strokeWidth="1.5" strokeDasharray="5 4" />
          <circle cx={CENTRE.x} cy={CENTRE.y} r="40" fill="none" stroke="#e8e7e2" strokeWidth="1.5" strokeDasharray="5 4" />
          <circle cx={CENTRE.x} cy={CENTRE.y} r="22" fill="#15803d" stroke="#f6f6f3" strokeWidth="2.5" />
          <text x="110" y="199" textAnchor="middle" fill="#f6f6f3" fontSize="8" fontWeight="700">
            {en ? "YOU" : "ANDA"}
          </text>
          <defs>
            <marker id="rb-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0 0 L10 5 L0 10 Z" fill="#eab308" />
            </marker>
          </defs>

          {/* The route to the chosen exit, lit as a moving arrow */}
          {shown && (
            <path d={shown} fill="none" stroke="#eab308" strokeWidth="4" strokeLinecap="round" strokeDasharray="7 5" markerEnd="url(#rb-arrow)" opacity={lane ? 0.35 : 1}>
              {!reduce && <animate attributeName="stroke-dashoffset" from="24" to="0" dur="0.9s" repeatCount="indefinite" />}
            </path>
          )}
          {/* The route the car really drives, in the lane picked */}
          {driven && <path ref={pathRef} d={driven} fill="none" stroke="#f8fafc" strokeWidth="1" opacity={run ? 0.6 : 0} />}

          {/* The car with two indicators */}
          {car && (
            <g transform={`translate(${car.x} ${car.y}) rotate(${car.rotate})`}>
              <rect x="-9" y="-5" width="18" height="10" rx="3" fill="#f8fafc" stroke="#0f172a" strokeWidth="1" />
              <rect x="1" y="-3.5" width="5" height="7" rx="1" fill="#0f172a" opacity="0.7" />
              <circle cx="8.5" cy="-4.5" r="2.2" fill={lampOn && side === "left" ? "#f59e0b" : "#94a3b8"} />
              <circle cx="8.5" cy="4.5" r="2.2" fill={lampOn && side === "right" ? "#f59e0b" : "#94a3b8"} />
              <circle cx="-8.5" cy="-4.5" r="2.2" fill={lampOn && side === "left" ? "#f59e0b" : "#94a3b8"} />
              <circle cx="-8.5" cy="4.5" r="2.2" fill={lampOn && side === "right" ? "#f59e0b" : "#94a3b8"} />
            </g>
          )}

          {/* Tap targets: one numbered badge on each exit */}
          {EXIT_SPECS.map((item) => {
            const at = EXIT_BADGE[item.id];
            const active = exit === item.id;
            const done = !!solved[item.id];
            return (
              <g
                key={item.id}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                aria-label={en ? `Exit ${item.order}: ${item.titleEn}` : `Susur ${item.order}: ${item.titleMs}`}
                className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-[#eab308] [&:focus-visible>circle]:stroke-[3]"
                onClick={() => choose(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    choose(item.id);
                  }
                }}
              >
                <circle cx={at.x} cy={at.y} r="13" fill={active ? "#eab308" : done ? "#16a34a" : "#f8fafc"} stroke="#0f172a" strokeWidth="2" />
                <text x={at.x} y={at.y + 4.5} textAnchor="middle" fontSize="13" fontWeight="800" fill={done && !active ? "#fff" : "#0f172a"}>
                  {item.order}
                </text>
              </g>
            );
          })}
        </svg>

        {/* The verdict sits on the picture */}
        {verdict && (
          <div
            role="status"
            className={`absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold ${
              verdict.ok ? "border-success/60 bg-success/90 text-success-foreground" : "border-destructive/60 bg-destructive/90 text-destructive-foreground"
            }`}
          >
            {verdict.ok ? <CheckCircle size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}
            <span>{verdict.line}</span>
          </div>
        )}
      </div>

      {spec && (
        <div className="space-y-3">
          <div role="group" aria-label={en ? "Lane" : "Lorong"} className="grid grid-cols-2 gap-2">
            {LANES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={lane === item.id}
                onClick={() => {
                  setLane(item.id);
                  setChecked(false);
                  start();
                }}
                className={`tile min-h-11 cursor-pointer px-3.5 py-2.5 text-left text-sm font-bold ${lane === item.id ? "tile-selected" : ""}`}
              >
                {en ? item.en : item.ms}
              </button>
            ))}
          </div>
          <div role="group" aria-label={en ? "Signals" : "Isyarat"} className="grid gap-2 sm:grid-cols-3">
            {SIGNALS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={signal === item.id}
                onClick={() => {
                  setSignal(item.id);
                  setChecked(false);
                  if (lane) start();
                }}
                className={`tile min-h-11 cursor-pointer px-3.5 py-2.5 text-left text-sm font-bold ${signal === item.id ? "tile-selected" : ""}`}
              >
                {en ? item.en : item.ms}
              </button>
            ))}
          </div>
          <Button type="button" onClick={test} disabled={!lane || !signal}>
            {en ? "Test my route" : "Uji laluan saya"}
          </Button>
          {checked && spec && (
            <p className="text-xs leading-relaxed text-muted-foreground">{en ? spec.ruleEn : spec.ruleMs}</p>
          )}
        </div>
      )}
    </div>
  );
}
