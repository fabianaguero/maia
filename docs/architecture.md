# Architecture

## Product intent
Maia is a local-first desktop app for auditory monitoring. The user selects a favorite track or playlist as the musical base, and repositories, logs, streams, scanned files, and reusable sonic assets drive alterations on top of that base.

The business goal is to make software behavior listenable inside a recognizable musical frame, so a team can monitor systems without staring at a dashboard:

- choose a base track or playlist that defines the original groove, tone, and listening mood
- ingest codebases, live log streams, file scans, and other local sources
- extract structural patterns, tension, rhythm, and anomalous events from those sources
- map those events to audible and visual changes over the selected musical base
- let teams hear systems as variations, interruptions, and mutations of a known track or playlist
- keep the resulting mix pleasant enough for long background listening, not just alert playback

Current MVP ships: local repository intake (Java/Kotlin tree-sitter parsing), local log-file analysis, reusable base assets, composition previews with in-app playback, an app-level live sonification loop with runtime scenes, Rust-owned session-based stream polling for local files plus process / WebSocket / HTTP-poll / journald adapters, a genre-configured instrumental palette shaping live cues, sequencer presets (sparse / balanced / beat-locked / cascade) with component-level cue routing, a base-anchor system that aligns live cues to a selected favorite track or blended playlist BPM and energy, beat-phase-aware scheduling with a persistent beat clock and gentle drift resync, session replay with bookmarks and feedback capture, and full per-repo persistence of the base playlist plus style/mutation profile defaults via `localStorage`.

Current product state is intentionally focused and credible: MAIA's real-time sonification loop is centered on repositories, local log files, and runtime stream adapters, but it already treats the chosen track or playlist as the pleasant, audible monitoring bed. In native desktop runtime, the app supports structure-aware repository parsing, live log-tail polling, Rust-owned transient stream sessions that survive analyzer process boundaries, app-level monitor state that survives screen navigation inside the running app, reusable sonic scenes, base-track BPM and energy anchoring, multi-track playlist blending, beat-phase-aware scheduling through a persistent beat clock, and replay feedback that can now be carried forward into per-repo defaults when the operator applies a recommendation. The next expansion should follow a disciplined order: push from app-level monitoring toward a true background music-server mode, broaden external adapters further, deepen the sonification engine, and only after that extend export and format coverage.

## Source of truth
- Product app: `desktop/`
- Native shell/backend: `desktop/src-tauri/`
- Active analyzer runtime: `analyzer/src/maia_analyzer/`
- Landing only: `site/`

## Main modules
- `desktop/`: Tauri + React + TypeScript desktop shell
- `desktop/src/config/music-styles.json`: local source of truth for curated track-import music styles
- `desktop/src/config/base-asset-categories.json`: local source of truth for curated base-asset categories
- `analyzer/src/maia_analyzer/`: Python analyzer service used by desktop
- `contracts/`: JSON schemas
- `database/`: SQLite + local asset folders

## Communication
The desktop app launches the analyzer locally and communicates through JSON IPC.

The desktop bootstrap manifest also exposes local runtime configuration needed by
the UI. In MVP that includes the curated music-style catalog used before track
import.

## Core entities
- track_analysis
- repo_analysis
- base_asset
- composition_result

Tracks are not just a reference/control lane. A selected track, or a playlist blended from multiple tracks, can act as the base musical lane that Maia alters in response to repositories, logs, and streams. Base assets are the reusable sonic vocabulary. Composition results are the derived musical response plans Maia can materialize and audition locally.

