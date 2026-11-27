import * as React from "react";
import { Drawer as Vaul } from "vaul";
import { cn } from "@/lib/utils";

const Drawer = ({
  shouldScaleBackground = false,
  repositionInputs = false,
  ...props
}: React.ComponentProps<typeof Vaul.Root>) => (
  <Vaul.Root shouldScaleBackground={shouldScaleBackground} repositionInputs={repositionInputs} {...props} />
);
Drawer.displayName = "Drawer";

const DrawerTrigger = Vaul.Trigger;

const DrawerPopup = React.forwardRef<
  React.ElementRef<typeof Vaul.Content>,
  React.ComponentPropsWithoutRef<typeof Vaul.Content> & { showBar?: boolean }
>(({ className, children, showBar, ...props }, ref) => (
  <Vaul.Portal>
    <Vaul.Overlay className="fixed inset-0 z-50 bg-overlay/50" />
    <Vaul.Content
      ref={ref}
      className={cn(
        "glass-sheet fixed inset-x-3 bottom-3 z-50 mt-24 flex h-auto max-h-[85dvh] flex-col rounded-3xl outline-none will-change-transform [contain:layout_style]",
        className
      )}
      // Open on the first control without forcing synchronous layout on mount frame.
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        const node = e.currentTarget as HTMLElement;
        requestAnimationFrame(() => {
          node.querySelector<HTMLElement>("input, button, [href]")?.focus({ preventScroll: true });
        });
      }}
      {...props}
    >
      {showBar && (
        <div
          aria-hidden="true"
          className="mx-auto mt-3 h-1.5 w-11 shrink-0 rounded-full bg-foreground/25 dark:bg-white/30"
        />
      )}
      <div className="overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
    </Vaul.Content>
  </Vaul.Portal>
));
DrawerPopup.displayName = "DrawerPopup";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-left", className)}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerPanel = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-4", className)} {...props} />
);
DrawerPanel.displayName = "DrawerPanel";

const DrawerFooter = ({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "bare" }) => (
  <div
    className={cn(
      "flex flex-col gap-2 p-4",
      variant === "bare" ? "p-0" : "",
      className
    )}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof Vaul.Title>,
  React.ComponentPropsWithoutRef<typeof Vaul.Title>
>(({ className, ...props }, ref) => (
  <Vaul.Title
    ref={ref}
    className={cn(
      "glass-ink font-heading text-lg font-extrabold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DrawerTitle.displayName = Vaul.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof Vaul.Description>,
  React.ComponentPropsWithoutRef<typeof Vaul.Description>
>(({ className, ...props }, ref) => (
  <Vaul.Description
    ref={ref}
    className={cn("glass-muted text-sm", className)}
    {...props}
  />
));
DrawerDescription.displayName = Vaul.Description.displayName;

const DrawerClose = Vaul.Close;

export {
  Drawer,
  DrawerTrigger,
  DrawerPopup,
  DrawerHeader,
  DrawerPanel,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
};
