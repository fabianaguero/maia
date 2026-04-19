import { useUserMode } from "../features/simple/UserModeContext";
import { User, Sliders } from "lucide-react";
import "../styles/ModeToggle.css";

export function ModeToggle() {
  const { userMode, setUserMode } = useUserMode();

  return (
    <div className="mode-toggle">
      <button
        className={`mode-toggle-btn ${userMode === "simple" ? "active" : ""}`}
        onClick={() => setUserMode("simple")}
        title="Basic mode for entry-level users"
      >
        <User size={16} />
        <span>Basic</span>
      </button>
      <button
        className={`mode-toggle-btn ${userMode === "expert" ? "active" : ""}`}
        onClick={() => setUserMode("expert")}
        title="Pro mode with advanced controls"
      >
        <Sliders size={16} />
        <span>Pro</span>
      </button>
    </div>
  );
}
