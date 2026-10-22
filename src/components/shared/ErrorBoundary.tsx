import { Component, type ErrorInfo, type ReactNode } from "react";
import { Warning, ArrowClockwise } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/react";
import { isTelemetryActive } from "@/lib/telemetry";
import { useLanguageStore } from "@/stores/languageStore";

function DefaultErrorFallback({ onReset, eventId }: { onReset: () => void, eventId: string | null }) {
  const t = useLanguageStore((s) => s.t);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <Warning className="h-12 w-12 text-destructive" aria-hidden />
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {t("common.error")}
        </h2>
        {/*
          The raw error.message is deliberately NOT rendered: it leaks internal
          identifiers, PostgREST error text and table/column names to end users,
          and is never translated. The full detail goes to the console and to
          Sentry; users get a reference code instead.
        */}
        {eventId && (
          <p className="mt-2 text-xs text-muted-foreground font-mono">
            {t("common.errorReference")}: {eventId}
          </p>
        )}
      </div>
      <Button
        variant="outline"
        onClick={onReset}
        className="gap-2"
      >
        <ArrowClockwise className="h-4 w-4" aria-hidden />
        {t("common.retry")}
      </Button>
    </div>
  );
}

interface Props {
  children:  ReactNode;
  /** Custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error:    Error | null;
  /** Sentry event id, shown to the user as a support reference. */
  eventId:  string | null;
}

/**
 * Class-based error boundary — catches render errors in the subtree.
 * Displays a recoverable error UI with a retry button.
 * Wrap page-level components and heavy feature areas with this.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    // Gate on isTelemetryActive(), not on the DSN: a DSN can be configured
    // while the user has declined or not yet decided, and capturing then would
    // route around their choice.
    if (isTelemetryActive()) {
      const eventId = Sentry.captureException(error, {
        extra: { componentStack: info.componentStack },
      });
      // Surfaced to the user so support can correlate a report to an event
      // without exposing the underlying error text.
      this.setState({ eventId });
    }
  }

  handleReset = () => {
    // If it's a chunk load error, reload the page
    if (
      this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
      this.state.error?.message?.includes("Importing a module script failed") ||
      this.state.error?.name === "ChunkLoadError"
    ) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null, eventId: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <DefaultErrorFallback onReset={this.handleReset} eventId={this.state.eventId} />;
    }

    return this.props.children;
  }
}
