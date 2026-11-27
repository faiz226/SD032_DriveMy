import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestLaunchPanel } from "./TestLaunchPanel";
import { translate } from "@/lib/translations";
import { useAuthStore } from "@/stores/authStore";
import { loadProgress, PROGRESS_SCOPES, saveProgress } from "@/lib/testProgress";

vi.mock("@/hooks/useProgressStats", () => ({ useMockStats: () => ({ data: undefined }) }));
vi.mock("@/hooks/useLanguage", () => ({ useLanguage: () => ({ language: "en", t: (key: Parameters<typeof translate>[0], params?: Record<string, string | number>) => translate(key, "en", params) }) }));

// Radix's checkbox measures itself
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };

const t = (key: Parameters<typeof translate>[0], params?: Record<string, string | number>) => translate(key, "en", params);
const SET = "mock-da-combined-1";

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: { id: "u1" } as never });
});

function open() {
  const onStart = vi.fn();
  render(<TestLaunchPanel mode="mock" t={t} onStart={onStart} />);
  fireEvent.click(screen.getByRole("button", { name: /Mock Set 1/ }));
  fireEvent.click(screen.getByRole("checkbox"));
  return onStart;
}

describe("a mock test left part-way", () => {
  it("says where it was left and offers to continue from there or start a new one", () => {
    saveProgress(PROGRESS_SCOPES.mock(SET), "u1", Date.now() - 5 * 60_000, { answers: Object.fromEntries(Array.from({ length: 22 }, (_, i) => [i, 0])), currentIndex: 22 });
    const onStart = open();
    expect(screen.getByRole("status")).toHaveTextContent("You left this test at question 23");
    expect(screen.getByRole("button", { name: "Continue from question 23" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Start a new test" }));
    expect(onStart).toHaveBeenCalledWith({ language: "en", setId: SET });
    expect(loadProgress(PROGRESS_SCOPES.mock(SET), "u1")).toBeNull();   // the old attempt is gone
  });

  it("shows no continue or new-test choice when nothing was left", () => {
    open();
    expect(screen.queryByRole("button", { name: "Start a new test" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start/ })).toBeEnabled();
  });
});
