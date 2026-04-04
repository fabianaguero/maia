# Architecture

## Main modules
- `desktop/`: Tauri + React + TypeScript desktop shell
- `desktop/src/config/music-styles.json`: local source of truth for curated track-import music styles
- `desktop/src/config/base-asset-categories.json`: local source of truth for curated base-asset categories
- `analyzer/`: Python analyzer service
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
- Base asset import prefers analyzer-backed checksum and catalog metrics for existing local files and directories.
- Unsupported track formats currently fall back to deterministic local stubs until another bundled decoder is added.
- `LibraryTrack` now transports `waveformBins`, `beatGrid`, and `bpmCurve` together so the analyzer screen can render the stored artifacts without a second fetch layer.
- Browser fallback and Tauri/SQLite paths both emit the same track-analysis shape so demo mode exercises the same analyzer UI structure.
- Browser fallback and Tauri/SQLite paths now also emit the same `base_asset` shape so reusable-catalog UI behaves the same without the native bridge.
- Base assets are stored by reference to their current local path for MVP instead of being copied into Maia-managed storage.
- Missing or unresolved track sources still fall back to deterministic mock analysis so demo flows keep working.
