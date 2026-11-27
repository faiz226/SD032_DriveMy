import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";
import { BrandMark } from "@/components/shared/BrandMark";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { PRIVACY_CONTACT_EMAIL, ROUTES } from "@/lib/constants";
import { PRIVACY_SECTIONS, PRIVACY_SUMMARY, PRIVACY_UPDATED } from "@/content/privacy";

/**
 * The privacy notice. Public, so it can be read before signing up (PDPA 2010, Notice and Choice), which also
 * means it sits outside the app shell and brings its own way back and its own language switch.
 */
export function PrivacyPolicyPage() {
  const { t, language } = useLanguage();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();
  // Opened from inside the app (Settings, the consent banner) it goes back there; opened from a link it goes
  // home: the dashboard, or sign-in when signed out.
  const goBack = () => (location.key === "default" ? navigate(ROUTES.DASHBOARD) : navigate(-1));

  return (
    <div className="min-h-[100dvh]">
      <header className="glass-bar sticky top-0 z-10 border-x-0 border-t-0">
        <div className="mx-auto flex min-h-14 max-w-3xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6">
          <Button variant="ghost" className="-ml-2 min-h-11 px-3" onClick={goBack}>
            <ArrowLeft aria-hidden="true" />
            {t("common.back")}
          </Button>
          <BrandMark />
          <LanguageToggle variant="pill" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6 sm:py-14">
        <header className="space-y-3">
          <h1 className="page-title">{t("privacy.title")}</h1>
          <p className="text-sm text-muted-foreground">{PRIVACY_UPDATED[language]}</p>
          <p className="max-w-readable text-base sm:text-lg leading-relaxed">{PRIVACY_SUMMARY[language]}</p>
        </header>

        {PRIVACY_SECTIONS.map(section => (
          <section key={section.id} aria-labelledby={`privacy-${section.id}`} className="space-y-4 border-t border-border pt-8">
            <h2 id={`privacy-${section.id}`} className="text-xl sm:text-2xl">{section.title[language]}</h2>
            <ul className="max-w-readable list-disc space-y-2.5 pl-5 marker:text-muted-foreground">
              {section.items.map(item => <li key={item.en} className="pl-1 leading-relaxed">{item[language]}</li>)}
            </ul>
            {section.id === "choices" && isAuthenticated && (
              <Button asChild variant="outline" className="min-h-11">
                <Link to={ROUTES.SETTINGS}>
                  {t("privacy.openSettings")}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            )}
          </section>
        ))}

        {PRIVACY_CONTACT_EMAIL && (
          <section aria-labelledby="privacy-contact" className="space-y-4 border-t border-border pt-8">
            <h2 id="privacy-contact" className="text-xl sm:text-2xl">{t("privacy.contact")}</h2>
            <p className="max-w-readable">
              {t("privacy.contactBody")} <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="inline-link">{PRIVACY_CONTACT_EMAIL}</a>
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
