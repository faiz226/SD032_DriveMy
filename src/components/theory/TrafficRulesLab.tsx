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

// KPP Automatic, viewer pages 257–259.
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
    svgPath: "M 86 190 L 86 149.57 A 48 48 0 0 1 68.43 132 L 24 132",
    exitCoord: { x: 24, y: 132 },
  },
  {
    id: "straight-12",
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
    svgPath: "M 86 190 L 86 149.57 A 48 48 0 0 1 86 66.43 L 86 24",
    exitCoord: { x: 86, y: 24 },
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
      "Approach in the right lane, signal right before entering and keep it on in the inner lane, then signal left after passing the 12 o'clock exit.",
    ruleMs:
      "Dekati di lorong kanan, beri isyarat kanan sebelum masuk dan kekalkan isyarat di lorong dalam, kemudian beri isyarat kiri selepas melepasi simpang pukul 12.",
    svgPath: "M 102 190 L 102 137.95 A 31 31 0 1 1 139.95 100 L 196 100",
    exitCoord: { x: 196, y: 100 },
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
      "Approach in the right lane, signal right before entering and keep it on in the inner lane around the island, then signal left after passing the 3 o'clock exit.",
    ruleMs:
      "Dekati di lorong kanan, beri isyarat kanan sebelum masuk dan kekalkan isyarat di lorong dalam mengelilingi pulau bulatan, kemudian beri isyarat kiri selepas melepasi simpang pukul 3.",
    svgPath: "M 102 190 L 102 137.95 A 31 31 0 1 1 118 137.95 L 118 190",
    exitCoord: { x: 118, y: 190 },
  },
];

