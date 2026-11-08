import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Gauge,
  Headlights,
  ShieldWarning,
  Users,
  Wrench,
} from "@/components/ui/icons";

interface SafetyPrinciplesLabProps {
  lang: "en" | "bm";
  onScenarioSolved?: (id: string) => void;
}

interface SpeedSpec {
  speedKmh: number;
  thinkingMeters: number;
  brakingDryMeters: number;
  refNoteEn: string;
  refNoteMs: string;
}

const STOPPING_SPEEDS: SpeedSpec[] = [
  {
    speedKmh: 30,
    thinkingMeters: 6,
    brakingDryMeters: 6,
    refNoteEn: "Residential / school zone speed (total 12 m dry = ~3 car lengths)",
    refNoteMs: "Kelajuan kawasan perumahan / sekolah (jumlah 12 m kering = ~3 panjang kereta)",
  },
  {
    speedKmh: 50,
    thinkingMeters: 9,
    brakingDryMeters: 14,
    refNoteEn: "Urban road speed (total 23 m dry = ~5.5 car lengths)",
    refNoteMs: "Kelajuan jalan bandar (jumlah 23 m kering = ~5.5 panjang kereta)",
  },
  {
    speedKmh: 60,
    thinkingMeters: 12,
    brakingDryMeters: 20,
    refNoteEn: "City arterial speed (total 32 m dry = ~7.5 car lengths)",
    refNoteMs: "Kelajuan jalan utama bandar (jumlah 32 m kering = ~7.5 panjang kereta)",
  },
  {
    speedKmh: 80,
    thinkingMeters: 15,
    brakingDryMeters: 38,
    refNoteEn: "Heavy vehicle expressway speed (total 53 m dry = ~12.5 car lengths)",
    refNoteMs: "Had laju kenderaan berat di lebuh raya (jumlah 53 m kering = ~12.5 panjang kereta)",
  },
  {
    speedKmh: 90,
    thinkingMeters: 18,
    brakingDryMeters: 45,
    refNoteEn: "National federal / state road limit (total 63 m dry = ~15 car lengths)",
    refNoteMs: "Had laju jalan persekutuan / negeri (jumlah 63 m kering = ~15 panjang kereta)",
  },
  {
    speedKmh: 110,
    thinkingMeters: 21,
    brakingDryMeters: 75,
    refNoteEn: "National expressway limit (total 96 m dry = ~22 car lengths)",
    refNoteMs: "Had laju lebuh raya kebangsaan (jumlah 96 m kering = ~22 panjang kereta)",
  },
];

interface TyreDiagnostic {
  id: "normal" | "over" | "under" | "alignment";
  titleEn: string;
  titleMs: string;
  wearPatternEn: string;
  wearPatternMs: string;
  causeEn: string;
  causeMs: string;
  fixEn: string;
  fixMs: string;
}

const TYRE_DIAGNOSTICS: TyreDiagnostic[] = [
  {
    id: "normal",
    titleEn: "Even tread wear across full width",
    titleMs: "Kehausan bunga tayar sekata",
    wearPatternEn: "Uniform tread depth >= 1.6 mm across centre and both shoulders",
    wearPatternMs: "Kedalaman bunga sekata >= 1.6 mm di bahagian tengah dan kedua-dua bahu tayar",
    causeEn: "Correct cold tyre inflation pressure (180-220 kPa / 26-32 psi) and balanced wheel alignment (`KPP_DA_Auto.pdf` p. 166).",
    causeMs: "Tekanan angin tayar sejuk yang betul (180-220 kPa / 26-32 psi) dan penjajaran roda seimbang (`KPP_DA_Auto.pdf` m/s 166).",
    fixEn: "Rotate tyres every 8,000-10,000 km and check pressure weekly when tyres are cold.",
    fixMs: "Giliskan tayar setiap 8,000-10,000 km dan periksa tekanan setiap minggu semasa tayar sejuk.",
  },
  {
    id: "over",
    titleEn: "Centre tread worn down rapidly",
    titleMs: "Bunga tayar haus di bahagian tengah sahaja",
    wearPatternEn: "Centre strip is smooth while both outer edges still have deep tread",
    wearPatternMs: "Jalur tengah haus licin manakala kedua-dua bahu luar masih tebal",
    causeEn: "Over-inflation (terlalu banyak angin). Excess air pressure crowns the centre of the tyre (`KPP_DA_Auto.pdf` p. 167).",
    causeMs: "Tekanan angin berlebihan (over-inflation) menyebabkan bahagian tengah tayar membonjol (`KPP_DA_Auto.pdf` m/s 167).",
    fixEn: "Bleed air down to the manufacturer's recommended cold kPa/psi specification on the door-jamb placard.",
    fixMs: "Kurangkan tekanan angin mengikut spesifikasi kPa/psi pengeluar pada pelekat tiang pintu.",
  },
  {
    id: "under",
    titleEn: "Both outer shoulders worn down",
    titleMs: "Kedua-dua bahagian tepi (bahu) tayar haus",
    wearPatternEn: "Left and right edges are worn smooth while the centre remains deeper",
    wearPatternMs: "Bahu kiri dan kanan haus manakala bahagian tengah masih mempunyai bunga",
    causeEn: "Under-inflation (kurang tekanan angin). Low pressure causes the tyre sidewalls to flex and load the shoulders (`KPP_DA_Auto.pdf` p. 167).",
    causeMs: "Kekurangan tekanan angin (under-inflation) menyebabkan beban tertumpu pada kedua-dua bahu tayar (`KPP_DA_Auto.pdf` m/s 167).",
    fixEn: "Inflate cold tyres to 180-220 kPa (26-32 psi) and inspect the valve stem or tread for slow punctures.",
    fixMs: "Pam tayar sejuk kepada 180-220 kPa (26-32 psi) dan periksa injap atau kebocoran perlahan.",
  },
  {
    id: "alignment",
    titleEn: "One side (inner or outer edge) feathered",
    titleMs: "Haus pada sebelah bahagian tepi sahaja",
    wearPatternEn: "Only one shoulder is worn down unevenly",
    wearPatternMs: "Hanya sebelah bahu tayar sahaja yang haus tidak sekata",
    causeEn: "Faulty wheel alignment (camber/toe misalignment) or worn suspension ball-joints (`KPP_DA_Auto.pdf` p. 167).",
    causeMs: "Penjajaran roda (wheel alignment) lari atau komponen gantungan/stereng longgar (`KPP_DA_Auto.pdf` m/s 167).",
    fixEn: "Perform computerised wheel alignment and suspension inspection before fitting a replacement tyre.",
    fixMs: "Lakukan penjajaran roda berkomputer dan pemeriksaan gantungan sebelum menukar tayar baharu.",
  },
];

