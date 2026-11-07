export type PlateType = "control" | "screening" | "diagnostic" | "classification" | "tritan";

export const PLATES = [
  { id: 1, imageFile: "1.jpg", plateNum: 1, normalAnswer: "12", redGreenAnswer: "12", type: "control" as const },
  { id: 2, imageFile: "2.jpg", plateNum: 2, normalAnswer: "8", redGreenAnswer: "3", type: "screening" as const },
  { id: 3, imageFile: "3.jpg", plateNum: 3, normalAnswer: "6", redGreenAnswer: "5", type: "screening" as const },
  { id: 4, imageFile: "4.jpg", plateNum: 4, normalAnswer: "29", redGreenAnswer: "70", type: "screening" as const },
  { id: 5, imageFile: "5.jpg", plateNum: 5, normalAnswer: "57", redGreenAnswer: "35", type: "screening" as const },
  { id: 6, imageFile: "6.jpg", plateNum: 6, normalAnswer: "5", redGreenAnswer: "2", type: "screening" as const },
  { id: 7, imageFile: "7.jpg", plateNum: 7, normalAnswer: "3", redGreenAnswer: "5", type: "screening" as const },
  { id: 8, imageFile: "8.jpg", plateNum: 8, normalAnswer: "15", redGreenAnswer: "17", type: "screening" as const },
  { id: 9, imageFile: "9.jpg", plateNum: 9, normalAnswer: "74", redGreenAnswer: "21", type: "screening" as const },
  { id: 10, imageFile: "10.jpg", plateNum: 10, normalAnswer: "2", redGreenAnswer: "nothing", type: "diagnostic" as const },
  { id: 11, imageFile: "11.jpg", plateNum: 11, normalAnswer: "6", redGreenAnswer: "nothing", type: "diagnostic" as const },
  { id: 12, imageFile: "12.jpg", plateNum: 12, normalAnswer: "97", redGreenAnswer: "nothing", type: "diagnostic" as const },
  { id: 13, imageFile: "13.jpg", plateNum: 13, normalAnswer: "45", redGreenAnswer: "nothing", type: "diagnostic" as const },
  { id: 14, imageFile: "14.jpg", plateNum: 14, normalAnswer: "5", redGreenAnswer: "nothing", type: "diagnostic" as const },
  { id: 15, imageFile: "15.jpg", plateNum: 15, normalAnswer: "7", redGreenAnswer: "nothing", type: "diagnostic" as const },
  { id: 16, imageFile: "16.jpg", plateNum: 16, normalAnswer: "16", redGreenAnswer: "nothing", type: "diagnostic" as const },
  { id: 17, imageFile: "17.jpg", plateNum: 17, normalAnswer: "73", redGreenAnswer: "nothing", type: "diagnostic" as const },
  { id: 18, imageFile: "18.jpg", plateNum: 18, normalAnswer: "nothing", redGreenAnswer: "5", type: "classification" as const },
  { id: 19, imageFile: "19.jpg", plateNum: 19, normalAnswer: "nothing", redGreenAnswer: "2", type: "classification" as const },
  { id: 20, imageFile: "20.jpg", plateNum: 20, normalAnswer: "nothing", redGreenAnswer: "45", type: "classification" as const },
  { id: 21, imageFile: "21.jpg", plateNum: 21, normalAnswer: "nothing", redGreenAnswer: "73", type: "classification" as const },
  { id: 22, imageFile: "22.jpg", plateNum: 22, normalAnswer: "26", redGreenAnswer: "26", type: "tritan" as const },
  { id: 23, imageFile: "23.jpg", plateNum: 23, normalAnswer: "42", redGreenAnswer: "42", type: "tritan" as const },
  { id: 24, imageFile: "24.jpg", plateNum: 24, normalAnswer: "35", redGreenAnswer: "35", type: "tritan" as const },
  { id: 25, imageFile: "25.jpg", plateNum: 25, normalAnswer: "96", redGreenAnswer: "96", type: "tritan" as const },
];

export const COLOR_SETS = [
  { id: "full", title: "Full Test", titleMs: "Ujian Penuh", desc: "All 25 Ishihara plates", descMs: "Semua 25 plat Ishihara", limit: 25 },
  { id: "quick", title: "Quick Screen", titleMs: "Ujian Pantas", desc: "First 17 screening plates", descMs: "17 plat saringan pertama", limit: 17 },
  { id: "screening", title: "Basic Check", titleMs: "Semakan Asas", desc: "First 9 screening plates", descMs: "9 plat saringan pertama", limit: 9 }
];
