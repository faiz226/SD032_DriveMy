import { Link } from "react-router-dom";
import { ArrowLeft } from "@/components/ui/icons";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";
import { ROUTES } from "@/lib/constants";

export function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="page-shell flex min-h-[70dvh] max-w-2xl items-center justify-center">
      <Panel className="w-full p-8 sm:p-10 flex flex-col items-center justify-center gap-4 text-center">
        <p
          className="type-figure inline-flex items-center justify-center rounded-xl border border-border bg-muted/60 px-4 py-1.5 font-heading text-4xl sm:text-5xl text-muted-foreground"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="page-title">{t("common.notFoundTitle")}</h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-readable">
          {t("common.notFoundDescription")}
        </p>
        <Button asChild variant="brand" size="lg" className="mt-2 min-h-11">
          <Link to={ROUTES.DASHBOARD}>
            <ArrowLeft aria-hidden="true" />
            {t("results.backToDashboard")}
          </Link>
        </Button>
      </Panel>
    </div>
  );
}
