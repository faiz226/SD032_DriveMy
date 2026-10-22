// The simulator's sound. Browsers only allow audio after a gesture, so the start button unlocks it.
// A fault is a short falling tone, synthesised. The engine is the owner's recording (SFX/), cut in two:
// public/sim/sfx/engine-start.mp3, the starter and the catch, played once; then engine-idle.wav, a 3 s
// seamless loop of the settled idle, whose pitch and level follow the road speed and the throttle.
// The owner's other recordings (SFX/, 22 Oct), cut and levelled into the same folder: the horn; a horn far off,
// the cars that answer ours in free drive; a chime for each surprise; and the yard's air, wind and birds, in
// 28 s seamless loops under the engine, muffled as heard from inside the car.
// The instructor's voice reads the screen's own strings (scripts/gen-voice.mjs), one line at a time.
import { create } from 'zustand';
import type { Language } from '@/lib/constants';

let ctx: AudioContext | null = null;

export function unlockSound() {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
    loadClips(ctx);
  } catch {
    ctx = null;   // no Web Audio: the simulator stays silent
  }
}

// each clip's level, from its measured loudness: the horn a little over the instructor, the rest under the engine
const CLIPS = {
  horn: ['/sim/sfx/horn.mp3', 0.4],
  farHorn: ['/sim/sfx/horn-far.mp3', 0.45],
  chime: ['/sim/sfx/chime.mp3', 0.3],
} as const;
type Clip = keyof typeof CLIPS;
const clips: Partial<Record<Clip, AudioBuffer>> = {};
let clipsAsked = false;

/** Fetch the short clips once sound is allowed, so the first horn sounds at once; one that will not load stays silent. */
function loadClips(c: AudioContext) {
  if (clipsAsked) return;
  clipsAsked = true;
  for (const name of Object.keys(CLIPS) as Clip[]) {
    decode(c, CLIPS[name][0]).then((b) => { clips[name] = b; }).catch(() => { clipsAsked = false; });
  }
}

