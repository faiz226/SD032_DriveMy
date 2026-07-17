import { useTheme } from "./useTheme";

export function useChartColors() {
  const { isDark } = useTheme();

  return {
    primary: isDark ? "#ffffff" : "#111111",
    primary70: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(17, 17, 17, 0.7)",
    primary40: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(17, 17, 17, 0.4)",
    primary10: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(17, 17, 17, 0.1)",
    muted: isDark ? "#222222" : "#efefef",
    mutedForeground: isDark ? "#9ca3af" : "#4b4b4b",
    border: isDark ? "#2d2d2d" : "#d8d8d8",
    card: isDark ? "#1a1a1a" : "#fcfcfc",
    foreground: isDark ? "#f5f5f5" : "#202020",
    chart1: isDark ? "#ffffff" : "#111111",
    success: isDark ? "#10b981" : "#059669",
    warning: isDark ? "#f59e0b" : "#b45309",
    destructive: isDark ? "#ef4444" : "#ef4444"
  };
}