// KPP General, PDF viewer page 95.
const KEJARA_ACTIONS = [
  { en: "Warning", ms: "Amaran" },
  { en: "Suspension for 6–8 months", ms: "Penggantungan selama 6–8 bulan" },
  { en: "Suspension for 8–10 months", ms: "Penggantungan selama 8–10 bulan" },
  { en: "Suspension for 10–12 months. Three suspensions in five years lead to licence cancellation.", ms: "Penggantungan selama 10–12 bulan. Tiga penggantungan dalam lima tahun menyebabkan lesen dibatalkan." },
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

// KPP General, viewer pages 9, 14, 16 and 20. KPP Automatic, viewer pages 71, 73 and 165.
const RULE_SCENARIOS: RuleScenario[] = [
  {
    id: "scen-lmm-age",
    badge: "LMM Age & Class",
    ref: "Had Umur Minimum Lesen",
    promptEn: "A 17-year-old learner wants to apply for a driving licence. Which combination is legally permitted under APJ 1987?",
    promptMs: "Seorang calon berumur 17 tahun ingin memohon lesen memandu. Kombinasi manakah yang dibenarkan di bawah APJ 1987?",
    optionsEn: [
      "Class B2/B motorcycle (min 16) and Class D/DA motorcar (min 17), but not Class E heavy motor vehicle (min 21)",
      "Class D/DA motorcar and Class E heavy motor vehicle, plus PSV e-hailing immediately",
      "Only Class B2 motorcycle under 250 cc; Class D/DA requires age 18",
    ],
    optionsMs: [
      "Motosikal Kelas B2/B (min 16) dan motokar Kelas D/DA (min 17), tetapi bukan kenderaan berat Kelas E (min 21)",
      "Motokar Kelas D/DA dan kenderaan berat Kelas E serta lesen vokasional PSV dengan segera",
      "Hanya motosikal Kelas B2 bawah 250 cc; Kelas D/DA memerlukan umur 18 tahun",
    ],
    correctIndex: 0,
    explanationEn:
      "The handbook gives minimum ages of 16 for motorcycles, 17 for motorcars, and 21 for heavy motor vehicles.",
    explanationMs:
      "Buku panduan menetapkan umur minimum 16 tahun bagi motosikal, 17 tahun bagi motokar dan 21 tahun bagi kenderaan motor berat.",
  },
  {
    id: "scen-licence-expiry",
    badge: "PDL to CDL",
    ref: "Tempoh Permohonan Lesen Kompeten",
    promptEn: "Your probationary licence has expired. How long from expiry does the handbook allow to apply for a competent licence?",
    promptMs: "Lesen memandu percubaan anda telah tamat tempoh. Berapa lamakah tempoh selepas tamat yang dibenarkan oleh buku panduan untuk memohon lesen kompeten?",
    optionsEn: ["Up to one year", "Up to six months", "Up to two years"],
    optionsMs: ["Sehingga setahun", "Sehingga enam bulan", "Sehingga dua tahun"],
    correctIndex: 0,
    explanationEn:
      "The probationary period lasts two years. Apply for a competent licence no later than one year after the probationary licence expires.",
    explanationMs:
      "Tempoh percubaan berlangsung selama dua tahun. Mohon lesen memandu kompeten selewat-lewatnya setahun selepas lesen percubaan tamat.",
  },
  {
    id: "scen-yellow-box",
    badge: "Yellow Box Junction",
    ref: "Petak Kuning Bersilang",
    promptEn: "Your traffic light turns green at a yellow criss-cross box junction, but traffic ahead in your exit lane is stationary. What is the legal action?",
    promptMs: "Lampu isyarat anda bertukar hijau di petak kuning bersilang, tetapi trafik di lorong keluar anda sedang berhenti. Apakah tindakan yang sah?",
    optionsEn: [
      "Wait outside the box until there is room beyond it for your vehicle",
      "Drive into the middle of the yellow box immediately while the light is green so you do not miss your turn",
      "Enter the yellow box and sound your horn continuously to clear the lane ahead",
    ],
    optionsMs: [
      "Tunggu di luar petak kuning sehingga ada ruang untuk kenderaan anda selepas petak",
      "Pandu masuk ke tengah petak kuning serta-merta semasa lampu hijau supaya tidak terlepas giliran",
      "Masuk ke petak kuning dan bunyikan hon secara berterusan untuk mengosongkan lorong di hadapan",
    ],
    correctIndex: 0,
    explanationEn:
      "Stopping on a yellow box junction obstructs cross-traffic and is a traffic offence. Wait outside until there is room to clear the box.",
    explanationMs:
      "Berhenti di atas petak kuning menghalang trafik lintasan dan merupakan kesalahan jalan raya. Tunggu di luar sehingga ada ruang untuk melepasi petak.",
  },
  {
    id: "scen-centre-line",
    badge: "Road Markings",
    ref: "Garisan Tengah Jalan",
    promptEn: "The centre of a two-way road has a continuous white line on your side paired with a broken white line on the opposite side. Can you overtake?",
    promptMs: "Bahagian tengah jalan dua hala mempunyai garisan putih bersambung di sebelah lorong anda dan garisan putih putus-putus di sebelah bertentangan. Bolehkah anda memotong?",
    optionsEn: [
      "No. Only drivers on the broken-line side may cross to overtake",
      "Yes, because one of the two lines is broken, either direction may overtake freely",
      "Yes, provided you switch on your hazard lights before crossing the continuous line",
    ],
    optionsMs: [
      "Tidak boleh. Hanya pemandu di sebelah garisan putus-putus boleh melintas untuk memotong",
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
  const [chosenLane, setChosenLane] = useState<ApproachLane | null>(null);
  const [chosenSignal, setChosenSignal] = useState<SignalAction | null>(null);
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
    if (!chosenLane || !chosenSignal) return;
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
                        setChosenLane(null);
                        setChosenSignal(null);
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
                <Button type="button" onClick={handleCheckRoundabout} disabled={!chosenLane || !chosenSignal}>
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
                {/* Each arm has two lanes in each direction. */}
                <path d="M 110 8 V 202 M 12 108 H 208" stroke="#334155" strokeWidth="64" />
                <circle cx="110" cy="108" r="56" fill="#334155" />
                <path d="M 110 8 V 62 M 110 154 V 202 M 12 108 H 64 M 156 108 H 208"
                  stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="5 4" />
                <path d="M 94 8 V 54 M 126 8 V 54 M 94 162 V 202 M 126 162 V 202 M 12 92 H 56 M 12 124 H 56 M 164 92 H 208 M 164 124 H 208"
                  stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="110" cy="108" r="40" fill="none" stroke="#e2e8f0"
                  strokeWidth="1.5" strokeDasharray="5 4" />
                <circle cx="110" cy="108" r="22" fill="#15803d" stroke="#f8fafc" strokeWidth="2.5" />
                {/* Clock labels */}
                <text x="110" y="18" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="700">
                  12:00
                </text>
                <text x="200" y="85" textAnchor="end" fill="#f8fafc" fontSize="9" fontWeight="700">
                  3:00
                </text>
                <text x="20" y="85" textAnchor="start" fill="#f8fafc" fontSize="9" fontWeight="700">
                  9:00
                </text>
                <text x="110" y="203" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="700">
                  6:00
                </text>

                {roundaboutChecked && (
                  <>
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
                  </>
                )}
              </svg>
              <div className="w-full mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground">
                  {lang === "en" ? "Golden rule at entry:" : "Peraturan utama semasa masuk:"}
                </div>
                <p>
                  {lang === "en"
                    ? "Give way to traffic circulating from your right. Check your side mirrors before exiting, especially for traffic to your left when using the inner lane."
                    : "Beri laluan kepada kenderaan dari kanan yang sudah berada di bulatan. Periksa cermin sisi sebelum keluar, terutama untuk kenderaan di kiri apabila menggunakan lorong dalam."}
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

        {/* KPP Automatic, viewer pages 210–211, 215, 232–233. KPP Manual, viewer pages 213 and 215–216. */}
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
                    ? "Use your right foot for the brake and accelerator. Select P to park, R to reverse, N for neutral or D to drive forward. Stop and hold the foot brake before selecting reverse."
                    : "Gunakan kaki kanan untuk brek dan pemecut. Pilih P untuk parkir, R untuk mengundur, N untuk neutral atau D untuk bergerak ke hadapan. Berhenti dan tekan pedal brek sebelum memilih gear undur."
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

