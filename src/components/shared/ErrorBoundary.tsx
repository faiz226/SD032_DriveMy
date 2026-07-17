import { Component, type ErrorInfo, type ReactNode } from "react";
import { Warning, ArrowClockwise } from "phosphor-react";
import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/react";
import { useLanguageStore } from "@/stores/languageStore";

function DefaultErrorFallback({ onReset, error }: { onReset: () => void, error: Error | null }) {
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
        {error && <p className="mt-2 text-sm text-red-500 font-mono">{error.message}</p>}
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
}

/**
 * Class-based error boundary — catches render errors in the subtree.
 * Displays a recoverable error UI with a retry button.
 * Wrap page-level components and heavy feature areas with this.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    }
    fetch('http://localhost:9999', { method: 'POST', body: error.message + '\n' + info.componentStack }).catch(() => {});
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
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <DefaultErrorFallback onReset={this.handleReset} error={this.state.error} />;
    }

    return this.props.children;
  }
}
