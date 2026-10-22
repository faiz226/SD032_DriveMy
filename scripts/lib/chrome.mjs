// Chrome in its own throwaway profile, driven over the DevTools protocol with Node's built-in WebSocket.
// Shared by scripts/sim-perf.mjs (the performance run) and scripts/sim-demo.mjs (the demo capture).
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function findChrome() {
  const chrome = [
    process.env.CHROME,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    path.join(process.env.LOCALAPPDATA ?? "", "Google/Chrome/Application/chrome.exe"),
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome",
  ].find((p) => p && existsSync(p));
  if (!chrome) throw new Error("No Chrome or Edge found; set CHROME to its path.");
  return chrome;
}

async function json(url) {
  for (let i = 0; i < 100; i++) {
    try { return await (await fetch(url)).json(); } catch { await sleep(200); }
  }
  throw new Error(`no answer from ${url}`);
}

/** A minimal DevTools-protocol client: send(method, params), on(event, handler), evaluate(expression). */
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const waiting = new Map();
  const listeners = new Map();
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && waiting.has(msg.id)) {
      const { resolve, reject } = waiting.get(msg.id);
      waiting.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method) (listeners.get(msg.method) ?? []).forEach((f) => f(msg.params));
  });
  return new Promise((ready) => ws.addEventListener("open", () => {
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const n = ++id;
      waiting.set(n, { resolve, reject });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
    ready({
      send,
      on: (method, f) => listeners.set(method, [...(listeners.get(method) ?? []), f]),
      evaluate: async (expression) =>
        (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value,
      close: () => ws.close(),
    });
  }));
}

/** Launch Chrome (headless with the real GPU unless `headed`) and connect to its first page. */
export async function launchChrome({ headed = false, port = 9333, width = 900, height = 520 } = {}) {
  const chrome = findChrome();
  // One profile folder per port, emptied at launch: every run starts cold, and only the last run's is
  // left on disk. A Chrome killed a moment ago holds it for about a second (rmSync's own retries skip EPERM).
  const profile = path.join(tmpdir(), `sim-chrome-${port}`);
  for (let i = 0; ; i++) {
    try { rmSync(profile, { recursive: true, force: true }); break; }
    catch (e) { if (i === 20) throw e; await sleep(500); }
  }
  const browser = spawn(chrome, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    `--window-size=${width},${height}`,
    ...(headed ? [] : ["--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"]),
    "about:blank",
  ], { stdio: "ignore" });
  await json(`http://127.0.0.1:${port}/json/version`);
  const page = (await json(`http://127.0.0.1:${port}/json/list`)).find((t) => t.type === "page");
  const cdp = await connect(page.webSocketDebuggerUrl);
  return { cdp, chrome, close: () => { cdp.close(); browser.kill(); } };
}
