# Vision

MAIA is a desktop analyzer for tracks, repositories, and rhythm.

It should:
- import local songs
- require choosing a curated music style before track import
- allow browsing local tracks and project folders from the desktop workflow
- keep parsing and analysis inside the app/analyzer once a source is selected, while still using OS-native dialogs for browsing
- persist analyzer-derived waveform bins, duration, and heuristic BPM data immediately when the selected local track file exists
- analyze waveform, beat grid, and BPM
- render waveform, beat grid, and BPM curve inside the analyzer screen immediately after import
- parse Java/Jakarta EE repositories
- infer a suggested BPM from code structure
- store reusable musical base assets
- require categorizing base assets at import time and inspect them in a dedicated analyzer view
- combine base assets with dynamics extracted from other repos/logs

For MVP, music styles stay curated and local-editable instead of free-text so
the desktop flow can keep deterministic priors for BPM and asset grouping.
