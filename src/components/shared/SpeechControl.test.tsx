import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SpeechControl } from "./SpeechControl";

vi.mock("@/hooks/useLanguage", () => ({ useLanguage: () => ({ language: "en" }) }));
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "test" } } }) } } }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("never auto-generates audio and aborts generation when the question changes", async () => {
  const fetcher = vi.fn(() => new Promise<Response>(() => {}));
  vi.stubGlobal("fetch", fetcher);
  const view = render(<SpeechControl text="First question"/>);
  expect(fetcher).not.toHaveBeenCalled();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Listen" })));
  expect(fetcher).toHaveBeenCalledTimes(1);
  const signal = (fetcher.mock.calls as unknown as [string, RequestInit][])[0][1].signal;
  view.rerender(<SpeechControl text="Second question"/>);
  expect(signal?.aborted).toBe(true);
  expect(screen.getByRole("button", { name: "Listen" })).toBeEnabled();
});

it("lets the learner cancel a pending request", async () => {
  const fetcher = vi.fn(() => new Promise<Response>(() => {}));
  vi.stubGlobal("fetch", fetcher);
  render(<SpeechControl text="A question"/>);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Listen" })));
  fireEvent.click(screen.getByRole("button", { name: "Cancel audio" }));
  const signal = (fetcher.mock.calls as unknown as [string, RequestInit][])[0][1].signal;
  expect(signal?.aborted).toBe(true);
});
