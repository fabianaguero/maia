export type OnboardingWizardStep = 1 | 2 | 3;
export type OnboardingSourceType = "file" | "folder" | "github";
export type OnboardingSoundPreset = "calm" | "alert" | "intense";

export interface OnboardingWizardConfig {
  sourceType: OnboardingSourceType;
  sourcePath: string;
  soundPreset: OnboardingSoundPreset;
}

export function resolveOnboardingSourcePlaceholder(sourceType: OnboardingSourceType): string {
  switch (sourceType) {
    case "folder":
      return "/home/dev/project";
    case "github":
      return "github.com/org/repo";
    default:
      return "/var/log/app.log";
  }
}

export function resolveOnboardingNextStep(step: OnboardingWizardStep): OnboardingWizardStep | null {
  return step < 3 ? ((step + 1) as OnboardingWizardStep) : null;
}
