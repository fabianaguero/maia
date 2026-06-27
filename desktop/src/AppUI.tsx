import { useUserMode } from "./features/simple/UserModeContext";
import type { AppSection } from "./features/simple/appSections";
import { AppShell } from "./components/AppShell";
import { WaveformBar } from "./components/WaveformBar";
import { useT } from "./i18n/I18nContext";
import { resolveAppUIContentLabel } from "./appUIRuntime";

interface AppUIProps {
  currentSection: AppSection;
  isMonitoring: boolean;
  selectedItem?: string;
}

export function AppUI({ currentSection, isMonitoring, selectedItem = "" }: AppUIProps) {
  const { userMode } = useUserMode();
  const t = useT();
  const contentLabel = resolveAppUIContentLabel(currentSection, userMode, t);

  return (
    <>
      <AppShell
        currentSection={currentSection}
        isMonitoring={isMonitoring}
        selectedItem={selectedItem}
      >
        <div style={{ padding: "2rem", textAlign: "center", color: "#a8b3c1" }}>{contentLabel}</div>
      </AppShell>
      {isMonitoring && <WaveformBar isActive={true} />}
    </>
  );
}
