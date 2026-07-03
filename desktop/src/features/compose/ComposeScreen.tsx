import { useState } from "react";
import { useT } from "../../i18n/I18nContext";
import { useMonitor } from "../monitor/MonitorContext";
import { ComposeCreationPanel } from "./ComposeCreationPanel";
import { ComposeDetailPanel } from "./ComposeDetailPanel";
import { ComposeScreenHeader } from "./ComposeScreenHeader";
import { buildComposeScreenViewModel, type ComposeTab } from "./composeScreenRuntime";
import {
  buildComposeScreenSummaryState,
  buildComposeScreenViewModelInput,
  type ComposeScreenProps,
} from "./composeScreenHookRuntime";

export function ComposeScreen({
  composition,
  compositions,
  baseAssets,
  tracks,
  playlists,
  repositories,
  analyzerLabel,
  busy,
  onImportComposition,
  onSelectComposition,
  onGoLibrary,
}: ComposeScreenProps) {
  const t = useT();
  const monitor = useMonitor();
  const [tab, setTab] = useState<ComposeTab>("preview");
  const [currentTime, setCurrentTime] = useState(0);
  const viewModel = buildComposeScreenViewModel(
    buildComposeScreenViewModelInput({
      t,
      tab,
      composition,
      compositions,
      baseAssets,
      tracks,
      playlists,
    }),
  );
  const summaryState = buildComposeScreenSummaryState({
    composition,
    viewModel,
  });

  return (
    <section className="screen">
      <ComposeScreenHeader t={t} viewModel={viewModel} summaryState={summaryState} />

      <div className="compose-layout">
        <ComposeCreationPanel
          t={t}
          canCompose={viewModel.canCompose}
          busy={busy}
          baseAssets={baseAssets}
          tracks={tracks}
          playlists={playlists}
          repositories={repositories}
          onImportComposition={onImportComposition}
          onGoLibrary={onGoLibrary}
        />

        <ComposeDetailPanel
          t={t}
          composition={composition}
          compositions={compositions}
          viewModel={viewModel}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          tab={tab}
          setTab={setTab}
          analyzerLabel={analyzerLabel}
          onSelectComposition={onSelectComposition}
          onSeek={monitor.seekGuideTrack}
          analysisProgress={monitor.playbackProgress ?? 0}
        />
      </div>
    </section>
  );
}
