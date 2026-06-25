# Open Source Maintainer Guide

This document is for contributors who need to understand the real runtime boundaries of Maia before changing code.
It is intentionally more operational than `docs/architecture.md` and more current-code-oriented than `docs/sdd.md`.

## What Maia is

Maia is a local-first desktop application for auditory monitoring.
It lets an operator choose a real track or playlist as the musical bed, then turns repositories, logs, and live streams into audible mutations plus DJ-style monitoring visuals.

The system is built from three active runtime layers:

1. `TypeScript / React` for UI state, monitor UX, and Web Audio playback.
2. `Rust / Tauri` for native commands, SQLite persistence, file/system access, managed local snapshots, and transient stream sessions.
3. `Python` for deterministic analysis of tracks, repositories, log files, and live log chunks over a JSON contract.

## Source of truth

Use these paths first:

- `desktop/`: active desktop product surface
- `desktop/src-tauri/src/main.rs`: native backend, persistence, analyzer bridge, transient session runtime
- `analyzer/src/maia_analyzer/`: active Python analyzer
- `contracts/`: request/response schemas shared across runtimes
- `database/schema.sql`: persistent storage model
- `docs/architecture.md`: product-level architecture narrative
- `docs/sdd.md`: lightweight functional spec and roadmap history

Non-product path:

- `site/`: landing page only, not part of the desktop runtime

## Codebase map

### Frontend (`desktop/src`)

The frontend is the operator-facing control surface.
It owns screen composition, state wiring, Tauri API wrappers, browser fallback mocks, and Web Audio playback/mutation.

Important files:

- `main.tsx`: current desktop entrypoint
- `App-v0.tsx`: current mounted app shell
- `App.tsx`: alternate app shell under development, not the mounted entrypoint today
- `features/monitor/MonitorContext.tsx`: app-level monitor runtime context, replay control, guide-track engine, stream subscription hub
- `features/simple/`: current monitor-focused UI surface and extracted support modules
- `api/*.ts`: typed wrappers around Tauri commands, with browser/mock fallbacks where applicable
- `hooks/*.ts`: library/repository/base-asset/composition/session state loaders and mutators
- `contracts.ts`: TypeScript-side JSON contract helpers and request builders

### Native backend (`desktop/src-tauri/src/main.rs`)

The Rust layer is the native boundary.
It owns:

- Tauri commands
- SQLite access
- asset snapshotting into managed local storage
- file pickers and filesystem checks
- transient `SessionRegistry` for stream monitoring
- process and `journald` follow loops
- invoking the Python analyzer with JSON

The file is currently a large monolith.
For maintainers, that means the backend is centralized but not yet modularized by concern.

### Analyzer (`analyzer/src/maia_analyzer`)

The Python layer owns deterministic analysis.
It should be understood as a pure analysis engine behind a JSON contract, not as the source of truth for desktop state or persistence.

Important files:

- `cli.py`: command-line entrypoint
- `service.py`: request dispatcher and action router
- `audio.py`: track decoding and waveform/BPM/beat-grid extraction
- `repository.py`: repository/log analysis and live log chunk summarization
- `dsp.py`: DSP helpers used when higher-fidelity analysis is available
- `contracts.py`: analyzer-side contract validation

## Actual startup path

The current desktop app boots like this:

1. `desktop/src/main.tsx` mounts `MonitorProvider`.
2. `main.tsx` currently renders `App-v0`, not `App.tsx`.
3. `App-v0.tsx` loads domain hooks such as `useLibrary`, `useRepositories`, `useBaseAssets`, `useCompositionResults`, and `useSessions`.
4. Those hooks call typed API wrappers under `desktop/src/api/`.
5. The API wrappers call Tauri commands through `invokeOrFallback(...)`.
6. In browser-only mode, many wrappers fall back to mock data so the shell can still render.

This distinction matters:

- `App-v0.tsx` is the live shell contributors should treat as active.
- `App.tsx` is real code, but it is not the mounted entrypoint from `main.tsx` today.

## Runtime boundaries

### 1. TypeScript -> Rust boundary

The main frontend/native boundary is the Tauri command layer.

Examples:

- `list_tracks` / `import_track`
- `list_repositories` / `import_repository`
- `start_stream_session` / `poll_stream_session` / `ingest_stream_chunk`
- `read_audio_bytes`

Why this boundary exists:

- React should not own direct filesystem logic.
- React should not own SQLite access.
- React should not spawn OS-level adapters directly.

### 2. Rust -> Python boundary

Rust sends JSON requests to the analyzer and expects JSON responses back.
That contract is versioned through `contracts/` and mirrored in `desktop/src/contracts.ts` and `analyzer/src/maia_analyzer/contracts.py`.

This is one of the cleanest architectural decisions in the codebase:

- Rust handles native concerns.
- Python handles analysis logic.
- the contract is explicit instead of implicit

### 3. Persistent vs transient state

Persistent state lives in SQLite plus managed local asset storage.
Transient monitoring state lives in the Rust `SessionRegistry` and in React monitor state.

Persistent examples:

- tracks
- playlists
- repositories
- base assets
- composition results
- persisted sessions
- replay events
- replay bookmarks

