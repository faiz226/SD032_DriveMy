import { useLanguage } from "@/hooks/useLanguage";
import { DisplayNotificationsSection } from "./settings/DisplayNotificationsSection";
import { DangerZoneSection } from "./settings/DangerZoneSection";
import { ProfileMilestonesSection } from "./settings/ProfileMilestonesSection";

export function SettingsPage() {
  const { t } = useLanguage();

  return (
    <div className="page-shell max-w-5xl space-y-6 overflow-x-hidden">
      <header className="page-header">
        <h1 className="page-title">{t("settings.title")}</h1>
        <p className="page-lead">{t("settings.preferences")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6 items-start">
        {/* Left Column: Settings & Preferences */}
        <div className="space-y-6">
          <DisplayNotificationsSection />
          <DangerZoneSection />
        </div>

        {/* Right Column: Profile & Milestones */}
        <div className="space-y-6">
          <ProfileMilestonesSection />
        </div>
      </div>
    </div>
  );
}
