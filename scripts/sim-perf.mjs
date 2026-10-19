#!/usr/bin/env node
/**
 * The simulator's performance run (WP5; results in docs/v2-plan/RESULTS.md).
 *
 * Opens the simulator in its own Chrome profile with a phone's conditions (Android user agent, 851 x 393,
 * touch, 4x CPU throttling, 9 Mbps down / 3 Mbps up / 80 ms, cold cache), lets ?autopilot=1 drive the
 * assessment, and reports:
 *   - time to first drive: navigation start to the car's first driven physics step ('sim:drive');
 *   - bytes transferred before it;
 *   - frame times (p50, p95) over the run, from the in-app probe (?perf=1);
 *   - memory, where Chrome reports it.
 * Every figure is "emulated": a desktop's GPU stands in for the phone's.
 *
 * Needs a performance build served locally:
 *   VITE_SIM_PERF=1 npx vite build --outDir dist-perf
 *   npx vite preview --outDir dist-perf --port 4180 --strictPort
 * then:
 *   node scripts/sim-perf.mjs [--minutes 10] [--url http://localhost:4180] [--headed] [--desktop] [--profile]
 *                             [--extra '&mirrors=0'] [--out file.json]
 */
import { writeFileSync } from "node:fs";
import { launchChrome, sleep } from "./lib/chrome.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const MINUTES = Number(arg("minutes", "10"));
const BASE = arg("url", "http://localhost:4180");
// --desktop: the Medium tier's own conditions (a laptop at 1280 x 720, no CPU throttling), for reference
const DESKTOP = process.argv.includes("--desktop");
const OUT = arg("out", null);
// --extra '&mirrors=0' and the like: A/B switches the performance build understands
const PAGE = `${BASE}/dev/sim/assessment?autopilot=1&perf=1${arg("extra", "")}`;
const REDMI_9T_UA =
  "Mozilla/5.0 (Linux; Android 11; M2010J19SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";

const { cdp, chrome, close } = await launchChrome({ headed: process.argv.includes("--headed") });
const evaluate = (_cdp, expression) => cdp.evaluate(expression);

