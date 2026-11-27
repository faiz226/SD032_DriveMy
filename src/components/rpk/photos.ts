/**
 * Real photos for the part pictures. Until a photo is added here (and the file put in public/rpk/), a part shows
 * its drawing. A photo carries its own hotspot positions, as PERCENTAGES of the photo (x across, y down), so the
 * numbers line up at any size. To add one: save the file as public/rpk/<name>.jpg, then add
 *   "rpk-engine": { src: "/rpk/axia-engine-bay.jpg", spots: [[x, y], ...] }  // one [x%, y%] per step, in step order
 * Only the engine bay has a photo so far (the owner's red Perodua Axia); the other parts keep their drawings. A photo that fails to load falls back to the drawing.
 */
export interface PartPhoto {
  src: string;
  /** Optional larger sizes, e.g. "/a-1200.webp 1200w, /a-2000.webp 2000w". */
  srcSet?: string;
  /** One [x %, y %] per step, in step order. */
  spots: [number, number][];
}

export const PART_PHOTOS: Record<string, PartPhoto> = {
  // Steps in order: oil dipstick, brake fluid, power steering (electric: the steering unit), gear oil (sealed CVT: the
  // gearbox housing), water (radiator cap), belts, fan, connections (battery terminals).
  "rpk-engine": {
    src: "/rpk/axia-engine-bay-1200.webp",
    srcSet: "/rpk/axia-engine-bay-1200.webp 1200w, /rpk/axia-engine-bay-2000.webp 2000w",
    spots: [[29, 28], [30, 20], [18, 29], [28, 48], [61, 47], [39, 42], [47, 59], [72, 24]],
  },
};
