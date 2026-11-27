import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

/** The brown tourist-sign tip card, with a button for another tip. */
export function RoadTip({ className }: { className?: string }) {
  const { t } = useLanguage();
  const tips = [t("dashboard.tip.1"), t("dashboard.tip.2"), t("dashboard.tip.3")];
  const [index, setIndex] = useState(0);
  return (
    <div className={cn("grid content-center gap-2.5 rounded-xl bg-[#6A4220] p-[1.375rem] text-white shadow-[inset_0_0_0_3px_#6A4220,inset_0_0_0_5px_#fff]", className)}>
      <p className="text-lg font-extrabold">{t("dashboard.tip.title")}</p>
      <p aria-live="polite">{tips[index % tips.length]}</p>
      <button
        type="button"
        onClick={() => setIndex(i => i + 1)}
        className="inline-flex min-h-11 items-center justify-self-start rounded-lg border-2 border-white px-3.5 text-sm font-extrabold transition-[background-color,transform] duration-150 ease-spring hover:bg-white/15 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#6A4220]"
      >
        {t("dashboard.tip.next")}
      </button>
    </div>
  );
}
