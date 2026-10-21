import { useEffect, useRef, useState } from "react";
import { SpeakerHigh, Stop, Pause, Play } from "phosphor-react";
import { requestSpeech, SpeechUnavailableError } from "@/services/speech.service";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

export function SpeechControl({ text, kind = "question" }: { text: string; kind?: "question" | "explanation" }) {
  const { language, t } = useLanguage();
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused" | "error" | "limit">("idle");
  const active = useRef<{ controller: AbortController; audio?: HTMLAudioElement; url?: string } | null>(null);
  const cached = useRef<Blob | null>(null);
  function stop() {
    active.current?.controller.abort();
    if (active.current?.audio) {
      active.current.audio.onended = null;
      active.current.audio.onerror = null;
      active.current.audio.pause();
    }
    if (active.current?.url) URL.revokeObjectURL(active.current.url);
    active.current = null;
    setState("idle");
  }
  useEffect(() => {
    cached.current = null;
    window.addEventListener("drivemy:speech-start", stop);
    return () => { window.removeEventListener("drivemy:speech-start", stop); stop(); };
  }, [text, language]);
  async function play() {
    window.dispatchEvent(new Event("drivemy:speech-start"));
    const session = { controller: new AbortController() } as NonNullable<typeof active.current>;
    active.current = session; setState("loading");
    try {
      let blob = cached.current;
      if (!blob) {
        blob = await requestSpeech(text, kind, language, session.controller.signal);
        if (!session.controller.signal.aborted) cached.current = blob;
      }
      if (session.controller.signal.aborted) return;
      session.url = URL.createObjectURL(blob); session.audio = new Audio(session.url);
      session.audio.onended = () => { if (active.current === session) stop(); };
      session.audio.onerror = () => { if (active.current === session) { stop(); setState("error"); } };
      await session.audio.play();
      if (!session.controller.signal.aborted) setState("playing");
    } catch (err) {
      if (session.controller.signal.aborted) return;
      if (err instanceof SpeechUnavailableError && err.reason === "limit") { setState("limit"); return; }
      stop(); setState("error");
    }
  }
  const running = state === "playing" || state === "paused" || state === "loading";
  return <div className="my-3">
    <Button type="button" variant="outline" onClick={() => { if (running) stop(); else void play(); }} aria-pressed={running}>
      {running ? <Stop aria-hidden="true"/> : <SpeakerHigh aria-hidden="true"/>}
      {t(state === "loading" ? "speech.cancel" : running ? "speech.stop" : "speech.listen")}
    </Button>
    {(state === "playing" || state === "paused") && <Button type="button" variant="outline" className="ml-2" onClick={() => {
      if (state === "playing") { active.current?.audio?.pause(); setState("paused"); }
      else { const session = active.current; void session?.audio?.play().then(() => { if (session === active.current) setState("playing"); }).catch(() => { if (session === active.current) { stop(); setState("error"); } }); }
    }}>{state === "playing" ? <Pause aria-hidden="true"/> : <Play aria-hidden="true"/>}{t(state === "playing" ? "speech.pause" : "speech.resume")}</Button>}
    <span role="status" className="ml-3 text-sm">
      {state === "loading" ? t("speech.preparing") : state === "error" ? t("speech.unavailable") : state === "limit" ? t("speech.limit") : ""}
    </span>
  </div>;
}
