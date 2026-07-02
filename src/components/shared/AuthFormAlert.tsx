import { Warning } from "phosphor-react";
import { cn } from "@/lib/utils";

interface AuthFormAlertProps {
  children: React.ReactNode;
  className?: string;
}

/** Accessible inline alert for auth forms (icon + message, not color-only). */
export function AuthFormAlert({ children, className }: AuthFormAlertProps) {
  return (
    <p
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-start gap-2 text-sm text-destructive",
        className
      )}
    >
      <Warning className="h-4 w-4 shrink-0 mt-0.5" weight="fill" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
