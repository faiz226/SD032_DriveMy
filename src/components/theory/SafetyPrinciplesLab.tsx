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

// KPP Automatic, viewer pages 100–102, 105, 146 and 264.
const STOPPING_SPEEDS = [
  { speedKmh: 20, thinkingMeters: 6, brakingMeters: 3 },
  { speedKmh: 30, thinkingMeters: 9, brakingMeters: 6 },
  { speedKmh: 40, thinkingMeters: 11, brakingMeters: 11 },
  { speedKmh: 60, thinkingMeters: 17, brakingMeters: 27 },
  { speedKmh: 70, thinkingMeters: 19, brakingMeters: 39 },
  { speedKmh: 80, thinkingMeters: 22, brakingMeters: 54 },
  { speedKmh: 90, thinkingMeters: 25, brakingMeters: 68 },
  { speedKmh: 100, thinkingMeters: 28, brakingMeters: 84 },
];
const MAX_STOPPING_METERS = Math.max(
  ...STOPPING_SPEEDS.map(({ thinkingMeters, brakingMeters }) => thinkingMeters + brakingMeters),
);

interface TyreDiagnostic {
  id: "normal" | "over" | "under";
  titleEn: string;
  titleMs: string;
  wearPatternEn: string;
  wearPatternMs: string;
  causeEn: string;
  causeMs: string;
  fixEn: string;
  fixMs: string;
}

