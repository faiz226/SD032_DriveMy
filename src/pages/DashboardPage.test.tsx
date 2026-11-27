import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "vitest-axe";
import { DashboardView } from "./DashboardPage";
import { dashboardModel } from "@/lib/dashboard/model";

const model = dashboardModel({
  mock: { count: 2, history: [{ score: 38, total_questions: 50 }, { score: 40, total_questions: 50 }] },
  theory: { completedModules: 1, totalModules: 3, percentage: 33, byModule: [{ module_id: "rpk-exterior", completed: true }] },
});
const view = () => render(<MemoryRouter><DashboardView name="Nur" score={68} parts={{ theory: 59, practical: 9 }} model={model} activity={[]} /></MemoryRouter>);

describe("DashboardView", () => {
  it("leads with the distance left on the gantry and the road", () => {
    view();
    expect(screen.getByRole("heading", { level: 1, name: "Distance to your P licence" })).toBeInTheDocument();
    expect(screen.getByText("32 points to go", { selector: ".sr-only" })).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Readiness score" })).toHaveAttribute("aria-valuenow", "68");
    expect(screen.getByText("Theory: 59 of 85. Practical: 9 of 15.")).toBeInTheDocument();
  });

  it("never claims a licence: the theory plate says it is not a JPJ record or names the shortfall", () => {
    view();
    expect(screen.getByText("Best 40/50. The pass mark is 42.")).toBeInTheDocument();
    expect(screen.getByText(/not an official JPJ result/)).toBeInTheDocument();
  });

  it("shows one next step on the VMS board", () => {
    view();
    expect(screen.getByRole("heading", { level: 2, name: "Continue RPK / RSM" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Continue/ }).some(link => link.getAttribute("href") === "/rpk-rsm")).toBe(true);
  });

  it("offers the three theory modules as toll lanes, with the KPP 01 lane pointing at the mock", () => {
    view();
    const lanes = within(screen.getByRole("region", { name: "Pick a lane" }));
    expect(lanes.getAllByRole("link")).toHaveLength(3);
    expect(lanes.getByRole("link", { name: /KPP 01 mock test/ })).toHaveAttribute("href", "/mock-test");
  });

  it("states a mock below the pass mark as a shortfall, in words, with the pass mark as the target", () => {
    view();
    expect(screen.getByText("2 short of the pass mark")).toBeInTheDocument();
    expect(screen.getByText("Pass mark 42")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Your best 40 of 50; pass mark 42" })).toBeInTheDocument();
  });

  it("before any mock, shows a dash, the pass mark as a note, and a way to take one", () => {
    const empty = dashboardModel({ mock: { count: 0, history: [] }, theory: undefined });
    render(<MemoryRouter><DashboardView name="Nur" score={0} parts={{ theory: 0, practical: 0 }} model={empty} activity={[]} /></MemoryRouter>);
    expect(screen.getByText("Pass mark: 56 of 70")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Take a mock test" })).toHaveAttribute("href", "/mock-test");
    expect(screen.queryByText("56", { exact: true })).not.toBeInTheDocument();
  });

  it("keeps the road tip off the dashboard", () => {
    view();
    expect(screen.queryByText("Road tip")).not.toBeInTheDocument();
  });

  it("has no axe violations that jsdom can detect", async () => {
    const { container } = view();
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe("DashboardView on a phone", () => {
  it("still offers all three lanes, as one set of links", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false, onchange: null })) as typeof window.matchMedia;
    try {
      view();
      const lanes = within(screen.getByRole("region", { name: "Pick a lane" }));
      expect(lanes.getAllByRole("link")).toHaveLength(3);
      expect(lanes.getByRole("link", { name: /KPP 01 mock test/ })).toBeInTheDocument();
    } finally {
      window.matchMedia = original;
    }
  });
});
