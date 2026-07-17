import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { enUS, ms } from "date-fns/locale";
import { useLanguage } from "@/hooks/useLanguage";
import { useChartColors } from "@/hooks/useChartColors";

interface QuizTrendLineProps {
  data: { date: string; score: number; title: string }[];
}

export function QuizTrendLine({ data }: QuizTrendLineProps) {
  const { t, language } = useLanguage();
  const en = language === "en";
  const colors = useChartColors();

  const chartData = data.slice(-20).map(d => ({
    ...d,
    formattedDate: format(new Date(d.date), "MMM d", { locale: en ? enUS : ms })
  }));

  return (
    <div className="h-[300px] w-full" aria-label={t("progress.chart.quizTrend")}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
          <XAxis 
            dataKey="formattedDate" 
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
            itemStyle={{ color: colors.primary }}
            labelStyle={{ color: colors.mutedForeground, marginBottom: "4px" }}
            formatter={(value, _name, props) => [
              `${Number(value ?? 0)}% (${props?.payload?.title ?? ""})`,
              t("progress.chart.score")
            ]}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke={colors.chart1} 
            strokeWidth={3}
            dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: colors.primary }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
