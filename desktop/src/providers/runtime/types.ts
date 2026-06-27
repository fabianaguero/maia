export type PlaylistSourceType = "spotify" | "soundcloud" | "local_directory";

export interface PlaylistSourceAuth {
  sourceType: PlaylistSourceType;
  id: string;
  displayName: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
  oauthToken?: string;
  localPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistMetadata {
  id: string;
  sourceType: PlaylistSourceType;
  sourceId: string;
  sourceName: string;
  name: string;
  description: string | null;
  trackCount: number;
  imageUrl: string | null;
  isPublic: boolean;
  externalUrl: string | null;
  syncedAt: string;
}

export interface RemoteTrackMetadata {
  id: string;
  sourceType: PlaylistSourceType;
  title: string;
  artist: string;
  durationSeconds: number;
  isPlayable: boolean;
  externalUrl: string | null;
  syncedAt: string;
}

export interface PlaylistSourceInput {
  auth: PlaylistSourceAuth;
  onProgress?: (message: string) => void;
  signal?: AbortSignal;
}

export type ProviderError =
  | { kind: "auth_expired"; sourceType: PlaylistSourceType; message: string }
  | { kind: "rate_limited"; retryAfterSeconds: number }
  | { kind: "network_error"; message: string }
  | { kind: "parsing_error"; sourceType: PlaylistSourceType; details: string }
  | { kind: "permission_denied"; sourceType: PlaylistSourceType; message: string }
  | { kind: "not_found"; resourceId: string }
  | { kind: "unknown"; message: string };

export function isProviderError(error: unknown): error is ProviderError {
  if (!error || typeof error !== "object") return false;
  const e = error as Record<string, unknown>;
  return typeof e.kind === "string";
}

export function formatProviderErrorForUser(error: ProviderError): string {
  switch (error.kind) {
    case "auth_expired":
      return `${error.sourceType} authorization expired. Please reconnect.`;
    case "rate_limited":
      return `Rate limited. Try again in ${error.retryAfterSeconds} seconds.`;
    case "network_error":
      return `Network error: ${error.message}`;
    case "parsing_error":
      return `Error parsing ${error.sourceType} data: ${error.details}`;
    case "permission_denied":
      return `Permission denied by ${error.sourceType}.`;
    case "not_found":
      return `Resource not found: ${error.resourceId}`;
    case "unknown":
      return `Error: ${error.message}`;
  }
}
