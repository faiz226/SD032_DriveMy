import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lightning, Play, ClipboardText } from "phosphor-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
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
  const { register, handleSubmit, watch, setValue } = useForm<LaunchForm>({
    resolver: zodResolver(launchSchema),
    defaultValues: { setId: undefined, rulesAccepted: false },
  });

  const selectedSet = watch("setId");
  const rulesAccepted = watch("rulesAccepted") || false;

  const onSubmit = (data: LaunchForm) => {
    // Pass 'en' as default since we show dual languages now
    onStart({ language: "en", setId: data.setId || (mode === "quiz" ? "A" : "mock-1") });
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

  return (
    <div className="max-w-xl mx-auto page-enter mt-10">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-card border rounded-3xl shadow-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#1e293b] text-white p-8 relative overflow-hidden">
          {mode === "mock" ? (
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-white/5 select-none pointer-events-none">
              <ClipboardText className="w-[160px] h-[160px]" weight="fill" />
            </div>
          ) : (
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-[150px] font-black text-white/5 select-none font-heading leading-none pointer-events-none">?</div>
          )}
          
          <div className="relative z-10">
            <div className="text-[10px] font-bold tracking-wider uppercase text-white/70 mb-2">
              {mode === "quiz" ? t("launch.quizMaster") : t("launch.mockExam")}
            </div>
            <h2 className="font-heading font-bold text-3xl mb-1 leading-tight text-white">
              {mode === "quiz" ? t("launch.quizMasterDesc") : t("launch.mockExamDesc")}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {mode === "quiz" ? t("launch.quizInfo") : t("launch.mockInfo")}
          </p>

          <div className="space-y-3">
            <label className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
              {mode === "quiz" ? t("launch.selectSection") : t("launch.chooseMock")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setValue("setId", sec.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98]",
                    selectedSet === sec.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground hover:border-foreground/30 hover:bg-muted/30"
                  )}
                >
                  <div className="text-[10px] font-bold tracking-wider uppercase opacity-60 mb-1">
                    {mode === "quiz" ? t("launch.section") : t("launch.mock")}
                  </div>
                  <div className="font-heading font-black text-3xl leading-none mb-2">
                    {sec.id.replace('mock-', '')}
                  </div>
                  <div className="font-bold text-sm">
                    {t(sec.titleKey as TranslationKey)}
                  </div>
                  <div className="text-xs opacity-70 mt-0.5 font-medium">
                    {t(sec.descKey as TranslationKey)}
                  </div>
                </button>
              ))}
            </div>
            <input type="hidden" {...register("setId")} />
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={cn(
              "w-full flex items-center justify-center gap-2 min-h-[56px] py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all",
              !isSubmitDisabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md active:scale-[0.99]"
                : "bg-muted/40 text-muted-foreground/60 cursor-not-allowed"
            )}
          >
            {mode === "quiz" ? (
              <Lightning className="w-5 h-5" weight="fill" />
            ) : (
              <Play className="w-5 h-5" weight="fill" />
            )}
            {buttonLabel}
          </button>

          {mode === "quiz" ? (
            <p className="text-xs text-center text-muted-foreground italic max-w-sm mx-auto leading-relaxed whitespace-pre-line">
              {t("launch.quizHint")}
            </p>
          ) : (
            <div className="bg-card border rounded-2xl p-5 md:p-6 space-y-4">
              <h3 className="font-heading font-bold text-sm text-foreground">{t("launch.examRules")}</h3>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside pl-1">
                <li>{t("launch.rule1")}</li>
                <li>{t("launch.rule2")}</li>
                <li>{t("launch.rule3")}</li>
              </ul>
              <div className="pt-3 border-t flex items-start gap-3">
                <Checkbox
                  id="rulesAccepted"
                  checked={rulesAccepted}
                  onCheckedChange={(checked) => setValue("rulesAccepted", !!checked)}
                  className="mt-0.5"
                />
                <label htmlFor="rulesAccepted" className="text-xs text-muted-foreground font-medium leading-relaxed cursor-pointer select-none">
                  {t("launch.acceptRules")}
                </label>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
