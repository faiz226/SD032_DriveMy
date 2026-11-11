import { useEffect, useState } from "react";
import { Bell, Sun, Moon, Monitor } from "@/components/ui/icons";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useThemeStore } from "@/stores/themeStore";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SettingsPanel, SettingsRow } from "./SettingsPrimitives";

const NOTIFICATIONS_KEY = "drivemy-notifications-enabled";

export function DisplayNotificationsSection() {
  const { t } = useLanguage();
  const { theme, setTheme } = useThemeStore();
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    if (stored !== null) {
      setNotifications(stored === "true");
    }
  }, []);

  const handleNotificationsChange = (checked: boolean) => {
    setNotifications(checked);
    localStorage.setItem(NOTIFICATIONS_KEY, String(checked));
  };

  return (
    <>
      <SettingsPanel title={t("settings.display")}>
        <SettingsRow label={t("settings.language")}>
          <LanguageToggle variant="pill" />
        </SettingsRow>

        <div className="h-px bg-border/50 my-1" aria-hidden />

        <SettingsRow
          label={t("settings.theme")}
          description={t("settings.themeDesc")}
        >
          <div className="flex rounded-full bg-muted/60 p-1 border border-border/40 select-none">
            {(["light", "dark", "system"] as const).map((tKey) => {
              const isActive = theme === tKey;
              const Icon = tKey === "light" ? Sun : tKey === "dark" ? Moon : Monitor;
              return (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => setTheme(tKey)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                    isActive
                      ? "bg-card text-foreground shadow-sm border border-border/10"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t(`settings.theme.${tKey}`)}</span>
                </button>
              );
            })}
          </div>
        </SettingsRow>
      </SettingsPanel>

      <SettingsPanel title={t("settings.notifications")}>
        <SettingsRow
          label={t("settings.notifications")}
          description={t("settings.notificationsDesc")}
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2 py-1 border",
                notifications
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-muted text-muted-foreground"
              )}
            >
              <Bell className="h-3.5 w-3.5" weight="regular" aria-hidden />
              {notifications
                ? t("settings.notificationsOn")
                : t("settings.notificationsOff")}
            </span>
            <Switch
              checked={notifications}
              onCheckedChange={handleNotificationsChange}
              aria-label={t("settings.notifications")}
            />
          </div>
        </SettingsRow>
      </SettingsPanel>
    </>
  );
}

