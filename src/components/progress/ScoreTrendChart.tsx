import { curveMonotoneX } from "@visx/curve";
import { LineChart } from "@/components/charts/line-chart";
import { Line } from "@/components/charts/line";
import { Grid } from "@/components/charts/grid";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { ChartTooltip } from "@/components/charts/tooltip";
import { useLanguage } from "@/hooks/useLanguage";
import { ChartFigure } from "./ChartFigure";

interface ScoreTrendChartProps {
  data: { date: string; score: number; title?: string }[];
  /** Accessible name, e.g. "Mock test scores over time". */
  label: string;
  /** Only the most recent attempts are drawn. */
  limit: number;
  /** Percentage drawn as a dashed line, e.g. 84 for the KPP pass mark (42/50). */
  passMark?: number;
}

/** Scores over time for quizzes or mock tests, on a zero baseline. */
export function ScoreTrendChart({ data, label, limit, passMark }: ScoreTrendChartProps) {
  const { t, language } = useLanguage();
  const points = data.slice(-limit).map(d => ({
    date: new Date(d.date),
    score: d.score,
    title: d.title,
    // A transparent series at the pass mark keeps it inside the y-domain even
    // when every score sits below it, so the dashed line is always drawn.
    ...(passMark === undefined ? {} : { passMark }),
  }));
  const dateLabel = (date: Date) => date.toLocaleDateString(language === "ms" ? "ms-MY" : "en-MY", { day: "numeric", month: "short", year: "numeric" });

  return (
    <ChartFigure
      label={label}
      note={passMark === undefined ? undefined : t("progress.chart.passMarkNote", { value: passMark })}
      table={{
        columns: [t("progress.chart.date"), t("progress.chart.score")],
        rows: points.map(point => [point.title ? `${dateLabel(point.date)} · ${point.title}` : dateLabel(point.date), `${point.score}%`]),
      }}
    >
      <LineChart data={points} aspectRatio="5 / 2" margin={{ top: 16, right: 16, bottom: 32, left: 40 }}>
        <Grid
          horizontal
          strokeDasharray="2 6"
          highlightRowValues={passMark === undefined ? undefined : [passMark]}
          highlightRowStroke="rgb(var(--road-ink))"
          highlightRowStrokeDasharray="8 6"
          highlightRowStrokeOpacity={0.8}
        />
        {passMark !== undefined && <Line dataKey="passMark" stroke="transparent" animate={false} fadeEdges={false} showHighlight={false} />}
        <Line dataKey="score" stroke="var(--chart-line-primary)" curve={curveMonotoneX} animate={false} fadeEdges={false} showMarkers />
        <YAxis formatValue={value => `${Math.round(value)}%`} />
        <XAxis />
        <ChartTooltip
          showDatePill={false}
          rows={point => [{ color: "var(--chart-line-primary)", label: t("progress.chart.score"), value: `${point.score as number}%` }]}
        />
      </LineChart>
    </ChartFigure>
  );
}