interface CrsProfile {
  id: string;
  profileEn: string;
  profileMs: string;
  specsEn: string;
  specsMs: string;
  correctOptionIndex: number;
  optionsEn: string[];
  optionsMs: string[];
  ruleEn: string;
  ruleMs: string;
}

const CRS_PROFILES: CrsProfile[] = [
  {
    id: "crs-infant",
    profileEn: "Infant (Newborn to 12-15 months)",
    profileMs: "Bayi (Baru lahir hingga 12-15 bulan)",
    specsEn: "Weight up to 13 kg · Fragile neck & spine",
    specsMs: "Berat sehingga 13 kg · Leher & tulang belakang masih lembut",
    correctOptionIndex: 0,
    optionsEn: [
      "Group 0/0+ rear-facing infant carrier; front airbag MUST be switched OFF if placed in front",
      "Forward-facing booster cushion with adult diagonal seatbelt",
      "Held firmly on an adult passenger's lap in the rear seat",
    ],
    optionsMs: [
      "Kerusi bayi Kumpulan 0/0+ menghadap ke belakang; beg udara hadapan WAJIB dimatikan jika dipasang di hadapan",
      "Kusyen penggalak (booster) menghadap ke hadapan dengan tali pinggang dewasa",
      "Dipangku dengan kemas di atas riba penumpang dewasa di tempat duduk belakang",
    ],
    ruleEn:
      "Infants up to 13 kg must ride in a rear-facing carrier so deceleration forces are distributed across the back and head. Never place a rear-facing seat in front of an active SRS airbag (`KPP_DA_Auto.pdf` pp. 137-140).",
    ruleMs:
      "Bayi sehingga 13 kg wajib menggunakan kerusi bayi menghadap ke belakang supaya daya brek diagihkan pada belakang badan. Jangan sekali-kali meletakkan kerusi menghadap belakang di hadapan beg udara SRS aktif (`KPP_DA_Auto.pdf` m/s 137-140).",
  },
  {
    id: "crs-toddler",
    profileEn: "Toddler (9 kg to 18 kg · ~1 to 4 years)",
    profileMs: "Kanak-kanak kecil (9 kg hingga 18 kg · ~1 hingga 4 tahun)",
    specsEn: "Weight 9-18 kg · Sitting upright independently",
    specsMs: "Berat 9-18 kg · Boleh duduk tegak sendiri",
    correctOptionIndex: 0,
    optionsEn: [
      "Group I child safety seat secured via ISOFIX or seatbelt in the rear passenger seat",
      "Standard adult 3-point seatbelt without any child seat",
      "Standing between the two front bucket seats",
    ],
    optionsMs: [
      "Kerusi keselamatan kanak-kanak Kumpulan I dengan abah-abah (ISOFIX) di tempat duduk belakang",
      "Tali pinggang keledar dewasa 3 penjuru tanpa sebarang kerusi kanak-kanak",
      "Berdiri di ruang tengah antara dua kerusi hadapan",
    ],
    ruleEn:
      "Children weighing 9-18 kg require a Group I child seat with an integrated 5-point harness anchored securely in the rear cabin (`KPP_DA_Auto.pdf` p. 139).",
    ruleMs:
      "Kanak-kanak seberat 9-18 kg memerlukan kerusi keselamatan Kumpulan I dengan abah-abah bersepadu yang dipasang kemas di tempat duduk belakang (`KPP_DA_Auto.pdf` m/s 139).",
  },
  {
    id: "crs-booster",
    profileEn: "Older child (Under 135 cm, under 36 kg, under 12 years)",
    profileMs: "Kanak-kanak (< 135 cm, < 36 kg, bawah 12 tahun)",
    specsEn: "Weight 15-36 kg · Height below 135 cm",
    specsMs: "Berat 15-36 kg · Ketinggian kurang daripada 135 cm",
    correctOptionIndex: 0,
    optionsEn: [
      "Group II/III booster seat so the diagonal belt crosses the collarbone/chest and lap belt sits across the pelvis",
      "Tuck the diagonal shoulder belt behind the child's back so it does not touch the neck",
      "Share a single adult seatbelt between two children sitting side by side",
    ],
    optionsMs: [
      "Kerusi penggalak (booster) Kumpulan II/III supaya tali pinggang melintasi tulang selangka/dada dan pelvis",
      "Selitkan tali pinggang bahu di belakang badan kanak-kanak supaya tidak terkena leher",
      "Kongsi satu tali pinggang keledar dewasa untuk dua orang kanak-kanak",
    ],
    ruleEn:
      "Mandatory CRS rules in Malaysia cover children under 135 cm, under 36 kg, and under 12 years old. A booster elevates the child so the adult belt rests on strong pelvic and shoulder bones rather than the neck and abdomen (`KPP_DA_Auto.pdf` p. 139).",
    ruleMs:
      "Peraturan wajib CRS di Malaysia meliputi kanak-kanak di bawah 135 cm, di bawah 36 kg, dan berumur bawah 12 tahun. Kerusi penggalak memastikan tali pinggang terletak pada tulang bahu dan pelvis, bukan pada leher atau perut (`KPP_DA_Auto.pdf` m/s 139).",
  },
  {
    id: "crs-headrest",
    profileEn: "Adult driver & passenger headrest adjustment",
    profileMs: "Pelarasan penyandar kepala (headrest) pemandu & penumpang dewasa",
    specsEn: "Whiplash neck injury prevention in rear-end collisions",
    specsMs: "Pencegahan kecederaan leher (whiplash) apabila dilanggar dari belakang",
    correctOptionIndex: 0,
    optionsEn: [
      "Centre of headrest aligned with eye/ear level; back-of-head gap <= 3.5 inches (9-10 cm)",
      "Lowest possible position behind the shoulder blades with a 25 cm gap",
      "Remove the headrest completely to improve rear-window visibility",
    ],
    optionsMs: [
      "Bahagian tengah penyandar kepala selari dengan paras mata/telinga; jarak belakang kepala <= 3.5 inci (9-10 cm)",
      "Kedudukan paling rendah di belakang tulang belikat dengan jarak 25 cm",
      "Tanggalkan penyandar kepala sepenuhnya untuk meluaskan pandangan cermin belakang",
    ],
    ruleEn:
      "The headrest is a safety restraint, not a pillow. Align its centre with eye/ear level and keep the gap behind your head within 3.5 inches (9-10 cm) to prevent severe neck hyperextension (`KPP_DA_Auto.pdf` p. 132).",
    ruleMs:
      "Penyandar kepala ialah alat keselamatan, bukan bantal rehat. Laraskan bahagian tengahnya selari dengan paras mata/telinga dan pastikan jarak belakang kepala tidak melebihi 3.5 inci (9-10 cm) (`KPP_DA_Auto.pdf` m/s 132).",
  },
];