Transient examples:

- unread live log chunk lines
- current poll window
- live monitor waveform markers
- Web Audio graph nodes
- current deck control values

## Core flows

### Track import

The active path is:

1. Frontend calls `import_track`.
2. Rust canonicalizes the source path and prevents duplicates.
3. Rust snapshots the audio file into managed storage.
4. Rust calls `analyze_track_import(...)`, which bridges to Python analysis.
5. Rust persists the result into `musical_assets`, `track_analyses`, and `track_library_states`.
6. Frontend receives a normalized `LibraryTrack`.

Important implication:

- track import is not just metadata registration
- it is the main point where local audio becomes durable product data

### Repository or log-file import

The active path is:

1. Frontend calls `import_repository`.
2. Rust snapshots local directories/files into managed storage when appropriate.
3. Rust builds an analyzer request for `repo_analysis`.
4. Python returns deterministic metrics and summary data.
5. Rust persists the normalized result into `musical_assets` and `repo_analyses`.

Important implication:

- the analyzer does not write to SQLite directly
- Rust is the persistence gatekeeper

### Live monitoring

The active live-monitoring path is:

1. React starts a stream session through `MonitorContext`.
2. Rust creates a transient session in `SessionRegistry`.
3. Rust-owned adapters follow file/process/`journald` sources or accept chunks from JS-managed adapters.
4. On poll, Rust drains pending lines and builds one analyzer request for the next chunk.
5. Python analyzes the chunk as a live log window.
6. Rust returns a `StreamSessionPollResult`.
7. React updates the tail, anomaly markers, replay state, and Web Audio mutation.

Important implication:

- the source of truth for active desktop stream sessions is Rust, not Python

## Persistence model

The durable storage model is in `database/schema.sql`.

Key tables:

- `musical_assets`: shared root metadata across asset types
- `track_analyses`: track-specific analysis artifacts
- `track_library_states`: cues, loops, rating, missing-file state
- `base_track_playlists` and `base_track_playlist_items`
- `repo_analyses`
- `base_assets`
- `composition_results`
- `log_source_connections`
- `sessions`
- `session_events`
- `session_bookmarks`
- `analysis_jobs`

Architectural pattern:

- `musical_assets` is the shared root
- type-specific tables branch off from it
- runtime monitoring does not create a new top-level asset for every poll

## Architectural strengths

These are the strongest parts of the design today:

- Clear cross-language contract between Rust and Python
- Local-first asset snapshotting instead of depending on unstable original paths
- Good separation between persistent library state and transient live monitoring state
- Sensible use of Rust for OS-facing concerns and Python for analysis heuristics
- Strong product identity: the audio layer modifies a known track instead of producing generic alerts

## Architectural drift and contributor caveats

These are the places where contributors can get confused:

### Active shell vs alternate shell

`main.tsx` mounts `App-v0.tsx`.
`App.tsx` exists and contains real product code, but it is not the active entrypoint today.

Document changes against the mounted shell first.

### Rust session runtime vs Python session runtime

The desktop product now uses Rust `SessionRegistry` for active monitoring.
The Python analyzer still contains `session_*` actions and `stream.py`, which reflect an older or parallel session model and are still covered by analyzer tests.

For desktop runtime behavior:

- Rust sessions are the source of truth.
- Python session APIs should be treated as analyzer-side legacy or secondary paths unless intentionally revived.

### `main.rs` size

`desktop/src-tauri/src/main.rs` concentrates many responsibilities:

- commands
- DB access
- import flows
- analyzer bridging
- stream runtime
- filesystem utilities

This makes discovery easier in one file, but long-term maintenance harder.

### Mock fallbacks

Frontend API wrappers often fall back to mock implementations outside Tauri.
That is useful for shell development, but it can hide missing native behavior if a contributor only tests in browser mode.

## Recommended reading order for new contributors

1. `README.md`
2. `docs/architecture.md`
3. `docs/open-source-maintainer-guide.md`
4. `database/schema.sql`
5. `contracts/analyzer-request.schema.json`
6. `contracts/analyzer-response.schema.json`
7. `desktop/src/main.tsx`
8. `desktop/src/App-v0.tsx`
9. `desktop/src/features/monitor/MonitorContext.tsx`
10. `desktop/src-tauri/src/main.rs`
11. `analyzer/src/maia_analyzer/service.py`
12. `analyzer/src/maia_analyzer/audio.py`
13. `analyzer/src/maia_analyzer/repository.py`

## Refactor priorities worth documenting publicly

If Maia is presented as open source, these are reasonable and honest architecture notes:

1. Extract `desktop/src-tauri/src/main.rs` into backend modules by domain.
2. Make the active shell story explicit by either promoting `App.tsx` or retiring it.
3. Clarify whether analyzer-side `session_*` actions are legacy-only or still strategic.
4. Keep increasing test coverage around integrated monitor flows rather than only isolated utilities.
5. Continue moving monitor behavior from large screens into smaller hooks and pure modules.

## One-sentence mental model

If you only remember one thing, remember this:

Maia is a React control surface over a Rust local runtime that persists and orchestrates assets, while a Python analyzer converts code and log signal into deterministic musical metadata and live monitoring cues.
