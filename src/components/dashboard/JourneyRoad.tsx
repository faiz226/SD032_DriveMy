import { useEffect, useRef, useState } from "react";
import myviBody from "@/assets/car/myvi-body.svg";
import myviWheel from "@/assets/car/myvi-wheel.svg";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const STUDS = 50;
const AXIS = [0, 50, 100];
/** Where the L plate stands on the road; P stands at the finish. */
const L_MARK = 60;
const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));

/**
 * Readiness as a stretch of road at night. The cat's eyes light up to the
 * score one after another, and the car drives up to it when the page opens or
 * the score moves; with reduced motion both simply appear in place. The L
 * plate stands at 60 and lights on the gantry's rule (a full mock at the pass
 * mark), the P plate at 100 lights at full readiness. Tapping the car sounds
 * the horn, a small reward for the curious.
 */
export function JourneyRoad({ value, label, horn = true, lReached = false }: { value: number; label: string; horn?: boolean; lReached?: boolean }) {
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
    <section className="relative pt-12">
      <div aria-hidden="true" className="absolute inset-x-16 top-0">
        {[{ letter: "L", at: L_MARK, reached: lReached }, { letter: "P", at: 100, reached: score >= 100 }].map(plate => (
          <span key={plate.letter} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${plate.at}%` }}>
            <span className={cn("plate-sign h-9 w-9 rounded-[6px] text-[1.5rem]", !plate.reached && "plate-sign-ahead !border-muted-foreground !text-muted-foreground")}>{plate.letter}</span>
            <i className="h-3 w-[3px] bg-muted-foreground" />
          </span>
        ))}
      </div>

      {/* The horn's line floats over the car, outside the road's clip and in
          front of the plates, so neither can hide it. */}
      <div className="pointer-events-none absolute inset-x-16 top-0 z-10 h-[4.5rem]">
        <span
          aria-live="polite"
          className={cn(
            "absolute bottom-0 whitespace-nowrap rounded-xl bg-white px-3 py-1.5 text-[0.9375rem] font-extrabold text-[#111] shadow-lg transition-[opacity,transform] duration-200",
            bubble ? "-translate-x-1/2 -translate-y-1 opacity-100" : "-translate-x-1/2 translate-y-1.5 opacity-0",
          )}
          style={{ left: `${shown}%` }}
        >
          {bubble}
        </span>
      </div>

      <div className="relative h-[104px] overflow-hidden rounded-3xl bg-[linear-gradient(180deg,#10304A,rgb(var(--road)))] px-16 ring-1 ring-border">
        <span aria-hidden="true" className="absolute inset-x-0 top-3 h-[3px] bg-white/75" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-3 h-[3px] bg-white/75" />
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
            // Inline, because an arbitrary Tailwind duration class is ambiguous with the animate plugin and gets dropped.
            style={{ left: `${shown}%`, transitionDuration: "1100ms" }}
          >
            <span aria-hidden="true" className="pointer-events-none absolute left-[90%] top-[48%] h-[80px] w-[150px] -translate-y-1/2 bg-[linear-gradient(90deg,rgb(255_240_170/0.6),transparent)] [clip-path:polygon(0_44%,100%_0,100%_100%,0_58%)] sm:w-[280px]" />
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

/** Where the two wheels sit on the body, as a share of the car's box. */
const WHEELS = [
  { left: "5.44%", top: "63.89%", width: "16.3%" },
  { left: "75.31%", top: "63.6%", width: "16.3%" },
];

/**
 * A yellow Perodua Myvi, traced from a side-on photo: the body and one wheel
 * are SVGs in src/assets/car, and the wheel is placed twice so both can turn.
 * It idles with a small engine shake; while driving it pitches nose-up as it
 * pulls away and dips as it stops, and the wheels spin. Every moving part is
 * an HTML box, so the compositor moves it without redrawing the traced paths.
 */
function Hatchback({ driving }: { driving: boolean }) {
  return (
    <span aria-hidden="true" className="car-idle relative block aspect-[480/217] w-[116px] drop-shadow-[0_0_14px_rgb(var(--brand)/0.45)]">
      <span className={cn("absolute inset-0", driving && "car-launch")}>
        <img src={myviBody} alt="" draggable={false} className="absolute inset-0 h-full w-full" />
        {WHEELS.map(place => (
          <img key={place.left} src={myviWheel} alt="" draggable={false} className={cn("car-wheel absolute", driving && "car-wheel-spin")} style={place} />
        ))}
      </span>
    </span>
  );
}
