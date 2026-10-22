import { ROUTES } from "@/lib/constants";
import type { TranslationKey } from "@/lib/translations";

export interface NavDestination {
  labelKey: TranslationKey;
  href: string;
}

/** Every place the main menu can take a learner, in the order the sidebar lists them. */
export const NAV_DESTINATIONS: NavDestination[] = [
  { labelKey: "nav.dashboard", href: ROUTES.DASHBOARD },
  { labelKey: "nav.learn", href: ROUTES.THEORY },
  { labelKey: "nav.rpkRsm", href: ROUTES.RPK_RSM },
  { labelKey: "nav.quiz", href: ROUTES.QUIZ },
  { labelKey: "nav.mockTest", href: ROUTES.MOCK_TEST },
  { labelKey: "nav.simulator", href: ROUTES.SIMULATIONS },
  { labelKey: "nav.progress", href: ROUTES.PROGRESS },
  { labelKey: "nav.roadSafety", href: ROUTES.SAFETY },
  { labelKey: "nav.colorblind", href: ROUTES.COLOR_VISION },
];
