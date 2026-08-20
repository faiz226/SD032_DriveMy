import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lightning, Play } from "phosphor-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import "@/styles/jalan-type.css";
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
  // Shared by the practice quiz and the KPP1 mock, which is the point: if the
  // exam room's grammar only worked on the exam room it was fitted to one page,
  // not a system. A set here is chosen with the same painted bay used to choose
  // an answer there — square, kerb states selection, filled chip carries the
  // identity — so a learner meets one pattern, not two.
  //
  // Gone from the previous version: a #1e293b header band that belonged to no
  // palette, a 150px ghosted "?" behind it, three 10px uppercase eyebrows, and
  // an uppercase font-black submit. The plate voice is for signage; a button is
  // a control and gets .type-label-strong in sentence case.

  const ink = { color: "rgb(var(--road-ink))" };
  const muted = { color: "rgb(var(--road-muted))" };

  return (
    <div className="type-body mx-auto w-full max-w-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        <header>
          <p className="type-label text-sm" style={muted}>
            {mode === "quiz" ? t("launch.quizMaster") : t("launch.mockExam")}
          </p>
          <h1 className="type-display mt-1 text-3xl" style={ink}>
            {mode === "quiz" ? t("launch.quizMasterDesc") : t("launch.mockExamDesc")}
          </h1>
          {/* The concrete facts, which are what a returning learner actually
              came for — not a headline they have read thirty times. */}
          <p className="type-label mt-3 text-pretty text-[0.9375rem] leading-relaxed whitespace-pre-line" style={muted}>
            {mode === "quiz" ? t("launch.quizInfo") : t("launch.mockInfo")}
          </p>
        </header>

        <fieldset className="min-w-0">
          <legend className="type-label-strong mb-3 text-sm" style={ink}>
            {mode === "quiz" ? t("launch.selectSection") : t("launch.chooseMock")}
          </legend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {sections.map((sec) => {
              const isSelected = selectedSet === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setValue("setId", sec.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "bay focus-paint flex w-full min-w-0 items-center gap-3 p-3 text-left",
                    "transition-[border-color] duration-150 active:translate-y-px",
                    isSelected ? "bay-selected" : "bay-open"
                  )}
                >
                  <span
                    aria-hidden
                    style={{
                      borderRadius: "var(--r-plate)",
                      ...(isSelected
                        ? { backgroundColor: "rgb(var(--road-ink))", borderColor: "rgb(var(--road-ink))", color: "rgb(var(--road-raised))" }
                        : { borderColor: "rgb(var(--road-edge))", color: "rgb(var(--road-muted))" }),
                    }}
                    className="type-figure grid h-9 w-9 shrink-0 place-items-center border text-sm transition-colors duration-150"
                  >
                    {sec.id.replace("mock-", "")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="type-label-strong block truncate text-[0.9375rem]" style={ink}>
                      {t(sec.titleKey as TranslationKey)}
                    </span>
                    <span className="type-label block truncate text-sm" style={muted}>
                      {t(sec.descKey as TranslationKey)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register("setId")} />
        </fieldset>

        {/* The rules gate the button, so they come BEFORE it. Previously they
            sat underneath, which meant a learner read "Accept the rules to
            start" on a disabled control and had to scroll past it to find the
            checkbox that explained why. */}
        {mode === "mock" && (
          <section className="plate p-4">
            <h2 className="type-label-strong text-sm" style={ink}>{t("launch.examRules")}</h2>
            <ul className="type-label mt-2 space-y-1.5 text-sm" style={muted}>
              <li>{t("launch.rule1")}</li>
              <li>{t("launch.rule2")}</li>
              <li>{t("launch.rule3")}</li>
            </ul>
            <div className="mt-4 flex items-start gap-3 border-t pt-4" style={{ borderColor: "rgb(var(--road-edge))" }}>
              <Checkbox
                id="rulesAccepted"
                checked={rulesAccepted}
                onCheckedChange={(checked) => setValue("rulesAccepted", !!checked)}
                className="mt-0.5 shrink-0"
              />
              <label htmlFor="rulesAccepted" className="type-label cursor-pointer select-none text-sm leading-relaxed" style={ink}>
                {t("launch.acceptRules")}
              </label>
            </div>
          </section>
        )}

        <div>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={cn(
              "type-label-strong focus-paint tap flex w-full items-center justify-center gap-2 px-4 text-base",
              "transition-[opacity,transform] duration-150",
              isSubmitDisabled ? "cursor-not-allowed" : "active:translate-y-px"
            )}
            // A disabled control is exempt from WCAG 1.4.3, and that exemption
            // is worth nothing to a learner in the sun trying to read why they
            // cannot proceed — the label states the unmet condition. So it is
            // held to the same 4.5:1 as live text: grade-2 on grade-7 is
            // 6.16:1. The fill alone is 1.33:1 against the page, so the edge
            // carries the shape at 3.33:1.
            style={{
              borderRadius: "var(--r-plate)",
              backgroundColor: isSubmitDisabled ? "rgb(var(--grade-7))" : "rgb(var(--road-ink))",
              color: isSubmitDisabled ? "rgb(var(--grade-2))" : "rgb(var(--road-raised))",
              border: isSubmitDisabled ? "1px solid rgb(var(--road-edge))" : "1px solid rgb(var(--road-ink))",
            }}
          >
            {/* fill weight: this is the primary trigger — "this starts it". */}
            {mode === "quiz" ? <Lightning className="h-5 w-5 shrink-0" weight="fill" aria-hidden /> : <Play className="h-5 w-5 shrink-0" weight="fill" aria-hidden />}
            <span className="truncate">{buttonLabel}</span>
          </button>

          {mode === "quiz" && (
            <p className="type-label mt-3 text-pretty text-sm leading-relaxed whitespace-pre-line" style={muted}>
              {t("launch.quizHint")}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
