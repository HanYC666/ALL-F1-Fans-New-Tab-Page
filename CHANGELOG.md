# Changelog

All notable changes to this project will be documented in this file.

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
