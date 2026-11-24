import { useState, useId, isValidElement, cloneElement } from "react";
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
} from "@/components/ui/icons";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { BrandMark } from "@/components/shared/BrandMark";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { NAV_DESTINATIONS } from "@/app/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Drawer, DrawerPopup, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useLanguage } from "@/hooks/useLanguage";
import { VerticalDock, DockItem, DockIcon } from "@/components/ui/vertical-dock";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { TranslationKey } from "@/lib/translations";

// ─── Nav item definition ──────────────────────────────────────────────────────

/** Icon stroke follows the label: a regular label gets a regular stroke, the current page a heavier one. */
function withWeight(icon: React.ReactNode, weight: "regular" | "bold") {
  return isValidElement<{ weight?: string }>(icon) ? cloneElement(icon, { weight }) : icon;
}

interface NavItem {
  labelKey: TranslationKey;
  href:     string;
  icon:     React.ReactNode;
  end?:     boolean;
  tabKey?:  TranslationKey;
}

// Every destination in navigation.ts, in the order learners meet them.
const NAV_ITEMS: NavItem[] = NAV_DESTINATIONS.map(({ icon: Icon, ...item }) => ({
  ...item,
  icon: <Icon weight="regular" className="h-5 w-5" />,
}));

const UTILITY_ITEMS: NavItem[] = [
  { labelKey: "nav.settings",   href: ROUTES.SETTINGS,     icon: <Gear weight="regular" className="h-5 w-5" /> },
];

