import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional left icon */
  leftIcon?: React.ReactNode;
  /** Optional right icon */
  rightIcon?: React.ReactNode;
  /** Error state */
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, error, ...props }, ref) => {
    if (leftIcon || rightIcon) {
      return (
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-muted-foreground pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-[0.9375rem] shadow-xs",
              "ring-offset-background",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:border-brand-ink focus-visible:ring-4 focus-visible:ring-brand-ink/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-base",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
              className
            )}
            aria-invalid={error}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-muted-foreground pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-[0.9375rem] shadow-xs",
          "ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:border-brand-ink focus-visible:ring-4 focus-visible:ring-brand-ink/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-base",
          error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
          className
        )}
        aria-invalid={error}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
