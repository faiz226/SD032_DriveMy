import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useLanguage } from "@/hooks/useLanguage";
import { ROUTES } from "@/lib/constants";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
import { exportUserData, deleteAccount, resetProgress, AccountCleanupError } from "@/services/account.service";
import { invalidateLearnerData } from "@/lib/queryKeys";
import {
  getUserPendingStatus,
  getUserDeadLetterItems,
  retryUserDeadLetterItem,
  syncOfflineResults,
} from "@/services/results.service";
import { LocalSessionTerminationError } from "@/services/auth.service";
import { hasTelemetryConsent, writeConsent } from "@/lib/consent";
import { initTelemetry, shutdownTelemetry } from "@/lib/telemetry";
import { SettingsPanel } from "./SettingsPrimitives";

export function DangerZoneSection() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const queryClient = useQueryClient();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [telemetryOn, setTelemetryOn] = useState(() => hasTelemetryConsent());

  const handleTelemetryChange = (next: boolean) => {
    writeConsent(next ? "granted" : "denied");
    setTelemetryOn(next);
    if (next) {
      initTelemetry();
    } else {
      // Stop transmitting immediately rather than at the next reload.
      shutdownTelemetry();
    }
  };

  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [resetStep, setResetStep] = useState(1);
  const [deleteStep, setDeleteStep] = useState(1);

  const [queueStatus, setQueueStatus] = useState<{ pendingCount: number; deadLetterCount: number }>({
    pendingCount: 0,
    deadLetterCount: 0,
  });
  const [isRetryingQueue, setIsRetryingQueue] = useState(false);

  useEffect(() => {
    const currentUserId = user?.id;
    if (currentUserId) {
      getUserPendingStatus(currentUserId)
        .then((status) => {
          if (useAuthStore.getState().user?.id === currentUserId) {
            setQueueStatus(status);
          }
        })
        .catch(() => undefined);
    } else {
      setQueueStatus({ pendingCount: 0, deadLetterCount: 0 });
    }
  }, [user?.id]);

  const handleRetryFailedQueue = async () => {
    const actionUserId = user?.id;
    if (!actionUserId) return;
    setIsRetryingQueue(true);
    try {
      const deadItems = await getUserDeadLetterItems(actionUserId);
      for (const item of deadItems) {
        if (useAuthStore.getState().user?.id !== actionUserId) return;
        await retryUserDeadLetterItem(item.table, item.id, actionUserId);
      }
      if (useAuthStore.getState().user?.id !== actionUserId) return;
      await syncOfflineResults(actionUserId);
      if (useAuthStore.getState().user?.id !== actionUserId) return;
      const updated = await getUserPendingStatus(actionUserId);
      if (useAuthStore.getState().user?.id === actionUserId) {
        setQueueStatus(updated);
        toast.success(
          deadItems.length > 0
            ? t("settings.retrySuccess")
            : t("settings.syncSuccess")
        );
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsRetryingQueue(false);
    }
  };

  const handleResetProgress = async () => {
    if (!user?.id) {
      toast.error(t("common.error"));
      return;
    }
    setIsResetting(true);
    try {
      await resetProgress(user.id);
      await invalidateLearnerData(queryClient);
      toast.success(t("settings.progressResetSuccess"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportData = async () => {
    if (!user?.id) {
      toast.error(t("common.error"));
      return;
    }
    setIsExporting(true);
    try {
      const blob = await exportUserData(user.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drivemy-data-${user.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("settings.dataExported"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      toast.error(t("common.error"));
      return;
    }
    const initiatingToken = useAuthStore.getState().session?.access_token;
    const initiatingUserId = user.id;
    setIsDeleting(true);
    try {
      await deleteAccount();
      try {
        await signOut();
      } catch (signOutErr) {
        console.warn("[settings] Local cleanup during signout after deletion had error:", signOutErr);
      }
      const currentToken = useAuthStore.getState().session?.access_token;
      const currentUserId = useAuthStore.getState().user?.id;
      const isStillOutgoingOrCleared =
        !currentToken ||
        (initiatingToken ? currentToken === initiatingToken : currentUserId === initiatingUserId);
      if (isStillOutgoingOrCleared) {
        navigate(ROUTES.AUTH);
        toast.success(t("settings.accountDeleted"));
      }
    } catch (err) {
      const currentToken = useAuthStore.getState().session?.access_token;
      const currentUserId = useAuthStore.getState().user?.id;
      const isStillOutgoingOrCleared =
        !currentToken ||
        (initiatingToken ? currentToken === initiatingToken : currentUserId === initiatingUserId);
      if (
        err instanceof AccountCleanupError ||
        (err as { name?: string })?.name === "AccountCleanupError"
      ) {
        try {
          await signOut();
        } catch {
          // ignore
        }
        if (isStillOutgoingOrCleared) {
          navigate(ROUTES.AUTH);
          toast.warning(t("settings.accountDeletedPartialCleanup"));
        }
      } else {
        toast.error(t("common.error"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    const initiatingToken = useAuthStore.getState().session?.access_token;
    const initiatingUserId = user?.id;
    try {
      await signOut();
      const currentToken = useAuthStore.getState().session?.access_token;
      const currentUserId = useAuthStore.getState().user?.id;
      const isStillOutgoingOrCleared =
        !currentToken ||
        (initiatingToken ? currentToken === initiatingToken : currentUserId === initiatingUserId);
      if (isStillOutgoingOrCleared) {
        navigate(ROUTES.AUTH);
        toast.success(t("settings.signOut"));
      }
    } catch (err) {
      const currentToken = useAuthStore.getState().session?.access_token;
      const currentUserId = useAuthStore.getState().user?.id;
      const isStillOutgoingOrCleared =
        !currentToken ||
        (initiatingToken ? currentToken === initiatingToken : currentUserId === initiatingUserId);
      if (
        err instanceof LocalSessionTerminationError ||
        (err as { name?: string })?.name === "LocalSessionTerminationError"
      ) {
        if (isStillOutgoingOrCleared) {
          navigate(ROUTES.AUTH);
          toast.warning(t("settings.signOutPartialCleanup"));
        }
      } else {
        if (isStillOutgoingOrCleared) {
          navigate(ROUTES.AUTH);
          toast.error(t("common.error"));
        }
      }
    }
  };

  return (
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

        {/* Error reporting consent — withdrawable, per PDPA. Only shown
            when a telemetry provider is actually configured. */}
        {import.meta.env.VITE_SENTRY_DSN && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{t("settings.telemetry")}</p>
              <p className="text-sm text-muted-foreground">{t("settings.telemetryDesc")}</p>
            </div>
            <div className="shrink-0">
              <Switch
                checked={telemetryOn}
                onCheckedChange={handleTelemetryChange}
                aria-label={t("settings.telemetry")}
              />
            </div>
          </div>
        )}

        {/* Privacy Policy */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{t("settings.privacyPolicy")}</p>
            <p className="text-sm text-muted-foreground">
              How we collect, use and retain your personal data.
            </p>
          </div>
          <div className="shrink-0">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto min-h-[44px] rounded-md"
              onClick={() => navigate(ROUTES.PRIVACY)}
            >
              {t("settings.privacyPolicy")}
            </Button>
          </div>
        </div>

        {/* Export My Data — PDPA 2010 §§30-34 / GDPR Art. 15 & 20 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{t("settings.exportData")}</p>
            <p className="text-sm text-muted-foreground">{t("settings.exportDataDesc")}</p>
          </div>
          <div className="shrink-0">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto min-h-[44px] rounded-md"
              onClick={handleExportData}
              loading={isExporting}
              loadingLabel={t("common.loading")}
            >
              {t("settings.exportData")}
            </Button>
          </div>
        </div>

        {/* Offline Results Sync & Recovery */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{t("settings.offlineRecoveryTitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t("settings.offlineRecoveryDesc", { pending: queueStatus.pendingCount, dead: queueStatus.deadLetterCount })}
            </p>
          </div>
          <div className="shrink-0 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto min-h-[44px] rounded-md"
              onClick={handleRetryFailedQueue}
              disabled={isRetryingQueue || (queueStatus.pendingCount === 0 && queueStatus.deadLetterCount === 0)}
              loading={isRetryingQueue}
              loadingLabel={t("common.loading")}
            >
              {queueStatus.deadLetterCount > 0 ? t("settings.retryFailedSubmissions") : t("settings.syncPendingResults")}
            </Button>
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
  );
}

