import type { ReactNode } from "react";
import { StaticChartPreviewProvider } from "@/components/charts/static-chart-preview-context";

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
 * A bklit chart with its text alternative. bklit hides its SVG from screen
 * readers and shows values only on hover, so the same numbers are repeated in
 * a visually hidden table. Charts draw in place, without an entry animation:
 * motion here is state feedback, not decoration (Jalan, decision D7).
 */
export function ChartFigure({ label, table, note, className, children }: ChartFigureProps) {
  return (
    <figure className={className} aria-label={label}>
      <StaticChartPreviewProvider>
        <div aria-hidden="true">{children}</div>
      </StaticChartPreviewProvider>
      {note && <figcaption className="mt-3 text-sm text-muted-foreground">{note}</figcaption>}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>{table.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr>
        </thead>
        <tbody>
          {table.rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row">{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
