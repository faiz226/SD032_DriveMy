import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="page-shell max-w-2xl">
      <section className="min-h-[60vh] card-premium p-8 md:p-10 flex flex-col items-center justify-center gap-4 text-center">
        <p className="font-heading text-6xl font-semibold text-muted-foreground/40 font-tabular-nums" aria-hidden>
          404
        </p>
        <h1 className="font-heading text-xl font-semibold">{t("common.notFoundTitle")}</h1>
        <p className="text-sm text-muted-foreground max-w-readable">
          {t("common.notFoundDescription")}
        </p>
        <Button asChild variant="outline" className="min-h-[44px]">
          <Link to={ROUTES.DASHBOARD}>{t("results.backToDashboard")}</Link>
        </Button>
      </section>
    </div>
  );
}
