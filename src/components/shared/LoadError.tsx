import { Warning, ArrowClockwise } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

interface LoadErrorProps {
  /** Called when the user asks to try again — usually a react-query refetch. */
  onRetry?: () => void;
  /** Optional override for the message. Keep it non-technical. */
  message?: string;
  className?: string;
}

/**
 * Shown when a page's data fails to load.
 *
 * Dashboard, Progress, Theory and Settings previously had NO error branch at
 * all — only `isLoading`. So a Supabase hiccup, an expired session or a dropped
 * connection left the user staring at a loading skeleton forever, with no
 * explanation and no way to retry. A shimmer that never resolves reads as "this
 * app is broken", which is both worse than an error message and less true.
 */
export function LoadError({ onRetry, message, className }: LoadErrorProps) {
  const { t } = useLanguage();

  return (
    <div
      role="alert"
      className={
        className ??
        "flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-8 text-center min-h-[240px]"
      }
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Warning className="h-7 w-7 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{t("common.loadFailed")}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {message ?? t("common.loadFailedDesc")}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <ArrowClockwise className="h-4 w-4" aria-hidden />
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
