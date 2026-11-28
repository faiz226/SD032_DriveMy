import { memo, useState, useId, isValidElement, cloneElement } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { MotionConfig } from "motion/react";
import {
  Gear,
  SignOut,
  List,
  X,
  CaretLeft,
  CaretRight,
  SquaresFour,
  Translate,
  Sun,
  Moon,
} from "@/components/ui/icons";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { BrandMark } from "@/components/shared/BrandMark";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { SwapIcon } from "@/components/ui/swap-icon";
import { NAV_DESTINATIONS } from "@/app/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Drawer,
  DrawerPopup,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { TranslationKey } from "@/lib/translations";

/** Memoized route outlet so toggling sidebar/drawer never reconciles the active page tree. */
const RouteContent = memo(function RouteContent({ routeKey }: { routeKey: string }) {
  return (
    <div key={routeKey} className="page-enter min-h-full">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </div>
  );
});

// ─── Nav item definition ──────────────────────────────────────────────────────

/** Icon stroke follows the label: a regular label gets a regular stroke, the current page a heavier one. */
function withWeight(icon: React.ReactNode, weight: "regular" | "bold") {
  return isValidElement<{ weight?: string }>(icon) ? cloneElement(icon, { weight }) : icon;
}

interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: React.ReactNode;
  end?: boolean;
  tabKey?: TranslationKey;
}

// Every destination in navigation.ts, in the order learners meet them.
const NAV_ITEMS: NavItem[] = NAV_DESTINATIONS.map(({ icon: Icon, ...item }) => ({
  ...item,
  icon: <Icon weight="regular" className="h-5 w-5" />,
}));

const UTILITY_ITEMS: NavItem[] = [
  { labelKey: "nav.settings", href: ROUTES.SETTINGS, icon: <Gear weight="regular" className="h-5 w-5" /> },
];

// The phone bar holds four tabs and a "More" sheet; everything else in the menu lives in that sheet.
const MOBILE_TABS: NavItem[] = NAV_ITEMS.filter((item) => item.tabKey);
const MORE_ORDER = [ROUTES.SIMULATIONS, ROUTES.PROGRESS, ROUTES.COLOR_VISION, ROUTES.RPK_RSM];
const MORE_ITEMS: NavItem[] = [
  ...MORE_ORDER.map((href) => NAV_ITEMS.find((item) => item.href === href)).filter((item): item is NavItem => !!item),
  ...UTILITY_ITEMS,
];

// ─── Quick theme toggle ───────────────────────────────────────────────────────

function ThemeToggleButton({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { isDark, setTheme } = useTheme();
  const nextLabel = t(isDark ? "settings.theme.light" : "settings.theme.dark");
  const ariaLabel = `${t("settings.theme")}: ${nextLabel}`;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        "glass-control glass-pill glass-ink",
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <SwapIcon id={isDark ? "sun" : "moon"}>
        {isDark ? (
          <Sun className="h-5 w-5" aria-hidden />
        ) : (
          <Moon className="h-5 w-5" aria-hidden />
        )}
      </SwapIcon>
    </button>
  );
}

// ─── Sidebar nav link ─────────────────────────────────────────────────────────

interface SideNavLinkProps {
  item: NavItem;
  onClick?: () => void;
}

