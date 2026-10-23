/**
 * Consent for non-essential processing (PDPA 2010 — Consent; GDPR Art. 6(1)(a)).
 *
 * Sentry is a third-party processor. Error reports are not required for the app
 * to function, so under the PDPA they need consent — previously Sentry.init()
 * ran at module load, before the user had any say.
 *
 * Strictly-necessary storage (theme, language, the Supabase session) is NOT
 * gated here: it is required to deliver a service the user asked for, and is
 * disclosed in the privacy policy instead.
 */

const STORAGE_KEY = "drivemy-consent";

export type ConsentDecision = "granted" | "denied";

export interface ConsentState {
  /** Error and performance monitoring (Sentry). */
  telemetry: ConsentDecision;
  /** ISO timestamp — PDPA expects you to be able to show WHEN consent was given. */
  decidedAt: string;
  /** Lets a future policy change re-prompt rather than silently reusing old consent. */
  version: number;
}

/** Bump when the processing purposes change materially. */
export const CONSENT_VERSION = 1;

export function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (parsed.telemetry !== "granted" && parsed.telemetry !== "denied") return null;
    return parsed;
  } catch {
    // Malformed value — treat as no decision and ask again.
    return null;
  }
}

export function writeConsent(telemetry: ConsentDecision): ConsentState {
  const state: ConsentState = {
    telemetry,
    decidedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing / storage disabled — the decision holds for this session
    // only, which is the privacy-preserving failure mode.
  }
  return state;
}

/** True only on an explicit grant. Absence of a decision is NOT consent. */
export function hasTelemetryConsent(): boolean {
  return readConsent()?.telemetry === "granted";
}

export function hasDecided(): boolean {
  return readConsent() !== null;
}
