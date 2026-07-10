## Summary

Describe the change in a few sentences:

- what changed
- why it changed
- which user or maintainer flow it affects

## Runtime Layer

Check the layers touched by this PR:

- [ ] Desktop frontend
- [ ] Rust/Tauri runtime
- [ ] Python analyzer
- [ ] Contracts / JSON payloads
- [ ] SQLite / persistence
- [ ] Docs / repo hygiene

## Architecture Impact

Describe any boundary changes between React, Rust, Python, contracts, or persistence.
If none, write `None`.

## Validation

- [ ] `cd desktop && npm run quality`
- [ ] `cd desktop && npm run coverage` or focused desktop tests
- [ ] `python3 -m pytest analyzer/tests -v` or focused analyzer tests
- [ ] `make quality-pre-commit`
- [ ] `make quality-pre-push`
- [ ] Manual smoke test completed when UI/runtime behavior changed

Commands run:

```bash
# paste commands here
```

## Screenshots or Recordings

Add visuals when the change affects desktop UI, waveform rendering, monitoring flow, or setup/preferences.

## Risks

- Runtime or product risks
- Follow-up work still pending

## Checklist

- [ ] No unrelated files were reverted
- [ ] Strings were routed through i18n where applicable
- [ ] Types/contracts were kept explicit
- [ ] Docs were updated when architecture or contributor workflow changed
- [ ] Persistence changes were called out if SQLite or managed storage behavior changed
- [ ] The active mounted shell was verified if the PR touches desktop product UI
