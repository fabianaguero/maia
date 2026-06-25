import { useUserMode } from "./features/simple/UserModeContext";
import type { AppSection } from "./features/simple/appSections";
import { AppShell } from "./components/AppShell";
import { WaveformBar } from "./components/WaveformBar";
import { useT } from "./i18n/I18nContext";

interface AppUIProps {
  currentSection: AppSection;
  isMonitoring: boolean;
  selectedItem?: string;
}

export function AppUI({ currentSection, isMonitoring, selectedItem = "" }: AppUIProps) {
  const { userMode } = useUserMode();
  const t = useT();

  const renderContent = () => {
    if (currentSection === "monitor") {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "#a8b3c1" }}>
          {userMode === "simple" ? t.simpleMode.nav.monitor : t.nav.session.label}
        </div>
      );
    }

    if (currentSection === "library") {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "#a8b3c1" }}>
          {userMode === "simple" ? t.simpleMode.nav.files : t.nav.library.label}
        </div>
      );
    }

    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#a8b3c1" }}>
        {t.simpleMode.common.comingSoon}
      </div>
    );
  };

  return (
    <>
      <AppShell
        currentSection={currentSection}
        isMonitoring={isMonitoring}
        selectedItem={selectedItem}
      >
        {renderContent()}
      </AppShell>
      {isMonitoring && <WaveformBar isActive={true} />}
    </>
  );
}
