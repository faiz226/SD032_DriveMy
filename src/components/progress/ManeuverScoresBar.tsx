import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/lib/translations";

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

  const chartData = data.map(d => {
    const meta = MANEUVER_KEYS[d.maneuver];
    let color = "rgb(var(--success))";
    if (meta?.difficulty === "medium") color = "rgb(var(--warning))";
    if (meta?.difficulty === "hard") color = "rgb(var(--destructive))";

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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border))" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={60} 
            tick={{ fill: "rgb(var(--muted-foreground))", fontSize: 12 }} 
            axisLine={{ stroke: "rgb(var(--border))" }}
            tickLine={false}
          />
          <YAxis 
            domain={[0, 100]} 
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
