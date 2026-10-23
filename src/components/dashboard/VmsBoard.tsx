import { Link } from "react-router-dom";
import { ArrowRight } from "@/components/ui/icons";

export interface NextStepContent {
  label: string;
  title: string;
  detail: string;
  action: string;
  to: string;
}

/**
 * The next step, on a variable message sign: amber dot matrix that a learner
 * reads the way they would read the motorway, plus one white button.
 */
export function VmsBoard({ label, title, detail, action, to }: NextStepContent) {
  return (
    <section aria-labelledby="vms-title" className="vms mt-6 flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5">
      <div className="relative min-w-0">
        <p className="text-[clamp(0.8125rem,1.6vw,1.0625rem)] opacity-90">{label}</p>
        <h2 id="vms-title" className="type-vms text-[clamp(1.375rem,3vw,2rem)] leading-[1.2] tracking-normal text-vms">{title}</h2>
        <p className="text-[clamp(0.8125rem,1.6vw,1.0625rem)] opacity-90">{detail}</p>
      </div>
      <Link
        to={to}
        className="relative inline-flex min-h-12 items-center gap-2 rounded-xl border-[3px] border-[#111] bg-white px-6 font-sans text-base font-black text-[#111] no-underline shadow-[0_0_0_3px_rgb(var(--vms))] transition-transform duration-150 [text-shadow:none] hover:-translate-y-0.5 active:scale-[0.97] sm:text-lg"
      >
        {action}
        <ArrowRight size={20} weight="bold" aria-hidden="true" />
      </Link>
    </section>
  );
}
