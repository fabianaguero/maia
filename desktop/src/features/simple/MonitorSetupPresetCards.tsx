import type { AppTranslations } from "../../i18n/types";
import type { MonitorSetupOptionViewModel } from "./monitorSetupViewModel";

interface MonitorSetupPresetCardsProps {
  t: AppTranslations;
  presetCards: Array<MonitorSetupOptionViewModel<"passive" | "balanced" | "alert"> | null>;
  customPresetCard: MonitorSetupOptionViewModel<"custom"> | null;
  activePreset: "passive" | "balanced" | "alert" | "custom";
  applyDeckPreset: (preset: "passive" | "balanced" | "alert") => void;
}

export function MonitorSetupPresetCards({
  t,
  presetCards,
  customPresetCard,
  activePreset,
  applyDeckPreset,
}: MonitorSetupPresetCardsProps) {
  return (
    <div className="monitor-setup-screen__preset-bank">
      <div className="monitor-setup-screen__preset-copy">
        <span className="monitor-setup-screen__rack-kicker">
          {t.simpleMode.deckSetup.presetBank}
        </span>
        <strong>{t.simpleMode.deckSetup.presetTitle}</strong>
        <span
          className="monitor-setup-screen__microcopy"
          title={t.simpleMode.deckSetup.presetDescription}
        >
          {t.simpleMode.deckSetup.presetHint}
        </span>
      </div>

      <div className="monitor-setup-screen__preset-grid" role="list">
        {presetCards.filter(Boolean).map((preset) => (
          <button
            key={preset!.id}
            type="button"
            role="listitem"
            className={`monitor-setup-screen__preset-card ${preset!.isActive ? "active" : ""}`}
            aria-label={preset!.label}
            aria-pressed={preset!.isActive}
            onClick={() => applyDeckPreset(preset!.id)}
            title={preset!.detail}
          >
            <div className="monitor-setup-screen__preset-head">
              <span className="monitor-setup-screen__preset-label">{preset!.label}</span>
              <span className="monitor-setup-screen__preset-chip">{preset!.chipLabel}</span>
            </div>
            <span className="monitor-setup-screen__card-detail">{preset!.detail}</span>
          </button>
        ))}

        <div
          className={`monitor-setup-screen__preset-card monitor-setup-screen__preset-card--custom ${activePreset === "custom" ? "active" : ""}`}
          title={customPresetCard?.detail}
        >
          <div className="monitor-setup-screen__preset-head">
            <span className="monitor-setup-screen__preset-label">{customPresetCard?.label}</span>
            <span className="monitor-setup-screen__preset-chip">{customPresetCard?.chipLabel}</span>
          </div>
          <span className="monitor-setup-screen__card-detail">{customPresetCard?.detail}</span>
        </div>
      </div>
    </div>
  );
}
