// The flat side view of a Perodua Axia (the car at the driving schools), facing right. Traced from the owner's side-view
// photo by scripts/trace-axia-side.py (body outline by colour, then simplified); the glasshouse and wheel positions were
// measured on the same photo. Vector only: the photo is not shipped.
export const AXIA_SIDE = {
  viewBox: "0 0 120 53.7",
  width: 120,
  height: 53.7,
  body: "M0.0 32.7 L0.8 42.4 L5.6 41.8 L6.7 50.3 L4.9 52.9 L104.3 53.6 L113.0 52.7 L108.1 49.6 L109.1 45.7 L115.9 46.7 L119.8 44.4 L118.5 32.5 L114.6 25.0 L110.5 25.6 L109.7 23.2 L111.0 23.0 L89.0 16.7 L69.6 5.4 L54.7 2.6 L27.3 2.9 L23.5 0.0 L25.1 3.1 L9.1 5.1 L10.0 8.7 L4.7 15.8 L5.9 19.6 L3.8 20.4 Z",
  windows: ["M18.7 10.0 L21.5 6.8 L26.9 6.2 L27.2 15.7 L23.7 14.4 L18.9 11.9 Z", "M27.8 5.7 L45.5 5.4 L45.8 17.2 L27.8 16.1 Z", "M50.8 6.0 L68.9 9.0 L80.7 16.6 L78.7 20.4 L51.8 18.0 Z"],
  wheels: [[15.1, 44.2, 9.8], [99.3, 44.5, 9.8]],
} as const;
