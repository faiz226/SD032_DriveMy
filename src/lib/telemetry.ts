import { hasTelemetryConsent } from "@/lib/consent";

let initialised = false;

/**
 * Start Sentry, but only with a DSN configured AND the user's explicit consent.
 *
 * Called in two places: at boot for users who already consented, and from the
 * consent banner the moment consent is granted (so the first session is covered
 * too, rather than silently unmonitored until the next reload).
 *
 * Idempotent — calling it twice does not double-register.
 *
 * Sentry is imported on demand, so learners who never consent never download it.
 */
export async function initTelemetry(): Promise<void> {
  if (initialised) return;
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  if (!hasTelemetryConsent()) return;
  initialised = true;

  const Sentry = await import("@sentry/react");
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,

    // Must match the release stamped on the uploaded sourcemaps (vite.config.ts),
    // or Sentry cannot symbolicate and every trace stays minified.
    release: import.meta.env.VITE_RELEASE,

    // Explicit rather than relying on the default. This app processes email
    // addresses, exam performance and colour-vision-deficiency results for
    // identified Malaysian individuals — PDPA 2010 personal data, some of it
    // health-adjacent — and Sentry is a third-party processor.
    sendDefaultPii: false,

    beforeSend(event) {
      // Strip query strings and hash fragments from URLs. Supabase puts
      // password-recovery and email-confirmation tokens in exactly those
      // places, so an unscrubbed URL can ship a live credential to Sentry.
      const scrubUrl = (url?: string) => (url ? url.split(/[?#]/)[0] : url);

      if (event.request?.url) {
        event.request.url = scrubUrl(event.request.url);
      }
      delete event.request?.query_string;

      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((crumb) => {
          if (crumb.data && typeof crumb.data["url"] === "string") {
            return { ...crumb, data: { ...crumb.data, url: scrubUrl(crumb.data["url"]) } };
          }
          return crumb;
        });
      }

      return event;
    },
  });
}

/**
 * Stop sending telemetry after consent is withdrawn.
 *
 * Sentry cannot be fully torn down at runtime, so the client is closed and the
 * flag left set: nothing further is transmitted for the rest of the session,
 * and the next load will not initialise at all.
 */
export function shutdownTelemetry(): void {
  if (!initialised) return;
  void import("@sentry/react").then((Sentry) => Sentry.close(0));
}

/** Whether telemetry is currently active — used by the ErrorBoundary. */
export function isTelemetryActive(): boolean {
  return initialised && hasTelemetryConsent();
}
