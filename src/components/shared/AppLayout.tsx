import { useState, useId } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  GridFour,
  Book,
  BookOpen,
  Clipboard,
  ShieldWarning,
  Eye,
  Car,
  TrendUp,
  User,
  Gear,
  SignOut,
  List,
  X,
  CaretLeft,
  CaretRight,
  Sun,
  Moon,
  Translate
} from "phosphor-react";
import { LanguageToggle } from "./LanguageToggle";
import { OfflineBanner } from "./OfflineBanner";
import { ErrorBoundary } from "./ErrorBoundary";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useLanguage } from "@/hooks/useLanguage";
import { VerticalDock, DockItem, DockIcon } from "@/components/ui/vertical-dock";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { TranslationKey } from "@/lib/translations";

// ─── Nav item definition ──────────────────────────────────────────────────────

interface NavItem {
  labelKey: TranslationKey;
  href:     string;
  icon:     React.ReactNode;
  end?:     boolean;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard",  href: ROUTES.DASHBOARD,    icon: <GridFour weight="fill" className="h-5 w-5" />, end: true },
  { labelKey: "nav.learn",      href: ROUTES.THEORY,       icon: <BookOpen weight="fill" className="h-5 w-5" /> },
  { labelKey: "nav.quiz",       href: ROUTES.QUIZ,         icon: <Book weight="fill" className="h-5 w-5" /> },
  { labelKey: "nav.mockTest",   href: ROUTES.MOCK_TEST,    icon: <Clipboard weight="fill" className="h-5 w-5" /> },
  { labelKey: "nav.roadSigns",  href: ROUTES.SAFETY,       icon: <ShieldWarning weight="fill" className="h-5 w-5" /> },
  { labelKey: "nav.simulator",  href: ROUTES.SIMULATIONS,  icon: <Car weight="fill" className="h-5 w-5" /> },
  { labelKey: "nav.colorblind", href: ROUTES.COLOR_VISION, icon: <Eye weight="fill" className="h-5 w-5" /> },
  { labelKey: "nav.progress",   href: ROUTES.PROGRESS,     icon: <TrendUp weight="fill" className="h-5 w-5" /> },
];

const UTILITY_ITEMS: NavItem[] = [
  { labelKey: "nav.settings",   href: ROUTES.SETTINGS,     icon: <Gear weight="fill" className="h-5 w-5" /> },
];

const MOBILE_NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard",  href: ROUTES.DASHBOARD,   icon: <GridFour className="h-5 w-5" />, end: true },
  { labelKey: "nav.learn",      href: ROUTES.THEORY,      icon: <BookOpen    className="h-5 w-5" /> },
  { labelKey: "nav.quiz",       href: ROUTES.QUIZ,        icon: <Book        className="h-5 w-5" /> },
  { labelKey: "nav.mockTest",   href: ROUTES.MOCK_TEST,   icon: <Clipboard   className="h-5 w-5" /> },
  { labelKey: "nav.simulator",  href: ROUTES.SIMULATIONS, icon: <Car             className="h-5 w-5" /> },
  { labelKey: "nav.progress",   href: ROUTES.PROGRESS,    icon: <TrendUp      className="h-5 w-5" /> },
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
              "transition-all duration-200 ease-out-quart -z-10",
              "group-hover:opacity-100 group-hover:scale-100",
              isActive && "opacity-100 scale-100"
            )}
          />
          <div
            aria-hidden
            className={cn(
              "absolute left-0 w-[3px] h-5 bg-sidebar-primary rounded-r opacity-0",
              "transition-opacity duration-200",
              isActive && "opacity-100"
            )}
          />
          <span aria-hidden className="shrink-0">
            {item.icon}
          </span>
          <span className="min-w-0 text-sm tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
            {label}
          </span>
          {isActive && <span className="sr-only">(current page)</span>}
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
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

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
          <span className="font-heading text-xl font-semibold tracking-tight select-none text-sidebar-foreground whitespace-nowrap">
            Drive<span className="text-primary">My</span>
          </span>
        ) : (
          <span className="font-heading text-lg font-semibold tracking-tight select-none text-sidebar-foreground whitespace-nowrap sr-only">
            DriveMy
          </span>
        )}
        <div className="flex items-center gap-2">
          {!isMobile && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? t("a11y.expandSidebar") : t("a11y.collapseSidebar")}
              className="touch-target rounded-md text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="touch-target rounded-md text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                        <Translate weight="fill" className="h-5 w-5" />
                      </DockIcon>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={16}>
                    {language === 'en' ? 'Bahasa Malaysia' : 'English'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DockItem>
            
            <DockItem>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-full w-full items-center justify-center outline-none">
                      <AnimatedThemeToggler variant="circle" className="w-full h-full flex items-center justify-center bg-transparent border-none p-0 outline-none hover:bg-transparent">
                        <DockIcon>
                          {isDark ? <Sun weight="fill" className="h-5 w-5 text-yellow-400" /> : <Moon weight="fill" className="h-5 w-5" />}
                        </DockIcon>
                      </AnimatedThemeToggler>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={16}>
                    {t("settings.theme")}
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
                        <SignOut weight="fill" className="h-5 w-5" />
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

            <AnimatedThemeToggler
              variant="circle"
              className={cn(
                "flex items-center gap-3 rounded-md min-h-[48px] w-full px-4",
                "text-sm font-medium text-muted-foreground",
                "hover:bg-accent hover:text-foreground transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label={t("settings.theme")}
            >
              {isDark ? <Sun className="h-5 w-5 shrink-0" aria-hidden /> : <Moon className="h-5 w-5 shrink-0" aria-hidden />}
              <span className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
                {t("settings.theme")}
              </span>
            </AnimatedThemeToggler>

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
              <div
                className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0"
                aria-hidden
              >
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
                {user?.email && (
                  <p className="text-[11px] text-sidebar-foreground/50 truncate">{user.email}</p>
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

  return (
    <nav
      className={cn(
        "flex md:hidden h-16 items-center justify-around",
        "border-t border-border bg-background shrink-0",
        "safe-area-inset-bottom" 
      )}
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
                "relative flex flex-col items-center justify-center gap-0.5",
                "min-h-[48px] min-w-[48px] px-2 rounded-md",
                "text-[10px] font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  aria-hidden
                  className={cn(
                    "flex items-center justify-center h-8 px-4 rounded-full transition-all duration-200 ease-out-quart",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {item.icon}
                </div>
                <span className={cn("text-[9px] font-medium tracking-tight mt-0.5", isActive ? "text-primary font-semibold" : "text-muted-foreground")}>
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
              className="fixed inset-y-0 left-0 z-50 h-full w-64 flex-shrink-0 shadow-2xl md:hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full duration-300"
            >
              <Dialog.Title className="sr-only">{t("a11y.openMenu")}</Dialog.Title>
              <Sidebar isMobile onClose={() => setMobileOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0 transition-all duration-300 ease-in-out relative">
        {showSidebar && (
          <header
            className="flex md:hidden h-14 items-center justify-between px-4 border-b border-border bg-background shrink-0"
            role="banner"
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

            <span className="font-heading text-lg font-semibold tracking-tight select-none">
              Drive<span className="text-primary">My</span>
            </span>

            <div className="flex items-center gap-1">
              <LanguageToggle variant="pill" />
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

        {showSidebar && <MobileBottomNav />}
      </div>
    </div>
  );
}