// The phone bar holds four tabs and a "More" sheet; everything else in the menu lives in that sheet.
const MOBILE_TABS: NavItem[] = NAV_ITEMS.filter((item) => item.tabKey);
const MORE_ORDER = [ROUTES.SIMULATIONS, ROUTES.PROGRESS, ROUTES.SAFETY, ROUTES.COLOR_VISION, ROUTES.RPK_RSM];
const MORE_ITEMS: NavItem[] = [
  ...MORE_ORDER.map((href) => NAV_ITEMS.find((item) => item.href === href)).filter((item): item is NavItem => !!item),
  ...UTILITY_ITEMS,
];


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
          "group relative flex min-w-0 items-center gap-3 px-4 py-3 h-11 rounded-md",
          "transition-colors duration-200 text-muted-foreground hover:text-foreground font-medium",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive && "active text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 w-full h-full bg-accent rounded-md opacity-0 scale-[0.97]",
              "transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200 ease-out-quart -z-10",
              "group-hover:opacity-100 group-hover:scale-100",
              isActive && "opacity-100 scale-100"
            )}
          />
          <div
            aria-hidden
            className={cn(
              "absolute left-0 w-[3px] h-5 bg-brand rounded-r opacity-0",
              "transition-opacity duration-200",
              isActive && "opacity-100"
            )}
          />
          <span aria-hidden className="shrink-0">
            {withWeight(item.icon, isActive ? "bold" : "regular")}
          </span>
          <span className="min-w-0 text-sm tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
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
  const { signOut, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();


  const isRouteActive = (href: string, exact?: boolean) => 
    exact ? location.pathname === href : location.pathname.startsWith(href);

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.AUTH);
  };

  const handleLangToggle = () => {
    setLanguage(language === 'en' ? 'ms' : 'en');
  };

  const displayName =
    (user?.user_metadata?.["full_name"] as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Guest";

  return (
    <div
      className={cn(
        "flex h-full w-full flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        "transition-[width] duration-300 ease-out-quart",
        collapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <div className={cn("flex h-16 items-center shrink-0 border-b border-sidebar-border", collapsed ? "justify-center px-0" : "justify-between px-4")}>
        {!collapsed ? (
          <BrandMark className="select-none whitespace-nowrap text-sidebar-foreground" />
        ) : (
          <>
            <BrandMark wordmark={false} className="text-sidebar-foreground" />
            <span className="sr-only">DriveMy</span>
          </>
        )}
        <div className="flex items-center gap-2">
          {!isMobile && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? t("a11y.expandSidebar") : t("a11y.collapseSidebar")}
              className="touch-target rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-[color,background-color,transform] duration-300 ease-spring active:scale-95 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="touch-target rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-[color,background-color,transform] duration-300 ease-spring active:scale-95 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {collapsed && !isMobile ? (
        <div className="flex-1 flex flex-col items-center justify-between py-6 min-h-fit overflow-x-hidden">
          <VerticalDock distance={100} magnification={60} baseItemSize={44} panelWidth={72} className="w-full h-auto py-0 gap-2 overflow-x-hidden">
            {NAV_ITEMS.map((item) => {
              const isActive = isRouteActive(item.href, item.end);
              return (
                <DockItem
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    isActive && "bg-accent/80 text-foreground ring-1 ring-border shadow-sm"
                  )}
                >
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex h-full w-full items-center justify-center outline-none">
                          <DockIcon>{item.icon}</DockIcon>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={16}>
                        {t(item.labelKey)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </DockItem>
              );
            })}
          </VerticalDock>
          
          <div className="w-8 h-[1px] bg-border my-2" />
          
          <VerticalDock distance={100} magnification={60} baseItemSize={44} panelWidth={72} className="w-full h-auto py-0 gap-2 overflow-visible">
            {UTILITY_ITEMS.map((item) => {
              const isActive = isRouteActive(item.href, item.end);
              return (
                <DockItem
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    isActive && "bg-accent/80 text-foreground ring-1 ring-border shadow-sm"
                  )}
                >
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex h-full w-full items-center justify-center outline-none">
                          <DockIcon>{item.icon}</DockIcon>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={16}>
                        {t(item.labelKey)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </DockItem>
              );
            })}
            
            <DockItem onClick={handleLangToggle}>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-full w-full items-center justify-center outline-none">
                      <DockIcon>
                        <Translate weight="regular" className="h-5 w-5" />
                      </DockIcon>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={16}>
                    {language === 'en' ? 'Bahasa Malaysia' : 'English'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DockItem>
            
            <DockItem onClick={handleSignOut} className="hover:bg-destructive/20 hover:text-destructive text-destructive mt-2">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-full w-full items-center justify-center outline-none">
                      <DockIcon>
                        <SignOut weight="regular" className="h-5 w-5" />
                      </DockIcon>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={16}>
                    {t("nav.signOut")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DockItem>
          </VerticalDock>
        </div>
      ) : (
        <>
          <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <SideNavLink key={item.href} item={item} onClick={onClose} />
            ))}
          </nav>

          <div className="mx-3 h-px bg-sidebar-border" aria-hidden />

          <div className="py-3 px-3 space-y-1">
            {UTILITY_ITEMS.map((item) => (
              <SideNavLink key={item.href} item={item} onClick={onClose} />
            ))}

            <button
              type="button"
              onClick={handleSignOut}
              aria-label={t("nav.signOut")}
              className={cn(
                "flex items-center gap-3 rounded-md min-h-[48px] w-full px-4",
                "text-sm font-medium text-muted-foreground",
                "hover:bg-destructive/10 hover:text-destructive transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <SignOut className="h-5 w-5 shrink-0" aria-hidden />
              <span className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
                {t("nav.signOut")}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-3 shrink-0 border-t border-sidebar-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar className="h-8 w-8 text-xs" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
                {user?.email && (
                  <p className="text-[11px] text-sidebar-foreground/70 truncate">{user.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <LanguageToggle variant="pill" />
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

  const tabClass = (active: boolean) =>
    cn(
      "relative flex min-w-0 flex-col items-center justify-center gap-0.5",
      "min-h-[48px] rounded-md px-1 text-[11px] font-medium leading-none transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
      active ? "text-brand-ink" : "text-muted-foreground hover:text-foreground"
    );
  const pill = (active: boolean) =>
    cn(
      "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200 ease-out-quart",
      active ? "bg-brand/20 text-brand-ink" : "text-muted-foreground"
    );

  return (
    <nav
      className="grid md:hidden grid-cols-5 items-center glass border-t border-border shrink-0 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      aria-label="Mobile navigation"
    >
      {MOBILE_TABS.map((item) => (
        <NavLink key={item.href} to={item.href} end={item.end} className={({ isActive }) => tabClass(isActive)}>
          {({ isActive }) => (
            <>
              <span aria-hidden className={pill(isActive)}>{withWeight(item.icon, isActive ? "bold" : "regular")}</span>
              <span className="max-w-full truncate">{t(item.tabKey!)}</span>
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
          <span aria-hidden className={pill(moreActive)}>
            <SquaresFour weight={moreActive ? "bold" : "regular"} className="h-5 w-5" />
          </span>
          <span className="max-w-full truncate">{t("nav.more")}</span>
          {moreActive && <span className="sr-only">{t("a11y.currentPage")}</span>}
        </button>
        <DrawerPopup showBar>
          <DrawerTitle className="sr-only">{t("nav.more")}</DrawerTitle>
          <DrawerDescription className="sr-only">{t("nav.more")}</DrawerDescription>
          <ul className="grid gap-1 px-3 pt-3">
            {MORE_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-[48px] items-center gap-3 rounded-md px-3 text-sm font-medium no-underline",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive ? "bg-brand/15 text-brand-ink" : "text-foreground hover:bg-accent"
                    )
                  }
                >
                  <span aria-hidden className="shrink-0">{item.icon}</span>
                  <span className="min-w-0 truncate">{t(item.labelKey)}</span>
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
 * up it is a sidebar that folds into an icon dock, and on a phone the top bar
 * opens the same sidebar as a drawer from the left while a bottom bar keeps
 * the main destinations a thumb away. The simulator draws over all of it.
 */
export function AppLayout({ showSidebar: showSidebarProp = true }: AppLayoutProps) {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuId = useId();
  const { sidebarCollapsed, toggleSidebar, examMode } = useUIStore();

  // An exam in progress gets the screen to itself. The nav is removed rather
  // than hidden, so it is also out of the tab order and the accessibility tree
  // — a learner tabbing through a timed test cannot land on "Simulator".
  const showSidebar = showSidebarProp && !examMode;
  // The simulator draws full screen over the shell: keep the menu behind it out of the tab order and the reading order.
  const behindSimulator = /^\/simulations\/[^/]+/.test(useLocation().pathname) ? true : undefined;

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
            "hidden md:flex flex-col flex-shrink-0 transition-[width] duration-300 ease-in-out z-50 overflow-visible",
            sidebarCollapsed ? "w-[4.5rem]" : "w-64"
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
              aria-describedby={undefined}
              className="fixed inset-y-0 left-0 z-50 h-full w-64 flex-shrink-0 shadow-2xl md:hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full duration-500 [animation-timing-function:var(--ease-spring)]"
            >
              <Dialog.Title className="sr-only">{t("a11y.openMenu")}</Dialog.Title>
              <Sidebar isMobile onClose={() => setMobileOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0 transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 ease-in-out relative">
        {showSidebar && (
          <header
            className="glass flex md:hidden h-14 items-center justify-between px-4 border-b border-border shrink-0"
            role="banner"
            inert={behindSimulator}
          >
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t("a11y.openMenu")}
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
              className="touch-target rounded-lg text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <List className="h-5 w-5" aria-hidden />
            </button>

            <BrandMark className="select-none text-[0.85rem] [&_span]:text-[1.375rem]" />

            <div className="flex items-center gap-1">
              <LanguageToggle variant="pill" />
              <NavLink to={ROUTES.SETTINGS} aria-label={t("nav.settings")} className="grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <UserAvatar className="h-8 w-8 text-xs" />
              </NavLink>
            </div>
          </header>
        )}

        <OfflineBanner />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto canvas-subtle"
          tabIndex={-1}
        >
          <div className="page-enter min-h-full">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        {showSidebar && <div inert={behindSimulator}><MobileBottomNav /></div>}
      </div>
    </div>
    </MotionConfig>
  );
}
