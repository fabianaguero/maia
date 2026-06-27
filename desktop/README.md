# Maia Desktop

This directory contains the active desktop product:

- Tauri 2 shell
- React 19 UI
- TypeScript application state and monitor UX
- Web Audio monitor playback and mutation behavior

## Important current note

The mounted frontend entrypoint is:

- `src/main.tsx`
- which currently renders `src/App-v0.tsx`

`src/App.tsx` exists as an alternate shell, but it is not the mounted surface today.

## Commands

```bash
npm install
npm run tauri dev
npm run build
npm run test:run
npm run coverage
npm run quality
npm run quality:strict
```

## Useful files

- `src/App-v0.tsx`: active shell
- `src/features/monitor/MonitorContext.tsx`: monitor runtime context
- `src/features/simple/`: active simple-mode product surface
- `src/appV0MonitorRuntime.ts`: monitor launch orchestration helpers
- `src/appV0Preferences.ts`: shell preference persistence helpers
- `src/appV0ShellViewModel.ts`: shell-derived view state

## Related docs

- [../README.md](../README.md)
- [../docs/architecture.md](../docs/architecture.md)
- [../docs/frontend-architecture.md](../docs/frontend-architecture.md)
- [../docs/open-source-maintainer-guide.md](../docs/open-source-maintainer-guide.md)
