# GitHub Publish Checklist

Use this before switching the repository to public visibility on GitHub.

## Required Before Public Release

- Choose and add a `LICENSE`.
- Verify the public repository name, description, and topics.
- Review `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md`.
- Confirm that `docs/open-source-maintainer-guide.md` reflects the active runtime.
- Review `docs/demo-assets-and-fixtures.md` and decide which demo artifacts should stay public.

## Architecture Sanity Check

- Confirm that `desktop/src/main.tsx` still mounts the shell you want contributors to treat as active.
- Confirm that cross-runtime changes still flow through `contracts/`.
- Confirm that Rust remains the persistence and native-runtime boundary.
- Confirm that Python remains the analysis boundary.

## Data and Secret Audit

- Scan the repo for credentials, tokens, or embedded secrets.
- Review sample logs and fixtures for real IPs, tokens, internal URLs, or user data.
- Review tracked helper files for machine-specific paths or unrelated tooling.
- Review media assets and audio files for redistribution rights before publishing them publicly.

## Product and Repo Hygiene

- Decide whether `App.tsx` stays in-repo as an alternate shell or should be retired to avoid contributor confusion.
- Remove obsolete files or clearly label them as legacy or experimental.
- Keep historical implementation reports under `docs/archive/` instead of the repository root.
- Verify that browser/mock fallbacks do not misrepresent unsupported native behavior.
- Check that the roadmap and README do not promise features that are intentionally deferred.

## GitHub Features To Enable

- Issues
- Pull requests
- Discussions, if you want community design or product threads
- Security Advisories
- Branch protection on the default branch

## Nice To Have

- Add screenshots or a short GIF of the active desktop monitor flow.
- Add a small architecture diagram to the repository home page or wiki.
- Add labels for `bug`, `enhancement`, `docs`, `frontend`, `rust`, `python`, and `contracts`.
- Add a first-project board or milestone grouping for open-source onboarding work.

## Current Repo Notes

Based on a quick pre-publication pass, these items deserve explicit review:

- sample production log fixtures under `analyzer/fixtures/logs/`
- generated helper scripts and demo artifacts such as `scripts/demo/tropical_log_gen.py`, `scripts/verification/`, and `demo/audio/`
- tracked non-runtime demo assets under `demo/`
- deployment references for the landing site under `site/` and `README.md`
