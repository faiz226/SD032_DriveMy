import { Link } from "react-router-dom";
import { Play } from "phosphor-react";
import { Button } from "@/components/ui/button";

interface NextStepProps {
  label: string;
  title: string;
  detail: string;
  action: string;
  to: string;
}

/**
 * The one recommended action, painted along the bottom of the carriageway the
 * way a variable message sign hangs over a road: what to do, how long it
 * takes, and a single control. The yellow plate is "in progress" in the
 * marking grammar, and the next step is exactly where the learner continues.
 */
export function NextStep({ label, title, detail, action, to }: NextStepProps) {
  return <div className="flex flex-col gap-4 border-t border-[rgb(var(--paint)/.18)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
    <div className="min-w-0">
      <h2 className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="plate-awas type-label-strong px-2 py-0.5 text-sm">{label}</span>
        <span className="type-display text-xl text-[rgb(var(--paint))]">{title}</span>
      </h2>
      <p className="mt-2 text-sm text-[rgb(var(--paint)/.85)]">{detail}</p>
    </div>
    <Button asChild className="shrink-0 self-start bg-[rgb(var(--paint))] text-[rgb(var(--asphalt))] hover:bg-[rgb(var(--grade-8))] sm:self-auto">
      <Link to={to}><Play weight="fill" aria-hidden="true"/>{action}</Link>
    </Button>
  </div>;
}