interface HazardDrill {
  id: string;
  titleEn: string;
  titleMs: string;
  ref: string;
  scenarioEn: string;
  scenarioMs: string;
  optionsEn: string[];
  optionsMs: string[];
  correctIdx: number;
  feedbackEn: string;
  feedbackMs: string;
}

const HAZARD_DRILLS: HazardDrill[] = [
  {
    id: "drill-cito",
    titleEn: "C.I.T.O. lane-change & overtaking sequence",
    titleMs: "Urutan menukar lorong & memotong C.I.T.O.",
    ref: "KPP_General.pdf p. 102",
    scenarioEn: "You want to move into the right lane to overtake a slower lorry. What is the exact C.I.T.O. order?",
    scenarioMs: "Anda ingin bergerak ke lorong kanan untuk memotong lori yang perlahan. Apakah urutan C.I.T.O. yang betul?",
    optionsEn: [
      "1. Cermin (Mirrors) -> 2. Isyarat (Signal >=3s) -> 3. Titik Buta (Head-check blind spot) -> 4. Olah Gerak (Maneuver)",
      "1. Olah Gerak (Turn wheel) -> 2. Isyarat (Signal) -> 3. Cermin (Mirrors) -> 4. Titik Buta (Blind spot)",
      "1. Isyarat (Signal) -> 2. Olah Gerak (Turn wheel immediately) without checking mirrors or blind spot",
    ],
    optionsMs: [
      "1. Cermin -> 2. Isyarat (>=3 saat) -> 3. Titik Buta (Toledo bahu) -> 4. Olah Gerak (Gerakkan stereng)",
      "1. Olah Gerak -> 2. Isyarat -> 3. Cermin -> 4. Titik Buta",
      "1. Isyarat -> 2. Olah Gerak serta-merta tanpa memeriksa cermin atau titik buta",
    ],
    correctIdx: 0,
    feedbackEn:
      "C.I.T.O. ensures you assess rear traffic in your mirrors first, warn others with your indicator for at least 3 seconds, verify the side blind spot by glancing over your shoulder, and only then steer smoothly.",
    feedbackMs:
      "C.I.T.O. memastikan anda menilai trafik di cermin dahulu, memberi amaran isyarat sekurang-kurangnya 3 saat, menoleh sedikit untuk memeriksa titik buta, dan barulah menggerakkan stereng dengan lancar.",
  },
  {
    id: "drill-under-oversteer",
    titleEn: "Understeer vs Oversteer cornering recovery",
    titleMs: "Pemulihan Understeer vs Oversteer di selekoh",
    ref: "KPP_General.pdf pp. 93-95",
    scenarioEn: "While cornering on a slippery road, the front tyres lose grip and push wide toward the outer kerb (Understeer). How do you recover?",
    scenarioMs: "Semasa membelok di jalan licin, tayar hadapan hilang cengkaman dan tersasar melebar ke luar selekoh (Understeer). Bagaimanakah cara memulihkannya?",
    optionsEn: [
      "Ease off the accelerator smoothly to shift weight back onto the front tyres and unwind the steering slightly until grip returns",
      "Stamp hard on the accelerator and yank the steering wheel to full lock",
      "Pull the handbrake abruptly to lock the rear wheels",
    ],
    optionsMs: [
      "Lepaskan pedal pemecut secara perlahan untuk mengembalikan beban ke tayar hadapan dan luruskan sedikit stereng sehingga cengkaman pulih",
      "Tekan pemecut sekuat hati dan pusingkan stereng secara mengejut ke tahap maksimum",
      "Tarik brek tangan secara mengejut untuk mengunci roda belakang",
    ],
    correctIdx: 0,
    feedbackEn:
      "In Understeer (front tyres sliding wide), easing off the throttle transfers weight forward to restore front tyre grip. In Oversteer (rear tail sliding out), ease off the pedals and steer smoothly into the direction of the rear skid.",
    feedbackMs:
      "Bagi Understeer (tayar hadapan menggelongsor keluar), lepaskan pemecut perlahan-lahan supaya tayar hadapan kembali mencengkam. Bagi Oversteer (bahagian belakang membuang), lepaskan pedal dan pusing stereng ke arah gelinciran.",
  },
  {
    id: "drill-breakdown",
    titleEn: "Expressway breakdown & MERS 999 emergency",
    titleMs: "Kerosakan di lebuh raya & kecemasan MERS 999",
    ref: "KPP_General.pdf pp. 115-124",
    scenarioEn: "Your vehicle breaks down on the expressway shoulder at night. Where must you place the red reflective warning triangle?",
    scenarioMs: "Kenderaan anda rosak di lorong kecemasan lebuh raya pada waktu malam. Di manakah segitiga amaran pantulan merah wajib diletakkan?",
    optionsEn: [
      "At least 45 metres behind the vehicle facing oncoming traffic, with hazard lights switched on and passengers evacuated behind the guardrail",
      "Directly against the rear bumper (less than 1 metre away) while passengers sit inside the car",
      "In front of the front bonnet facing forward",
    ],
    optionsMs: [
      "Sekurang-kurangnya 45 meter di belakang kenderaan menghadap trafik yang datang, dengan lampu kecemasan dipasang dan penumpang berlindung di belakang penghadang",
      "Betul-betul rapat pada bampar belakang (kurang 1 meter) sambil penumpang duduk di dalam kereta",
      "Di hadapan bonet hadapan kenderaan",
    ],
    correctIdx: 0,
    feedbackEn:
      "Placing the red reflective triangle at least 45 metres behind the vehicle gives high-speed drivers time to react. At a crash scene, call MERS 999, never move a victim with suspected spinal injury unless there is fire hazard, and never remove a motorcyclist's helmet.",
    feedbackMs:
      "Meletakkan segitiga pantulan merah sekurang-kurangnya 45 meter di belakang kenderaan memberi masa kepada pemandu lain untuk bertindak balas. Jika berlaku kemalangan, hubungi MERS 999 dan jangan tanggalkan topi keledar mangsa motosikal.",
  },
];

