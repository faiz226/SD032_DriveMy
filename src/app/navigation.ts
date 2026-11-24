import {
  GridFour,
  BookOpen,
  Wrench,
  Book,
  Clipboard,
  Car,
  TrendUp,
  ShieldWarning,
  Eye,
  type Icon,
} from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import type { TranslationKey } from "@/lib/translations";

export interface NavDestination {
  labelKey: TranslationKey;
  href: string;
  icon: Icon;
  /** Set on the destinations that get a tab in the phone bar; the rest live under "More". */
  tabKey?: TranslationKey;
  end?: boolean;
}

/** Every place the main menu can take a learner, in the order the sidebar lists them. */
export const NAV_DESTINATIONS: NavDestination[] = [
  { labelKey: "nav.dashboard",  href: ROUTES.DASHBOARD,    icon: GridFour,      tabKey: "nav.tab.home", end: true },
  { labelKey: "nav.learn",      href: ROUTES.THEORY,       icon: BookOpen,      tabKey: "nav.tab.learn" },
  { labelKey: "nav.rpkRsm",     href: ROUTES.RPK_RSM,      icon: Wrench },
  { labelKey: "nav.quiz",       href: ROUTES.QUIZ,         icon: Book,          tabKey: "nav.tab.quiz" },
  { labelKey: "nav.mockTest",   href: ROUTES.MOCK_TEST,    icon: Clipboard,     tabKey: "nav.tab.test" },
  { labelKey: "nav.simulator",  href: ROUTES.SIMULATIONS,  icon: Car },
  { labelKey: "nav.progress",   href: ROUTES.PROGRESS,     icon: TrendUp },
  { labelKey: "nav.roadSafety", href: ROUTES.SAFETY,       icon: ShieldWarning },
  { labelKey: "nav.colorblind", href: ROUTES.COLOR_VISION, icon: Eye },
];
