# Decisions

## 2026-04-04

### Business decisions
- Track intake now requires an explicit music-style choice before import.
- The style list is curated for MVP instead of user free-text so the library stays consistent for DJs and future reusable-base workflows.
- The initial catalog prioritizes common electronic families such as House, Melodic House, Progressive House, Techno, Trance, and EDM.
- Track and repository intake should prefer browse-first desktop interactions over manual typing when a native picker is available.
- Importing a real local track file should immediately improve the stored waveform preview, even before full BPM DSP is implemented.
- Native OS dialogs are acceptable for choosing files and folders, but parsing and media/code processing should stay inside the app stack after selection.
- Persisted beat-grid and BPM-curve artifacts should be visible in the analyzer screen as soon as they exist, even if the underlying heuristics are still coarse in MVP.
- Base assets need explicit category assignment at import time so the reusable catalog stays navigable instead of becoming an untyped file dump.
- MVP base assets should be registered by source-path reference first, before investing in managed copy/snapshot storage semantics.

### Technical decisions
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
- Source of truth for base asset categories: `desktop/src/config/base-asset-categories.json`.
- Base asset imports now accept both files and directories, with the selected category and reusable flag flowing through the analyzer JSON contract.
- Base asset analyzer intake returns checksum, entry count, extension breakdown, and preview entries so the desktop shell can render a meaningful reusable-asset inspector without another analysis pass.
- Base assets are persisted by reference in `base_assets.storage_path`, equal to the selected local source path in MVP.
- Tauri and browser fallback now share the same `BaseAssetRecord` shape, and the analyzer screen has a dedicated base-asset mode instead of overloading the track/repo views.
