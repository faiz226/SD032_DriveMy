import { describe, expect, it } from "vitest";
import { searchRpk } from "./rpkSearch";

describe("finding RPK steps from the Learn search", () => {
  it("brake fluid leads to RPK, Engine bay, step 2", () => {
    const [first] = searchRpk("brake fluid");
    expect(first).toMatchObject({ topicId: "rpk-engine", routine: "rpk", step: 1 });
    expect(first.title.en).toBe("Engine bay");
  });

  it("finds a step by its Malay words too", () => {
    expect(searchRpk("minyak brek").some((hit) => hit.topicId === "rpk-engine")).toBe(true);
  });

  it("needs every word, ignores very short queries and finds nothing for nonsense", () => {
    expect(searchRpk("br")).toEqual([]);
    expect(searchRpk("brake fluid banana")).toEqual([]);
    expect(searchRpk("zzzz")).toEqual([]);
  });

  it("finds the other parts of the check as well", () => {
    expect(searchRpk("tyre pressure")[0].topicId).toBe("rpk-exterior");
    expect(searchRpk("engine oil")[0].topicId).toBe("rpk-engine");
  });
});
