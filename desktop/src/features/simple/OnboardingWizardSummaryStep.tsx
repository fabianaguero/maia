import { Zap } from "lucide-react";

import type { AppTranslations } from "../../i18n/en";
import type { OnboardingSoundPreset } from "./onboardingWizardRuntime";

interface OnboardingWizardSummaryStepProps {
  t: AppTranslations;
  sourcePath: string;
  soundPreset: OnboardingSoundPreset;
  onStart: () => void;
  onBack: () => void;
}

export function OnboardingWizardSummaryStep({
  t,
  sourcePath,
  soundPreset,
  onStart,
  onBack,
}: OnboardingWizardSummaryStepProps) {
  return (
    <div className="wizard-step final">
      <div className="step-icon pulsing">
        <Zap size={40} className="teal" />
      </div>
      <h2 className="step-title">{t.simpleMode.wizard.readyTitle}</h2>

      <div className="summary-box">
        <div className="summary-item">
          <span className="summary-label">{t.simpleMode.wizard.sourceLabel}</span>
          <span className="summary-value">{sourcePath}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">{t.simpleMode.wizard.soundLabel}</span>
          <span className="summary-value">{soundPreset}</span>
        </div>
      </div>

      <p className="step-info">{t.simpleMode.wizard.readyInfo}</p>

      <div className="step-actions">
        <button className="btn-start-listening btn-full" onClick={onStart}>
          {t.simpleMode.wizard.startButton}
        </button>
        <button className="btn-back" onClick={onBack}>
          {t.simpleMode.wizard.backButton}
        </button>
      </div>
    </div>
  );
}
