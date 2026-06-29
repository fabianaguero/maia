import { useState } from "react";
import { FolderOpen, Music, Zap, ScrollText, GitBranch } from "lucide-react";
import { useT } from "../../i18n/I18nContext";

interface WizardProps {
  onComplete?: (config: {
    sourceType: "file" | "folder" | "github";
    sourcePath: string;
    soundPreset: "calm" | "alert" | "intense";
  }) => void;
}

export function OnboardingWizard({ onComplete }: WizardProps) {
  const t = useT();
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState<"file" | "folder" | "github">("file");
  const [sourcePath, setSourcePath] = useState("");
  const [soundPreset, setSoundPreset] = useState<"calm" | "alert" | "intense">("calm");

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
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
        {/* Step 1 - Connect Logs */}
        {step === 1 && (
          <div className="wizard-step">
            {/* Step Indicator */}
            <div className="step-indicator">
              <div className="step-dot active"></div>
              <div className="step-dot"></div>
              <div className="step-dot"></div>
            </div>

            {/* Content */}
            <div className="step-icon">
              <FolderOpen size={32} className="cyan" />
            </div>
            <h2 className="step-title">{t.simpleMode.wizard.connectTitle}</h2>
            <p className="step-subtitle">{t.simpleMode.wizard.connectSubtitle}</p>

            {/* Source Type Options */}
            <div className="source-type-options">
              <button
                className={`option-card ${sourceType === "file" ? "selected" : ""}`}
                onClick={() => setSourceType("file")}
              >
                <ScrollText size={24} />
                <span>{t.simpleMode.wizard.sourceFile}</span>
              </button>
              <button
                className={`option-card ${sourceType === "folder" ? "selected" : ""}`}
                onClick={() => setSourceType("folder")}
              >
                <FolderOpen size={24} />
                <span>{t.simpleMode.wizard.sourceFolder}</span>
              </button>
              <button
                className={`option-card ${sourceType === "github" ? "selected" : ""}`}
                onClick={() => setSourceType("github")}
              >
                <GitBranch size={24} />
                <span>{t.simpleMode.wizard.sourceGithub}</span>
              </button>
            </div>

            {/* Input Field */}
            <div className="step-input-group">
              <input
                type="text"
                placeholder={
                  sourceType === "file"
                    ? "/var/log/app.log"
                    : sourceType === "folder"
                      ? "/home/dev/project"
                      : "github.com/org/repo"
                }
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                className="step-input"
              />
              <button className="btn-browse">{t.simpleMode.wizard.browse}</button>
            </div>

            {/* Actions */}
            <div className="step-actions">
              <button className="btn-primary btn-full" onClick={handleNext} disabled={!sourcePath}>
                {t.simpleMode.wizard.continue}
              </button>
              <button className="btn-skip">{t.simpleMode.wizard.setupLater}</button>
            </div>
          </div>
        )}

        {/* Step 2 - Pick Sound */}
        {step === 2 && (
          <div className="wizard-step">
            {/* Step Indicator */}
            <div className="step-indicator">
              <div className="step-dot"></div>
              <div className="step-dot active"></div>
              <div className="step-dot"></div>
            </div>

            {/* Content */}
            <div className="step-icon">
              <Music size={32} className="cyan" />
            </div>
            <h2 className="step-title">{t.simpleMode.wizard.soundTitle}</h2>
            <p className="step-subtitle">{t.simpleMode.wizard.soundSubtitle}</p>

            {/* Preset Options */}
            <div className="preset-options">
              <button
                className={`preset-card ${soundPreset === "calm" ? "selected" : ""}`}
                onClick={() => setSoundPreset("calm")}
              >
                <div className="preset-wave calm"></div>
                <span className="preset-name">{t.simpleMode.wizard.calm}</span>
                <span className="preset-desc">{t.simpleMode.wizard.calmDesc}</span>
                {soundPreset === "calm" && (
                  <span className="preset-badge">{t.simpleMode.wizard.recommended}</span>
                )}
              </button>
              <button
                className={`preset-card ${soundPreset === "alert" ? "selected" : ""}`}
                onClick={() => setSoundPreset("alert")}
              >
                <div className="preset-wave alert"></div>
                <span className="preset-name">{t.simpleMode.wizard.alert}</span>
                <span className="preset-desc">{t.simpleMode.wizard.alertDesc}</span>
              </button>
              <button
                className={`preset-card ${soundPreset === "intense" ? "selected" : ""}`}
                onClick={() => setSoundPreset("intense")}
              >
                <div className="preset-wave intense"></div>
                <span className="preset-name">{t.simpleMode.wizard.intense}</span>
                <span className="preset-desc">{t.simpleMode.wizard.intenseDesc}</span>
              </button>
            </div>

            {/* Import Custom */}
            <button className="btn-import-custom">{t.simpleMode.wizard.importTrack}</button>

            {/* Actions */}
            <div className="step-actions">
              <button className="btn-primary btn-full" onClick={handleNext}>
                {t.simpleMode.wizard.continue}
              </button>
              <button className="btn-back" onClick={() => setStep(1)}>
                {t.simpleMode.wizard.backButton}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Start Listening */}
        {step === 3 && (
          <div className="wizard-step final">
            {/* Step Indicator */}
            <div className="step-indicator">
              <div className="step-dot"></div>
              <div className="step-dot"></div>
              <div className="step-dot active"></div>
            </div>

            {/* Content */}
            <div className="step-icon pulsing">
              <Zap size={40} className="teal" />
            </div>
            <h2 className="step-title">{t.simpleMode.wizard.readyTitle}</h2>

            {/* Summary */}
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

            {/* Actions */}
            <div className="step-actions">
              <button className="btn-start-listening btn-full" onClick={handleNext}>
                {t.simpleMode.wizard.startButton}
              </button>
              <button className="btn-back" onClick={() => setStep(2)}>
                {t.simpleMode.wizard.backButton}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
