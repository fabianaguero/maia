import { useState } from "react";
import {
  FolderOpen,
  Music,
  Zap,
  ScrollText,
  GitBranch,
  ChevronRight,
} from "lucide-react";

interface WizardProps {
  onComplete?: (config: {
    sourceType: "file" | "folder" | "github";
    sourcePath: string;
    soundPreset: "calm" | "alert" | "intense";
  }) => void;
}

export function OnboardingWizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState<"file" | "folder" | "github">(
    "file"
  );
  const [sourcePath, setSourcePath] = useState("");
  const [soundPreset, setSoundPreset] = useState<"calm" | "alert" | "intense">(
    "calm"
  );

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
            <h2 className="step-title">Connect your logs</h2>
            <p className="step-subtitle">
              Point Maia at a log file, a running process, or a GitHub repo.
            </p>

            {/* Source Type Options */}
            <div className="source-type-options">
              <button
                className={`option-card ${sourceType === "file" ? "selected" : ""}`}
                onClick={() => setSourceType("file")}
              >
                <ScrollText size={24} />
                <span>Log file</span>
              </button>
              <button
                className={`option-card ${sourceType === "folder" ? "selected" : ""}`}
                onClick={() => setSourceType("folder")}
              >
                <FolderOpen size={24} />
                <span>Folder / Repo</span>
              </button>
              <button
                className={`option-card ${sourceType === "github" ? "selected" : ""}`}
                onClick={() => setSourceType("github")}
              >
                <GitBranch size={24} />
                <span>GitHub URL</span>
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
              <button className="btn-browse">Browse</button>
            </div>

            {/* Actions */}
            <div className="step-actions">
              <button
                className="btn-primary btn-full"
                onClick={handleNext}
                disabled={!sourcePath}
              >
                Continue
              </button>
              <button className="btn-skip">I'll set this up later</button>
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
            <h2 className="step-title">Pick a sound profile</h2>
            <p className="step-subtitle">
              Choose how Maia sounds while monitoring. You can change this anytime.
            </p>

            {/* Preset Options */}
            <div className="preset-options">
              <button
                className={`preset-card ${soundPreset === "calm" ? "selected" : ""}`}
                onClick={() => setSoundPreset("calm")}
              >
                <div className="preset-wave calm"></div>
                <span className="preset-name">Calm</span>
                <span className="preset-desc">Minimal, background-friendly</span>
                {soundPreset === "calm" && (
                  <span className="preset-badge">Recommended</span>
                )}
              </button>
              <button
                className={`preset-card ${soundPreset === "alert" ? "selected" : ""}`}
                onClick={() => setSoundPreset("alert")}
              >
                <div className="preset-wave alert"></div>
                <span className="preset-name">Alert</span>
                <span className="preset-desc">Clear anomaly contrast</span>
              </button>
              <button
                className={`preset-card ${soundPreset === "intense" ? "selected" : ""}`}
                onClick={() => setSoundPreset("intense")}
              >
                <div className="preset-wave intense"></div>
                <span className="preset-name">Intense</span>
                <span className="preset-desc">Maximum differentiation</span>
              </button>
            </div>

            {/* Import Custom */}
            <button className="btn-import-custom">Import my own track</button>

            {/* Actions */}
            <div className="step-actions">
              <button className="btn-primary btn-full" onClick={handleNext}>
                Continue
              </button>
              <button className="btn-back" onClick={() => setStep(1)}>
                Back
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
            <h2 className="step-title">Ready to monitor</h2>

            {/* Summary */}
            <div className="summary-box">
              <div className="summary-item">
                <span className="summary-label">Source:</span>
                <span className="summary-value">{sourcePath}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Sound:</span>
                <span className="summary-value">{soundPreset}</span>
              </div>
            </div>

            <p className="step-info">
              Maia will notify you when anomalies are detected.
            </p>

            {/* Actions */}
            <div className="step-actions">
              <button
                className="btn-start-listening btn-full"
                onClick={handleNext}
              >
                Start listening
              </button>
              <button className="btn-back" onClick={() => setStep(2)}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
