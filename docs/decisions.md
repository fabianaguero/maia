# Decisions

## 2026-04-09

### Business decisions
- Maia's primary product line is auditory monitoring: teams should be able to monitor servers, logs, streams, repos, or scanned files mainly by hearing them.
- The core listening mode should be background-safe and pleasant, not just a sequence of alerts or abstract cues.
- The chosen track or playlist is the musical bed that defines listener preference and fatigue profile.
- The desktop app is the control surface; the longer-term target is a background music-server workflow for teams.

### Technical decisions
- Product messaging and UX should optimize for "monitor without looking" before adding more visual-dashboard behavior.
- Replay feedback (bookmarks, tags, notes) should improve future mixes and session defaults instead of remaining passive notes only.
- Source adapters should be treated as first-class signal inputs under one audible-monitoring model: live stream, file tail, repository scan, file scan, or session replay.
- Live stream session state should live in Rust `SessionRegistry`, not inside Python process memory. File/process/`journald` followers are owned natively; WebSocket/HTTP-poll feed chunks into the same Rust runtime through `ingest_stream_chunk`; the Python analyzer stays stateless and analyzes one chunk per request.

## 2026-04-08

### Business decisions
- Maia's musical base can be a single imported track or a playlist blended from multiple imported tracks.
- Repositories, logs, streams, and parsed source patterns should be heard as alterations over that selected base, not as an entirely disconnected audio layer.
- Imported tracks are therefore not just support material for calibration; they can be the main audible frame that the rest of the product mutates.

### Technical decisions
- The only product app source of truth is now `desktop/` with its native backend in `desktop/src-tauri/`.
- The only analyzer runtime source of truth is now `analyzer/src/maia_analyzer/`; the legacy analyzer files at the root of `analyzer/` were removed.
- The legacy root Tauri/Web app was removed to avoid editing the wrong product surface. `site/` remains as the landing and is not part of the desktop runtime.
- Useful track-analysis functionality from the old analyzer was ported into the active path before cleanup: key signature, energy level, danceability, and lightweight structural cues now flow through the desktop track metadata.

## 2026-04-04

### Business decisions
- Maia's primary product value is software sonification: code and logs should become listenable musical/aural signals, not just visual metrics.
- Teams should eventually be able to monitor a live log stream and hear anomalous events as distinct sounds or musical changes without staring at a dashboard.
- Before true live streaming exists, Maia should already support importing a real local log file and deriving audible/visual signal structure from it.
- Imported tracks can act as the audible base lane for the product, while source-derived signals provide the mutations, contrast, and variation layer.
- Reusable base assets are the sonic vocabulary Maia will use to express code/log events, tension, drift, and anomalies.
- Track intake now requires an explicit music-style choice before import.
- The style list is curated for MVP instead of user free-text so the library stays consistent for DJs and future reusable-base workflows.
- The initial catalog prioritizes common electronic families such as House, Melodic House, Progressive House, Techno, Trance, and EDM.
- Track and repository intake should prefer browse-first desktop interactions over manual typing when a native picker is available.
- Importing a real local track file should immediately improve the stored waveform preview, even before full BPM DSP is implemented.
- Real local track imports should also be snapshotted into Maia-managed storage in the native runtime so analysis and later workflows do not depend on the original file staying in place.
- Real local repository imports should be snapshotted into Maia-managed storage in the native runtime for the same reason: analyzer heuristics and later flows should not depend on the original checkout staying untouched.
- Native OS dialogs are acceptable for choosing files and folders, but parsing and media/code processing should stay inside the app stack after selection.
- Persisted beat-grid and BPM-curve artifacts should be visible in the analyzer screen as soon as they exist, even if the underlying heuristics are still coarse in MVP.
- Base assets need explicit category assignment at import time so the reusable catalog stays navigable instead of becoming an untyped file dump.
- Base assets should be snapshotted into Maia-managed storage in the native desktop runtime so later composition flows do not depend on the original filesystem path staying untouched.
- `composition_result` should be created inside Maia from existing local assets instead of importing another external file type.
- MVP composition results are planning artifacts: they need to express timing, strategy, reusable-asset intent, and eventually event-to-sound intent, but they do not need to render final audio yet.
- Users should be able to derive a composition from either a track BPM, a repository BPM, or a manual tempo so the workflow remains useful before full composition engines exist.
- Native composition results should also become first-class internal files so a derived arrangement plan exists on disk under Maia storage, not only as rows in SQLite.
- Before audio rendering exists, composition results should still expose phrase sections and cue points so DJs can inspect usable structure inside Maia.
- Before real bounce/export exists, Maia should also expose an internal render preview with stems and automation so users can reason about mix structure inside the desktop app.
- Before full bounce/export exists, Maia should still generate a deterministic managed preview audio file so the composition flow produces something audible inside the local-first runtime.
- Once native track snapshots exist, Maia should also let users audition imported tracks inside the analyzer screen instead of forcing an external player.
- Once managed preview audio exists, Maia should also let the user audition it directly inside the analyzer screen instead of forcing an external player hop.
- Live log-stream sonification should land in MVP at least for the local `tail -f` case, because hearing newly appended log events is core to Maia's product identity rather than optional polish.
- Live monitoring should not stay generic once reusable bases and composition plans exist; the operator needs to hear the stream through Maia's own sonic vocabulary.
- Genre/style selection in the live monitor shapes a guided instrumental palette (waveform profile per log severity, tempo range, pitch register) rather than acting as a full composition engine. All output is instrumental and deterministic. The genre catalog is intentionally curated and locally editable so the desktop flow keeps deterministic priors without an AI inference step.

