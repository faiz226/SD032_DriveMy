import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Lightning, Play } from "@/components/ui/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/lib/translations";

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
  { id: "A", titleKey: "launch.sectionA", descKey: "launch.sectionADesc" },
  { id: "B", titleKey: "launch.sectionB", descKey: "launch.sectionBDesc" },
  { id: "C", titleKey: "launch.sectionC", descKey: "launch.sectionCDesc" }
];

const MOCK_SETS = [
  { id: "mock-1", titleKey: "launch.mock1", descKey: "launch.mockDesc" },
  { id: "mock-2", titleKey: "launch.mock2", descKey: "launch.mockDesc" },
  { id: "mock-3", titleKey: "launch.mock3", descKey: "launch.mockDesc" }
];

export function TestLaunchPanel({ mode, t, onStart }: TestLaunchPanelProps) {
  // The exam is sat in the learner's language. This used to be hardcoded to
  // "en" for everyone, on the stated grounds that both languages were shown —
  // but ExamShell renders exactly one language from this prop, so the dual
  // display never existed and the hardcode outlived the intent. The effect was
  // that every Malay learner practised in English for an exam JPJ sets in
  // Malay, while the screen above promised them both.
  const { language } = useLanguage();
  const { register, handleSubmit, watch, setValue } = useForm<LaunchForm>({
    resolver: zodResolver(launchSchema),
    defaultValues: { setId: undefined, rulesAccepted: false },
  });

  const selectedSet = watch("setId");
  const rulesAccepted = watch("rulesAccepted") || false;

  const onSubmit = (data: LaunchForm) => {
    onStart({ language, setId: data.setId || (mode === "quiz" ? "A" : "mock-1") });
  };

  const sections = mode === "quiz" ? KPP_SECTIONS : MOCK_SETS;
  
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

  // ── Render ──────────────────────────────────────────────────────────────────
  //
  // Shared by the practice quiz and the KPP mock. A set is chosen with the same
  // tile used to choose an answer in the exam room, so a learner meets one
  // pattern, not two.

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        <header>
          <p className="text-sm font-medium text-muted-foreground">
            {mode === "quiz" ? t("launch.quizMaster") : t("launch.mockExam")}
          </p>
          <h1 className="page-title mt-1.5">
            {mode === "quiz" ? t("launch.quizMasterDesc") : t("launch.mockExamDesc")}
          </h1>
          <p className="mt-3 whitespace-pre-line text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">
            {mode === "quiz" ? t("launch.quizInfo") : t("launch.mockInfo")}
          </p>
        </header>

        <fieldset className="min-w-0">
          <legend className="mb-3 text-sm font-semibold">
            {mode === "quiz" ? t("launch.selectSection") : t("launch.chooseMock")}
          </legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {sections.map((sec) => {
              const isSelected = selectedSet === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setValue("setId", sec.id)}
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
                    {sec.id.replace("mock-", "")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] font-semibold leading-snug">
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

        {/* The rules gate the button, so they come before it. */}
        {mode === "mock" && (
          <section className="panel p-5">
            <h2 className="text-base font-semibold">{t("launch.examRules")}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(["launch.rule1", "launch.rule2", "launch.rule3"] as const).map(rule => (
                <li key={rule} className="flex gap-2.5">
                  <CheckCircle size={18} weight="duotone" className="mt-px shrink-0 text-brand-ink" aria-hidden />
                  <span>{t(rule)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-start gap-3 border-t border-border pt-4">
              <Checkbox
                id="rulesAccepted"
                checked={rulesAccepted}
                onCheckedChange={(checked) => setValue("rulesAccepted", !!checked)}
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              <label htmlFor="rulesAccepted" className="cursor-pointer select-none text-sm leading-relaxed">
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

          {mode === "quiz" && (
            <p className="mt-3 whitespace-pre-line text-pretty text-sm leading-relaxed text-muted-foreground">
              {t("launch.quizHint")}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
