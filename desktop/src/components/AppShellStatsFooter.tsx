export interface AppShellStatsFooterProps {
  tracksTitle: string;
  tracksShort: string;
  trackCount: number;
  logsTitle: string;
  logsShort: string;
  repositoryCount: number;
  profilesTitle: string;
  profilesShort: string;
  baseAssetCount: number;
}

export function AppShellStatsFooter({
  tracksTitle,
  tracksShort,
  trackCount,
  logsTitle,
  logsShort,
  repositoryCount,
  profilesTitle,
  profilesShort,
  baseAssetCount,
}: AppShellStatsFooterProps) {
  return (
    <div className="sidebar-stats">
      <div className="stat-item">
        <span className="stat-label" title={tracksTitle}>
          {tracksShort}
        </span>
        <span className="stat-value">{trackCount}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label" title={logsTitle}>
          {logsShort}
        </span>
        <span className="stat-value">{repositoryCount}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label" title={profilesTitle}>
          {profilesShort}
        </span>
        <span className="stat-value">{baseAssetCount}</span>
      </div>
    </div>
  );
}
