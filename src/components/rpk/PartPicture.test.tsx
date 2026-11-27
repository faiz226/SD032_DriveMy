import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RPK_TOPICS } from "@/content/rpk-rsm";
import { HOTSPOTS } from "./PartArt";
import { PartPicture } from "./PartPicture";
import { PART_PHOTOS } from "./photos";

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
    expect(screen.getAllByRole("button")).toHaveLength(PART_PHOTOS[topic.id]?.spots.filter(Boolean).length ?? 7);
    expect(screen.getByRole("button", { name: "Step 2" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Step 3" }));
    expect(onSelect).toHaveBeenCalledWith(2);
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Step 4" }));
    expect(onHover).toHaveBeenCalledWith(3);
  });

  it("shows a photo with hotspots placed by percentage, and falls back to the drawing if it will not load", () => {
    const topic = RPK_TOPICS[1];
    const photo = { src: "/rpk/test.jpg", spots: topic.steps.en.map((_, i): [number, number] => [10 + i * 10, 25 + i * 5]) };
    render(<PartPicture topicId={topic.id} label="Engine bay photo" stepCount={topic.steps.en.length} active={null} stepName={i => `Step ${i + 1}`} onSelect={vi.fn()} onHover={vi.fn()} photo={photo} />);
    const image = screen.getByRole("img", { name: "Engine bay photo" });
    expect(image.tagName).toBe("IMG");
    expect(screen.getByRole("button", { name: "Step 1" })).toHaveStyle({ left: "10%", top: "25%" });
    expect(screen.getByRole("button", { name: "Step 3" })).toHaveStyle({ left: "30%", top: "35%" });
    fireEvent.error(image);
    expect(screen.queryByRole("img", { name: "Engine bay photo" })?.tagName).not.toBe("IMG");
    // back on the drawing, whose positions are the 400 x 300 ones, as percentages
    const [x, y] = HOTSPOTS[topic.id][0];
    expect(screen.getByRole("button", { name: "Step 1" })).toHaveStyle({ left: `${(x / 400) * 100}%`, top: `${(y / 300) * 100}%` });
  });
});
