import { AlertCircle, Plus } from "lucide-react";

import type { ProMonitorScreenViewModel } from "./proMonitorScreenRuntime";
import type { ProMonitorMockData } from "./proMonitorMockData";

interface ProMonitorRightColumnProps {
  anomaliesLabel: string;
  confidenceLabel: string;
  pollsLabel: string;
  linesReadLabel: string;
  warningSpikeLabel: string;
  warningSpikeSubtitle: string;
  warningSpikeSoundLabel: string;
  bookmarksLabel: string;
  replayBookmarkLabel: string;
  addBookmarkLabel: string;
  mockData: ProMonitorMockData;
  viewModel: ProMonitorScreenViewModel;
  onAddBookmark: () => void;
}

export function ProMonitorRightColumn({
  anomaliesLabel,
  confidenceLabel,
  pollsLabel,
  linesReadLabel,
  warningSpikeLabel,
  warningSpikeSubtitle,
  warningSpikeSoundLabel,
  bookmarksLabel,
  replayBookmarkLabel,
  addBookmarkLabel,
  mockData,
  viewModel,
  onAddBookmark,
}: ProMonitorRightColumnProps) {
  return (
    <div className="monitor-right-column">
      <div className="metrics-panel">
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">{anomaliesLabel}</span>
            <span className="metric-value red">{mockData.metrics.anomalies}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">{confidenceLabel}</span>
            <span className="metric-value teal">{mockData.metrics.confidence}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">{pollsLabel}</span>
            <span className="metric-value muted">{mockData.metrics.polls}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">{linesReadLabel}</span>
            <span className="metric-value muted">{mockData.metrics.linesRead}</span>
          </div>
        </div>
      </div>

      <div className="alert-state">
        <div className="alert-icon">
          <AlertCircle size={24} className="orange" />
        </div>
        <div className="alert-info">
          <h3 className="alert-title">{warningSpikeLabel}</h3>
          <p className="alert-subtitle">{warningSpikeSubtitle}</p>
          <p className="alert-sound">{warningSpikeSoundLabel}</p>
        </div>
      </div>

      <div className="bookmarks-panel">
        <div className="bookmarks-header">
          <h3 className="bookmarks-title">{bookmarksLabel}</h3>
          <span className="bookmark-count">{viewModel.bookmarks.length}</span>
        </div>
        <div className="bookmarks-list">
          {viewModel.bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bookmark-row">
              <span className="bookmark-time">{bookmark.timestamp}</span>
              <span className="bookmark-tag">{bookmark.tagLabel}</span>
              <button
                type="button"
                className="btn-ghost btn-small"
                title={replayBookmarkLabel}
                aria-label={replayBookmarkLabel}
              >
                {replayBookmarkLabel}
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-add-bookmark" onClick={onAddBookmark}>
          <Plus size={14} />
          {addBookmarkLabel}
        </button>
      </div>
    </div>
  );
}
