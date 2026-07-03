import { Music } from "lucide-react";

import type { AppTranslations } from "../../i18n/types";
import type { OnboardingSoundPreset } from "./onboardingWizardRuntime";

interface OnboardingWizardPresetStepProps {
  t: AppTranslations;
  soundPreset: OnboardingSoundPreset;
  onSelectSoundPreset: (value: OnboardingSoundPreset) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function OnboardingWizardPresetStep({
  t,
  soundPreset,
  onSelectSoundPreset,
  onContinue,
  onBack,
}: OnboardingWizardPresetStepProps) {
  return (
    <>
      <div className="step-icon">
        <Music size={32} className="cyan" />
      </div>
      <h2 className="step-title">{t.simpleMode.wizard.soundTitle}</h2>
      <p className="step-subtitle">{t.simpleMode.wizard.soundSubtitle}</p>

      <div className="preset-options">
        <button
          className={`preset-card ${soundPreset === "calm" ? "selected" : ""}`}
          onClick={() => onSelectSoundPreset("calm")}
        >
          <div className="preset-wave calm" />
          <span className="preset-name">{t.simpleMode.wizard.calm}</span>
          <span className="preset-desc">{t.simpleMode.wizard.calmDesc}</span>
          {soundPreset === "calm" ? (
            <span className="preset-badge">{t.simpleMode.wizard.recommended}</span>
          ) : null}
        </button>
        <button
          className={`preset-card ${soundPreset === "alert" ? "selected" : ""}`}
          onClick={() => onSelectSoundPreset("alert")}
        >
          <div className="preset-wave alert" />
          <span className="preset-name">{t.simpleMode.wizard.alert}</span>
          <span className="preset-desc">{t.simpleMode.wizard.alertDesc}</span>
        </button>
        <button
          className={`preset-card ${soundPreset === "intense" ? "selected" : ""}`}
          onClick={() => onSelectSoundPreset("intense")}
        >
          <div className="preset-wave intense" />
          <span className="preset-name">{t.simpleMode.wizard.intense}</span>
          <span className="preset-desc">{t.simpleMode.wizard.intenseDesc}</span>
        </button>
      </div>

      <button className="btn-import-custom">{t.simpleMode.wizard.importTrack}</button>

      <div className="step-actions">
        <button className="btn-primary btn-full" onClick={onContinue}>
          {t.simpleMode.wizard.continue}
        </button>
        <button className="btn-back" onClick={onBack}>
          {t.simpleMode.wizard.backButton}
        </button>
      </div>
    </>
  );
}
