import { useState, useEffect } from "react";
import { WifiSlash } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

/**
 * Sticky banner shown when the browser goes offline.
 * Uses aria-live="polite" so screen readers announce the change.
 * Mount once inside AppLayout, above <Outlet />.
 */
export function OfflineBanner() {
  const { t } = useLanguage();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }
      try {
        const res = await fetch(`/favicon.png?_=${Date.now()}`, { method: "HEAD", cache: "no-store" });
        setIsOnline(res.ok);
      } catch {
        setIsOnline(false);
      }
    }, 15000);

    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 min-h-[48px]",
        "bg-warning/10 border-b border-warning/30 text-foreground",
        "text-sm font-medium"
      )}
    >
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-warning/15 border border-warning/25 shrink-0"
        aria-hidden
      >
        <WifiSlash className="h-4 w-4 text-warning" />
      </span>
      <span>
        <strong className="text-warning">{t("common.offline")}</strong>
        <span className="text-muted-foreground"> - {t("common.offlineDesc")}</span>
      </span>
    </div>
  );
}
