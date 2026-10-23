import { act, fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SpeechControl } from "./SpeechControl";

vi.mock("@/hooks/useLanguage", async () => {
  const { translate } = await vi.importActual<typeof import("@/lib/translations")>("@/lib/translations");
  return { useLanguage: () => ({ language: "en", t: (key: Parameters<typeof translate>[0]) => translate(key, "en") }) };
});
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

it("ignores a quota response that arrives after cancellation", async () => {
  let respond!: (response: Response) => void;
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { respond = resolve; })));
  render(<SpeechControl text="A question"/>);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Listen" })));
  fireEvent.click(screen.getByRole("button", { name: "Cancel audio" }));
  await act(async () => respond(new Response(null, { status: 429 })));
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  expect(screen.getByRole("button", { name: "Listen" })).toBeEnabled();
});

it("ignores old playback callbacks after a new question starts", async () => {
  const recordings: { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn>; onended: (() => void) | null; onerror: (() => void) | null }[] = [];
  vi.stubGlobal("Audio", class {
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor() { recordings.push(this); }
  });
  const revoke = vi.fn();
  vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: revoke });
  // bytes, not a Blob: jsdom's Blob has no stream(), which Node 22's fetch calls on anything Blob-like (Node 24 turns it
  // into the text "[object Blob]"), so on CI the response threw and the control showed "Audio unavailable"
  vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([0xff, 0xfb, 0x90]), { headers: { "Content-Type": "audio/mpeg" } })));
  const view = render(<SpeechControl text="First question"/>);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Listen" })));
  // the fetch, the blob and the player settle over more than one tick on some platforms (CI's Linux): wait for playback
  await waitFor(() => expect(screen.getByRole("button", { name: "Stop audio" })).toBeEnabled());
  const oldEnd = recordings[0].onended;
  const oldError = recordings[0].onerror;
  expect(oldEnd).toBeTypeOf("function");
  expect(oldError).toBeTypeOf("function");
  view.rerender(<SpeechControl text="Second question"/>);
  expect(recordings[0].pause).toHaveBeenCalled();
  expect(recordings[0].onended).toBeNull();
  expect(recordings[0].onerror).toBeNull();
  expect(revoke).toHaveBeenCalledTimes(1);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Listen" })));
  await waitFor(() => expect(screen.getByRole("button", { name: "Stop audio" })).toBeEnabled());
  act(() => { oldEnd?.(); oldError?.(); });
  expect(screen.getByRole("button", { name: "Stop audio" })).toBeEnabled();
  expect(recordings[1].pause).not.toHaveBeenCalled();
});
