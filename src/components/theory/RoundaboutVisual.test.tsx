import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoundaboutVisual } from "./RoundaboutVisual";
import { indicatorAt, routePath } from "./roundabout";

describe("roundabout routes", () => {
  it("draws the textbook route to each exit in the right lane", () => {
    expect(routePath("left-9", "left")).toBe("M 86 190 L 86 149.57 A 48 48 0 0 1 68.43 132 L 24 132");
    expect(routePath("straight-12", "left")).toBe("M 86 190 L 86 149.57 A 48 48 0 0 1 86 66.43 L 86 24");
    expect(routePath("right-3", "right")).toBe("M 102 190 L 102 137.95 A 31 31 0 1 1 139.95 100 L 196 100");
    expect(routePath("uturn-6", "right")).toBe("M 102 190 L 102 137.95 A 31 31 0 1 1 118 137.95 L 118 190");
  });

  it("times each indicator to the plan chosen", () => {
    expect(indicatorAt("left-entry", 0.1)).toBe("left");
    expect(indicatorAt("none-entry-left-exit", 0.2)).toBeNull();
    expect(indicatorAt("none-entry-left-exit", 0.8)).toBe("left");
    expect(indicatorAt("right-entry-left-exit", 0.3)).toBe("right");
    expect(indicatorAt("right-entry-left-exit", 0.8)).toBe("left");
    expect(indicatorAt(null, 0.5)).toBeNull();
  });
});

describe("RoundaboutVisual", () => {
  const setup = () => {
    const onSolved = vi.fn();
    render(<RoundaboutVisual lang="en" solved={{}} onSolved={onSolved} />);
    return onSolved;
  };

  it("starts with only the roundabout: no lane or signal choices until an exit is tapped", () => {
    setup();
    expect(screen.queryByRole("button", { name: /Left lane/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Exit 1: Turn left at first exit/ }));
    expect(screen.getByRole("button", { name: /Left lane/ })).toBeInTheDocument();
  });

  it("says on the picture when the lane is wrong, and does not count it", () => {
    const onSolved = setup();
    fireEvent.click(screen.getByRole("button", { name: /Exit 1:/ }));
    fireEvent.click(screen.getByRole("button", { name: /Right lane/ }));
    fireEvent.click(screen.getByRole("button", { name: /Left on entry/ }));
    fireEvent.click(screen.getByRole("button", { name: "Test my route" }));
    expect(screen.getByRole("status")).toHaveTextContent("Wrong lane: use the left lane for this exit.");
    expect(onSolved).not.toHaveBeenCalled();
  });

  it("says when the signal is wrong, naming the right plan", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Exit 3:/ }));
    fireEvent.click(screen.getByRole("button", { name: /Right lane/ }));
    fireEvent.click(screen.getByRole("button", { name: /Left on entry/ }));
    fireEvent.click(screen.getByRole("button", { name: "Test my route" }));
    expect(screen.getByRole("status")).toHaveTextContent("Wrong signal: Signal right on entry, then left before your exit.");
  });

  it("counts an exit once lane and signal are both right", () => {
    const onSolved = setup();
    fireEvent.click(screen.getByRole("button", { name: /Exit 1:/ }));
    fireEvent.click(screen.getByRole("button", { name: /Left lane/ }));
    fireEvent.click(screen.getByRole("button", { name: /Left on entry/ }));
    fireEvent.click(screen.getByRole("button", { name: "Test my route" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correct.");
    expect(onSolved).toHaveBeenCalledWith("left-9");
  });

  it("works from the keyboard", () => {
    setup();
    fireEvent.keyDown(screen.getByRole("button", { name: /Exit 2:/ }), { key: "Enter" });
    expect(screen.getByRole("button", { name: /Exit 2:/ })).toHaveAttribute("aria-pressed", "true");
  });
});
