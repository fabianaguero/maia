# Pre-Release Manual Test Plan

Use this checklist before publishing Maia publicly or tagging a release candidate.

The goal is not to exhaust every feature.
The goal is to prove that the app still behaves coherently as a real desktop product:

- it boots
- it loads the active shell
- it can import/select sources
- it can launch monitoring
- it can render live monitor UI
- it can stop cleanly

This plan complements:

- [docs/github-publish-checklist.md](github-publish-checklist.md)
- [docs/testing-and-quality.md](testing-and-quality.md)
- [docs/frontend-architecture.md](frontend-architecture.md)

## Before You Start

Run the automated baseline first:

```bash
make quality

cd desktop
npm run coverage
```

If those are red, do not spend time on manual testing yet.

## Launch Smoke Test

1. Start the desktop app:

```bash
cd desktop
npm run tauri dev
```

2. Verify:
- the app window renders without a black screen
- the mounted shell is the expected one from `desktop/src/main.tsx`
- sidebar navigation renders
- branding assets load correctly
- no immediate runtime error overlay appears

## Library and Asset Smoke Test

1. Open the library/catalog surface.
2. Verify you can browse:
- tracks
- repositories / log sources
- base assets
- compositions

3. If using local fixtures, import or select:
- one real audio track
- one local log file or folder under `desktop/test/logs/`

Expected result:
- cards/tables render
- selection state updates
- no duplicate or broken labels appear

## Passive Monitoring: Local File Flow

This is the highest-value product test for the current MVP.

1. Choose a track.
2. Choose a local log source from `desktop/test/logs/maia_spring_logs/` or another known-good fixture.
3. Start monitoring.

Verify:
- the app transitions into the active monitor surface
- the live tail fills progressively instead of looking frozen
- the waveform/deck area renders
- the current track continues to play as the bed
- anomalies visually correlate with the tail
- stopping the session returns to a sane idle state

Recommended local fixtures:
- `desktop/test/logs/maia_spring_logs/customers-service.log`
- `desktop/test/logs/maia_spring_logs/vets-service.log`
- `desktop/test/logs/maia-log-sources-loghub-jvm/Zookeeper_2k.log`

## Replay and Session Flow

1. Start a monitor session.
2. Let it run long enough to create meaningful events.
3. Stop the session.
4. Re-open or replay the saved session.

Verify:
- session metadata is visible
- replay starts and stops predictably
- bookmark or anomaly navigation still points to coherent moments
- no broken coupling appears between deck state and tail state
- sessions whose log file or selected track no longer exists are visibly marked as lost
- lost sessions cannot be replayed silently
- lost sessions can be cleaned from the previous-sessions panel without deleting unrelated valid sessions or tracks

## Connection Flow

1. Open the Connections screen.
2. Create at least one saved connection:
- local file tail
- local folder
- optional: GCloud / Cloud Run connector if your machine is configured

3. Test the connection if the feature is available.
4. Return to the monitor launch flow and confirm the saved source is selectable.

Verify:
- save/edit/delete works
- loading/probe states are visible
- the chosen source can be launched into monitoring

## CodeProjects / Local Quality Flow

1. Open Library / CodeProjects.
2. Create a CodeProject using a local repository path.
3. Keep the analysis mode as local plugin.
4. Save the project.
5. Return to Monitor and select the CodeProject as the source.
6. Start monitoring with a real track selected.

Verify:
- local repository paths are accepted without requiring a SonarQube server
- the CodeProject appears in the monitor source selector
- the monitor opens as a normal passive session
- existing local findings seed a baseline instead of triggering fake anomaly bursts
- quiet local analysis keeps the track stable

## Optional SonarQube Connected Flow

Run this only if you have a test SonarQube or SonarCloud project.

1. Edit a CodeProject.
2. Switch analysis mode to connected.
3. Enter server URL, project key, and token.
4. Test the connection.
5. Save the project.
6. Switch it back to local plugin mode and save again.

Verify:
- Save stays blocked until a connected configuration has passed the connection test
- switching back to local clears remote URL/project/token fields before persistence
- local mode remains usable without network access
- no connected token appears in screenshots, docs, or exported debug output

## Setup / Skin / Preferences Flow

1. Open setup/preferences.
2. Change at least:
- skin/theme
- one audio/reactivity preference
- one visual/runtime preference

3. Return to monitoring.

Verify:
- preferences persist when expected
- the active skin changes cleanly
- controls stay labeled and understandable

## Optional GCloud / Remote Stream Test

Run this only if the workstation is already configured for `gcloud`.

1. Create or edit a Cloud Run / GCloud logging connection.
2. Configure a bounded backfill window.
3. Start monitoring.

Verify:
- waiting/loading state is visible while connecting
- the initial backfill is understandable
- the monitor transitions into normal tail polling after bootstrap
- no fake anomalies appear while the stream is quiet

## Audio Acceptance

For the current MVP, accept the release only if:

- the track remains the main audible layer
- passive monitoring does not collapse into random isolated beeps
- quiet logs sound mostly stable
- anomalies change the mix without completely destroying continuity
- start/stop/replay do not leave stuck audio behind
- selecting a lost previous session does not start a silent or stuck monitor session

## Visual Acceptance

Accept the release only if:

- the active deck clearly communicates track vs log activity
- anomalies are visible and legible
- the tail is readable at a glance
- setup/configuration is not confused with live operation
- the main launch action is obvious without scrolling or guessing

## Open Source Release Exit Criteria

Maia is ready for a first public release candidate when all of these are true:

- automated quality gates pass
- this manual plan passes without a blocker in the active shell
- docs point to the correct mounted frontend path
- fixtures and demo assets are intentionally public
- branding looks coherent
- first-time contributors can understand where to start from `README.md`
