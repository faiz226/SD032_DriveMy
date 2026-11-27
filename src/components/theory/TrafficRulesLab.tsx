import { useState } from "react";
import { RoundaboutVisual } from "./RoundaboutVisual";
import type { RoundaboutExit } from "./roundabout";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Compass,
  Gear,
  ShieldWarning,
  Target,
} from "@/components/ui/icons";

interface TrafficRulesLabProps {
  lang: "en" | "bm";
  onScenarioSolved?: (id: string) => void;
}

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
  badgeMs: string;
  refEn: string;
  refMs: string;
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
    badgeMs: "Umur & Kelas LMM",
    refEn: "Minimum licence age",
    refMs: "Had Umur Minimum Lesen",
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
    badgeMs: "PDL ke CDL",
    refEn: "Competent licence application period",
    refMs: "Tempoh Permohonan Lesen Kompeten",
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
    badgeMs: "Petak Kuning",
    refEn: "Yellow box junction",
    refMs: "Petak Kuning Bersilang",
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
    badgeMs: "Garisan Jalan",
    refEn: "Road centre line",
    refMs: "Garisan Tengah Jalan",
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
  const [solvedExits, setSolvedExits] = useState<Record<string, boolean>>({});

  const [kejaraStage, setKejaraStage] = useState(0);

  // Lab 3: Transmission (DA vs D) state
  const [transTrack, setTransTrack] = useState<"DA" | "D">("DA");

  // Lab 4: Scenarios state
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<string, number>>({});

  const handleExitSolved = (exit: RoundaboutExit) => {
    setSolvedExits((prev) => ({ ...prev, [exit]: true }));
    onScenarioSolved?.(`roundabout-${exit}`);
  };

  return (
    <div className="space-y-6">
      {/* Lab Switcher Bar */}
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold font-heading">
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
                  className={`tap-sm inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer ${
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

        {/* LAB 1: ROUNDABOUT */}
        {activeLab === "roundabout" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="pt-4"
          >
            <RoundaboutVisual lang={lang} solved={solvedExits} onSolved={handleExitSolved} />
          </motion.div>
        )}

        {/* LAB 2: SISTEM KEJARA & APJ 1987 COMPOUND CALCULATOR */}
        {activeLab === "kejara" && (
          <div className="mt-4 rounded-2xl border border-border bg-muted/35 space-y-4 p-4 sm:p-5">
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
          <div className="mt-4 rounded-2xl border border-border bg-muted/35 space-y-4 p-4 sm:p-5">
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
                <div key={scen.id} className="rounded-2xl border border-border bg-muted/35 p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="pill pill-info">{lang === "en" ? scen.badge : scen.badgeMs}</span>
                      <span className="text-[0.8125rem] text-muted-foreground">{lang === "en" ? scen.refEn : scen.refMs}</span>
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
                          className={`tile w-full min-h-11 px-3.5 py-2.5 text-left text-xs leading-relaxed cursor-pointer ${stateClass}`}
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

