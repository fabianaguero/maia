export interface LiveLogCue {
  id: string;
  eventIndex: number;
  level: string;
  component: string;
  excerpt: string;
  noteHz: number;
  durationMs: number;
  gain: number;
  waveform: OscillatorType;
  accent: string;
}

export interface LiveLogMarker {
  eventIndex: number;
  level: string;
  component: string;
  excerpt: string;
}

export interface LiveLogComponentCount {
  component: string;
  count: number;
}

export interface LiveLogStreamUpdate {
  sourcePath: string;
  fromOffset: number;
  toOffset: number;
  replayWindowIndex?: number | null;
  hasData: boolean;
  summary: string;
  suggestedBpm: number | null;
  confidence: number;
  dominantLevel: string;
  lineCount: number;
  anomalyCount: number;
  levelCounts: Record<string, number>;
  anomalyMarkers: LiveLogMarker[];
  topComponents: LiveLogComponentCount[];
  sonificationCues: LiveLogCue[];
  parsedLines: string[];
  warnings: string[];
}

export type LogSourceConnectionKind = "file_log" | "gcp_cloud_run" | "sonarqube";

export interface LogSourceConnection {
  id: string;
  kind: LogSourceConnectionKind;
  label: string;
  sourceUri: string;
  enabled: boolean;
  adapterKind: "file" | "process";
  config: Record<string, unknown>;
  lastCursor: number;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertLogSourceConnectionInput {
  id?: string;
  kind: LogSourceConnectionKind;
  label: string;
  sourceUri?: string;
  enabled?: boolean;
  config: Record<string, unknown>;
}

export interface StartLogSourceConnectionInput {
  connectionId: string;
  sessionId: string;
  startFromBeginning?: boolean;
}

export type StreamAdapterKind =
  | "file"
  | "process"
  | "websocket"
  | "http-poll"
  | "journald"
  | "sonarqube";

export interface StreamSessionRecord {
  sessionId: string;
  adapterKind: StreamAdapterKind;
  source: string;
  label: string | null;
  createdAt: string;
  lastPolledAt: string | null;
  totalPolls: number;
  fileCursor: number | null;
}

export interface StartSessionInput {
  sessionId: string;
  adapterKind: StreamAdapterKind;
  source: string;
  label?: string;
  trackId?: string;
  trackTitle?: string;
  command?: string[];
  startFromBeginning?: boolean;
  wsUrl?: string;
  httpUrl?: string;
  sourceTemplateId?: string;
}

export interface StreamSessionPollResult {
  session: StreamSessionRecord;
  hasData: boolean;
  summary: string;
  suggestedBpm: number | null;
  confidence: number;
  dominantLevel: string;
  lineCount: number;
  anomalyCount: number;
  levelCounts: Record<string, number>;
  anomalyMarkers: LiveLogMarker[];
  topComponents: LiveLogComponentCount[];
  sonificationCues: LiveLogCue[];
  parsedLines: string[];
  warnings: string[];
}
