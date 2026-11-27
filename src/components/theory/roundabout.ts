export type RoundaboutExit = "left-9" | "straight-12" | "right-3" | "uturn-6";
export type ApproachLane = "left" | "right";
export type SignalAction = "left-entry" | "none-entry-left-exit" | "right-entry-left-exit";

export interface ExitSpec {
  id: RoundaboutExit;
  /** The 1st, 2nd, 3rd or 4th exit counted from the entry. */
  order: number;
  clockEn: string;
  clockMs: string;
  titleEn: string;
  titleMs: string;
  correctLane: ApproachLane;
  correctSignal: SignalAction;
  ruleEn: string;
  ruleMs: string;
}

// KPP Automatic, viewer pages 257–259.
export const EXIT_SPECS: ExitSpec[] = [
  {
    id: "left-9",
    order: 1,
    clockEn: "9 o'clock (First exit left)",
    clockMs: "Pukul 9 (Susur keluar pertama kiri)",
    titleEn: "Turn left at first exit",
    titleMs: "Belok kiri di susur pertama",
    correctLane: "left",
    correctSignal: "left-entry",
    ruleEn:
      "Approach in the left lane, signal left before entering, stay in the outer (left) circulatory lane, and keep the left signal on until exiting.",
    ruleMs:
      "Masuk melalui lorong kiri, beri isyarat kiri sebelum memasuki bulatan, kekal di lorong luar (kiri), dan kekalkan isyarat kiri sehingga keluar.",
  },
  {
    id: "straight-12",
    order: 2,
    clockEn: "12 o'clock (Second exit straight)",
    clockMs: "Pukul 12 (Susur kedua terus)",
    titleEn: "Go straight with the left lane clear",
    titleMs: "Terus ke hadapan apabila lorong kiri lapang",
    correctLane: "left",
    correctSignal: "none-entry-left-exit",
    ruleEn:
      "When the left lane is clear, approach in that lane, stay in it and signal left after passing the first exit.",
    ruleMs:
      "Jika lorong kiri lapang, masuk dan kekal di lorong itu. Beri isyarat kiri selepas melepasi susur keluar pertama.",
  },
  {
    id: "right-3",
    order: 3,
    clockEn: "3 o'clock (Third exit right)",
    clockMs: "Pukul 3 (Susur ketiga kanan)",
    titleEn: "Turn right at third exit",
    titleMs: "Belok kanan di susur ketiga",
    correctLane: "right",
    correctSignal: "right-entry-left-exit",
    ruleEn:
      "Approach in the right lane, signal right before entering and keep it on in the inner lane, then signal left after passing the 12 o'clock exit.",
    ruleMs:
      "Dekati di lorong kanan, beri isyarat kanan sebelum masuk dan kekalkan isyarat di lorong dalam, kemudian beri isyarat kiri selepas melepasi simpang pukul 12.",
  },
  {
    id: "uturn-6",
    order: 4,
    clockEn: "6 o'clock (Fourth exit U-turn)",
    clockMs: "Pukul 6 (Susur keempat pusingan U)",
    titleEn: "Full circle U-turn",
    titleMs: "Pusingan lengkap (Pusingan U)",
    correctLane: "right",
    correctSignal: "right-entry-left-exit",
    ruleEn:
      "Approach in the right lane, signal right before entering and keep it on in the inner lane around the island, then signal left after passing the 3 o'clock exit.",
    ruleMs:
      "Dekati di lorong kanan, beri isyarat kanan sebelum masuk dan kekalkan isyarat di lorong dalam mengelilingi pulau bulatan, kemudian beri isyarat kiri selepas melepasi simpang pukul 3.",
  },
];

// The roundabout is drawn in a 220 x 210 box. Traffic drives on the left and circulates clockwise.
export const CENTRE = { x: 110, y: 108 };
const ENTRY_X: Record<ApproachLane, number> = { left: 86, right: 102 };
const RING_RADIUS: Record<ApproachLane, number> = { left: 48, right: 31 };
const START_Y = 190;
const EXITS: Record<RoundaboutExit, { axis: "x" | "y"; at: number; dir: -1 | 1; end: [number, number] }> = {
  "left-9": { axis: "y", at: 132, dir: -1, end: [24, 132] },
  "straight-12": { axis: "x", at: 86, dir: -1, end: [86, 24] },
  "right-3": { axis: "y", at: 100, dir: 1, end: [196, 100] },
  "uturn-6": { axis: "x", at: 118, dir: 1, end: [118, 190] },
};

const num = (value: number) => Number(value.toFixed(2));
const angle = (x: number, y: number) => Math.atan2(y - CENTRE.y, x - CENTRE.x);

/** The road a car takes from the entry to an exit, in the outer (left) or the inner (right) ring. */
export function routePath(exit: RoundaboutExit, lane: ApproachLane): string {
  const r = RING_RADIUS[lane];
  const entryX = ENTRY_X[lane];
  const entryY = CENTRE.y + Math.sqrt(r * r - (entryX - CENTRE.x) ** 2);
  const target = EXITS[exit];
  let px: number;
  let py: number;
  if (target.axis === "y") {
    py = target.at;
    px = CENTRE.x + target.dir * Math.sqrt(r * r - (py - CENTRE.y) ** 2);
  } else {
    px = target.at;
    py = CENTRE.y + target.dir * Math.sqrt(r * r - (px - CENTRE.x) ** 2);
  }
  const turn = (angle(px, py) - angle(entryX, entryY) + 2 * Math.PI) % (2 * Math.PI);
  const large = turn > Math.PI ? 1 : 0;
  return `M ${entryX} ${START_Y} L ${entryX} ${num(entryY)} A ${r} ${r} 0 ${large} 1 ${num(px)} ${num(py)} L ${target.end[0]} ${target.end[1]}`;
}

export const EXIT_BADGE: Record<RoundaboutExit, { x: number; y: number }> = {
  "left-9": { x: 20, y: 114 },
  "straight-12": { x: 110, y: 18 },
  "right-3": { x: 200, y: 94 },
  "uturn-6": { x: 150, y: 192 },
};

export interface SignalStretch {
  side: "left" | "right";
  from: number;
  to: number;
}

/** When each indicator is on, as a share of the trip (0 = entry, 1 = out of the exit). */
export const SIGNAL_PLAN: Record<SignalAction, SignalStretch[]> = {
  "left-entry": [{ side: "left", from: 0, to: 1 }],
  "none-entry-left-exit": [{ side: "left", from: 0.55, to: 1 }],
  "right-entry-left-exit": [
    { side: "right", from: 0, to: 0.6 },
    { side: "left", from: 0.6, to: 1 },
  ],
};

export function indicatorAt(action: SignalAction | null, progress: number): "left" | "right" | null {
  if (!action) return null;
  return SIGNAL_PLAN[action].find((stretch) => progress >= stretch.from && progress < stretch.to)?.side ?? null;
}
