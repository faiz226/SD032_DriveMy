import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const STUDS = 50;
const AXIS = [0, 50, 100];
const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));

/**
 * Readiness as a stretch of road at night. The cat's eyes light up to the
 * score one after another, and the car drives up to it when the page opens or
 * the score moves; with reduced motion both simply appear in place. Tapping
 * the car sounds the horn, a small reward for the curious.
 */
export function JourneyRoad({ value, label, horn = true }: { value: number; label: string; horn?: boolean }) {
  const { t } = useLanguage();
  const score = clamp(value);
  const [shown, setShown] = useState(0);
  const [driving, setDriving] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const honk = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  // Drive to the score: the car rolls along, nose up as it pulls away and
  // dipping as it stops, wheels turning only while it moves. The park timer
  // starts with the drive, because a background tab holds the frame back and a
  // timer started at mount would leave the engine running forever.
  useEffect(() => {
    let parked: number | undefined;
    const frame = requestAnimationFrame(() => {
      setShown(score);
      setDriving(true);
      parked = window.setTimeout(() => setDriving(false), 1200);
    });
    return () => { cancelAnimationFrame(frame); window.clearTimeout(parked); };
  }, [score]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const sound = () => {
    const lines = [t("dashboard.road.honk1"), t("dashboard.road.honk2"), t("dashboard.road.honk3"), t("dashboard.road.honk4")];
    setBubble(lines[honk.current++ % lines.length]);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBubble(null), 1600);
  };

  return (
    <section className="relative pt-16">
      <div aria-hidden="true" className="absolute right-16 top-0 flex translate-x-1/2 flex-col items-center">
        <span className={cn("plate-sign h-[46px] w-[46px] rounded-[7px] text-[2rem]", score < 100 && "plate-sign-ahead !border-muted-foreground !text-muted-foreground")}>P</span>
        <i className="h-4 w-[3px] bg-muted-foreground" />
      </div>

      <div className="relative h-[140px] overflow-hidden rounded-3xl bg-[linear-gradient(180deg,#10304A,rgb(var(--road)))] px-16 ring-1 ring-border">
        <span aria-hidden="true" className="absolute inset-x-0 top-4 h-[3px] bg-white/75" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-4 h-[3px] bg-white/75" />
        <div
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
          aria-valuetext={t("dashboard.road.valuetext", { value: score, left: 100 - score })}
          className="absolute inset-0"
        />
        <div className="relative h-full">
          <div aria-hidden="true" className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
            {Array.from({ length: STUDS }, (_, i) => {
              const on = (i / (STUDS - 1)) * 100 <= shown && shown > 0;
              return (
                <i
                  key={i}
                  className={cn(
                    "h-[9px] w-[9px] rounded-full transition-[background-color,box-shadow] duration-300",
                    on ? "bg-brand shadow-[0_0_12px_3px_rgb(var(--brand)/0.7)]" : "bg-[#2c4a63]",
                  )}
                  style={{ transitionDelay: on ? `${i * 14}ms` : "0ms" }}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={horn ? sound : undefined}
            tabIndex={horn ? 0 : -1}
            aria-hidden={horn ? undefined : true}
            aria-label={horn ? t("dashboard.road.car") : undefined}
            className="absolute top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 rounded-xl transition-[left] ease-out"
            // Inline: Tailwind drops `duration-[1100ms]` as ambiguous with the animate plugin.
            style={{ left: `${shown}%`, transitionDuration: "1100ms" }}
          >
            <span
              aria-live="polite"
              className={cn(
                "pointer-events-none absolute bottom-full left-1/2 whitespace-nowrap rounded-xl bg-white px-3 py-1.5 text-[0.9375rem] font-extrabold text-[#111] transition-[opacity,transform] duration-200",
                bubble ? "-translate-x-1/2 -translate-y-1 opacity-100" : "-translate-x-1/2 translate-y-1.5 opacity-0",
              )}
            >
              {bubble}
            </span>
            <span aria-hidden="true" className="pointer-events-none absolute left-[90%] top-[48%] h-[110px] w-[150px] -translate-y-1/2 bg-[linear-gradient(90deg,rgb(255_240_170/0.6),transparent)] [clip-path:polygon(0_44%,100%_0,100%_100%,0_58%)] sm:w-[280px]" />
            {driving && [0, 1, 2, 3, 4].map(i => (
              <span key={i} aria-hidden="true" className="exhaust-puff left-0 top-[37px]" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
            <Hatchback driving={driving} />
          </button>
        </div>
      </div>

      <div aria-hidden="true" className="relative mx-16 mt-2 h-7 font-extrabold tabular-nums text-muted-foreground">
        {AXIS.map(mark => <span key={mark} className="absolute -translate-x-1/2" style={{ left: `${mark}%` }}>{mark}</span>)}
      </div>
    </section>
  );
}

/**
 * A yellow Malaysian hatchback, side on. It idles with a small engine shake,
 * run on the svg element itself so the compositor animates it without
 * repainting the glow every frame; while driving the car pitches nose-up as it
 * pulls away and dips as it stops, and the wheels turn.
 */
function Hatchback({ driving }: { driving: boolean }) {
  return (
    <svg width="116" height="56" viewBox="0 0 120 58" overflow="visible" aria-hidden="true" className="car-idle relative block drop-shadow-[0_0_14px_rgb(var(--brand)/0.45)]">
      <g className={cn(driving && "car-launch")}>
        <g>
          <line x1="15" y1="10" x2="10" y2="2" stroke="#2a2a2a" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M6 46 L5 34 Q5 22 9 16 Q12 10 20 9 L66 8 Q72 8 76 12 L86 22 Q101 24 108 27 Q115 30 115 37 L114 46 L104 46 A12 12 0 0 0 80 46 L42 46 A12 12 0 0 0 18 46 Z" fill="#F2B705" />
          <path d="M8 40 L42 41 L80 41 L113 40 L114 46 L104 46 A12 12 0 0 0 80 46 L42 46 A12 12 0 0 0 18 46 L6 46 Z" fill="#d49b00" />
          <path d="M12 17 Q13 12.5 18 12 L66 10.5 Q70 10.5 73 13.5 L82 23 Q82 26 79 26 L11 26 Z" fill="#1c2632" />
          <rect x="34.5" y="11" width="2.6" height="15" fill="#0b0f14" />
          <rect x="56" y="10.4" width="2.6" height="15.6" fill="#0b0f14" />
          <path d="M40 24 L50 12 L54 12 L44 24 Z M63 24 L70 13.5 L72 14.5 L66 24 Z" fill="#fff" opacity="0.16" />
          <path d="M37 26 L37 44 M58 26 L58 44 M83 24 Q85 34 81 44" stroke="#c99200" strokeWidth="0.9" fill="none" />
          <rect x="40" y="29" width="5" height="1.6" rx="0.8" fill="#c99200" />
          <rect x="61" y="29" width="5" height="1.6" rx="0.8" fill="#c99200" />
          <path d="M79 21.5 Q83 19.5 85.5 21.5 L84.5 24.5 L80 24.5 Z" fill="#F2B705" stroke="#c99200" strokeWidth="0.7" />
          <path d="M5.6 20 Q6.2 17 9.5 16 L10.5 27 L6.4 29 Z" fill="#C8102E" />
          <path d="M6.4 21 L8.6 20 L8.9 24 L6.8 25 Z" fill="#fff" opacity="0.35" />
          <path d="M103.5 26.2 Q110 27 113.6 30.2 L110.8 32.4 Q106 30.8 102.6 29.6 Z" fill="#eef2f5" />
          <rect x="111" y="38" width="4" height="3" rx="1" fill="#2a2a2a" />
        </g>
        <Wheel cx={30} driving={driving} />
        <Wheel cx={92} driving={driving} />
      </g>
    </svg>
  );
}

function Wheel({ cx, driving }: { cx: number; driving: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={46} r={10.5} fill="#151515" />
      <g className={cn("car-wheel", driving && "car-wheel-spin")}>
        <circle cx={cx} cy={46} r={7} fill="#c9cfd5" />
        {[0, 45, 90, 135].map(angle => (
          <line
            key={angle}
            x1={cx - 6.5 * Math.cos((angle * Math.PI) / 180)} y1={46 - 6.5 * Math.sin((angle * Math.PI) / 180)}
            x2={cx + 6.5 * Math.cos((angle * Math.PI) / 180)} y2={46 + 6.5 * Math.sin((angle * Math.PI) / 180)}
            stroke="#3a4048" strokeWidth="1.3"
          />
        ))}
        <circle cx={cx} cy={46} r={1.8} fill="#2a2a2a" />
      </g>
    </g>
  );
}