// KPP Automatic, viewer page 266.
const TYRE_DIAGNOSTICS: TyreDiagnostic[] = [
  {
    id: "normal",
    titleEn: "Even tread wear across full width",
    titleMs: "Kehausan bunga tayar sekata",
    wearPatternEn: "The tread wear indicators sit below the tread surface",
    wearPatternMs: "Penunjuk kehausan berada di bawah permukaan bunga tayar",
    causeEn: "Check the tyre pressure against the vehicle’s specification.",
    causeMs: "Semak tekanan angin tayar mengikut spesifikasi kenderaan.",
    fixEn: "Replace a tyre when the tread reaches its wear indicators.",
    fixMs: "Gantikan tayar apabila bunga mencapai aras penunjuk kehausan.",
  },
  {
    id: "over",
    titleEn: "Centre tread worn down rapidly",
    titleMs: "Bunga tayar haus di bahagian tengah sahaja",
    wearPatternEn: "Centre strip is smooth while both outer edges still have deep tread",
    wearPatternMs: "Jalur tengah haus licin manakala kedua-dua bahu luar masih tebal",
    causeEn: "Excess pressure can wear down the centre of the tread.",
    causeMs: "Tekanan angin berlebihan boleh menghauskan bahagian tengah bunga tayar.",
    fixEn: "Adjust pressure to the value on the vehicle’s tyre placard.",
    fixMs: "Laraskan tekanan mengikut nilai pada pelekat spesifikasi tayar kenderaan.",
  },
  {
    id: "under",
    titleEn: "Both outer shoulders worn down",
    titleMs: "Kedua-dua bahagian tepi (bahu) tayar haus",
    wearPatternEn: "Left and right edges are worn smooth while the centre remains deeper",
    wearPatternMs: "Bahu kiri dan kanan haus manakala bahagian tengah masih mempunyai bunga",
    causeEn: "Low pressure can wear down both outer shoulders.",
    causeMs: "Tekanan angin yang rendah boleh menghauskan kedua-dua bahu tayar.",
    fixEn: "Inflate the tyres to the manufacturer’s recommended pressure.",
    fixMs: "Pam tayar mengikut tekanan yang disyorkan oleh pengeluar.",
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

// KPP General, PDF viewer pages 194–195.
const CRS_PROFILES: CrsProfile[] = [
  {
    id: "crs-infant",
    profileEn: "Installing a child restraint",
    profileMs: "Memasang kerusi keselamatan kanak-kanak",
    specsEn: "Use an approved seat that suits the child's age and size.",
    specsMs: "Gunakan kerusi yang diluluskan dan sesuai dengan umur serta saiz kanak-kanak.",
    correctOptionIndex: 0,
    optionsEn: ["Fit it in the rear as the manufacturer directs", "Fit it in front for a shorter trip", "Fit it using the previous seat's instructions"],
    optionsMs: ["Pasang di belakang mengikut arahan pengeluar", "Pasang di hadapan untuk perjalanan singkat", "Pasang mengikut arahan kerusi lama"],
    ruleEn: "Follow the manufacturer's fitting and adjustment instructions. The handbook directs drivers to fit child seats in the rear.",
    ruleMs: "Ikut arahan pemasangan dan pelarasan pengeluar. Buku panduan mengarahkan pemasangan kerusi kanak-kanak di belakang.",
  },
  {
    id: "crs-toddler",
    profileEn: "Child seat example",
    profileMs: "Contoh kerusi keselamatan",
    specsEn: "About 9 months to 4 years and 9–18 kg in the handbook example.",
    specsMs: "Kira-kira 9 bulan hingga 4 tahun dan 9–18 kg dalam contoh buku panduan.",
    correctOptionIndex: 0,
    optionsEn: ["A suitable child seat in the rear", "A booster without the shoulder belt", "The adult belt on its own"],
    optionsMs: ["Kerusi kanak-kanak yang sesuai di belakang", "Tempat duduk pengalas tanpa tali pinggang bahu", "Tali pinggang dewasa sahaja"],
    ruleEn: "The example uses a forward-facing child seat fitted in the rear. Check the restraint manufacturer's limits and instructions.",
    ruleMs: "Contoh menggunakan kerusi menghadap ke hadapan yang dipasang di belakang. Semak had dan arahan pengeluar kerusi.",
  },
  {
    id: "crs-booster",
    profileEn: "Booster seat example",
    profileMs: "Contoh tempat duduk pengalas",
    specsEn: "About 4–11 years and 15–36 kg in the handbook example.",
    specsMs: "Kira-kira 4–11 tahun dan 15–36 kg dalam contoh buku panduan.",
    correctOptionIndex: 0,
    optionsEn: ["Belt across the chest and hips", "Belt across the neck and belly", "Shoulder belt behind the back"],
    optionsMs: ["Tali pinggang merentasi dada dan pinggul", "Tali pinggang merentasi leher dan perut", "Tali pinggang bahu di belakang badan"],
    ruleEn: "A suitable booster helps the adult belt fit across the child's chest and hips.",
    ruleMs: "Tempat duduk pengalas yang sesuai membantu tali pinggang dewasa merentasi dada dan pinggul kanak-kanak.",
  },
  {
    id: "crs-headrest",
    profileEn: "Adjusting the head restraint",
    profileMs: "Melaras penyandar kepala",
    specsEn: "A correctly adjusted restraint helps protect the neck.",
    specsMs: "Penyandar yang dilaras dengan betul membantu melindungi leher.",
    correctOptionIndex: 0,
    optionsEn: ["Centre near ear level and close behind the head", "Centre level with the shoulders", "Centre near ear level with a wide gap"],
    optionsMs: ["Bahagian tengah separas telinga dan rapat di belakang kepala", "Bahagian tengah separas bahu", "Bahagian tengah separas telinga dengan jarak yang luas"],
    ruleEn: "Set the middle of the restraint around ear level. The handbook uses a fist-width as a maximum gap.",
    ruleMs: "Laraskan bahagian tengah penyandar sekitar paras telinga. Buku panduan menggunakan lebar satu genggaman sebagai jarak maksimum.",
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

// KPP Automatic, viewer pages 105, 128 and 146.
const HAZARD_DRILLS: HazardDrill[] = [
  {
    id: "drill-cito",
    titleEn: "C.I.T.O. lane-change & overtaking sequence",
    titleMs: "Urutan menukar lorong & memotong C.I.T.O.",
    ref: "C.I.T.O.",
    scenarioEn: "You want to move into the right lane to overtake a slower lorry. What is the exact C.I.T.O. order?",
    scenarioMs: "Anda ingin bergerak ke lorong kanan untuk memotong lori yang perlahan. Apakah urutan C.I.T.O. yang betul?",
    optionsEn: [
      "1. Cermin (Mirrors) -> 2. Isyarat (Signal) -> 3. Titik Buta (Head-check blind spot) -> 4. Olah Gerak (Maneuver)",
      "1. Olah Gerak (Turn wheel) -> 2. Isyarat (Signal) -> 3. Cermin (Mirrors) -> 4. Titik Buta (Blind spot)",
      "1. Isyarat (Signal) -> 2. Olah Gerak (Turn wheel immediately) without checking mirrors or blind spot",
    ],
    optionsMs: [
      "1. Cermin -> 2. Isyarat -> 3. Titik Buta (Toleh ke arah bahu) -> 4. Olah Gerak (Gerakkan stereng)",
      "1. Olah Gerak -> 2. Isyarat -> 3. Cermin -> 4. Titik Buta",
      "1. Isyarat -> 2. Olah Gerak serta-merta tanpa memeriksa cermin atau titik buta",
    ],
    correctIdx: 0,
    feedbackEn:
      "C.I.T.O. ensures you assess rear traffic in your mirrors first, warn others with your indicator, verify the side blind spot by glancing over your shoulder, and only then steer smoothly.",
    feedbackMs:
      "C.I.T.O. memastikan anda menilai trafik di cermin dahulu, memberi isyarat yang sesuai, menoleh sedikit untuk memeriksa titik buta, dan barulah menggerakkan stereng dengan lancar.",
  },
  {
    id: "drill-under-oversteer",
    titleEn: "Speed on wet bends",
    titleMs: "Kelajuan di selekoh basah",
    ref: "Kawalan Selekoh",
    scenarioEn: "You are approaching a bend on a wet road. When should you slow down?",
    scenarioMs: "Anda menghampiri selekoh di jalan basah. Bilakah anda patut memperlahankan kenderaan?",
    optionsEn: ["Before entering the bend", "At the centre of the bend", "After leaving the bend"],
    optionsMs: ["Sebelum memasuki selekoh", "Di tengah selekoh", "Selepas keluar dari selekoh"],
    correctIdx: 0,
    feedbackEn: "Wet surfaces reduce tyre grip. Use a lower speed as you approach the bend.",
    feedbackMs: "Permukaan basah mengurangkan cengkaman tayar. Kurangkan kelajuan apabila menghampiri selekoh.",
  },
  {
    id: "drill-breakdown",
    titleEn: "Expressway breakdown",
    titleMs: "Kerosakan di lebuh raya",
    ref: "Kecemasan Lebuh Raya",
    scenarioEn: "Your vehicle breaks down on the expressway shoulder at night. Where should you place the warning triangle?",
    scenarioMs: "Kenderaan anda rosak di lorong kecemasan lebuh raya pada waktu malam. Di manakah tanda amaran patut diletakkan?",
    optionsEn: [
      "Within 50 metres behind the vehicle",
      "Directly against the rear bumper (less than 1 metre away) while passengers sit inside the car",
      "In front of the front bonnet facing forward",
    ],
    optionsMs: [
      "Dalam jarak 50 meter di belakang kenderaan",
      "Betul-betul rapat pada bampar belakang (kurang 1 meter) sambil penumpang duduk di dalam kereta",
      "Di hadapan bonet hadapan kenderaan",
    ],
    correctIdx: 0,
    feedbackEn:
      "Place the warning sign within 50 metres behind the vehicle, switch on your hazard lights and keep passengers away from traffic.",
    feedbackMs:
      "Letakkan tanda amaran dalam jarak 50 meter di belakang kenderaan, nyalakan lampu kecemasan dan jauhkan penumpang daripada trafik.",
  },
];

export function SafetyPrinciplesLab({ lang, onScenarioSolved }: SafetyPrinciplesLabProps) {
  const reduceMotion = useReducedMotion();
  const [activeLab, setActiveLab] = useState<"stopping" | "hazards" | "rpk" | "crs">("stopping");

  // Lab 1: Stopping Distance & Following Rule
  const [selectedSpeedIdx, setSelectedSpeedIdx] = useState(6); // 90 km/h default
  const [wetRoad, setWetRoad] = useState<boolean>(false);

  // Lab 2: Hazards
  const [drillAnswers, setDrillAnswers] = useState<Record<string, number>>({});

  // Lab 3: RPK & RSM Diagnostic Bay
  const [selectedTyre, setSelectedTyre] = useState<"normal" | "over" | "under">("normal");
  const [ignitionStep, setIgnitionStep] = useState<"LOCK" | "ACC" | "ON" | "START">("LOCK");

  // Lab 4: CRS & Headrest
  const [crsAnswers, setCrsAnswers] = useState<Record<string, number>>({});

  const speedSpec = STOPPING_SPEEDS[selectedSpeedIdx];
  const { brakingMeters } = speedSpec;
  const totalStoppingMeters = speedSpec.thinkingMeters + brakingMeters;
  const followingRuleSeconds = wetRoad ? 4 : 2;
  const metersPerSecond = speedSpec.speedKmh / 3.6;
  const safeFollowingMeters = Math.round(metersPerSecond * followingRuleSeconds);
  const twelveSecScanMeters = Math.round(metersPerSecond * 12);

  const activeTyreSpec = TYRE_DIAGNOSTICS.find((t) => t.id === selectedTyre) ?? TYRE_DIAGNOSTICS[0];

  // KPP Automatic, viewer page 200.
  const IGNITION_SPECS: Record<
    "LOCK" | "ACC" | "ON" | "START",
    { titleEn: string; titleMs: string; descEn: string; descMs: string }
  > = {
    LOCK: {
      titleEn: "1. LOCK · Steering locked & key insertion/removal",
      titleMs: "1. LOCK · Stereng dikunci & kunci dimasukkan/dicabut",
      descEn:
        "The engine is off and the steering is locked. Insert or remove the key in this position.",
      descMs:
        "Enjin dimatikan dan stereng dikunci. Masukkan atau keluarkan kunci pada kedudukan ini.",
    },
    ACC: {
      titleEn: "2. ACC · Accessories powered (Engine off)",
      titleMs: "2. ACC · Aksesori berfungsi (Enjin mati)",
      descEn:
        "Use accessories other than air conditioning with the engine off.",
      descMs:
        "Gunakan aksesori selain penyaman udara semasa enjin dimatikan.",
    },
    ON: {
      titleEn: "3. ON · Check the instrument panel",
      titleMs: "3. ON · Semak panel instrumen",
      descEn:
        "Pause at ON to check that the indicators work. The key returns to ON when released from START.",
      descMs:
        "Berhenti seketika pada ON untuk menyemak penunjuk. Kunci kembali ke ON apabila dilepaskan dari START.",
    },
    START: {
      titleEn: "4. START · Crank starter motor for 1 to 4 seconds max",
      titleMs: "4. START · Hidupkan motor penghidup selama 1 hingga 4 saat sahaja",
      descEn:
        "Hold at START for 1-4 seconds and release immediately once the engine fires. If it does not start, release the key and wait briefly before trying again.",
      descMs:
        "Pulas ke START selama 1-4 saat dan lepaskan kunci serta-merta sebaik sahaja enjin hidup. Jika enjin tidak hidup, lepaskan kunci dan tunggu seketika sebelum mencuba semula.",
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
                    ? "Select a speed:"
                    : "Pilih kelajuan:"}
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
                    <div className="text-[0.8125rem] text-muted-foreground">km/h</div>
                  </button>
                ))}
              </div>

              {/* Proportional Visual Stopping Bar */}
              <div className="panel p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    {lang === "en" ? "Handbook example: reaction distance + braking distance" : "Contoh buku panduan: jarak reaksi + jarak membrek"}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  {lang === "en"
                    ? "Wet roads need more stopping distance. The road setting changes the following-gap estimate."
                    : "Jarak berhenti lebih jauh di jalan basah. Tetapan jalan mengubah anggaran jarak mengekori."}
                </p>

                <div aria-hidden="true" className="w-full h-8 rounded-xl bg-muted overflow-hidden flex border border-border">
                  <div
                    className="h-full bg-brand transition-all duration-200"
                    style={{
                      width: `${(speedSpec.thinkingMeters / MAX_STOPPING_METERS) * 100}%`,
                    }}
                    title={lang === "en" ? "Thinking distance" : "Jarak berfikir"}
                  />
                  <div
                    className="h-full bg-destructive transition-all duration-200"
                    style={{
                      width: `${(brakingMeters / MAX_STOPPING_METERS) * 100}%`,
                    }}
                    title={lang === "en" ? "Braking distance" : "Jarak membrek"}
                  />
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
                      {totalStoppingMeters} m
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
                  <span className="text-[0.8125rem] text-muted-foreground">
                    {lang === "en"
                      ? `At ${speedSpec.speedKmh} km/h (${wetRoad ? "Wet" : "Dry"})`
                      : `Pada ${speedSpec.speedKmh} km/j (${wetRoad ? "Basah" : "Kering"})`}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                  <span className="text-xs text-muted-foreground block">
                    {lang === "en" ? "12-second scan before overtaking" : "Imbasan 12 saat sebelum memotong"}
                  </span>
                  <div className="type-figure text-2xl mt-0.5">{twelveSecScanMeters} m</div>
                  <span className="text-[0.8125rem] text-muted-foreground">
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
                      ? "Glare and visibility"
                      : "Silau dan jarak penglihatan"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === "en"
                    ? "In the handbook example, recovery from glare takes about seven seconds. At 70 km/h, the vehicle travels roughly 140 metres during that time. Adjust your speed when glare limits your view."
                    : "Dalam contoh buku panduan, mata mengambil kira-kira tujuh saat untuk pulih daripada silau. Pada 70 km/j, kenderaan bergerak kira-kira 140 meter dalam tempoh itu. Sesuaikan kelajuan apabila silau mengehadkan penglihatan."}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* LAB 2: C.I.T.O., WET BENDS & BREAKDOWN DRILLS */}
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
                    <div className="text-[0.8125rem] text-muted-foreground">{drill.ref}</div>
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
                      ? "RPK · Tyre wear and pressure checks"
                      : "RPK · Pemeriksaan kehausan dan tekanan tayar"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === "en"
                      ? "Click a tread wear pattern to inspect root cause"
                      : "Pilih corak kehausan bunga tayar untuk melihat punca"}
                  </p>
                </div>
                <span className="pill pill-info">{lang === "en" ? "Check pressure and tread" : "Periksa tekanan dan bunga tayar"}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                          : lang === "en"
                            ? "Both edges worn"
                            : "Haus dua tepi"}
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

              <p className="text-xs text-muted-foreground">
                {lang === "en"
                  ? "Follow the vehicle manufacturer’s schedule for engine and gearbox oil."
                  : "Ikut jadual pengeluar kenderaan untuk penukaran minyak enjin dan kotak gear."}
              </p>
            </div>

            {/* Right: RSM Ignition Switch Sequencer */}
            <div className="lg:col-span-5 panel p-4 space-y-3">
              <div>
                <h3 className="text-sm font-bold font-heading">
                  {lang === "en"
                    ? "RSM · Ignition switch"
                    : "RSM · Suis pencucuhan"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {lang === "en"
                    ? "Step through the ignition key positions:"
                    : "Pilih kedudukan suis penghidup enjin:"}
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
                  {lang === "en" ? "Automatic-car pre-drive routine" : "Rutin sebelum memandu kereta automatik"}
                </span>
                {lang === "en"
                  ? "1. Apply the parking brake. 2. Adjust the seat and head restraint. 3. Adjust the mirrors. 4. Fasten the seat belt. 5. Check the instrument panel. 6. Select P. 7. Start without pressing the accelerator. 8. Check that the accessory switches work."
                  : "1. Tarik brek tangan. 2. Laraskan tempat duduk dan penyandar kepala. 3. Laraskan cermin. 4. Pakai tali pinggang keledar. 5. Semak panel instrumen. 6. Pilih P. 7. Hidupkan enjin tanpa menekan pemecut. 8. Semak fungsi suis peralatan."}
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

