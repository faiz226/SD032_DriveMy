import type { ReactNode } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/lib/translations/en";

const stroke = "fill-none stroke-foreground/70";

/** The POWDER check as six tiles, each with its own small drawing: what to look at, at a glance. */
const TILES: { letter: string; key: TranslationKey; icon: ReactNode }[] = [
  {
    letter: "P", key: "rpk.powder.petrol",
    icon: <><rect x="8" y="6" width="18" height="28" rx="3" className="fill-brand stroke-foreground/60" /><rect x="12" y="10" width="10" height="8" rx="1.5" className="fill-card stroke-foreground/50" /><path d="M26 14 h5 q3 0 3 3 v10 q0 3 -3 3" className={stroke} /></>,
  },
  {
    letter: "O", key: "rpk.powder.oil",
    icon: <><path d="M10 18 h16 l4 14 h-24z" className="fill-muted stroke-foreground/60" /><path d="M26 20 l8 -6 M10 18 l-3 -4" className={stroke} /><path d="M20 4 q-4 6 0 8 q4 -2 0 -8z" className="fill-brand stroke-foreground/50" /></>,
  },
  {
    letter: "W", key: "rpk.powder.water",
    icon: <path d="M20 5 q-12 14 -12 22 a12 12 0 0 0 24 0 q0 -8 -12 -22z" className="fill-info/40 stroke-foreground/60" />,
  },
  {
    letter: "D", key: "rpk.powder.damage",
    icon: <><rect x="5" y="10" width="30" height="20" rx="5" className="fill-muted stroke-foreground/60" /><path d="M20 10 l-4 7 l6 3 l-5 8" className="fill-none stroke-destructive" strokeWidth="2.5" /></>,
  },
  {
    letter: "E", key: "rpk.powder.electric",
    icon: <><rect x="6" y="12" width="28" height="20" rx="3" className="fill-muted stroke-foreground/60" /><rect x="10" y="8" width="6" height="4" className="fill-destructive" /><rect x="24" y="8" width="6" height="4" className="fill-success" /><path d="M22 15 l-6 8 h5 l-2 7 l7 -9 h-5z" className="fill-brand stroke-foreground/50" /></>,
  },
  {
    letter: "R", key: "rpk.powder.rubber",
    icon: <><circle cx="20" cy="20" r="14" className="fill-foreground/70 stroke-foreground/60" /><circle cx="20" cy="20" r="6" className="fill-card stroke-foreground/50" /><path d="M20 6 v4 M20 30 v4 M6 20 h4 M30 20 h4" className="fill-none stroke-card" /></>,
  },
];

export function PowderRow() {
  const { t } = useLanguage();
  return (
    <div className="mt-4 rounded-xl bg-muted/40 p-3">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground">{t("rpk.powderTitle")}</p>
      <ul className="mt-2.5 grid grid-cols-3 gap-2">
        {TILES.map(({ letter, key, icon }) => (
          <li key={letter} className="flex flex-col items-center gap-1 rounded-lg bg-background/60 px-1.5 py-2 text-center">
            <svg viewBox="0 0 40 40" aria-hidden="true" className="h-8 w-8 opacity-90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
            <span className="text-xs leading-tight text-muted-foreground">
              <span className="font-extrabold text-brand-ink">{letter}</span> {t(key)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
