import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { CaretRight, Gear, SignOut } from "@/components/ui/icons";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { Drawer, DrawerPopup, DrawerTitle } from "@/components/ui/drawer";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { NAV_GROUPS, isGroupActive, type NavGroup } from "@/app/navigation";

const SPRING = { type: "spring", stiffness: 520, damping: 40 } as const;

/**
 * Phone and tablet navigation: five tabs within thumb reach. A group with one
 * destination navigates; a group with several opens a sheet listing them. The
 * last sheet also carries settings, language and sign-out, which the compact
 * header has no room for.
 */
export function TabBar() {
  const { t } = useLanguage();
  const { signOut } = useAuthStore();
  const { pathname } = useLocation();
  const [sheet, setSheet] = useState<NavGroup | null>(null);
  const isMore = sheet === NAV_GROUPS[NAV_GROUPS.length - 1];
  const close = () => setSheet(null);

  return (
    <>
      <nav aria-label={t("header.mainNav")} className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border/70 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto grid h-16 max-w-xl grid-cols-5 px-1">
          {NAV_GROUPS.map(group => {
            const active = isGroupActive(group, pathname);
            const Icon = group.icon;
            const look = cn(
              "flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl no-underline outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-brand-ink" : "text-muted-foreground hover:text-foreground",
            );
            const face = (
              <>
                <span className="relative grid h-7 w-14 place-items-center">
                  {active && <motion.span layoutId="tab-active" transition={SPRING} aria-hidden="true" className="absolute inset-0 rounded-full bg-brand/20" />}
                  <Icon size={22} weight={active ? "fill" : "regular"} className="relative" aria-hidden="true" />
                </span>
                <span className="text-[0.6875rem] font-semibold leading-none tracking-[-0.005em]">{t(group.tabKey)}</span>
              </>
            );
            return (
              <li key={group.labelKey} className="h-full">
                {group.items.length === 1
                  ? <NavLink to={group.items[0].href} end={group.items[0].href === ROUTES.DASHBOARD} className={look}>{face}</NavLink>
                  : <button type="button" className={look} aria-haspopup="dialog" aria-expanded={sheet === group} aria-current={active ? "page" : undefined} onClick={() => setSheet(group)}>{face}</button>}
              </li>
            );
          })}
        </ul>
      </nav>

      <Drawer open={sheet !== null} onOpenChange={open => { if (!open) close(); }}>
        <DrawerPopup showBar aria-describedby={undefined} className="pb-[env(safe-area-inset-bottom)]">
          <DrawerTitle className="px-6 pt-4 text-left text-lg font-semibold tracking-tight">{sheet ? t(sheet.labelKey) : ""}</DrawerTitle>
          <ul className="mt-2 px-3">
            {sheet?.items.map(item => (
              <li key={item.href}>
                <NavLink to={item.href} onClick={close} className={({ isActive }) => cn(
                  "flex min-h-14 items-center justify-between rounded-2xl px-3 text-[0.9375rem] font-medium no-underline transition-colors",
                  isActive ? "bg-brand/20 text-brand-ink" : "text-foreground hover:bg-accent",
                )}>
                  {t(item.labelKey)}
                  <CaretRight size={16} className="opacity-50" aria-hidden="true" />
                </NavLink>
              </li>
            ))}
          </ul>
          {isMore && (
            <div className="mx-6 mt-3 space-y-1 border-t border-border pt-3">
              <NavLink to={ROUTES.SETTINGS} onClick={close} className="-mx-3 flex min-h-12 items-center gap-3 rounded-2xl px-3 text-[0.9375rem] font-medium text-foreground no-underline hover:bg-accent">
                <Gear size={20} aria-hidden="true" />{t("nav.settings")}
              </NavLink>
              <div className="flex min-h-12 items-center justify-between">
                <span className="text-[0.9375rem] font-medium">{t("a11y.toggleLanguage")}</span>
                <LanguageToggle />
              </div>
              <button type="button" onClick={() => { close(); void signOut(); }} className="-mx-3 flex min-h-12 w-[calc(100%+1.5rem)] items-center gap-3 rounded-2xl px-3 text-[0.9375rem] font-medium text-destructive hover:bg-destructive/15">
                <SignOut size={20} aria-hidden="true" />{t("nav.signOut")}
              </button>
            </div>
          )}
        </DrawerPopup>
      </Drawer>
    </>
  );
}
