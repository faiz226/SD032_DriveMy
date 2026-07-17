import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/lib/translations";
import { useChartColors } from "@/hooks/useChartColors";

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
  const colors = useChartColors();

  const chartData = data.map(d => {
    const labelKey = CATEGORY_KEYS[d.category];
    let color = colors.destructive;
    if (d.averageScore >= 84) color = colors.success;
    else if (d.averageScore >= 60) color = colors.warning;

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
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.border} />
          <XAxis 
            type="number"
            domain={[0, 100]} 
            tick={{ fill: colors.mutedForeground, fontSize: 12 }}
            axisLine={{ stroke: colors.border }}
            tickLine={false}
          />
          <YAxis 
            dataKey="name" 
            type="category"
            width={120}
            tick={{ fill: colors.mutedForeground, fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: colors.card, borderColor: colors.border, borderRadius: "8px" }}
            itemStyle={{ color: colors.foreground }}
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
