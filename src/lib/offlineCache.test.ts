import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** The service worker's question-bank cache rule lives in vite.config.ts; it must cover the practice view too. */
describe("question bank offline cache rule", () => {
  const source = readFileSync("vite.config.ts", "utf8");
  const [, body, flags] = source.match(/urlPattern: \/(.*kpp_.*questions)\/(i?),/)!;
  const rule = new RegExp(body, flags);

  it.each(["kpp_questions?select=id", "kpp_practice_questions?select=*&set_id=eq.quiz-a-1"])("caches %s", (path) => {
    expect(rule.test(`https://yvkzixbyxonvlicyrhpy.supabase.co/rest/v1/${path}`)).toBe(true);
  });
  it("leaves per-user tables alone", () => {
    expect(rule.test("https://yvkzixbyxonvlicyrhpy.supabase.co/rest/v1/mock_test_results")).toBe(false);
  });
});
