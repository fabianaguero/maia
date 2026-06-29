# Support

Maia is published as a local-first open source project under the MIT license.
This file explains where to ask for help and what kind of support to expect.

## Where to ask

- Bug reports: open a GitHub Issue using the `Bug report` template.
- Feature proposals: open a GitHub Issue using the `Feature request` template.
- Security concerns: do **not** open a public issue. Follow [SECURITY.md](SECURITY.md).
- Contributor workflow questions: read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/open-source-maintainer-guide.md](docs/open-source-maintainer-guide.md) first.

## What to include

For runtime problems, include:

- OS and version
- whether the issue happens in `tauri` desktop mode or browser/mock mode
- the active source type: file, folder/repository, Cloud Run, or another adapter
- a minimal reproduction path
- screenshots, logs, or a short recording when relevant

For monitoring bugs, also include:

- whether the source is a local file or a stream adapter
- whether guide-track playback was active
- whether the problem is visual, audio, or synchronization-related

## Support scope

Maintainers try to help with:

- reproducible bugs in the active desktop app
- analyzer contract regressions
- contributor onboarding questions
- documentation gaps that block contribution

Maintainers may not provide:

- private consulting
- guaranteed response times
- support for heavily modified local forks
- production operations support for third-party deployments

## Current project reality

The repository contains active product code plus some alternate and experimental surfaces.
The mounted desktop entrypoint today is still:

- `desktop/src/main.tsx`
- rendering `desktop/src/App-v0.tsx`

If you report or investigate a desktop UI issue, start there unless a maintainer says otherwise.

## Before opening an issue

Please check:

- [README.md](README.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/frontend-architecture.md](docs/frontend-architecture.md)
- [docs/github-publish-checklist.md](docs/github-publish-checklist.md) if your question is about public release readiness
