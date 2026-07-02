import { Component, type ErrorInfo, type ReactNode } from "react";
import { Warning, ArrowClockwise } from "phosphor-react";
import { Button } from "@/components/ui/button";

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
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <Warning className="h-12 w-12 text-destructive" aria-hidden />
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Something went wrong
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={this.handleReset}
            className="gap-2"
          >
            <ArrowClockwise className="h-4 w-4" aria-hidden />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
