export interface MonitorLaunchSource {
  id: string;
  title: string;
  sourcePath: string;
  sourceType: "file" | "folder" | "cloud";
  sourceTypeLabel: string;
  startable: boolean;
  origin: "repository" | "connection";
  connectionId?: string;
}
