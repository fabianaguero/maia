# Multi-Source Playlist Connectors — Design Specification

**Date:** June 27, 2026  
**Status:** Design Review  
**Scope:** Add support for connecting Spotify, SoundCloud, and local directory playlists as data sources in Maia Library

---

## 1. Overview

### 1.1 Problem Statement

Currently, Maia only supports importing individual audio files locally. Users cannot connect to streaming platforms (Spotify, SoundCloud) or organize playlists from external sources within Maia's library.

### 1.2 Solution

Create a unified provider abstraction that allows Maia to:
- Connect to Spotify and SoundCloud via OAuth 2.0
- Browse and sync playlists from these platforms
- Add local directory playlists via M3U/JSON format
- Fetch metadata (title, artist, duration, playlist info) without downloading audio
- Manage multiple connections simultaneously

### 1.3 Constraints

- **Read-only, unidirectional sync** — no write-back to Spotify/SoundCloud
- **Metadata only** — no audio downloads (respects streaming licenses)
- **TypeScript/React** — follows existing Maia refactor patterns (Runtime/hooks/ViewModels)
- **Compatible with Phase 2 AI roadmap** — playlists can be analyzed locally after import
- **Local-first** — directional flow is always platform → Maia, not the reverse

---

## 2. Architecture

### 2.1 Module Structure

```
src/providers/
├─ runtime/
│  ├─ types.ts                    # Core interfaces
│  ├─ normalization.ts            # Shared normalization logic
│  ├─ spotify.ts                  # Spotify API client + normalization
│  ├─ soundcloud.ts               # SoundCloud API client + normalization
│  └─ local.ts                    # M3U/JSON file parser
│
├─ hooks/
│  └─ usePlaylistSources.ts       # State management + OAuth orchestration
│
├─ viewmodels/
│  └─ playlistSourcesViewModel.ts # UI presentation logic
│
└─ (api/providers.ts for Tauri invokes)
```

### 2.2 Data Flow

```
Library Screen UI
    ↓
usePlaylistSources hook
    ├─ initiateOAuth(type)  → OAuth flow
    ├─ listPlaylistsForSource(id)
    ├─ syncSource(id)
    └─ disconnectSource(id)
    ↓
runtime/spotify|soundcloud|local.ts
    ├─ API calls / file parsing
    ├─ Normalization → PlaylistMetadata[]
    ↓
SQLite (provider_sources, provider_playlists, provider_tracks)
    ↓
SourcesView (UI component)
```

---

## 3. Types and Interfaces

### 3.1 Provider Configuration

```typescript
// src/providers/runtime/types.ts

export type PlaylistSourceType = "spotify" | "soundcloud" | "local_directory";

export interface PlaylistSourceAuth {
  sourceType: PlaylistSourceType;
  id: string;                    // unique per source (e.g., "spotify-user-123")
  displayName: string;           // e.g., "Spotify (user@example.com)"
  isConnected: boolean;
  lastSyncedAt: string | null;
  oauthToken?: string;           // encrypted in DB; only for Spotify/SoundCloud
  localPath?: string;            // only for local_directory
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Normalized Data

```typescript
export interface PlaylistMetadata {
  id: string;                    // "spotify:playlist-abc" | "soundcloud:user:playlist-name" | "local:hash"
  sourceType: PlaylistSourceType;
  sourceId: string;              // platform-specific ID
  sourceName: string;            // human-readable: "Spotify", "SoundCloud", "My Music"
  name: string;                  // playlist name
  description: string | null;
  trackCount: number;
  imageUrl: string | null;
  isPublic: boolean;
  externalUrl: string | null;
  syncedAt: string;              // ISO 8601
}

export interface RemoteTrackMetadata {
  id: string;                    // "spotify:track-xyz" | "soundcloud:track-xyz" | "local:hash"
  sourceType: PlaylistSourceType;
  title: string;
  artist: string;
  durationSeconds: number;
  isPlayable: boolean;
  externalUrl: string | null;
  syncedAt: string;
}
```

### 3.3 Hook Interface

```typescript
export interface UsePlaylistSourcesReturn {
  sources: PlaylistSourceAuth[];
  playlists: PlaylistMetadata[];          // all synced playlists across sources
  tracks: Map<string, RemoteTrackMetadata[]>;  // playlistId → tracks
  loading: boolean;
  error: ProviderError | null;
  
