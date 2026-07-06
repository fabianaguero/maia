import type { OnboardingWizardStep } from "./onboardingWizardRuntime";

interface OnboardingWizardStepIndicatorProps {
  step: OnboardingWizardStep;
}

export function OnboardingWizardStepIndicator({ step }: OnboardingWizardStepIndicatorProps) {
  return (
    <div className="step-indicator">
      {[1, 2, 3].map((value) => (
        <div key={value} className={`step-dot${step === value ? " active" : ""}`} />
      ))}
    </div>
  );
}
