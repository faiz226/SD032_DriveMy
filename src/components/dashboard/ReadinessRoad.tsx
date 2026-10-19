import { Car } from "phosphor-react";
import { Carriageway, Figure, LPlate } from "@/components/ui/road";
import { useLanguage } from "@/hooks/useLanguage";
import { licenceGates } from "@/lib/licence";

export function ReadinessRoad({ value }: { value: number }) {
  const { language } = useLanguage();
  const ms = language === "ms";
  const score = Math.round(Math.min(100, Math.max(0, value)));
  const unknown = ms ? "Belum disahkan" : "Not verified";
  return <Carriageway className="p-5 sm:p-7" aria-labelledby="readiness-title">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-lg"><p className="type-label text-sm mb-2">{ms ? "Kemajuan pembelajaran" : "Learning progress"}</p>
        <h1 id="readiness-title" className="type-display text-[clamp(2rem,4vw,2.75rem)] !text-[rgb(var(--paint))]">Jarak ke Lulus</h1>
        <p className="mt-3 text-sm !leading-relaxed">{ms ? "Sambung latihan anda. Skor ini mengukur pembelajaran, bukan kelayakan lesen." : "Continue your training. This score tracks learning, not licence eligibility."}</p>
      </div>
      <div className="shrink-0 sm:text-right"><p><Figure className="text-[clamp(3.375rem,6vw,4.25rem)]">{score}</Figure><span className="type-figure text-2xl"> / 100</span></p>
        <p className="text-sm">{100-score} {ms ? "mata ke hujung laluan" : "points to the end of the road"}</p>
      </div>
    </div>
    <div className="mt-7 overflow-x-auto pb-3" tabIndex={0} role="region" aria-label={ms ? "Laluan kemajuan, 0 hingga 100" : "Progress road, 0 to 100"}>
      <div className="relative min-w-[30rem] px-7 pt-24 pb-12 overflow-hidden">
        <span className="absolute left-[60%] top-0 -translate-x-1/2" data-gate={licenceGates.L}><LPlate letter="L" label={unknown}/></span>
        <span className="absolute right-0 top-0" data-gate={licenceGates.P}><LPlate letter="P" label={unknown}/></span>
        <div className="relative h-10 border-y border-[rgb(var(--paint)/.35)] flex items-center" role="progressbar" aria-label={ms ? "Skor pembelajaran" : "Learning score"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
          <div className="w-full border-t-2 border-dashed border-[rgb(var(--paint))]"/>
          <div className="absolute inset-x-0 top-1/2 h-0 origin-left border-t-2 border-dashed border-[rgb(var(--awas))] motion-safe:transition-transform [transition-duration:var(--motion-progress)] [transition-timing-function:var(--ease-jalan)]" style={{ transform: `scaleX(${score/100})` }}/>
          <div className="absolute inset-x-0 top-0 motion-safe:transition-transform [transition-duration:var(--motion-progress)] [transition-timing-function:var(--ease-jalan)]" style={{ transform: `translateX(${score}%)` }}><Car size={36} weight="fill" aria-hidden="true" className="-translate-x-1/2 bg-[rgb(var(--asphalt))] text-[rgb(var(--awas))]"/></div>
        </div>
        <div aria-hidden="true" className="type-figure relative mt-2 text-sm"><span className="absolute left-0">0</span><span className="absolute left-[60%] -translate-x-1/2">60</span><span className="absolute right-0">100</span></div>
      </div>
    </div>
  </Carriageway>;
}
