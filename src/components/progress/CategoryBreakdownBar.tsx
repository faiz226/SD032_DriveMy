import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/lib/translations";

interface CategoryBreakdownBarProps {
  data: { category: string; averageScore: number; attempts: number }[];
}

const CATEGORY_KEYS: Record<string, TranslationKey> = {
  "road-signs": "progress.category.road-signs",
  "traffic-rules": "progress.category.traffic-rules",
  "safety-principles": "progress.category.safety-principles",
};

export function CategoryBreakdownBar({ data }: CategoryBreakdownBarProps) {
  const { t } = useLanguage();

  const chartData = data.map(d => {
    const labelKey = CATEGORY_KEYS[d.category];
    let color = "rgb(var(--destructive))";
    if (d.averageScore >= 84) color = "rgb(var(--success))";
    else if (d.averageScore >= 60) color = "rgb(var(--warning))";

    return {
      name: labelKey ? t(labelKey) : d.category,
      score: d.averageScore,
      color,
      attempts: d.attempts
    };
  });

  return (
    <div className="h-[300px] w-full" aria-label={t("progress.categoryChartAria")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgb(var(--border))" />
          <XAxis 
            type="number"
            domain={[0, 100]} 
            tick={{ fill: "rgb(var(--muted-foreground))", fontSize: 12 }}
            axisLine={{ stroke: "rgb(var(--border))" }}
            tickLine={false}
          />
          <YAxis 
            dataKey="name" 
            type="category"
            width={120}
            tick={{ fill: "rgb(var(--muted-foreground))", fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: "rgb(var(--card))", borderColor: "rgb(var(--border))", borderRadius: "8px" }}
            itemStyle={{ color: "rgb(var(--foreground))" }}
            formatter={(value, _name, props) => [
              `${Number(value ?? 0)}% (${props?.payload?.attempts ?? 0} attempts)`,
              t("progress.chart.score")
            ]}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
