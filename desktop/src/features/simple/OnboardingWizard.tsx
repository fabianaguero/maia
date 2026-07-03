import { useState } from "react";
import { useT } from "../../i18n/I18nContext";
import { OnboardingWizardPresetStep } from "./OnboardingWizardPresetStep";
import { OnboardingWizardSourceStep } from "./OnboardingWizardSourceStep";
import { OnboardingWizardStepIndicator } from "./OnboardingWizardStepIndicator";
import { OnboardingWizardSummaryStep } from "./OnboardingWizardSummaryStep";
import {
  resolveOnboardingNextStep,
  type OnboardingSoundPreset,
  type OnboardingSourceType,
  type OnboardingWizardConfig,
  type OnboardingWizardStep,
} from "./onboardingWizardRuntime";

interface WizardProps {
  onComplete?: (config: OnboardingWizardConfig) => void;
}

export function OnboardingWizard({ onComplete }: WizardProps) {
  const t = useT();
  const [step, setStep] = useState<OnboardingWizardStep>(1);
  const [sourceType, setSourceType] = useState<OnboardingSourceType>("file");
  const [sourcePath, setSourcePath] = useState("");
  const [soundPreset, setSoundPreset] = useState<OnboardingSoundPreset>("calm");

  const handleNext = () => {
    const nextStep = resolveOnboardingNextStep(step);
    if (nextStep) {
      setStep(nextStep);
    } else {
      onComplete?.({
        sourceType,
        sourcePath,
        soundPreset,
      });
    }
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-card">
        {step === 1 && (
          <div className="wizard-step">
            <OnboardingWizardStepIndicator step={step} />
            <OnboardingWizardSourceStep
              t={t}
              sourceType={sourceType}
              sourcePath={sourcePath}
              onSelectSourceType={setSourceType}
              onSourcePathChange={setSourcePath}
              onContinue={handleNext}
            />
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step">
            <OnboardingWizardStepIndicator step={step} />
            <OnboardingWizardPresetStep
              t={t}
              soundPreset={soundPreset}
              onSelectSoundPreset={setSoundPreset}
              onContinue={handleNext}
              onBack={() => setStep(1)}
            />
          </div>
        )}

        {step === 3 && (
          <>
            <OnboardingWizardStepIndicator step={step} />
            <OnboardingWizardSummaryStep
              t={t}
              sourcePath={sourcePath}
              soundPreset={soundPreset}
              onStart={handleNext}
              onBack={() => setStep(2)}
            />
          </>
        )}
      </div>
    </div>
  );
}
