import { AppShell } from "./components/AppShell";
import { WaveformBar } from "./components/WaveformBar";
import { AppV0SectionContent } from "./AppV0SectionContent";
import { UserModeProvider } from "./features/simple/UserModeContext";
import { I18nContext } from "./i18n/I18nContext";
import { NotificationProvider } from "./components/NotificationSystem";
import { useAppV0ContentModel } from "./hooks/useAppV0ContentModel";

export function AppContentV0() {
  const { screenModel, t } = useAppV0ContentModel();

  return (
    <I18nContext.Provider value={t}>
      <>
        <AppShell {...screenModel.appShellProps}>
          <AppV0SectionContent {...screenModel.sectionContentInput} />
        </AppShell>
        {screenModel.floatingWaveformBarProps ? (
          <WaveformBar {...screenModel.floatingWaveformBarProps} />
        ) : null}
      </>
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
