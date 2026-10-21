import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { CaretDown, List, X, UserCircle } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { NAV_GROUPS } from "@/app/navigation";

/**
 * The Jalan header. The full grouped navigation shows from 768px (DESIGN.md
 * §11); below that it moves into a sheet. Between 768 and 1199px the wordmark
 * and language switch compact so the five groups still fit on one row in
 * either language. There is no notification bell: the app has no
 * notifications, and a bell that opened the progress page promised one.
 */
export function AppHeader() {
  const { t } = useLanguage();
  const { user, signOut } = useAuthStore();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const groups = NAV_GROUPS.map(group => ({ label: t(group.labelKey), items: group.items.map(item => ({ label: t(item.labelKey), href: item.href })) }));
  const name = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : user?.email?.split("@")[0];
  const navStyle = "inline-flex min-h-12 items-center gap-1.5 rounded px-2 text-sm font-medium no-underline hover:no-underline lg:px-3";
  const menuStyle = "plate z-[70] min-w-48 p-1 shadow-sm";
  const itemStyle = "flex min-h-12 items-center rounded px-3 text-sm text-foreground no-underline outline-none data-[highlighted]:bg-muted";
  // Ink on the page colour: asphalt by day, paint by night, so the current
  // page reads in both themes without spending a signal colour.
  const activeStyle = "bg-[rgb(var(--road-ink))] text-[rgb(var(--background))]";
  return <header className="border-b border-border bg-card">
    <div className="jalan-container flex items-center justify-between gap-3 !py-2">
      <Link to={ROUTES.DASHBOARD} aria-label="DriveMy" className="inline-flex shrink-0 items-center gap-2 no-underline hover:no-underline">
        <svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true"><path d="M10 2h7L7 28H0Z" fill="rgb(var(--awas))"/><path d="M19 2h7L16 28H9Z" fill="currentColor"/></svg>
        <span className="type-display text-xl md:max-lg:hidden">DriveMy</span>
      </Link>
      <nav aria-label={t("header.mainNav")} className="hidden items-center gap-1 md:flex">
        {groups.map(group => group.items.length === 1
          ? <NavLink key={group.label} end={group.items[0].href === ROUTES.DASHBOARD} to={group.items[0].href} className={({ isActive }) => cn(navStyle, isActive && activeStyle)}>{group.label}</NavLink>
          : <Menu.Root key={group.label}><Menu.Trigger className={cn(navStyle, group.items.some(item => pathname === item.href) && activeStyle)}>{group.label}<CaretDown aria-hidden="true"/></Menu.Trigger>
            <Menu.Portal><Menu.Content className={menuStyle} sideOffset={8}>{group.items.map(item => <Menu.Item asChild key={item.href}><Link className={itemStyle} to={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link></Menu.Item>)}</Menu.Content></Menu.Portal>
          </Menu.Root>)}
      </nav>
      <div className="flex items-center gap-1">
        <span className="hidden min-[1200px]:block"><LanguageToggle /></span>
        <span className="hidden md:block min-[1200px]:hidden"><LanguageToggle variant="icon" /></span>
        <Menu.Root><Menu.Trigger className="inline-flex min-h-12 items-center gap-2 rounded px-2 text-left" aria-label={t("header.account")}>
          <UserCircle size={30} aria-hidden="true"/><span className="hidden max-w-32 truncate text-sm min-[1200px]:block">{name || t("header.learner")}</span><CaretDown aria-hidden="true"/>
        </Menu.Trigger><Menu.Portal><Menu.Content align="end" className={menuStyle} sideOffset={8}>
          <Menu.Item asChild><Link to={ROUTES.SETTINGS} className={itemStyle}>{t("nav.settings")}</Link></Menu.Item>
          <Menu.Item asChild><Link to={ROUTES.PROGRESS} className={itemStyle}>{t("nav.progress")}</Link></Menu.Item>
          <Menu.Item className={itemStyle} onSelect={() => { void signOut(); }}>{t("nav.signOut")}</Menu.Item>
        </Menu.Content></Menu.Portal></Menu.Root>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild><Button variant="ghost" size="icon" className="md:hidden" aria-label={t("a11y.openMenu")}><List aria-hidden="true"/></Button></Dialog.Trigger>
          <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[60] bg-overlay/50"/><Dialog.Content aria-describedby={undefined} className="fixed inset-y-0 right-0 z-[70] w-full max-w-sm overflow-y-auto border-l bg-card p-5">
            <div className="flex items-center justify-between"><Dialog.Title className="type-display text-xl">DriveMy</Dialog.Title><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label={t("a11y.closeMenu")}><X aria-hidden="true"/></Button></Dialog.Close></div>
            <nav aria-label={t("header.mainNav")} className="mt-4 space-y-4">{groups.map(group => <div key={group.label}><p className="mb-1 text-sm text-muted-foreground">{group.label}</p>{group.items.map(item => <NavLink key={item.href} end={item.href === ROUTES.DASHBOARD} to={item.href} onClick={() => setOpen(false)} className={({ isActive }) => cn(navStyle, "flex", isActive && activeStyle)}>{item.label}</NavLink>)}</div>)}</nav>
            <div className="mt-5 border-t pt-4"><LanguageToggle /></div>
          </Dialog.Content></Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  </header>;
}
