import { afterEach, describe, expect, it, vi } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleSpeech } from "./speech";

const env = { FISH_AUDIO_API_KEY: "private-test-key", FISH_AUDIO_VOICE_ID: "test-voice", VITE_SUPABASE_URL: "https://example.supabase.co", VITE_SUPABASE_ANON_KEY: "public-test-key" };
async function request(authorization?: string, text = "Read this question.") {
  const req = { method: "POST", headers: { authorization }, body: { text, language: "en", kind: "question" } } as unknown as IncomingMessage;
  const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn(), writableEnded: false };
  await handleSpeech(req, response as unknown as ServerResponse, env);
  return response;
}
afterEach(() => vi.unstubAllGlobals());
describe("narration endpoint", () => {
  it("rejects unauthenticated and oversized requests before contacting providers", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect((await request()).statusCode).toBe(401);
    expect((await request("Bearer test", "a".repeat(2501))).statusCode).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("fails closed when the persistent quota is unavailable or exhausted", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("{}"))
      .mockResolvedValueOnce(new Response("false"));
    vi.stubGlobal("fetch", fetcher);
    expect((await request("Bearer test")).statusCode).toBe(429);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("returns audio after authentication and quota checks without exposing the key", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("{}"))
      .mockResolvedValueOnce(new Response("true"))
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": "audio/mpeg" } }));
    vi.stubGlobal("fetch", fetcher);
    const response = await request("Bearer test");
    expect(response.statusCode).toBe(200);
    expect(response.setHeader).toHaveBeenCalledWith("Content-Type", "audio/mpeg");
    expect(String(response.end.mock.calls[0][0])).not.toContain(env.FISH_AUDIO_API_KEY);
    expect(fetcher.mock.calls[2][1].headers.model).toBe("s2.1-pro-free");
  });
});
