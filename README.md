# 🏎️ HYPR//F1 — F1 Command Center New Tab

> A Formula 1 new tab page for Chrome, styled like Hyprland on Arch Linux. Live race countdowns, full session timetables, driver/constructor standings, YouTube commentary finder, speed-dial shortcuts, and wallpapers for every team.

![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)
![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-blue.svg)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen.svg)
![Live Telemetry](https://img.shields.io/badge/API-Jolpica%20%26%20OpenF1-orange.svg)

---

## What it does

Every time you open a new tab you get a full F1 dashboard instead of the default Chrome page. The whole thing is styled like a Hyprland tiling window manager — frosted glass widgets, glowing borders in your team's livery color, the works.

### The widgets

**Waybar (top bar)**
- Live clock with blinking colon
- Track status pill that shows LIVE / LIGHTS OUT SOON / TRACK GREEN depending on where we are in the race weekend
- Quick team switcher pills for all 10 teams — switches the accent color and wallpaper instantly
- Theme toggle (light/dark), refresh, and settings buttons

**Grand Prix Weekend Hub**
- Countdown timer ticking down to the next session
- Full weekend timetable — FP1, FP2, FP3, Sprint Shootout, Sprint, Qualifying, Race — with DONE/LIVE/NEXT status badges
- Times shown in your local timezone by default (UTC option in settings)

**Championship Standings**
- Driver standings and Constructor standings in separate tabs
- Team color bars, driver codes, points — pulls live from the Jolpica F1 API

**YouTube Commentary Finder**
- Picks the current or most recent GP automatically
- One click builds a YouTube search for race/qualifying/practice commentary from the proper channels (The Race, Sky Sports F1, P1 with Matt & Tommy, etc.)
- No API key, just opens a search URL

**Speed Dial Shortcuts**
- Glass tiles with favicons for your most visited F1 sites
- Comes with Formula1.com, F1 TV, r/formula1 etc. pre-loaded, fully editable

**Settings (Hyprland Control Center)**
- Sliders for glass opacity, blur intensity, corner rounding, and grid gap — all update live
- Team accent color picker
- Wallpaper gallery with all 10 team SVGs, plus drag-and-drop custom image upload (stored locally in IndexedDB)
- Light and dark mode

---

## Project structure

```text
src/
├── manifest.json              # Chrome Manifest V3
├── newtab.html                # Main page
├── assets/backgrounds/        # SVG wallpapers for all 10 teams
├── data/
│   ├── teams.json             # Team colors and metadata
│   ├── built-in-backgrounds.json
│   └── default-layout.json
├── js/
│   ├── app.js                 # Main entry, Waybar, settings wiring
│   ├── state.js               # State schema and validation
│   ├── storage.js             # chrome.storage + localStorage fallback
│   ├── layout.js              # Grid manager and drag handles
│   ├── background.js          # Wallpaper rotation and slideshow
│   ├── indexeddb.js           # Custom image storage
│   ├── search.js              # Search bar, engine picker, / hotkey
│   ├── providers/
│   │   ├── jolpica.js         # F1 schedule and standings
│   │   ├── openf1.js          # OpenF1 sessions
│   │   └── provider-utils.js  # Countdown and date formatting
│   └── widgets/
│       ├── race-weekend.js
│       ├── standings.js
│       ├── streams.js
│       ├── shortcuts.js
│       └── settings.js
└── styles/
    ├── tokens.css             # CSS variables — colors, blur, radius etc
    ├── base.css               # Reset and typography
    ├── layout.css             # Waybar and grid
    ├── widgets.css            # Widget card styles
    └── settings.css           # Settings modal

scripts/
├── build.mjs                  # Builds dist/
├── pack.mjs                   # Zips dist/ for Chrome install
└── validate.mjs               # Checks for secrets and syntax errors

test/unit/                     # Node.js unit tests
index.html                     # GitHub Pages entry point
```

---

## Setup

You need Node.js 18+ for the build tooling. The extension itself has zero runtime dependencies.

### Install & build

```bash
npm test          # run unit tests
npm run validate  # check for secrets/issues
npm run build     # builds to dist/
npm run pack      # zips dist/ to f1-fans-new-tab.zip
```

### Load in Chrome (developer mode)

1. Go to `chrome://extensions/`
2. Turn on **Developer mode** (top right toggle)
3. Click **Load unpacked** → select the `dist/` folder
4. Open a new tab

Or just drag `f1-fans-new-tab.zip` onto the extensions page if you've already run `npm run pack`.

### Deploy as a website

Works as a standalone web app too — it falls back to `localStorage` when `chrome.storage` isn't available.

- **GitHub Pages**: repo settings → Pages → deploy from `main` / root
- **Vercel / Netlify**: point at `index.html`

---

## Privacy

Requests only the `storage` permission. No history access, no tab access. All settings and uploaded images stay in your local browser storage. See [PRIVACY.md](PRIVACY.md) for the full breakdown.

---

## Credits

- Built by [HanYC666](https://github.com/HanYC666)
- F1 data from [Jolpica F1 API](https://api.jolpi.ca/ergast/f1/) and [OpenF1](https://openf1.org/)
- MIT License
