# 🏎️ HYPR//F1 — Formula 1 Command Center & New Tab Page

> A sleek, high-performance motorsport command center & Chrome New Tab extension inspired by **Hyprland on Arch Linux**. Features live F1 countdowns, full weekend session timetables, championship standings, YouTube commentary stream discovery, speed-dial shortcuts, and curated team wallpapers.

![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)
![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-blue.svg)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen.svg)
![Live Telemetry](https://img.shields.io/badge/API-Jolpica%20%26%20OpenF1-orange.svg)

---

## ✨ Features

- **🪟 Hyprland-Inspired Glassmorphism**:
  - Frosted acrylic backdrop blur (`backdrop-filter: blur(20px)`).
  - Customizable tile opacity (20% to 100% translucent glass).
  - Dynamic active border glow matched to your favorite F1 team's livery colors.
  - Customizable corner radius (`0px` to `36px`) and tiling gap (`4px` to `36px`).

- **📟 Waybar Top Status Bar**:
  - Real-time digital clock and date with blinking colon.
  - Live Track / Session status pill (🟢 `TRACK GREEN` / 🟡 `SAFETY CAR` / 🔴 `RED FLAG`) with pulsing dot.
  - Quick-switch pill bar for all 10 F1 teams (Red Bull, Ferrari, McLaren, Mercedes, Aston Martin, Alpine, Williams, Haas, Stake Sauber, Racing Bulls).
  - Quick search focus button (or press `/` anywhere on the page).

- **🏁 Grand Prix Weekend Hub**:
  - Live ticking countdown to the very next event.
  - Full session timetable: **FP1, FP2, FP3, Sprint Shootout, Sprint, Qualifying, and Grand Prix Race**.
  - Start times automatically converted to your browser's local timezone (or UTC).
  - Dynamic status badges: `COMPLETED`, `LIVE`, `NEXT`, `UPCOMING`.

- **🏆 Championship Standings Hub**:
  - Interactive tabs for **Drivers Championship** and **Constructors Championship**.
  - Official team color stripes, driver codes (e.g. `VER`, `NOR`, `LEC`), team names, points tally, and win counters.

- **📺 YouTube Commentary & Stream Discovery**:
  - Smart session selector (Race Commentary, Qualifying Live, Free Practice, Post-Race Analysis).
  - 1-click legal live commentary search (P1 with Matt & Tommy, The Race, Sky Sports F1, Autosport, F1 Live).
  - Works 100% client-side with zero API keys required.

- **🖼️ Curated Wallpapers & Dynamic Background Engine**:
  - Built-in handcrafted SVG motorsport speedline wallpapers for every team.
  - Multiple rotation modes: **Random per tab**, **Sequential per tab**, **Live auto-slideshow timer (5s - 180s)**, or **Static**.
  - Drag-and-drop custom image uploader with local IndexedDB storage.

- **🔗 Pinned Shortcuts Speed-Dial**:
  - Translucent glass speed-dial tiles with automatic high-resolution Google favicon resolution.
  - Quick "+ Add Link" and hover delete.

- **⚙️ Hyprland Control Center**:
  - Floating modal with live preview sliders for opacity, blur, corner rounding, gap spacing, and color accents.
  - JSON settings export, import, layout reset, and local data wiping.

---

## 🏗️ Architecture & Project Structure

```text
ALL-F1-Fans-New-Tab-Page/
├── src/
│   ├── manifest.json              # Chrome Manifest V3 configuration
│   ├── newtab.html                # Main New Tab markup & Waybar
│   ├── assets/
│   │   └── backgrounds/           # Curated SVG wallpapers for all 10 teams
│   │       ├── circuit-dark.svg
│   │       ├── red-bull.svg
│   │       ├── ferrari.svg
│   │       ├── mclaren.svg
│   │       ├── mercedes.svg
│   │       └── ...
│   ├── data/
│   │   ├── teams.json             # F1 teams metadata and livery colors
│   │   ├── built-in-backgrounds.json # Wallpaper registry
│   │   └── default-layout.json    # Default widget coordinates
│   ├── js/
│   │   ├── app.js                 # App entrypoint & Waybar lifecycle
│   │   ├── state.js               # State validation & default settings
│   │   ├── storage.js             # chrome.storage & localStorage hybrid
│   │   ├── layout.js              # Hyprland grid manager & drag handles
│   │   ├── background.js          # Wallpaper playlist & slideshow engine
│   │   ├── indexeddb.js           # Client-side image database
│   │   ├── search.js              # Multi-engine search & '/' hotkey
│   │   ├── providers/
│   │   │   ├── jolpica.js         # Jolpica schedule & standings adapter
│   │   │   ├── openf1.js          # OpenF1 sessions adapter
│   │   │   └── provider-utils.js  # Live countdown & date formatters
│   │   └── widgets/
│   │       ├── race-weekend.js    # Grand Prix timetable widget
│   │       ├── standings.js       # Drivers & Constructors standings
│   │       ├── streams.js         # YouTube commentary finder
│   │       ├── shortcuts.js       # Speed dial shortcuts
│   │       └── settings.js        # Hyprland customizer modal
│   └── styles/
│       ├── tokens.css             # Hyprland tokens & team livery variables
│       ├── base.css               # Typography, scrollbars & reset
│       ├── layout.css             # Waybar topbar & 12-column grid
│       ├── widgets.css            # Bespoke card styling & animations
│       └── settings.css           # Control center modal styling
├── test/
│   └── unit/                      # Automated Node.js unit tests
├── scripts/
│   ├── build.mjs                  # Generates production dist/ bundle
│   └── validate.mjs               # Scans for security, secrets, and syntax
├── index.html                     # Live web preview entrypoint for GitHub Pages
├── DEVLOG.md                      # Development journey devlog
└── package.json
```

---

## 🚀 Quick Start & Development

### Requirements
- Node.js 18+ (for testing and build scripts)
- Google Chrome or Chromium-based browser (Brave, Edge, Arc)

### 1. Test & Build
```bash
# Run automated unit tests
npm test

# Run security & code validation
npm run validate

# Build extension to dist/
npm run build
```

### 2. Load Extension in Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `dist/` directory from this repository.
4. Open a new tab to see the **HYPR//F1 Command Center**!

### 3. Deploy as a Website (GitHub Pages / Vercel)
This project is built to work both as a Chrome Extension and as a standalone web app:
- **GitHub Pages**: Go to your repository settings -> Pages -> Deploy from branch `main` / root.
- **Vercel / Netlify**: Deploy directly by pointing the root directory to `index.html`.

---

## 🔒 Privacy & Permissions

- **Minimal Permissions**: The extension requests only `storage` in its Manifest V3. No browsing history, no tab access, no external script injection.
- **Zero Cloud Tracking**: All user settings, custom uploaded images, and shortcut links remain stored locally in your browser (`chrome.storage.local` and `IndexedDB`).
- **No API Keys Required**: Uses public Jolpica F1 API endpoints and direct browser search builders.

---

## 📄 License & Credits

- Built with ❤️ by [HanYC666](https://github.com/HanYC666)
- F1 telemetry powered by [Jolpica F1 API](https://api.jolpi.ca/ergast/f1/) and [OpenF1](https://openf1.org/)
- Licensed under the [MIT License](LICENSE).
