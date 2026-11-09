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
      "Approach in the left lane (or right lane if clear), do not signal on entry, then switch on the left signal after passing the 9 o'clock exit.",
    ruleMs:
      "Dekati di lorong kiri, jangan beri isyarat semasa masuk, kemudian pasang isyarat kiri selepas melepasi simpang pukul 9.",
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

interface KejaraOffence {
  id: string;
  points: number;
  labelEn: string;
  labelMs: string;
  ref: string;
  pdlOnly?: boolean;
}

const KEJARA_OFFENCES: KejaraOffence[] = [
  {
    id: "speed-over-40",
    points: 10,
    labelEn: "Exceeding speed limit by more than 40 km/h",
    labelMs: "Melebihi had laju lebih daripada 40 km/j",
    ref: "Mata Demerit KEJARA",
  },
  {
    id: "red-light",
    points: 10,
    labelEn: "Failing to obey red traffic light signal",
    labelMs: "Gagal mematuhi lampu isyarat merah",
    ref: "Mata Demerit KEJARA",
  },
  {
    id: "p-plate",
    points: 10,
    labelEn: "Failing to display 'P' plates front and rear (PDL holder)",
    labelMs: "Gagal mempamerkan plat 'P' di hadapan dan belakang (pemegang PDL)",
    ref: "Syarat Lesen Percubaan (PDL)",
    pdlOnly: true,
  },
  {
    id: "speed-26-40",
    points: 8,
    labelEn: "Exceeding speed limit by 26 km/h to 40 km/h",
    labelMs: "Melebihi had laju antara 26 km/j hingga 40 km/j",
    ref: "Mata Demerit KEJARA",
  },
  {
    id: "double-line",
    points: 8,
    labelEn: "Overtaking on a double continuous white line",
    labelMs: "Memotong di garisan putih berkembar bersambung",
    ref: "Garisan Berkembar Bersambung",
  },
  {
    id: "phone-driving",
    points: 8,
    labelEn: "Using a hand-held mobile phone while driving",
    labelMs: "Menggunakan telefon bimbit tanpa alat bebas tangan semasa memandu",
    ref: "Larangan Telefon Bimbit",
  },
  {
    id: "speed-1-25",
    points: 6,
    labelEn: "Exceeding speed limit by 1 km/h to 25 km/h",
    labelMs: "Melebihi had laju antara 1 km/j hingga 25 km/j",
    ref: "Mata Demerit KEJARA",
  },
  {
    id: "bald-tyre",
    points: 5,
    labelEn: "Driving with bald tyres (<1.6 mm tread) or without seatbelt",
    labelMs: "Memandu dengan tayar botak (<1.6 mm bunga) atau tanpa tali pinggang keledar",
    ref: "Syarat Kelayakan Kenderaan",
  },
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
      "Wait behind the stop line before the yellow box until your exit lane is completely clear (unless turning right and only blocked by oncoming traffic)",
      "Drive into the middle of the yellow box immediately while the light is green so you do not miss your turn",
      "Enter the yellow box and sound your horn continuously to clear the lane ahead",
    ],
    optionsMs: [
      "Tunggu di belakang garisan berhenti sebelum petak kuning sehingga lorong keluar anda lapang sepenuhnya (kecuali membelok kanan dan hanya terhalang oleh trafik bertentangan)",
      "Pandu masuk ke tengah petak kuning serta-merta semasa lampu hijau supaya tidak terlepas giliran",
      "Masuk ke petak kuning dan bunyikan hon secara berterusan untuk mengosongkan lorong di hadapan",
    ],
    correctIndex: 0,
    explanationEn:
      "Stopping on a yellow box junction obstructs cross-traffic and is a traffic offence. Never enter unless your exit road is clear, except when waiting to turn right and prevented only by oncoming traffic.",
    explanationMs:
      "Berhenti di atas petak kuning menghalang trafik lintasan dan merupakan kesalahan jalan raya. Jangan masuk melainkan lorong keluar anda lapang sepenuhnya, kecuali ketika menunggu untuk membelok ke kanan.",
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

  // Lab 2: KEJARA & Compound state
  const [driverType, setDriverType] = useState<"pdl" | "cdl">("pdl");
  const [vehicleCategory, setVehicleCategory] = useState<"car" | "commercial">("car");
  const [paymentTier, setPaymentTier] = useState<"1-15" | "16-30" | "31-60">("1-15");
  const [selectedOffences, setSelectedOffences] = useState<string[]>(["speed-26-40"]);

  // Lab 3: Transmission (DA vs D) state
  const [transTrack, setTransTrack] = useState<"DA" | "D">("DA");
  const [autoGear, setAutoGear] = useState<"P" | "R" | "N" | "D" | "3" | "2" | "1">("P");
  const [manualSpeedIndex, setManualSpeedIndex] = useState<number>(0);

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

  const toggleOffence = (id: string) => {
    setSelectedOffences((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const activeOffences = KEJARA_OFFENCES.filter(
    (o) => selectedOffences.includes(o.id) && (!o.pdlOnly || driverType === "pdl"),
  );
  const totalPoints = activeOffences.reduce((sum, item) => sum + item.points, 0);
  const baseCompound = paymentTier === "1-15" ? 150 : paymentTier === "16-30" ? 200 : 300;
  const perOffenceCompound = vehicleCategory === "commercial" ? Math.min(300, baseCompound + 50) : baseCompound;

  const AUTO_GEAR_DETAILS: Record<
    "P" | "R" | "N" | "D" | "3" | "2" | "1",
    {
      nameEn: string;
      nameMs: string;
      shiftLockEn: string;
      shiftLockMs: string;
      usageEn: string;
      usageMs: string;
      speedCap: string;
    }
  > = {
    P: {
      nameEn: "P · Park (Transmission locked)",
      nameMs: "P · Parkir (Transmisi dikunci)",
      shiftLockEn: "Foot brake + Shift-lock release button required",
      shiftLockMs: "Brek kaki + butang pelepas Shift-lock diperlukan",
      usageEn: "Used when parked with handbrake engaged. Engine can be started safely in P.",
      usageMs: "Digunakan semasa parkir dengan brek tangan ditarik. Enjin boleh dihidupkan dalam P.",
      speedCap: "0 km/h (Stationary only)",
    },
    R: {
      nameEn: "R · Reverse",
      nameMs: "R · Undur",
      shiftLockEn: "Complete stop + Shift-lock release button required",
      shiftLockMs: "Berhenti sepenuhnya + butang Shift-lock diperlukan",
      usageEn: "Reverses the car. Activates white reverse lights and reverse buzzer.",
      usageMs: "Mengundurkan kereta. Mengaktifkan lampu undur putih dan pembaz undur.",
      speedCap: "Reverse maneuvering only",
    },
    N: {
      nameEn: "N · Neutral (Freewheel)",
      nameMs: "N · Neutral (Bebas)",
      shiftLockEn: "No engine power transmitted to wheels",
      shiftLockMs: "Tiada kuasa enjin dihantar ke roda",
      usageEn: "Used at long traffic stops with handbrake, or if engine restarts while rolling.",
      usageMs: "Digunakan semasa berhenti lama dengan brek tangan, atau menghidupkan semula enjin.",
      speedCap: "Never coast downhill in N",
    },
    D: {
      nameEn: "D · Drive (Normal forward 1st-4th)",
      nameMs: "D · Pemanduan normal ke hadapan",
      shiftLockEn: "Shift freely between N and D",
      shiftLockMs: "Anjakan bebas antara N dan D",
      usageEn: "Standard forward driving on level roads and expressways; shifts automatically across all ratios.",
      usageMs: "Pemanduan normal di jalan rata dan lebuh raya; menukar gear secara automatik.",
      speedCap: "Up to statutory speed limit (110 km/h)",
    },
    "3": {
      nameEn: "3 · Moderate gradient / overtaking",
      nameMs: "3 · Bukit sederhana / memotong",
      shiftLockEn: "Engine braking locks out 4th overdrive gear",
      shiftLockMs: "Brek enjin menghalang gear ke-4",
      usageEn: "Provides stronger pulling power on moderate hills and engine braking on gentle descents.",
      usageMs: "Memberi kuasa tarikan di bukit sederhana dan brek enjin semasa menuruni curam sederhana.",
      speedCap: "Max ~60 km/h",
    },
    "2": {
      nameEn: "2 · Steep hill climb & descent",
      nameMs: "2 · Mendaki & menuruni bukit curam",
      shiftLockEn: "Shift-lock button required when shifting down to 2",
      shiftLockMs: "Butang Shift-lock diperlukan apabila turun ke 2",
      usageEn: "Keeps transmission in 2nd gear for steep hills so brakes do not overheat.",
      usageMs: "Mengekalkan gear ke-2 di bukit curam supaya brek kaki tidak menjadi terlalu panas.",
      speedCap: "Max 40 km/h",
    },
    "1": {
      nameEn: "1 / L · Extreme gradient low gear",
      nameMs: "1 / L · Gear rendah kecuraman melampau",
      shiftLockEn: "Shift-lock button required; maximum engine braking",
      shiftLockMs: "Butang Shift-lock diperlukan; brek enjin maksimum",
      usageEn: "Locks transmission in 1st gear for very steep climbs, deep mud, or severe descents.",
      usageMs: "Mengunci transmisi dalam gear 1 untuk pendakian atau penurunan yang sangat curam.",
      speedCap: "Max 10-20 km/h",
    },
  };

  const MANUAL_SPEED_BANDS = [
    {
      band: "0 - 20 km/h",
      gear: "Gear 1",
      torqueEn: "Maximum torque · Move off from stationary & steep hill climb",
      torqueMs: "Kuasa tarikan maksimum · Mula bergerak dari pegun & mendaki bukit curam",
      pedalRuleEn: "Left foot controls clutch to biting point (titik pergerakan); right foot applies gentle accelerator.",
      pedalRuleMs: "Kaki kiri mengawal cekam ke titik pergerakan; kaki kanan menekan pemecut secara lembut.",
    },
    {
      band: "15 - 35 km/h",
      gear: "Gear 2",
      torqueEn: "Low-speed turning, junctions & steep hill descent",
      torqueMs: "Membelok kelajuan rendah, persimpangan & menuruni bukit curam",
      pedalRuleEn: "Release accelerator, press clutch fully with left foot, shift to 2nd, release clutch smoothly.",
      pedalRuleMs: "Lepaskan pemecut, tekan cekam sepenuhnya dengan kaki kiri, tukar ke Gear 2, lepas cekam perlahan.",
    },
    {
      band: "30 - 45 km/h",
      gear: "Gear 3",
      torqueEn: "Urban traffic flow, gentle gradients & overtaking at moderate speed",
      torqueMs: "Aliran trafik bandar, bukit landai & memotong pada kelajuan sederhana",
      pedalRuleEn: "Keep left foot off the clutch pedal (rest on floor) once gear is engaged.",
      pedalRuleMs: "Jauhkan kaki kiri daripada pedal cekam (letak di lantai) sebaik sahaja gear masuk.",
    },
    {
      band: "40 - 65 km/h",
      gear: "Gear 4",
      torqueEn: "Steady arterial road cruising on level terrain",
      torqueMs: "Pemanduan lancar di jalan utama yang rata",
      pedalRuleEn: "Smooth progression; downshift to Gear 3 if speed drops below 35 km/h.",
      pedalRuleMs: "Pertukaran lancar; turun ke Gear 3 jika kelajuan jatuh di bawah 35 km/j.",
    },
    {
      band: "60 km/h and above",
      gear: "Gear 5",
      torqueEn: "Highway & expressway cruising · Fuel-saving overdrive ratio",
      torqueMs: "Pemanduan lebuh raya · Nisbah penjimatan bahan api",
      pedalRuleEn: "Used on trunk roads (90 km/h) and expressways (110 km/h) for low engine RPM.",
      pedalRuleMs: "Digunakan di jalan persekutuan (90 km/j) dan lebuh raya (110 km/j) untuk RPM rendah.",
    },
  ];

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
                labelEn: "2. KEJARA & compound",
                labelMs: "2. KEJARA & kompaun",
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
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    {lang === "en" ? "Licence status" : "Status lesen"}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["pdl", "cdl"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDriverType(type)}
                        aria-pressed={driverType === type}
                        className={`px-2.5 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                          driverType === type
                            ? "bg-brand text-brand-foreground border-foreground"
                            : "bg-background text-foreground border-border"
                        }`}
                      >
                        {type === "pdl" ? "PDL ('P')" : "CDL"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    {lang === "en" ? "Vehicle category" : "Kategori kenderaan"}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["car", "commercial"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setVehicleCategory(cat)}
                        aria-pressed={vehicleCategory === cat}
                        className={`px-2.5 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                          vehicleCategory === cat
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border"
                        }`}
                      >
                        {cat === "car"
                          ? lang === "en"
                            ? "Car / Bike"
                            : "Kereta / Moto"
                          : lang === "en"
                            ? "Lorry / Bus"
                            : "Lori / Bas"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    {lang === "en" ? "Payment window" : "Tempoh bayaran"}
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(["1-15", "16-30", "31-60"] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setPaymentTier(tier)}
                        aria-pressed={paymentTier === tier}
                        className={`px-2 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                          paymentTier === tier
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border"
                        }`}
                      >
                        {tier}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    {lang === "en"
                      ? "Toggle scheduled offences to simulate KEJARA demerit points"
                      : "Pilih kesalahan terjadual untuk mengira mata demerit KEJARA"}
                  </span>
                  {selectedOffences.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedOffences([])}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {lang === "en" ? "Reset offences" : "Set semula"}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {KEJARA_OFFENCES.map((offence) => {
                    const disabled = offence.pdlOnly && driverType !== "pdl";
                    const checked = selectedOffences.includes(offence.id) && !disabled;
                    return (
                      <button
                        key={offence.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleOffence(offence.id)}
                        aria-pressed={checked}
                        className={`tile p-3 text-left flex items-start justify-between gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          checked ? "tile-selected" : ""
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-foreground leading-snug">
                            {lang === "en" ? offence.labelEn : offence.labelMs}
                          </div>
                          <div className="text-[0.8125rem] text-muted-foreground mt-1">{offence.ref}</div>
                        </div>
                        <span className="pill pill-danger shrink-0">+{offence.points} pts</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* KEJARA Live Meter & Legal Consequence */}
            <div className="lg:col-span-5 panel p-4 sm:p-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">
                    {lang === "en" ? "Accumulated KEJARA points" : "Jumlah mata demerit KEJARA"}
                  </span>
                  <div className="type-figure text-3xl mt-1">
                    {totalPoints}{" "}
                    <span className="text-base font-normal text-muted-foreground">/ 20 pts</span>
                  </div>
                </div>
                <span
                  className={`pill ${
                    totalPoints >= 20
                      ? "pill-danger"
                      : totalPoints >= 10
                        ? "pill-warning"
                        : "pill-success"
                  }`}
                >
                  {totalPoints >= 20
                    ? driverType === "pdl"
                      ? lang === "en"
                        ? "PDL revoked!"
                        : "PDL dibatalkan!"
                      : lang === "en"
                        ? "CDL suspended!"
                        : "CDL digantung!"
                    : lang === "en"
                      ? "Below 20-pt threshold"
                      : "Di bawah had 20 mata"}
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    totalPoints >= 20
                      ? "bg-destructive"
                      : totalPoints >= 10
                        ? "bg-warning"
                        : "bg-success"
                  }`}
                  style={{ width: `${Math.min(100, (totalPoints / 20) * 100)}%` }}
                />
              </div>

              <div className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-2 text-xs leading-relaxed">
                <div className="font-bold text-foreground">
                  {driverType === "pdl"
                    ? lang === "en"
                      ? "Probationary ('P') driver rule (20 points):"
                      : "Peraturan pemandu Percubaan ('P') (20 mata):"
                    : lang === "en"
                      ? "Competent (CDL) driver rule (20-point blocks):"
                      : "Peraturan pemandu Kompeten (CDL) (blok 20 mata):"}
                </div>
                <p className="text-muted-foreground">
                  {driverType === "pdl"
                    ? lang === "en"
                      ? "Accumulating 20 or more demerit points during the 2-year probationary period results in immediate licence revocation and a 12-month disqualification from driving."
                      : "Mengumpul 20 mata demerit atau lebih dalam tempoh percubaan 2 tahun menyebabkan lesen PDL dibatalkan serta-merta dan dilarang memandu selama 12 bulan."
                    : lang === "en"
                      ? "1st 20 points: 6-8 months suspension. 2nd 20 points: 8-10 months suspension. 3rd 20 points within 5 years: 10-12 months suspension + notice of licence revocation. Bonus: 24 clean months deducts 7 points."
                      : "20 mata pertama: gantung 6-8 bulan. 20 mata kedua: gantung 8-10 bulan. 20 mata ketiga dalam 5 tahun: gantung 10-12 bulan + notis pembatalan lesen. Bonus: 24 bulan bersih menolak 7 mata."}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">
                    {lang === "en"
                      ? `APJ 1987 compound rate (Days ${paymentTier})`
                      : `Kadar kompaun APJ 1987 (Hari ${paymentTier})`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {vehicleCategory === "commercial"
                      ? lang === "en"
                        ? "Includes +RM50 commercial vehicle surcharge (capped at RM300)"
                        : "Termasuk surcaj +RM50 kenderaan perdagangan (maksimum RM300)"
                      : lang === "en"
                        ? "Standard motorcar / motorcycle rate"
                        : "Kadar standard motokar / motosikal"}
                  </span>
                </div>
                <div className="type-figure text-xl text-foreground">RM{perOffenceCompound}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* LAB 3: CLASS DA (AUTOMATIC) VS CLASS D (MANUAL) TRANSMISSION WORKBENCH */}
        {activeLab === "transmission" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="pt-4 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-xl border border-border p-1 bg-muted/40">
                <button
                  type="button"
                  onClick={() => setTransTrack("DA")}
                  aria-pressed={transTrack === "DA"}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    transTrack === "DA"
                      ? "bg-brand text-brand-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lang === "en"
                    ? "Class DA · Automatic (No clutch pedal)"
                    : "Kelas DA · Automatik (Tanpa pedal cekam)"}
                </button>
                <button
                  type="button"
                  onClick={() => setTransTrack("D")}
                  aria-pressed={transTrack === "D"}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    transTrack === "D"
                      ? "bg-brand text-brand-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lang === "en"
                    ? "Class D · Manual (With clutch pedal)"
                    : "Kelas D · Manual (Dengan pedal cekam)"}
                </button>
              </div>
              <span className="pill pill-neutral">
                {transTrack === "DA"
                  ? (lang === "en" ? "Class DA Automatic Syllabus" : "Sukatan Automatik Kelas DA")
                  : (lang === "en" ? "Class D Manual Syllabus" : "Sukatan Manual Kelas D")}
              </span>
            </div>

            {transTrack === "DA" ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-5 panel p-4 space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground">
                    {lang === "en"
                      ? "Select an automatic selector position to inspect its speed cap & shift-lock rule:"
                      : "Pilih kedudukan tuil gear automatik untuk melihat had kelajuan & peraturan Shift-lock:"}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {(["P", "R", "N", "D", "3", "2", "1"] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setAutoGear(pos)}
                        aria-pressed={autoGear === pos}
                        className={`h-12 rounded-xl font-heading font-bold text-base border cursor-pointer transition-colors ${
                          autoGear === pos
                            ? "bg-brand text-brand-foreground border-foreground"
                            : "bg-background text-foreground border-border hover:border-foreground/40"
                        }`}
                      >
                        {pos === "1" ? "1/L" : pos}
                      </button>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5 text-xs">
                    <div className="font-bold text-foreground">
                      {lang === "en"
                        ? "Right-foot-only pedal discipline:"
                        : "Disiplin kaki kanan sahaja:"}
                    </div>
                    <p className="text-muted-foreground">
                      {lang === "en"
                        ? "A Class DA automatic car has only 2 foot pedals (foot brake on the left, accelerator on the right). Both pedals must be operated exclusively with the RIGHT foot; the left foot rests on the footrest at all times."
                        : "Kereta automatik Kelas DA hanya mempunyai 2 pedal kaki (brek kaki di kiri, pemecut di kanan). Kedua-dua pedal wajib dikendalikan oleh KAKI KANAN sahaja; kaki kiri direhatkan di lantai sepanjang masa."}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-7 panel p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-base font-bold font-heading">
                      {lang === "en"
                        ? AUTO_GEAR_DETAILS[autoGear].nameEn
                        : AUTO_GEAR_DETAILS[autoGear].nameMs}
                    </h3>
                    <span className="pill pill-info">{AUTO_GEAR_DETAILS[autoGear].speedCap}</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {lang === "en"
                      ? AUTO_GEAR_DETAILS[autoGear].usageEn
                      : AUTO_GEAR_DETAILS[autoGear].usageMs}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs">
                      <span className="font-semibold text-foreground block">
                        {lang === "en" ? "Shift-lock requirement:" : "Keperluan Shift-lock:"}
                      </span>
                      <span className="text-muted-foreground">
                        {lang === "en"
                          ? AUTO_GEAR_DETAILS[autoGear].shiftLockEn
                          : AUTO_GEAR_DETAILS[autoGear].shiftLockMs}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs">
                      <span className="font-semibold text-foreground block">
                        {lang === "en" ? "Class DA Tanjakan (Ramp) test:" : "Ujian Tanjakan Kelas DA:"}
                      </span>
                      <span className="text-muted-foreground">
                        {lang === "en"
                          ? "Stop with front wheels on the yellow line on the ramp, apply the handbrake firmly and select N or P. To move off, select D, apply gentle accelerator pressure while releasing the handbrake smoothly so the car moves forward without rolling back."
                          : "Berhenti dengan roda hadapan di atas garisan kuning tanjakan, tarik brek tangan dengan kemas dan pilih N atau P. Untuk bergerak, pilih D, tekan pemecut secara terkawal sambil melepaskan brek tangan dengan lancar supaya kenderaan mendaki tanpa berundur."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-5 panel p-4 space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground">
                    {lang === "en"
                      ? "Select a road speed band to match the Class D manual gear:"
                      : "Pilih julat kelajuan untuk memadankan gear manual Kelas D:"}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {MANUAL_SPEED_BANDS.map((band, idx) => (
                      <button
                        key={band.band}
                        type="button"
                        onClick={() => setManualSpeedIndex(idx)}
                        aria-pressed={manualSpeedIndex === idx}
                        className={`tile p-2.5 px-3 text-left flex items-center justify-between cursor-pointer ${
                          manualSpeedIndex === idx ? "tile-selected" : ""
                        }`}
                      >
                        <span className="type-figure text-sm">{band.band}</span>
                        <span className="pill pill-brand">{band.gear}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7 panel p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold font-heading">
                      {MANUAL_SPEED_BANDS[manualSpeedIndex].gear} ·{" "}
                      {MANUAL_SPEED_BANDS[manualSpeedIndex].band}
                    </h3>
                    <span className="pill pill-info">5-Speed H-Pattern</span>
                  </div>
                  <p className="text-sm text-foreground/90">
                    {lang === "en"
                      ? MANUAL_SPEED_BANDS[manualSpeedIndex].torqueEn
                      : MANUAL_SPEED_BANDS[manualSpeedIndex].torqueMs}
                  </p>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-1">
                    <span className="font-semibold text-foreground block">
                      {lang === "en" ? "3-pedal coordination:" : "Koordinasi 3 pedal:"}
                    </span>
                    <p className="text-muted-foreground">
                      {lang === "en"
                        ? MANUAL_SPEED_BANDS[manualSpeedIndex].pedalRuleEn
                        : MANUAL_SPEED_BANDS[manualSpeedIndex].pedalRuleMs}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-1">
                    <span className="font-semibold text-foreground block">
                      {lang === "en"
                        ? "Class D Tanjakan (Hill-start) test:"
                        : "Ujian Tanjakan Kelas D:"}
                    </span>
                    <p className="text-muted-foreground">
                      {lang === "en"
                        ? "3-minute time limit on the ramp. Stop with front tyres on the yellow line and apply the handbrake firmly. Select Gear 1, build engine RPM, raise the clutch smoothly to the biting point (titik pergerakan) until the engine note deepens, then release the handbrake so the car moves forward without rolling back."
                        : "Had masa 3 minit di tanjakan. Berhenti dengan tayar hadapan di atas garisan kuning dan tarik brek tangan dengan kemas. Pilih Gear 1, tingkatkan RPM enjin, lepaskan cekam perlahan-lahan ke titik pergerakan sehingga bunyi enjin berubah, kemudian lepaskan brek tangan supaya kenderaan mendaki ke hadapan tanpa berundur."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* LAB 4: ROAD LAW SCENARIO JUDGE */}
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

