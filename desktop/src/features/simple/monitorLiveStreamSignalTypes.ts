export interface MonitorLogSignalPoint {
  val: number;
  heat: number;
}

export function createMonitorSignalBuffer(
  length = 120,
  seed: MonitorLogSignalPoint = { val: 10, heat: 0 },
): MonitorLogSignalPoint[] {
  return Array.from({ length }, () => ({ ...seed }));
}