### Technical decisions
- Current persisted entities (`track_analysis`, `repo_analysis`, `base_asset`, `composition_result`) are enough for the present MVP; live log monitoring is implemented as transient runtime state on top of `repo_analysis` instead of a new persisted asset type.
- With local live tail now in-product, `repo_analysis` plus `composition_result` remain the main path for code-driven music generation and preview, while the monitor adds the first continuous runtime cue layer.
- `track_analysis` is currently a support lane for reference audio, playback, and tempo comparison; it should not be mistaken for the main business domain.
- Source of truth for the style catalog: `desktop/src/config/music-styles.json`.
- The desktop bootstrap manifest exposes the catalog and the config path so the UI can render the selector without a second config call.
- The selected style is persisted on each track inside `musical_assets.metadata_json` and mirrored in asset tags as `music-style:<id>`.
- MVP keeps style metadata denormalized inside track metadata to avoid an extra schema/table while the catalog is still curated and low-churn.
- Backward compatibility is preserved: older tracks without style metadata still load and surface as `Not set`.
- Linux-native pickers are implemented in the Tauri backend with external dialog tools such as `kdialog`, instead of adding another frontend plugin layer right now.
- Manual path fields remain visible because the picker is an accelerator, not the only import path.
- Track intake now has a two-lane path: existing local `wav`, `mp3`, `flac`, and `ogg/vorbis` files go through an embedded Python analyzer path, while missing/demo paths keep the deterministic Rust-side mock analysis.
- The analyzer no longer depends on `ffmpeg` or `ffprobe` for track intake; compressed-format decoding is now handled by a bundled `miniaudio` dependency inside the Python analyzer.
- `m4a` and other unsupported containers still fall back to deterministic local stubs for MVP instead of delegating decoding to the operating system.
- The selected music style is still persisted for categorization and fallback, but analyzer-detected BPM now wins when heuristic audio analysis succeeds.
- Beat grid and BPM curve are currently coarse heuristic artifacts; they are stored now so later UI iterations can consume them without another DB migration.
- The analyzer screen now consumes beat-grid and BPM-curve artifacts directly from the same `LibraryTrack` payload returned by Tauri and by the browser fallback, avoiding a separate per-panel artifact query.
- Mock/demo track generation now emits waveform, beat-grid, and BPM-curve preview data so the UI stays representative even when the Python bridge is unavailable.
- Native track import now copies the selected file into managed local storage and persists that snapshot path in `track_analyses.storage_path`.
- The original track path remains in `musical_assets.source_path`, while Tauri analyzer requests prefer the managed snapshot when it exists.
- Browser fallback cannot create the native snapshot, so it preserves the same `LibraryTrack` shape with a simulated managed path and explicit notes.
- The track analyzer screen now resolves only managed track snapshots, not legacy/original paths, through Tauri `convertFileSrc`, so in-app playback stays local-first and does not silently fall back to external filesystem paths.
- Native repository import now copies the selected local directory into managed local storage and persists that snapshot path in `repo_analyses.storage_path`.
- The original repository path remains in `musical_assets.source_path`, while Tauri analyzer requests prefer the managed snapshot for local directory imports.
- `repo_analysis` now also accepts `source_kind = "file"` for local log files, using the same managed-storage snapshot approach as local directories.
- GitHub URL imports remain metadata-only and do not create a managed repository snapshot.
- Local log-file analysis now extracts severity counts, cadence bins, top components, and anomaly markers, then maps them to a deterministic BPM suggestion and signal summary without introducing a fifth core entity.
- The first shipped live-stream implementation is local-file tailing: Maia keeps a baseline snapshot for the imported log, but the live monitor polls the original file path for newly appended bytes.
- Live monitoring updates should remain transient and should travel through the existing analyzer JSON contract as log-window options (`logTailChunk`, offsets, live-mode flag) instead of becoming another persisted asset type.
- Audible live cues should be synthesized inside the app with Web Audio, not delegated to OS media tools, so the feature remains local-first and app-contained after file selection.
- The first scene implementation is also transient: the live monitor can select an existing base asset plus an optional composition overlay, then remap live cues onto stems/sections/waveforms without persisting another runtime object.
- Base assets now influence both routing metadata and cue playback: if the selected managed base asset resolves to a playable file, Maia triggers that sample directly for live cues; otherwise it falls back to internal synthesis.
- Folder-pack base assets now expose multiple playable audio entries, and the live monitor can assign different route types (`info`, `warn`, `error`, `anomaly`) to different managed samples from the same pack.
- Multi-sample mapping is still lightweight: Maia currently chooses one sample per route, not per-component or per-pattern sequencing.
- Source of truth for base asset categories: `desktop/src/config/base-asset-categories.json`.
- Genre profiles are defined in `desktop/src/config/music-styles.json` with BPM ranges, per-severity waveform types, and gain/duration/pitch multipliers; `liveSonificationScene.ts` resolves those profiles at runtime into a `ResolvedLiveSonificationScene`, keeping genre logic in desktop config rather than in the Python analyzer. Genre selection changes the sonification feel (instrumental palette), not the composition pipeline or the entity model.
- Stream sessions now cover sources beyond local growing log files: `main.rs` owns the shared transient session runtime in `SessionRegistry`, exposes `start_stream_session`, `stop_stream_session`, `list_stream_sessions`, `poll_stream_session`, and `ingest_stream_chunk`, and `LiveLogMonitorPanel` can switch between file, process, WebSocket, HTTP-poll, and `journald` adapters inside the same session UI. File/process/`journald` follow loops live natively in Rust, while WebSocket/HTTP-poll feed chunks from JS into the same runtime. Session buffers remain transient, but the runtime itself now lives in app-level `MonitorContext`, so active monitoring survives screen navigation inside the running desktop app. Always-on monitoring outside the desktop process is still deferred.
- Source of truth for base asset categories: `desktop/src/config/base-asset-categories.json`.
- Base asset imports now accept both files and directories, with the selected category and reusable flag flowing through the analyzer JSON contract.
- Base asset analyzer intake returns checksum, entry count, extension breakdown, and preview entries so the desktop shell can render a meaningful reusable-asset inspector without another analysis pass.
- Native base asset import now copies the selected file or directory into managed local storage and persists that snapshot path in `base_assets.storage_path`.
- The original filesystem path remains in `musical_assets.source_path` for traceability, while analysis and later composition flows can rely on the managed snapshot.
- Browser fallback cannot perform the native copy, so it preserves the same frontend record shape with simulated managed-storage metadata.
- Tauri and browser fallback now share the same `BaseAssetRecord` shape, and the analyzer screen has a dedicated base-asset mode instead of overloading the track/repo views.
- Composition planner input reuses the existing analyzer `composition_result` asset type and extends `options` with reference type, reference label, reference BPM, and base-asset entry count.
- SQLite now persists derived compositions in a dedicated `composition_results` table while keeping planner notes, tags, and metrics in `musical_assets.metadata_json`.
- Composition preview artifacts are stored with the result, not recomputed on every open, so the analyzer screen stays fast and deterministic.
- Tauri now writes a managed `plan.json` snapshot for each composition result and persists that path in `composition_results.export_path`.
- The composition planner now emits deterministic `arrangementSections` and `cuePoints` inside metrics; the analyzer screen renders them directly and can derive fallback sections for older records.
- The composition planner now also emits a deterministic `renderPreview` object inside metrics, and the analyzer screen renders it directly while deriving a fallback for older records.
- Composition analysis can now optionally synthesize a deterministic stereo `preview.wav` using only the Python stdlib, and the resulting `previewAudioPath`/format metadata stays in composition metrics plus the frontend record shape.
- Track and composition playback now share the same frontend-managed audio transport, resolving managed local files with Tauri `convertFileSrc` through a scoped `$APPDATA/assets/**` asset protocol instead of delegating audition to the operating system.
- Tauri and browser fallback now share the same `CompositionResultRecord` shape, including waveform bins, beat grid, BPM curve, strategy, and reference metadata.
- Composition planning currently depends on existing stored base assets and track/repository BPM records; the new live log-tail monitor is a runtime cue layer, not yet a full continuous composition engine or generalized stream adapter layer.