try {
  let bytes = 0;
  let requests = 0;
  let counting = true;
  cdp.on("Network.loadingFinished", (p) => { if (counting) { bytes += p.encodedDataLength; requests++; } });
  const problems = [];
  cdp.on("Runtime.exceptionThrown", (p) => problems.push(`exception: ${p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text}`.slice(0, 400)));
  cdp.on("Runtime.consoleAPICalled", (p) => { if (p.type === "error" || p.type === "warning") problems.push(`${p.type}: ${p.args.map((a) => a.value ?? a.description).join(" ")}`.slice(0, 400)); });

  await cdp.send("Network.enable");
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  // a fresh profile is the cold cache; the HTTP cache stays on, as on a real first visit
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false, latency: 80, downloadThroughput: (9e6 / 8), uploadThroughput: (3e6 / 8), connectionType: "cellular4g",
  });
  if (DESKTOP) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  } else {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 851, height: 393, deviceScaleFactor: 2.75, mobile: true });
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await cdp.send("Emulation.setUserAgentOverride", { userAgent: REDMI_9T_UA, platform: "Android" });
  }
  await cdp.send("Performance.enable");

  await cdp.send("Page.navigate", { url: PAGE });
  let drive = null;
  for (let i = 0; i < Number(arg("wait", "600")) && !drive; i++) {
    await sleep(500);
    drive = await evaluate(cdp, "performance.getEntriesByName('sim:drive')[0]?.startTime ?? null").catch(() => null);
  }
  if (drive === null) {
    const state = await evaluate(cdp, `({ url: location.href, text: document.body.innerText.slice(0, 400), marks: performance.getEntriesByType('mark').map((m) => m.name) })`).catch((e) => String(e));
    console.error(JSON.stringify({ state, problems: problems.slice(0, 15), bytes, requests }, null, 2));
    throw new Error("the car never drove: is the performance build served at --url?");
  }
  counting = false;

  const marks = await evaluate(cdp, `Object.fromEntries(['sim:ready','sim:start','sim:drive'].map((n) => [n, Math.round(performance.getEntriesByName(n)[0]?.startTime ?? -1)]))`);
  const gpu = await evaluate(cdp, `(() => { const g = document.createElement('canvas').getContext('webgl2'); const x = g && g.getExtension('WEBGL_debug_renderer_info'); return x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'unknown'; })()`);
  const tier = await evaluate(cdp, `navigator.userAgent.includes('Android') ? 'low (Android user agent)' : 'medium'`);
  console.log(`first drive ${(drive / 1000).toFixed(1)} s, ${(bytes / 1e6).toFixed(2)} MB in ${requests} requests; GPU ${gpu}`);

  if (process.argv.includes("--profile")) {
    // where the main thread's time goes, 15 s into the drive, by function self time
    await sleep(15_000);
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.setSamplingInterval", { interval: 500 });
    await cdp.send("Profiler.start");
    await sleep(10_000);
    const { profile } = await cdp.send("Profiler.stop");
    const self = new Map();
    const dt = new Map();
    profile.samples.forEach((id, i) => dt.set(id, (dt.get(id) ?? 0) + (profile.timeDeltas[i] ?? 0)));
    let total = 0;
    for (const n of profile.nodes) {
      const t = (dt.get(n.id) ?? 0) / 1000;
      total += t;
      const f = n.callFrame;
      const key = `${f.functionName || "(anonymous)"} ${f.url.split("/").pop()}:${f.lineNumber}`;
      self.set(key, (self.get(key) ?? 0) + t);
    }
    console.log(`profile: ${total.toFixed(0)} ms sampled`);
    for (const [k, t] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(`${(100 * t / total).toFixed(1).padStart(5)}%  ${t.toFixed(0).padStart(6)} ms  ${k}`);
  }
  await evaluate(cdp, "window.__simPerf.reset()");
  for (let m = 1; m <= MINUTES; m++) {
    await sleep(60_000);
    const s = await evaluate(cdp, "window.__simPerf.stats()");
    console.log(`minute ${m}: ${s.frames} frames, p50 ${s.p50.toFixed(1)} ms, p95 ${s.p95.toFixed(1)} ms, ${s.calls} draw calls, ${s.triangles} triangles`);
  }
  const frames = await evaluate(cdp, "window.__simPerf.stats()");
  const metrics = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));

  const result = {
    when: new Date().toISOString(),
    conditions: DESKTOP
      ? { emulated: true, viewport: "1280x720 @1", cpuThrottle: 1, network: "9/3 Mbps, 80 ms", cache: "cold (fresh profile)", userAgent: "desktop Chrome", tier: "medium", gpu, chrome }
      : { emulated: true, viewport: "851x393 @2.75", cpuThrottle: 4, network: "9/3 Mbps, 80 ms", cache: "cold (fresh profile)", userAgent: "Android (Redmi 9T)", tier, gpu, chrome },
    firstDriveS: +(drive / 1000).toFixed(2),
    marksMs: marks,
    bytesBeforeDrive: bytes,
    requestsBeforeDrive: requests,
    minutes: MINUTES,
    frames: {
      count: frames.frames,
      p50Ms: +frames.p50.toFixed(2), p95Ms: +frames.p95.toFixed(2), p99Ms: +frames.p99.toFixed(2),
      fpsAtP50: +(1000 / frames.p50).toFixed(1), fpsAtP95: +(1000 / frames.p95).toFixed(1),
    },
    memory: { jsHeapUsedMB: +(metrics.JSHeapUsedSize / 1e6).toFixed(1), jsHeapTotalMB: +(metrics.JSHeapTotalSize / 1e6).toFixed(1) },
  };
  console.log(JSON.stringify(result, null, 2));
  if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 2));
} finally {
  close();
}
