/**
 * Real photos for the part pictures. Until a photo is added here (and the file put in public/rpk/), a part shows
 * its drawing. A photo carries its own hotspot positions, as PERCENTAGES of the photo (x across, y down), so the
 * numbers line up at any size. To add one: save the file as public/rpk/<name>.jpg, then add
 *   "rpk-engine": { src: "/rpk/axia-engine-bay.jpg", spots: [[x, y], ...] }  // one [x%, y%] per step, in step order
 * Every part has the owner's Perodua Axia photo; a part's drawing is the fallback. A photo that fails to load falls back to the drawing.
 */
export interface PartPhoto {
  src: string;
  /** Optional larger sizes, e.g. "/a-1200.webp 1200w, /a-2000.webp 2000w". */
  srcSet?: string;
  /** One [x %, y %] per step, in step order; null where the photo shows nothing for that step (it stays unmarked). */
  spots: ([number, number] | null)[];
}

export const PART_PHOTOS: Record<string, PartPhoto> = {
  // Steps in order: oil dipstick, brake fluid, power steering (electric: the steering unit), gear oil (sealed CVT: the
  // gearbox housing), water (radiator cap), belts, fan, connections (battery terminals).
  "rpk-engine": {
    src: "/rpk/axia-engine-bay-1200.webp",
    srcSet: "/rpk/axia-engine-bay-1200.webp 1200w, /rpk/axia-engine-bay-2000.webp 2000w",
    spots: [[29, 29], [33, 17], [18, 29], [28, 48], [61, 47], [39, 42], [47, 59], [72, 24]],
  },
  // Steps: tyre, tread (rear tyre), lights, wipers, body (side mirror), windscreen, under the car (not visible: unmarked).
  "rpk-exterior": {
    src: "/rpk/rpk-exterior-1200.webp",
    srcSet: "/rpk/rpk-exterior-1200.webp 1200w, /rpk/rpk-exterior-2000.webp 2000w",
    spots: [[24, 82], [80, 82], [14, 65], [25, 44], [37, 70], [34, 39], null],
  },
  // Steps: triangle, first-aid kit, torch, extinguisher, jack, cables and rope, toolkit, water (not in the picture: unmarked).
  "rpk-boot": {
    src: "/rpk/rpk-boot-1200.webp",
    srcSet: "/rpk/rpk-boot-1200.webp 1200w, /rpk/rpk-boot-2000.webp 2000w",
    spots: [[27, 44], [25, 59], [35, 61], [40, 47], [53, 50], [70, 47], [72, 64], null],
  },
  // Steps: handbrake (not visible: unmarked), pedals, seat slide lever, wheel, gear lever, head restraint.
  "rsm-position": {
    src: "/rpk/rpk-position-1200.webp",
    srcSet: "/rpk/rpk-position-1200.webp 1200w, /rpk/rpk-position-2000.webp 2000w",
    spots: [null, [83, 72], [33, 84], [62, 37], [56, 52], [18, 15]],
  },
  // Steps: rear-view mirror, side mirror, pull the belt (not visible: unmarked), belt buckle.
  "rsm-mirrors": {
    src: "/rpk/rpk-mirrors-1200.webp",
    srcSet: "/rpk/rpk-mirrors-1200.webp 1200w, /rpk/rpk-mirrors-2000.webp 2000w",
    spots: [[50, 14], [92, 33], null, [59, 94]],
  },
  // Steps: instrument panel, gear lever, accelerator pedal, hazard and A/C switches.
  "rsm-controls": {
    src: "/rpk/rpk-controls-1200.webp",
    srcSet: "/rpk/rpk-controls-1200.webp 1200w, /rpk/rpk-controls-2000.webp 2000w",
    spots: [[75, 11], [37, 50], [81, 67], [38, 31]],
  },
};
