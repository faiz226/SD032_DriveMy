#!/usr/bin/env node
/**
 * The simulator's instructor voice: public/sim/voice/{en,ms}/<key>.mp3, spoken by Fish Audio's text-to-speech
 * from the very strings the screen shows (src/lib/translations: every sim.tips.* and sim.voice.* key), so the
 * voice and the text never disagree. Unchanged lines are skipped (public/sim/voice/manifest.json), so run it
 * again after editing any of those strings.
 *
 *   FISH_AUDIO_API_KEY=... node scripts/gen-voice.mjs [--model s2.1-pro-free] [--voice <reference_id>] [--check]
 *
 * --check transcribes each new line back with Fish Audio's speech-to-text and reports how many of its words
 * came back, a guard on languages nobody on the project can listen to in time. The key stays here: the app
 * only plays the static files, and never sees it.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { en } from "../src/lib/translations/en.ts";
import { ms } from "../src/lib/translations/ms.ts";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const KEY = process.env.FISH_AUDIO_API_KEY;
if (!KEY) throw new Error("Set FISH_AUDIO_API_KEY (it lives in .env.local, never in the repository).");
const MODEL = arg("model", "s2.1-pro-free");   // free under fair use; s2.1-pro is the paid production model
const VOICE = arg("voice", process.env.FISH_AUDIO_VOICE_ID ?? "");   // empty: Fish Audio's default voice
const CHECK = process.argv.includes("--check");
const OUT = path.join("public", "sim", "voice");
const MANIFEST = path.join(OUT, "manifest.json");
const LANGS = { en, ms };
const lines = Object.keys(en).filter((k) => k.startsWith("sim.tips.") || k.startsWith("sim.voice."));

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
const sleep = (ms_) => new Promise((r) => setTimeout(r, ms_));
const ffmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

async function api(url, init, tries = 4) {
  for (let i = 0; ; i++) {
    const res = await fetch(url, init);
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && i < tries) { await sleep(2000 * 2 ** i); continue; }
    throw new Error(`${url}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
}

async function speak(text) {
  const res = await api("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", model: MODEL },
    body: JSON.stringify({ text, format: "mp3", ...(VOICE ? { reference_id: VOICE } : {}) }),
  });
  return Buffer.from(await res.arrayBuffer());
}

async function transcribe(file, language) {
  const form = new FormData();
  form.append("audio", new Blob([readFileSync(file)], { type: "audio/mpeg" }), path.basename(file));
  form.append("language", language);
  form.append("ignore_timestamps", "true");
  const res = await api("https://api.fish.audio/v1/asr", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, model: "transcribe-1" }, body: form });
  return (await res.json()).text ?? "";
}

/**
 * Share of the source's words found in the transcript, both normalised: a rough intelligibility score. Fish
 * Audio's speech-to-text does not know Malay (it heard the Malay lines as Dutch or Czech, phonetically right),
 * so for ms the score reads low: listen to those instead.
 */
const words = (s) => s.toLowerCase().normalize("NFKD").replace(/(\d)\.(\d)/g, "$1 $2").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
function heard(source, transcript) {
  const got = new Set(words(transcript));
  const want = words(source);
  return want.filter((w) => got.has(w)).length / Math.max(1, want.length);
}

let made = 0;
for (const [lang, strings] of Object.entries(LANGS)) {
  mkdirSync(path.join(OUT, lang), { recursive: true });
  for (const key of lines) {
    const text = strings[key];
    const file = path.join(OUT, lang, `${key}.mp3`);
    const hash = createHash("sha1").update(`${MODEL}\n${VOICE}\n${text}`).digest("hex").slice(0, 12);
    if (manifest[`${lang}/${key}`] === hash && existsSync(file)) continue;
    const audio = await speak(text);
    writeFileSync(file, audio);
    if (ffmpeg) {
      // mono at 48 kbps: a spoken line needs no more, and it keeps each file to tens of kilobytes
      const tmp = `${file}.tmp.mp3`;
      if (spawnSync("ffmpeg", ["-y", "-v", "error", "-i", file, "-ac", "1", "-b:a", "48k", tmp]).status === 0) renameSync(tmp, file);
    }
    manifest[`${lang}/${key}`] = hash;
    made++;
    const score = CHECK ? ` heard ${(heard(text, await transcribe(file, lang)) * 100).toFixed(0)}%` : "";
    console.log(`${lang}/${key}: ${(readFileSync(file).length / 1024).toFixed(0)} KB${score}`);
    await sleep(400);   // stay well inside the free tier's fair use
  }
}
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${made} line(s) spoken, ${lines.length * Object.keys(LANGS).length - made} unchanged; model ${MODEL}${VOICE ? `, voice ${VOICE}` : ", default voice"}`);
