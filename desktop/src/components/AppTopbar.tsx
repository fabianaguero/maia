import { Globe2, Moon, Sun } from "lucide-react";

import { BrandLockup, BrandWordmark } from "./Branding";
import { buildAppTopbarState, type AppShellUserMode } from "../appShellRuntime";

interface AppTopbarProps {
  isDark: boolean;
  lang: "en" | "es";
  userMode: AppShellUserMode;
  workspaceLabel: string;
  controls: {
    lang: string;
    english: string;
    spanish: string;
    dark: string;
    light: string;
  };
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
}

export function AppTopbar({
  isDark,
  lang,
  userMode,
  workspaceLabel,
  controls,
  onToggleLanguage,
  onToggleTheme,
}: AppTopbarProps) {
  const state = buildAppTopbarState(userMode);

  return (
    <header className="topbar">
      <div className="topbar-brand">
        {state.showWordmark ? <BrandWordmark className="topbar-wordmark" /> : null}
        {state.showLockup ? (
          <BrandLockup className="topbar-brand-lockup" wordmarkClassName="topbar-wordmark" />
        ) : null}
        {state.showWorkspaceSubtitle ? (
          <div className="topbar-copy">
            <span className="topbar-subtitle">{workspaceLabel}</span>
          </div>
        ) : null}
      </div>

      <div className="topbar-controls">
        <button
          type="button"
          className="control-button"
          onClick={onToggleLanguage}
          title={controls.lang}
        >
          <Globe2 size={16} />
          <span className="sr-only">{lang === "en" ? controls.spanish : controls.english}</span>
        </button>
        <button
          type="button"
          className="control-button"
          onClick={onToggleTheme}
          title={isDark ? controls.light : controls.dark}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
