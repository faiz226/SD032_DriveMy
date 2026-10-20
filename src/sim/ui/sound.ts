// The simulator's sound. Browsers only allow audio after a gesture, so the start button unlocks it.
// A fault is a short falling tone, synthesised. The engine is the owner's recording (SFX/), cut in two:
// public/sim/sfx/engine-start.mp3, the starter and the catch, played once; then engine-idle.wav, a 3 s
// seamless loop of the settled idle, whose pitch and level follow the road speed and the throttle.
// The instructor's voice reads the screen's own strings (scripts/gen-voice.mjs), one line at a time.
import { create } from 'zustand';
import type { Language } from '@/lib/constants';

let ctx: AudioContext | null = null;

export function unlockSound() {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
  } catch {
    ctx = null;   // no Web Audio: the simulator stays silent
  }
}

export function faultSound() {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const tone = ctx.createOscillator();
  const level = ctx.createGain();
  tone.type = 'square';
  tone.frequency.setValueAtTime(880, t);
  tone.frequency.exponentialRampToValueAtTime(440, t + 0.14);
  level.gain.setValueAtTime(0.0001, t);
  level.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
  level.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  tone.connect(level).connect(ctx.destination);
  tone.start(t);
  tone.stop(t + 0.2);
}

/** The indicator relay, once per change: a short click, higher as the lamps light than as they go out. */
export function tickSound(on: boolean) {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const tone = ctx.createOscillator();
  const level = ctx.createGain();
  tone.type = 'square';
  tone.frequency.setValueAtTime(on ? 1700 : 1250, t);
  level.gain.setValueAtTime(0.0001, t);
  level.gain.exponentialRampToValueAtTime(0.04, t + 0.002);
  level.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  tone.connect(level).connect(ctx.destination);
  tone.start(t);
  tone.stop(t + 0.04);
}

const ENGINE_START = '/sim/sfx/engine-start.mp3';
const ENGINE_IDLE = '/sim/sfx/engine-idle.wav';
const ENGINE_LEVEL = 0.5;    // under the fault tone
const HANDOVER_S = 3;        // where the recording has settled to idle; the start clip fades out from here

let engineFiles: Promise<AudioBuffer[]> | null = null;
let engine: { src: AudioBufferSourceNode; level: GainNode } | null = null;

const decode = (c: AudioContext, url: string) =>
  fetch(url).then((r) => r.arrayBuffer()).then((b) => c.decodeAudioData(b));

/** The engine starts: the starter and the catch, then the idle. Once per visit: a restart keeps it running. */
export function startEngine() {
  const c = ctx;
  if (!c || engine) return;
  engineFiles ??= Promise.all([decode(c, ENGINE_START), decode(c, ENGINE_IDLE)]);
  const src = c.createBufferSource();
  const level = c.createGain();
  src.loop = true;
  level.gain.value = 0;
  src.connect(level).connect(c.destination);
  engine = { src, level };   // claimed now, so a second call before the files arrive does nothing
  engineFiles.then(([start, idle]) => {
    if (engine?.src !== src) return;   // stopped while the files loaded
    const t = c.currentTime + 0.05;
    const once = c.createBufferSource();
    const onceLevel = c.createGain();
    once.buffer = start;
    onceLevel.gain.value = ENGINE_LEVEL;
    once.connect(onceLevel).connect(c.destination);
    once.start(t);
    src.buffer = idle;
    src.start(t + HANDOVER_S);
    level.gain.setValueAtTime(0, t + HANDOVER_S);
    level.gain.linearRampToValueAtTime(ENGINE_LEVEL, t + HANDOVER_S + 0.3);
  }).catch(() => { /* no engine files: the drive carries on without them */ });
}

/** Each physics step: the revs rise off idle with speed, as a CVT holds them, and the throttle adds load. */
export function engineSound(kmh: number, throttle: number) {
  if (!ctx || !engine?.src.buffer) return;
  const t = ctx.currentTime;
  engine.src.playbackRate.setTargetAtTime(1 + 0.7 * (1 - Math.exp(-Math.abs(kmh) / 25)) + 0.15 * throttle, t, 0.1);
  engine.level.gain.setTargetAtTime(ENGINE_LEVEL * (0.8 + 0.4 * throttle), t, 0.1);
}

/** Paused means silent: everything waits, the engine included. */
export function pauseSound(paused: boolean) {
  if (!ctx) return;
  void (paused ? ctx.suspend() : ctx.resume());
}

/** Leaving the simulator: the engine stops, and the instructor stops mid-line. */
export function stopEngine() {
  queue.length = 0;
  try { speaking?.stop(); } catch { /* already ended */ }
  if (!ctx || !engine) return;
  const { src, level } = engine;
  engine = null;
  level.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
  try { src.stop(ctx.currentTime + 0.5); } catch { /* never started */ }
}

export type VoicePref = 'on' | 'off';
const VOICE_KEY = 'drivemy.sim.voice';
const VOICE_LEVEL = 1;

function savedVoicePref(): VoicePref {
  try {
    return localStorage.getItem(VOICE_KEY) === 'off' ? 'off' : 'on';
  } catch {
    return 'on';
  }
}

/** The simulator settings' instructor voice: on by default. */
export const useVoicePref = create<{ pref: VoicePref; setPref(p: VoicePref): void }>((set) => ({
  pref: savedVoicePref(),
  setPref: (pref) => {
    try { localStorage.setItem(VOICE_KEY, pref); } catch { /* storage blocked: the choice lasts this visit */ }
    set({ pref });
  },
}));

const lines = new Map<string, Promise<AudioBuffer>>();
const queue: string[] = [];
let speaking: AudioBufferSourceNode | null = null;
let busy = false;

/** The instructor says a line, public/sim/voice/<lang>/<key>.mp3, after the one already speaking. */
export function say(key: string, lang: Language) {
  if (!ctx || useVoicePref.getState().pref === 'off') return;
  queue.push(`/sim/voice/${lang}/${key}.mp3`);
  if (queue.length > 2) queue.splice(0, queue.length - 2);   // a backlog of stale lines helps nobody
  if (!busy) void sayNext();
}

async function sayNext() {
  const c = ctx;
  const url = queue.shift();
  speaking = null;
  if (!c || !url) { busy = false; return; }
  busy = true;
  try {
    if (!lines.has(url)) lines.set(url, decode(c, url));
    const src = c.createBufferSource();
    src.buffer = await lines.get(url)!;
    const level = c.createGain();
    level.gain.value = VOICE_LEVEL;
    src.connect(level).connect(c.destination);
    src.onended = () => void sayNext();
    speaking = src;
    src.start();
  } catch {
    lines.delete(url);   // a line that will not load is skipped, and tried again next time
    void sayNext();
  }
}
