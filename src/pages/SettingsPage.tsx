import { useEffect, useState, useMemo } from "react";
import { Bell, Sun, Moon, Monitor, Envelope, Calendar, CheckCircle, Clock, Circle } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useThemeStore } from "@/stores/themeStore";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { del } from "idb-keyval";
import { format } from "date-fns";
import { useTheoryProgress, useOverallReadiness } from "@/hooks/useProgressStats";
import { getBestQuizScore, getBestMockTestScore, getSimulationsDone } from "@/services/analytics.service";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { TranslationKey } from "@/lib/translations/en";

const NOTIFICATIONS_KEY = "drivemy-notifications-enabled";

type MilestoneState = "complete" | "inProgress" | "notStarted";

interface MilestoneRowProps {
  module: string;
  result: string;
  state: MilestoneState;
  stateLabel: string;
}

function MilestoneRow({ module, result, state, stateLabel }: MilestoneRowProps) {
  const StateIcon = state === "complete" ? CheckCircle : state === "inProgress" ? Clock : Circle;
  const stateColor = state === "complete" ? "text-success" : state === "inProgress" ? "text-primary" : "text-muted-foreground";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 py-3 px-4 rounded-md bg-background border border-border">
      <p className="text-sm font-medium text-foreground">{module}</p>
      <div className="flex flex-col sm:items-end gap-1">
        <p className="text-sm font-tabular-nums font-semibold text-foreground">{result}</p>
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", stateColor)}>
          <StateIcon className="h-3.5 w-3.5" weight="fill" aria-hidden />
          {stateLabel}
        </span>
      </div>
    </div>
  );
}

function SettingsPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "card-premium p-5 md:p-6 space-y-5",
        className
      )}
      aria-labelledby={`settings-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <h2
        id={`settings-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1 max-w-readable">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center min-h-[48px]">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const userId = user?.id;
  const [notifications, setNotifications] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [resetStep, setResetStep] = useState(1);
  const [deleteStep, setDeleteStep] = useState(1);
  const { theme, setTheme } = useThemeStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    if (stored !== null) {
      setNotifications(stored === "true");
    }
  }, []);

  const handleNotificationsChange = (checked: boolean) => {
    setNotifications(checked);
    localStorage.setItem(NOTIFICATIONS_KEY, String(checked));
  };

  const handleResetProgress = async () => {
    if (!user?.id) {
      toast.error(t("common.error"));
      return;
    }
    setIsResetting(true);
    try {
      // 1. Delete from Supabase
      const tables = ['quiz_results', 'mock_test_results', 'simulation_results', 'colorblind_results', 'theory_progress'];
      await Promise.all(
        tables.map(tb => supabase.from(tb).delete().eq('user_id', user.id))
      );

      // 2. Clear offline queues in IndexedDB
      const queues = ['quizQueue', 'mockQueue', 'simulationQueue', 'colorblindQueue'];
      await Promise.all(queues.map(q => del(q)));

      // 3. Invalidate TanStack Query cache to update UI immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["theoryProgress"] }),
        queryClient.invalidateQueries({ queryKey: ["quizBest"] }),
        queryClient.invalidateQueries({ queryKey: ["mockBest"] }),
        queryClient.invalidateQueries({ queryKey: ["simsDone"] }),
        queryClient.invalidateQueries({ queryKey: ["recentActivity"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["progress"] }),
      ]);

      toast.success(t("settings.progressResetSuccess"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      toast.error(t("common.error"));
      return;
    }
    setIsDeleting(true);
    try {
      const tables = ['quiz_results', 'mock_test_results', 'simulation_results', 'colorblind_results', 'theory_progress'];
      await Promise.all(
        tables.map(tb => supabase.from(tb).delete().eq('user_id', user.id))
      );
      await supabase.from('profiles').delete().eq('id', user.id);
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;
      await signOut();
      navigate(ROUTES.AUTH);
      toast.success(t("settings.accountDeleted"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.AUTH);
    toast.success(t("settings.signOut"));
  };

  // --- Profile Data Fetching ---
  const displayName = (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email?.split("@")[0] ?? "";
  const memberSince = user?.created_at ? format(new Date(user.created_at), "d MMM yyyy") : "-";
  const initial = displayName.charAt(0).toUpperCase() || "?";

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
    <div className="page-shell max-w-5xl space-y-6 overflow-x-hidden">
      <header className="page-header">
        <h1 className="page-title">{t("settings.title")}</h1>
        <p className="page-lead">{t("settings.preferences")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6 items-start">
        {/* Left Column: Settings & Preferences */}
        <div className="space-y-6">
          <SettingsPanel title={t("settings.display")}>
            <SettingsRow label={t("settings.language")}>
              <LanguageToggle variant="pill" />
            </SettingsRow>

            <div className="h-px bg-border/50 my-1" aria-hidden />

            <SettingsRow
              label={t("settings.theme")}
              description={t("settings.themeDesc")}
            >
              <div className="flex rounded-full bg-muted/60 p-1 border border-border/40 select-none">
                {(["light", "dark", "system"] as const).map((tKey) => {
                  const isActive = theme === tKey;
                  const Icon = tKey === "light" ? Sun : tKey === "dark" ? Moon : Monitor;
                  return (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setTheme(tKey)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                        isActive
                          ? "bg-card text-foreground shadow-sm border border-border/10"
                          : "text-muted-foreground hover:text-foreground border border-transparent"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{t(`settings.theme.${tKey}`)}</span>
                    </button>
                  );
                })}
              </div>
            </SettingsRow>
          </SettingsPanel>

          <SettingsPanel title={t("settings.notifications")}>
            <SettingsRow
              label={t("settings.notifications")}
              description={t("settings.notificationsDesc")}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2 py-1 border",
                    notifications
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-border bg-muted text-muted-foreground"
                  )}
                >
                  <Bell className="h-3.5 w-3.5" weight="regular" aria-hidden />
                  {notifications
                    ? t("settings.notificationsOn")
                    : t("settings.notificationsOff")}
                </span>
                <Switch
                  checked={notifications}
                  onCheckedChange={handleNotificationsChange}
                  aria-label={t("settings.notifications")}
                />
              </div>
            </SettingsRow>
          </SettingsPanel>

          <SettingsPanel title={t("settings.dangerZone")}>
            <div className="flex flex-col divide-y divide-border/50 -mt-2">
              {/* Sign Out */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{t("settings.signOut")}</p>
                  <p className="text-sm text-muted-foreground">End your current session on this device.</p>
                </div>
                <div className="shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto min-h-[44px] rounded-md"
                    onClick={handleSignOut}
                  >
                    {t("settings.signOut")}
                  </Button>
                </div>
              </div>

              {/* Reset Progress */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{t("settings.resetProgress")}</p>
                  <p className="text-sm text-muted-foreground">Clear all your learning, quiz, and simulation progress. This cannot be undone.</p>
                </div>
                <div className="shrink-0">

                  <Drawer onOpenChange={(open: boolean) => { 
                    if (!open) { 
                      setResetConfirmText("");
                      setResetStep(1);
                    } 
                  }}>
                    <DrawerTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full sm:w-auto min-h-[44px] rounded-md"
                        loading={isResetting}
                        loadingLabel={t("common.resetting")}
                      >
                        {t("settings.resetProgress")}
                      </Button>
                    </DrawerTrigger>
                    <DrawerPopup showBar>
                      {resetStep === 1 ? (
                        <>
                          <DrawerHeader className="text-center">
                            <DrawerTitle>{t("settings.resetProgress")}</DrawerTitle>
                            <DrawerDescription>
                              This will clear all your learning and simulation progress data. Are you sure you want to proceed? This action is irreversible.
                            </DrawerDescription>
                          </DrawerHeader>
                          <DrawerFooter
                            className="justify-center sm:justify-center flex-row gap-2 mt-4"
                            variant="bare"
                          >
                            <DrawerClose asChild>
                              <Button variant="ghost">{t("common.cancel")}</Button>
                            </DrawerClose>
                            <Button variant="destructive" onClick={() => setResetStep(2)}>
                              I am sure
                            </Button>
                          </DrawerFooter>
                        </>
                      ) : (
                        <>
                          <DrawerHeader className="text-center">
                            <DrawerTitle>Final Confirmation</DrawerTitle>
                            <DrawerDescription>
                              Please type &quot;CONFIRM&quot; below to verify.
                            </DrawerDescription>
                          </DrawerHeader>
                          <DrawerPanel>
                            <div className="flex justify-center px-4">
                              <Input 
                                value={resetConfirmText}
                                onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
                                placeholder="CONFIRM"
                                className="text-center tracking-widest font-mono"
                                autoFocus
                              />
                            </div>
                          </DrawerPanel>
                          <DrawerFooter
                            className="justify-center sm:justify-center flex-row gap-2 mt-4"
                            variant="bare"
                          >
                            <Button variant="ghost" onClick={() => setResetStep(1)}>
                              {t("common.back")}
                            </Button>
                            <DrawerClose asChild>
                              <Button 
                                variant="destructive" 
                                onClick={handleResetProgress}
                                disabled={resetConfirmText !== "CONFIRM"}
                              >
                                {t("settings.resetProgress")}
                              </Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </>
                      )}
                    </DrawerPopup>
                  </Drawer>
                </div>
              </div>

              {/* Delete Account */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{t("settings.deleteAccount")}</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data. This cannot be undone.</p>
                </div>
                <div className="shrink-0">

                  <Drawer onOpenChange={(open: boolean) => { 
                    if (!open) {
                      setDeleteConfirmText("");
                      setDeleteStep(1);
                    }
                  }}>
                    <DrawerTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full sm:w-auto min-h-[44px] rounded-md"
                        loading={isDeleting}
                        loadingLabel={t("common.deleting")}
                      >
                        {t("settings.deleteAccount")}
                      </Button>
                    </DrawerTrigger>
                    <DrawerPopup showBar>
                      {deleteStep === 1 ? (
                        <>
                          <DrawerHeader className="text-center">
                            <DrawerTitle>{t("settings.deleteAccount")}</DrawerTitle>
                            <DrawerDescription>
                              This will permanently delete your account and all associated data. Are you sure you want to proceed? This action is irreversible.
                            </DrawerDescription>
                          </DrawerHeader>
                          <DrawerFooter
                            className="justify-center sm:justify-center flex-row gap-2 mt-4"
                            variant="bare"
                          >
                            <DrawerClose asChild>
                              <Button variant="ghost">{t("common.cancel")}</Button>
                            </DrawerClose>
                            <Button variant="destructive" onClick={() => setDeleteStep(2)}>
                              I am sure
                            </Button>
                          </DrawerFooter>
                        </>
                      ) : (
                        <>
                          <DrawerHeader className="text-center">
                            <DrawerTitle>Final Confirmation</DrawerTitle>
                            <DrawerDescription>
                              Please type &quot;CONFIRM&quot; below to verify.
                            </DrawerDescription>
                          </DrawerHeader>
                          <DrawerPanel>
                            <div className="flex justify-center px-4">
                              <Input 
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                                placeholder="CONFIRM"
                                className="text-center tracking-widest font-mono"
                                autoFocus
                              />
                            </div>
                          </DrawerPanel>
                          <DrawerFooter
                            className="justify-center sm:justify-center flex-row gap-2"
                            variant="bare"
                          >
                            <Button variant="ghost" onClick={() => setDeleteStep(1)}>
                              {t("common.back")}
                            </Button>
                            <DrawerClose asChild>
                              <Button 
                                variant="destructive" 
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== "CONFIRM"}
                              >
                                {t("settings.deleteAccount")}
                              </Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </>
                      )}
                    </DrawerPopup>
                  </Drawer>
                </div>
              </div>

            </div>
          </SettingsPanel>
        </div>

        {/* Right Column: Profile & Milestones */}
        <div className="space-y-6">
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
        </div>
      </div>
    </div>
  );
}
