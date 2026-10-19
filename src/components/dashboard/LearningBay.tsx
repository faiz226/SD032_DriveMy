import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Clock } from "phosphor-react";
import { Bay, RoadRule } from "@/components/ui/road";
import { useLanguage } from "@/hooks/useLanguage";

export function LearningBay({ title, description, to, state = "open" }: { title: string; description: string; to: string; state?: "open" | "progress" | "done" }) {
  const { language } = useLanguage();
  const ms = language === "ms";
  const action = state === "done" ? (ms ? "Lihat semula" : "Review") : state === "progress" ? (ms ? "Sambung" : "Continue") : (ms ? "Buka" : "Open");
  return <Link to={to} className="block h-full no-underline hover:no-underline rounded-none group">
    <Bay state={state} className="h-full flex flex-col shadow-[var(--shadow-plate)]">
      <div className="flex-1 p-5"><div className="flex justify-between gap-4 items-start"><h3 className="type-display text-xl">{title}</h3>
        {state === "done" ? <CheckCircle weight="fill" size={24} className="text-success shrink-0" aria-label={ms ? "Selesai" : "Completed"}/> : state === "progress" ? <Clock size={24} className="shrink-0" aria-label={ms ? "Dalam proses" : "In progress"}/> : <ArrowRight size={20} aria-hidden="true"/>}</div>
        <p className="mt-4 text-sm text-muted-foreground">{description}</p>
        <span className="mt-5 inline-flex min-h-12 items-center gap-2 text-sm font-semibold group-hover:underline">{action}<ArrowRight size={16} aria-hidden="true"/></span>
      </div>
      <div className="road-strip"><RoadRule marking={state === "done" ? "closed" : state === "progress" ? "progress" : "open"}/></div>
    </Bay>
  </Link>;
}
