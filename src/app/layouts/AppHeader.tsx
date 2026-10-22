import { Link, NavLink, useLocation } from "react-router-dom";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { motion } from "motion/react";
import { CaretDown, ChartLineUp, Gear, SignOut } from "@/components/ui/icons";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { BrandMark } from "@/components/shared/BrandMark";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { NAV_GROUPS, isGroupActive, type NavGroup } from "@/app/navigation";

const SPRING = { type: "spring", stiffness: 520, damping: 42, mass: 0.9 } as const;

export const menuContent = "z-[70] min-w-56 rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg data-[state=open]:animate-scale-in";
export const menuItem = "flex min-h-10 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground no-underline outline-none transition-colors data-[highlighted]:bg-accent";

/**
 * The signed-in header, over the night sky: the mark, the five destinations as
 * pills (the current one in ink), and the learner in road yellow. Below 1024px
 * the tab bar carries navigation and the header keeps the mark and account.
 */
export function AppHeader() {
  const { t } = useLanguage();
  const { user, signOut } = useAuthStore();
  const { pathname } = useLocation();
  const fullName = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined;
  const name = fullName || user?.email?.split("@")[0] || t("header.learner");
  const initials = name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/50">
      <div className="app-container flex h-[4.5rem] items-center gap-6 !py-0">
        <Link to={ROUTES.DASHBOARD} aria-label="DriveMy" className="shrink-0 rounded-xl text-foreground no-underline">
          <BrandMark />
        </Link>

        <nav aria-label={t("header.mainNav")} className="hidden flex-1 items-center gap-1 lg:flex">
          {NAV_GROUPS.map(group => <NavCapsuleItem key={group.labelKey} group={group} active={isGroupActive(group, pathname)} />)}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <LanguageToggle className="hidden sm:inline-flex" />
          <AnimatedThemeToggler
            aria-label={t("header.theme")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          />
          <Menu.Root>
            <Menu.Trigger className="group inline-flex h-11 items-center gap-3 rounded-full pl-0.5 pr-0.5 text-left transition-colors hover:bg-accent xl:pr-3" aria-label={t("header.account")}>
              <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-extrabold text-[#111]">{initials}</span>
              <span className="hidden max-w-40 truncate font-semibold xl:block">{name}</span>
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Content align="end" sideOffset={10} className={menuContent}>
                <div className="px-3 pb-2 pt-1.5">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
                </div>
                <Menu.Separator className="my-1 h-px bg-border" />
                <Menu.Item asChild><Link to={ROUTES.PROGRESS} className={menuItem}><ChartLineUp size={18} aria-hidden="true" />{t("nav.progress")}</Link></Menu.Item>
                <Menu.Item asChild><Link to={ROUTES.SETTINGS} className={menuItem}><Gear size={18} aria-hidden="true" />{t("nav.settings")}</Link></Menu.Item>
                <Menu.Separator className="my-1 h-px bg-border" />
                <Menu.Item className={cn(menuItem, "text-destructive")} onSelect={() => { void signOut(); }}><SignOut size={18} aria-hidden="true" />{t("nav.signOut")}</Menu.Item>
              </Menu.Content>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
    </header>
  );
}

const capsuleItem = "relative inline-flex min-h-11 items-center gap-1 rounded-full px-4 font-semibold no-underline transition-colors";

function ActivePill() {
  return <motion.span layoutId="header-active" transition={SPRING} className="absolute inset-0 rounded-full bg-foreground" aria-hidden="true" />;
}

function NavCapsuleItem({ group, active }: { group: NavGroup; active: boolean }) {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const tone = active ? "text-background" : "text-muted-foreground hover:text-foreground";

  if (group.items.length === 1) {
    const [only] = group.items;
    return (
      <NavLink to={only.href} end={only.href === ROUTES.DASHBOARD} className={cn(capsuleItem, tone)}>
        {active && <ActivePill />}
        <span className="relative">{t(group.tabKey)}</span>
      </NavLink>
    );
  }

  return (
    <Menu.Root>
      <Menu.Trigger className={cn(capsuleItem, tone, "data-[state=open]:text-foreground")}>
        {active && <ActivePill />}
        <span className="relative">{t(group.tabKey)}</span>
        <CaretDown size={12} weight="bold" className="relative opacity-60" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content className={menuContent} sideOffset={10} align="center">
          {group.items.map(item => {
            const current = pathname === item.href;
            return (
              <Menu.Item asChild key={item.href}>
                <Link to={item.href} aria-current={current ? "page" : undefined} className={cn(menuItem, "justify-between", current && "text-brand-ink")}>
                  {t(item.labelKey)}
                  {current && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />}
                </Link>
              </Menu.Item>
            );
          })}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
