# Vision

MAIA is a desktop app for auditory monitoring that turns repositories, logs, streams, scanned files, and reusable sonic assets into music and audible operational signals.

It should:
- make software behavior listenable, not only visible
- let a team hear a live stream of logs or system events as evolving music
- let a team monitor systems mainly by ear while the mix keeps running in background
- mark anomalous log or code events with distinct sounds, accents, or timbral changes
- import local songs
- support a base track or playlist chosen by listener preference
- require choosing a curated music style before track import
- allow browsing local tracks and project folders from the desktop workflow
- keep parsing and analysis inside the app/analyzer once a source is selected, while still using OS-native dialogs for browsing
- snapshot real local tracks into Maia-managed storage and persist analyzer-derived waveform bins, duration, and heuristic BPM data immediately after import
- analyze waveform, beat grid, and BPM
- render waveform, beat grid, and BPM curve inside the analyzer screen immediately after import
- parse Java/Jakarta EE repositories
- snapshot real local repositories into Maia-managed storage before running deterministic code heuristics
- infer a suggested BPM from code structure
- import real local log files and extract severity bursts, anomaly markers, and audible pacing hints
- run a local live `tail -f` style monitor inside the analyzer screen so appended log events become audible cues immediately
- let that live monitor load a reusable base asset and an optional composition plan as the active sonification scene for routing and musical character
- trigger a real managed base-asset sample from that scene when a playable file exists, falling back to synthesis only when no usable sample is available
- map multiple managed samples from a base-asset folder pack across live severity/anomaly routes when a pack exposes enough playable entries
- evolve from local log tails toward broader live log-stream sonification
- evolve from app-scoped monitoring toward a background music-server workflow
- store reusable musical base assets
- require categorizing base assets at import time and inspect them in a dedicated analyzer view
- audition imported tracks directly inside the analyzer from Maia-managed snapshots
- derive composition results from reusable bases plus track/repo/manual BPM references as the current path toward code-driven music
- inspect composition strategy, phrase sections, cue points, managed plan snapshot path, managed preview audio with in-app playback, render preview, and preview artifacts directly in the analyzer screen
- combine base assets with dynamics extracted from other repos/logs

For MVP, music styles stay curated and local-editable instead of free-text so
the desktop flow can keep deterministic priors for BPM and asset grouping.

Current MVP note: repository snapshots, local log-file snapshots, reusable base assets, composition previews, local live log-tail listening, runtime sonification scenes, session replay with feedback, and multi-sample live triggering now exist; broader stream adapters, denser sequencing logic, and a true background music-server runtime still need to be built.
