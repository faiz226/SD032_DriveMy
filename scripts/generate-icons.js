/**
 * generate-icons.js — Generates all required PWA icons for DriveMy
 * using Puppeteer's headless Chrome canvas rendering.
 * Run: node scripts/generate-icons.js
 */
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');

const ICONS = [
  { name: 'pwa-64x64.png',            size: 64,  padding: 0 },
  { name: 'pwa-192x192.png',          size: 192, padding: 0 },
  { name: 'pwa-512x512.png',          size: 512, padding: 0 },
  { name: 'maskable-icon-512x512.png', size: 512, padding: 0.10 },
  { name: 'apple-touch-icon.png',     size: 180, padding: 0.05 },
  { name: 'favicon.png',              size: 32,  padding: 0 },
];

const SCREENSHOTS = [
  { name: 'screenshot-wide.png',   w: 1280, h: 720, label: 'DriveMy — JPJ Theory Prep' },
  { name: 'screenshot-narrow.png', w: 750,  h: 1334, label: 'DriveMy — Study on the go' },
];

function iconHtml(size, padding) {
  const pad = Math.round(size * padding);
  const innerSize = size - pad * 2;
  const fontSize = Math.round(innerSize * 0.35);
  const radius = Math.round(size * 0.18);
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${size}px; height:${size}px; overflow:hidden; background:#0f172a; }
  .icon {
    width:${size}px; height:${size}px;
    background:#0f172a;
    display:flex; align-items:center; justify-content:center;
  }
  .inner {
    width:${innerSize}px; height:${innerSize}px;
    background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
    border-radius:${radius}px;
    display:flex; align-items:center; justify-content:center;
    box-shadow: inset 0 0 ${Math.round(size*0.08)}px rgba(59,130,246,0.3);
    border: ${Math.max(1, Math.round(size*0.01))}px solid rgba(59,130,246,0.4);
  }
  .text {
    font-family: 'Arial Black', Arial, sans-serif;
    font-size:${fontSize}px;
    font-weight:900;
    color:#ffffff;
    letter-spacing:-0.03em;
    text-shadow: 0 0 ${Math.round(size*0.05)}px rgba(59,130,246,0.8);
  }
</style>
</head>
<body>
  <div class="icon"><div class="inner"><span class="text">DM</span></div></div>
</body>
</html>`;
}

function screenshotHtml(w, h, label) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${w}px; height:${h}px; overflow:hidden; }
  body {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px;
    font-family: Arial, sans-serif;
  }
  .logo { font-size:${Math.round(h*0.08)}px; font-weight:900; color:#fff; letter-spacing:-0.02em; }
  .logo span { color:#3b82f6; }
  .tagline { font-size:${Math.round(h*0.025)}px; color:#94a3b8; text-align:center; max-width:${Math.round(w*0.7)}px; }
  .badge {
    background: rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3);
    border-radius:999px; padding:8px 20px;
    font-size:${Math.round(h*0.02)}px; color:#60a5fa; font-weight:600;
  }
  .dots { display:flex; gap:${Math.round(h*0.015)}px; margin-top:${Math.round(h*0.02)}px; }
  .dot { width:${Math.round(h*0.012)}px; height:${Math.round(h*0.012)}px; border-radius:50%; background:#3b82f6; opacity:0.6; }
  .dot:nth-child(2) { background:#10b981; }
  .dot:nth-child(3) { background:#f59e0b; }
</style>
</head>
<body>
  <div class="logo">Drive<span>My</span></div>
  <div class="tagline">${label}</div>
  <div class="badge">JPJ KPP1 Theory &amp; Practical Prep</div>
  <div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
</body>
</html>`;
}

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Generate icons
  for (const icon of ICONS) {
    await page.setViewport({ width: icon.size, height: icon.size, deviceScaleFactor: 1 });
    await page.setContent(iconHtml(icon.size, icon.padding), { waitUntil: 'load' });
    await page.screenshot({ path: path.join(PUBLIC, icon.name), type: 'png' });
    console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
  }

  // Generate screenshots
  for (const ss of SCREENSHOTS) {
    await page.setViewport({ width: ss.w, height: ss.h, deviceScaleFactor: 1 });
    await page.setContent(screenshotHtml(ss.w, ss.h, ss.label), { waitUntil: 'load' });
    await page.screenshot({ path: path.join(PUBLIC, ss.name), type: 'png' });
    console.log(`✓ Generated ${ss.name} (${ss.w}x${ss.h})`);
  }

  await browser.close();
  console.log('\nAll PWA assets generated successfully.');
}

run().catch(e => { console.error(e); process.exit(1); });
