import { describe, it, expect, beforeEach } from "vitest";
import {
  readConsent,
  writeConsent,
  hasTelemetryConsent,
  hasDecided,
  CONSENT_VERSION,
} from "./consent";

const STORAGE_KEY = "drivemy-consent";

describe("consent", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("treats no stored decision as NOT consented", () => {
    // The critical property: silence is not consent. Sentry must stay off
    // until the user actively chooses.
    expect(hasDecided()).toBe(false);
    expect(hasTelemetryConsent()).toBe(false);
  });

  it("treats an explicit denial as decided but not consented", () => {
    writeConsent("denied");
    expect(hasDecided()).toBe(true);
    expect(hasTelemetryConsent()).toBe(false);
  });

  it("records a grant with a timestamp", () => {
    const before = Date.now();
    const state = writeConsent("granted");

    expect(hasTelemetryConsent()).toBe(true);
    expect(state.version).toBe(CONSENT_VERSION);
    // PDPA expects you to be able to evidence when consent was given.
    expect(new Date(state.decidedAt).getTime()).toBeGreaterThanOrEqual(before - 1000);
  });

  it("re-prompts when the consent version has moved on", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        telemetry: "granted",
        decidedAt: new Date().toISOString(),
        version: CONSENT_VERSION - 1,
      })
    );

    // Stale consent must not carry over a change in processing purposes.
    expect(readConsent()).toBeNull();
    expect(hasDecided()).toBe(false);
    expect(hasTelemetryConsent()).toBe(false);
  });

  it("fails closed on a malformed stored value", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(hasTelemetryConsent()).toBe(false);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ telemetry: "maybe", version: CONSENT_VERSION }));
    expect(hasTelemetryConsent()).toBe(false);
  });

  it("allows consent to be withdrawn after being granted", () => {
    writeConsent("granted");
    expect(hasTelemetryConsent()).toBe(true);

    writeConsent("denied");
    expect(hasTelemetryConsent()).toBe(false);
    expect(hasDecided()).toBe(true);
  });
});
