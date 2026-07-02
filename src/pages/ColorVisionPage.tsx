import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { useSaveColorblindResult } from "@/hooks/useResults";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, Warning, Play } from 'phosphor-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/translations/en";
import confetti from "canvas-confetti";

type PlateType = "control" | "screening" | "diagnostic" | "classification" | "tritan";

const PLATE_TYPE_KEYS: Record<PlateType, TranslationKey> = {
  control: "color.plateType.control",
  screening: "color.plateType.screening",
  diagnostic: "color.plateType.diagnostic",
  classification: "color.plateType.classification",
  tritan: "color.plateType.tritan",
};

const PLATES = [
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

const STAGGER_CLASSES = [
  "anim-stagger-0",
  "anim-stagger-1",
  "anim-stagger-2",
  "anim-stagger-3",
  "anim-stagger-4",
  "anim-stagger-5",
  "anim-stagger-6",
  "anim-stagger-7",
  "anim-stagger-8",
  "anim-stagger-9",
];

const COLOR_SETS = [
  { id: "full", title: "Full Test", titleMs: "Ujian Penuh", desc: "All 25 Ishihara plates", descMs: "Semua 25 plat Ishihara", limit: 25 },
  { id: "quick", title: "Quick Screen", titleMs: "Ujian Pantas", desc: "First 17 screening plates", descMs: "17 plat saringan pertama", limit: 17 },
  { id: "screening", title: "Basic Check", titleMs: "Semakan Asas", desc: "First 9 screening plates", descMs: "9 plat saringan pertama", limit: 9 }
];

export function ColorVisionPage() {
  const { t, language } = useLanguage();
  const { user } = useAuthStore();
  const { mutateAsync: saveResult } = useSaveColorblindResult();

  const plateDescription = (type: PlateType) => t(PLATE_TYPE_KEYS[type]);
  const plateAlt = (plateNum: number, type: PlateType) =>
    t("color.plateAlt", { num: plateNum, description: plateDescription(type) });

  const [isStarted, setIsStarted] = useState(false);
  const [selectedSet, setSelectedSet] = useState<string | undefined>(undefined);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [testLimit, setTestLimit] = useState(25);

  const [currentPlateIndex, setCurrentPlateIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [userAnswer, setUserAnswer] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  // Random key that changes each time the test starts, triggering re-shuffle
  const [shuffleKey, setShuffleKey] = useState(() => Math.random());

  // Fire firework confetti when test finishes with a "Normal" classification
  useEffect(() => {
    if (!isFinished) return;
    // Calculate pass: control plate correct and enough screening plates correct
    const plate1 = PLATES.find(p => p.plateNum === 1);
    const plate1Pass = plate1 ? checkAnswer(answers[plate1.id], plate1) : false;
    const screeningPlates = PLATES.filter(p => p.plateNum >= 2 && p.plateNum <= 9);
    const screeningCorrect = screeningPlates.filter(p => checkAnswer(answers[p.id], p)).length;
    const isNormal = plate1Pass && screeningCorrect >= 7;
    if (isNormal) {
      const duration = 3 * 1000;
      const animEnd = Date.now() + duration;
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval = window.setInterval(() => {
        if (Date.now() > animEnd) { clearInterval(interval); return; }
        confetti({ particleCount: 40, spread: 360, startVelocity: 30, ticks: 60, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ particleCount: 40, spread: 360, startVelocity: 30, ticks: 60, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 300);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  // Shuffle plates on each test start: keep plate 1 (control) first, shuffle the rest
  const activePlates = useMemo(() => {
    const pool = PLATES.slice(0, testLimit);
    const [control, ...rest] = pool;
    // Fisher-Yates shuffle using shuffleKey as seed via Math.random() side effect
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return [control, ...rest];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testLimit, shuffleKey]);

  const currentPlate = activePlates[currentPlateIndex];

  const checkAnswer = (answer: string | undefined, p: typeof PLATES[0]) => {
    if (!answer) return false;
    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedCorrect = p.normalAnswer.toLowerCase().trim();
    return normalizedAnswer === normalizedCorrect;
  };

  const handleSubmit = () => {
    if (!userAnswer) {
      toast.error(t("color.error.answerRequired"));
      return;
    }

    const updatedAnswers = { ...answers, [currentPlate.id]: userAnswer };
    setAnswers(updatedAnswers);
    setUserAnswer("");

    if (currentPlateIndex < activePlates.length - 1) {
      setCurrentPlateIndex((prev) => prev + 1);
    } else {
      handleFinish(updatedAnswers);
    }
  };

  const handleFinish = async (finalAnswers: Record<number, string>) => {
    setIsFinished(true);
    let score = 0;
    activePlates.forEach((p) => {
      if (checkAnswer(finalAnswers[p.id], p)) score++;
    });

    const percentage = Math.round((score / activePlates.length) * 100);

    if (user) {
      try {
        await saveResult({
          user_id: user.id,
          score,
          total_plates: activePlates.length,
          percentage,
          answers: Object.fromEntries(Object.entries(finalAnswers).map(([k, v]) => [k, String(v)]))
        });
        toast.success(t("color.saved"));
      } catch (_error) {
        toast.error(t("color.error.saveFailed"));
      }
    }
  };

  const resetTest = () => {
    setCurrentPlateIndex(0);
    setAnswers({});
    setIsFinished(false);
    setUserAnswer("");
    setIsStarted(false);
    setShuffleKey(Math.random()); // trigger new shuffle on next test start
  };

  // Launch Panel View
  if (!isStarted) {
    const isSubmitDisabled = !selectedSet || !rulesAccepted;
    const activeSet = COLOR_SETS.find(s => s.id === selectedSet);

    let buttonLabel = language === 'en' ? "Select a Test Set" : "Pilih Set Ujian";
    if (!selectedSet) {
      buttonLabel = language === 'en' ? "Select a Test Set" : "Pilih Set Ujian";
    } else if (!rulesAccepted) {
      buttonLabel = language === 'en' ? "Accept Guidelines to Begin" : "Terima Garis Panduan";
    } else {
      buttonLabel = language === 'en' ? "Start Color Test" : "Mula Ujian Warna";
    }

    return (
      <div className="max-w-xl mx-auto page-enter mt-10">
        <div className="bg-card border rounded-3xl shadow-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-[#1e293b] text-white p-8 relative overflow-hidden">
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-white/5 select-none pointer-events-none">
              <Eye className="w-[160px] h-[160px]" weight="fill" />
            </div>

            <div className="relative z-10">
              <div className="text-[10px] font-bold tracking-wider uppercase text-white/70 mb-2">
                ISHIHARA COLOR TEST
              </div>
              <h2 className="font-heading font-bold text-3xl mb-1 leading-tight text-white">
                {language === 'en' ? "Test your color vision" : "Uji penglihatan warna anda"}
              </h2>
              <p className="text-sm text-white/60 italic font-medium">
                {language === 'en' ? "Ujian Penglihatan Warna Ishihara" : "Ishihara Color Vision Test"}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {language === 'en'
                ? "The Ishihara Color Test is the gold standard for detecting red-green color vision deficiencies. You will be shown pseudo-isochromatic plates containing numbers or paths."
                : "Ujian Warna Ishihara adalah standard emas untuk mengesan kekurangan penglihatan warna merah-hijau. Anda akan ditunjukkan plat pseudo-isokromatik yang mengandungi nombor atau laluan."}
            </p>

            <div className="space-y-3">
              <label className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                {language === 'en' ? "CHOOSE TEST LENGTH" : "PILIH PANJANG UJIAN"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {COLOR_SETS.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSelectedSet(sec.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98]",
                      selectedSet === sec.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-foreground hover:border-foreground/30 hover:bg-muted/30"
                    )}
                  >
                    <div className="text-[10px] font-bold tracking-wider uppercase opacity-60 mb-1">
                      PLATES
                    </div>
                    <div className="font-heading font-black text-3xl leading-none mb-2">
                      {sec.limit}
                    </div>
                    <div className="font-bold text-sm">
                      {language === 'en' ? sec.title : sec.titleMs}
                    </div>
                    <div className="text-xs opacity-70 mt-0.5 font-medium">
                      {language === 'en' ? sec.desc : sec.descMs}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (activeSet) {
                  setTestLimit(activeSet.limit);
                  setIsStarted(true);
                }
              }}
              disabled={isSubmitDisabled}
              className={cn(
                "w-full flex items-center justify-center gap-2 min-h-[56px] py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all",
                !isSubmitDisabled
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md active:scale-[0.99]"
                  : "bg-muted/40 text-muted-foreground/60 cursor-not-allowed"
              )}
            >
              <Play className="w-5 h-5" weight="fill" />
              {buttonLabel}
            </button>

            <div className="bg-card border rounded-2xl p-5 md:p-6 space-y-4">
              <h3 className="font-heading font-bold text-sm text-foreground">
                {language === 'en' ? "Test Guidelines" : "Garis Panduan Ujian"}
              </h3>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside pl-1">
                {language === 'en' ? (
                  <>
                    <li>Ensure screen brightness is set to at least 50%.</li>
                    <li>Position yourself about 75cm (arm's length) from the screen.</li>
                    <li>Do not wear color-correcting lenses or tinted glasses.</li>
                    <li>Spend no more than 5 seconds analyzing each plate.</li>
                  </>
                ) : (
                  <>
                    <li>Pastikan kecerahan skrin sekurang-kurangnya 50%.</li>
                    <li>Letakkan diri anda kira-kira 75cm (panjang lengan) dari skrin.</li>
                    <li>Jangan pakai kanta pembetulan warna atau cermin mata berwarna.</li>
                    <li>Jangan luangkan lebih daripada 5 saat untuk menganalisis setiap plat.</li>
                  </>
                )}
              </ul>
              <div className="pt-3 border-t flex items-start gap-3">
                <Checkbox
                  id="rulesAccepted"
                  checked={rulesAccepted}
                  onCheckedChange={(checked) => setRulesAccepted(!!checked)}
                  className="mt-0.5"
                />
                <label htmlFor="rulesAccepted" className="text-xs text-muted-foreground font-medium leading-relaxed cursor-pointer select-none">
                  {language === 'en'
                    ? "I have set up my environment and am ready to begin the test."
                    : "Saya telah menyediakan persekitaran saya dan bersedia untuk memulakan ujian."}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Test Results View
  if (isFinished) {
    const plate1 = PLATES.find(p => p.plateNum === 1);
    const plate1Valid = plate1 && checkAnswer(answers[plate1.id], plate1);

    const screeningPlates = PLATES.filter(p => p.plateNum >= 2 && p.plateNum <= 9);
    let screeningCorrect = 0;
    screeningPlates.forEach((p) => {
      if (answers[p.id] !== undefined && checkAnswer(answers[p.id], p)) {
        screeningCorrect++;
      }
    });

    const diagnosticPlates = PLATES.filter(p => p.plateNum >= 10 && p.plateNum <= 17);
    let diagnosticCorrect = 0;
    diagnosticPlates.forEach((p) => {
      if (answers[p.id] !== undefined && checkAnswer(answers[p.id], p)) {
        diagnosticCorrect++;
      }
    });

    const classificationPlates = PLATES.filter(p => p.plateNum >= 18 && p.plateNum <= 21);
    // Count how many classification plates the user responded with a colorblind number (not "nothing")
    // Plates 18-21: normalAnswer="nothing", redGreenAnswer=the number only colorblind see
    let classificationCorrect = 0; // kept for breakdown display (correct "nothing" answers)
    let classificationColorblindCount = 0; // how many plates user saw numbers on (colorblind indicator)
    classificationPlates.forEach((p) => {
      if (answers[p.id] !== undefined) {
        if (checkAnswer(answers[p.id], p)) classificationCorrect++;
        const ans = answers[p.id].toLowerCase().trim();
        const colorblindAns = p.redGreenAnswer.toLowerCase().trim();
        // Only count as colorblind indicator if colorblind answer is a number (not "nothing")
        if (colorblindAns !== "nothing" && ans === colorblindAns) {
          classificationColorblindCount++;
        }
      }
    });

    const tritanPlates = PLATES.filter(p => p.plateNum >= 22 && p.plateNum <= 25);
    let tritanCorrect = 0;
    tritanPlates.forEach((p) => {
      if (answers[p.id] !== undefined && checkAnswer(answers[p.id], p)) {
        tritanCorrect++;
      }
    });
    // Tritan indicator: how many tritan plates the user got WRONG (tritan-deficient miss these)
    const tritanAnswered = tritanPlates.filter(p => answers[p.id] !== undefined).length;
    const tritanMisses = tritanAnswered - tritanCorrect;

    let classification = t("color.results.class.normal");
    let isInvalid = false;
    let diagnosis = "";

    if (!plate1Valid) {
      classification = t("color.results.class.invalid");
      diagnosis = t("color.results.diagnosis.recheckPlate1");
      isInvalid = true;
    } else {
      if (testLimit === 9) {
        if (screeningCorrect >= 7) {
          classification = t("color.results.class.normal");
          diagnosis = t("color.results.diagnosis.normal");
        } else {
          classification = t("color.results.class.deutan");
          diagnosis = t("color.results.diagnosis.moderateRedGreen");
        }
      } else {
        const redGreenPlates = PLATES.filter(p => p.plateNum >= 2 && p.plateNum <= 17);
        let redGreenCorrect = 0;
        redGreenPlates.forEach((p) => {
          if (answers[p.id] !== undefined && checkAnswer(answers[p.id], p)) {
            redGreenCorrect++;
          }
        });
        const redGreenMisses = redGreenPlates.length - redGreenCorrect;

        if (redGreenCorrect >= 14) {
          classification = t("color.results.class.normal");
          diagnosis = t("color.results.diagnosis.normal");
        } else if (redGreenMisses >= 2 && redGreenMisses <= 4) {
          classification = t("color.results.class.deutan");
          diagnosis = t("color.results.diagnosis.mildRedGreen");
        } else if (redGreenMisses >= 5 && redGreenMisses <= 8) {
          classification = t("color.results.class.deutan");
          diagnosis = t("color.results.diagnosis.moderateRedGreen");
        } else if (redGreenMisses > 8) {
          classification = t("color.results.class.deutan");
          diagnosis = t("color.results.diagnosis.severeRedGreen");
        }

        if (testLimit === 25) {
          // classificationColorblindCount: how many plates 18-21 the user saw colorblind numbers on
          if (classificationColorblindCount >= 2) {
            classification = t("color.results.class.deutan");
            diagnosis = t("color.results.diagnosis.redGreenConfirmed");
          }
          // tritanMisses: how many tritan plates the user got wrong (high = tritan deficiency)
          if (tritanMisses >= 2) {
            classification = t("color.results.class.tritan");
            diagnosis = t("color.results.diagnosis.tritan");
          }
        }
      }
    }

    let totalCorrect = 0;
    activePlates.forEach((p) => {
      if (checkAnswer(answers[p.id], p)) {
        totalCorrect++;
      }
    });
    const percentage = Math.round((totalCorrect / activePlates.length) * 100);

    return (
      <div className="page-shell max-w-5xl space-y-6">
        <h1 className="page-title">{t("color.results.title")}</h1>

        <Card className={`p-6 text-center space-y-4 border border-border bg-card ${isInvalid ? "border-destructive" : ""}`}>
          <div className="text-5xl font-bold font-mono font-tabular-nums text-primary">{percentage}%</div>
          <div className="text-xl">{t("color.results.score", { score: totalCorrect, total: activePlates.length, percentage })}</div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-base ${isInvalid ? 'bg-destructive/15 text-destructive' : 'bg-secondary text-secondary-foreground'}`}>
            <Warning className="w-5 h-5" weight="regular" />
            {classification}
          </div>

          {diagnosis && (
            <div className="text-sm text-muted-foreground mt-2">{diagnosis}</div>
          )}

          <div className="mt-6 pt-6 border-t border-border space-y-3 text-left">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("color.results.breakdown")}</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-md border border-border bg-muted/50">
                <div className="text-muted-foreground">{t("color.results.breakdown.control")}</div>
                <div className={`font-bold ${plate1Valid ? "text-success" : "text-destructive"}`}>
                  {plate1Valid ? t("color.results.status.valid") : t("color.results.status.invalid")}
                </div>
              </div>
              <div className="p-3 rounded-md border border-border bg-muted/50">
                <div className="text-muted-foreground">{t("color.results.breakdown.screening")}</div>
                <div className="font-bold font-tabular-nums">
                  {screeningCorrect}/8
                </div>
              </div>
              {testLimit >= 17 && (
                <div className="p-3 rounded-md border border-border bg-muted/50">
                  <div className="text-muted-foreground">{t("color.results.breakdown.diagnostic")}</div>
                  <div className="font-bold font-tabular-nums">
                    {diagnosticCorrect}/8
                  </div>
                </div>
              )}
              {testLimit >= 25 && (
                <>
                  <div className="p-3 rounded-md border border-border bg-muted/50">
                    <div className="text-muted-foreground">{t("color.results.breakdown.classification")}</div>
                    <div className="font-bold font-tabular-nums">
                      {classificationCorrect}/4
                    </div>
                  </div>
                  <div className="p-3 rounded-md border border-border bg-muted/50">
                    <div className="text-muted-foreground">{t("color.results.breakdown.tritan")}</div>
                    <div className="font-bold font-tabular-nums">
                      {tritanCorrect}/4
                    </div>
                  </div>
                </>
              )}
              <div className="p-3 rounded-md border border-border bg-muted/50">
                <div className="text-muted-foreground">{t("color.results.breakdown.total")}</div>
                <div className={`font-bold font-tabular-nums text-primary`}>
                  {totalCorrect}/{activePlates.length}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Button size="lg" onClick={resetTest}>{t("color.retake")}</Button>
          </div>
        </Card>

        <h2 className="text-xl font-semibold mt-8 mb-4">{t("color.results.review")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activePlates.map((p, idx) => {
            const isCorrect = checkAnswer(answers[p.id], p);
            return (
              <Card
                key={p.id}
                className={cn(
                  "p-4 border border-border bg-card space-y-3",
                  STAGGER_CLASSES[idx % STAGGER_CLASSES.length]
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg">{t("color.plateLabel", { num: p.plateNum })}</div>
                  <div className={`text-sm px-3 py-1 rounded-md font-semibold ${isCorrect ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                    {isCorrect ? t("results.correct") : t("results.incorrect")}
                  </div>
                </div>

                <div className="flex justify-center">
                  <img
                    src={`/color-plates/${p.imageFile}`}
                    alt={plateAlt(p.plateNum, p.type)}
                    className="w-full max-w-xs rounded-md border border-border"
                    loading="lazy"
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("color.results.yourAnswerLabel")}</span>
                    <span className="font-bold font-tabular-nums text-foreground">{answers[p.id] || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("color.results.correctAnswerLabel")}</span>
                    <span className="font-bold font-tabular-nums text-success">{p.normalAnswer}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Test View
  return (
    <div className="page-shell max-w-3xl space-y-6">
      <header className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t("color.title")}</h1>
          <p className="page-lead">{t("color.subtitle")}</p>
        </div>
      </header>

      <Card className="p-6 border border-border bg-card">
        <div className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider text-center">
          {t("color.plate", { current: currentPlateIndex + 1, total: activePlates.length })}
        </div>

        <div className="flex justify-center mb-10" key={currentPlate.id}>
          <div
            className="w-64 h-64 rounded-md flex items-center justify-center relative overflow-hidden transition-all duration-200 border border-border bg-card"
            aria-label={plateAlt(currentPlate.plateNum, currentPlate.type)}
          >
            <img
              src={`/color-plates/${currentPlate.imageFile}`}
              alt={plateAlt(currentPlate.plateNum, currentPlate.type)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <div className="text-center font-medium mb-4">{t("color.question")}</div>
        <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
          <div className="flex gap-3 items-center w-full justify-center">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              placeholder={t("color.input.placeholder")}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value.replace(/[^0-9]/g, ''))}
              autoFocus
              className="w-full text-center text-xl font-bold font-tabular-nums p-3 rounded-md border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              aria-label={t("color.input.ariaLabel")}
            />
            <span className="text-muted-foreground">{t("color.input.or")}</span>
            <button
              type="button"
              onClick={() => setUserAnswer("nothing")}
              className={cn(
                "px-4 py-3 rounded-md border font-medium shrink-0 transition-colors min-h-[44px]",
                userAnswer === "nothing"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {t("color.nothing")}
            </button>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!userAnswer}
            className="w-full min-h-[48px] py-3 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t("color.input.submit")}
          </button>
        </div>
      </Card>

      {/* Plate Navigation Grid */}
      <div className="grid grid-cols-6 md:grid-cols-12 gap-2 mt-8">
        {activePlates.map((p, idx) => {
          const position = idx + 1; // sequential display number: 1, 2, 3...
          const isAnswered = answers[p.id] !== undefined;
          const isActive = idx === currentPlateIndex;
          const isLocked = !isAnswered && !isActive && idx > currentPlateIndex;
          return (
            <button
              key={p.id}
              disabled={isLocked}
              onClick={() => {
                setCurrentPlateIndex(idx);
                setUserAnswer(answers[p.id] || "");
              }}
              className={`
                h-10 rounded-md flex items-center justify-center text-sm font-medium font-tabular-nums transition-colors
                ${isActive ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                ${isAnswered && !isActive ? 'bg-primary/20 text-foreground' : ''}
                ${!isAnswered && !isActive ? 'bg-muted text-muted-foreground' : ''}
                ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-primary/40'}
              `}
              title={`Plate ${position}`}
            >
              {position}
            </button>
          );
        })}
      </div>
    </div>
  );
}
