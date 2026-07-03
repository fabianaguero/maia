import { FolderOpen, GitBranch, ScrollText } from "lucide-react";

import type { AppTranslations } from "../../i18n/en";
import {
  resolveOnboardingSourcePlaceholder,
  type OnboardingSourceType,
} from "./onboardingWizardRuntime";

interface OnboardingWizardSourceStepProps {
  t: AppTranslations;
  sourceType: OnboardingSourceType;
  sourcePath: string;
  onSelectSourceType: (value: OnboardingSourceType) => void;
  onSourcePathChange: (value: string) => void;
  onContinue: () => void;
}

export function OnboardingWizardSourceStep({
  t,
  sourceType,
  sourcePath,
  onSelectSourceType,
  onSourcePathChange,
  onContinue,
}: OnboardingWizardSourceStepProps) {
  return (
    <>
      <div className="step-icon">
        <FolderOpen size={32} className="cyan" />
      </div>
      <h2 className="step-title">{t.simpleMode.wizard.connectTitle}</h2>
      <p className="step-subtitle">{t.simpleMode.wizard.connectSubtitle}</p>

      <div className="source-type-options">
        <button
          className={`option-card ${sourceType === "file" ? "selected" : ""}`}
          onClick={() => onSelectSourceType("file")}
        >
          <ScrollText size={24} />
          <span>{t.simpleMode.wizard.sourceFile}</span>
        </button>
        <button
          className={`option-card ${sourceType === "folder" ? "selected" : ""}`}
          onClick={() => onSelectSourceType("folder")}
        >
          <FolderOpen size={24} />
          <span>{t.simpleMode.wizard.sourceFolder}</span>
        </button>
        <button
          className={`option-card ${sourceType === "github" ? "selected" : ""}`}
          onClick={() => onSelectSourceType("github")}
        >
          <GitBranch size={24} />
          <span>{t.simpleMode.wizard.sourceGithub}</span>
        </button>
      </div>

      <div className="step-input-group">
        <input
          type="text"
          placeholder={resolveOnboardingSourcePlaceholder(sourceType)}
          value={sourcePath}
          onChange={(event) => onSourcePathChange(event.target.value)}
          className="step-input"
        />
        <button className="btn-browse">{t.simpleMode.wizard.browse}</button>
      </div>

      <div className="step-actions">
        <button className="btn-primary btn-full" onClick={onContinue} disabled={!sourcePath}>
          {t.simpleMode.wizard.continue}
        </button>
        <button className="btn-skip">{t.simpleMode.wizard.setupLater}</button>
      </div>
    </>
  );
}
