# Changelog
Format:
- ##Date (Optional: commit number e.g. 2nd commit if there's multiple commits on the same day)
- ###Added
- ###Changed (if applicable)
- ###Fixed (if applicable)
- ###Removed (if applicable)

## 0.1.0 - 2026-08-21

### Added

- Manifest V3 Chrome New Tab extension with Google search, F1 dashboard widgets, settings, icons, and storage-only permissions.
- Responsive glass-style layout with theme controls, widget visibility, density, opacity, blur, and keyboard-accessible movement.
- Race Weekend and Driver Standings widgets using Jolpica data, with OpenF1 session support, source attribution, loading states, caching, stale fallbacks, and offline handling.
- Local state persistence, migration, reset controls, validated JSON export/import, shortcut management, and safe external URL handling.
- Built-in background metadata, random/sequential/slideshow modes, local image uploads, IndexedDB image storage, validation, resizing, thumbnails, and cleanup.
- Optional YouTube proxy with structured request validation, bounded results, caching, rate limiting, quota handling, channel allowlist annotations, and server-side credentials.
- Direct no-key YouTube search links for use when the optional proxy is not deployed.
- Privacy, provider, licensing, server, release-readiness, and manual Chrome testing documentation.
- Unit tests, build tooling, source validation, and public-repository-safe ignore rules.

### Changed

- Reworked the project from planning and research notes into the current vanilla JavaScript extension implementation.
- Documented the distinction between direct browser YouTube searches and official API-backed proxy results.

### Fixed

- Unsafe shortcut schemes, invalid imported state, oversized or invalid images, broad permissions, exposed client secrets, unsafe dynamic code, and generated source maps are rejected or prevented by the implementation and checks.

-----

## 0.0.2 — 2026-08-18

This is the first working version of the extension. The repository started as notes and a plan; this release contains the actual extension source, build scripts, and tests.

### Added

- Manifest V3 New Tab page with Google search.
- Glass-style responsive dashboard and settings panel.
- Race Weekend and Driver Standings widgets.
- Extension-owned pinned shortcuts with URL checks.
- Jolpica schedule, standings, and results adapter.
- OpenF1 session adapter for future session work.
- Local settings, layout, shortcut, cache, and background persistence.
- Background rotation and local image upload handling.
- Keyboard-friendly widget movement and reduced-motion styles.
- Optional YouTube proxy for structured search results.
- Direct YouTube search link that works without an API key.
- Unit tests, build checks, validation checks, and a manual Chrome checklist.

### Security and reliability changes

- Unsafe shortcut schemes are rejected.
- Imported settings are checked before they are saved.
- Provider requests have timeouts, retries, and cached fallback data.
- The extension asks only for the `storage` permission.
- The YouTube API key is kept out of the extension bundle.

### Still to do before a public release

- Fill in the privacy policy, support, publisher, provider, and image-licence details.
- Decide whether to deploy the optional YouTube proxy.
- Test the built extension in a clean Chrome profile.

-----

## 2026-08-16

- Registered the Chrome Web Store developer account.
- Recorded the $5 USD registration cost.
