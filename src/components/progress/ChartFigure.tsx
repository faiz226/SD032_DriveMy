import type { ReactNode } from "react";
import { StaticChartPreviewProvider } from "@/components/charts/static-chart-preview-context";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Width of a horizontal bar chart's label column, from its longest label, so
 * "Peraturan lalu lintas" is not cut to "Peraturan l…" (bklit truncates to it).
 */
export function labelColumn(rows: { name: string }[]) {
  const longest = Math.max(0, ...rows.map(row => row.name.length));
  return Math.min(184, Math.max(88, Math.round(longest * 6.6) + 16));
}

interface ChartFigureProps {
  /** Names the chart for assistive technology and heads its data table. */
  label: string;
  /** Every value the chart draws, so nothing is reachable only by hovering. */
  table: { columns: string[]; rows: (string | number)[][] };
  /** Optional visible takeaway under the chart. */
  note?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * A bklit chart with its numbers. bklit hides its SVG from screen readers and
 * shows exact values only on hover, which keyboard and touch users cannot do,
 * so every chart carries a "Show the numbers" disclosure with the same values
 * as a table. Charts draw in place, without an entry animation: motion here is
 * state feedback, not decoration.
 */
export function ChartFigure({ label, table, note, className, children }: ChartFigureProps) {
  const { t } = useLanguage();
  return (
    <figure className={className} aria-label={label}>
      <StaticChartPreviewProvider>
        <div aria-hidden="true">{children}</div>
      </StaticChartPreviewProvider>
      {note && <figcaption className="mt-3 text-sm text-muted-foreground">{note}</figcaption>}
      <details className="mt-3 text-sm">
        <summary className="inline-flex min-h-12 cursor-pointer items-center font-semibold">{t("progress.chart.showNumbers")}</summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">{label}</caption>
          <thead className="text-xs text-muted-foreground">
            <tr>{table.columns.map(column => <th key={column} scope="col" className="py-1 pr-3 font-medium">{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {table.rows.map((row, index) => (
              <tr key={index}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row" className="py-2 pr-3 font-normal">{cell}</th> : <td key={cellIndex} className="type-figure py-2 pr-3">{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
