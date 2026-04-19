import { useState } from "react";
import { AppShell } from "./components/AppShell";
import { SimpleMonitorScreen } from "./features/simple/SimpleMonitorScreen";
import { ProMonitorScreen } from "./features/simple/ProMonitorScreen";
import { ProLibraryScreen } from "./features/simple/ProLibraryScreen";
import { SimpleModeLibraryView } from "./features/simple/SimpleModeLibraryView";
import { OnboardingWizard } from "./features/simple/OnboardingWizard";
import { WaveformBar } from "./components/WaveformBar";
import { UserModeProvider, useUserMode } from "./features/simple/UserModeContext";
import { I18nContext } from "./i18n/I18nContext";
import { es } from "./i18n/es";
import { en } from "./i18n/en";
import { NotificationProvider } from "./components/NotificationSystem";

type Section = "monitor" | "library" | "inspect" | "compose";

function AppContentV0() {
  const { userMode } = useUserMode();
  const [lang, setLang] = useState<"en" | "es">("es");
  const [currentSection, setCurrentSection] = useState<Section>("library");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showWizard, setShowWizard] = useState(userMode === "simple");

  const t = lang === "es" ? es : en;

  if (userMode === "simple" && showWizard) {
    return (
      <OnboardingWizard
        onComplete={(config) => {
          console.log("Wizard complete:", config);
          setShowWizard(false);
          setCurrentSection("library");
        }}
      />
    );
  }

  const renderContent = () => {
    switch (currentSection) {
      case "monitor":
        return userMode === "simple" ? (
          <SimpleMonitorScreen />
        ) : (
          <ProMonitorScreen />
        );
      case "library":
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
      default:
        return (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "#a8b3c1",
              fontSize: "14px",
            }}
          >
            <p>Sección no implementada en esta versión (dev)</p>
            <p style={{ marginTop: "1rem", fontSize: "12px", color: "#7a8297" }}>
              Usa el sidebar para navegar a Monitor o Library
            </p>
          </div>
        );
    }
  };

  return (
    <I18nContext.Provider value={t}>
      <AppShell
        currentSection={currentSection}
        isMonitoring={isMonitoring}
        selectedItem={currentSection === "library" ? "Log library" : "Monitor session"}
      >
        {renderContent()}
      </AppShell>
      {isMonitoring && (
        <WaveformBar
          isActive={true}
          source="payments-api"
          anomalies={4}
          uptime="12m 34s"
          onStop={() => setIsMonitoring(false)}
          onInspect={() => setCurrentSection("library")}
        />
      )}
    </I18nContext.Provider>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <UserModeProvider>
        <AppContentV0 />
      </UserModeProvider>
    </NotificationProvider>
  );
}