## Current technical decisions
- Track import style selection is configured from `desktop/src/config/music-styles.json`.
- The selected style is sent as part of the desktop import payload, not inferred later.
- Base asset category selection is configured from `desktop/src/config/base-asset-categories.json`.
- The selected base asset category and reusable flag are sent as part of the desktop import payload, not inferred later.
- Track style remains in `musical_assets.metadata_json` for MVP instead of a dedicated relational table.
- Base asset summary and analyzer metrics remain in `musical_assets.metadata_json`, while `base_assets` stores the reusable catalog keys (`storage_path`, `category`, `checksum`, `reusable`).
- Existing tracks without style metadata remain readable and are shown as `Not set`.
- Linux desktop browsing for track files and repository folders is handled by backend commands that call native OS dialog tools.
- Manual path entry stays in the forms as the compatibility fallback when no native picker is available.
- Once a file or folder is chosen, parsing and analysis stay inside the app stack instead of shelling out to OS processing tools.
- Track import prefers analyzer-backed waveform, duration, BPM, and beat-grid intake for existing local `wav`, `mp3`, `flac`, and `ogg/vorbis` files using embedded tempo heuristics.
- Track metadata now also carries key signature, energy level, danceability, and lightweight structural cues in the persisted JSON consumed by desktop.
- Tauri now snapshots imported track files into Maia-managed local storage and keeps the original import path separately in `musical_assets.source_path`.
- Browser fallback preserves the same `track_analysis` shape but can only simulate a managed track path instead of creating a native on-disk snapshot.
- Tauri now snapshots imported local repositories into Maia-managed local storage and keeps the original import path separately in `musical_assets.source_path`.
- `repo_analyses.storage_path` stores the managed snapshot path for local directory imports and local log-file imports, while GitHub URLs continue without a local snapshot.
- `repo_analysis` now covers both code directories and local log files; the distinction is carried by `source_kind` and freeform metrics in `metric_snapshot_json`.
- Base asset import prefers analyzer-backed checksum and catalog metrics for existing local files and directories.
- Base assets should be treated as event-to-sound building blocks for future code/log sonification flows, not only as generic media assets.
- Unsupported track formats currently fall back to deterministic local stubs until another bundled decoder is added.
- `LibraryTrack` now transports `waveformBins`, `beatGrid`, and `bpmCurve` together so the analyzer screen can render the stored artifacts without a second fetch layer.
- Browser fallback and Tauri/SQLite paths both emit the same track-analysis shape so demo mode exercises the same analyzer UI structure.
- Browser fallback and Tauri/SQLite paths now also emit the same `base_asset` shape so reusable-catalog UI behaves the same without the native bridge.
- Tauri now snapshots imported base assets into Maia-managed local storage and keeps the original import path separately in `musical_assets.source_path`.
- Browser fallback preserves the same `base_asset` shape but cannot create the native on-disk snapshot, so it simulates managed storage metadata only.
- `composition_result` is a derived local asset built from one stored `base_asset` plus a BPM reference from a track, a repository, or manual tempo input.
- In business terms, `composition_result` is the current scaffold for turning code-derived or operator-selected signals into audible musical form.
- Local log-file imports now emit log-specific metrics such as severity counts, cadence bins, top components, and anomaly markers so the analyzer screen can inspect operational signal shape without inventing a new entity.
- Live log monitoring reuses `repo_analysis` with `source_kind = "file"` and transient polling updates instead of introducing a fifth persisted entity; the persisted snapshot stays baseline-only, while live windows are analyzed on demand from the original file path.
- Tauri now exposes an internal `poll_log_stream` command that reads appended bytes directly from the selected log file, handles truncation/rotation heuristically, and sends each chunk through the analyzer JSON contract.
- The live monitor uses Web Audio in the React layer for cue playback, so audible feedback stays inside Maia without delegating synthesis or playback to operating-system media tools.
- The live monitor can now apply a transient sonification scene built from an existing `base_asset` and an optional `composition_result`; the base asset colors the timbral/routing profile, while the composition contributes stems/sections/cue labels for runtime mapping.
- That scene layer is runtime-only UI state, not a new persisted asset. It shapes oscillator-based live cues today and leaves room for future sample-trigger or render-engine work without changing the core entity model.
- When the selected base asset resolves to a managed playable audio file, the live monitor now decodes that file into an `AudioBuffer` and triggers it directly for log cues; otherwise the same routing falls back to oscillator synthesis.
- Base-asset analysis now also exposes `playableAudioEntries` and `audioEntryCount` in freeform metrics, so live sonification can choose multiple managed samples from a folder pack without another schema migration.
- The track analyzer view can now resolve managed track snapshots back into the webview through Tauri's scoped asset protocol, so auditioning imported tracks also stays inside Maia.
- Composition planner requests stay inside the analyzer JSON contract by reusing the base-asset source path and extending `options` with composition reference metadata.
- Composition results persist waveform preview bins, beat grid, BPM curve, reference metadata, and arrangement summary in SQLite so the analyzer screen can inspect them without re-running the planner.
- Composition planner section timelines and cue points are stored inside composition metrics so they can evolve without another relational migration.
- Render-preview stems, automation moves, and export targets are also stored inside composition metrics so Maia can expose a future bounce path without changing the core entity model.
- Native composition import can now ask the analyzer to synthesize a deterministic managed `preview.wav`, and that preview path/format metadata also travels inside composition metrics.
- Tauri now exposes both managed track snapshots and managed composition previews back into the webview through the scoped asset protocol, so playback stays inside Maia without opening generic filesystem access.
- Tauri now also materializes each `composition_result` as a managed `plan.json` snapshot inside Maia storage, while SQLite keeps the indexed metadata and preview artifacts.
- Genre/style profiles are defined in `desktop/src/config/music-styles.json` with explicit BPM ranges, per-severity waveform types, and gain/duration/pitch multipliers. `liveSonificationScene.ts` resolves those profiles at runtime into a `ResolvedLiveSonificationScene` for the live monitor. Genre selection is a guided instrumental palette — all output is instrumental and deterministic, not a full composition engine that generates genre-specific arrangements.
- Stream sessions now extend live monitoring beyond local growing log files: `main.rs` owns the transient session runtime in `SessionRegistry` (`Arc<Mutex<...>>`), exposes `start_stream_session`, `stop_stream_session`, `list_stream_sessions`, `poll_stream_session`, and `ingest_stream_chunk`, and supports file, process, WebSocket, HTTP-poll, and `journald` adapters through one session UI. File/process/`journald` follow loops live natively in Rust; WebSocket/HTTP-poll feed text chunks from JS into the same Rust buffer. The Python analyzer is now stateless for live sessions and analyzes only the current chunk per request. The live monitor runtime remains app-level via `MonitorProvider`, so it survives screen navigation inside the running app. Headless/background service mode outside the desktop process is still future work.
- Saved output for composition results now includes managed arrangement artifacts (`plan.json`), deterministic preview audio (`preview.wav`), and exported per-stem WAV files under Maia-managed local storage. A fuller master-bounce/export pipeline is still future work.
- Browser fallback and Tauri/SQLite paths now also emit the same `composition_result` shape so composition UX does not fork by runtime.
- Missing or unresolved track sources still fall back to deterministic mock analysis so demo flows keep working without blocking the library.
- A selected base track, or blended base playlist, seeds the `BeatClock` origin at session start with the anchor BPM. `nextBeatTime` then aligns each poll window's first cue to the nearest subdivision boundary of that clock. If no anchor is set, the clock auto-seeds from the first live-detected BPM. The clock's BPM re-syncs gently (>12% drift threshold) while the origin stays fixed, preserving phase across tempo changes.
- The base anchor can now be a multi-track playlist. `blendAnchors` computes a composite anchor from all playlist tracks: BPM by median of non-null values, energy by arithmetic mean, and musicStyleId by mode (most frequent). A single-track playlist is a passthrough to avoid unnecessary computation.
- `MonitorPrefs` now persist `basePlaylist`, `selectedStyleProfileId`, and `selectedMutationProfileId` to `localStorage` under the key `maia.monitor-prefs.<repoId>`. The per-repo initializer reads this key so that switching repos restores each repo's own last-used settings. The loader also migrates the older `referencePlaylistIds` / `selectedGenreId` / `selectedPresetId` shape forward on read. The persist effect saves on every change.
- Sequencer presets define cue density, gain spread, and scheduling mode. The `beat-locked` preset uses the beat clock for phase-accurate first-cue placement; other presets use fixed gap milliseconds. Component routes in `COMPONENT_ROUTES` map log-event pattern strings to oscillator/sample assignments.
- Live log-stream sonification now exists in the analyzer UI with file, process, WebSocket, HTTP-poll, and `journald` adapters, backed by a native transient session runtime in Rust rather than analyzer in-memory state. The current gap is no longer in-app session continuity, but headless/background service mode and additional external adapters such as Kafka/Loki.
