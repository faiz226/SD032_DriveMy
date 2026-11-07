import { useMemo } from "react";
import { format } from "date-fns";
import { Envelope, Calendar } from "@/components/ui/icons";
import { useAuthStore } from "@/stores/authStore";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useQuizStats,
  useMockStats,
  useSimStats,
  useTheoryProgressStats,
  useOverallReadiness,
  useBestColorVisionScore,
} from "@/hooks/useProgressStats";
import { Skeleton } from "@/components/ui/skeleton";
import type { TranslationKey } from "@/lib/translations/en";
import { MilestoneRow, SettingsPanel, type MilestoneState } from "./SettingsPrimitives";

export function ProfileMilestonesSection() {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const userId = user?.id;

  // --- Profile Data Fetching ---
  const displayName = (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email?.split("@")[0] ?? "";
  const memberSince = user?.created_at ? format(new Date(user.created_at), "d MMM yyyy") : "-";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  const { data: theory, isPending: theoryPending } = useTheoryProgressStats();
  const { data: readiness, isPending: readinessPending } = useOverallReadiness();
  const { data: quizStats, isPending: quizPending } = useQuizStats();
  const { data: mockStats, isPending: mockPending } = useMockStats();
  const { data: simStats, isPending: simsPending } = useSimStats();
  const { data: colorBest, isPending: colorPending } = useBestColorVisionScore();

  const quizBest = quizStats?.best ?? 0;
  const mockBest = mockStats?.best ?? 0;
  const simsDone = simStats?.completed ?? 0;

  const statusLabel = (state: MilestoneState): string => {
    const key: Record<MilestoneState, TranslationKey> = {
      complete: "profile.status.complete",
      inProgress: "profile.status.inProgress",
      notStarted: "profile.status.notStarted",
    };
    return t(key[state]);
  };

  const theoryPct = theory?.percentage ?? 0;
  const theoryState: MilestoneState = theoryPct >= 100 ? "complete" : theoryPct > 0 ? "inProgress" : "notStarted";
  const quizState: MilestoneState = quizBest >= 70 ? "complete" : quizBest > 0 ? "inProgress" : "notStarted";
  const mockState: MilestoneState = mockBest >= 70 ? "complete" : mockBest > 0 ? "inProgress" : "notStarted";
  const simState: MilestoneState = simsDone >= 8 ? "complete" : simsDone > 0 ? "inProgress" : "notStarted";
  const colorState: MilestoneState = colorBest !== null && colorBest !== undefined ? (colorBest >= 70 ? "complete" : "inProgress") : "notStarted";

  const readinessLabel = useMemo(() => {
    const composite = readiness?.composite ?? 0;
    if (composite >= 75) return t("profile.status.ready");
    if (composite >= 50) return t("profile.status.gettingThere");
    return t("profile.status.notReady");
  }, [readiness?.composite, t]);

  const readinessState: MilestoneState = (readiness?.composite ?? 0) >= 75 ? "complete" : (readiness?.composite ?? 0) > 0 ? "inProgress" : "notStarted";

  return (
    <>
      <SettingsPanel title={t("profile.identity")}>
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground font-heading text-xl font-bold"
            aria-hidden
          >
            {user?.user_metadata?.["avatar_url"] ? (
              <img
                src={user.user_metadata["avatar_url"] as string}
                alt=""
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-heading text-lg font-semibold truncate">
              {displayName || t("nav.profile")}
            </p>
            <p className="text-xs text-muted-foreground font-tabular-nums">
              ID {userId?.slice(0, 8) ?? "-"}
            </p>
          </div>
        </div>

        <dl className="space-y-4 pt-2">
          <div className="flex items-start gap-3 min-h-[48px]">
            <Envelope
              className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5"
              weight="regular"
              aria-hidden
            />
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                {t("profile.email")}
              </dt>
              <dd className="text-sm text-foreground mt-1 break-all">
                {user?.email ?? "-"}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 min-h-[48px]">
            <Calendar
              className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5"
              weight="regular"
              aria-hidden
            />
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                {t("profile.memberSince")}
              </dt>
              <dd className="text-sm font-tabular-nums text-foreground mt-1">
                {memberSince}
              </dd>
            </div>
          </div>
        </dl>
      </SettingsPanel>

      <SettingsPanel title={t("profile.licensingMilestones")}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {t("profile.milestone.module")} / {t("profile.milestone.result")}
          </span>
        </div>

        <div className="space-y-2 mt-2">
          {theoryPending || quizPending || mockPending || simsPending || colorPending || readinessPending ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 py-3 px-4 rounded-md bg-background border border-border items-center min-h-[58px]">
                <Skeleton className="h-4 w-1/3" />
                <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : (
            <>
              <MilestoneRow
                module={t("profile.milestone.theory")}
                result={`${Math.round(theoryPct)}% (${theory?.completedModules ?? 0}/${theory?.totalModules ?? 12})`}
                state={theoryState}
                stateLabel={statusLabel(theoryState)}
              />
              <MilestoneRow
                module={t("profile.milestone.quiz")}
                result={quizBest > 0 ? `${Math.round(quizBest)}%` : "-"}
                state={quizState}
                stateLabel={statusLabel(quizState)}
              />
              <MilestoneRow
                module={t("profile.milestone.mock")}
                result={mockBest > 0 ? `${Math.round(mockBest)}%` : "-"}
                state={mockState}
                stateLabel={statusLabel(mockState)}
              />
              <MilestoneRow
                module={t("profile.milestone.simulator")}
                result={`${simsDone}/8`}
                state={simState}
                stateLabel={statusLabel(simState)}
              />
              <MilestoneRow
                module={t("profile.milestone.color")}
                result={colorBest !== null && colorBest !== undefined ? `${Math.round(colorBest)}%` : "-"}
                state={colorState}
                stateLabel={statusLabel(colorState)}
              />
              <MilestoneRow
                module={t("profile.milestone.examReadiness")}
                result={readiness ? t("profile.readinessScore", { score: Math.round(readiness.composite) }) : "-"}
                state={readinessState}
                stateLabel={readinessLabel}
              />
            </>
          )}
        </div>
      </SettingsPanel>
    </>
  );
}

