import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { CategoryBreakdownBar } from "./CategoryBreakdownBar";

// The bklit SVG needs layout that jsdom does not have; what matters here is
// the text alternative, which is ours.
vi.mock("@/components/charts/bar-chart", () => ({ BarChart: () => null }));

describe("CategoryBreakdownBar", () => {
  it("states the pass-mark split in words and lists every value in a table", () => {
    render(<CategoryBreakdownBar data={[
      { category: "road-signs", averageScore: 90, attempts: 4 },
      { category: "traffic-rules", averageScore: 70.4, attempts: 3 },
    ]} />);

    const figure = screen.getByRole("figure", { name: "Average score by category" });
    expect(within(figure).getByText("Pass mark 84%. At or above: Road signs. Below: Traffic rules.")).toBeInTheDocument();
    const table = within(figure).getByRole("table");
    expect(within(table).getByRole("rowheader", { name: "Traffic rules" })).toBeInTheDocument();
    expect(within(table).getByText("70%")).toBeInTheDocument();
  });
});
