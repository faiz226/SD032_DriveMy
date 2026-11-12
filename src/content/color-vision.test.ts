import { describe, expect, it } from "vitest";
import { PLATES, readPlate, scoreTest } from "./color-vision";

const normalAnswers = () => Object.fromEntries(PLATES.map(p => [p.n, p.normal ?? ""]));

describe("Ishihara scoring, from the PDF's answer key", () => {
  it("has the 25 number plates in order", () => {
    expect(PLATES.map(p => p.n)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  it("reads every plate as normal for normal answers", () => {
    const result = scoreTest(normalAnswers());
    expect(result).toMatchObject({ outcome: "clear", normal: 25, differ: 0, redGreen: 0 });
  });

  it("matches the red-green readings the key lists", () => {
    const answers: Record<number, string> = {};
    for (const p of PLATES) answers[p.n] = p.protan ?? p.redGreen ?? (p.n === 1 ? "12" : "");
    const result = scoreTest(answers);
    expect(result.outcome).toBe("check");
    expect(result.normal).toBe(1);
    expect(result.redGreen).toBe(24);
    expect(result.readings[21].reading).toBe("protan");
  });

  it("is not valid when plate 1, which everyone reads as 12, is missed", () => {
    expect(scoreTest({ ...normalAnswers(), 1: "" }).outcome).toBe("invalid");
  });

  it("treats no number and any wrong number on plates 10 to 17 as the red-green reading", () => {
    const plate10 = PLATES[9];
    expect(readPlate(plate10, "")).toBe("redGreen");
    expect(readPlate(plate10, "8")).toBe("redGreen");
    expect(readPlate(plate10, "02")).toBe("normal");
  });

  it("tells a hidden-number plate's normal blank from a wrong number", () => {
    const plate18 = PLATES[17];
    expect(readPlate(plate18, "")).toBe("normal");
    expect(readPlate(plate18, "5")).toBe("redGreen");
    expect(readPlate(plate18, "8")).toBe("other");
  });

  it("splits plates 22 to 25 into protan and deutan readings", () => {
    const plate22 = PLATES[21];
    expect(readPlate(plate22, "6")).toBe("protan");
    expect(readPlate(plate22, "2")).toBe("deutan");
    expect(readPlate(plate22, "62")).toBe("other");
  });
});
