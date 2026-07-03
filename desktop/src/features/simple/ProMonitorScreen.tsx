import { useState } from "react";
import { useT } from "../../i18n/I18nContext";
import { buildProMonitorMockData, type ProMonitorBookmark } from "./proMonitorMockData";
import { ProMonitorLeftColumn } from "./ProMonitorLeftColumn";
import { ProMonitorRightColumn } from "./ProMonitorRightColumn";
import {
  buildProMonitorScreenViewModel,
  createCustomProMonitorBookmark,
} from "./proMonitorScreenRuntime";

export function ProMonitorScreen() {
  const t = useT();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiveMode] = useState(true);
  const mockData = buildProMonitorMockData(t);
  const [bookmarks, setBookmarks] = useState<ProMonitorBookmark[]>(mockData.bookmarks);
  const viewModel = buildProMonitorScreenViewModel({ t, mockData, bookmarks });
  const sessionModeLabel = t.simpleMode.proMonitor.sessionModeLive.replace(
    "{time}",
    mockData.sessionElapsed,
  );
  const trackMetaLabel = t.simpleMode.proMonitor.trackMeta
    .replace("{track}", mockData.trackTitle)
    .replace("{bpm}", mockData.bpm);
  const warningSpikeSubtitle = t.simpleMode.proMonitor.warningSpikeSubtitle.replace(
    "{time}",
    mockData.alertTimestamp,
  );

  return (
    <div className="pro-monitor-screen">
      <ProMonitorLeftColumn
        sessionModeLabel={sessionModeLabel}
        logKindLabel={t.simpleMode.proMonitor.logKind}
        trackMetaLabel={trackMetaLabel}
        mockData={mockData}
        viewModel={viewModel}
        isPlaying={isPlaying}
        isLiveMode={isLiveMode}
        playLabel={t.simpleMode.proMonitor.play}
        pauseLabel={t.simpleMode.proMonitor.pause}
        skipBackLabel={t.simpleMode.proMonitor.skipBack}
        skipForwardLabel={t.simpleMode.proMonitor.skipForward}
        liveLabel={t.simpleMode.proMonitor.live}
        playbackLabel={t.simpleMode.proMonitor.playback}
        onTogglePlayback={() => setIsPlaying(!isPlaying)}
      />

      <ProMonitorRightColumn
        anomaliesLabel={t.simpleMode.proMonitor.anomalies}
        confidenceLabel={t.simpleMode.proMonitor.confidence}
        pollsLabel={t.simpleMode.proMonitor.polls}
        linesReadLabel={t.simpleMode.proMonitor.linesRead}
        warningSpikeLabel={t.simpleMode.proMonitor.warningSpike}
        warningSpikeSubtitle={warningSpikeSubtitle}
        warningSpikeSoundLabel={t.simpleMode.proMonitor.warningSpikeSound}
        bookmarksLabel={t.simpleMode.proMonitor.bookmarks}
        replayBookmarkLabel={t.simpleMode.proMonitor.replayBookmark}
        addBookmarkLabel={t.simpleMode.proMonitor.addBookmark}
        mockData={mockData}
        viewModel={viewModel}
        onAddBookmark={() => {
          setBookmarks([...bookmarks, createCustomProMonitorBookmark()]);
        }}
      />
    </div>
  );
}
