import { Sun, Moon, Monitor } from "@/components/ui/icons";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useThemeStore } from "@/stores/themeStore";
import { useUIStore } from "@/stores/uiStore";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SettingsPanel, SettingsRow } from "./SettingsPrimitives";

export function DisplayNotificationsSection() {
  const { t, language } = useLanguage();
  const { theme, setTheme } = useThemeStore();
  const reduceTransparency = useUIStore((s) => s.reduceTransparency);
  const setReduceTransparency = useUIStore((s) => s.setReduceTransparency);

  const reduceTransparencyLabel =
    language === "ms" ? "Kurangkan ketelusan" : "Reduce transparency";
  const reduceTransparencyDesc =
    language === "ms"
      ? "Gunakan permukaan padu berbanding kaca kabur pada menu dan bar."
      : "Use solid surfaces instead of translucent glass on menus and bars.";

  return (
    <SettingsPanel title={t("settings.display")}>
      <SettingsRow label={t("settings.language")}>
        <LanguageToggle variant="pill" />
      </SettingsRow>

      <div className="h-px bg-border/50 my-1" aria-hidden="true" />

      <SettingsRow
        label={t("settings.theme")}
        description={t("settings.themeDesc")}
      >
        <div
          role="radiogroup"
          aria-label={t("settings.theme")}
          className="inline-flex w-full sm:w-auto rounded-full bg-muted dark:bg-background p-1 border border-border/70 select-none"
        >
          {(["light", "dark", "system"] as const).map((tKey) => {
            const isActive = theme === tKey;
            const Icon = tKey === "light" ? Sun : tKey === "dark" ? Moon : Monitor;
            return (
              <button
                key={tKey}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setTheme(tKey)}
                className={cn(
                  "flex flex-1 sm:flex-none min-h-11 items-center justify-center gap-1.5 px-3.5 rounded-full text-xs font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-spring active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-card text-foreground shadow-sm border border-border/70 dark:bg-secondary dark:text-foreground dark:border-white/20"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t(`settings.theme.${tKey}`)}</span>
              </button>
            );
          })}
        </div>
      </SettingsRow>

      <div className="h-px bg-border/50 my-1" aria-hidden="true" />

      <SettingsRow
        label={reduceTransparencyLabel}
        description={reduceTransparencyDesc}
      >
        <Switch
          checked={reduceTransparency}
          onCheckedChange={setReduceTransparency}
          aria-label={reduceTransparencyLabel}
        />
      </SettingsRow>
    </SettingsPanel>
  );
}

