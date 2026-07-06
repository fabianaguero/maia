export function formatActiveMonitorDeckTime(seconds: number | null): string {
  if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds < 0) {
    return "--:--";
  }

  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
