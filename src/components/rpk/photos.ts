/**
 * Real photos for the part pictures. Until a photo is added here (and the file put in public/rpk/), a part shows
 * its drawing. A photo carries its own hotspot positions, as PERCENTAGES of the photo (x across, y down), so the
 * numbers line up at any size. To add one: save the file as public/rpk/<name>.jpg, then add
 *   "rpk-engine": { src: "/rpk/axia-engine-bay.jpg", spots: [[x, y], ...] }  // one [x%, y%] per step, in step order
 * No photo is registered yet: none is on disk. A photo that fails to load falls back to the drawing.
 */
export interface PartPhoto {
  src: string;
  /** One [x %, y %] per step, in step order. */
  spots: [number, number][];
}

export const PART_PHOTOS: Record<string, PartPhoto> = {};
