import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Lightning, Play, Car } from "@/components/ui/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/lib/translations";
import type { LicenseTrack } from "@/types/database";

const TRACK_STORAGE_KEY = "drivemy-license-track";

interface TestLaunchPanelProps {
  mode: "quiz" | "mock";
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  onStart: (config: { language: "en" | "ms"; setId?: string }) => void;
}

const launchSchema = z.object({
  setId: z.string().optional(),
  rulesAccepted: z.boolean().optional(),
});
type LaunchForm = z.infer<typeof launchSchema>;

const KPP_SECTIONS = [
  { id: "A", titleKey: "launch.sectionA", descKey: "launch.sectionADesc", count: 15 },
  { id: "B", titleKey: "launch.sectionB", descKey: "launch.sectionBDesc", count: 25 },
  { id: "C", titleKey: "launch.sectionC", descKey: "launch.sectionCDesc", count: 15 },
] as const;

const MOCK_NUMBERS = [
  { num: 1, titleKey: "launch.mock1", descKey: "launch.mockDesc" },
  { num: 2, titleKey: "launch.mock2", descKey: "launch.mockDesc" },
] as const;

function buildQuizSetId(part: string, setNum: number, track: LicenseTrack): string {
  if (part === "A") return `quiz-a-${setNum}`;
  if (part === "B") return `quiz-b-${setNum}`;
  return track === "D" ? `quiz-c-d-${setNum}` : `quiz-c-da-${setNum}`;
}

function buildMockSetId(setNum: number, track: LicenseTrack): string {
  return track === "D" ? `mock-d-combined-${setNum}` : `mock-da-combined-${setNum}`;
}

