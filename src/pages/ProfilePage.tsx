import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Envelope, Calendar, CheckCircle, Clock, Circle } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import {
  useTheoryProgress,
  useOverallReadiness,
} from "@/hooks/useProgressStats";
import { getBestQuizScore, getBestMockTestScore, getSimulationsDone } from "@/services/analytics.service";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { TranslationKey } from "@/lib/translations/en";

type MilestoneState = "complete" | "inProgress" | "notStarted";

interface MilestoneRowProps {
  module: string;
  result: string;
  state: MilestoneState;
  stateLabel: string;
}

function MilestoneRow({ module, result, state, stateLabel }: MilestoneRowProps) {
  const StateIcon =
    state === "complete" ? CheckCircle : state === "inProgress" ? Clock : Circle;

  const stateColor =
    state === "complete"
      ? "text-success"
      : state === "inProgress"
        ? "text-primary"
        : "text-muted-foreground";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 py-3 px-4 rounded-md bg-background border border-border">
      <p className="text-sm font-medium text-foreground">{module}</p>
      <div className="flex flex-col sm:items-end gap-1">
        <p className="text-sm font-tabular-nums font-semibold text-foreground">
          {result}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium",
            stateColor
          )}
        >
          <StateIcon className="h-3.5 w-3.5" weight="fill" aria-hidden />
          {stateLabel}
        </span>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const userId = user?.id;

  const displayName =
    (user?.user_metadata?.["full_name"] as string | undefined) ??
    user?.email?.split("@")[0] ??
    "";

  const memberSince = user?.created_at
    ? format(new Date(user.created_at), "d MMM yyyy")
    : "-";

  const { data: theory, isPending: theoryPending } = useTheoryProgress();
  const { data: readiness, isPending: readinessPending } = useOverallReadiness();

  const { data: quizBest = 0, isPending: quizPending } = useQuery({
    queryKey: ["profile", "quizBest", userId],
    queryFn: () => getBestQuizScore(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: mockBest = 0, isPending: mockPending } = useQuery({
    queryKey: ["profile", "mockBest", userId],
    queryFn: () => getBestMockTestScore(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: simsDone = 0, isPending: simsPending } = useQuery({
    queryKey: ["profile", "simsDone", userId],
    queryFn: () => getSimulationsDone(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: colorBest, isPending: colorPending } = useQuery({
    queryKey: ["profile", "colorBest", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colorblind_results")
        .select("percentage")
        .eq("user_id", userId!)
        .order("percentage", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data && data.length > 0 ? (data[0] as { percentage: number }).percentage : null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const statusLabel = (state: MilestoneState): string => {
    const key: Record<MilestoneState, TranslationKey> = {
      complete: "profile.status.complete",
      inProgress: "profile.status.inProgress",
      notStarted: "profile.status.notStarted",
    };
    return t(key[state]);
  };

  const theoryPct = theory?.percentage ?? 0;
  const theoryState: MilestoneState =
    theoryPct >= 100 ? "complete" : theoryPct > 0 ? "inProgress" : "notStarted";

  const quizState: MilestoneState =
    quizBest >= 70 ? "complete" : quizBest > 0 ? "inProgress" : "notStarted";

  const mockState: MilestoneState =
    mockBest >= 70 ? "complete" : mockBest > 0 ? "inProgress" : "notStarted";

  const simState: MilestoneState =
    simsDone >= 8 ? "complete" : simsDone > 0 ? "inProgress" : "notStarted";

  const colorState: MilestoneState =
    colorBest !== null && colorBest !== undefined
      ? colorBest >= 70
        ? "complete"
        : "inProgress"
      : "notStarted";

  const readinessLabel = useMemo(() => {
    const composite = readiness?.composite ?? 0;
    if (composite >= 75) return t("profile.status.ready");
    if (composite >= 50) return t("profile.status.gettingThere");
    return t("profile.status.notReady");
  }, [readiness?.composite, t]);

  const readinessState: MilestoneState =
    (readiness?.composite ?? 0) >= 75
      ? "complete"
      : (readiness?.composite ?? 0) > 0
        ? "inProgress"
        : "notStarted";

  const initial = displayName.charAt(0).toUpperCase() || "?";

  return (
    <div className="page-shell max-w-5xl space-y-6">
      <header className="page-header">
        <h1 className="page-title">{t("nav.profile")}</h1>
        <p className="page-lead">{t("profile.accountDetails")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6 items-start">
        <section className="card-premium p-5 md:p-6 space-y-5">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("profile.identity")}
          </h2>

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

          <dl className="space-y-4">
            <div className="flex items-start gap-3 min-h-[48px]">
              <Envelope
                className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5"
                weight="regular"
                aria-hidden
              />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("profile.memberSince")}
                </dt>
                <dd className="text-sm font-tabular-nums text-foreground mt-1">
                  {memberSince}
                </dd>
              </div>
            </div>
          </dl>
        </section>

        <section className="card-premium p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("profile.licensingMilestones")}
            </h2>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {t("profile.milestone.module")} / {t("profile.milestone.result")}
            </span>
          </div>

          <div className="space-y-2">
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
                  result={
                    colorBest !== null && colorBest !== undefined
                      ? `${Math.round(colorBest)}%`
                      : "-"
                  }
                  state={colorState}
                  stateLabel={statusLabel(colorState)}
                />
                <MilestoneRow
                  module={t("profile.milestone.examReadiness")}
                  result={
                    readiness
                      ? t("profile.readinessScore", {
                          score: Math.round(readiness.composite),
                        })
                      : "-"
                  }
                  state={readinessState}
                  stateLabel={readinessLabel}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
