import { Outlet } from "react-router-dom";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useLanguage } from "@/hooks/useLanguage";
import { useUIStore } from "@/stores/uiStore";
import { AppHeader } from "./AppHeader";

/**
 * The signed-in Jalan shell. A timed exam removes the header rather than
 * hiding it, so it also leaves the tab order and the accessibility tree.
 */
export function JalanLayout() {
  const { examMode } = useUIStore();
  const { t } = useLanguage();
  return <div className="jalan-app min-h-[100dvh] bg-background text-foreground">
    <a href="#main-content" className="sr-only focus:not-sr-only fixed top-2 left-2 z-[90] bg-card p-3">{t("a11y.skipToContent")}</a>
    {!examMode && <AppHeader />}
    <OfflineBanner />
    <main id="main-content" tabIndex={-1}><ErrorBoundary><Outlet /></ErrorBoundary></main>
  </div>;
}
