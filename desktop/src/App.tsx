import { AppContentShell } from "./AppContentShell";
import { UserModeProvider, useUserMode } from "./features/simple/UserModeContext";
import { NotificationProvider } from "./components/NotificationSystem";
import { I18nContext } from "./i18n/I18nContext";
import { useAppContentController } from "./hooks/useAppContentController";

export default function App() {
  return (
    <NotificationProvider>
      <UserModeProvider>
        <AppContent />
      </UserModeProvider>
    </NotificationProvider>
  );
}

function AppContent() {
  const { userMode } = useUserMode();
  const controller = useAppContentController();

  return (
    <I18nContext.Provider value={controller.t}>
      <AppContentShell userMode={userMode} controller={controller} />
    </I18nContext.Provider>
  );
}
