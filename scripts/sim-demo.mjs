#!/usr/bin/env node
/**
 * The demo capture (WP6), saved in docs/v2-plan/demo/:
 *   - a first-person screenshot at each station, 3 s after it arms, from the autopilot's clean run;
 *   - the verdict of the clean run, and of the fault run (top and scrolled);
 *   - the yard from above, mid-run;
 *   - clean-run.mp4: the clean run's first 80 s (hill start and side parking), from the page's screencast.
 * The autopilot drives through the same inputs as the keyboard, at a laptop's 1280 x 720 (Medium tier).
 *
 * Needs the performance build served (see scripts/sim-perf.mjs), and ffmpeg on the PATH for the video:
 *   node scripts/sim-demo.mjs [--url http://localhost:4180]
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { launchChrome, sleep } from "./lib/chrome.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const BASE = arg("url", "http://localhost:4180");
const OUT = path.join("docs", "v2-plan", "demo");
const VIDEO_S = 80;
mkdirSync(OUT, { recursive: true });

const { cdp, close } = await launchChrome({ width: 1300, height: 760 });
const shot = async (name) => {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(OUT, name), Buffer.from(data, "base64"));
  console.log("saved", name);
};
const run = () => cdp.evaluate(`(() => {
  const r = window.__simRun?.getState();
  return r && { elapsed: r.elapsed, verdict: !!r.state.verdict, stations: r.state.stations.map((s) => [s.id, s.status]) };
})()`);
async function until(test, timeoutS) {
  for (let i = 0; i < timeoutS * 4; i++) {
    const r = await run().catch(() => null);
    if (r && test(r)) return r;
    await sleep(250);
  }
  throw new Error("timed out waiting on the run");
}

/** Frames from the page's screencast, timed by their own timestamps, into an H.264 file. */
function encode(frames, file) {
  const dir = mkdtempSync(path.join(tmpdir(), "sim-demo-"));
  const lines = [];
  frames.forEach((f, i) => {
    const name = `f${String(i).padStart(5, "0")}.jpg`;
    writeFileSync(path.join(dir, name), Buffer.from(f.data, "base64"));
    const next = frames[i + 1]?.metadata.timestamp ?? f.metadata.timestamp + 1 / 30;
    lines.push(`file '${name}'`, `duration ${Math.max(1 / 60, next - f.metadata.timestamp).toFixed(4)}`);
  });
  writeFileSync(path.join(dir, "list.txt"), lines.join("\n"));
  // 30 fps (headless Chrome sends frames faster than a screen shows them) at CRF 28: about 5 MB for 80 s.
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"),
    "-vf", "fps=30,scale=1280:-2", "-pix_fmt", "yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "28",
    "-movflags", "+faststart", path.resolve(file)], { cwd: dir });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr}`);
  rmSync(dir, { recursive: true, force: true });
  console.log("saved", path.basename(file), `(${frames.length} frames)`);
}

try {
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });

  // 1. the clean run
  await cdp.send("Page.navigate", { url: `${BASE}/dev/sim/assessment?autopilot=1` });
  await until((r) => r.elapsed > 0, 180);
  const frames = [];
  cdp.on("Page.screencastFrame", (f) => {
    frames.push(f);
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 85, maxWidth: 1280, maxHeight: 720 });
  let recording = true;
  const armedAt = new Map();
  const shotDone = new Set();
  for (;;) {
    const r = await run();
    if (recording && r.elapsed > VIDEO_S) {
      await cdp.send("Page.stopScreencast");
      recording = false;
    }
    for (const [i, [id, status]] of r.stations.entries()) {
      if (status === "armed" && !armedAt.has(id)) armedAt.set(id, r.elapsed);
      if (armedAt.has(id) && !shotDone.has(id) && r.elapsed - armedAt.get(id) >= 3) {
        shotDone.add(id);
        await shot(`station-${i + 1}-${id}.png`);
      }
    }
    if (r.verdict) break;
    await sleep(250);
  }
  await sleep(1200);
  await shot("verdict-clean.png");
  // Encoded only now: ffmpeg blocks this loop, and the run would carry on through stations unseen.
  encode(frames, path.join(OUT, "clean-run.mp4"));

  // 2. the yard from above, once the autopilot has started round again
  await until((r) => !r.verdict && r.elapsed > 2, 30);
  await cdp.evaluate("window.__simDriver.getState().set({ topDown: true })");
  await sleep(1500);
  await shot("top-down.png");

  // 3. the fault run's verdict
  await cdp.send("Page.navigate", { url: `${BASE}/dev/sim/assessment?autopilot=faults` });
  await until((r) => r.elapsed > 0, 180);
  await until((r) => r.verdict, 1200);
  await sleep(1200);
  await shot("verdict-faults.png");
  await cdp.evaluate(`document.querySelector('[role=dialog]').scrollTop = 1e6`);
  await sleep(500);
  await shot("verdict-faults-2.png");
} finally {
  close();
}
