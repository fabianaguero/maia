import { useUserMode } from "../features/simple/UserModeContext";
import { User, Sliders } from "lucide-react";
import { useT } from "../i18n/I18nContext";

export function ModeToggle() {
  const { userMode, setUserMode } = useUserMode();
  const t = useT();

  return (
    <div className="mode-toggle">
      <button
        className={`mode-toggle-btn ${userMode === "simple" ? "active" : ""}`}
        onClick={() => setUserMode("simple")}
        title={t.simpleMode.shell.basicMode}
      >
        <User size={16} />
        <span>{t.simpleMode.shell.basicShort}</span>
      </button>
      <button
        className={`mode-toggle-btn ${userMode === "expert" ? "active" : ""}`}
        onClick={() => setUserMode("expert")}
        title={t.simpleMode.shell.proMode}
      >
        <Sliders size={16} />
        <span>{t.simpleMode.shell.proShort}</span>
      </button>
    </div>
  );
}