- The recommended build order after the current MVP is now explicit: first extend the shipped app-level monitor into a true background music-server mode, then broaden external adapters further, then deepen sonification behavior on top of the now-stable session runtime, and only after that push into richer rendering and export. In practice, this now means prioritizing headless/background runtime first, Kafka/Loki-class adapters second, richer sonification behavior third, fuller bounce/export fourth, and additional format or catalog coverage last. This sequencing keeps Maia aligned with its current product truth: repositories, local logs, replay-default persistence, cleaned analyzer baseline, and app-level monitored streams are already real; generalized external integrations and production-grade rendering remain the next expansion layer.

## 2026-04-05

### Technical decisions
- The reference anchor can now be a multi-track reference playlist. `blendAnchors` derives a single composite anchor from N tracks: BPM by median of non-null values (robust to tempo outliers), energy by arithmetic mean, and `musicStyleId` by mode (most-frequent id). A single-track input is a passthrough with `trackId = "playlist-blend"` to keep the return type uniform. The playlist is ordered and reorderable (↑/↓ buttons in the pill strip).
- The `LiveSonificationScenePanel` shows a "Blend style" row only when the active anchor's `trackId === "playlist-blend"`, surfacing the blended `musicStyleId` without ambiguity.
- `MonitorPrefs` now persist `basePlaylist`, `selectedStyleProfileId`, and `selectedMutationProfileId` to `localStorage` under key `maia.monitor-prefs.<repoId>`. Each repo gets its own saved settings. The `useState` initializer reads `loadMonitorPrefs(repository.id)` on first render so state is pre-populated without an effect round-trip. The persist effect writes on every change, and `loadMonitorPrefs` migrates the older `referencePlaylistIds` / `selectedGenreId` / `selectedPresetId` shape forward when encountered. On repo switch, the existing reset effect calls `loadMonitorPrefs` for the new repo id instead of zero-filling.
- Applying a replay-feedback recommendation now persists the suggested style/mutation pair immediately into `MonitorPrefs`, so future sessions for the same repo start from the chosen carry-forward mix even when the recommendation matches the already-loaded scene.
- A stray orphan `</select>` element was present in the toolbar JSX. Removed; no behaviour change.
- The updated priority order for the next feature: **background music-server mode / headless runtime** first, then external adapters beyond the current file/process/WebSocket/HTTP-poll/journald set, then richer sonification behavior on top of the now-stable session runtime, and then fuller export/bounce UI. This order reflects that app-level always-on monitoring, replay-default persistence, analyzer baseline cleanup, and Rust-owned transient stream sessions are already shipped; the remaining gap is making that runtime survive outside the foreground app and expanding the adapter surface before adding more musical depth.

## 07. Aesthetic Mapping for Live Sonification (Presets)
**Date:** 2026-04-05

**Context:**
Log sonification was previously using static mappings (e.g., Error = Sine). This lacked artistic depth and didn't fulfill the "Live System Performance" vision.

**Decision:**
Implement a **Preset-based Sonification Engine**. The mapping between log events and musical parameters (waveforms, frequencies, interaction with stems) will be governed by aesthetic "Presets" (Techno, Ambient, Glitch).

**Consequences:**
- The frontend must support selecting `presetId`.
- The analyzer must expose a registry of available presets.
- Logs will now "mutate" active audio stems (e.g., triggering filters or effects).
