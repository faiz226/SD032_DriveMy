import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "phosphor-react";
import type { Icon } from "phosphor-react";
import { Bay, RoadRule } from "@/components/ui/road";
import { useLanguage } from "@/hooks/useLanguage";
import type { LearningState } from "@/lib/dashboard/model";

interface LearningBayProps {
  title: string;
  description: string;
  to: string;
  state?: LearningState;
  /** The module's own glyph, shown while the bay is open. */
  icon: Icon;
  /** Painted on the warning diamond while in progress, e.g. "3/5". */
  progressLabel?: string;
  /** An informational module: its sign is a blue JPJ information plate. */
  info?: boolean;
}

/**
 * One learning module as a painted bay. The whole bay is the link, the kerb
 * and the road strip state the status, and the sign in the corner repeats it
 * in a shape a learner already reads on the road: a green check when done, a
 * yellow warning diamond while in progress, the module's own symbol while open.
 */
export function LearningBay({ title, description, to, state = "open", icon, progressLabel, info = false }: LearningBayProps) {
  const { t } = useLanguage();
  const action = t(state === "done" ? "dashboard.bay.action.done" : state === "progress" ? "dashboard.bay.action.progress" : info ? "dashboard.bay.action.view" : "dashboard.bay.action.open");
  return <Link to={to} className="group block h-full no-underline hover:no-underline">
    <Bay state={state} className="flex h-full flex-col shadow-[var(--shadow-plate)] group-hover:shadow-[0_10px_24px_-14px_rgb(var(--asphalt)/.5)]">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="type-display text-xl">{title}</h3>
          <BaySign state={state} icon={icon} progressLabel={progressLabel} info={info}/>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <span className="mt-auto inline-flex min-h-12 items-center gap-2 pt-3 text-sm font-semibold group-hover:underline">{action}<ArrowRight size={16} weight="bold" aria-hidden="true"/></span>
      </div>
      <div className="road-strip"><RoadRule marking={state === "done" ? "closed" : state === "progress" ? "progress" : "open"}/></div>
    </Bay>
  </Link>;
}

function BaySign({ state, icon: Glyph, progressLabel, info }: Pick<LearningBayProps, "state" | "icon" | "progressLabel" | "info">) {
  const { t } = useLanguage();
  if (state === "done") {
    return <CheckCircle weight="fill" size={32} role="img" aria-label={t("dashboard.bay.state.done")} className="shrink-0 text-success"/>;
  }
  if (state === "progress") {
    return <svg width="44" height="44" viewBox="0 0 44 44" role="img" aria-label={t("dashboard.bay.state.progress", { value: progressLabel ?? "" })} className="-my-1 shrink-0">
      <rect x="9" y="9" width="26" height="26" rx="2" transform="rotate(45 22 22)" fill="rgb(var(--awas))" stroke="rgb(var(--asphalt))" strokeWidth="2"/>
      {progressLabel && <text x="22" y="22.5" textAnchor="middle" dominantBaseline="central" className="type-plate" fontSize="10" fill="rgb(var(--asphalt))">{progressLabel}</text>}
    </svg>;
  }
  if (info) {
    return <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--r-plate)] bg-[rgb(var(--sign-info))] text-[rgb(var(--paint))]"><Glyph size={22}/></span>;
  }
  return <Glyph size={28} aria-hidden="true" className="shrink-0 text-[rgb(var(--road-ink))]"/>;
}