export function SafetyPrinciplesLab({ lang, onScenarioSolved }: SafetyPrinciplesLabProps) {
  const reduceMotion = useReducedMotion();
  const [activeLab, setActiveLab] = useState<"stopping" | "hazards" | "rpk" | "crs">("stopping");

  // Lab 1: Stopping Distance & Following Rule
  const [selectedSpeedIdx, setSelectedSpeedIdx] = useState<number>(4); // 90 km/h default
  const [wetRoad, setWetRoad] = useState<boolean>(false);
  const [glareSeconds, setGlareSeconds] = useState<number>(1);

  // Lab 2: Hazards
  const [drillAnswers, setDrillAnswers] = useState<Record<string, number>>({});

  // Lab 3: RPK & RSM Diagnostic Bay
  const [selectedTyre, setSelectedTyre] = useState<"normal" | "over" | "under" | "alignment">("normal");
  const [ignitionStep, setIgnitionStep] = useState<"LOCK" | "ACC" | "ON" | "START">("LOCK");

  // Lab 4: CRS & Headrest
  const [crsAnswers, setCrsAnswers] = useState<Record<string, number>>({});

  const speedSpec = STOPPING_SPEEDS[selectedSpeedIdx] ?? STOPPING_SPEEDS[4];
  const brakingMeters = wetRoad ? speedSpec.brakingDryMeters * 2 : speedSpec.brakingDryMeters;
  const totalStoppingMeters = speedSpec.thinkingMeters + brakingMeters;
  const carLengths = (totalStoppingMeters / 4.3).toFixed(1);
  const followingRuleSeconds = wetRoad ? 4 : 2;
  const metersPerSecond = speedSpec.speedKmh / 3.6;
  const safeFollowingMeters = Math.round(metersPerSecond * followingRuleSeconds);
  const twelveSecScanMeters = Math.round(metersPerSecond * 12);

  // Night glare math (`KPP_General.pdf` p. 105: 1s glare = 7s recovery = 140 m at 72 km/h)
  const recoverySeconds = glareSeconds * 7;
  const blindDistanceMeters = Math.round(metersPerSecond * recoverySeconds);

  const activeTyreSpec = TYRE_DIAGNOSTICS.find((t) => t.id === selectedTyre) ?? TYRE_DIAGNOSTICS[0];

  const IGNITION_SPECS: Record<
    "LOCK" | "ACC" | "ON" | "START",
    { titleEn: string; titleMs: string; descEn: string; descMs: string }
  > = {
    LOCK: {
      titleEn: "1. LOCK · Steering locked & key insertion/removal",
      titleMs: "1. LOCK · Stereng dikunci & kunci dimasukkan/dicabut",
      descEn:
        "All electrical circuits are off and the steering column is mechanically locked. If the key will not turn from LOCK, gently rock the steering wheel left and right while turning the key (`KPP_DA_Auto.pdf` p. 205).",
      descMs:
        "Semua litar elektrik dimatikan dan stereng dikunci secara mekanikal. Jika kunci ketat pada kedudukan LOCK, gerakkan sedikit stereng ke kiri dan kanan sambil memulas kunci (`KPP_DA_Auto.pdf` m/s 205).",
    },
    ACC: {
      titleEn: "2. ACC · Accessories powered (Engine off)",
      titleMs: "2. ACC · Aksesori berfungsi (Enjin mati)",
      descEn:
        "Unlocks the steering wheel and powers low-draw accessories such as the radio, clock, and power sockets without energizing the ignition coil.",
      descMs:
        "Membuka kunci stereng dan menghidupkan aksesori seperti radio dan soket kuasa tanpa menghidupkan sistem pencucuhan enjin.",
    },
    ON: {
      titleEn: "3. ON · Dashboard warning lamps & fuel pump active",
      titleMs: "3. ON · Lampu amaran meter & sistem pencucuhan aktif",
      descEn:
        "All dashboard warning indicators (oil pressure, battery, brake, ABS, temperature) illuminate for self-check. The key returns to ON automatically while driving.",
      descMs:
        "Semua lampu amaran pada panel meter menyala untuk semakan kendiri. Kunci kembali ke kedudukan ON secara automatik semasa enjin hidup.",
    },
    START: {
      titleEn: "4. START · Crank starter motor for 1 to 4 seconds max",
      titleMs: "4. START · Hidupkan motor penghidup selama 1 hingga 4 saat sahaja",
      descEn:
        "Hold at START for 1-4 seconds and release immediately once the engine fires (`KPP_DA_Auto.pdf` p. 205). If it fails to start, wait 10 seconds before re-cranking so the starter motor does not overheat.",
      descMs:
        "Pulas ke START selama 1-4 saat dan lepaskan kunci serta-merta sebaik sahaja enjin hidup (`KPP_DA_Auto.pdf` m/s 205). Jika gagal hidup, tunggu 10 saat sebelum mencuba semula.",
    },
  };

  return (
    <div className="space-y-6">
      {/* Lab Switcher Bar */}
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="pill pill-brand">
                {lang === "en" ? "Interactive safety lab" : "Makmal keselamatan interaktif"}
              </span>
              <span className="text-xs text-muted-foreground">
                {lang === "en"
                  ? "Part C defensive driving, RPK/RSM & CRS physics"
                  : "Pemanduan berhemah Bahagian C, RPK/RSM & fizik CRS"}
              </span>
            </div>
            <h2 className="text-lg font-bold font-heading mt-1.5">
              {lang === "en"
                ? "Part C defensive driving & vehicle inspection lab"
                : "Makmal pemanduan berhemah & pemeriksaan kenderaan Bahagian C"}
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label={lang === "en" ? "Safety labs" : "Makmal keselamatan"}>
            {[
              {
                id: "stopping" as const,
                icon: Gauge,
                labelEn: "1. Stopping & night glare",
                labelMs: "1. Jarak berhenti & silau",
              },
              {
                id: "hazards" as const,
                icon: ShieldWarning,
                labelEn: "2. C.I.T.O. & skid recovery",
                labelMs: "2. C.I.T.O. & kawalan gelincir",
              },
              {
                id: "rpk" as const,
                icon: Wrench,
                labelEn: "3. RPK tyres & RSM ignition",
                labelMs: "3. Tayar RPK & suis RSM",
              },
              {
                id: "crs" as const,
                icon: Users,
                labelEn: "4. CRS child seat & headrest",
                labelMs: "4. Kerusi CRS & penyandar kepala",
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

        {/* LAB 1: STOPPING DISTANCE, FOLLOWING RULE & NIGHT GLARE */}
        {activeLab === "stopping" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {lang === "en"
                    ? "Select travel speed (`KPP_DA_Auto.pdf` p. 263 & `KPP_General.pdf` p. 91):"
                    : "Pilih kelajuan pemanduan (`KPP_DA_Auto.pdf` m/s 263 & `KPP_General.pdf` m/s 91):"}
                </span>
                <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                  <button
                    type="button"
                    onClick={() => setWetRoad(false)}
                    aria-pressed={!wetRoad}
                    className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${
                      !wetRoad
                        ? "bg-brand text-brand-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "en" ? "Dry road (2s rule)" : "Jalan kering (Peraturan 2s)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWetRoad(true)}
                    aria-pressed={wetRoad}
                    className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${
                      wetRoad
                        ? "bg-info text-info-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "en" ? "Wet / Rain (4s rule)" : "Jalan basah / Hujan (Peraturan 4s)"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {STOPPING_SPEEDS.map((spec, idx) => (
                  <button
                    key={spec.speedKmh}
                    type="button"
                    onClick={() => setSelectedSpeedIdx(idx)}
                    aria-pressed={selectedSpeedIdx === idx}
                    className={`tile p-2.5 text-center cursor-pointer ${
                      selectedSpeedIdx === idx ? "tile-selected" : ""
                    }`}
                  >
                    <div className="type-figure text-base">{spec.speedKmh}</div>
                    <div className="text-[11px] text-muted-foreground">km/h</div>
                  </button>
                ))}
              </div>

              {/* Proportional Visual Stopping Bar */}
              <div className="panel p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    {lang === "en" ? speedSpec.refNoteEn : speedSpec.refNoteMs}
                  </span>
                  <span className="pill pill-neutral">1 car = 4.3 m</span>
                </div>

                <div className="w-full h-8 rounded-xl bg-muted overflow-hidden flex border border-border">
                  <div
                    className="h-full bg-brand text-brand-foreground flex items-center justify-center text-xs font-bold transition-all duration-200 overflow-hidden whitespace-nowrap px-2"
                    style={{
                      width: `${Math.max(14, (speedSpec.thinkingMeters / 180) * 100)}%`,
                    }}
                    title={lang === "en" ? "Thinking distance" : "Jarak berfikir"}
                  >
                    {speedSpec.thinkingMeters} m
                  </div>
                  <div
                    className="h-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-bold transition-all duration-200 overflow-hidden whitespace-nowrap px-2"
                    style={{
                      width: `${Math.max(18, (brakingMeters / 180) * 100)}%`,
                    }}
                    title={lang === "en" ? "Braking distance" : "Jarak membrek"}
                  >
                    {brakingMeters} m
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-brand/15 border border-brand/40">
                    <span className="text-muted-foreground block">
                      {lang === "en" ? "Thinking (Jarak berfikir)" : "Jarak berfikir"}
                    </span>
                    <span className="type-figure text-base">{speedSpec.thinkingMeters} m</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30">
                    <span className="text-muted-foreground block">
                      {lang === "en" ? "Braking (Jarak membrek)" : "Jarak membrek"}
                    </span>
                    <span className="type-figure text-base">{brakingMeters} m</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted border border-border">
                    <span className="text-muted-foreground block">
                      {lang === "en" ? "Total stopping" : "Jumlah jarak berhenti"}
                    </span>
                    <span className="type-figure text-base">
                      {totalStoppingMeters} m ({carLengths} cars)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Time Rules & Night High-Beam Glare */}
            <div className="lg:col-span-5 panel p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                  <span className="text-xs text-muted-foreground block">
                    {lang === "en"
                      ? `${followingRuleSeconds}-second following gap`
                      : `Jarak mengekori ${followingRuleSeconds} saat`}
                  </span>
                  <div className="type-figure text-2xl mt-0.5">{safeFollowingMeters} m</div>
                  <span className="text-[11px] text-muted-foreground">
                    {lang === "en"
                      ? `At ${speedSpec.speedKmh} km/h (${wetRoad ? "Wet" : "Dry"})`
                      : `Pada ${speedSpec.speedKmh} km/j (${wetRoad ? "Basah" : "Kering"})`}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                  <span className="text-xs text-muted-foreground block">
                    {lang === "en" ? "12-second horizon scan" : "Imbasan 12 saat ke hadapan"}
                  </span>
                  <div className="type-figure text-2xl mt-0.5">{twelveSecScanMeters} m</div>
                  <span className="text-[11px] text-muted-foreground">
                    {lang === "en"
                      ? "Early hazard detection zone"
                      : "Zon pengesanan bahaya awal"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Headlights size={15} aria-hidden="true" />
                    {lang === "en"
                      ? "Night high-beam glare recovery (`KPP_General.pdf` p. 105)"
                      : "Pemulihan silau lampu tinggi malam (`KPP_General.pdf` m/s 105)"}
                  </span>
                  <div className="inline-flex gap-1">
                    {[1, 2].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setGlareSeconds(sec)}
                        aria-pressed={glareSeconds === sec}
                        className={`px-2 py-0.5 rounded text-xs font-bold border cursor-pointer ${
                          glareSeconds === sec
                            ? "bg-brand text-brand-foreground border-foreground"
                            : "bg-background text-muted-foreground border-border"
                        }`}
                      >
                        {sec}s glare
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === "en"
                    ? `${glareSeconds} second(s) of oncoming high-beam glare causes ${recoverySeconds} seconds of temporary night blindness (1s glare = 7s recovery). At ${speedSpec.speedKmh} km/h, you travel ${blindDistanceMeters} metres virtually blind (140 m at 72 km/h). Look toward the left road edge and dip your own high beams within 200 m.`
                    : `${glareSeconds} saat terkena silau lampu tinggi menyebabkan ${recoverySeconds} saat buta sementara (1s silau = 7s pemulihan). Pada ${speedSpec.speedKmh} km/j, anda bergerak sejauh ${blindDistanceMeters} meter tanpa penglihatan jelas (140 m pada 72 km/j). Pandang ke garisan kiri jalan dan rendahkan lampu tinggi dalam jarak 200 m.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* LAB 2: C.I.T.O., SKID RECOVERY & BREAKDOWN DRILLS */}
        {activeLab === "hazards" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {HAZARD_DRILLS.map((drill) => {
              const picked = drillAnswers[drill.id];
              const answered = picked !== undefined;
              const isRight = picked === drill.correctIdx;
              const opts = lang === "en" ? drill.optionsEn : drill.optionsMs;

              return (
                <div key={drill.id} className="panel p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="pill pill-brand">
                        {lang === "en" ? drill.titleEn : drill.titleMs}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{drill.ref}</div>
                    <p className="text-sm font-semibold text-foreground leading-snug pt-1">
                      {lang === "en" ? drill.scenarioEn : drill.scenarioMs}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {opts.map((opt, idx) => {
                      const selected = picked === idx;
                      let stateClass = "";
                      if (answered) {
                        if (idx === drill.correctIdx) stateClass = "tile-done";
                        else if (selected) stateClass = "tile-fail";
                      }
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDrillAnswers((prev) => ({ ...prev, [drill.id]: idx }));
                            if (idx === drill.correctIdx) {
                              onScenarioSolved?.(drill.id);
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
                      {lang === "en" ? drill.feedbackEn : drill.feedbackMs}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* LAB 3: RPK TYRE WEAR INSPECTOR & RSM IGNITION SEQUENCER */}
        {activeLab === "rpk" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Left: Tyre Wear Inspector */}
            <div className="lg:col-span-7 panel p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-sm font-bold font-heading">
                    {lang === "en"
                      ? "RPK (7-min, 25 items) · Tyre wear & pressure diagnostic"
                      : "RPK (7 minit, 25 item) · Diagnostik kehausan & tekanan tayar"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === "en"
                      ? "Click a tread wear pattern to inspect root cause (`KPP_DA_Auto.pdf` pp. 166-167)"
                      : "Pilih corak kehausan bunga tayar untuk melihat punca (`KPP_DA_Auto.pdf` m/s 166-167)"}
                  </p>
                </div>
                <span className="pill pill-info">180-220 kPa · Min 1.6 mm TWI</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TYRE_DIAGNOSTICS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedTyre(item.id)}
                    aria-pressed={selectedTyre === item.id}
                    className={`tile p-2.5 text-left cursor-pointer ${
                      selectedTyre === item.id ? "tile-selected" : ""
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground">
                      {item.id === "normal"
                        ? lang === "en"
                          ? "Normal wear"
                          : "Haus sekata"
                        : item.id === "over"
                          ? lang === "en"
                            ? "Centre worn"
                            : "Haus tengah"
                          : item.id === "under"
                            ? lang === "en"
                              ? "Both edges worn"
                              : "Haus dua tepi"
                            : lang === "en"
                              ? "One side worn"
                              : "Haus sebelah"}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
                <div className="font-bold text-sm text-foreground">
                  {lang === "en" ? activeTyreSpec.titleEn : activeTyreSpec.titleMs}
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    {lang === "en" ? "Visual pattern: " : "Corak kelihatan: "}
                  </span>
                  <span className="text-muted-foreground">
                    {lang === "en" ? activeTyreSpec.wearPatternEn : activeTyreSpec.wearPatternMs}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    {lang === "en" ? "Root cause: " : "Punca utama: "}
                  </span>
                  <span className="text-muted-foreground">
                    {lang === "en" ? activeTyreSpec.causeEn : activeTyreSpec.causeMs}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    {lang === "en" ? "Corrective action: " : "Tindakan pembetulan: "}
                  </span>
                  <span className="text-muted-foreground">
                    {lang === "en" ? activeTyreSpec.fixEn : activeTyreSpec.fixMs}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                  <span className="text-muted-foreground block">
                    {lang === "en" ? "Engine oil interval" : "Minyak enjin"}
                  </span>
                  <span className="type-figure text-sm">5,000 km</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                  <span className="text-muted-foreground block">
                    {lang === "en" ? "Gearbox oil interval" : "Minyak kotak gear"}
                  </span>
                  <span className="type-figure text-sm">20k-30k km</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                  <span className="text-muted-foreground block">
                    {lang === "en" ? "Fan belt deflection" : "Tali sawat kipas"}
                  </span>
                  <span className="type-figure text-sm">0.5-1.0 cm</span>
                </div>
              </div>
            </div>

            {/* Right: RSM Ignition Switch Sequencer */}
            <div className="lg:col-span-5 panel p-4 space-y-3">
              <div>
                <h3 className="text-sm font-bold font-heading">
                  {lang === "en"
                    ? "RSM (5-min, 8 steps) · 4-stage ignition switch"
                    : "RSM (5 minit, 8 langkah) · Suis pencucuhan 4 peringkat"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {lang === "en"
                    ? "Step through the ignition key positions (`KPP_DA_Auto.pdf` p. 205):"
                    : "Pilih kedudukan suis penghidup enjin (`KPP_DA_Auto.pdf` m/s 205):"}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(["LOCK", "ACC", "ON", "START"] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setIgnitionStep(pos)}
                    aria-pressed={ignitionStep === pos}
                    className={`py-2.5 rounded-xl font-heading font-bold text-xs border cursor-pointer transition-colors ${
                      ignitionStep === pos
                        ? "bg-brand text-brand-foreground border-foreground"
                        : "bg-background text-foreground border-border"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-1.5 text-xs leading-relaxed">
                <div className="font-bold text-foreground">
                  {lang === "en"
                    ? IGNITION_SPECS[ignitionStep].titleEn
                    : IGNITION_SPECS[ignitionStep].titleMs}
                </div>
                <p className="text-muted-foreground">
                  {lang === "en"
                    ? IGNITION_SPECS[ignitionStep].descEn
                    : IGNITION_SPECS[ignitionStep].descMs}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground">
                <span className="font-semibold text-foreground block mb-1">
                  {lang === "en" ? "8-step RSM cabin order:" : "Urutan 8 langkah RSM di kabin:"}
                </span>
                {lang === "en"
                  ? "1. Handbrake on -> 2. Seat posture -> 3. Steering (9 & 3 or 10 & 2) -> 4. Mirrors -> 5. Dashboard gauges (ON) -> 6. Gear in N/P -> 7. Start engine -> 8. Test signals, horn, wipers & seatbelt."
                  : "1. Brek tangan -> 2. Kerusi pemandu -> 3. Stereng (9 & 3 atau 10 & 2) -> 4. Cermin -> 5. Meter (ON) -> 6. Gear N/P -> 7. Hidupkan enjin -> 8. Uji isyarat, hon, pengelap & tali pinggang keledar."}
              </div>
            </div>
          </motion.div>
        )}

        {/* LAB 4: CRS CHILD SEAT & HEADREST WHIPLASH CONFIGURATOR */}
        {activeLab === "crs" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {CRS_PROFILES.map((item) => {
              const picked = crsAnswers[item.id];
              const answered = picked !== undefined;
              const isRight = picked === item.correctOptionIndex;
              const opts = lang === "en" ? item.optionsEn : item.optionsMs;

              return (
                <div key={item.id} className="panel p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="pill pill-info">
                        {lang === "en" ? item.profileEn : item.profileMs}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lang === "en" ? item.specsEn : item.specsMs}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {opts.map((opt, idx) => {
                      const selected = picked === idx;
                      let stateClass = "";
                      if (answered) {
                        if (idx === item.correctOptionIndex) stateClass = "tile-done";
                        else if (selected) stateClass = "tile-fail";
                      }
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCrsAnswers((prev) => ({ ...prev, [item.id]: idx }));
                            if (idx === item.correctOptionIndex) {
                              onScenarioSolved?.(item.id);
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
                      {lang === "en" ? item.ruleEn : item.ruleMs}
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

