import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Compass,
  Gear,
  ShieldWarning,
  Target,
  XCircle,
} from "@/components/ui/icons";

interface TrafficRulesLabProps {
  lang: "en" | "bm";
  onScenarioSolved?: (id: string) => void;
}

type RoundaboutExit = "left-9" | "straight-12" | "right-3" | "uturn-6";
type ApproachLane = "left" | "right";
type SignalAction = "left-entry" | "none-entry-left-exit" | "right-entry-left-exit";

interface ExitSpec {
  id: RoundaboutExit;
  clockEn: string;
  clockMs: string;
  titleEn: string;
  titleMs: string;
  correctLane: ApproachLane;
  correctSignal: SignalAction;
  ruleEn: string;
  ruleMs: string;
  svgPath: string;
  exitCoord: { x: number; y: number };
}

const EXIT_SPECS: ExitSpec[] = [
  {
    id: "left-9",
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
    svgPath: "M 108 188 L 108 148 Q 108 112 72 112 L 24 112",
    exitCoord: { x: 28, y: 112 },
  },
  {
    id: "straight-12",
    clockEn: "12 o'clock (Second exit straight)",
    clockMs: "Pukul 12 (Susur kedua terus)",
    titleEn: "Go straight ahead",
    titleMs: "Jalan terus ke hadapan",
    correctLane: "left",
    correctSignal: "none-entry-left-exit",
    ruleEn:
      "When the left lane is clear, approach in that lane, stay in it and signal left after passing the first exit.",
    ruleMs:
      "Jika lorong kiri lapang, masuk dan kekal di lorong itu. Beri isyarat kiri selepas melepasi susur keluar pertama.",
    svgPath: "M 108 188 L 108 145 A 45 45 0 0 1 108 62 L 108 20",
    exitCoord: { x: 108, y: 24 },
  },
  {
    id: "right-3",
    clockEn: "3 o'clock (Third exit right)",
    clockMs: "Pukul 3 (Susur ketiga kanan)",
    titleEn: "Turn right at third exit",
    titleMs: "Belok kanan di susur ketiga",
    correctLane: "right",
    correctSignal: "right-entry-left-exit",
    ruleEn:
      "Approach in the right lane, signal right on entry, circulate in the inner lane, then signal left after passing the 12 o'clock exit.",
    ruleMs:
      "Dekati di lorong kanan, beri isyarat kanan semasa masuk, pusing di lorong dalam, kemudian beri isyarat kiri selepas melepasi simpang pukul 12.",
    svgPath: "M 122 188 L 122 138 A 28 28 0 1 1 142 108 L 196 108",
    exitCoord: { x: 192, y: 108 },
  },
  {
    id: "uturn-6",
    clockEn: "6 o'clock (Fourth exit U-turn)",
    clockMs: "Pukul 6 (Susur keempat pusingan U)",
    titleEn: "Full circle U-turn",
    titleMs: "Pusingan lengkap (Pusingan U)",
    correctLane: "right",
    correctSignal: "right-entry-left-exit",
    ruleEn:
      "Approach in the right lane, signal right on entry, keep to the inner lane around the island, then signal left after passing the 3 o'clock exit.",
    ruleMs:
      "Dekati di lorong kanan, beri isyarat kanan semasa masuk, kekal di lorong dalam mengelilingi pulau bulatan, kemudian beri isyarat kiri selepas melepasi simpang pukul 3.",
    svgPath: "M 122 188 L 122 138 A 28 28 0 1 1 132 142 L 132 188",
    exitCoord: { x: 132, y: 184 },
  },
];

// KPP General, PDF viewer page 95.
const KEJARA_ACTIONS = [
  { en: "Warning", ms: "Amaran" },
  { en: "Suspension for 6–8 months", ms: "Penggantungan selama 6–8 bulan" },
  { en: "Suspension for 8–10 months", ms: "Penggantungan selama 8–10 bulan" },
  { en: "Suspension for 10–12 months", ms: "Penggantungan selama 10–12 bulan" },
];

interface RuleScenario {
  id: string;
  badge: string;
  ref: string;
  promptEn: string;
  promptMs: string;
  optionsEn: string[];
  optionsMs: string[];
  correctIndex: number;
  explanationEn: string;
  explanationMs: string;
}

