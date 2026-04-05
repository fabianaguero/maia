# Maia – Musical AI for Analysis & Arrangement

A desktop application for analyzing audio tracks, visualizing waveforms/beat grids/BPM curves, and parsing code repositories for musical patterns.

## Architecture

| Component | Technology |
|-----------|-----------|
| Desktop shell | Tauri 2 + React + TypeScript |
| Analyzer | Python (librosa) |
| Local database | SQLite |
| Repo parsing | tree-sitter |
| Optional optimization | Rust |

## Domain Model

Core entity: `musical_asset`

| Type | Description |
|------|-------------|
| `track_analysis` | Full audio analysis result |
| `repo_analysis` | Code/log repository scan result |
| `base_asset` | Reuseable musical segment |
| `composition_result` | Assembled composition |

## Quick Start

### Prerequisites

- Node.js 20+
- Rust (stable) + Cargo
- Python 3.11+
- System audio libs: `sudo apt install libasound2-dev libssl-dev`

### Install dependencies

```bash
# Frontend
npm install

# Python analyzer
pip install -r analyzer/requirements.txt
```

### Development

```bash
# Start Tauri dev server (frontend + desktop)
npm run tauri dev

# Run Python analyzer independently
python -m analyzer.cli analyze-track --file /path/to/track.mp3
python -m analyzer.cli analyze-repo --path /path/to/repo
python -m analyzer.cli list-assets
```

### Deploy landing (`/site`) to Cloudflare Pages

The landing uses Vite 5. If you run `wrangler deploy`, Wrangler may try framework auto-detection and fail asking for Vite 6+.
Use Pages deployment instead:

```bash
cd site
npm install
npm run build
CLOUDFLARE_PAGES_PROJECT=maia npm run deploy:pages
```

For Cloudflare build settings, use:
- Build command: `npm run build`
- Build output directory: `dist`
- Deploy command: leave empty (Pages handles publish) or use `npm run deploy:pages` in CI.

### Tests

```bash
# Python tests
pip install pytest pytest-cov
pytest tests/ -v
```

## JSON Contracts

All data flowing between the Python analyzer and the Tauri frontend uses JSON conforming to the schema in `contracts/musical_asset_schema.json`.

## Engineering Rules

- Analyzer and desktop app are decoupled via JSON contracts
- Deterministic heuristics over black-box ML in MVP
- All analysis stored locally in SQLite
- Linux is the primary dev environment
