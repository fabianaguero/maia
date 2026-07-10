# MAIA Screenshots

This directory contains screenshots of the MAIA desktop application used on the landing page and documentation.

## Current Screenshots

To capture updated screenshots:

1. Start the desktop app: `cd desktop && npm run tauri dev`
2. Navigate to the section you want to capture
3. Use your platform's screenshot tool (macOS: Cmd+Shift+4, Windows: Win+Shift+S, Linux: gnome-screenshot)
4. Save to this directory with descriptive names

## Screenshot Guidelines

- **Resolution:** Capture at 1440x900 or higher for retina displays
- **Theme:** Use dark mode for consistency with the landing site
- **Content:** Show the app in a realistic state (library loaded, session running, etc.)
- **Naming:** Use lowercase with hyphens (e.g., `library-home.png`, `live-monitor.png`)

## Locations to Capture

1. **Library/Home Screen:** Initial app launch showing track library
2. **Live Monitoring:** Active monitoring session with waveform and metrics
3. **Session Replay:** Replay view with bookmarks and feedback
4. **Composition Planning:** Composition builder with preview audio

## Usage

Screenshots are embedded in the landing site via the HeroSection and other components. Keep file sizes optimized (under 200KB for web performance).
