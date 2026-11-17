import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { useExamTimer } from "./useExamTimer";
import { useExamSession } from "@/components/exam/useExamSession";
import type { ExamQuestion } from "@/types/database";

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe("useExamTimer", () => {
  it("counts wall-clock time: a frozen page loses seconds, not ticks", () => {
    const { result } = renderHook(() => useExamTimer({ totalSeconds: 4500 }));
    act(() => result.current.start());
    // A sleeping phone or a throttled tab: 10 s pass with no tick, then the next tick fires.
    vi.setSystemTime(Date.now() + 10_000);
    tick(1000);
    expect(result.current.secondsRemaining).toBe(4489);
  });

  it("catches up the moment the page becomes visible again", () => {
    const { result } = renderHook(() => useExamTimer({ totalSeconds: 4500 }));
    act(() => result.current.start());
    vi.setSystemTime(Date.now() + 30_000);
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(result.current.secondsRemaining).toBe(4470);
  });

  it("fires the warning once and expires exactly at zero", () => {
    const onWarning = vi.fn();
    const onExpire = vi.fn();
    const { result } = renderHook(() => useExamTimer({ totalSeconds: 10, warningAt: 5, onWarning, onExpire }));
    act(() => result.current.start());
    tick(5000);
    expect(onWarning).toHaveBeenCalledTimes(1);
    expect(onExpire).not.toHaveBeenCalled();
    tick(5000);
    expect(onWarning).toHaveBeenCalledTimes(1);
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.secondsRemaining).toBe(0);
  });

  it("pause keeps what is left and start carries on from it", () => {
    const { result } = renderHook(() => useExamTimer({ totalSeconds: 100 }));
    act(() => result.current.start());
    tick(3000);
    act(() => result.current.pause());
    tick(10_000);
    expect(result.current.secondsRemaining).toBe(97);
    act(() => result.current.start());
    tick(2000);
    expect(result.current.secondsRemaining).toBe(95);
  });
});

describe("a timed exam", () => {
  const question = {
    id: "q1", category: "road-signs", set_id: "s", order_index: 0, question_en: "Q", question_ms: "S",
    options_en: ["a", "b", "c", "d"], options_ms: ["a", "b", "c", "d"], image_url: null, created_at: "",
  } as ExamQuestion;
  const wrapper = ({ children }: { children: ReactNode }) => createElement(MemoryRouter, null, children);

  it("keeps counting down while the submit dialog is open", () => {
    const { result } = renderHook(
      () => useExamSession({ questions: [question], timeLimit: 4500, mode: "mock", t: (key) => key, onComplete: vi.fn() }),
      { wrapper },
    );
    tick(1000);
    act(() => result.current.handleNext()); // the last question: opens the submit dialog
    expect(result.current.showSubmitModal).toBe(true);
    tick(5000);
    expect(result.current.timer.secondsRemaining).toBe(4494);
    act(() => result.current.handleCancelSubmit());
    tick(1000);
    expect(result.current.timer.secondsRemaining).toBe(4493);
  });
});
