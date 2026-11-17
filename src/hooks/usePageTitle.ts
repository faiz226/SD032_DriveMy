import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/lib/translations";

/** Page name per route, from the menu labels where there is one. Anything else is the 404 page. */
const TITLES: Record<string, TranslationKey> = {
  "/": "nav.dashboard",
  "/theory": "nav.learn",
  "/rpk-rsm": "nav.rpkRsm",
  "/quizzes": "nav.quiz",
  "/mock-test": "nav.mockTest",
  "/color-vision": "nav.colorblind",
  "/simulations": "nav.simulator",
  "/progress": "nav.progress",
  "/safety": "nav.roadSafety",
  "/settings": "nav.settings",
  "/privacy": "privacy.title",
  "/auth": "auth.signIn",
  "/auth/callback": "auth.signIn",
  "/forgot-password": "auth.forgotPassword",
  "/reset-password": "title.resetPassword",
  "/verify-email": "title.verifyEmail",
  "/mfa": "title.mfa",
};

/** Names the page in the tab and to screen readers on every route change (WCAG 2.4.2). */
export function usePageTitle() {
  const { pathname } = useLocation();
  const { t, language } = useLanguage();
  useEffect(() => {
    const path = pathname.replace(/^(\/simulations)\/.+/, "$1");
    document.title = `${t(TITLES[path] ?? "common.notFoundTitle")} – DriveMy`;
  }, [pathname, language, t]);
}
