import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { useUpdateTheoryProgress } from "@/hooks/useProgress";
import { ScenarioCard, type Scenario } from "@/components/safety/ScenarioCard";
import { EthicsSlider } from "@/components/safety/EthicsSlider";
import { ResultsBadge } from "@/components/safety/ResultsBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ShieldWarning, BookmarkSimple } from "phosphor-react";
import type { TranslationKey } from "@/lib/translations";
import confetti from "canvas-confetti";

const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    titleKey: "safety.scenario.s1.title",
    descKey: "safety.scenario.s1.desc",
    options: [
      { id: "o1", textKey: "safety.scenario.s1.o1" },
      { id: "o2", textKey: "safety.scenario.s1.o2" },
      { id: "o3", textKey: "safety.scenario.s1.o3" },
    ],
    correctId: "o1",
    principle: "nafs",
    explanationKey: "safety.scenario.s1.explanation",
  },
  {
    id: "s2",
    titleKey: "safety.scenario.s2.title",
    descKey: "safety.scenario.s2.desc",
    options: [
      { id: "o1", textKey: "safety.scenario.s2.o1" },
      { id: "o2", textKey: "safety.scenario.s2.o2" },
      { id: "o3", textKey: "safety.scenario.s2.o3" },
    ],
    correctId: "o2",
    principle: "aql",
    explanationKey: "safety.scenario.s2.explanation",
  },
  {
    id: "s3",
    titleKey: "safety.scenario.s3.title",
    descKey: "safety.scenario.s3.desc",
    options: [
      { id: "o1", textKey: "safety.scenario.s3.o1" },
      { id: "o2", textKey: "safety.scenario.s3.o2" },
      { id: "o3", textKey: "safety.scenario.s3.o3" },
    ],
    correctId: "o3",
    principle: "nafs",
    explanationKey: "safety.scenario.s3.explanation",
  },
  {
    id: "s4",
    titleKey: "safety.scenario.s4.title",
    descKey: "safety.scenario.s4.desc",
    options: [
      { id: "o1", textKey: "safety.scenario.s4.o1" },
      { id: "o2", textKey: "safety.scenario.s4.o2" },
      { id: "o3", textKey: "safety.scenario.s4.o3" },
    ],
    correctId: "o2",
    principle: "nasl",
    explanationKey: "safety.scenario.s4.explanation",
  },
  {
    id: "s5",
    titleKey: "safety.scenario.s5.title",
    descKey: "safety.scenario.s5.desc",
    options: [
      { id: "o1", textKey: "safety.scenario.s5.o1" },
      { id: "o2", textKey: "safety.scenario.s5.o2" },
      { id: "o3", textKey: "safety.scenario.s5.o3" },
    ],
    correctId: "o1",
    principle: "aql",
    explanationKey: "safety.scenario.s5.explanation",
  },
];

const ETHICS_CASE_KEYS: TranslationKey[] = [
  "safety.ethics.case.c1",
  "safety.ethics.case.c2",
  "safety.ethics.case.c3",
];