const RULE_SCENARIOS: RuleScenario[] = [
  {
    id: "scen-lmm-age",
    badge: "LMM Age & Class",
    ref: "Had Umur Minimum Lesen",
    promptEn: "A 17-year-old learner wants to apply for a driving licence. Which combination is legally permitted under APJ 1987?",
    promptMs: "Seorang calon berumur 17 tahun ingin memohon lesen memandu. Kombinasi manakah yang dibenarkan di bawah APJ 1987?",
    optionsEn: [
      "Class B2/B motorcycle (min 16) and Class D/DA motorcar (min 17), but not Class E heavy lorry (min 21)",
      "Class D/DA motorcar and Class E heavy lorry, plus PSV e-hailing immediately",
      "Only Class B2 motorcycle under 250 cc; Class D/DA requires age 18",
    ],
    optionsMs: [
      "Motosikal Kelas B2/B (min 16) dan motokar Kelas D/DA (min 17), tetapi bukan lori berat Kelas E (min 21)",
      "Motokar Kelas D/DA dan lori berat Kelas E serta lesen vokasional PSV dengan segera",
      "Hanya motosikal Kelas B2 bawah 250 cc; Kelas D/DA memerlukan umur 18 tahun",
    ],
    correctIndex: 0,
    explanationEn:
      "Minimum ages in Malaysia: 16 years for motorcycles (Class B2/B) and three-wheelers (Class C), 17 years for motorcars (Class D Manual & Class DA Automatic), and 21 years for heavy vehicles (Class E) and vocational licences (GDL/PSV/Konduktor).",
    explanationMs:
      "Had umur minimum di Malaysia: 16 tahun bagi motosikal (Kelas B2/B) dan kenderaan tiga roda (Kelas C), 17 tahun bagi motokar (Kelas D Manual & Kelas DA Automatik), dan 21 tahun bagi kenderaan berat (Kelas E) serta lesen vokasional (GDL/PSV).",
  },
  {
    id: "scen-licence-expiry",
    badge: "LDL / PDL / CDL Validity",
    ref: "Tempoh Sah Lesen Memandu",
    promptEn: "How long can each driving licence remain expired before the holder is disqualified from direct renewal and must repeat the test?",
    promptMs: "Berapa lamakah setiap jenis lesen memandu boleh tamat tempoh sebelum pemegangnya hilang kelayakan pembaharuan terus dan wajib mengulangi ujian?",
    optionsEn: [
      "LDL expires after 2 years; PDL cannot lapse > 1 year; CDL cannot lapse > 3 years",
      "LDL, PDL, and CDL all allow a 5-year grace period before re-testing",
      "PDL can lapse up to 3 years, while CDL lapses after 1 year",
    ],
    optionsMs: [
      "LDL tamat selepas 2 tahun; PDL tidak boleh tamat > 1 tahun; CDL tidak boleh tamat > 3 tahun",
      "LDL, PDL, dan CDL semuanya membenarkan tempoh tangguh 5 tahun sebelum ujian semula",
      "PDL boleh tamat sehingga 3 tahun, manakala CDL tamat selepas 1 tahun",
    ],
    correctIndex: 0,
    explanationEn:
      "An LDL (3 or 6 months per renewal) has a maximum total validity of 2 years. A 2-year Probationary Driving Licence (PDL) cannot remain expired for more than 1 year, and a Competent Driving Licence (CDL) cannot remain expired for more than 3 years.",
    explanationMs:
      "Lesen Belajar Memandu (LDL) sah maksimum keseluruhan 2 tahun. Lesen Memandu Percubaan (PDL) 2 tahun tidak boleh tamat tempoh melebihi 1 tahun, manakala Lesen Memandu Kompeten (CDL) tidak boleh tamat tempoh melebihi 3 tahun.",
  },
  {
    id: "scen-yellow-box",
    badge: "Yellow Box Junction",
    ref: "Petak Kuning Bersilang",
    promptEn: "Your traffic light turns green at a yellow criss-cross box junction, but traffic ahead in your exit lane is stationary. What is the legal action?",
    promptMs: "Lampu isyarat anda bertukar hijau di petak kuning bersilang, tetapi trafik di lorong keluar anda sedang berhenti. Apakah tindakan yang sah?",
    optionsEn: [
      "Wait behind the stop line before the yellow box until your exit lane is completely clear",
      "Drive into the middle of the yellow box immediately while the light is green so you do not miss your turn",
      "Enter the yellow box and sound your horn continuously to clear the lane ahead",
    ],
    optionsMs: [
      "Tunggu di belakang garisan berhenti sebelum petak kuning sehingga lorong keluar anda lapang sepenuhnya",
      "Pandu masuk ke tengah petak kuning serta-merta semasa lampu hijau supaya tidak terlepas giliran",
      "Masuk ke petak kuning dan bunyikan hon secara berterusan untuk mengosongkan lorong di hadapan",
    ],
    correctIndex: 0,
    explanationEn:
      "Stopping on a yellow box junction obstructs cross-traffic and is a traffic offence. Never enter unless your exit road is clear.",
    explanationMs:
      "Berhenti di atas petak kuning menghalang trafik lintasan dan merupakan kesalahan jalan raya. Jangan masuk melainkan lorong keluar anda lapang sepenuhnya.",
  },
  {
    id: "scen-centre-line",
    badge: "Road Markings",
    ref: "Garisan Tengah Jalan",
    promptEn: "The centre of a two-way road has a continuous white line on your side paired with a broken white line on the opposite side. Can you overtake?",
    promptMs: "Bahagian tengah jalan dua hala mempunyai garisan putih bersambung di sebelah lorong anda dan garisan putih putus-putus di sebelah bertentangan. Bolehkah anda memotong?",
    optionsEn: [
      "No. Because the continuous line is on your side of the road, you are prohibited from crossing it to overtake or make a U-turn",
      "Yes, because one of the two lines is broken, either direction may overtake freely",
      "Yes, provided you switch on your hazard lights before crossing the continuous line",
    ],
    optionsMs: [
      "Tidak boleh. Oleh sebab garisan bersambung berada di sebelah lorong anda, anda dilarang melintasinya untuk memotong atau membuat pusingan U",
      "Boleh, kerana salah satu garisan adalah putus-putus, maka kedua-dua arah bebas memotong",
      "Boleh, dengan syarat anda memasang lampu kecemasan sebelum melintasi garisan bersambung tersebut",
    ],
    correctIndex: 0,
    explanationEn:
      "With combination centre lines, drivers must obey the line closest to their own lane. A solid line on your side prohibits overtaking; only traffic on the side with the broken line may cross when safe.",
    explanationMs:
      "Bagi garisan tengah bergabung, pemandu wajib mematuhi garisan yang paling hampir dengan lorong sendiri. Garisan penuh di sebelah anda melarang memotong; hanya trafik di sebelah garisan putus-putus dibenarkan memotong apabila selamat.",
  },
];

