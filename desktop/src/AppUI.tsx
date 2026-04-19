import { useUserMode } from "./features/simple/UserModeContext";
import { AppShell } from "./components/AppShell";
import { SimpleMonitorScreen } from "./features/simple/SimpleMonitorScreen";
import { ProMonitorScreen } from "./features/simple/ProMonitorScreen";
import { ProLibraryScreen } from "./features/simple/ProLibraryScreen";
import { SimpleModeLibraryView } from "./features/simple/SimpleModeLibraryView";
import { WaveformBar } from "./components/WaveformBar";

interface AppUIProps {
  currentSection: "monitor" | "library" | "inspect" | "compose";
  onSectionChange: (section: "monitor" | "library" | "inspect" | "compose") => void;
  isMonitoring: boolean;
  selectedItem?: string;
}

export function AppUI({
  currentSection,
  onSectionChange,
  isMonitoring,
  selectedItem = "",
}: AppUIProps) {
  const { userMode } = useUserMode();

  const renderContent = () => {
    if (currentSection === "monitor") {
      return userMode === "simple" ? (
        <SimpleMonitorScreen />
      ) : (
        <ProMonitorScreen />
      );
    }

    if (currentSection === "library") {
      return userMode === "simple" ? (
        <SimpleModeLibraryView
          tracks={[]}
          repositories={[]}
          baseAssets={[]}
          selectedRepositoryId={null}
          onSelectRepository={() => {}}
          onImportRepository={async () => false}
          onImportBaseAsset={async () => false}
        />
      ) : (
        <ProLibraryScreen />
      );
    }

    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#a8b3c1" }}>
        Sección no implementada en esta versión
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
