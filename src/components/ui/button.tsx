import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Buttons in the "Jalan" system are plates, not pills: plate radius, plate
 * lettering, and a painted focus marker rather than a soft glow. Elevation
 * comes from contrast, not drop shadows.
 *
 * Touch targets are declared here rather than forced onto every element in the
 * document, which is what the old blanket base rule did.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-sm type-label-strong text-sm",
    "transition-[color,background-color,border-color,transform] duration-200 ease-out-quart",
    "min-h-[48px] min-w-[48px] px-5",
    // Painted focus marker — the same treatment the rest of the app uses.
    "focus-visible:outline-none",
    "focus-visible:shadow-[0_0_0_2px_rgb(var(--background)),0_0_0_5px_rgb(var(--awas))]",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/88 active:translate-y-[1px]",
        // The one action on a page that matters most. Painted, not filled with
        // brand colour for its own sake.
        awas:
          "bg-awas text-asphalt hover:bg-awas/88 active:translate-y-[1px]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/88 active:translate-y-[1px]",
        outline:
          "border border-foreground/25 bg-transparent hover:border-foreground/60 hover:bg-foreground/[0.04] active:translate-y-[1px]",
        secondary:
          "bg-muted text-foreground hover:bg-secondary active:translate-y-[1px]",
        ghost:
          "hover:bg-foreground/[0.06] active:translate-y-[1px]",
        // For use on the dark carriageway, where foreground/background invert.
        onRoad:
          "bg-paint/10 text-road-foreground border border-paint/25 hover:bg-paint/20 active:translate-y-[1px]",
        link:
          "font-medium text-foreground underline-offset-4 hover:underline min-h-0 min-w-0 px-0",
      },
      size: {
        default: "h-12 px-5",
        sm: "h-9 min-h-[36px] px-3 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-12 w-12 p-0",
        "icon-sm": "h-9 w-9 min-h-[36px] min-w-[36px] p-0",
      },
      loading: {
        true: "cursor-wait opacity-75",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  /** Accessible loading label */
  loadingLabel?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      loadingLabel = "Loading…",
      asChild = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, loading, className }))}
        disabled={disabled ?? loading}
        aria-busy={loading}
        aria-label={loading ? loadingLabel : props["aria-label"]}
        {...props}
      >
        {loading ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
            <span className="sr-only">{loadingLabel}</span>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
