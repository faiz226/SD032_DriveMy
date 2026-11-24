import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RPK_TOPICS } from "@/content/rpk-rsm";
import { HOTSPOTS } from "./PartArt";
import { PartPicture } from "./PartPicture";

describe("part pictures", () => {
  it("has exactly one hotspot position for every step, in both languages", () => {
    for (const topic of RPK_TOPICS) {
      expect(HOTSPOTS[topic.id], topic.id).toHaveLength(topic.steps.en.length);
      expect(topic.steps.ms).toHaveLength(topic.steps.en.length);
      for (const [x, y] of HOTSPOTS[topic.id]) {
        expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(400);
        expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(300);
      }
    }
  });

  it("offers a button per step that selects, lights and reports hover", () => {
    const topic = RPK_TOPICS[0];
    const onSelect = vi.fn();
    const onHover = vi.fn();
    render(<PartPicture topicId={topic.id} label="Car" stepCount={topic.steps.en.length} active={1} stepName={i => `Step ${i + 1}`} onSelect={onSelect} onHover={onHover} />);
    expect(screen.getAllByRole("button")).toHaveLength(7);
    expect(screen.getByRole("button", { name: "Step 2" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Step 3" }));
    expect(onSelect).toHaveBeenCalledWith(2);
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Step 4" }));
    expect(onHover).toHaveBeenCalledWith(3);
  });
});