export function TrafficRulesLab({ lang, onScenarioSolved }: TrafficRulesLabProps) {
  const reduceMotion = useReducedMotion();
  const [activeLab, setActiveLab] = useState<"roundabout" | "kejara" | "transmission" | "scenarios">("roundabout");

  // Lab 1: Roundabout state
  const [selectedExit, setSelectedExit] = useState<RoundaboutExit>("left-9");
  const [chosenLane, setChosenLane] = useState<ApproachLane>("left");
  const [chosenSignal, setChosenSignal] = useState<SignalAction>("left-entry");
  const [roundaboutChecked, setRoundaboutChecked] = useState(false);
  const [solvedExits, setSolvedExits] = useState<Record<string, boolean>>({});

  const [kejaraStage, setKejaraStage] = useState(0);

  // Lab 3: Transmission (DA vs D) state
  const [transTrack, setTransTrack] = useState<"DA" | "D">("DA");

  // Lab 4: Scenarios state
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<string, number>>({});

  const currentExitSpec = EXIT_SPECS.find((e) => e.id === selectedExit) ?? EXIT_SPECS[0];
  const isRoundaboutCorrect =
    chosenLane === currentExitSpec.correctLane && chosenSignal === currentExitSpec.correctSignal;

  const handleCheckRoundabout = () => {
    setRoundaboutChecked(true);
    if (isRoundaboutCorrect) {
      setSolvedExits((prev) => ({ ...prev, [selectedExit]: true }));
      onScenarioSolved?.(`roundabout-${selectedExit}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Lab Switcher Bar */}
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="pill pill-brand">
                {lang === "en" ? "Interactive workbench" : "Makmal interaktif"}
              </span>
              <span className="text-xs text-muted-foreground">
                {lang === "en"
                  ? "Learn by testing real JPJ decisions"
                  : "Belajar melalui simulasi keputusan sebenar JPJ"}
              </span>
            </div>
            <h2 className="text-lg font-bold font-heading mt-1.5">
              {lang === "en"
                ? "Part B interactive traffic rules simulator"
                : "Simulator interaktif peraturan jalan raya Bahagian B"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={lang === "en" ? "Traffic rule labs" : "Makmal peraturan jalan raya"}>
            {[
              {
                id: "roundabout" as const,
                icon: Compass,
                labelEn: "1. Roundabout lane & signal",
                labelMs: "1. Lorong & isyarat bulatan",
              },
              {
                id: "kejara" as const,
                icon: ShieldWarning,
                labelEn: "2. KEJARA actions",
                labelMs: "2. Tindakan KEJARA",
              },
              {
                id: "transmission" as const,
                icon: Gear,
                labelEn: "3. Class DA vs D gears",
                labelMs: "3. Gear Kelas DA vs D",
              },
              {
                id: "scenarios" as const,
                icon: Target,
                labelEn: "4. Road law judge",
                labelMs: "4. Hakim undang-undang",
              },
            ].map((item) => {
              const IconComp = item.icon;
              const isActive = activeLab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveLab(item.id)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-foreground/40"
                  }`}
                >
                  <IconComp size={15} aria-hidden="true" />
                  <span>{lang === "en" ? item.labelEn : item.labelMs}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LAB 1: ROUNDABOUT SIMULATOR */}
        {activeLab === "roundabout" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground">
                  {lang === "en"
                    ? "Step 1: Choose your target exit around the clock face."
                    : "Langkah 1: Pilih susur keluar mengikut arah jam."}
                </p>
                <span className="pill pill-neutral">
                  {Object.keys(solvedExits).length}/4{" "}
                  {lang === "en" ? "exits mastered" : "susur dikuasai"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EXIT_SPECS.map((spec) => {
                  const active = selectedExit === spec.id;
                  const done = !!solvedExits[spec.id];
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => {
                        setSelectedExit(spec.id);
                        setRoundaboutChecked(false);
                      }}
                      aria-pressed={active}
                      className={`tile p-3 text-left cursor-pointer flex items-start justify-between gap-2 ${
                        active ? "tile-selected" : done ? "tile-done" : ""
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">
                          {lang === "en" ? spec.clockEn : spec.clockMs}
                        </div>
                        <div className="text-sm font-bold text-foreground mt-0.5">
                          {lang === "en" ? spec.titleEn : spec.titleMs}
                        </div>
                      </div>
                      {done && (
                        <CheckCircle
                          size={18}
                          className="text-success shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Step 2: Approach Lane */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  {lang === "en"
                    ? "Step 2: Select your approach & circulatory lane"
                    : "Langkah 2: Pilih lorong masuk & pusingan anda"}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {(["left", "right"] as const).map((lane) => (
                    <button
                      key={lane}
                      type="button"
                      onClick={() => {
                        setChosenLane(lane);
                        setRoundaboutChecked(false);
                      }}
                      aria-pressed={chosenLane === lane}
                      className={`tile p-3 text-left cursor-pointer ${
                        chosenLane === lane ? "tile-selected" : ""
                      }`}
                    >
                      <div className="text-sm font-bold text-foreground">
                        {lane === "left"
                          ? lang === "en"
                            ? "Left lane (Outer ring)"
                            : "Lorong kiri (Lingkaran luar)"
                          : lang === "en"
                            ? "Right lane (Inner ring)"
                            : "Lorong kanan (Lingkaran dalam)"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {lane === "left"
                          ? lang === "en"
                            ? "Closer to kerbs and early exits"
                            : "Lebih rapat ke bahu jalan & susur awal"
                          : lang === "en"
                            ? "Closer to the central traffic island"
                            : "Lebih rapat ke pulau tengah bulatan"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Indicator Signal */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  {lang === "en"
                    ? "Step 3: Choose your indicator signal timing"
                    : "Langkah 3: Pilih masa penggunaan lampu isyarat"}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: "left-entry" as const,
                      labelEn: "Signal LEFT before entering and keep left signal on until exiting",
                      labelMs: "Beri isyarat KIRI sebelum masuk dan kekalkan sehingga keluar",
                    },
                    {
                      id: "none-entry-left-exit" as const,
                      labelEn: "No signal on entry; switch on LEFT signal just past the exit before yours",
                      labelMs: "Tiada isyarat semasa masuk; pasang isyarat KIRI selepas melepasi susur sebelum susur anda",
                    },
                    {
                      id: "right-entry-left-exit" as const,
                      labelEn: "Signal RIGHT on entry, circulate, then signal LEFT before your exit",
                      labelMs: "Beri isyarat KANAN semasa masuk, pusing, kemudian beri isyarat KIRI sebelum keluar",
                    },
                  ].map((sig) => (
                    <button
                      key={sig.id}
                      type="button"
                      onClick={() => {
                        setChosenSignal(sig.id);
                        setRoundaboutChecked(false);
                      }}
                      aria-pressed={chosenSignal === sig.id}
                      className={`tile p-3 text-left cursor-pointer text-sm font-medium ${
                        chosenSignal === sig.id ? "tile-selected" : ""
                      }`}
                    >
                      {lang === "en" ? sig.labelEn : sig.labelMs}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button type="button" onClick={handleCheckRoundabout}>
                  {lang === "en" ? "Test roundabout maneuver" : "Uji olah gerak bulatan"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {lang === "en"
                    ? "Always give way to vehicles approaching from your right inside the roundabout."
                    : "Sentiasa beri laluan kepada kenderaan dari arah kanan di dalam bulatan."}
                </span>
              </div>

              {roundaboutChecked && (
                <div
                  role="status"
                  className={`p-4 rounded-xl border ${
                    isRoundaboutCorrect
                      ? "bg-success/10 border-success/40 text-foreground"
                      : "bg-destructive/10 border-destructive/40 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {isRoundaboutCorrect ? (
                      <>
                        <CheckCircle size={18} className="text-success" aria-hidden="true" />
                        <span>
                          {lang === "en"
                            ? "Correct JPJ roundabout procedure!"
                            : "Prosedur bulatan JPJ yang tepat!"}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} className="text-destructive" aria-hidden="true" />
                        <span>
                          {lang === "en"
                            ? "Lane or signal timing does not match the KPP textbook rule."
                            : "Pilihan lorong atau lampu isyarat tidak mengikut peraturan buku teks KPP."}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {lang === "en" ? currentExitSpec.ruleEn : currentExitSpec.ruleMs}
                  </p>
                </div>
              )}
            </div>

            {/* Live Roundabout Vector Diagram */}
            <div className="lg:col-span-5 panel p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span className="font-semibold text-foreground">
                  {lang === "en" ? "Top-down roundabout map" : "Pelan atas bulatan"}
                </span>
                <span className="pill pill-neutral">
                  {lang === "en" ? "Circulatory Flow" : "Aliran Bulatan"}
                </span>
              </div>
              <svg
                viewBox="0 0 220 210"
                className="w-full max-w-[260px] h-auto rounded-xl bg-muted/40 border border-border"
                role="img"
                aria-label={
                  lang === "en"
                    ? `Roundabout diagram showing ${currentExitSpec.clockEn}`
                    : `Rajah bulatan menunjukkan ${currentExitSpec.clockMs}`
                }
              >
                {/* Road arms */}
                <rect x="92" y="8" width="36" height="194" fill="#334155" />
                <rect x="12" y="90" width="196" height="36" fill="#334155" />
                {/* Outer circulatory roadway */}
                <circle cx="110" cy="108" r="56" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                {/* Lane divider circle */}
                <circle
                  cx="110"
                  cy="108"
                  r="40"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                />
                {/* Central island */}
                <circle cx="110" cy="108" r="22" fill="#15803d" stroke="#f8fafc" strokeWidth="2.5" />
                {/* Clock labels */}
                <text x="110" y="18" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="700">
                  12:00
                </text>
                <text x="200" y="85" textAnchor="end" fill="#0f172a" fontSize="9" fontWeight="700">
                  3:00
                </text>
                <text x="20" y="85" textAnchor="start" fill="#0f172a" fontSize="9" fontWeight="700">
                  9:00
                </text>
                <text x="110" y="203" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="700">
                  6:00 (Entry)
                </text>

                {/* Active vehicle trajectory */}
                <path
                  d={currentExitSpec.svgPath}
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="6 3"
                />
                <circle
                  cx={currentExitSpec.exitCoord.x}
                  cy={currentExitSpec.exitCoord.y}
                  r="5.5"
                  fill="#eab308"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              </svg>
              <div className="w-full mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground">
                  {lang === "en" ? "Golden rule at entry:" : "Peraturan utama semasa masuk:"}
                </div>
                <p>
                  {lang === "en"
                    ? "Traffic already circulating from your right has right-of-way. Never change lanes abruptly across the exit mouth."
                    : "Kenderaan yang sedang bergerak dari arah kanan mempunyai hak laluan. Jangan menukar lorong secara mengejut di mulut simpang keluar."}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* LAB 2: SISTEM KEJARA & APJ 1987 COMPOUND CALCULATOR */}
        {activeLab === "kejara" && (
          <div className="panel space-y-4 p-4 sm:p-5">
            <h3 className="font-heading text-base font-bold">
              {lang === "en" ? "KEJARA for competent licence holders" : "KEJARA bagi pemegang lesen kompeten"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {lang === "en"
                ? "Choose how many times the driver has reached the 20-point threshold."
                : "Pilih bilangan kali pemandu mencapai ambang 20 mata."}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {KEJARA_ACTIONS.map((action, index) => (
                <Button
                  key={action.en}
                  type="button"
                  variant={kejaraStage === index ? "default" : "outline"}
                  aria-pressed={kejaraStage === index}
                  onClick={() => setKejaraStage(index)}
                >
                  {lang === "en" ? `Time ${index + 1}` : `Kali ke-${index + 1}`}
                </Button>
              ))}
            </div>
            <p className="text-base font-semibold" aria-live="polite">
              {KEJARA_ACTIONS[kejaraStage][lang === "en" ? "en" : "ms"]}
            </p>
          </div>
        )}

        {activeLab === "transmission" && (
          <div className="panel space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {(["DA", "D"] as const).map((track) => (
                <Button
                  key={track}
                  type="button"
                  variant={transTrack === track ? "default" : "outline"}
                  aria-pressed={transTrack === track}
                  onClick={() => setTransTrack(track)}
                >
                  {lang === "en" ? `Class ${track}` : `Kelas ${track}`}
                </Button>
              ))}
            </div>
            <div className="space-y-2" aria-live="polite">
              <h3 className="font-heading text-base font-bold">
                {transTrack === "DA"
                  ? lang === "en" ? "Automatic selector" : "Pemilih gear automatik"
                  : lang === "en" ? "Manual clutch and gears" : "Cekam dan gear manual"}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {transTrack === "DA"
                  ? lang === "en"
                    ? "Use your right foot for the brake and accelerator. Select P to park, R to reverse, N for neutral or D to drive forward. Stop before selecting reverse."
                    : "Gunakan kaki kanan untuk brek dan pemecut. Pilih P untuk parkir, R untuk mengundur, N untuk neutral atau D untuk bergerak ke hadapan. Berhenti sebelum memilih gear undur."
                  : lang === "en"
                    ? "Use your left foot on the clutch. Press it fully to select first gear, then release it gradually to the biting point when moving off."
                    : "Gunakan kaki kiri pada pedal cekam. Tekan cekam sepenuhnya untuk memilih gear pertama, kemudian lepaskan beransur-ansur hingga ke titik pergerakan ketika mula bergerak."}
              </p>
            </div>
          </div>
        )}

        {activeLab === "scenarios" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {RULE_SCENARIOS.map((scen) => {
              const picked = scenarioAnswers[scen.id];
              const answered = picked !== undefined;
              const isRight = picked === scen.correctIndex;
              const options = lang === "en" ? scen.optionsEn : scen.optionsMs;

              return (
                <div key={scen.id} className="panel p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="pill pill-info">{scen.badge}</span>
                      <span className="text-[0.8125rem] text-muted-foreground">{scen.ref}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      {lang === "en" ? scen.promptEn : scen.promptMs}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {options.map((opt, idx) => {
                      const selected = picked === idx;
                      let stateClass = "";
                      if (answered) {
                        if (idx === scen.correctIndex) stateClass = "tile-done";
                        else if (selected) stateClass = "tile-fail";
                      } else if (selected) {
                        stateClass = "tile-selected";
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setScenarioAnswers((prev) => ({ ...prev, [scen.id]: idx }));
                            if (idx === scen.correctIndex) {
                              onScenarioSolved?.(scen.id);
                            }
                          }}
                          className={`tile w-full p-2.5 text-left text-xs leading-relaxed cursor-pointer ${stateClass}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {answered && (
                    <div
                      role="status"
                      className={`p-3 rounded-lg text-xs leading-relaxed border ${
                        isRight
                          ? "bg-success/10 border-success/30 text-foreground"
                          : "bg-warning/10 border-warning/30 text-foreground"
                      }`}
                    >
                      <span className="font-bold block mb-0.5">
                        {isRight
                          ? lang === "en"
                            ? "Correct judgment"
                            : "Keputusan tepat"
                          : lang === "en"
                            ? "Textbook rule"
                            : "Peraturan buku teks"}
                      </span>
                      {lang === "en" ? scen.explanationEn : scen.explanationMs}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

