import type { Dispatch, SetStateAction } from "react";

import type { AppTranslations } from "../../i18n/types";
import type { CompositionResultRecord } from "../../types/library";
import { BpmCurvePanel } from "../analyzer/components/BpmCurvePanel";
import { CompositionMetricsPanel } from "../analyzer/components/CompositionMetricsPanel";
import { CompositionOverviewPanel } from "../analyzer/components/CompositionOverviewPanel";
import { CompositionRenderPreviewPanel } from "../analyzer/components/CompositionRenderPreviewPanel";
import { CompositionTimelinePanel } from "../analyzer/components/CompositionTimelinePanel";
import { ExportCompositionPanel } from "../analyzer/components/ExportCompositionPanel";
import { WaveformPlaceholder } from "../analyzer/components/WaveformPlaceholder";
import {
  buildComposeScreenBpmCurveInput,
  buildComposeScreenPickerInput,
  buildComposeScreenRenderPreviewInput,
  buildComposeScreenTabButtonState,
  buildComposeScreenWaveformInput,
} from "./composeScreenHookRuntime";
import type { ComposeTab, ComposeScreenViewModel } from "./composeScreenRuntime";

interface ComposeDetailPanelProps {
  t: AppTranslations;
  composition: CompositionResultRecord | null;
  compositions: CompositionResultRecord[];
  viewModel: ComposeScreenViewModel;
  currentTime: number;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  tab: ComposeTab;
  setTab: Dispatch<SetStateAction<ComposeTab>>;
  analyzerLabel: string;
  onSelectComposition: (compositionId: string) => void;
  onSeek: (seconds: number) => void;
  analysisProgress: number;
}

export function ComposeDetailPanel({
  t,
  composition,
  compositions,
  viewModel,
  currentTime,
  setCurrentTime,
  tab,
  setTab,
  analyzerLabel,
  onSelectComposition,
  onSeek,
  analysisProgress,
}: ComposeDetailPanelProps) {
  const pickerInput = buildComposeScreenPickerInput({
    composition,
    compositionOptions: viewModel.compositionOptions,
    onSelectComposition,
  });
  const tabButtonState = buildComposeScreenTabButtonState({
    tabOptions: viewModel.tabOptions,
    setTab,
  });

  return (
    <div className="compose-detail-panel">
      {compositions.length > 0 && (
        <div className="compose-picker-bar">
          <select
            value={pickerInput.composition?.id ?? ""}
            onChange={(e) => pickerInput.onSelectComposition(e.target.value)}
            className="context-select"
          >
            {pickerInput.compositionOptions.map((compositionOption) => (
              <option key={compositionOption.id} value={compositionOption.id}>
                {compositionOption.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {!composition ? (
        <section className="panel empty-state">
          <p>{t.compose.createToPreview}</p>
        </section>
      ) : (
        <>
          {tab === "preview" && (
            <div className="analyzer-deck">
              <WaveformPlaceholder
                {...buildComposeScreenWaveformInput({
                  composition,
                  currentTime,
                  onSeek,
                  analysisProgress,
                })}
              />
            </div>
          )}

          <div className="composition-tabs">
            {tabButtonState.tabOptions.map((tabOption) => (
              <button
                key={tabOption.id}
                type="button"
                className={`composition-tab${tabOption.isActive ? " active" : ""}`}
                onClick={() => tabButtonState.setTab(tabOption.id)}
              >
                {tabOption.label}
              </button>
            ))}
          </div>

          <div className="analyzer-layout">
            <div className="analyzer-main-stack">
              {tab === "preview" && (
                <BpmCurvePanel {...buildComposeScreenBpmCurveInput({ composition })} />
              )}
              {tab === "structure" && (
                <>
                  <CompositionTimelinePanel composition={composition} />
                  <CompositionOverviewPanel composition={composition} />
                </>
              )}
              {tab === "render" && (
                <CompositionRenderPreviewPanel
                  {...buildComposeScreenRenderPreviewInput({
                    composition,
                    onTimeUpdate: setCurrentTime,
                  })}
                />
              )}
              {tab === "export" && <ExportCompositionPanel composition={composition} />}
            </div>

            <div className="analyzer-sidebar">
              <CompositionMetricsPanel composition={composition} analyzerLabel={analyzerLabel} />
              <section className="panel metric-panel">
                <details className="panel-collapsible">
                  <summary className="panel-collapsible-summary">{t.compose.notesMetadata}</summary>
                  <div className="panel-collapsible-body">
                    {composition.notes.length > 0 && (
                      <ul className="stack-list note-list">
                        {composition.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    )}
                    <dl className="meta-list compact-meta">
                      <div>
                        <dt>{t.compose.baseAsset}</dt>
                        <dd>{composition.baseAssetTitle}</dd>
                      </div>
                      {composition.basePlaylistName ? (
                        <div>
                          <dt>{t.compose.basePlaylist}</dt>
                          <dd>{composition.basePlaylistName}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt>{t.compose.timingSource}</dt>
                        <dd>{composition.referenceSourcePath ?? composition.referenceTitle}</dd>
                      </div>
                      <div>
                        <dt>{t.compose.strategy}</dt>
                        <dd>{composition.strategy}</dd>
                      </div>
                      <div>
                        <dt>{t.compose.planPath}</dt>
                        <dd>{composition.exportPath ?? t.inspect.pending}</dd>
                      </div>
                    </dl>
                  </div>
                </details>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
