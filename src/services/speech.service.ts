import { getSession } from "./auth.service";

export class SpeechUnavailableError extends Error {
  constructor(public readonly reason: "sign_in" | "limit" | "unavailable") {
    super(reason);
    this.name = "SpeechUnavailableError";
  }
}

/**
 * Narrate visible question or explanation text through /api/speech. The
 * server holds the voice key and the daily quota; the client only proves who
 * is asking. Throws SpeechUnavailableError("limit") once the quota is spent.
 */
export async function requestSpeech(
  text: string,
  kind: "question" | "explanation",
  language: string,
  signal: AbortSignal,
): Promise<Blob> {
  const session = await getSession();
  signal.throwIfAborted();
  if (!session) throw new SpeechUnavailableError("sign_in");
  const response = await fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ text, kind, language }),
    signal,
  });
  if (response.status === 429) throw new SpeechUnavailableError("limit");
  if (!response.ok || !response.headers.get("Content-Type")?.startsWith("audio/")) throw new SpeechUnavailableError("unavailable");
  return response.blob();
}
