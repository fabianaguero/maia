interface PlaylistSummaryItem {
  id: string;
  title: string;
  lostTitle: string | null;
}

interface LiveLogMonitorPlaylistSummaryProps {
  label: string;
  title: string;
  nowPlayingLine: string | null;
  upNextLine: string | null;
  profileDescription: string;
  items: PlaylistSummaryItem[];
  lostLabel: string;
}

export function LiveLogMonitorPlaylistSummary({
  label,
  title,
  nowPlayingLine,
  upNextLine,
  profileDescription,
  items,
  lostLabel,
}: LiveLogMonitorPlaylistSummaryProps) {
  return (
    <>
      <div className="audio-path-card top-spaced">
        <span>{label}</span>
        <strong>{title}</strong>
        {nowPlayingLine ? <small>{nowPlayingLine}</small> : null}
        {upNextLine ? <small>{upNextLine}</small> : null}
        <p className="support-copy top-spaced">{profileDescription}</p>
      </div>

      <p className="support-copy top-spaced">{label}</p>
      <div className="pill-strip">
        {items.map((item) => (
          <span key={item.id}>
            {item.title}
            {item.lostTitle ? (
              <span className="track-lost-badge" title={item.lostTitle}>
                {lostLabel}
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </>
  );
}
