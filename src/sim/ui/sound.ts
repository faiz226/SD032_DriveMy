// A short falling tone for a fault, synthesised: nothing to download. Browsers only allow audio after a
// gesture, so the start button unlocks it.
let ctx: AudioContext | null = null;

export function unlockSound() {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
  } catch {
    ctx = null;   // no Web Audio: faults stay silent
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