  // Actions
  initiateOAuth: (sourceType: "spotify" | "soundcloud") => Promise<void>;
  addLocalDirectory: (dirPath: string) => Promise<void>;
  listPlaylistsForSource: (sourceId: string) => Promise<PlaylistMetadata[]>;
  syncSource: (sourceId: string) => Promise<void>;
  disconnectSource: (sourceId: string) => Promise<void>;
}
```

### 3.4 Error Types

```typescript
export type ProviderError = 
  | { kind: "auth_expired"; sourceType: PlaylistSourceType; message: string }
  | { kind: "rate_limited"; retryAfterSeconds: number }
  | { kind: "network_error"; message: string }
  | { kind: "parsing_error"; sourceType: PlaylistSourceType; details: string }
  | { kind: "permission_denied"; sourceType: PlaylistSourceType; message: string }
  | { kind: "not_found"; resourceId: string }
  | { kind: "unknown"; message: string };
```

---

## 4. Implementation Details

### 4.1 OAuth Flow (Spotify & SoundCloud)

**Entry point:** `usePlaylistSources.initiateOAuth(sourceType)`

1. Generate PKCE code verifier + challenge
2. Open OAuth authorization URL in browser (Tauri `window.open()`)
3. User logs in and grants permission
4. Capture authorization code from redirect
5. Exchange code for access token (server-side in Tauri)
6. Encrypt token with `tauri::AES` (or similar)
7. Save to `provider_sources` table
8. Automatically call `listPlaylistsForSource()` to sync

**Token storage:**
- Encrypted at rest in SQLite
- Never exposed to JavaScript
- Refreshed automatically (Spotify refresh tokens)

### 4.2 Local Directory Flow

**Entry point:** `usePlaylistSources.addLocalDirectory(dirPath)`

1. User picks directory via `pickTrackSourceDirectory()` Tauri invoke
2. Create `PlaylistSourceAuth` entry with `sourceType: "local_directory"`, `localPath`
3. Save to `provider_sources` table
4. Call `runtime/local.ts::listLocalPlaylists(dirPath)`
5. Parse all `*.m3u`, `*.m3u8`, `*.json` files in directory
6. Normalize → `PlaylistMetadata[]`
7. Save to `provider_playlists` table

**Supported formats:**
- **M3U/M3U8:** Standard playlist format (extended M3U for metadata)
- **JSON:** Custom format with track URLs and metadata

### 4.3 Runtime Layer (Pure Functions)

Each `runtime/*.ts` module exports pure normalization functions:

```typescript
// runtime/spotify.ts
export async function listSpotifyPlaylists(
  input: PlaylistSourceInput
): Promise<PlaylistMetadata[]>

export async function listTracksInSpotifyPlaylist(
  input: PlaylistSourceInput & { playlistId: string }
): Promise<RemoteTrackMetadata[]>

// runtime/soundcloud.ts
export async function listSoundCloudPlaylists(input: PlaylistSourceInput): Promise<PlaylistMetadata[]>
// ...

// runtime/local.ts
export async function listLocalPlaylists(dirPath: string): Promise<PlaylistMetadata[]>
// ...
```

**Invariants:**
- No side effects (no DB writes, no API state changes)
- Deterministic (same input → same output)
- Testable without mocks (except HTTP calls, which are mocked in tests)

### 4.4 Hook Layer (`usePlaylistSources.ts`)

Manages:
- State: sources, playlists, tracks, loading, error
- OAuth orchestration (open browser, capture code, exchange for token)
- Periodic sync (background refresh of playlists)
- Error recovery (retry logic, auth expiry handling)
- Database persistence

```typescript
export function usePlaylistSources(): UsePlaylistSourcesReturn {
  const [sources, setSources] = useState<PlaylistSourceAuth[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ProviderError | null>(null);
  
  // Load sources from DB on mount
  useEffect(() => {
    (async () => {
      const dbSources = await listProviderSources();
      setSources(dbSources);
      // Auto-sync all
      for (const source of dbSources) {
        await syncSource(source.id);
      }
    })();
  }, []);
  
  // Auth expired? Show reconnect UI
  useEffect(() => {
    if (error?.kind === "auth_expired") {
      notify({ type: "warning", message: `${error.sourceType} needs reconnection` });
    }
  }, [error]);
  
  async function initiateOAuth(sourceType: "spotify" | "soundcloud") {
    // ... OAuth flow
  }
  
  async function syncSource(sourceId: string) {
    // ... call runtime, save to DB
  }
  
  return { sources, playlists, loading, error, initiateOAuth, syncSource, ... };
}
```

### 4.5 ViewModel Layer

```typescript
// src/features/library/viewmodels/playlistSourcesViewModel.ts

export interface SourceCardViewModel {
  id: string;
  displayName: string;
  sourceType: PlaylistSourceType;
  playlistCount: number;
  lastSyncedAt: string;
  isLoading: boolean;
  canDisconnect: boolean;
}

export function buildPlaylistSourcesViewModel(input: {
  sources: PlaylistSourceAuth[];
  playlists: PlaylistMetadata[];
  loading: boolean;
}): SourceCardViewModel[] {
  return input.sources.map((source) => ({
    id: source.id,
    displayName: source.displayName,
    sourceType: source.sourceType,
    playlistCount: input.playlists.filter((p) => p.sourceType === source.sourceType).length,
    lastSyncedAt: source.lastSyncedAt ? formatShortDate(source.lastSyncedAt) : "Never",
    isLoading: input.loading,
    canDisconnect: true,
  }));
}
```

---

## 5. Database Schema

```sql
-- New tables in database/schema.sql

CREATE TABLE provider_sources (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK(source_type IN ('spotify', 'soundcloud', 'local_directory')),
  display_name TEXT NOT NULL,
  is_connected BOOLEAN NOT NULL DEFAULT 1,
  oauth_token TEXT,           -- encrypted; NULL for local_directory
  local_path TEXT,            -- only for local_directory
  last_synced_at TEXT,        -- ISO 8601, nullable
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE provider_playlists (
  id TEXT PRIMARY KEY,
  provider_source_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  track_count INTEGER,
  image_url TEXT,
  is_public BOOLEAN,
  external_url TEXT,
  synced_at TEXT NOT NULL,
  FOREIGN KEY (provider_source_id) REFERENCES provider_sources(id) ON DELETE CASCADE
);

CREATE INDEX idx_provider_playlists_source ON provider_playlists(provider_source_id);

CREATE TABLE provider_tracks (
  id TEXT PRIMARY KEY,
  provider_playlist_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  duration_seconds REAL,
  is_playable BOOLEAN,
  external_url TEXT,
  synced_at TEXT NOT NULL,
  FOREIGN KEY (provider_playlist_id) REFERENCES provider_playlists(id) ON DELETE CASCADE
);

CREATE INDEX idx_provider_tracks_playlist ON provider_tracks(provider_playlist_id);
```

---

## 6. Error Handling Strategy

### 6.1 Error Types and Recovery

| Error Kind | Cause | Recovery |
|-----------|-------|----------|
| `auth_expired` | Token invalid or revoked | Show "Reconnect" button → re-auth |
| `rate_limited` | API rate limit hit | Exponential backoff, retry after N seconds |
| `network_error` | No internet / DNS fail | Automatic retry with exponential backoff |
| `parsing_error` | M3U/JSON malformed | Show file path → user fixes format |
| `permission_denied` | User denied OAuth scopes | Show error message, let user retry |
| `not_found` | Playlist deleted on platform | Remove from cache, notify user |
| `unknown` | Unexpected error | Log + generic error notification |

### 6.2 User Notifications

```typescript
// In usePlaylistSources useEffect
useEffect(() => {
  if (error) {
    const message = formatErrorForUser(error);
    notify({
      type: error.kind === "auth_expired" ? "warning" : "error",
      title: `${error.kind.replace(/_/g, " ")}`,
      message,
    });
  }
}, [error]);
```

---

## 7. Testing Strategy

### 7.1 Unit Tests (Runtime Layer)

**File:** `test/providers/runtime/spotify.test.ts`

```typescript
describe("spotifyRuntime", () => {
  describe("normalizeSpotifyPlaylist", () => {
    it("converts Spotify API response to PlaylistMetadata", () => {
      const spotifyPlaylist = {
        id: "playlist-abc",
        name: "My Playlist",
        description: "Test",
        images: [{ url: "https://..." }],
        tracks: { total: 42 },
        public: true,
        external_urls: { spotify: "https://open.spotify.com/..." },
      };

      const result = normalizeSpotifyPlaylist(spotifyPlaylist);

      expect(result.id).toBe("spotify:playlist-abc");
      expect(result.sourceType).toBe("spotify");
      expect(result.trackCount).toBe(42);
      expect(result.imageUrl).toBe("https://...");
    });
  });

  describe("listSpotifyPlaylists", () => {
    it("calls Spotify API and returns normalized playlists", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          items: [{ id: "p1", name: "Playlist 1", ... }],
        }),
      });

      const result = await listSpotifyPlaylists({
        auth: mockSpotifyAuth,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Playlist 1");
    });
  });
});
```

**Coverage goal:** 100% of pure functions (no branches skipped)

### 7.2 Integration Tests (Hook Layer)

**File:** `test/providers/hooks/usePlaylistSources.test.tsx`

```typescript
describe("usePlaylistSources", () => {
  it("loads sources from DB on mount", async () => {
    vi.mocked(listProviderSources).mockResolvedValueOnce([
      { id: "spotify-123", sourceType: "spotify", ... },
    ]);

    const { result } = renderHook(() => usePlaylistSources());

    await waitFor(() => {
      expect(result.current.sources).toHaveLength(1);
    });
  });

  it("calls sync after source is added", async () => {
    vi.mocked(saveProviderSource).mockResolvedValueOnce({ id: "spotify-123", ... });
    vi.mocked(listSpotifyPlaylists).mockResolvedValueOnce([...]);

    const { result } = renderHook(() => usePlaylistSources());

    await act(async () => {
      await result.current.initiateOAuth("spotify");
    });

    expect(result.current.playlists.length).toBeGreaterThan(0);
  });

  it("sets error state on auth_expired", async () => {
    vi.mocked(listSpotifyPlaylists).mockRejectedValueOnce({
      kind: "auth_expired",
      sourceType: "spotify",
    });

    const { result } = renderHook(() => usePlaylistSources());

    await act(async () => {
      await result.current.syncSource("spotify-123");
    });

    expect(result.current.error?.kind).toBe("auth_expired");
  });
});
```

**Coverage goal:** 80%+ of hook logic (mocks are acceptable for DB/API calls)

### 7.3 Snapshot Tests (ViewModel Layer)

**File:** `test/providers/viewmodels/playlistSourcesViewModel.test.ts`

```typescript
describe("buildPlaylistSourcesViewModel", () => {
  it("renders SourceCardViewModel for each source", () => {
    const viewModel = buildPlaylistSourcesViewModel({
      sources: [mockSpotifySource, mockLocalSource],
      playlists: [mockSpotifyPlaylist],
      loading: false,
    });

    expect(viewModel).toMatchSnapshot();
  });
});
```

---

## 8. Integration with Library Screen

### 8.1 UI Changes

**New tab in LibraryScreen:**
- Tracks (existing)
- Playlists (existing, but now includes remote playlists)
- **Sources** (new)

### 8.2 SourcesView Component

```typescript
// src/features/library/components/SourcesView.tsx

export interface SourcesViewProps {
  sources: PlaylistSourceAuth[];
  playlists: PlaylistMetadata[];
  loading: boolean;
  error: ProviderError | null;
  onAddSource: (type: "spotify" | "soundcloud") => Promise<void>;
  onAddLocalDirectory: (path: string) => Promise<void>;
  onDisconnect: (sourceId: string) => Promise<void>;
  onSyncNow: (sourceId: string) => Promise<void>;
}

export function SourcesView(props: SourcesViewProps) {
  return (
    <div className="sources-view">
      {/* Connected sources */}
      <div className="connected-sources">
        {props.sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            playlistCount={props.playlists.filter((p) => p.sourceType === source.sourceType).length}
            onDisconnect={() => props.onDisconnect(source.id)}
            onSyncNow={() => props.onSyncNow(source.id)}
          />
        ))}
      </div>

      {/* Add source buttons */}
      <div className="add-source-buttons">
        <button onClick={() => props.onAddSource("spotify")}>+ Connect Spotify</button>
        <button onClick={() => props.onAddSource("soundcloud")}>+ Connect SoundCloud</button>
        <button onClick={() => props.onAddLocalDirectory()}>+ Add Local Directory</button>
      </div>

      {/* Error state */}
      {props.error && (
        <ErrorBanner error={props.error} />
      )}
    </div>
  );
}
```

---

## 9. Migration Path (Phase 2+)

### 9.1 Future: Move OAuth to Rust (Optional)

Once main.rs is refactored into modules:
- Move OAuth logic to `src-tauri/src/providers/oauth.rs`
- Keep TypeScript as consumer via Tauri invokes
- Improves security (tokens never touch JavaScript)

### 9.2 Future: Playlist Import Flow

After connectors are stable:
- Add UI to "import playlist from Spotify → Maia local library"
- Creates local tracks from remote playlist
- Triggers analyzer for Phase 2 AI analysis

---

## 10. Success Criteria

- [x] User can connect Spotify account via OAuth
- [x] User can connect SoundCloud account via OAuth
- [x] User can add local M3U/JSON playlists
- [x] All playlists appear in Library with metadata
- [x] Sync is automatic on startup and on-demand
- [x] Errors are recoverable (auth expiry, network issues)
- [x] No audio is downloaded (metadata only)
- [x] 100% test coverage on `runtime/*`
- [x] 80%+ test coverage on `usePlaylistSources`
- [x] Design follows Maia patterns (Runtime/hooks/ViewModels)

---

## 11. Out of Scope (Phase 2+)

- Audio preview from streaming platforms
- Bidirectional sync (Maia → Spotify)
- Collaborative playlists
- Playlist recommendations
- Integration with Phase 2 AI (comes after Phase 1 MVP)

---

**Approved by:** [user review pending]  
**Last updated:** 2026-06-27
