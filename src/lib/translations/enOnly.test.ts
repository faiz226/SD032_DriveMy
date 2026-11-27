import { describe, expect, it } from "vitest";
import { en } from "./en";
import { ms } from "./ms";

// Malay words that must not appear in a screen the learner reads in English. Official names that stay Malay on purpose
// (JPJ, KPP, the language switcher's "Bahasa Malaysia") are not on the list.
const MALAY_ONLY = /\b(motokar|bahagian|jarak|kawalan|selekoh|lebuh|lulus|gagal|cermin|isyarat|titik buta|olah gerak|petak|garisan|tempoh|jalan raya|memandu|pemandu|soalan|jawapan|tanpa|dengan|untuk|yang|tidak)\b/i;
// Keys whose English text legitimately quotes a Malay term (the app teaches the exam's Malay vocabulary).
const QUOTES_MALAY = new Set<string>(["auth.brand.lead", "app.tagline.ms"]);

describe("English screens are English only", () => {
  it("no English string contains a Malay-only word", () => {
    const leaks = Object.entries(en)
      .filter(([key, value]) => !QUOTES_MALAY.has(key) && typeof value === "string" && MALAY_ONLY.test(value))
      .map(([key, value]) => `${key}: ${value}`);
    expect(leaks).toEqual([]);
  });

  it("the labels that once leaked differ between English and Malay", () => {
    for (const key of ["launch.trackDADesc", "launch.trackDDesc", "launch.selectSection", "mock.passed", "mock.failed"] as const) {
      expect(en[key], key).not.toEqual(ms[key]);
    }
  });
});