export function TestLaunchPanel({ mode, t, onStart }: TestLaunchPanelProps) {
  const { language } = useLanguage();
  const [track, setTrack] = useState<LicenseTrack>(() => {
    try {
      return localStorage.getItem(TRACK_STORAGE_KEY) === "D" ? "D" : "DA";
    } catch {
      return "DA";
    }
  });
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedPracticeNum, setSelectedPracticeNum] = useState<number>(1);
  const [selectedMockNum, setSelectedMockNum] = useState<number | null>(null);

  const { register, handleSubmit, watch, setValue } = useForm<LaunchForm>({
    resolver: zodResolver(launchSchema),
    defaultValues: { setId: undefined, rulesAccepted: false },
  });

  const selectedSet = watch("setId");
  const rulesAccepted = watch("rulesAccepted") || false;

  const handleTrackChange = (nextTrack: LicenseTrack) => {
    setTrack(nextTrack);
    try {
      localStorage.setItem(TRACK_STORAGE_KEY, nextTrack);
    } catch {
      // Ignore storage failures
    }
    if (mode === "quiz" && selectedPart) {
      setValue("setId", buildQuizSetId(selectedPart, selectedPracticeNum, nextTrack));
    } else if (mode === "mock" && selectedMockNum !== null) {
      setValue("setId", buildMockSetId(selectedMockNum, nextTrack));
    }
  };

  const handleSelectPart = (partId: string) => {
    setSelectedPart(partId);
    setValue("setId", buildQuizSetId(partId, selectedPracticeNum, track));
  };

  const handleSelectPracticeNum = (num: number) => {
    setSelectedPracticeNum(num);
    const activePart = selectedPart || "A";
    if (!selectedPart) setSelectedPart("A");
    setValue("setId", buildQuizSetId(activePart, num, track));
  };

  const handleSelectMockNum = (num: number) => {
    setSelectedMockNum(num);
    setValue("setId", buildMockSetId(num, track));
  };

  const onSubmit = (data: LaunchForm) => {
    const fallbackSet = mode === "quiz"
      ? buildQuizSetId(selectedPart || "A", selectedPracticeNum, track)
      : buildMockSetId(selectedMockNum || 1, track);
    onStart({ language, setId: data.setId || fallbackSet });
  };

  const isSubmitDisabled = mode === "quiz" ? !selectedSet : (!selectedSet || !rulesAccepted);

  let buttonLabel = t("launch.btnMasterRoad");
  if (mode === "mock") {
    if (!selectedSet) {
      buttonLabel = t("launch.btnSelectMock");
    } else if (!rulesAccepted) {
      buttonLabel = t("launch.btnAcceptRules");
    } else {
      buttonLabel = t("launch.btnStartMock");
    }
  }

  const activePartConfig = KPP_SECTIONS.find((s) => s.id === (selectedPart || "A")) ?? KPP_SECTIONS[0];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        <header>
          <h1 className="page-title">
            {mode === "quiz" ? t("launch.quizMaster") : t("launch.mockExam")}
          </h1>
          <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">
            {mode === "quiz" ? t("launch.quizMasterDesc") : t("launch.mockInfo")}
          </p>
        </header>

        {/* Transmission Class Selector (Class DA Automatic vs Class D Manual) */}
        <fieldset className="min-w-0">
          <legend className="mb-3 text-sm font-semibold">
            {t("launch.licenseTrack")}
          </legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {([
              { id: "DA" as const, titleKey: "launch.trackDA", descKey: "launch.trackDADesc" },
              { id: "D" as const, titleKey: "launch.trackD", descKey: "launch.trackDDesc" },
            ]).map((item) => {
              const isSelected = track === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTrackChange(item.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "tile flex w-full min-w-0 items-center gap-3 p-4 text-left",
                    isSelected ? "tile-selected" : "tile-open"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "type-figure grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm transition-colors duration-150",
                      isSelected ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {item.id}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-base font-semibold leading-snug">
                      <Car className="h-4 w-4 shrink-0" aria-hidden />
                      {t(item.titleKey as TranslationKey)}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      {t(item.descKey as TranslationKey)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {mode === "quiz" ? (
          <>
            <fieldset className="min-w-0">
              <legend className="mb-3 text-sm font-semibold">
                {t("launch.selectSection")}
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {KPP_SECTIONS.map((sec) => {
                  const isSelected = selectedPart === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => handleSelectPart(sec.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        "tile flex w-full min-w-0 items-center gap-3 p-4 text-left sm:flex-col sm:items-start",
                        isSelected ? "tile-selected" : "tile-open"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "type-figure grid h-10 w-10 shrink-0 place-items-center rounded-xl text-base transition-colors duration-150",
                          isSelected ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {sec.id}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold leading-snug">
                          {t(sec.titleKey as TranslationKey)}
                        </span>
                        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                          {t(sec.descKey as TranslationKey)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="min-w-0">
              <legend className="mb-3 text-sm font-semibold">
                {t("launch.selectPracticeSet")}
              </legend>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {[1, 2, 3].map((num) => {
                  const isSelected = Boolean(selectedPart) && selectedPracticeNum === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSelectPracticeNum(num)}
                      aria-pressed={isSelected}
                      className={cn(
                        "tile flex items-center gap-2.5 p-3 text-left",
                        isSelected ? "tile-selected" : "tile-open"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "type-figure grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm transition-colors duration-150",
                          isSelected ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {num}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-tight">
                          {t("launch.practiceSetNum", { num })}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {t("launch.practiceSetQuestions", { count: activePartConfig.count })}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <input type="hidden" {...register("setId")} />
            </fieldset>
          </>
        ) : (
          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-semibold">
              {t("launch.chooseMock")}
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {MOCK_NUMBERS.map((sec) => {
                const isSelected = selectedMockNum === sec.num;
                return (
                  <button
                    key={sec.num}
                    type="button"
                    onClick={() => handleSelectMockNum(sec.num)}
                    aria-pressed={isSelected}
                    className={cn(
                      "tile flex w-full min-w-0 items-center gap-3 p-4 text-left sm:flex-col sm:items-start",
                      isSelected ? "tile-selected" : "tile-open"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "type-figure grid h-10 w-10 shrink-0 place-items-center rounded-xl text-base transition-colors duration-150",
                        isSelected ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {sec.num}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold leading-snug">
                        {t(sec.titleKey as TranslationKey)}
                      </span>
                      <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                        {t(sec.descKey as TranslationKey)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register("setId")} />
          </fieldset>
        )}

        {/* The rules gate the button, so they come before it. */}
        {mode === "mock" && (
          <section className="panel p-5">
            <h2 className="text-base font-semibold">{t("launch.examRules")}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2.5">
                <CheckCircle size={18} weight="duotone" className="mt-px shrink-0 text-brand-ink" aria-hidden />
                <span>{t("launch.rule3")}</span>
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-3 border-t border-border pt-2">
              <Checkbox
                id="rulesAccepted"
                checked={rulesAccepted}
                onCheckedChange={(checked) => setValue("rulesAccepted", !!checked)}
                className="h-5 w-5 shrink-0"
              />
              <label htmlFor="rulesAccepted" className="flex min-h-11 flex-1 cursor-pointer select-none items-center py-2 text-sm leading-relaxed">
                {t("launch.acceptRules")}
              </label>
            </div>
          </section>
        )}

        <div>
          {/* A disabled start keeps a readable label (5.2:1), because the label
              states the unmet condition a learner needs to see. */}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitDisabled}
            className={cn("w-full", isSubmitDisabled && "bg-muted text-muted-foreground shadow-none disabled:opacity-100")}
          >
            {mode === "quiz" ? <Lightning className="!size-5" weight="fill" aria-hidden /> : <Play className="!size-5" weight="fill" aria-hidden />}
            <span className="truncate">{buttonLabel}</span>
          </Button>

        </div>
      </form>
    </div>
  );
}
