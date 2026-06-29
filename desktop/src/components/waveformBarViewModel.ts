export interface MiniBarStyle {
  height: string;
  animationDelay: string;
  opacity?: number;
  filter?: string;
}

export function buildLogChannelBars(
  length: number,
  isActive: boolean,
  random = Math.random,
): MiniBarStyle[] {
  return Array.from({ length }).map((_, index) => ({
    height: `${isActive ? 20 + random() * 50 : 10}%`,
    animationDelay: `${index * 0.05}s`,
    opacity: isActive ? 0.8 + random() * 0.2 : 0.4,
  }));
}

export function buildAlertChannelBars(
  length: number,
  isActive: boolean,
  anomalies: number,
  random = Math.random,
): MiniBarStyle[] {
  const intensity = anomalies > 0 ? Math.min(100, 30 + anomalies * 8) : 10;
  return Array.from({ length }).map((_, index) => {
    const jitter = isActive ? random() * 20 * (anomalies > 0 ? 1.5 : 0.5) : 0;
    return {
      height: `${intensity + jitter}%`,
      animationDelay: `${index * 0.05}s`,
      filter: anomalies > 0 ? `brightness(${1 + anomalies * 0.1})` : "none",
    };
  });
}
