/**
 * Continuous (G2) corners, everywhere.
 *
 * Chrome and Edge 139+ draw them natively with `corner-shape` (src/index.css). Safari, iOS and older browsers do
 * not, so there the corners are cut with an SVG `clip-path` built from each box's own size, with the curve
 * Figma uses for its "corner smoothing", at its maximum. A clip would also cut the border and a focus ring, so on a clipped box
 * the border is repainted as a stroke along the same curve (a background layer, so inputs work too) and the
 * focus ring becomes a thicker stroke. A clipped box loses its outer shadow (a clip would cut it, or leave square ghosts at the corners) and keeps its
 * border and inset edges.
 */

/** Figma's corner smoothing, 0 (a circular arc) to 1 (the most): 1 is the full iOS look, the curve starting at twice the radius. */
const SMOOTHING = 1;

const rad = (deg: number) => (deg * Math.PI) / 180;
const n = (value: number) => Math.round(value * 100) / 100;

/** The outline of a width x height box with continuous corners of the given radius, as an SVG path. */
export function squirclePath(width: number, height: number, radius: number, smoothing = SMOOTHING): string {
  const limit = Math.min(width, height) / 2;
  const r = Math.min(radius, limit);
  if (r <= 0) return `M0 0H${n(width)}V${n(height)}H0Z`;
  let s = smoothing;
  let p = (1 + s) * r;
  // The curve may not run past the middle of an edge: spend what is left on smoothing.
  s = Math.min(s, limit / r - 1);
  p = Math.min(p, limit);
  const arcMeasure = 90 * (1 - s);
  const arcLength = Math.sin(rad(arcMeasure / 2)) * r * Math.SQRT2;
  const alpha = (90 - arcMeasure) / 2;
  const p3p4 = r * Math.tan(rad(alpha / 2));
  const beta = 45 * s;
  const c = p3p4 * Math.cos(rad(beta));
  const d = c * Math.tan(rad(beta));
  const b = (p - arcLength - c - d) / 3;
  const a = 2 * b;
  const R = n(r);
  const arc = (dx: number, dy: number) => `a${R} ${R} 0 0 1 ${n(dx)} ${n(dy)}`;
  const bez = (...v: number[]) => `c${v.map(n).join(" ")}`;
  return [
    `M${n(width - p)} 0`,
    bez(a, 0, a + b, 0, a + b + c, d), arc(arcLength, arcLength), bez(d, c, d, b + c, d, a + b + c),
    `L${n(width)} ${n(height - p)}`,
    bez(0, a, 0, a + b, -d, a + b + c), arc(-arcLength, arcLength), bez(-c, d, -(b + c), d, -(a + b + c), d),
    `L${n(p)} ${n(height)}`,
    bez(-a, 0, -(a + b), 0, -(a + b + c), -d), arc(-arcLength, -arcLength), bez(-d, -c, -d, -(b + c), -d, -(a + b + c)),
    `L0 ${n(p)}`,
    bez(0, -a, 0, -(a + b), d, -(a + b + c)), arc(arcLength, -arcLength), bez(c, -d, b + c, -d, a + b + c, -d),
    "Z",
  ].join("");
}

const TARGETS = "button, input, select, textarea, .panel, .tile, .hero-panel, [role=dialog]";
const SKIP_INPUTS = /^(checkbox|radio|range|file|color|hidden)$/;
const MIN_RADIUS = 6;

interface Painted {
  width: number;
  height: number;
  radius: number;
  ring: string;
}

const done = new WeakMap<Element, Painted>();
const watched = new WeakSet<Element>();

