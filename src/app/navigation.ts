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
  mobile?: boolean;
  end?: boolean;
}

/** Every place the main menu can take a learner, in the order the sidebar lists them. */
export const NAV_DESTINATIONS: NavDestination[] = [
  { labelKey: "nav.dashboard",  href: ROUTES.DASHBOARD,    icon: GridFour,      mobile: true, end: true },
  { labelKey: "nav.learn",      href: ROUTES.THEORY,       icon: BookOpen,      mobile: true },
  { labelKey: "nav.rpkRsm",     href: ROUTES.RPK_RSM,      icon: Wrench },
  { labelKey: "nav.quiz",       href: ROUTES.QUIZ,         icon: Book,          mobile: true },
  { labelKey: "nav.mockTest",   href: ROUTES.MOCK_TEST,    icon: Clipboard,     mobile: true },
  { labelKey: "nav.simulator",  href: ROUTES.SIMULATIONS,  icon: Car,           mobile: true },
  { labelKey: "nav.progress",   href: ROUTES.PROGRESS,     icon: TrendUp,       mobile: true },
  { labelKey: "nav.roadSafety", href: ROUTES.SAFETY,       icon: ShieldWarning },
  { labelKey: "nav.colorblind", href: ROUTES.COLOR_VISION, icon: Eye },
];