function SideNavLink({ item, onClick }: SideNavLinkProps) {
  const { t } = useLanguage();
  const label = t(item.labelKey);

  return (
    <NavLink
      to={item.href}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "glass-control relative flex min-w-0 items-center gap-3 px-3.5 h-11 rounded-xl no-underline",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "glass-ink font-semibold" : "glass-muted font-medium hover:text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden="true"
              className="glass-pill pointer-events-none absolute inset-0 rounded-xl"
            />
          )}
          <span
            aria-hidden
            className={cn("relative z-10 shrink-0", isActive && "glass-accent-icon")}
          >
            {withWeight(item.icon, isActive ? "bold" : "regular")}
          </span>
          <span className="relative z-10 min-w-0 text-sm tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
            {label}
          </span>
          {isActive && <span className="sr-only">{t("a11y.currentPage")}</span>}
        </>
      )}
    </NavLink>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function Sidebar({ onClose, isMobile = false, collapsed = false, onToggleCollapse }: SidebarProps) {
  const { t, language, setLanguage } = useLanguage();
  const { isDark, setTheme } = useTheme();
  const { signOut, user } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.AUTH);
  };

  const handleLangToggle = () => {
    setLanguage(language === "en" ? "ms" : "en");
  };

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const themeTooltip = `${t("settings.theme")}: ${t(isDark ? "settings.theme.light" : "settings.theme.dark")}`;

  const displayName =
    (user?.user_metadata?.["full_name"] as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Guest";

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden",
        !isMobile && "glass-bar rounded-2xl"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 border-b border-foreground/10 dark:border-white/10",
          isMobile
            ? "h-[calc(4rem_+_env(safe-area-inset-top))] items-center justify-between px-4 pt-[env(safe-area-inset-top)]"
            : collapsed
              ? "flex-col items-center gap-2 py-3 px-2"
              : "h-16 items-center justify-between px-4"
        )}
      >
        {!collapsed ? (
          <BrandMark className="glass-ink select-none whitespace-nowrap" />
        ) : (
          <>
            <BrandMark wordmark={false} className="glass-ink" />
            <span className="sr-only">DriveMy</span>
          </>
        )}

        <div className="flex items-center gap-1">
          {!isMobile && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? t("a11y.expandSidebar") : t("a11y.collapseSidebar")}
              className="glass-control glass-muted inline-flex h-11 w-11 items-center justify-center rounded-full hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {collapsed ? (
                <CaretRight className="h-5 w-5" aria-hidden />
              ) : (
                <CaretLeft className="h-5 w-5" aria-hidden />
              )}
            </button>
          )}
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t("a11y.closeMenu")}
              className="glass-control glass-pill glass-ink inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={18} weight="bold" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {collapsed && !isMobile ? (
        <div className="flex flex-1 flex-col items-center justify-between overflow-y-auto py-3 px-2">
          <nav className="flex flex-col items-center gap-1" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const label = t(item.labelKey);
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  aria-label={label}
                  title={label}
                  className={({ isActive }) =>
                    cn(
                      "glass-control relative inline-flex h-11 w-11 items-center justify-center rounded-xl no-underline",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive ? "glass-ink" : "glass-muted hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="glass-pill pointer-events-none absolute inset-0 rounded-xl"
                        />
                      )}
                      <span
                        aria-hidden
                        className={cn("relative z-10", isActive && "glass-accent-icon")}
                      >
                        {withWeight(item.icon, isActive ? "bold" : "regular")}
                      </span>
                      {isActive && <span className="sr-only">{t("a11y.currentPage")}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="my-2 h-px w-8 shrink-0 bg-foreground/10 dark:bg-white/10" aria-hidden />

          <div className="flex flex-col items-center gap-1">
            {UTILITY_ITEMS.map((item) => {
              const label = t(item.labelKey);
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  aria-label={label}
                  title={label}
                  className={({ isActive }) =>
                    cn(
                      "glass-control relative inline-flex h-11 w-11 items-center justify-center rounded-xl no-underline",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive ? "glass-ink" : "glass-muted hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="glass-pill pointer-events-none absolute inset-0 rounded-xl"
                        />
                      )}
                      <span
                        aria-hidden
                        className={cn("relative z-10", isActive && "glass-accent-icon")}
                      >
                        {withWeight(item.icon, isActive ? "bold" : "regular")}
                      </span>
                      {isActive && <span className="sr-only">{t("a11y.currentPage")}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}

            <button
              type="button"
              onClick={handleThemeToggle}
              aria-label={themeTooltip}
              title={themeTooltip}
              className="glass-control glass-muted inline-flex h-11 w-11 items-center justify-center rounded-xl hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <SwapIcon id={isDark ? "sun" : "moon"}>
                {isDark ? (
                  <Sun className="h-5 w-5" aria-hidden />
                ) : (
                  <Moon className="h-5 w-5" aria-hidden />
                )}
              </SwapIcon>
            </button>

            <button
              type="button"
              onClick={handleLangToggle}
              aria-label={t("a11y.toggleLanguage")}
              title={language === "en" ? "Bahasa Malaysia" : "English"}
              className="glass-control glass-muted inline-flex h-11 w-11 items-center justify-center rounded-xl hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Translate weight="regular" className="h-5 w-5" aria-hidden />
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              aria-label={t("nav.signOut")}
              title={t("nav.signOut")}
              className="glass-control inline-flex h-11 w-11 items-center justify-center rounded-xl text-destructive hover:bg-destructive/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <SignOut weight="regular" className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <>
          <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <SideNavLink key={item.href} item={item} onClick={onClose} />
            ))}
          </nav>

          <div className="mx-3 h-px bg-foreground/10 dark:bg-white/10" aria-hidden />

          <div className="py-2.5 px-2.5 space-y-1">
            {UTILITY_ITEMS.map((item) => (
              <SideNavLink key={item.href} item={item} onClick={onClose} />
            ))}

            <button
              type="button"
              onClick={handleSignOut}
              aria-label={t("nav.signOut")}
              className={cn(
                "glass-control flex items-center gap-3 rounded-xl h-11 w-full px-3.5",
                "text-sm font-medium glass-muted",
                "hover:bg-destructive/12 hover:text-destructive",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <SignOut className="h-5 w-5 shrink-0" aria-hidden />
              <span className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
                {t("nav.signOut")}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-3 px-3.5 py-3 shrink-0 border-t border-foreground/10 dark:border-white/10">
            <div className="flex items-center justify-between gap-2">
              <LanguageToggle variant="pill" />
              <ThemeToggleButton />
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar className="h-8 w-8 text-xs" />
              <div className="min-w-0">
                <p className="glass-ink text-xs font-semibold truncate">{displayName}</p>
                {user?.email && (
                  <p className="glass-muted text-[11px] truncate">{user.email}</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Mobile bottom nav bar ────────────────────────────────────────────────────

function MobileBottomNav() {
  const { t } = useLanguage();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_ITEMS.some((item) => location.pathname.startsWith(item.href));
  const activeTabIndex = moreActive
    ? MOBILE_TABS.length
    : MOBILE_TABS.findIndex((item) =>
        item.end ? location.pathname === item.href : location.pathname.startsWith(item.href)
      );

  const tabClass = (active: boolean) =>
    cn(
      "relative z-10 flex min-w-0 flex-col items-center justify-center gap-0.5 no-underline",
      "min-h-[50px] rounded-full px-1 py-1.5 text-[11px] font-bold leading-none transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active ? "glass-ink" : "glass-muted hover:text-foreground"
    );

  return (
    <nav
      className="glass-bar fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 grid md:hidden grid-cols-5 items-center rounded-full p-1.5"
      aria-label="Mobile navigation"
    >
      {/* Single GPU-composited active capsule: slides via translate3d without layout projection or nested blur */}
      {activeTabIndex >= 0 && (
        <span
          aria-hidden="true"
          className="glass-pill pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-0.75rem)/5)] rounded-full transition-transform duration-200 ease-out will-change-transform"
          style={{ transform: `translate3d(${activeTabIndex * 100}%, 0, 0)` }}
        />
      )}

      {MOBILE_TABS.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.end}
          className={({ isActive }) => tabClass(isActive)}
        >
          {({ isActive }) => (
            <>
              <span
                aria-hidden
                className={cn(
                  "relative z-10 flex h-6 w-6 items-center justify-center",
                  isActive ? "glass-accent-icon" : "glass-muted"
                )}
              >
                {withWeight(item.icon, isActive ? "bold" : "regular")}
              </span>
              <span className="relative z-10 max-w-full truncate">{t(item.tabKey!)}</span>
              {isActive && <span className="sr-only">{t("a11y.currentPage")}</span>}
            </>
          )}
        </NavLink>
      ))}

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className={tabClass(moreActive)}
        >
          <span
            aria-hidden
            className={cn(
              "relative z-10 flex h-6 w-6 items-center justify-center",
              moreActive ? "glass-accent-icon" : "glass-muted"
            )}
          >
            <SquaresFour weight={moreActive ? "bold" : "regular"} className="h-5 w-5" />
          </span>
          <span className="relative z-10 max-w-full truncate">{t("nav.more")}</span>
          {moreActive && <span className="sr-only">{t("a11y.currentPage")}</span>}
        </button>

        <DrawerPopup showBar>
          <div className="flex items-center justify-between px-5 pt-3 pb-2">
            <DrawerTitle>{t("nav.more")}</DrawerTitle>
            <DrawerClose
              aria-label={t("common.close")}
              className={cn(
                "glass-control glass-pill glass-ink",
                "inline-flex h-11 w-11 items-center justify-center rounded-full",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <X size={18} weight="bold" aria-hidden />
            </DrawerClose>
          </div>
          <DrawerDescription className="sr-only">{t("nav.more")}</DrawerDescription>
          <ul className="divide-y divide-foreground/10 dark:divide-white/10 px-4">
            {MORE_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "glass-control glass-ink flex min-h-[52px] items-center gap-3.5 rounded-xl px-2 text-[15px] font-bold no-underline",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive && "font-extrabold"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden
                        className={cn("shrink-0", isActive ? "glass-accent-icon" : "glass-muted")}
                      >
                        {withWeight(item.icon, isActive ? "bold" : "regular")}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
                      {isActive && (
                        <>
                          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-brand" />
                          <span className="sr-only">{t("a11y.currentPage")}</span>
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </DrawerPopup>
      </Drawer>
    </nav>
  );
}

// ─── AppLayout ────────────────────────────────────────────────────────────────

interface AppLayoutProps {
  showSidebar?: boolean;
}

/**
 * The app shell for every signed-in page. The menu lives on the left: from md
 * up it is a floating Liquid Glass rail that folds into an icon rail, and on a
 * phone a floating glass top bar opens the same menu as a glass sheet from the
 * left while a floating glass tab bar keeps the main destinations a thumb away.
 * The simulator draws over all of it.
 */
export function AppLayout({ showSidebar: showSidebarProp = true }: AppLayoutProps) {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuId = useId();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const examMode = useUIStore((s) => s.examMode);
  const location = useLocation();

  // An exam in progress gets the screen to itself. The nav is removed rather
  // than hidden, so it is also out of the tab order and the accessibility tree
  // — a learner tabbing through a timed test cannot land on "Simulator".
  const showSidebar = showSidebarProp && !examMode;
  // The simulator draws full screen over the shell: keep the menu behind it out of the tab order and the reading order.
  const behindSimulator = /^\/simulations\/[^/]+/.test(location.pathname) ? true : undefined;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-[100dvh] w-full overflow-hidden">
        <a
          href="#main-content"
          className={cn(
            "sr-only focus:not-sr-only",
            "fixed top-2 left-2 z-[60] rounded-md bg-primary px-4 py-2",
            "text-primary-foreground text-sm font-medium shadow-lg",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          {t("a11y.skipToContent")}
        </a>

        {showSidebar && (
          <aside
            className={cn(
              "hidden md:flex flex-col flex-shrink-0 p-3 z-30 overflow-visible",
              sidebarCollapsed ? "w-[5.75rem]" : "w-[17.5rem]"
            )}
            aria-label="Main navigation"
            inert={behindSimulator}
          >
            <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
          </aside>
        )}

        {showSidebar && (
          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay/50 md:hidden" />
              <Dialog.Content
                id={mobileMenuId}
                aria-describedby={undefined}
                onOpenAutoFocus={(e) => {
                  e.preventDefault();
                  const node = e.currentTarget as HTMLElement;
                  requestAnimationFrame(() => {
                    node.querySelector<HTMLElement>("button, [href]")?.focus({ preventScroll: true });
                  });
                }}
                className="glass-sheet fixed inset-y-0 left-0 z-50 h-full w-72 max-w-[85vw] flex-shrink-0 rounded-r-3xl overflow-hidden md:hidden outline-none will-change-transform [contain:layout_style] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full duration-200 ease-out"
              >
                <Dialog.Title className="sr-only">{t("a11y.openMenu")}</Dialog.Title>
                <Sidebar isMobile onClose={() => setMobileOpen(false)} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        <div className="flex flex-1 flex-col overflow-hidden min-w-0 relative">
          {showSidebar && (
            <header
              className="glass-bar fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex md:hidden h-14 items-center justify-between gap-2 rounded-2xl px-1.5"
              role="banner"
              inert={behindSimulator}
            >
              <div className="flex min-w-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  aria-label={t("a11y.openMenu")}
                  aria-expanded={mobileOpen}
                  aria-controls={mobileMenuId}
                  className="glass-control glass-ink inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <List className="h-5 w-5" aria-hidden />
                </button>

                <BrandMark className="glass-ink select-none truncate [&_i]:h-5 [&_i]:w-2 [&_span]:text-[1.125rem] sm:[&_i]:h-6 sm:[&_i]:w-2.5 sm:[&_span]:text-[1.3rem]" />
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <ThemeToggleButton />
                <LanguageToggle variant="pill" />
                <NavLink
                  to={ROUTES.SETTINGS}
                  aria-label={t("nav.settings")}
                  className="hidden min-[390px]:grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <UserAvatar className="h-8 w-8 text-xs" />
                </NavLink>
              </div>
            </header>
          )}

          <main
            id="main-content"
            className={cn(
              "flex-1 overflow-y-auto canvas-subtle",
              showSidebar && "pt-[calc(4.75rem+env(safe-area-inset-top))] md:pt-0 pb-28 md:pb-0"
            )}
            tabIndex={-1}
          >
            <OfflineBanner />
            <RouteContent routeKey={location.pathname} />
          </main>

          {showSidebar && <div inert={behindSimulator}><MobileBottomNav /></div>}
        </div>
      </div>
    </MotionConfig>
  );
}
