import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { TheoryPage } from "./TheoryPage";

const { mutate, reset } = vi.hoisted(() => ({ mutate: vi.fn(), reset: vi.fn() }));
vi.mock("@/hooks/useLanguage", () => ({ useLanguage: () => ({ language: "en" }) }));
vi.mock("@/stores/authStore", () => ({ useAuthStore: () => ({ user: { id: "learner" } }) }));
vi.mock("@/hooks/useProgress", () => ({
  useTheoryProgress: () => ({ data: [], isPending: false, isError: false }),
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