function ringImage(width: number, height: number, radius: number, colour: string, stroke: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${n(width)}" height="${n(height)}" viewBox="0 0 ${n(width)} ${n(height)}"><path d="${squirclePath(width, height, radius)}" fill="none" stroke="${colour}" stroke-width="${stroke * 2}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const INLINE = ["clipPath", "borderRadius", "borderColor", "backgroundImage", "backgroundSize", "backgroundPosition", "backgroundRepeat", "backgroundOrigin", "outline", "boxShadow"] as const;

function release(el: HTMLElement) {
  for (const key of INLINE) el.style[key] = "";
  done.delete(el);
}

function paint(el: HTMLElement) {
  if (el instanceof HTMLInputElement && SKIP_INPUTS.test(el.type)) return;
  // Read the settled styles: a running colour transition would otherwise hand back a half-faded border colour.
  el.style.transition = "none";
  release(el);
  paintSettled(el);
  void el.offsetWidth;
  el.style.transition = "";
}

function paintSettled(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const radius = parseFloat(cs.borderTopLeftRadius);
  const { width, height } = el.getBoundingClientRect();
  // Plain radius stays for pills and circles, tiny corners and hidden boxes.
  if (!(radius >= MIN_RADIUS) || radius * 2 >= Math.min(width, height) - 1 || width < 24 || height < 24) return;

  const border = parseFloat(cs.borderTopWidth) || 0;
  const focused = el.matches(":focus-visible");
  // A solid inset ring (a sign's white inner edge) follows the squircle too, as one more stroke.
  const ringLayers = cs.boxShadow.split(/,(?![^(]*\))/).map(layer => /^\s*((?:rgba?|oklch|hsla?|lab|lch|color)\([^)]*\)) 0px 0px 0px ([\d.]+)px inset/.exec(layer)).filter(Boolean);
  const layers: string[] = ringLayers.map(m => ringImage(width, height, radius, m![1], parseFloat(m![2])));
  if (focused) layers.push(ringImage(width, height, radius, cs.outlineColor, 2));
  if (border > 0) layers.push(ringImage(width, height, radius, cs.borderTopColor, border));
  const images = cs.backgroundImage !== "none" ? [cs.backgroundImage] : [];
  const stacked = [...layers, ...images];
  const sizes = [...layers.map(() => "100% 100%"), ...(images.length ? [cs.backgroundSize] : [])];
  const positions = [...layers.map(() => "0 0"), ...(images.length ? [cs.backgroundPosition] : [])];
  const repeats = [...layers.map(() => "no-repeat"), ...(images.length ? [cs.backgroundRepeat] : [])];

  // A clip cuts anything outside the curve, so an outer shadow cannot survive it (kept, it would show as a square
  // ghost at each corner); a clipped box loses its outer shadow and keeps its border and inset edges.
  const layersOfShadow = cs.boxShadow.split(/,(?![^(]*\))/).map(layer => layer.trim()).filter(layer => layer && layer !== "none");
  const keptInset = layersOfShadow.filter(layer => layer.includes("inset") && !/ 0px 0px 0px [\d.]+px inset/.test(layer));
  if (layersOfShadow.length) el.style.boxShadow = keptInset.join(", ") || "none";
  el.style.clipPath = `path("${squirclePath(width, height, radius)}")`;
  el.style.borderRadius = "0";
  if (border > 0) el.style.borderColor = "transparent";
  if (focused) el.style.outline = "none";
  if (stacked.length) {
    el.style.backgroundImage = stacked.join(", ");
    el.style.backgroundSize = sizes.join(", ");
    el.style.backgroundPosition = positions.join(", ");
    el.style.backgroundRepeat = repeats.join(", ");
    // The strokes are drawn for the whole box, border included, so they start at its outer edge.
    el.style.backgroundOrigin = "border-box";
  }
  done.set(el, { width, height, radius, ring: cs.borderTopColor });
}

/** Install the clip-path corners on browsers without `corner-shape`. Safe to call once at start-up. */
export function installSquircles(root: Document = document): void {
  // ?squircle=js draws every corner with the clip-path path, ?squircle=off with plain radii: for checking each route.
  const mode = typeof location !== "undefined" ? new URLSearchParams(location.search).get("squircle") : null;
  if (mode) root.documentElement.dataset.squircle = mode;
  const native = mode !== "js" && typeof CSS !== "undefined" && CSS.supports("corner-shape", "squircle");
  if (mode === "off") return;
  if (native || typeof CSS === "undefined" || !CSS.supports("clip-path", 'path("M0 0")')) return;

  let queued = new Set<HTMLElement>();
  let frame = 0;
  const flush = () => {
    frame = 0;
    const batch = queued;
    queued = new Set();
    batch.forEach(paint);
  };
  const queue = (el: HTMLElement) => {
    queued.add(el);
    if (!frame) frame = requestAnimationFrame(flush);
  };

  const resizer = new ResizeObserver(entries => entries.forEach(entry => queue(entry.target as HTMLElement)));
  const watch = (el: Element) => {
    if (!(el instanceof HTMLElement) || watched.has(el)) return;
    watched.add(el);
    resizer.observe(el);
  };
  const scan = (node: ParentNode) => {
    if (node instanceof HTMLElement && node.matches(TARGETS)) watch(node);
    node.querySelectorAll?.(TARGETS).forEach(watch);
  };

  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "attributes") {
        const el = record.target as HTMLElement;
        if (el.matches?.(TARGETS) && watched.has(el)) queue(el);
      } else record.addedNodes.forEach(node => node.nodeType === 1 && scan(node as ParentNode));
    }
  }).observe(root.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "disabled", "aria-pressed", "aria-checked", "data-state"] });

  // Hover and focus change the border colour or draw the focus ring, so repaint on those too.
  for (const type of ["pointerover", "pointerout", "focusin", "focusout"])
    root.addEventListener(type, event => {
      const el = (event.target as Element | null)?.closest?.(TARGETS) as HTMLElement | null;
      if (el && watched.has(el)) queue(el);
    });
  // The theme switches colours without touching the box: repaint every clipped box.
  new MutationObserver(() => document.querySelectorAll<HTMLElement>(TARGETS).forEach(el => watched.has(el) && queue(el)))
    .observe(root.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });

  scan(root);
}
