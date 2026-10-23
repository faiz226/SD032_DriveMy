// The simulator's downloaded files, by quality tier, and an early start on fetching them. Kept free of three.js
// so the app shell can import it: the route starts these downloads the moment it opens, alongside the 3D
// engine's code, instead of after that code has run.
export type AssetTier = 'low' | 'medium';

export const carFiles = (tier: AssetTier) => ({
  body: `/sim/cars/swift-2022/${tier}/body.glb`,
  wheel: `/sim/cars/swift-2022/${tier}/wheel.glb`,
  steering: `/sim/cars/swift-2022/${tier}/steering.glb`,
});

export const textureFiles = (tier: AssetTier) => {
  const px = tier === 'low' ? 512 : 1024;
  return [`/sim/textures/concrete-${px}.webp`, `/sim/textures/grass-${px}.webp`, `/sim/textures/asphalt-${px}.webp`];
};

const started = new Set<string>();

/** Preload hints for one tier's files; each matches how its loader asks for it, so the browser reuses it. */
export function preloadSimAssets(tier: AssetTier) {
  if (typeof document === 'undefined') return;
  const hint = (href: string, as: 'fetch' | 'image') => {
    if (started.has(href)) return;
    started.add(href);
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = href;
    link.crossOrigin = 'anonymous';   // GLTFLoader fetches, and three's image loader asks, in cors mode: else each file loads twice
    document.head.appendChild(link);
  };
  Object.values(carFiles(tier)).forEach((href) => hint(href, 'fetch'));
  textureFiles(tier).forEach((href) => hint(href, 'image'));
}
