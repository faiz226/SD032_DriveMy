import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { toast } from "sonner";
import { initTelemetry } from "./lib/telemetry";

// Telemetry starts ONLY if the user has already granted consent. A first-time
// visitor sends nothing until they choose — see components/shared/ConsentBanner.
initTelemetry();

// ─── PWA service worker registration ─────────────────────────────────────────
import { registerSW } from "virtual:pwa-register";
import { useLanguageStore } from "./stores/languageStore";

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

const register = () => {
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
};

// The simulator's first visit needs the bandwidth for its car and 3D engine; the service worker's precache
// (about 4 MB) waits until the car is ready, or 30 s. Every other route registers as before.
if (/^\/(simulations\/|dev\/sim\/)/.test(window.location.pathname)) {
  let registered = false;
  const once = () => { if (!registered) { registered = true; register(); } };
  window.addEventListener("sim:ready", once, { once: true });
  window.setTimeout(once, 30_000);
} else {
  register();
}

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
