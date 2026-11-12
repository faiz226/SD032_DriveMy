/**
 * The 25 number plates of the Ishihara colour test and how to read each answer.
 *
 * Source: the answer key in Ishihara_Tests.pdf ("Ishihara charts", Challenge TB, 2018), plates 1 to 25. The
 * images in public/color-plates/<n>.jpg are that PDF's own plate images, taken from the key page byte for byte.
 * Never draw or generate a plate. Plates 26 to 38 in the same key are traced with a finger rather than read as a
 * number, so a typed answer cannot use them.
 *
 * The key gives no pass mark. It says what normal colour vision reads on each plate and what red-green colour
 * deficiency reads, so an answer is scored by which of those it matches, and the result reports how many plates
 * matched normal vision.
 */

export interface Plate {
  n: number;
  /** What normal colour vision reads. `null` means no number at all. */
  normal: string | null;
  /**
   * What red-green colour deficiency reads. `null` is the key's "most people don't see anything or see
   * something wrong": any answer other than the normal one. Absent on plate 1, which everyone reads.
   */
  redGreen?: string | null;
  /** Plates 22 to 25 split red-green deficiency into its two kinds. */
  protan?: string;
  deutan?: string;
}

export const PLATES: Plate[] = [
  { n: 1, normal: "12" },
  { n: 2, normal: "8", redGreen: "3" },
  { n: 3, normal: "6", redGreen: "5" },
  { n: 4, normal: "29", redGreen: "70" },
  { n: 5, normal: "57", redGreen: "35" },
  { n: 6, normal: "5", redGreen: "2" },
  { n: 7, normal: "3", redGreen: "5" },
  { n: 8, normal: "15", redGreen: "17" },
  { n: 9, normal: "74", redGreen: "21" },
  { n: 10, normal: "2", redGreen: null },
  { n: 11, normal: "6", redGreen: null },
  { n: 12, normal: "97", redGreen: null },
  { n: 13, normal: "45", redGreen: null },
  { n: 14, normal: "5", redGreen: null },
  { n: 15, normal: "7", redGreen: null },
  { n: 16, normal: "16", redGreen: null },
  { n: 17, normal: "73", redGreen: null },
  { n: 18, normal: null, redGreen: "5" },
  { n: 19, normal: null, redGreen: "2" },
  { n: 20, normal: null, redGreen: "45" },
  { n: 21, normal: null, redGreen: "73" },
  { n: 22, normal: "26", protan: "6", deutan: "2" },
  { n: 23, normal: "42", protan: "2", deutan: "4" },
  { n: 24, normal: "35", protan: "5", deutan: "3" },
  { n: 25, normal: "96", protan: "6", deutan: "9" },
];

export const plateImage = (n: number) => `/color-plates/${n}.jpg`;

/** Which reading in the key an answer matches. */
export type Reading = "normal" | "redGreen" | "protan" | "deutan" | "other";

/** A typed answer as a number string, or null for "no number". "08" reads as "8". */
function seen(answer: string | undefined): string | null {
  const digits = (answer ?? "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits || null;
}

export function readPlate(plate: Plate, answer: string | undefined): Reading {
  const value = seen(answer);
  if (value === plate.normal) return "normal";
  if (plate.protan !== undefined) return value === plate.protan ? "protan" : value === plate.deutan ? "deutan" : "other";
  if (plate.redGreen === null) return "redGreen";
  return plate.redGreen !== undefined && value === plate.redGreen ? "redGreen" : "other";
}

export type Outcome =
  /** Plate 1 was not read as 12. The key says everyone sees it, so the screen or setup is the problem. */
  | "invalid"
  /** Every plate matched normal colour vision. */
  | "clear"
  /** At least one plate did not. */
  | "check";

export function scoreTest(answers: Record<number, string>) {
  const readings = PLATES.map(plate => ({ plate, answer: answers[plate.n] ?? "", reading: readPlate(plate, answers[plate.n]) }));
  const normal = readings.filter(r => r.reading === "normal").length;
  const differ = readings.slice(1).filter(r => r.reading !== "normal").length;
  const redGreen = readings.filter(r => r.reading === "redGreen" || r.reading === "protan" || r.reading === "deutan").length;
  const outcome: Outcome = readings[0].reading !== "normal" ? "invalid" : differ === 0 ? "clear" : "check";
  return { readings, normal, differ, redGreen, outcome };
}
