import { useEffect, useState } from "react";
import { useThemeStore } from "@/stores/themeStore";

export function useTheme() {
  const { theme, setTheme } = useThemeStore();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return true;
    if (theme === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;
    return theme === "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    function applyTheme() {
      root.classList.remove("light", "dark");

      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.add(systemTheme ? "dark" : "light");
        setIsDark(systemTheme);
      } else {
        root.classList.add(theme);
        setIsDark(theme === "dark");
      }
    }

    applyTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => {
        applyTheme();
      };

      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [theme]);

  return { theme, setTheme, isDark };
}
