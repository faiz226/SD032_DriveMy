import { Outlet } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useLanguage } from "@/hooks/useLanguage";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";
import { TabBar } from "./TabBar";

/**
 * The signed-in shell. A timed exam removes the header and tab bar rather than
 * hiding them, so they also leave the tab order and the accessibility tree.
 */
export function AppLayout() {
  const { examMode } = useUIStore();
  const { t } = useLanguage();
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh] text-foreground">
        <a href="#main-content" className="sr-only focus:not-sr-only fixed left-3 top-3 z-[90] rounded-xl bg-card px-4 py-3 text-sm font-semibold shadow-lg">{t("a11y.skipToContent")}</a>
        {!examMode && <AppHeader />}
        <OfflineBanner />
        <main id="main-content" tabIndex={-1} className={cn("outline-none", !examMode && "pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8")}>
          <ErrorBoundary><Outlet /></ErrorBoundary>
        </main>
        {!examMode && <TabBar />}
      </div>
    </MotionConfig>
  );
}
