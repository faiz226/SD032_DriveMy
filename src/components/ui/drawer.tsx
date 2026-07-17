import * as React from "react";
import { Drawer as Vaul } from "vaul";
import { cn } from "@/lib/utils";

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof Vaul.Root>) => (
  <Vaul.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = "Drawer";

const DrawerTrigger = Vaul.Trigger;

const DrawerPopup = React.forwardRef<
  React.ElementRef<typeof Vaul.Content>,
  React.ComponentPropsWithoutRef<typeof Vaul.Content> & { showBar?: boolean }
>(({ className, children, showBar, ...props }, ref) => (
  <Vaul.Portal>
    <Vaul.Overlay className="fixed inset-0 z-50 bg-black/80" />
    <Vaul.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      {showBar && (
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      )}
      <div className="pb-8">{children}</div>
    </Vaul.Content>
  </Vaul.Portal>
));
DrawerPopup.displayName = "DrawerPopup";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center", className)}
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
      "text-lg font-semibold leading-none tracking-tight",
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
    className={cn("text-sm text-muted-foreground", className)}
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
