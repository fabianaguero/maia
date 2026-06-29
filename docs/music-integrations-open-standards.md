# Music integrations and open-standards strategy

**Last Updated:** June 2026

## Goal

Maia should stay as free, open-source, customizable, local-first, and service-agnostic as possible while still making it practical to connect to music libraries, playlists, and track references. Spotify and SoundCloud are only examples of possible proprietary adapters, not the center of the strategy.

There is no single universal open standard that solves playlists, metadata, rights, discovery, playback, and downloadable audio across the whole music industry. Maia should therefore use the most open combination available for each layer: local files for audio, XSPF/M3U8 for playlists, MusicBrainz/ISRC for identifiers, open catalogs for metadata and discovery, and optional provider adapters only at the edges.

The product direction is not to become a cloud music locker, paid-streaming client, or streaming-rights workaround. Maia should prefer free/open services and user-owned local audio. Proprietary services should enrich a local Maia library only when the user explicitly connects them, and Maia must still work without those integrations.

## Research snapshot

### Open standards and free/open ecosystems to prioritize

1. **Local files and folders remain the primary ingestion path.** This is the most open, offline-capable, free, and legally clear path for waveform analysis, beat grids, BPM curves, stems, and long-running local sonification.
2. **XSPF should be Maia's canonical portable playlist interchange format.** XSPF is an open XML playlist format, is simple enough to inspect, and supports stable identifiers plus metadata extensions. Maia can add namespaced metadata for `musical_asset`, BPM, beat-grid summary, source adapter ID, and local managed-storage references without binding the core model to a vendor.
3. **M3U8 should be supported as the low-friction compatibility format.** M3U is a de facto playlist format rather than a formal open standard, but it is widely supported and can point at local paths or URLs. Maia should prefer UTF-8 `.m3u8` for export and treat imported entries as unresolved references until each item is matched to a local file, open catalog ID, or provider track ID.
4. **MusicBrainz IDs should be the preferred open music identity layer.** MusicBrainz provides open music metadata, stable identifiers, and CC0 core data suitable for cross-service matching. Maia should store MBIDs when available, plus ISRC, artist/title/album/duration, and normalized fingerprints or hashes when computed locally.
5. **ListenBrainz should be the preferred open recommendation/listening-history service.** It is part of the MetaBrainz ecosystem, can work with MusicBrainz identifiers, and is a better fit for a free/open Maia recommendation layer than proprietary personalization APIs.
6. **Internet Archive should be considered for public-domain, live, netlabel, and community audio discovery.** Its metadata APIs can identify items and files, but Maia should still verify each item's license and derive analysis only from audio the user is allowed to use.
7. **Jamendo and similar Creative Commons catalogs can be optional free-music adapters.** They are useful for demo tracks, free/independent music discovery, and legally downloadable assets when license terms permit Maia analysis and remix-like workflows.
8. **Cover Art Archive can enrich local metadata without introducing a streaming dependency.** It can be used for album-art lookup by MusicBrainz release ID, with local caching and clear copyright attribution.
9. **Open playlist and library import should be adapter-based.** Each adapter should convert external input into Maia's existing `musical_asset` entities and playlist anchors rather than introducing service-specific entities.

### Proprietary provider feasibility: Spotify and SoundCloud

Spotify and SoundCloud should be deprioritized behind free/open services. They are useful examples of optional adapters because users may already have playlists there, but Maia should not require either service and should not design core workflows around them.

Spotify can import a user's playlist structure and catalog metadata, but it should not be treated as a source of raw audio for Maia analysis. The Web API supports retrieving metadata, creating/managing playlists, and playback control. User-authorized access is scope-based, so Maia would need a local OAuth flow and narrowly requested scopes such as playlist-read access for playlist import. Recommended Spotify scope for Maia MVP: read-only playlist discovery and local-file matching only. Do not require playback-control scopes unless a later feature explicitly controls Spotify playback outside Maia.

SoundCloud is more creator-friendly than Spotify for public tracks, search, uploads, and playlist-like sets, but still requires an API adapter and OAuth for private/user-specific data. Maia can use SoundCloud to import user-permitted track and playlist metadata, resolve public links where the API and terms allow, and preserve canonical URLs for attribution. Recommended SoundCloud MVP: import metadata and references, then analyze only local files or explicitly downloadable/owned audio sources.

For both services, the default behavior should be metadata-only import plus local matching. Maia should never depend on paid accounts, DRM bypasses, unofficial scraping, or streaming-audio capture.

### Other likely adapters

- **Local DJ libraries:** Rekordbox XML, Traktor NML, Serato crates, Mixxx SQLite/XML, and Apple Music/iTunes XML are strategically valuable because they are closer to DJ workflows and often reference local files Maia can analyze legally and offline.
- **Open media servers:** Navidrome/Subsonic-compatible APIs, Jellyfin, Plex, and DLNA/UPnP can fit Maia's local-first posture when the user controls the server.
- **Free/open music catalogs:** MusicBrainz, ListenBrainz, Internet Archive, Jamendo, Free Music Archive-compatible catalogs, and Creative Commons catalogs should come before paid/proprietary services when they provide enough metadata or downloadable audio.
- **Bandcamp and direct artist stores:** prioritize URL/bookmark import and local file matching rather than scraping or assuming API availability.
- **Podcast/radio streams:** RSS, OPML, and HLS/M3U8 can be reference inputs, but live-stream capture should be explicit and rights-aware.

## Proposed architecture

### Provider-neutral contracts

Add a provider-neutral import layer around the existing `musical_asset` model:

