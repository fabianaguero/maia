# Security Policy

## Supported Scope

Maia is a local-first desktop application.
Security-sensitive areas include:

- native filesystem access through Tauri commands
- managed local asset storage
- SQLite persistence
- analyzer request handling across Rust and Python
- stream adapters that execute or follow external sources

## Reporting a Vulnerability

If you believe you found a security issue, please do not open a public issue with exploit details first.

Preferred path:

1. Use GitHub Security Advisories if the repository has them enabled.
2. If advisories are not enabled yet, contact the repository owner privately through GitHub.

Please include:

- affected area
- reproduction steps
- expected impact
- whether the issue requires local access, crafted input, or a malicious source

## Disclosure Expectations

- We prefer coordinated disclosure.
- Please give maintainers reasonable time to validate and fix the issue before publishing details.
- Once fixed, a public write-up or advisory is welcome.

## Current Security Notes

- Maia is local-first, but it still executes native code and reads local files.
- Process and stream adapters should be treated as trusted-input boundaries unless explicitly hardened.
- Before public release, maintainers should audit tracked fixtures, logs, media, and service files for accidental sensitive data or redistribution problems.
