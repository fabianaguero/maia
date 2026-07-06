import type { LogSourceConnection } from "../../types/monitor";

export function normalizePersistentLogSourceConnections(input: unknown): LogSourceConnection[] {
  return Array.isArray(input) ? input : [];
}
