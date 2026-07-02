import { useEffect, useState } from "react";
import { Bell, Warning, Sun, Moon, Monitor, SignOut } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useThemeStore } from "@/stores/themeStore";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NOTIFICATIONS_KEY = "drivemy-notifications-enabled";

function SettingsPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "card-premium p-5 md:p-6 space-y-5",
        className
      )}
      aria-labelledby={`settings-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <h2
        id={`settings-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1 max-w-readable">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center min-h-[48px]">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const { theme, setTheme } = useThemeStore();

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

  const handleDeleteAccount = () => {
    toast.message(t("settings.deleteAccount"), {
      description: t("settings.deleteAccountHint"),
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.AUTH);
    toast.success(t("settings.signOut"));
  };

  return (
    <div className="page-shell max-w-2xl space-y-6">
      <header className="page-header">
        <h1 className="page-title">{t("settings.title")}</h1>
        <p className="page-lead">{t("settings.preferences")}</p>
      </header>

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

      <SettingsPanel title={t("settings.dangerZone")}>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-4">
              <SignOut
                className="h-5 w-5 shrink-0 text-foreground mt-0.5"
                weight="fill"
                aria-hidden
              />
              <div className="space-y-1 max-w-readable">
                <p className="text-sm font-medium text-foreground">
                  {t("settings.signOut")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.signOutDesc")}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto min-h-[48px] rounded-md"
              onClick={handleSignOut}
            >
              {t("settings.signOut")}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <Warning
                className="h-5 w-5 shrink-0 text-destructive mt-0.5"
                weight="fill"
                aria-hidden
              />
              <div className="space-y-1 max-w-readable">
                <p className="text-sm font-medium text-foreground">
                  {t("settings.deleteAccount")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.deleteAccountDesc")}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto min-h-[48px] rounded-md"
              onClick={handleDeleteAccount}
            >
              {t("settings.deleteAccount")}
            </Button>
          </div>
        </div>
      </SettingsPanel>
    </div>
  );
}
