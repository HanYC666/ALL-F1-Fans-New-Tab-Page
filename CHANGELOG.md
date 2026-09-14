# Changelog

All notable changes to this project will be documented in this file.

## 0.3.0 - 2026-09-14 (Bug Fixes, Light Mode & Extension Packaging)

### Added
- **Racing Light Mode**: Full light theme with proper CSS variable propagation across every widget, navbar, settings panel, and status elements. No more hardcoded `rgba(255,255,255,...)` anywhere - everything uses tokens now so it actually works.
- **Theme Quick-Toggle Button**: Added ☀️/🌙 icon button to the Waybar for one-click light/dark switching without opening settings at all.
- **Extension Pack Script**: New `scripts/pack.mjs` builds and zips `dist/` into `f1-fans-new-tab.zip` so you can drag-drop install it in Chrome without having to load unpacked every time.

### Changed
- Live search button in the Streams widget now searches for the **current or most recent Grand Prix** automatically (within 12-hour lights-out window counts as current), no more hardcoded Australian GP.
- Streams footer now shows the active GP name and "Direct YouTube search · 0 API keys" instead of the old blank placeholder text.
- Removed the useless "Check" button from the streams session selector bar — it didn't do anything useful anyway.
- Settings panel emoji cleanup — reduced to a single ⚙ on the title only, everything else is text labels now.

### Fixed
- **Settings not updating the UI** — the big one. The `onChange` callback was only calling `applyCssTokens()` but never `rerender()`, so sliders and dropdowns would save to state but widgets would sit there looking exactly the same. Added `rerender()` to the callback, now everything actually reflects changes instantly.
- **Settings state race condition** — storage reads/writes are now properly sequential so rapid slider moves don't write stale state on top of each other.
- **Widget move arrows not working** — layout move functions were broken, fixed the grid coordinate math.
- **Live track status not showing on new tab** — status was only updating after manually hitting the refresh button. Now it loads from cache immediately on startup.
- Fixed manifest permissions and updated `manifest.json` for proper Chrome Web Store compatibility.

---

## 0.2.0 - 2026-09-14 (Hyprland UI Overhaul & Full Telemetry)

### Added
- **Hyprland on Arch Design System**: Complete visual rework featuring frosted glass acrylic widgets (`backdrop-filter: blur(20px)`), customizable tile opacity (20%-100%), dynamic team livery active glowing borders, and customizable gap/rounding.
- **Waybar Top Status Bar**: Live digital clock with blinking colon, live Track Flag status indicator (🟢 Green Flag / 🟡 Safety Car / 🔴 Red Flag) with pulsing dot, quick team livery pill switcher, and search focus hotkey (`/`).
- **Complete Grand Prix Timetable**: Full weekend schedule view for FP1, FP2, FP3, Sprint Shootout, Sprint, Qualifying, and Race with live countdown timers and local/UTC timezone formatting.
- **Championship Standings Hub**: Interactive dual tabs for both **Driver Standings** and **Constructor Standings** with official team color bars, driver codes, and points tally.
- **YouTube Commentary Discovery Engine**: Session selector and 1-click legal live commentary search builder with curated stream channels (P1 with Matt & Tommy, The Race, Sky Sports F1, Autosport, F1 Live).
- **Curated SVG Wallpapers for All 10 Teams**: Handcrafted vector wallpapers for Red Bull, Ferrari, McLaren, Mercedes, Aston Martin, Alpine, Williams, Haas, Stake Sauber, Racing Bulls, and Carbon Grid.
- **Dynamic Wallpaper Engine**: Automatic slideshow timer, random/sequential new tab rotation, and local drag-and-drop image uploads stored in IndexedDB.
- **Speed Dial Shortcuts**: Translucent glass shortcut tiles with high-res Google favicon resolution and instant add/remove.
- **Web App Mode**: Dual support for unpacked Chrome Extension and standalone deployment on GitHub Pages / Vercel with `localStorage` persistence.
- **Development Log**: Created `DEVLOG.md` documenting the design journey and architecture decisions.

### Changed
- Migrated legacy basic cards into modular Hyprland acrylic widgets.
- Upgraded Jolpica and OpenF1 adapters to fetch full session timetables and constructor points.
- Upgraded settings drawer into a tabbed floating control center modal with live preview sliders.

### Fixed
- Fixed layout coordinate clamping and responsive column stacking on tablets/phones.
- Enhanced storage fallback to work seamlessly across both Chrome extension environment and standard web browsers.

---

## 0.1.0 - 2026-08-21

### Added
- Manifest V3 Chrome New Tab extension with Google search, basic F1 dashboard widgets, settings, icons, and storage-only permissions.
- Local state persistence, migration, reset controls, and validated JSON export/import.
- Optional YouTube proxy with structured request validation and server-side credentials.
- Unit tests, build tooling, and source validation.

---

## 0.0.1 - 2026-08-16

- Initial project scaffolding and research.
