import type { ProMonitorScreenViewModel } from "./proMonitorScreenRuntime";
import type { ProMonitorMockData } from "./proMonitorMockData";
import { ProMonitorPlaybackControls } from "./ProMonitorPlaybackControls";

interface ProMonitorLeftColumnProps {
  sessionModeLabel: string;
  logKindLabel: string;
  trackMetaLabel: string;
  mockData: ProMonitorMockData;
  viewModel: ProMonitorScreenViewModel;
  isPlaying: boolean;
  isLiveMode: boolean;
  playLabel: string;
  pauseLabel: string;
  skipBackLabel: string;
  skipForwardLabel: string;
  liveLabel: string;
  playbackLabel: string;
  onTogglePlayback: () => void;
}

export function ProMonitorLeftColumn({
  sessionModeLabel,
  logKindLabel,
  trackMetaLabel,
  mockData,
  viewModel,
  isPlaying,
  isLiveMode,
  playLabel,
  pauseLabel,
  skipBackLabel,
  skipForwardLabel,
  liveLabel,
  playbackLabel,
  onTogglePlayback,
}: ProMonitorLeftColumnProps) {
  return (
    <div className="monitor-left-column">
      <div className="session-header">
        <div className="session-title-group">
          <h1 className="session-title">{mockData.sessionTitle}</h1>
          <span className="session-mode-badge">{sessionModeLabel}</span>
        </div>
        <div className="session-meta">
          <span className="meta-kind">{logKindLabel}</span>
          <span className="meta-sound">
            <span className="music-icon">♪</span>
            {trackMetaLabel}
          </span>
        </div>
      </div>

      <div className="log-stream">
        {viewModel.logLines.map((line, idx) => (
          <div key={idx} className="log-line">
            <span className="log-timestamp">{line.timestamp}</span>
            <span className={`level-badge ${line.levelBadgeClassName}`}>{line.levelLabel}</span>
            <span className="log-service">{line.service}</span>
            <span className="log-message">{line.message}</span>
          </div>
        ))}
      </div>

      <ProMonitorPlaybackControls
        isPlaying={isPlaying}
        isLiveMode={isLiveMode}
        playLabel={playLabel}
        pauseLabel={pauseLabel}
        skipBackLabel={skipBackLabel}
        skipForwardLabel={skipForwardLabel}
        liveLabel={liveLabel}
        playbackLabel={playbackLabel}
        onTogglePlayback={onTogglePlayback}
      />
    </div>
  );
}
