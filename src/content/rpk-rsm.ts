import type { Language } from "@/lib/constants";

type Topic = { id: string; title: Record<Language,string>; steps: Record<Language,string[]> };
export const RPK_TOPICS: Topic[] = [
  { id: "rpk-exterior", title: { en: "RPK: exterior check", ms: "RPK: pemeriksaan luar" }, steps: {
    en: ["Inspect tyres and the vehicle exterior with your instructor. Identify damage before driving."],
    ms: ["Periksa tayar dan bahagian luar bersama pengajar. Kenal pasti kerosakan sebelum memandu."],
  } },
  { id: "rpk-engine", title: { en: "RPK: engine compartment", ms: "RPK: ruang enjin" }, steps: {
    en: ["Ask your instructor to demonstrate the engine-compartment checks for your training vehicle."],
    ms: ["Minta pengajar menunjukkan pemeriksaan ruang enjin bagi kenderaan latihan anda."],
  } },
  { id: "rsm-position", title: { en: "RSM: seating position", ms: "RSM: kedudukan duduk" }, steps: {
    en: ["Secure the parking brake. Adjust your seat and head restraint before moving."],
    ms: ["Pastikan brek tangan ditarik. Laraskan tempat duduk dan penyandar kepala sebelum bergerak."],
  } },
  { id: "rsm-mirrors", title: { en: "RSM: mirrors and belt", ms: "RSM: cermin dan tali pinggang" }, steps: {
    en: ["Adjust both side mirrors and the rear-view mirror. Fasten your seat belt."],
    ms: ["Laraskan kedua-dua cermin sisi dan cermin pandang belakang. Pakai tali pinggang keledar."],
  } },
  { id: "rsm-controls", title: { en: "RSM: instruments and controls", ms: "RSM: instrumen dan kawalan" }, steps: {
    en: ["Check the instruments and switches. Follow your instructor's starting procedure for this vehicle."],
    ms: ["Semak instrumen dan suis. Ikuti prosedur menghidupkan kenderaan yang ditunjukkan pengajar."],
  } },
];

export function countRpkCompleted(rows: { module_id: string; completed: boolean }[]) {
  const ids = new Set(rows.filter(row => row.completed).map(row => row.module_id));
  return RPK_TOPICS.filter(topic => ids.has(topic.id)).length;
}
