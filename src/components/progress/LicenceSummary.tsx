/**
 * Where the learner stands, on the progress page.
 *
 * Reads the same `useLicence` standing the dashboard road reads, so the two
 * pages can never quote different numbers for the same learner. This replaced
 * a readiness donut that computed its own composite locally — which is exactly
 * how a product ends up telling someone they are 68% ready on one screen and
 * 54% ready on another.
 */
import { useLanguage } from "@/hooks/useLanguage";
import { MOCK_PASS_MARK, MOCK_TOTAL_QUESTIONS } from "@/lib/constants";
import {
  PAPER_MARKS,
  CIRCUIT_MARKS,
  TOTAL_MARKS,
  THEORY_MODULES,
  MANEUVERS,
  type LicenceStanding,
} from "@/lib/licence";
import { Bay, LPlate, RoadRule } from "@/components/ui/road";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface LicenceSummaryProps {
  standing?: LicenceStanding;
  pending?: boolean;
}

export function LicenceSummary({ standing, pending }: LicenceSummaryProps) {
  const { t } = useLanguage();

  if (pending || !standing) {
    return (
      <section className="grid gap-4 md:grid-cols-2" aria-busy="true">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <LicenceCard
        letter="L"
        earned={standing.hasL}
        name={t("licence.l.name")}
        fullName={t("licence.l.full")}
        marks={standing.paperEarned}
        total={PAPER_MARKS}
        gate={t("licence.l.gate", {
          modules: String(THEORY_MODULES),
          mark: String(MOCK_PASS_MARK),
          total: String(MOCK_TOTAL_QUESTIONS),
        })}
        outstanding={
          standing.hasL
            ? null
            : !standing.theoryComplete
              ? t("licence.outstanding.theory", {
                  count: String(standing.theoryRemaining),
                })
              : t("licence.outstanding.mock", {
                  mark: String(MOCK_PASS_MARK),
                  total: String(MOCK_TOTAL_QUESTIONS),
                })
        }
        earnedLabel={t("licence.earned")}
        notYetLabel={t("licence.notYet")}
      />

      <LicenceCard
        letter="P"
        earned={standing.hasP}
        name={t("licence.p.name")}
        fullName={t("licence.p.full")}
        marks={standing.circuitEarned}
        total={CIRCUIT_MARKS}
        gate={t("licence.p.gate", { count: String(MANEUVERS.length) })}
        outstanding={
          standing.hasP
            ? null
            : t("licence.outstanding.circuit", {
                count: String(standing.maneuversPassed),
                total: String(MANEUVERS.length),
              })
        }
        earnedLabel={t("licence.earned")}
        notYetLabel={t("licence.notYet")}
      />

      <p className="md:col-span-2 text-sm text-muted-foreground">
        {t("dashboard.marks", {
          earned: String(standing.totalEarned),
          total: String(TOTAL_MARKS),
        })}
      </p>
    </section>
  );
}

interface LicenceCardProps {
  letter: "L" | "P";
  earned: boolean;
  name: string;
  fullName: string;
  marks: number;
  total: number;
  gate: string;
  outstanding: string | null;
  earnedLabel: string;
  notYetLabel: string;
}

function LicenceCard({
  letter,
  earned,
  name,
  fullName,
  marks,
  total,
  gate,
  outstanding,
  earnedLabel,
  notYetLabel,
}: LicenceCardProps) {
  return (
    <Bay
      state={earned ? "done" : "open"}
      className="flex h-full flex-col gap-4 px-5 py-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <LPlate letter={letter} size={34} earned={earned} title={name} />
          <div className="min-w-0">
            <p className="type-label-strong text-sm text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{fullName}</p>
          </div>
        </div>
        <p
          className={cn(
            "type-label-strong shrink-0 text-xs",
            earned ? "text-success" : "text-muted-foreground"
          )}
        >
          {earned ? earnedLabel : notYetLabel}
        </p>
      </div>

      <RoadRule state={earned ? "closed" : "open"} className="opacity-50" />

      <p className="type-figure text-3xl text-foreground">
        {marks}
        <span className="ml-1.5 text-sm font-medium text-muted-foreground">
          / {total}
        </span>
      </p>

      <p className="mt-auto text-sm text-muted-foreground">
        {outstanding ?? gate}
      </p>
    </Bay>
  );
}
