import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { TheoryPage } from "./TheoryPage";

const { mutate, reset } = vi.hoisted(() => ({ mutate: vi.fn(), reset: vi.fn() }));
vi.mock("@/hooks/useLanguage", () => ({ useLanguage: () => ({ language: "en", t: (key: string) => key }) }));
vi.mock("@/stores/authStore", () => ({ useAuthStore: () => ({ user: { id: "learner" } }) }));
vi.mock("@/hooks/useProgress", () => ({
  useTheoryProgressRows: () => ({ data: [], isPending: false, isError: false }),
  useUpdateTheoryProgress: () => ({ mutate, reset, isPending: false }),
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("saves theory completion only after the learner explicitly confirms it", () => {
  render(<MemoryRouter><TheoryPage /></MemoryRouter>);
  expect(mutate).not.toHaveBeenCalled();
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Traffic Rules" }), { button: 0, ctrlKey: false });
  expect(mutate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Mark module complete" }));
  expect(mutate).toHaveBeenCalledOnce();
  expect(mutate).toHaveBeenCalledWith(expect.objectContaining({
    user_id: "learner", module_id: "theory-rules", completed: true,
  }));
});

it("opens the Hazards and safety tab when reached via ?tab=safety", () => {
  render(<MemoryRouter initialEntries={["/theory?tab=safety"]}><TheoryPage /></MemoryRouter>);
  const safetyTab = screen.getByRole("tab", { name: "Hazards and safety" });
  expect(safetyTab.getAttribute("aria-selected")).toBe("true");
  expect(screen.getByText(/Part C defensive driving/i)).toBeTruthy();
});
