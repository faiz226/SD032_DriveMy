import { describe, expect, it } from "vitest";
import { squirclePath } from "./squircle";

const numbers = (path: string) => (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe("squirclePath", () => {
  it("is a closed outline with four continuous corners", () => {
    const path = squirclePath(200, 100, 20);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    expect(path.match(/a20 20 0 0 1/g)).toHaveLength(4);
    expect(path.match(/c/g)).toHaveLength(8);
  });

  it("starts the curve earlier than a circular corner would", () => {
    // A circular corner of radius 20 starts 20px from the corner; the continuous one, at full smoothing, starts at 2 x 20.
    expect(squirclePath(200, 100, 20).startsWith("M160 0")).toBe(true);
  });

  it("keeps every point inside the box", () => {
    // Walk the path as absolute coordinates: the curves are relative, so track the pen.
    const path = squirclePath(120, 60, 24);
    const parts = path.match(/[MLcaZ][^MLcaZ]*/g)!;
    let x = 0;
    let y = 0;
    for (const part of parts) {
      const v = numbers(part.slice(1));
      if (part[0] === "M" || part[0] === "L") [x, y] = [v[0], v[1]];
      else if (part[0] === "c") for (let i = 0; i < v.length; i += 6) { expect(x + v[i + 4]).toBeGreaterThanOrEqual(-0.01); expect(x + v[i + 4]).toBeLessThanOrEqual(120.01); expect(y + v[i + 5]).toBeGreaterThanOrEqual(-0.01); expect(y + v[i + 5]).toBeLessThanOrEqual(60.01); x += v[i + 4]; y += v[i + 5]; }
      else if (part[0] === "a") { x += v[5]; y += v[6]; }
    }
    // The last curve ends on the top edge, one corner length in from the left, and Z closes the outline.
    expect(Math.round(x)).toBe(Math.round(120 - numbers(path)[0]));
    expect(Math.round(y)).toBe(0);
  });

  it("falls back to a plain rectangle when there is no radius", () => {
    expect(squirclePath(80, 40, 0)).toBe("M0 0H80V40H0Z");
  });

  it("limits the radius to half the shorter side", () => {
    expect(squirclePath(100, 40, 500).match(/a20 20/g)).toHaveLength(4);
  });
});
