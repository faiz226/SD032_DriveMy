/**
 * AppLayout — the shoulder and the carriageway.
 *
 * The nav rail is the road's shoulder: it runs alongside, it is quieter than
 * the surface it borders, and the item you are on is marked the way a lane is
 * marked — with paint down its edge, not with a grey pill behind it.
 *
 * Nav is grouped by the two halves of the JPJ licence itself, theory and
 * practical, because that is a real division the learner already thinks in.
 *
 * See DESIGN_SYSTEM.md.
 */
import { useState, useId } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  GridFour,
  Book,
  BookOpen,
  Clipboard,
  ShieldWarning,
  Eye,
  Car,
  TrendUp,
  Gear,
  SignOut,
  List,
  X,
  CaretLeft,
  CaretRight,
  Sun,
  Moon,
} from "phosphor-react";
import type { IconProps } from "phosphor-react";
import * as Dialog from "@radix-ui/react-dialog";
import { LanguageToggle } from "./LanguageToggle";
import { OfflineBanner } from "./OfflineBanner";
import { ErrorBoundary } from "./ErrorBoundary";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LPlate, RoadRule } from "@/components/ui/road";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { TranslationKey } from "@/lib/translations";

// ─── Nav model ────────────────────────────────────────────────────────────────

interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: React.ReactNode;
  end?: boolean;
}

interface NavGroup {
  /** Null for the top group, which needs no heading. */
  headKey: TranslationKey | null;
  items: NavItem[];
}

const icon = (Node: React.ComponentType<IconProps>) => (
  <Node weight="regular" className="h-[18px] w-[18px]" />
);

const NAV_GROUPS: NavGroup[] = [
  {
    headKey: null,
    items: [
      { labelKey: "nav.dashboard", href: ROUTES.DASHBOARD, icon: icon(GridFour), end: true },
    ],
  },
  {
    headKey: "nav.group.theory",
    items: [
      { labelKey: "nav.learn", href: ROUTES.THEORY, icon: icon(BookOpen) },
      { labelKey: "nav.quiz", href: ROUTES.QUIZ, icon: icon(Book) },
      { labelKey: "nav.mockTest", href: ROUTES.MOCK_TEST, icon: icon(Clipboard) },
    ],
  },
  {
    headKey: "nav.group.practical",
    items: [
      { labelKey: "nav.roadSigns", href: ROUTES.SAFETY, icon: icon(ShieldWarning) },
      { labelKey: "nav.simulator", href: ROUTES.SIMULATIONS, icon: icon(Car) },
      { labelKey: "nav.colorblind", href: ROUTES.COLOR_VISION, icon: icon(Eye) },
    ],
  },
  {
    headKey: "nav.group.record",
    items: [
      { labelKey: "nav.progress", href: ROUTES.PROGRESS, icon: icon(TrendUp) },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const UTILITY_ITEMS: NavItem[] = [
  { labelKey: "nav.settings", href: ROUTES.SETTINGS, icon: icon(Gear) },
];

/**
 * Six labels across a 390px phone leaves ~60px each, so the bottom bar takes
 * one-word forms. `nav.learn` at full length ("Theory Quiz", "My Progress")
 * overflowed and clipped the last item.
 */
const MOBILE_NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.short.dashboard", href: ROUTES.DASHBOARD, icon: icon(GridFour), end: true },
  { labelKey: "nav.short.learn", href: ROUTES.THEORY, icon: icon(BookOpen) },
  { labelKey: "nav.short.quiz", href: ROUTES.QUIZ, icon: icon(Book) },
  { labelKey: "nav.short.mockTest", href: ROUTES.MOCK_TEST, icon: icon(Clipboard) },
  { labelKey: "nav.short.simulator", href: ROUTES.SIMULATIONS, icon: icon(Car) },
  { labelKey: "nav.short.progress", href: ROUTES.PROGRESS, icon: icon(TrendUp) },
];

// ─── Wordmark ─────────────────────────────────────────────────────────────────

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex select-none items-center gap-2.5">
      <LPlate letter="L" size={compact ? 24 : 26} title="DriveMy" />
      {!compact && (
        <span className="type-display whitespace-nowrap text-lg text-foreground">
          DriveMy
        </span>
      )}
    </span>
  );
}

// ─── Rail link ────────────────────────────────────────────────────────────────

function RailLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const { t } = useLanguage();
  const label = t(item.labelKey);

  return (
    <NavLink
      to={item.href}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group relative flex min-h-[44px] min-w-0 items-center gap-3 py-2.5 pl-4 pr-3",
          "transition-colors duration-200 ease-out-quart",
          "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_rgb(var(--awas))]",
          isActive
            ? "text-sidebar-foreground"
            : "text-sidebar-foreground/55 hover:text-sidebar-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* The painted lane marker: paint down the edge, not a pill behind */}
          <span
            aria-hidden
            className={cn(
              "absolute inset-y-1 left-0 w-[3px] transition-opacity duration-200",
              isActive ? "bg-sidebar-primary opacity-100" : "opacity-0"
            )}
          />
          <span aria-hidden className="shrink-0">
            {item.icon}
          </span>
          <span
            className={cn(
              "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm",
              isActive ? "font-semibold" : "font-normal"
            )}
          >
            {label}
          </span>
          {isActive && <span className="sr-only">(current page)</span>}
        </>
      )}
    </NavLink>
  );
}

