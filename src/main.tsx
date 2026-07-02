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

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

updateSW = registerSW({
  onNeedRefresh() {
    toast.info("Update available", {
      description: "A new version of DriveMy is ready.",
      action: {
        label: "Reload",
        onClick: () => updateSW?.(true),
      },
      duration: Infinity,
    });
  },
  onOfflineReady() {
    toast.success("Ready to work offline", { duration: 3000 });
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
