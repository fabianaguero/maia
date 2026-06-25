import type { CompositionResultRecord } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";
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
  const t = useT();
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
          <h2>{t.compose.renderPreviewTitle}</h2>
          <p className="support-copy">{t.compose.renderPreviewCopy}</p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>{t.compose.mode}</span>
          <strong>{renderPreview.mode}</strong>
        </div>
        <div>
          <span>{t.compose.headroom}</span>
          <strong>{renderPreview.headroomDb.toFixed(1)} dB</strong>
        </div>
        <div>
          <span>{t.compose.stems}</span>
          <strong>{renderPreview.stems.length}</strong>
        </div>
        <div>
          <span>{t.compose.previewFile}</span>
          <strong>{previewAudioFormat.toUpperCase()}</strong>
        </div>
        <div>
          <span>{t.compose.automation}</span>
          <strong>{renderPreview.automation.length}</strong>
        </div>
        <div>
          <span>{t.compose.sampleRate}</span>
          <strong>{previewSampleRate ? `${previewSampleRate} Hz` : t.inspect.pending}</strong>
        </div>
        <div>
          <span>{t.compose.channels}</span>
          <strong>{previewChannels ? `${previewChannels}` : t.inspect.pending}</strong>
        </div>
      </div>

      <div className="render-master-card top-spaced">
        <span>{t.compose.previewAudioPath}</span>
        <strong>{previewAudioPath ?? t.compose.previewAudioMissing}</strong>
      </div>

      <ManagedAudioPlayer
        title={t.compose.previewPlaybackTitle}
        description={t.compose.previewPlaybackDescription}
        audioPath={previewAudioPath}
        durationSeconds={previewDurationSeconds}
        playLabel={t.compose.playPreview}
        pauseLabel={t.compose.pausePreview}
        missingNote={t.compose.previewMissingNote}
        browserFallbackNote={t.compose.previewBrowserFallbackNote}
        desktopOnlyNote={t.compose.previewDesktopOnlyNote}
        availableNote={t.compose.previewAvailableNote}
        errorNote={t.compose.previewErrorNote}
        onTimeUpdate={onTimeUpdate}
      />

      <div className="panel-header compact top-spaced">
        <div>
          <h2>{t.compose.stemLayout}</h2>
          <p className="support-copy">{t.compose.stemLayoutCopy}</p>
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
                {t.compose.gainPan
                  .replace("{gain}", stem.gainDb.toFixed(1))
                  .replace("{pan}", formatPan(stem.pan))}
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
          <h2>{t.compose.automationTitle}</h2>
          <p className="support-copy">{t.compose.automationCopy}</p>
        </div>
      </div>

      <ul className="stack-list">
        {renderPreview.automation.map((move) => (
          <li key={move.id}>
            <strong>{move.target}</strong>
            <small>
              {move.move} ·{" "}
              {t.compose.barsLabel
                .replace("{start}", String(move.startBar))
                .replace("{end}", String(move.endBar))}
            </small>
          </li>
        ))}
      </ul>

      <div className="panel-header compact top-spaced">
        <div>
          <h2>{t.compose.masterChain}</h2>
          <p className="support-copy">{t.compose.masterChainCopy}</p>
        </div>
      </div>

      <div className="render-master-grid">
        <div className="render-master-card">
          <span>{t.compose.chain}</span>
          <div className="pill-strip">
            {renderPreview.masterChain.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
        </div>
        <div className="render-master-card">
          <span>{t.compose.targets}</span>
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
