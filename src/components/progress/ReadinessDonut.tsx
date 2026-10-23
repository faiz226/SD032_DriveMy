import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import { PieCenter } from "@/components/charts/pie-center";
import { Figure } from "@/components/ui/surface";
import { READINESS_WEIGHTS, readinessContributions } from "@/lib/readiness";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/lib/translations";
import { ChartFigure } from "./ChartFigure";

interface ReadinessDonutProps {
  theoryPct: number;
  quizPct: number;
  mockPct: number;
  simPct: number;
  composite: number;
  status: string;
}

const PARTS: { key: keyof typeof READINESS_WEIGHTS; labelKey: TranslationKey; color: string }[] = [
  { key: "mock", labelKey: "progress.chart.mockTest", color: "var(--chart-1)" },
  { key: "quiz", labelKey: "progress.chart.quiz", color: "var(--chart-2)" },
  { key: "theory", labelKey: "progress.chart.theory", color: "var(--chart-3)" },
  { key: "sim", labelKey: "progress.chart.simulations", color: "var(--chart-4)" },
];

/**
 * The learning score split into the parts that earn it, out of each part's
 * share of 100. The unearned remainder is the pale ring, so an empty learner
 * still sees the whole road ahead rather than a blank chart.
 */
export function ReadinessDonut({ theoryPct, quizPct, mockPct, simPct, composite }: ReadinessDonutProps) {
  const { t } = useLanguage();
  const contributions = readinessContributions({ theory: theoryPct, quiz: quizPct, mock: mockPct, sim: simPct });
  const score = Math.round(Math.min(100, Math.max(0, composite)));
  const slices = [
    ...PARTS.map(part => ({ label: t(part.labelKey), value: contributions[part.key], color: part.color })),
    { label: t("progress.chart.stillToEarn"), value: Math.max(0, 100 - composite), color: "rgb(var(--muted))" },
  ];
  const ofMax = (value: number, weight: number) => t("progress.chart.ofMax", { value: value.toFixed(1), max: Math.round(weight * 100) });

  return (
    <div className="flex flex-col items-center">
      <ChartFigure
        label={t("progress.readinessChartAria")}
        className="w-full"
        note={
          <ul className="mx-auto grid max-w-xs gap-y-2">
            {PARTS.map(part => (
              <li key={part.key} className="flex items-center gap-2">
                <span aria-hidden="true" className="h-3 w-3 shrink-0" style={{ background: part.color }} />
                <span className="min-w-0 flex-1 text-foreground">{t(part.labelKey)}</span>
                <span className="type-figure whitespace-nowrap">{ofMax(contributions[part.key], READINESS_WEIGHTS[part.key])}</span>
              </li>
            ))}
          </ul>
        }
        table={{
          columns: [t("progress.chart.part"), t("progress.chart.contribution")],
          rows: [...PARTS.map(part => [t(part.labelKey), ofMax(contributions[part.key], READINESS_WEIGHTS[part.key])]), [t("readiness.learningProgress"), `${score} / 100`]],
        }}
      >
        <div className="mx-auto w-[13.75rem]">
          <PieChart data={slices} size={220} innerRadius={74} padAngle={0.015} enterTransition={{ duration: 0 }}>
            {slices.map((slice, index) => <PieSlice key={slice.label} index={index} animate={false} hoverEffect="none" />)}
            <PieCenter>
              {() => <div className="text-center"><Figure className="text-4xl">{score}</Figure><span className="type-figure text-lg"> / 100</span><p className="mt-1 text-xs text-muted-foreground">{t("readiness.learningProgress")}</p></div>}
            </PieCenter>
          </PieChart>
        </div>
      </ChartFigure>
      {composite < 50 && (
        <p className="mt-4 max-w-[16rem] text-center text-xs text-muted-foreground">
          {t("progress.readinessIncomplete")}
        </p>
      )}
    </div>
  );
}