/** Collapsed rail: icons only, labels via tooltip. */
function RailIcon({ item }: { item: NavItem }) {
  const { t } = useLanguage();
  const label = t(item.labelKey);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to={item.href}
            end={item.end}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                "relative flex h-11 w-full items-center justify-center",
                "transition-colors duration-200 ease-out-quart",
                "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_rgb(var(--awas))]",
                isActive
                  ? "text-sidebar-foreground"
                  : "text-sidebar-foreground/55 hover:text-sidebar-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-1 left-0 w-[3px] transition-opacity duration-200",
                    isActive ? "bg-sidebar-primary opacity-100" : "opacity-0"
                  )}
                />
                {item.icon}
              </>
            )}
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Shoulder (the nav rail) ──────────────────────────────────────────────────

interface ShoulderProps {
  onClose?: () => void;
  isMobile?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function Shoulder({
  onClose,
  isMobile = false,
  collapsed = false,
  onToggleCollapse,
}: ShoulderProps) {
  const { t } = useLanguage();
  const { signOut, user } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.AUTH);
  };

  const displayName =
    (user?.user_metadata?.["full_name"] as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Guest";

  const railCollapsed = collapsed && !isMobile;

  return (
    <div className="flex h-full w-full flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* ── Head ── */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center",
          railCollapsed ? "justify-center px-0" : "justify-between pl-4 pr-2"
        )}
      >
        {railCollapsed ? (
          <Wordmark compact />
        ) : (
          <>
            <Wordmark />
            {!isMobile && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label={
                  collapsed ? t("a11y.expandSidebar") : t("a11y.collapseSidebar")
                }
                className="tap-sm flex items-center justify-center text-sidebar-foreground/55 transition-colors hover:text-sidebar-foreground focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--awas))]"
              >
                <CaretLeft className="h-4 w-4" aria-hidden />
              </button>
            )}
            {isMobile && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t("a11y.closeMenu")}
                className="tap flex items-center justify-center text-sidebar-foreground/55 transition-colors hover:text-sidebar-foreground focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--awas))]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            )}
          </>
        )}
      </div>

      {railCollapsed && onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={t("a11y.expandSidebar")}
          className="tap-sm mx-auto mb-1 flex items-center justify-center text-sidebar-foreground/45 transition-colors hover:text-sidebar-foreground focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--awas))]"
        >
          <CaretRight className="h-4 w-4" aria-hidden />
        </button>
      )}

      {/* ── Route list ── */}
      <nav
        className="hide-scrollbar flex-1 overflow-y-auto pb-4"
        aria-label="Main navigation"
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.headKey ?? "top"} className={cn(gi > 0 && "mt-5")}>
            {group.headKey && !railCollapsed ? (
              <div className="mb-1.5 flex items-center gap-3 pl-4 pr-4">
                <span className="type-label shrink-0 text-xs text-sidebar-foreground/45">
                  {t(group.headKey)}
                </span>
                <RoadRule state="open" className="flex-1 opacity-45" />
              </div>
            ) : null}
            {group.headKey && railCollapsed ? (
              <RoadRule state="open" className="mx-auto mb-2 w-8 opacity-45" />
            ) : null}
            {group.items.map((item) =>
              railCollapsed ? (
                <RailIcon key={item.href} item={item} />
              ) : (
                <RailLink key={item.href} item={item} onClick={onClose} />
              )
            )}
          </div>
        ))}
      </nav>

      {/* ── Utilities ── */}
      <div className="shrink-0 pb-2">
        <RoadRule
          state="closed"
          className={cn("mb-2 opacity-30", railCollapsed ? "mx-auto w-8" : "mx-4 w-auto")}
        />

        {railCollapsed ? (
          <div className="flex flex-col items-center">
            {UTILITY_ITEMS.map((item) => (
              <RailIcon key={item.href} item={item} />
            ))}
            <AnimatedThemeToggler
              variant="circle"
              aria-label={t("settings.theme")}
              className="flex h-11 w-full items-center justify-center border-none bg-transparent p-0 text-sidebar-foreground/55 transition-colors hover:bg-transparent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_rgb(var(--awas))]"
            >
              {isDark ? (
                <Sun className="h-[18px] w-[18px]" aria-hidden />
              ) : (
                <Moon className="h-[18px] w-[18px]" aria-hidden />
              )}
            </AnimatedThemeToggler>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label={t("nav.signOut")}
              className="flex h-11 w-full items-center justify-center text-sidebar-foreground/55 transition-colors hover:text-destructive focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_rgb(var(--awas))]"
            >
              <SignOut className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        ) : (
          <>
            {UTILITY_ITEMS.map((item) => (
              <RailLink key={item.href} item={item} onClick={onClose} />
            ))}

            <AnimatedThemeToggler
              variant="circle"
              aria-label={t("settings.theme")}
              className={cn(
                "flex min-h-[44px] w-full items-center gap-3 border-none bg-transparent py-2.5 pl-4 pr-3",
                "text-sm text-sidebar-foreground/55 transition-colors",
                "hover:bg-transparent hover:text-sidebar-foreground",
                "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_rgb(var(--awas))]"
              )}
            >
              {isDark ? (
                <Sun className="h-[18px] w-[18px] shrink-0" aria-hidden />
              ) : (
                <Moon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              )}
              <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {t("settings.theme")}
              </span>
            </AnimatedThemeToggler>

            <button
              type="button"
              onClick={handleSignOut}
              className={cn(
                "flex min-h-[44px] w-full items-center gap-3 py-2.5 pl-4 pr-3",
                "text-sm text-sidebar-foreground/55 transition-colors",
                "hover:text-destructive",
                "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_rgb(var(--awas))]"
              )}
            >
              <SignOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {t("nav.signOut")}
              </span>
            </button>
          </>
        )}
      </div>

      {/* ── Who is driving ── */}
      {!railCollapsed && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-sidebar-border px-4 py-3">
          <p className="type-label min-w-0 truncate text-xs text-sidebar-foreground/55">
            {displayName}
          </p>
          <LanguageToggle variant="pill" />
        </div>
      )}
    </div>
  );
}

