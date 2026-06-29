# Verification Scripts

These scripts are optional helpers for generating demo renders and sanity-checking analyzer behavior against synthetic or bundled fixtures.

Typical usage:

```bash
python3 scripts/verification/generate_heartbeat_demo.py
python3 scripts/verification/verify_normal_log.py
python3 scripts/verification/verify_real_crash.py
```

Notes:

- Outputs are written under `demo/audio/`.
- Temporary scratch inputs are written under `.run/verification/`.
- `verify_hybrid_remix.py` accepts `MAIA_REFERENCE_TRACK=/path/to/track.mp3` when you want to test a real external track.
