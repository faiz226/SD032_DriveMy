import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from "recharts";
import { useLanguage } from "@/hooks/useLanguage";

import { useChartColors } from "@/hooks/useChartColors";

interface ReadinessDonutProps {
  theoryPct: number;
  quizPct: number;
  mockPct: number;
  simPct: number;
  composite: number;
  status: string;
}

export function ReadinessDonut({ theoryPct, quizPct, mockPct, simPct, composite, status }: ReadinessDonutProps) {
  const { t } = useLanguage();
  const colors = useChartColors();

  const hasData = composite > 0;

  const chartData = hasData ? [
    { name: t("progress.chart.theory"), value: theoryPct * 0.1 },
    { name: t("progress.chart.quiz"), value: quizPct * 0.2 },
    { name: t("progress.chart.mockTest"), value: mockPct * 0.3 },
    { name: t("progress.chart.simulations"), value: simPct * 0.4 },
  ] : [
    { name: "Empty", value: 100 }
  ];

  const COLORS = hasData ? [
    colors.primary,
    colors.primary70,
    colors.primary40,
    colors.primary10 || "#e2e8f0" // Added fourth color
  ] : [
    colors.muted
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="h-[250px] w-full" aria-label={t("progress.readinessChartAria")}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              stroke="none"
            >
              {chartData.map((item, index) => (
                <Cell key={`cell-${index}`} name={item.name} fill={COLORS[index % COLORS.length]} />
              ))}
              <Label
                value={`${Math.round(composite)}%`}
                position="centerBottom"
                className="text-4xl font-bold font-mono font-tabular-nums fill-foreground"
                dy={-10}
              />
              <Label
                value={status}
                position="centerTop"
                className="text-sm fill-muted-foreground"
                dy={15}
              />
            </Pie>
            {hasData && (
              <Tooltip 
                formatter={(val, name) => [`${Number(val ?? 0).toFixed(1)}%`, name]}
                contentStyle={{ backgroundColor: colors.card, borderColor: colors.border, borderRadius: "8px" }}
                itemStyle={{ color: colors.foreground }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 mt-2">
        {hasData ? chartData.map((d, index) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
            {d.name}
          </div>
        )) : (
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }} />
              {t("progress.chart.theory")}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary70 }} />
              {t("progress.chart.mockTest")}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary40 }} />
              {t("progress.chart.simulations")}
            </div>
          </div>
        )}
      </div>
      {composite < 50 && (
        <p className="mt-4 text-xs text-center text-muted-foreground max-w-[200px]">
          {t("progress.readinessIncomplete")}
        </p>
      )}
    </div>
  );
}