export function SafetyPage() {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const { mutateAsync: updateProgress } = useUpdateTheoryProgress();

  const [phase, setPhase] = useState<"defensive" | "ethics" | "results">("defensive");

  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [ethicsValue, setEthicsValue] = useState(5);
  const [ethicsSubmitted, setEthicsSubmitted] = useState(false);
  const [mockAvg, setMockAvg] = useState(0);

  // Fire confetti when results phase is reached and score >= 60
  useEffect(() => {
    if (phase === "results" && score >= 60) {
      const end = Date.now() + 2.5 * 1000;
      const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
      const frame = () => {
        if (Date.now() > end) return;
        confetti({ particleCount: 2, angle: 60, spread: 55, startVelocity: 60, origin: { x: 0, y: 0.5 }, colors });
        confetti({ particleCount: 2, angle: 120, spread: 55, startVelocity: 60, origin: { x: 1, y: 0.5 }, colors });
        requestAnimationFrame(frame);
      };
      frame();
    }
  }, [phase, score]);

  const handleScenarioNext = (isCorrect: boolean) => {
    if (isCorrect) setScore((prev) => prev + 20);

    setIsExiting(true);
    setTimeout(() => {
      if (currentScenarioIndex < SCENARIOS.length - 1) {
        setCurrentScenarioIndex((prev) => prev + 1);
        setIsExiting(false);
      } else {
        setPhase("ethics");
        setIsExiting(false);
      }
    }, 300);
  };

  const submitEthics = () => {
    setMockAvg(Number((Math.random() * (9.0 - 5.0) + 5.0).toFixed(1)));
    setEthicsSubmitted(true);
  };

  const handleCaseNext = () => {
    if (currentCaseIndex < ETHICS_CASE_KEYS.length - 1) {
      setCurrentCaseIndex((prev) => prev + 1);
      setEthicsValue(5);
      setEthicsSubmitted(false);
    } else {
      finishModule();
    }
  };

  const finishModule = async () => {
    setPhase("results");
    if (user) {
      try {
        await updateProgress({
          user_id: user.id,
          module_id: "safety_ethics",
          completed: true,
          completed_at: new Date().toISOString(),
        });
        toast.success(t("color.saved"));
      } catch (_err) {
        toast.error("Failed to save progress");
      }
    }
  };

  if (phase === "results") {
    return (
      <div className="page-shell max-w-2xl space-y-6">
        <h1 className="page-title">{t("safety.title")}</h1>
        <Card className="p-8 text-center space-y-6 border border-border bg-card">
          <div className="flex justify-center mb-4">
            <ResultsBadge score={score} />
          </div>
          <div className="text-5xl font-bold font-mono text-primary font-tabular-nums">{score}/100</div>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t("safety.resultsDesc")}
          </p>
        </Card>
      </div>
    );
  }

  if (phase === "ethics") {
    const caseKey = ETHICS_CASE_KEYS[currentCaseIndex];
    return (
      <div className="page-shell max-w-2xl space-y-6">
        <header className="page-header flex flex-row items-center gap-2 text-primary">
          <BookmarkSimple className="w-5 h-5 shrink-0" aria-hidden />
          <h1 className="page-title text-foreground">{t("safety.ethics.title")}</h1>
        </header>

        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
          <span>{t("safety.ethics.case", { current: currentCaseIndex + 1, total: ETHICS_CASE_KEYS.length })}</span>
        </div>
        <Progress value={((currentCaseIndex) / ETHICS_CASE_KEYS.length) * 100} className="h-2 mb-8" />

        <Card className="p-6 border border-border bg-card">
          <p className="text-lg font-medium mb-8 leading-relaxed">
            {t(caseKey)}
          </p>

          <div className="space-y-8">
            <EthicsSlider
              value={ethicsValue}
              onChange={setEthicsValue}
              disabled={ethicsSubmitted}
            />

            {!ethicsSubmitted ? (
              <Button
                onClick={submitEthics}
                disabled={!ethicsValue}
                className={`w-full ${!ethicsValue ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {t("safety.submit")}
              </Button>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-md bg-[#f5f5f5] border border-border">
                    <div className="text-xs text-muted-foreground mb-1">{t("safety.your.position", { val: ethicsValue })}</div>
                    <div className="text-xl font-bold font-mono text-primary font-tabular-nums">{ethicsValue}</div>
                  </div>
                  <div className="p-4 rounded-md bg-[#f5f5f5] border border-border">
                    <div className="text-xs text-muted-foreground mb-1">{t("safety.community.avg", { avg: mockAvg })}</div>
                    <div className="text-xl font-bold font-mono text-muted-foreground font-tabular-nums">{mockAvg}</div>
                  </div>
                </div>
                <Button onClick={handleCaseNext} className="w-full">
                  {currentCaseIndex < ETHICS_CASE_KEYS.length - 1 ? t("safety.next") : t("common.done")}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const currentScenario = SCENARIOS[currentScenarioIndex];

  return (
    <div className="page-shell max-w-2xl space-y-6">
      <header className="page-header flex flex-row items-center gap-2 text-primary">
        <ShieldWarning className="w-5 h-5 shrink-0" aria-hidden />
        <h1 className="page-title text-foreground">{t("safety.defensive.title")}</h1>
      </header>

      <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
        <span>{t("safety.scenario", { current: currentScenarioIndex + 1, total: SCENARIOS.length })}</span>
      </div>
      <Progress value={((currentScenarioIndex) / SCENARIOS.length) * 100} className="h-2 mb-8" />

      <ScenarioCard
        scenario={currentScenario}
        onNext={handleScenarioNext}
        isExiting={isExiting}
      />
    </div>
  );
}
