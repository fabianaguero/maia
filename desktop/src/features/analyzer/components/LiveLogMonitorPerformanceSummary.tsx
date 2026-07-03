import { LiveLogMonitorArrangementLanes } from "./LiveLogMonitorArrangementLanes";
import { LiveLogMonitorNotesList } from "./LiveLogMonitorNotesList";
import { LiveLogMonitorRecentCues } from "./LiveLogMonitorRecentCues";
import { LiveLogMonitorRecentMarkers } from "./LiveLogMonitorRecentMarkers";
import type { LiveLogMonitorPerformanceSummaryProps } from "./liveLogMonitorPerformanceSummaryTypes";

export function LiveLogMonitorPerformanceSummary({
  recentVoices,
  recentCues,
  recentMarkers,
  recentWarnings,
  error,
  sequencerPanel,
  labels,
}: LiveLogMonitorPerformanceSummaryProps) {
  return (
    <>
      <div className="panel-header compact top-spaced">
        <div>
          <h2>{labels.arrangementLayers}</h2>
          <p className="support-copy">{labels.arrangementLayersCopy}</p>
        </div>
      </div>
      <LiveLogMonitorArrangementLanes recentVoices={recentVoices} labels={labels} />

      <div className="panel-header compact top-spaced">
        <div>
          <h2>{labels.padSequencerTitle}</h2>
          <p className="support-copy">{labels.padSequencerCopy}</p>
        </div>
      </div>

      {sequencerPanel}

      <div className="panel-header compact top-spaced">
        <div>
          <h2>{labels.recentCuesTitle}</h2>
          <p className="support-copy">{labels.recentCuesCopy}</p>
        </div>
      </div>
      <LiveLogMonitorRecentCues recentCues={recentCues} labels={labels} />

      <div className="panel-header compact top-spaced">
        <div>
          <h2>{labels.recentAnomalyMarkersTitle}</h2>
          <p className="support-copy">{labels.recentAnomalyMarkersCopy}</p>
        </div>
      </div>
      <LiveLogMonitorRecentMarkers recentMarkers={recentMarkers} labels={labels} />
      <LiveLogMonitorNotesList recentWarnings={recentWarnings} error={error} labels={labels} />
    </>
  );
}
