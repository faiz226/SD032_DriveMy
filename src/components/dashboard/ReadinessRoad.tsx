import type { ReactNode } from "react";
import { Car } from "phosphor-react";
import { Carriageway, Figure, LPlate } from "@/components/ui/road";
import { useLanguage } from "@/hooks/useLanguage";
import { licenceGates } from "@/lib/licence";

/** Where a mark sits on the painted track, which is inset 1.75rem from each side. */
const atMark = (mark: number) => `calc(1.75rem + (100% - 3.5rem) * ${mark / 100})`;
const AXIS = [0, 60, 100];
const MOTION = "motion-safe:transition-transform [transition-duration:var(--motion-progress)] [transition-timing-function:var(--ease-jalan)]";

/**
 * Jarak ke Lulus: the learning score drawn as a road. Paired solid lines behind
 * the car are marks earned; the broken line ahead is still open. The L and P
 * plates stand at 60 and 100 but stay dashed outlines, because reaching a
 * position is not holding a licence (licence.ts, decision D2). The road moves
 * only when the score changes, never on page load.
 */
export function ReadinessRoad({ value, children }: { value: number; children?: ReactNode }) {
  const { t } = useLanguage();
  const score = Math.round(Math.min(100, Math.max(0, value)));
  const unverified = t("dashboard.road.notVerified");
  return <Carriageway aria-labelledby="readiness-title">
    <div className="p-5 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-lg">
          <p className="type-label mb-2 text-sm text-[rgb(var(--paint)/.8)]">{t("readiness.learningProgress")}</p>
          <h1 id="readiness-title" className="type-display text-[clamp(2rem,4vw,2.75rem)] text-[rgb(var(--paint))]">{t("dashboard.road.title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--paint)/.85)]">{t("dashboard.road.lead")}</p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="leading-none"><Figure className="text-[clamp(3.375rem,6vw,4.25rem)]">{score}</Figure><span className="type-figure text-2xl"> / 100</span></p>
          <p className="mt-3 text-sm text-[rgb(var(--paint)/.85)]">{t("dashboard.road.remaining", { count: 100 - score })}</p>
        </div>
      </div>
      <div className="road-scroller mt-6 overflow-x-auto pb-2" tabIndex={0} role="region" aria-label={t("dashboard.road.region")}>
        <div className="relative min-w-[30rem] px-7 pb-9 pt-[5.25rem]">
          <span className="absolute top-0 -translate-x-1/2" style={{ left: atMark(60) }} data-gate={licenceGates.L}><LPlate letter="L" label={unverified}/></span>
          <span className="absolute top-0 -translate-x-1/2" style={{ left: atMark(100) }} data-gate={licenceGates.P}><LPlate letter="P" label={unverified}/></span>
          <div className="relative h-10 border-y border-[rgb(var(--paint)/.35)]" role="progressbar" aria-label={t("dashboard.road.meter")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-valuetext={`${score} / 100`}>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-[rgb(var(--paint))]"/>
            <div className={`road-earned absolute inset-x-0 top-1/2 h-2 origin-left ${MOTION}`} style={{ transform: `translateY(-50%) scaleX(${score / 100})` }}/>
            <div className={`absolute inset-x-0 top-0 ${MOTION}`} style={{ transform: `translateX(${score}%)` }}>
              <Car size={36} weight="fill" aria-hidden="true" className="-translate-x-1/2 bg-[rgb(var(--asphalt))] text-[rgb(var(--awas))]"/>
            </div>
          </div>
          <div aria-hidden="true" className="type-figure absolute inset-x-0 bottom-0 h-6 text-sm">
            {AXIS.map(mark => <span key={mark} className="absolute -translate-x-1/2" style={{ left: atMark(mark) }}>{mark}</span>)}
          </div>
        </div>
      </div>
    </div>
    {children}
  </Carriageway>;
}
