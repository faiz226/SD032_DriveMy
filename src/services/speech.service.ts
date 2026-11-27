import { getSession } from "./auth.service";

export class SpeechUnavailableError extends Error {
  constructor(public readonly reason: "sign_in" | "limit" | "unavailable") {
    super(reason);
    this.name = "SpeechUnavailableError";
  }
}

let known: boolean | undefined;
let probe: Promise<boolean> | undefined;

/** The answer once it is in, so a control that mounts again (each question) does not flash before it knows. */
export const speechKnown = () => known;

/**
 * Whether the server has narration set up (a voice key). Asked once per visit; an ask that fails (offline) is not
 * remembered. A deploy without the voice key answers false, and the Listen buttons stay away rather than fail.
 */
export function speechAvailable(): Promise<boolean> {
  probe ??= fetch("/api/speech")
    .then((response) => (response.ok ? (response.json() as Promise<{ available?: unknown }>) : { available: false }))
    .then((body) => (known = body.available === true))
    .catch(() => { probe = undefined; return false; });
  return probe;
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
