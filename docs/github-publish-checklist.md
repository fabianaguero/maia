# GitHub Publish Checklist

Use this before switching the repository to public visibility on GitHub.

## Required Before Public Release

- Choose and add a `LICENSE`.
- Add a real `.github/CODEOWNERS` file with actual maintainer handles before opening the repository to outside contributors.
- Verify the public repository name, description, and topics.
- Review `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md`.
- Review `SUPPORT.md` and `MAINTAINERS.md`.
- Confirm that `docs/open-source-maintainer-guide.md` reflects the active runtime.
- Confirm that `docs/frontend-architecture.md` reflects the mounted desktop shell.
- Confirm that `docs/pre-release-manual-test-plan.md` still matches the active monitor flow.
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
- Verify that local developer config files are not included in the public commit. In particular, do not publish `.codex/config.toml` unless it has been intentionally sanitized and documented.
- Verify that previous monitor sessions with missing log files or missing tracks are marked as lost and can be cleaned from the UI instead of failing silently.

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

Based on the pre-publication pass, these areas were reviewed for public release:

- sample log fixtures under `analyzer/fixtures/logs/` and `desktop/test/logs/`
- maintainer-local absolute paths in archived docs and planning docs
- Cloud Run / reservation examples in tests and analyzer fixtures
- generated helper scripts and demo artifacts such as `scripts/demo/tropical_log_gen.py`, `scripts/verification/`, and `demo/audio/`
- tracked non-runtime demo assets under `demo/`
- deployment references for the landing site under `site/` and `README.md`

The remaining release decision is not code hygiene; it is whether every retained demo/audio asset is intentionally redistributable.

## Practical Release Sequence

For a pragmatic first public release, use this order:

1. Confirm the worktree only contains intentional product/docs changes. Exclude local agent config and machine-specific files.
2. Run `make quality-pre-commit` and fix anything red before committing.
3. Run `make quality-pre-push` and confirm CI-equivalent checks are green before pushing.
4. Run the desktop manual flow in `docs/pre-release-manual-test-plan.md`.
5. Review demo assets and fixtures for redistribution intent and anonymization.
6. Review README and contributor docs from the perspective of a first-time outsider.
7. Only then switch the repository visibility or cut a public tag.

## Current Publication State

As of this checklist update, the repository is closer to a public MVP but should not be published blindly.

- The desktop refactor has reduced the largest shell and monitor-screen risks, and the active flow is more modular.
- Previous-session replay now validates physical log/track availability and exposes a lost-session cleanup path.
- The local quality gates pass, including desktop/site strict checks and Rust formatting/clippy.
- A bounded fixture/secret audit was run over tracked files; remaining `/webhooks/log` references are generic test endpoints.
- One complete manual app run is still recommended before switching GitHub visibility or cutting a public tag.
