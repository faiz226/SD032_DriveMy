import type { Icon } from "@/components/ui/icons";
import { BookOpen, Car, ClipboardText, House, SquaresFour } from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import type { TranslationKey } from "@/lib/translations";

export interface NavDestination {
  labelKey: TranslationKey;
  href: string;
}

export interface NavGroup {
  labelKey: TranslationKey;
  /** Short label for the phone and tablet tab bar. */
  tabKey: TranslationKey;
  icon: Icon;
  items: NavDestination[];
}

/**
 * Every place the main navigation can take a learner, grouped the same way in
 * the desktop header and the tab bar, so a page cannot appear in one and be
 * missing from the other.
 */
export const NAV_GROUPS: NavGroup[] = [
  { labelKey: "nav.dashboard", tabKey: "nav.tab.home", icon: House, items: [{ labelKey: "nav.dashboard", href: ROUTES.DASHBOARD }] },
  { labelKey: "nav.group.curriculum", tabKey: "nav.tab.learn", icon: BookOpen, items: [{ labelKey: "nav.learn", href: ROUTES.THEORY }, { labelKey: "nav.rpkRsm", href: ROUTES.RPK_RSM }] },
  { labelKey: "nav.group.tests", tabKey: "nav.tab.tests", icon: ClipboardText, items: [{ labelKey: "nav.quiz", href: ROUTES.QUIZ }, { labelKey: "nav.mockTest", href: ROUTES.MOCK_TEST }] },
  { labelKey: "nav.group.practical", tabKey: "nav.tab.practical", icon: Car, items: [{ labelKey: "nav.simulator", href: ROUTES.SIMULATIONS }] },
  { labelKey: "nav.group.resources", tabKey: "nav.tab.more", icon: SquaresFour, items: [{ labelKey: "nav.progress", href: ROUTES.PROGRESS }, { labelKey: "nav.roadSafety", href: ROUTES.SAFETY }, { labelKey: "nav.colorblind", href: ROUTES.COLOR_VISION }] },
];

export const NAV_DESTINATIONS: NavDestination[] = NAV_GROUPS.flatMap(group => group.items);

/** A group is current when the page is any of its destinations or below one. */
export function isGroupActive(group: NavGroup, pathname: string) {
  return group.items.some(item => item.href === ROUTES.DASHBOARD
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`));
}
