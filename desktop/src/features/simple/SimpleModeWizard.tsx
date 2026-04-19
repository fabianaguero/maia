import type { FormEvent } from "react";
import { useState } from "react";
import type { ImportRepositoryInput, ImportBaseAssetInput } from "../../types/library";
import type { BaseAssetCategoryOption } from "../../types/baseAsset";
import { useT } from "../../i18n/I18nContext";
import { ImportRepositoryForm } from "../library/components/ImportRepositoryForm";
import { ImportBaseAssetForm } from "../library/components/ImportBaseAssetForm";

interface SimpleModeWizardProps {
  busyRepository: boolean;
  busyBaseAsset: boolean;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  onStartSession: (repoId: string, baseAssetId: string) => Promise<void>;
  repositoryCount: number;
  baseAssetCount: number;
  baseAssetCategories: BaseAssetCategoryOption[];
  defaultCategoryId?: string;
}

const SIMPLE_PRESETS = [
  {
    id: "calm",
    label: "Calm",
    description: "Smooth, monitoring baseline",
  },
  {
    id: "alert",
    label: "Alert",
    description: "Orange warnings, moderate intensity",
  },
  {
    id: "intense",
    label: "Intense",
    description: "Critical alerts, high energy",
  },
];

export function SimpleModeWizard({
  busyRepository,
  busyBaseAsset,
  onImportRepository,
  onImportBaseAsset,
  onStartSession,
  repositoryCount,
  baseAssetCount,
  baseAssetCategories,
  defaultCategoryId,
}: SimpleModeWizardProps) {
  const t = useT();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStartSession() {
    if (!selectedRepo || !selectedPreset) {
      setError(t.simpleMode.wizard.errorMessage);
      return;
    }

    try {
      await onStartSession(selectedRepo, selectedPreset);
    } catch (err) {
      setError(t.simpleMode.wizard.errorMessage);
    }
  }

  if (repositoryCount === 0) {
    return (
      <div className="simple-wizard">
        <div className="wizard-header">
          <h2 className="wizard-title">{t.simpleMode.wizard.title}</h2>
          <p className="wizard-subtitle">{t.simpleMode.steps.step1}</p>
        </div>
        <ImportRepositoryForm
          busy={busyRepository}
          onImportRepository={onImportRepository}
        />
      </div>
    );
  }

  if (baseAssetCount === 0) {
    return (
      <div className="simple-wizard">
        <div className="wizard-header">
          <h2 className="wizard-title">{t.simpleMode.wizard.title}</h2>
          <p className="wizard-subtitle">{t.simpleMode.steps.step2}</p>
        </div>
        <ImportBaseAssetForm
          busy={busyBaseAsset}
          baseAssetCategories={baseAssetCategories}
          defaultCategoryId={defaultCategoryId}
          onImportBaseAsset={onImportBaseAsset}
        />
      </div>
    );
  }

  return (
    <div className="simple-wizard">
      <div className="wizard-header">
        <h2 className="wizard-title">{t.simpleMode.wizard.title}</h2>
        <p className="wizard-subtitle">{t.simpleMode.steps.step3}</p>
      </div>

      <div className="wizard-progress">
        <div className="progress-dots">
          <div className={`dot ${step >= 1 ? "active" : ""}`} />
          <div className={`dot ${step >= 2 ? "active" : ""}`} />
          <div className={`dot ${step >= 3 ? "active" : ""}`} />
        </div>
      </div>

      <div className="wizard-content">
        {error && <div className="wizard-error">{error}</div>}

        <div className="preset-grid">
          {SIMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`preset-card ${selectedPreset === preset.id ? "selected" : ""}`}
              onClick={() => {
                setSelectedPreset(preset.id);
                setError(null);
              }}
              type="button"
            >
              <span className="preset-label">{preset.label}</span>
              <span className="preset-description">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="wizard-actions">
        <button
          className="button button-primary"
          onClick={handleStartSession}
          disabled={!selectedPreset}
          type="button"
        >
          {t.simpleMode.wizard.startButton}
        </button>
      </div>
    </div>
  );
}
