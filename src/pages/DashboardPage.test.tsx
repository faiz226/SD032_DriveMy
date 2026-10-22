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

  it("offers all six modules as toll lanes, with the KPP 01 lane pointing at the 50-question mock", () => {
    view();
    const lanes = within(screen.getByRole("region", { name: "Pick a lane" }));
    expect(lanes.getAllByRole("link")).toHaveLength(6);
    expect(lanes.getByRole("link", { name: /KPP 01 mock test/ })).toHaveAttribute("href", "/mock-test");
  });

  it("states a mock below the pass mark as a shortfall, in words", () => {
    view();
    expect(screen.getByText("Short of the pass mark")).toBeInTheDocument();
  });

  it("has no axe violations that jsdom can detect", async () => {
    const { container } = view();
    expect((await axe(container)).violations).toEqual([]);
  });
});
