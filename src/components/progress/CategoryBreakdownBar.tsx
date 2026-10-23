import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/lib/translations";
import { MOCK_PASS_MARK, MOCK_TOTAL_QUESTIONS } from "@/lib/constants";
import { ChartFigure, labelColumn } from "./ChartFigure";

interface CategoryBreakdownBarProps {
  data: { category: string; averageScore: number; attempts: number }[];
}

const CATEGORY_KEYS: Record<string, TranslationKey> = {
  "road-signs": "progress.category.road-signs",
  "traffic-rules": "progress.category.traffic-rules",
  "safety-principles": "progress.category.safety-principles",
};

const PASS_PERCENT = Math.round((MOCK_PASS_MARK / MOCK_TOTAL_QUESTIONS) * 100);

/**
 * Average quiz score per KPP category. Bars are one neutral ink: colouring
 * each by threshold put red, yellow and green side by side, which reads as a
 * traffic light. Which categories clear the pass mark is stated in words.
 */
export function CategoryBreakdownBar({ data }: CategoryBreakdownBarProps) {
  const { t } = useLanguage();
  const rows = data.map(d => ({
    name: CATEGORY_KEYS[d.category] ? t(CATEGORY_KEYS[d.category]) : d.category,
    score: Math.round(d.averageScore),
    attempts: d.attempts,
  }));
  const list = (items: typeof rows) => items.map(row => row.name).join(", ") || "-";

  return (
    <ChartFigure
      label={t("progress.categoryChartAria")}
      note={t("progress.chart.passMarkSplit", {
        value: PASS_PERCENT,
        above: list(rows.filter(row => row.score >= PASS_PERCENT)),
        below: list(rows.filter(row => row.score < PASS_PERCENT)),
      })}
      table={{
        columns: [t("progress.chart.category"), t("progress.averageScore"), t("progress.chart.attemptCount")],
        rows: rows.map(row => [row.name, `${row.score}%`, row.attempts]),
      }}
    >
      <BarChart data={rows} xDataKey="name" orientation="horizontal" aspectRatio="5 / 2" margin={{ top: 8, right: 16, bottom: 8, left: labelColumn(rows) }}>
        <Grid vertical strokeDasharray="2 6" />
        <Bar dataKey="score" fill="var(--chart-line-primary)" lineCap="butt" animate={false} />
        <BarYAxis showAllLabels />
        <ChartTooltip
          showDatePill={false}
          rows={point => [{ color: "var(--chart-line-primary)", label: t("progress.averageScore"), value: `${point.score as number}% · ${t("progress.attempts", { count: point.attempts as number })}` }]}
        />
      </BarChart>
    </ChartFigure>
  );
}