function play(name: Clip, delayS = 0) {
  const buffer = clips[name];
  if (!ctx || ctx.state !== 'running' || !buffer) return;
  const src = ctx.createBufferSource();
  const level = ctx.createGain();
  src.buffer = buffer;
  level.gain.value = CLIPS[name][1];
  src.connect(level).connect(ctx.destination);
  src.start(ctx.currentTime + delayS);
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

/** The horn: one honk of the owner's recording, half a second, for a tap. */
export const hornSound = () => play('horn');

/** Cars further off honking back, a moment after ours. */
export const farHornSound = () => play('farHorn', 0.5);

/** A surprise found. */
export const chimeSound = () => play('chime');

/** A cat's meow: a rising and falling cry. */
export function meowSound() {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const cry = ctx.createOscillator();
  const mouth = ctx.createBiquadFilter();
  const level = ctx.createGain();
  cry.type = 'sawtooth';
  cry.frequency.setValueAtTime(520, t);
  cry.frequency.exponentialRampToValueAtTime(880, t + 0.22);
  cry.frequency.exponentialRampToValueAtTime(560, t + 0.6);
  mouth.type = 'bandpass';
  mouth.frequency.setValueAtTime(900, t);
  mouth.frequency.linearRampToValueAtTime(1500, t + 0.25);
  mouth.frequency.linearRampToValueAtTime(800, t + 0.6);
  mouth.Q.value = 4;
  level.gain.setValueAtTime(0.0001, t);
  level.gain.exponentialRampToValueAtTime(0.12, t + 0.06);
  level.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
  cry.connect(mouth).connect(level).connect(ctx.destination);
  cry.start(t);
  cry.stop(t + 0.7);
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
interface Engine { src: AudioBufferSourceNode; level: GainNode; once?: AudioBufferSourceNode }
let engine: Engine | null = null;

const decode = (c: AudioContext, url: string) =>
  fetch(url).then((r) => r.arrayBuffer()).then((b) => c.decodeAudioData(b));

/**
 * The engine starts: the starter and the catch, then the idle. Every start and respawn starts it afresh (the owner,
 * 21 Oct): one already running is switched off first. Resolves once it has caught, so the car may move then.
 */
export function startEngine(): Promise<void> {
  const c = ctx;
  if (!c) return Promise.resolve();
  startBeds(c);
  if (engine) {
    const old = engine;
    engine = null;
    old.level.gain.setTargetAtTime(0, c.currentTime, 0.05);
    try { old.src.stop(c.currentTime + 0.3); } catch { /* never started */ }
    try { old.once?.stop(); } catch { /* already ended */ }
  }
  engineFiles ??= Promise.all([decode(c, ENGINE_START), decode(c, ENGINE_IDLE)]);
  const src = c.createBufferSource();
  const level = c.createGain();
  src.loop = true;
  level.gain.value = 0;
  src.connect(level).connect(c.destination);
  const claimed: Engine = { src, level };
  engine = claimed;   // claimed now: a newer start, or leaving, replaces it
  return engineFiles.then(([start, idle]) => {
    if (engine?.src !== src) return;   // stopped while the files loaded
    const t = c.currentTime + 0.05;
    const once = c.createBufferSource();
    const onceLevel = c.createGain();
    once.buffer = start;
    onceLevel.gain.value = ENGINE_LEVEL;
    once.connect(onceLevel).connect(c.destination);
    once.start(t);
    claimed.once = once;
    src.buffer = idle;
    src.start(t + HANDOVER_S);
    level.gain.setValueAtTime(0, t + HANDOVER_S);
    level.gain.linearRampToValueAtTime(ENGINE_LEVEL, t + HANDOVER_S + 0.3);
    // caught: the car may move (no sound allowed yet, as before a first tap: no wait)
    if (c.state !== 'running') return;
    return new Promise<void>((done) => { window.setTimeout(done, HANDOVER_S * 1000); });
  }).catch(() => { /* no engine files: the drive carries on without them */ });
}

// the yard's air: each loop's level, and the low-pass that muffles it as heard from inside the car
const BEDS = [['/sim/sfx/wind.mp3', 0.35], ['/sim/sfx/birds.mp3', 0.25]] as const;
const CABIN_HZ = 1400;
let beds: AudioBufferSourceNode[] | null = null;

/** The wind and the birds, from the first start until the simulator is left; a restart leaves them playing. */
function startBeds(c: AudioContext) {
  if (beds) return;
  const cabin = c.createBiquadFilter();
  cabin.type = 'lowpass';
  cabin.frequency.value = CABIN_HZ;
  cabin.connect(c.destination);
  const playing: AudioBufferSourceNode[] = [];
  beds = playing;
  for (const [url, gain] of BEDS) {
    const src = c.createBufferSource();
    const level = c.createGain();
    src.loop = true;
    level.gain.value = 0;
    src.connect(level).connect(cabin);
    playing.push(src);
    decode(c, url).then((b) => {
      if (beds !== playing) return;   // left while it loaded
      src.buffer = b;
      src.start();
      level.gain.setTargetAtTime(gain, c.currentTime, 1);   // in over a few seconds
    }).catch(() => { /* no loop: the yard is quiet */ });
  }
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

/** Leaving the simulator: the engine and the yard's air stop, and the instructor stops mid-line. */
export function stopEngine() {
  for (const line of queue.splice(0)) line.done();
  try { speaking?.stop(); } catch { /* already ended */ }
  for (const src of beds ?? []) { try { src.stop(); } catch { /* still loading */ } }
  beds = null;
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
const queue: { url: string; done: () => void }[] = [];
let speaking: AudioBufferSourceNode | null = null;
let busy = false;

/**
 * The instructor says a line, public/sim/voice/<lang>/<key>.mp3, after the one already speaking. Resolves when it
 * has been said, or at once when there is nothing to say it with (the voice off, or no sound allowed yet).
 */
export function say(key: string, lang: Language): Promise<void> {
  return new Promise((done) => {
    if (!ctx || ctx.state !== 'running' || useVoicePref.getState().pref === 'off') { done(); return; }
    queue.push({ url: `/sim/voice/${lang}/${key}.mp3`, done });
    while (queue.length > 2) queue.shift()!.done();   // a backlog of stale lines helps nobody
    if (!busy) void sayNext();
  });
}

async function sayNext() {
  const c = ctx;
  const line = queue.shift();
  speaking = null;
  if (!c || !line) { busy = false; return; }
  busy = true;
  try {
    if (!lines.has(line.url)) lines.set(line.url, decode(c, line.url));
    const src = c.createBufferSource();
    // a line that does not arrive in 8 s is skipped (and tried again next time), never waited for
    src.buffer = await Promise.race([lines.get(line.url)!, new Promise<never>((_, no) => { window.setTimeout(() => no(new Error('slow')), 8000); })]);
    const level = c.createGain();
    level.gain.value = VOICE_LEVEL;
    src.connect(level).connect(c.destination);
    // said: when it ends, or by its own length (a stalled audio clock never ends a line), held while paused
    let said = false;
    let timer = 0;
    const finish = () => {
      if (said) return;
      said = true;
      window.clearTimeout(timer);
      line.done();
      void sayNext();
    };
    const watch = (s: number) => {
      timer = window.setTimeout(() => (c.state === 'running' ? finish() : watch(1)), s * 1000);
    };
    src.onended = finish;
    speaking = src;
    src.start();
    watch(src.buffer.duration + 0.6);
  } catch {
    lines.delete(line.url);   // a line that will not load is skipped, and tried again next time
    line.done();
    void sayNext();
  }
}
