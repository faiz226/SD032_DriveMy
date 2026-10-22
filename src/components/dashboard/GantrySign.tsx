import NumberFlow from "@number-flow/react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

interface GantrySignProps {
  /** Readiness, 0 to 100. */
  score: number;
  /** Points earned on the theory side (mock, quiz, notes), out of 85. */
  theory: number;
  /** Points earned in the simulator, out of 15. */
  practical: number;
  /** Best full 50-question mock, when there is one. */
  bestMock?: number;
  passMark: number;
}

const POST = "absolute bottom-0 h-28 w-[18px] bg-[linear-gradient(90deg,#55524c,#8d8a83,#55524c)]";

/**
 * The readiness score as an expressway gantry: how far the learner still has
 * to drive, and the two plates on the way. The L plate lights when a full
 * mock reaches the pass mark in practice; neither plate is a JPJ record, and
 * the sign says so.
 */
export function GantrySign({ score, theory, practical, bestMock, passMark }: GantrySignProps) {
  const { t } = useLanguage();
  const left = Math.max(0, 100 - Math.round(score));
  const theoryReached = bestMock !== undefined && bestMock >= passMark;
  const lDetail = theoryReached
    ? t("dashboard.gantry.lDone")
    : bestMock !== undefined
      ? t("dashboard.gantry.lBest", { score: bestMock })
      : t("dashboard.gantry.lFresh");

  return (
    <section aria-labelledby="gantry-title" className="relative mt-4 pb-6">
      <span aria-hidden="true" className={cn(POST, "left-[9%]")} />
      <span aria-hidden="true" className={cn(POST, "right-[9%]")} />
      <div className="hero-panel grid gap-4 px-5 py-5 sm:px-8 sm:py-6 md:grid-cols-[1.15fr_1fr] md:gap-8 lg:px-10">
        <div className="min-w-0">
          <h1 id="gantry-title" className="text-[1.0625rem] font-extrabold text-white sm:text-[1.125rem]">{t("dashboard.gantry.title")}</h1>
          <p className="sr-only">{left} {t("dashboard.gantry.marksLeft")}</p>
          <div aria-hidden="true" className="mt-1 flex items-end gap-3">
            <span className="text-[clamp(4.25rem,12vw,7.5rem)] font-black leading-[0.8] tracking-[-0.05em] tabular-nums [text-shadow:0_0_30px_rgb(255_255_255/0.35)]">
              <NumberFlow value={left} />
            </span>
            <span className="max-w-[6ch] pb-1 text-[1.125rem] font-extrabold leading-[1.1] sm:text-[1.25rem]">{t("dashboard.gantry.marksLeft")}</span>
          </div>
          <p className="mt-3 max-w-[36ch] text-[0.9375rem] sm:text-base">
            {t("dashboard.gantry.split", { theory: Math.round(theory), practical: Math.round(practical) })}
          </p>
        </div>

        <div className="grid content-center">
          <PlateRow letter="L" reached={theoryReached} title={t("dashboard.gantry.lTitle")} detail={lDetail} />
          <PlateRow letter="P" reached={left === 0} title={t("dashboard.gantry.pTitle")} detail={left ? t("dashboard.gantry.pLeft", { count: left }) : t("dashboard.gantry.pDone")} />
        </div>
      </div>
    </section>
  );
}

function PlateRow({ letter, reached, title, detail }: { letter: "L" | "P"; reached: boolean; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-4 border-t-2 border-white/45 py-3 first:border-0">
      <span aria-hidden="true" className={cn("plate-sign", !reached && "plate-sign-ahead")}>{letter}</span>
      <div className="min-w-0">
        <p className="text-[1.125rem] font-extrabold leading-tight sm:text-xl">{title}</p>
        <p className="mt-0.5 text-[0.875rem] leading-snug sm:text-[0.9375rem]">{detail}</p>
      </div>
    </div>
  );
}
