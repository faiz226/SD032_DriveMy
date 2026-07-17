import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

// ─── PWA service worker registration ─────────────────────────────────────────
import { registerSW } from "virtual:pwa-register";
import { useLanguageStore } from "./stores/languageStore";

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

updateSW = registerSW({
  onNeedRefresh() {
    const t = useLanguageStore.getState().t;
    toast.info(t("pwa.updateAvailable"), {
      description: t("pwa.updateDesc"),
      action: {
        label: t("pwa.reload"),
        onClick: async () => {
          try {
            await updateSW?.(true);
          } catch (err) {
            console.error("Failed to update SW:", err);
            window.location.reload();
          }
        },
      },
      duration: Infinity,
    });
  },
  onOfflineReady() {
    const t = useLanguageStore.getState().t;
    toast.success(t("pwa.offlineReady"), { duration: 3000 });
  },
  onRegistered(registration: ServiceWorkerRegistration | undefined) {
    console.info("[DriveMy] Service worker registered:", registration?.scope);
  },
  onRegisterError(error: unknown) {
    console.error("[DriveMy] Service worker registration failed:", error);
  },
});

// ─── Mount ────────────────────────────────────────────────────────────────────
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    "[DriveMy] Root element #root not found. Check index.html."
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
