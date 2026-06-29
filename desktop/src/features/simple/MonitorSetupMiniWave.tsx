interface MonitorSetupMiniWaveProps {
  color?: string;
  count?: number;
  active?: boolean;
  seed?: string;
}

function resolveMiniWaveHeights(seed: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  let t = Math.abs(hash);
  return Array.from({ length: count }).map(() => {
    t = (t * 1664525 + 1013904223) >>> 0;
    return (t % 70) + 15;
  });
}

export function MonitorSetupMiniWave({
  color = "var(--color-accent)",
  count = 20,
  active = true,
  seed = "maia",
}: MonitorSetupMiniWaveProps) {
  const heights = resolveMiniWaveHeights(seed, count);

  return (
    <div className={`visual-wave-static ${active ? "active" : ""}`}>
      {heights.map((height, index) => (
        <div
          key={index}
          className="wave-bar-static"
          style={{
            backgroundColor: active ? color : "var(--text-muted)",
            height: `${height}%`,
            opacity: active ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
