import { useUserMode } from "../features/simple/UserModeContext";
import { User, Sliders } from "lucide-react";
import { useT } from "../i18n/I18nContext";

export function ModeToggle() {
  const { userMode, setUserMode } = useUserMode();
  const t = useT();

  return (
    <div className="mode-toggle">
      <button
        type="button"
        className={`mode-toggle-btn ${userMode === "simple" ? "active" : ""}`}
        onClick={() => setUserMode("simple")}
        title={t.simpleMode.shell.basicMode}
        aria-pressed={userMode === "simple"}
      >
        <User size={16} />
        <span>{t.simpleMode.shell.basicShort}</span>
      </button>
      <button
        type="button"
        className={`mode-toggle-btn ${userMode === "expert" ? "active" : ""}`}
        onClick={() => setUserMode("expert")}
        title={t.simpleMode.shell.proMode}
        aria-pressed={userMode === "expert"}
      >
        <Sliders size={16} />
        <span>{t.simpleMode.shell.proShort}</span>
      </button>
    </div>
  );
}
