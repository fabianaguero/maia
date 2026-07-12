import type { StreamAdapterKind } from "./monitor";

export interface MonitorLaunchSource {
  id: string;
  title: string;
  sourcePath: string;
  sourceType: "file" | "folder" | "cloud" | "code";
  sourceTypeLabel: string;
  startable: boolean;
  origin: "repository" | "connection" | "codeProject";
  connectionId?: string;
  adapterKind?: StreamAdapterKind;
  connectionConfig?: Record<string, unknown>;
}