- `MusicProviderAdapter`
  - `id`: stable adapter key, for example `local-folder`, `xspf`, `m3u8`, `spotify`, `soundcloud`, `musicbrainz`, `rekordbox-xml`.
  - `capabilities`: `playlist_import`, `playlist_export`, `metadata_lookup`, `playback_control`, `download_reference`, `local_file_resolution`.
  - `auth_kind`: `none`, `oauth_pkce`, `api_token`, or `local_file`.
  - `import_playlist(source)`: returns provider-neutral playlist references.
  - `resolve_track(reference)`: returns metadata plus a local playable path only when legal and available.

- `ExternalTrackReference`
  - `provider_id`
  - `provider_track_id`
  - `canonical_url`
  - `title`, `artists`, `album`, `duration_ms`
  - `isrc`, `musicbrainz_recording_id`, `musicbrainz_release_id`
  - `rights_hint`: `local_file`, `streaming_only`, `downloadable`, `unknown`
  - `local_match_asset_id`: optional link to a Maia-managed local track snapshot

- `PortablePlaylist`
  - ordered references to Maia assets and/or unresolved external track references
  - optional XSPF extension metadata for Maia analysis summaries
  - optional M3U8 export view for compatibility

### Storage posture

Keep Maia local-first:

- Store OAuth tokens only in the OS keychain/secure storage, not in SQLite plaintext.
- Store provider IDs and portable metadata in SQLite.
- Store analyzed audio artifacts only for local files or user-provided downloadable files Maia has copied into managed storage.
- Cache cover art and metadata with explicit provenance.
- Make every network integration optional at build and runtime so Maia remains useful offline.

### UX posture

The UI should feel like a desktop DJ analyzer:

1. **Import source picker:** Local Folder, Playlist File (`.xspf`, `.m3u8`), DJ Library, Spotify, SoundCloud, MusicBrainz Lookup.
2. **Resolution panel:** show which playlist rows are fully local/analyzable, metadata-only, unresolved, or streaming-only.
3. **Localize button:** help the user match external playlist items to local files already on disk.
4. **Open-standard export:** export Maia playlists as XSPF and M3U8, with optional sidecar `maia-playlist.json` for deterministic Maia-specific analysis metadata.
5. **Provider badges:** clearly distinguish local assets from Spotify/SoundCloud references so users understand what can be analyzed, played, or exported.

## Recommended implementation order

1. **Open playlist foundation**
   - Import/export XSPF.
   - Import/export M3U8.
   - Add provider-neutral `ExternalTrackReference` types in TypeScript and JSON contracts.
2. **Local DJ library adapters**
   - Rekordbox XML and Mixxx library import first because they map directly to local files and DJ workflows.
3. **MusicBrainz + ListenBrainz foundation**
   - Lookup and store MBIDs/ISRCs for local tracks.
   - Add optional ListenBrainz import/export for listens, recommendations, and playlist-like discovery.
   - Optional Cover Art Archive enrichment.
4. **Free/open audio discovery adapters**
   - Internet Archive metadata/search and license-aware item resolution.
   - Jamendo or similar Creative Commons catalog metadata/downloadable-track import where licenses permit analysis.
5. **Self-hosted and local-server adapters**
   - Navidrome/Subsonic-compatible, Jellyfin, Plex, and DLNA/UPnP metadata/local playback references.
6. **Proprietary adapters only after the free/open base works**
   - SoundCloud: OAuth, search, track/set metadata import, public URL attribution, local/downloadable-only analysis.
   - Spotify: OAuth PKCE, playlist metadata import, provider ID preservation, local matching, no audio analysis from Spotify streams.
7. **Advanced sync/export**
   - Export Maia playlists to XSPF/M3U8 and optionally write back provider playlists only after explicit user opt-in and provider-specific review.

## Non-goals and guardrails

- Do not make Spotify, SoundCloud, paid APIs, or any proprietary service required for core Maia workflows.
- Do not download, cache, analyze, or stem-separate streaming-service audio unless the provider explicitly allows it and the user has rights to the audio.
- Do not add a cloud backend for provider sync in the MVP.
- Do not let provider-specific metadata leak into the core domain model as required fields.
- Do not use unofficial scraping as an integration strategy.
- Do not require paid provider accounts for basic Maia playlist import, metadata matching, or demo music workflows.

## Decision

Maia should prioritize the most open and free path available in this order: local files/folders, XSPF, M3U8, MusicBrainz/ISRC metadata, ListenBrainz, Internet Archive, Creative Commons/free-music catalogs, self-hosted media servers, DJ-library imports, and only then optional proprietary service adapters. Spotify and SoundCloud remain feasible as optional playlist/metadata/reference adapters, not as primary audio sources and not as required dependencies. This keeps Maia free-software-friendly, customizable by local config and plugins, and aligned with its local-first desktop architecture.

## Sources reviewed

- MusicBrainz project, API, database, and data-license documentation: open music metadata, REST API, CC0 core data, and identifiers.
- ListenBrainz documentation: open listening history, recommendations, and playlist-like discovery in the MetaBrainz ecosystem.
- Internet Archive developer documentation: metadata APIs for archive.org items and files.
- Jamendo developer documentation: API access to Creative Commons/free-music catalog metadata and license details.
- XSPF specification: open XML playlist format.
- M3U/M3U8 references: widely supported de facto playlist format with local paths and URLs.
- Spotify Web API and authorization documentation: useful only as an optional metadata/playlist adapter with scope-gated user authorization.
- SoundCloud API guide and OpenAPI explorer: useful only as an optional metadata/reference adapter with OAuth-backed endpoints.
