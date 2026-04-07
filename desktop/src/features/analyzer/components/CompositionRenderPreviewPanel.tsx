import type { CompositionResultRecord } from "../../../types/library";
import { ManagedAudioPlayer } from "./ManagedAudioPlayer";
import { resolveArrangementSections, resolveRenderPreview } from "./compositionPreview";

interface CompositionRenderPreviewPanelProps {
  composition: CompositionResultRecord;
  onTimeUpdate?: (seconds: number) => void;
}

function formatPan(pan: number): string {
  if (pan === 0) {
    return "C";
  }
  return pan > 0 ? `R ${Math.abs(pan).toFixed(2)}` : `L ${Math.abs(pan).toFixed(2)}`;
}

export function CompositionRenderPreviewPanel({
  composition,
  onTimeUpdate,
}: CompositionRenderPreviewPanelProps) {
  const renderPreview = resolveRenderPreview(composition);
  const sections = resolveArrangementSections(composition);
  const previewAudioPath =
    composition.previewAudioPath ??
    (typeof composition.metrics.previewAudioPath === "string"
      ? composition.metrics.previewAudioPath
      : null);
  const previewAudioFormat =
    typeof composition.metrics.previewAudioFormat === "string"
      ? composition.metrics.previewAudioFormat
      : "wav";
  const previewSampleRate =
    typeof composition.metrics.previewAudioSampleRateHz === "number"
      ? composition.metrics.previewAudioSampleRateHz
      : null;
  const previewChannels =
    typeof composition.metrics.previewAudioChannels === "number"
      ? composition.metrics.previewAudioChannels
      : null;
  const previewDurationSeconds =
    typeof composition.metrics.previewAudioDurationSeconds === "number"
      ? composition.metrics.previewAudioDurationSeconds
      : null;

  return (
    <section className="panel waveform-panel">
      <div className="panel-header compact">
        <div>
          <h2>Render preview</h2>
          <p className="support-copy">
            Internal stem plan Maia can use later for bounce/export without inventing a new audio
            engine yet.
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>Mode</span>
          <strong>{renderPreview.mode}</strong>
        </div>
        <div>
          <span>Headroom</span>
          <strong>{renderPreview.headroomDb.toFixed(1)} dB</strong>
        </div>
        <div>
          <span>Stems</span>
          <strong>{renderPreview.stems.length}</strong>
        </div>
        <div>
          <span>Preview file</span>
          <strong>{previewAudioFormat.toUpperCase()}</strong>
        </div>
        <div>
          <span>Automation</span>
          <strong>{renderPreview.automation.length}</strong>
        </div>
        <div>
          <span>Sample rate</span>
          <strong>{previewSampleRate ? `${previewSampleRate} Hz` : "Pending"}</strong>
        </div>
        <div>
          <span>Channels</span>
          <strong>{previewChannels ? `${previewChannels}` : "Pending"}</strong>
        </div>
      </div>

      <div className="render-master-card top-spaced">
        <span>Preview audio path</span>
        <strong>{previewAudioPath ?? "Preview audio not rendered yet"}</strong>
      </div>

      <ManagedAudioPlayer
        title="Preview playback"
        description="Audition the managed `preview.wav` directly inside Maia before adding full bounce/export."
        audioPath={previewAudioPath}
        durationSeconds={previewDurationSeconds}
        playLabel="Play preview"
        pauseLabel="Pause preview"
        missingNote="Preview audio not rendered yet."
        browserFallbackNote="Browser fallback simulates the preview path. Open the Tauri desktop shell to audition the managed preview audio."
        desktopOnlyNote="Managed preview playback is available inside the desktop shell."
        availableNote="Preview playback runs from the managed local snapshot stored by Maia."
        errorNote="Maia could not read the managed preview audio. Re-import the composition if the file is missing."
        onTimeUpdate={onTimeUpdate}
      />

      <div className="panel-header compact top-spaced">
        <div>
          <h2>Stem layout</h2>
          <p className="support-copy">
            Deterministic buses and section coverage derived from the composition plan.
          </p>
        </div>
      </div>

      <div className="render-stem-grid">
        {renderPreview.stems.map((stem) => {
          const labels = sections
            .filter((section) => stem.sectionIds.includes(section.id))
            .map((section) => section.label);

          return (
            <article key={stem.id} className="render-stem-card">
              <span>
                {stem.role} · {stem.source}
              </span>
              <strong>{stem.label}</strong>
              <small>
                Gain {stem.gainDb.toFixed(1)} dB · Pan {formatPan(stem.pan)}
              </small>
              <p>{stem.focus}</p>
              <div className="pill-strip">
                {labels.map((label) => (
                  <span key={`${stem.id}-${label}`}>{label}</span>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="panel-header compact top-spaced">
        <div>
          <h2>Automation</h2>
          <p className="support-copy">
            Section-scoped moves stored now so later render passes can stay deterministic.
          </p>
        </div>
      </div>

      <ul className="stack-list">
        {renderPreview.automation.map((move) => (
          <li key={move.id}>
            <strong>{move.target}</strong>
            <small>
              {move.move} · bars {move.startBar}-{move.endBar}
            </small>
          </li>
        ))}
      </ul>

      <div className="panel-header compact top-spaced">
        <div>
          <h2>Master chain</h2>
          <p className="support-copy">
            Planned finishing chain and export targets for the managed preview.
          </p>
        </div>
      </div>

      <div className="render-master-grid">
        <div className="render-master-card">
          <span>Chain</span>
          <div className="pill-strip">
            {renderPreview.masterChain.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
        </div>
        <div className="render-master-card">
          <span>Targets</span>
          <div className="pill-strip">
            {renderPreview.exportTargets.map((target) => (
              <span key={target}>{target}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
