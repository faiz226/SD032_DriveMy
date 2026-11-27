import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { ROUTES } from "@/lib/constants";
import { hasDecided, writeConsent } from "@/lib/consent";
import { initTelemetry } from "@/lib/telemetry";

/**
 * Consent prompt for non-essential processing (error monitoring).
 *
 * Shown only when a DSN is configured and the user has not decided yet — with
 * no telemetry provider there is nothing to consent to, so asking would be
 * noise.
 *
 * Deliberately NOT a dark pattern: accept and decline are equally prominent and
 * equally easy to reach. Declining is a real, respected choice, not a maze.
 */
export function ConsentBanner() {
  const { t } = useLanguage();
  const telemetryConfigured = Boolean(import.meta.env.VITE_SENTRY_DSN);
  const [visible, setVisible] = useState(() => telemetryConfigured && !hasDecided());

  if (!visible) return null;

  const decide = (choice: "granted" | "denied") => {
    writeConsent(choice);
    // Start immediately on accept, so this first session is covered rather than
    // silently unmonitored until the next reload.
    if (choice === "granted") initTelemetry();
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("consent.title")}
      className="glass-sheet fixed inset-x-3 bottom-3 z-[100] rounded-2xl p-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-lg"
    >
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <p className="glass-ink font-heading text-sm font-extrabold">{t("consent.title")}</p>
          <p className="glass-muted text-sm leading-relaxed">
            {t("consent.body")}{" "}
            <Link
              to={ROUTES.PRIVACY}
              className="glass-ink font-semibold underline underline-offset-4 hover:no-underline"
            >
              {t("settings.privacyPolicy")}
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] flex-1"
            onClick={() => decide("denied")}
          >
            {t("consent.decline")}
          </Button>
          <Button
            type="button"
            className="min-h-[44px] flex-1"
            onClick={() => decide("granted")}
          >
            {t("consent.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
