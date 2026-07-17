import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/lib/translations";
import { useChartColors } from "@/hooks/useChartColors";

interface ManeuverScoresBarProps {
  data: { maneuver: string; bestScore: number; attempts: number }[];
}

const MANEUVER_KEYS: Record<string, { key: TranslationKey; difficulty: string }> = {
  "hill-start": { key: "progress.maneuver.hill-start", difficulty: "hard" },
  "side-parking": { key: "progress.maneuver.side-parking", difficulty: "medium" },
  "parallel-parking": { key: "progress.maneuver.parallel-parking", difficulty: "hard" },
  "three-point-turn": { key: "progress.maneuver.three-point-turn", difficulty: "medium" },
  "s-curve": { key: "progress.maneuver.s-curve", difficulty: "medium" },
  "z-curve": { key: "progress.maneuver.z-curve", difficulty: "medium" },
  "ramp-test": { key: "progress.maneuver.ramp-test", difficulty: "easy" },
  "road-merging": { key: "progress.maneuver.road-merging", difficulty: "hard" },
};

export function ManeuverScoresBar({ data }: ManeuverScoresBarProps) {
  const { t } = useLanguage();
  const colors = useChartColors();

  const chartData = data.map(d => {
    const meta = MANEUVER_KEYS[d.maneuver];
    let color = colors.success;
    if (meta?.difficulty === "medium") color = colors.warning;
    if (meta?.difficulty === "hard") color = colors.destructive;

    return {
      name: meta ? t(meta.key) : d.maneuver,
      score: d.bestScore,
      color,
      attempts: d.attempts
    };
  });

  return (
    <div className="h-[300px] w-full" aria-label={t("progress.maneuverChartAria")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={60} 
            tick={{ fill: colors.mutedForeground, fontSize: 12 }} 
            axisLine={{ stroke: colors.border }}
            tickLine={false}
          />
          <YAxis 
            domain={[0, 100]} 
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
          <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={32}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
