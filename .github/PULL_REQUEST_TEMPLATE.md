## Summary

- What changed
- Why this change exists
- Which user or maintainer flow it affects

## Validation

- [ ] `cd desktop && npm run quality`
- [ ] `cd desktop && npm run coverage` or focused desktop tests
- [ ] `python3 -m pytest analyzer/tests -v` or focused analyzer tests
- [ ] Manual smoke test completed when UI/runtime behavior changed

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