// ─── Mobile bottom nav ────────────────────────────────────────────────────────

function MobileBottomNav() {
  const { t } = useLanguage();

  return (
    <nav
      className="flex h-[62px] shrink-0 items-stretch justify-around border-t border-border bg-sidebar md:hidden"
      aria-label="Mobile navigation"
    >
      {MOBILE_NAV_ITEMS.map((item) => {
        const label = t(item.labelKey);
        return (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "relative flex min-w-[48px] flex-1 flex-col items-center justify-center gap-1 px-1",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_rgb(var(--awas))]",
                isActive ? "text-foreground" : "text-foreground/50"
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Lane marker painted across the top of the active item */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-2 top-0 h-[3px] transition-opacity duration-200",
                    isActive ? "bg-awas opacity-100" : "opacity-0"
                  )}
                />
                <span aria-hidden>{item.icon}</span>
                <span
                  className={cn(
                    "type-label text-[10px] leading-none",
                    isActive && "font-semibold"
                  )}
                >
                  {label}
                </span>
                {isActive && <span className="sr-only">(current page)</span>}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

// ─── AppLayout ────────────────────────────────────────────────────────────────

interface AppLayoutProps {
  showSidebar?: boolean;
}

export function AppLayout({ showSidebar = true }: AppLayoutProps) {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuId = useId();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only",
          "fixed left-2 top-2 z-[60] bg-awas px-4 py-2 rounded-sm",
          "type-label-strong text-sm text-asphalt shadow-float",
          "focus-visible:outline-none"
        )}
      >
        {t("a11y.skipToContent")}
      </a>

      {showSidebar && (
        <aside
          className={cn(
            // impeccable-disable-next-line layout-transition -- deliberate container
            // resize: the rail collapse has to reflow the carriageway beside it, and
            // it is a rare, user-initiated action rather than a per-frame effect.
            "z-50 hidden flex-shrink-0 flex-col overflow-visible transition-[width] duration-300 ease-out-quart md:flex",
            sidebarCollapsed ? "w-[4.5rem]" : "w-60"
          )}
          aria-label="Main navigation"
        >
          <Shoulder collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
        </aside>
      )}

      {showSidebar && (
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay/60 md:hidden" />
            <Dialog.Content
              id={mobileMenuId}
              aria-describedby={undefined}
              className="fixed inset-y-0 left-0 z-50 h-full w-64 flex-shrink-0 shadow-drawer outline-none duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full md:hidden"
            >
              <Dialog.Title className="sr-only">{t("a11y.openMenu")}</Dialog.Title>
              <Shoulder isMobile onClose={() => setMobileOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {showSidebar && (
          <header
            className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-sidebar px-2 pr-3 md:hidden"
            role="banner"
          >
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t("a11y.openMenu")}
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
              className="tap flex items-center justify-center text-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_rgb(var(--awas))]"
            >
              <List className="h-5 w-5" aria-hidden />
            </button>

            <Wordmark />

            <LanguageToggle variant="pill" />
          </header>
        )}

        <OfflineBanner />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-background"
          tabIndex={-1}
        >
          <div className="min-h-full">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        {showSidebar && <MobileBottomNav />}
      </div>
    </div>
  );
}

export { ALL_NAV_ITEMS };
