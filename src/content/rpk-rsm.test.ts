import { expect, it } from "vitest";
import { countRpkCompleted, RPK_TOPICS } from "./rpk-rsm";

it("counts only distinct completed RPK/RSM topics", () => {
  expect(countRpkCompleted([
    { module_id: RPK_TOPICS[0].id, completed: true },
    { module_id: RPK_TOPICS[0].id, completed: true },
    { module_id: RPK_TOPICS[1].id, completed: false },
    { module_id: "theory-signs", completed: true },
  ])).toBe(1);
});
