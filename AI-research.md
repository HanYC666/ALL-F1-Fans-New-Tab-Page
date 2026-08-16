 # F1 Fans Chrome New Tab — Research and Build Specification

 **Status:** architecture research and implementation plan  
 **Audience:** a small project that should start with minimal code and minimal AI dependency  
 **Recommended stack:** Chrome Extension Manifest V3, vanilla HTML/CSS/JavaScript, IndexedDB for images, and a tiny optional serverless API for live data/search caching.

 ## 1. Executive recommendation

 Build this as a Chrome Extension that overrides the New Tab page. Keep the first release client-side and dependency-light:

 - HTML/CSS for the interface.
 - Vanilla JavaScript modules for widgets and settings.
 - `chrome.storage.local` for preferences and layout.
 - IndexedDB for uploaded background images and thumbnails.
 - Google search form submission for the central search box.
 - A small provider-adapter layer for F1 data.
 - YouTube Data API search only through an optional backend/cache, not with an API key embedded in the extension.

 Do not make AI part of the product. AI can help scaffold code, generate CSS variations, or produce seed configuration once; the installed extension should work without an AI service.

 ## 2. Important Chrome limitation: native pinned items

 A `chrome_url_overrides.newtab` extension replaces Chrome’s entire New Tab document. It cannot preserve Chrome’s native New Tab page underneath the custom page. In particular:

 - Chrome’s native pinned shortcut tiles are not exposed as a supported extension API.
 - The extension cannot read or edit the native New Tab shortcuts directly.
 - `chrome.bookmarks` gives access to bookmarks, not the native New Tab shortcut list.
 - A Google-looking search field can be recreated, but it is an HTML form that sends a query to Google; it is not Chrome’s omnibox.

 Therefore the product should implement a **Pinned shortcuts widget** that users can add to, reorder, rename, remove, and optionally populate from selected bookmarks. This is the closest reliable replacement for native shortcuts.

 If retaining the exact native New Tab page is non-negotiable, a full custom New Tab extension is the wrong architecture. A browser side panel, toolbar popup, or normal web dashboard could coexist with the native page, but it would not deliver the requested full-screen F1 layout.

 ## 3. Target experience

 The page should feel like a translucent, dark, dashboard-style desktop: a full-window F1 background, a central Google search field, draggable glass widgets, strong contrast, and unobtrusive controls.

 Suggested default layout:

 ```text
 ┌──────────────────────────────────────────────────────────┐
 │  F1 Fans                         settings · refresh       │
 │                                                          │
 │             [ Google search field                  ]     │
 │                                                          │
 │  [next session]  [championship]     [live commentary]   │
 │                                                          │
 │  [driver/constructor stats]       [pinned shortcuts]    │
 │                                                          │
 │  image credit / data updated                            │
 └──────────────────────────────────────────────────────────┘
 ```

 Design defaults:

 - `backdrop-filter: blur(...)` with a translucent black/white panel.
 - CSS variables for opacity, blur, border radius, accent color, spacing, and text contrast.
 - A background scrim/gradient so data remains readable over photography.
 - Motion kept subtle and disabled when `prefers-reduced-motion: reduce` is set.
 - Mobile-like responsive layout even though New Tab is normally desktop-first.

 ## 4. Minimum project structure

 ```text
 src/
   manifest.json
   newtab.html
   styles/
     tokens.css
     base.css
     widgets.css
   js/
     app.js
     state.js
     layout.js
     settings.js
     background.js
     search.js
     widgets/
       shortcuts.js
       race-weekend.js
       stats.js
       streams.js
   assets/
     backgrounds/
     icons/
   data/
     teams.json
     default-layout.json
 ```

 Start without a framework or build step. Add Vite only when modules/assets become inconvenient. Avoid React, Tailwind, a database, and a backend in the MVP unless they solve a demonstrated problem.

 ## 5. Manifest and permissions

 Minimal initial manifest:

 ```json
 {
   "manifest_version": 3,
   "name": "F1 Fans New Tab",
   "version": "0.1.0",
   "description": "A customizable F1 dashboard for Chrome's New Tab page.",
   "chrome_url_overrides": {
     "newtab": "newtab.html"
   },
   "permissions": ["storage"],
   "action": {
     "default_title": "F1 Fans settings"
   }
 }
 ```

 Add permissions only when a feature needs them:

 - `unlimitedStorage` only if uploaded image storage exceeds normal extension storage limits; IndexedDB is still the better image store.
 - `bookmarks` only if importing bookmarks is explicitly offered.
 - Host permissions for a provider API only when calling that provider directly from the extension.
 - Avoid `tabs`, `history`, `<all_urls>`, and broad host permissions in the first release.

 ## 6. Google-style search

 Implement a normal-looking search form:

 ```html
 <form action="https://www.google.com/search" method="get">
   <input name="q" type="search" autocomplete="off" placeholder="Search Google" />
 </form>
 ```

 This gives the expected Google result page and requires no API key. It does not search the browser’s omnibox and cannot reproduce all Chrome search-provider behavior. Add keyboard focus on load only if it does not interfere with accessibility or widget keyboard use.

 ## 7. F1 data: provider strategy

 Do not couple widgets directly to one API. Define a normalized internal model and write one adapter per source.

 ### Recommended sources

 | Source | Best use | Constraints |
 |---|---|---|
 | Jolpica F1 API | schedules, results, standings, drivers, constructors | Ergast-compatible public API; verify current rate limits and availability before production |
 | OpenF1 | session timing, laps, positions, telemetry-like live data | Excellent for live/session data; endpoint availability, historical coverage, and rate limits must be checked per feature |
 | FIA / official F1 pages | official classifications, notices, calendars, regulations | Prefer linking to official pages; do not scrape aggressively or assume an undocumented API |
 | FastF1 | deep historical analysis and Python workflows | A Python library, not a direct browser API; useful for a future backend, not MVP client code |
 | Ergast-compatible mirrors | fallback for historical data | Treat as fallbacks and cache responses; validate schema differences |

 The UI should show the source and last-updated timestamp. If a provider fails, the widget should display cached data and a small stale-data indicator rather than breaking the page.

 ### Normalized examples

 ```js
 {
   session: {
     meetingName: "Monaco Grand Prix",
     sessionName: "Practice 2",
     startsAt: "2026-05-22T14:00:00Z",
     status: "scheduled",
     source: "jolpica"
   },
   standings: {
     season: 2026,
     drivers: [{ position: 1, name: "...", points: 0, team: "..." }],
     constructors: [{ position: 1, name: "...", points: 0 }]
   }
 }
 ```

 Cache data with a provider-specific TTL. A reasonable first policy is 10–60 minutes for schedules/standings and 15–60 seconds for active-session data. Never poll live endpoints on every new-tab open without a visibility check and backoff.

 ## 8. Legal YouTube commentary search

 The extension should search for legal, publicly available commentary streams—not download, proxy, rebroadcast, or bypass region/paywall restrictions.

 ### Search architecture

 A browser-only call to YouTube Data API is technically possible but has two major problems:

 1. The API key is shipped to users and can be extracted and abused.
 2. `search.list` consumes quota (the documented search operation is expensive relative to many read operations), and every New Tab open can multiply usage.

 Recommended flow:

 ```text
 extension → your small serverless endpoint → YouTube Data API → cached safe result list
 ```

 The endpoint should receive a structured request such as:

 ```json
 {
   "season": 2026,
   "grandPrix": "Monaco",
   "session": "FP2",
   "language": "en"
 }
 ```

 It generates a conservative query such as:

 ```text
 Monaco Grand Prix FP2 live commentary 2026
 ```

 Use YouTube API filters where supported:

 - `type=video`
 - `eventType=live` when searching currently live content
 - `order=date` or `order=relevance` depending on the UI
 - `publishedAfter` / `publishedBefore` for race-weekend relevance
 - a low `maxResults` value such as 5–10

 Store only metadata and links, then open the official YouTube page or use the official YouTube embed/player where allowed. Do not present a stream as “official” unless the channel is verified or explicitly allowlisted.

 ### Legal/safety filtering

 The search result is not proof that a stream is authorized. Use a configurable allowlist of known official broadcasters, teams, series partners, radio/commentary channels, and trusted creators. Show:

 - channel name
 - title
 - live/upcoming status
 - YouTube URL
 - a label such as “found on YouTube — verify rights in your region” unless verified

 Never scrape YouTube HTML as the primary integration. It is brittle and can violate platform expectations. Respect YouTube API Terms, embed restrictions, copyright, broadcaster territory restrictions, and the user’s local laws.

 ### Search timing

 Do not search on every page load. Search only when:

 - the user opens/refreshes the Streams widget;
 - the selected session changes;
 - a cached result expires;
 - the user clicks “find streams”.

 Cache results by `(season, meeting, session, language)` and use a short race-weekend TTL. Offer a manual refresh.

 ## 9. Background system

 Use a background manifest such as:

 ```js
 {
   id: "red-bull-01",
   team: "red-bull",
   src: "assets/backgrounds/red-bull-01.webp",
   credit: "...",
   license: "..."
 }
 ```

 Built-in themes should ship with properly licensed images. Do not copy random team photography from search results. Keep an asset manifest with creator, source, license, and attribution text.

 Theme settings:

 - team/theme filter: all, Red Bull, Ferrari, McLaren, Mercedes, etc.;
 - mode: static, random per New Tab, sequential per New Tab, timed slideshow;
 - interval: seconds or minutes for slideshow mode;
 - fit: cover, contain, or blurred cover;
 - overlay strength;
 - optional color accent;
 - reduce motion.

 Deterministic sequential rotation is easier to reason about than random rotation. Store `lastBackgroundId` and `sequenceIndex` in `chrome.storage.local`. For random mode, avoid repeating the last image when at least two images are available.

 User-uploaded images:

 - accept only browser-decodable raster formats initially: JPEG, PNG, WebP;
 - enforce a file-size and pixel-count limit before decoding;
 - use `createImageBitmap` or an offscreen canvas to resize/compress;
 - store the resulting Blob and metadata in IndexedDB;
 - use `URL.createObjectURL` only while the page is active;
 - revoke object URLs when replacing images;
 - keep original files optional; storing a compressed derivative saves space;
 - never upload images to a server unless cloud sync is explicitly added later.

 Basic image record:

 ```js
 {
   id: "user-uuid",
   blob: Blob,
   name: "my-f1-wallpaper.webp",
   team: "red-bull",
   createdAt: 1770000000000,
   credit: "Personal upload",
   enabled: true
 }
 ```

 ## 10. Customizable widget GUI

 Use CSS Grid for the default arrangement and a layout model for customization. Do not make every widget absolutely positioned on day one.

 ```js
 {
   widgets: {
     stats: {
       visible: true,
       x: 1, y: 1, w: 4, h: 3,
       opacity: 0.72,
       blur: 18,
       locked: false
     }
   },
   theme: {
     panelOpacity: 0.72,
     panelBlur: 18,
     radius: 18,
     accent: "#e10600"
   }
 }
 ```

 MVP controls:

 - show/hide widget;
 - drag widget by a visible handle;
 - resize using a simple size menu rather than freeform resize;
 - change opacity and blur;
 - lock layout;
 - reset layout;
 - choose compact/comfortable density.

 Later, add pointer-based drag-and-drop with keyboard equivalents. Every draggable control needs a keyboard-accessible alternative; a visually impressive layout that cannot be operated without a mouse is a usability regression.

 Avoid using arbitrary user-entered CSS. Store constrained numeric values and validated color strings to reduce rendering and security problems.

 ## 11. State and persistence

 Use separate stores by purpose:

 - `chrome.storage.local`: settings, widget layout, selected theme, shortcuts, cached small JSON data.
 - IndexedDB: uploaded image Blobs, generated thumbnails, larger cached payloads.
 - In-memory state: current page session, object URLs, active timers.

 Add a settings export/import feature using JSON. It should export preferences and metadata, but either omit image Blobs or package them separately as a user-initiated download. Include schema versioning:

 ```js
 { schemaVersion: 1, settings: {...}, widgets: {...}, shortcuts: [...] }
 ```

 ## 12. Suggested build phases

 ### Phase 1 — functional shell

 - Manifest V3 New Tab override.
 - Central Google search form.
 - Default glassmorphism layout.
 - One built-in background.
 - Static shortcut widget.
 - Settings panel with opacity, blur, and reset.

 ### Phase 2 — useful F1 dashboard

 - Current season schedule.
 - Next session countdown.
 - Driver/constructor standings.
 - Provider adapters, cache, source labels, stale-state UI.

 ### Phase 3 — image gallery

 - Team-filtered built-in asset manifests.
 - User uploads and IndexedDB.
 - Static/random/sequential/slideshow modes.
 - Resize/compress/remove/credit controls.

 ### Phase 4 — layout editor

 - Drag-and-drop grid.
 - Resize presets.
 - Widget lock mode.
 - Import/export settings.
 - Keyboard accessibility and reduced-motion behavior.

 ### Phase 5 — streams

 - Session selector generated from the schedule.
 - Optional serverless YouTube search proxy.
 - Cache and manual refresh.
 - Verified/allowlisted channel policy.
 - Region/copyright disclaimer and links to official YouTube pages.

 ## 13. What not to build first

 Defer these until the basic extension is reliable:

 - real-time telemetry dashboards;
 - account login and cloud sync;
 - arbitrary third-party scraping;
 - automatic “legal” determination of YouTube streams;
 - a full theme marketplace;
 - AI-generated wallpaper at runtime;
 - freeform pixel-perfect window management;
 - a custom search engine.

 These features add backend, privacy, quota, legal, or maintenance complexity without validating the core New Tab experience.

 ## 14. Security, privacy, and reliability

 - Keep the extension’s Content Security Policy restrictive; do not use `eval` or inline script execution.
 - Treat provider responses as untrusted data; render text with `textContent`, not `innerHTML`.
 - Validate URLs before opening them and allow only `https:` links for external content.
 - Do not inject remote JavaScript into the extension page.
 - Do not put private API keys in `manifest.json`, source files, or frontend storage.
 - Explain exactly what data is stored locally.
 - Provide “clear local data” and “export settings” controls.
 - Handle offline mode gracefully: cached standings, local backgrounds, and a visible offline badge.
 - Use abortable fetch requests and timeouts so a dead provider cannot freeze the New Tab.
 - Keep the page fast: lazy-load non-visible widgets and never decode the entire image gallery at startup.

 ## 15. Testing checklist

 ### Chrome behavior

 - Load unpacked extension and verify New Tab override.
 - Confirm Google search works with spaces, punctuation, and empty input.
 - Confirm shortcut links open in the intended tab behavior.
 - Test fresh profile, normal profile, incognito policy behavior, and extension reload.

 ### Layout

 - Test small laptop, ultrawide monitor, zoom at 125–200%, and light/dark OS preferences.
 - Verify text contrast over every built-in background.
 - Verify layout reset and schema migration.
 - Verify keyboard navigation, focus visibility, screen-reader labels, and reduced motion.

 ### Data

 - Simulate offline mode, 429 rate limits, malformed responses, and stale cache.
 - Confirm one failed provider does not hide other widgets.
 - Confirm countdowns handle timezone conversion and daylight-saving changes.

 ### Images

 - Test large images, unsupported files, transparent PNGs, duplicate uploads, and quota pressure.
 - Confirm object URLs are revoked and deleted images disappear after reload.

 ### Streams

 - Test no results, upcoming events, currently live events, ended events, region-restricted links, and API quota failures.
 - Confirm the product never claims a stream is legal merely because YouTube returned it.

 ## 16. Concrete MVP acceptance criteria

 The first shippable version is complete when:

 1. Opening a New Tab shows the custom F1 page in under roughly one second on a warm load.
 2. The central search field sends queries to Google.
 3. Users can manage their own shortcut tiles, since native Chrome pinned tiles cannot be retained.
 4. At least one F1 schedule/standings provider is displayed with source and update time.
 5. The page works with no network using a local background and cached/default layout.
 6. Users can change widget opacity, blur, visibility, and layout reset.
 7. Users can choose a static or rotating built-in background.
 8. The extension requests only permissions it actually uses.
 9. No YouTube API key is exposed in the shipped extension.
 10. Uploaded images remain local and can be removed.

 ## 17. Official/reference links checked for this research

 - [Chrome Manifest reference](https://developer.chrome.com/docs/extensions/reference/manifest)
 - [Override Chrome pages, including New Tab](https://developer.chrome.com/docs/extensions/develop/ui/override-chrome-pages)
 - [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
 - [Declare extension permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
 - [YouTube Data API `search.list`](https://developers.google.com/youtube/v3/docs/search/list)
 - [YouTube Data API quota costs](https://developers.google.com/youtube/v3/determine_quota_cost)
 - [YouTube embedded player parameters](https://developers.google.com/youtube/player_parameters)
 - [Jolpica F1 API](https://api.jolpi.ca/ergast/f1/)
 - [OpenF1 documentation](https://openf1.org/docs/)
 - [FIA official site](https://www.fia.com/)

 URLs were checked on 2026-08-16. API availability, quotas, terms, calendar data, and broadcaster rights can change; re-check them before production release.

 ## Bottom line

 The project is very feasible as a small vanilla extension. The two areas that need deliberate architecture are (1) replacing, rather than preserving, Chrome’s native pinned shortcuts and (2) treating YouTube search as a cached, user-triggered discovery feature with rights-aware presentation. Build the visual shell and local customization first; add live data and streams only after the offline dashboard is pleasant and fast.
