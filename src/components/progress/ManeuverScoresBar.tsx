import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/lib/translations";
import { ChartFigure } from "./ChartFigure";

interface ManeuverScoresBarProps {
  data: { maneuver: string; bestScore: number; attempts: number }[];
}

const MANEUVER_KEYS: Record<string, TranslationKey> = {
  "hill-start": "progress.maneuver.hill-start",
  "side-parking": "progress.maneuver.side-parking",
  "parallel-parking": "progress.maneuver.parallel-parking",
  "three-point-turn": "progress.maneuver.three-point-turn",
  "s-curve": "progress.maneuver.s-curve",
  "z-curve": "progress.maneuver.z-curve",
  "ramp-test": "progress.maneuver.ramp-test",
  "road-merging": "progress.maneuver.road-merging",
};

/**
 * Best simulator score per maneuver. These bars used to be red, yellow or
 * green by *difficulty* — signal colours spent on something that is not a
 * pass or a fail. They are one neutral ink now; horizontal so the maneuver
 * names stay readable on a phone instead of being tilted 45°.
 */
export function ManeuverScoresBar({ data }: ManeuverScoresBarProps) {
  const { t } = useLanguage();
  const rows = data.map(d => ({
    name: MANEUVER_KEYS[d.maneuver] ? t(MANEUVER_KEYS[d.maneuver]) : d.maneuver,
    score: Math.round(d.bestScore),
    attempts: d.attempts,
  }));

  return (
    <ChartFigure
      label={t("progress.maneuverChartAria")}
      table={{
        columns: [t("progress.chart.maneuver"), t("progress.bestScore"), t("progress.chart.attemptCount")],
        rows: rows.map(row => [row.name, `${row.score}%`, row.attempts]),
      }}
    >
      <BarChart data={rows} xDataKey="name" orientation="horizontal" aspectRatio={rows.length > 4 ? "5 / 3" : "5 / 2"} margin={{ top: 8, right: 16, bottom: 8, left: 136 }}>
        <Grid vertical strokeDasharray="2 6" />
        <Bar dataKey="score" fill="var(--chart-line-primary)" lineCap="butt" animate={false} />
        <BarYAxis showAllLabels />
        <ChartTooltip
          showDatePill={false}
          rows={point => [{ color: "var(--chart-line-primary)", label: t("progress.bestScore"), value: `${point.score as number}% · ${t("progress.attempts", { count: point.attempts as number })}` }]}
        />
      </BarChart>
    </ChartFigure>
  );
}
