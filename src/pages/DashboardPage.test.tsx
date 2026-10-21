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
const view = () => render(<MemoryRouter><DashboardView score={68} model={model} activity={[]}/></MemoryRouter>);

describe("DashboardView", () => {
  it("leads with the readiness road, its score and one next step", () => {
    view();
    expect(screen.getByRole("heading", { level: 1, name: "Jarak ke Lulus" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Learning score" })).toHaveAttribute("aria-valuenow", "68");
    expect(screen.getByText("32 points to the end of the road")).toBeInTheDocument();
    const next = screen.getByRole("heading", { level: 2, name: /Next.*Continue RPK \/ RSM/ });
    expect(next).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Continue/ }).some(link => link.getAttribute("href") === "/rpk-rsm")).toBe(true);
  });

  it("never claims a licence: both plates stay unverified", () => {
    view();
    expect(screen.getAllByText("Not verified")).toHaveLength(2);
  });

  it("states a mock below the pass mark as a shortfall, in numbers", () => {
    view();
    const performance = screen.getByRole("heading", { name: "KPP performance" }).closest("div") as HTMLElement;
    expect(within(performance).getByText("−2")).toBeInTheDocument();
    expect(within(performance).getByText("marks short of the pass mark")).toBeInTheDocument();
  });

  it("offers all six bays as links, with the KPP 01 bay pointing at the 50-question mock", () => {
    view();
    const bays = within(screen.getByRole("region", { name: "Learning bays" }));
    expect(bays.getAllByRole("link")).toHaveLength(6);
    expect(bays.getByRole("link", { name: /KPP 01 mock test/ })).toHaveAttribute("href", "/mock-test");
    expect(bays.getByRole("img", { name: "In progress: 1/5" })).toBeInTheDocument();
  });

  it("has no axe violations that jsdom can detect", async () => {
    const { container } = view();
    expect((await axe(container)).violations).toEqual([]);
  });
});
