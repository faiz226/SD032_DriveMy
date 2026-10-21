import { ROUTES } from "@/lib/constants";
import type { TranslationKey } from "@/lib/translations";

export interface NavDestination {
  labelKey: TranslationKey;
  href: string;
}

export interface NavGroup {
  labelKey: TranslationKey;
  items: NavDestination[];
}

/**
 * Every place the main navigation can take a learner, grouped the way the
 * header shows them (D10). Both shells read this list, so a new page cannot
 * appear in one menu and be missing from the other.
 */
export const NAV_GROUPS: NavGroup[] = [
  { labelKey: "nav.dashboard", items: [{ labelKey: "nav.dashboard", href: ROUTES.DASHBOARD }] },
  { labelKey: "nav.group.curriculum", items: [{ labelKey: "nav.learn", href: ROUTES.THEORY }, { labelKey: "nav.rpkRsm", href: ROUTES.RPK_RSM }] },
  { labelKey: "nav.group.tests", items: [{ labelKey: "nav.quiz", href: ROUTES.QUIZ }, { labelKey: "nav.mockTest", href: ROUTES.MOCK_TEST }] },
  { labelKey: "nav.group.practical", items: [{ labelKey: "nav.simulator", href: ROUTES.SIMULATIONS }] },
  { labelKey: "nav.group.resources", items: [{ labelKey: "nav.roadSafety", href: ROUTES.SAFETY }, { labelKey: "nav.colorblind", href: ROUTES.COLOR_VISION }, { labelKey: "nav.progress", href: ROUTES.PROGRESS }] },
];

export const NAV_DESTINATIONS: NavDestination[] = NAV_GROUPS.flatMap(group => group.items);
