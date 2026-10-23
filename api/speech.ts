import type { IncomingMessage, ServerResponse } from "node:http";

type Environment = Record<string, string | undefined>;

/** Authenticated, bounded narration. No provider credentials or errors reach clients. */
export async function handleSpeech(req: IncomingMessage & { body?: unknown }, res: ServerResponse, env: Environment) {
  res.setHeader("Cache-Control", "private, no-store");
  const fail = (status: number, code: string) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: code }));
  };
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return fail(405, "method"); }
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return fail(401, "sign_in");
  const key = env.FISH_AUDIO_API_KEY;
  const voice = env.FISH_AUDIO_VOICE_ID;
  const model = env.FISH_AUDIO_MODEL || "s2.1-pro-free";
  const url = env.VITE_SUPABASE_URL;
  const anon = env.VITE_SUPABASE_ANON_KEY;
  if (!key || !voice || !url || !anon || !["s1", "s2-pro", "s2.1-pro", "s2.1-pro-free", "drama-3"].includes(model)) return fail(503, "unavailable");
  try {
    let body = req.body;
    if (body === undefined) {
      const chunks: Buffer[] = []; let size = 0;
      for await (const chunk of req) {
        const bytes = Buffer.from(chunk); size += bytes.length;
        if (size > 12_000) return fail(413, "too_long");
        chunks.push(bytes);
      }
      body = Buffer.concat(chunks).toString("utf8");
    }
    if (typeof body === "string") {
      if (Buffer.byteLength(body) > 12_000) return fail(413, "too_long");
      try { body = JSON.parse(body); } catch { return fail(400, "invalid"); }
    }
    const input = body as { text?: unknown; kind?: unknown; language?: unknown } | null;
    if (!input || typeof input.text !== "string" || !input.text.trim() || input.text.length > 2500 || !["question", "explanation"].includes(String(input.kind)) || !["en", "ms"].includes(String(input.language))) return fail(400, "invalid");
    const headers = { apikey: anon, Authorization: authorization, "Content-Type": "application/json" };
    const auth = await fetch(`${url}/auth/v1/user`, { headers, signal: AbortSignal.timeout(10_000) });
    if (!auth.ok) return fail(401, "sign_in");
    // Database quota survives cold starts and concurrent server instances. Fail closed.
    const quota = await fetch(`${url}/rest/v1/rpc/consume_speech_quota`, { method: "POST", headers, body: "{}", signal: AbortSignal.timeout(10_000) });
    if (!quota.ok) return fail(503, "unavailable");
    if (await quota.json() !== true) return fail(429, "daily_limit");
    const audio = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", model },
      body: JSON.stringify({ text: input.text, reference_id: voice, language: input.language, format: "mp3" }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!audio.ok || !audio.body || !audio.headers.get("Content-Type")?.startsWith("audio/")) return fail(502, "unavailable");
    const chunks: Uint8Array[] = []; let size = 0;
    for await (const chunk of audio.body) {
      size += chunk.length;
      if (size > 5_000_000) return fail(502, "unavailable");
      chunks.push(chunk);
    }
    res.setHeader("Content-Type", "audio/mpeg");
    res.end(Buffer.concat(chunks));
  } catch { if (!res.writableEnded) fail(503, "unavailable"); }
}

export default function speech(req: IncomingMessage, res: ServerResponse) {
  return handleSpeech(req, res, process.env);
}
