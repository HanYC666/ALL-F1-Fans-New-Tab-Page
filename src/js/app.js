import { CONFIG } from "./config.js";
import { loadState, saveState } from "./storage.js";
import { applyLayout, enableDragging } from "./layout.js";
import { applyBackground, cleanupBackgroundUrls } from "./background.js";
import { initSearch } from "./search.js";
import { announce, prefersReducedMotion } from "./accessibility.js";
import { jolpica } from "./providers/jolpica.js";
import { renderShortcuts } from "./widgets/shortcuts.js";
import { renderRaceWeekend, getCurrentGrandPrix } from "./widgets/race-weekend.js";
import { renderStandings } from "./widgets/standings.js";
import { renderStreams } from "./widgets/streams.js";
import { renderSettings } from "./widgets/settings.js";
import { countdown } from "./providers/provider-utils.js";
import { DEFAULT_STATE } from "./state.js";
import teams from "../data/teams.json" with { type: "json" };

let state = JSON.parse(JSON.stringify(DEFAULT_STATE)),
  data = { schedule: [], drivers: [], constructors: [], provider: "offline" },
  streams = { results: [] };

const grid = () => document.querySelector("#widget-grid");

function applyCssTokens() {
  const isLight = state.theme.colorScheme === "light";
  document.documentElement.setAttribute("data-theme", isLight ? "light" : "dark");

  document.documentElement.style.setProperty(
    "--hypr-opacity",
    state.theme.panelOpacity ?? 0.72,
  );
  document.documentElement.style.setProperty(
    "--hypr-blur",
    `${state.theme.panelBlurPx ?? 20}px`,
  );
  document.documentElement.style.setProperty(
    "--hypr-radius",
    `${state.theme.panelRadiusPx ?? 16}px`,
  );
  document.documentElement.style.setProperty(
    "--page-accent",
    state.theme.accentColor || "#e10600",
  );
  document.documentElement.style.setProperty(
    "--bg-overlay-opacity",
    state.theme.overlayOpacity ?? 0.45,
  );

  const wg = document.querySelector("#widget-grid");
  if (wg && state.theme.gridGapPx !== undefined) {
    wg.style.setProperty("--hypr-gap", `${state.theme.gridGapPx}px`);
  }

  // Hex to RGB for glow variables
  const activeAccent = state.theme.accentColor || "#e10600";
  if (/^#[\da-f]{6}$/i.test(activeAccent)) {
    const r = parseInt(activeAccent.slice(1, 3), 16);
    const g = parseInt(activeAccent.slice(3, 5), 16);
    const b = parseInt(activeAccent.slice(5, 7), 16);
    document.documentElement.style.setProperty("--page-accent-rgb", `${r}, ${g}, ${b}`);
  }

  // Update theme toggle button in Waybar
  const themeToggleBtn = document.querySelector("#theme-toggle-btn");
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = isLight ? "🌙" : "☀️";
    themeToggleBtn.title = isLight ? "Switch to Dark Mode" : "Switch to Light Mode";
  }
}

function initClock() {
  const clockTime = document.querySelector("#clock-time");
  const clockDate = document.querySelector("#clock-date");
  if (!clockTime || !clockDate) return;

  const update = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    clockTime.innerHTML = `${h}<span class="time-colon">:</span>${m}`;

    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    clockDate.textContent = `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
  };

  update();
  setInterval(update, 1000);
}

function initCountdownTicker() {
  setInterval(() => {
    const el = document.querySelector("#race-countdown-timer");
    if (el && el.dataset.targetTime) {
      const now = Date.now();
      const target = new Date(el.dataset.targetTime).getTime();
      if (target <= now && now - target <= 4 * 3600 * 1000) {
        el.textContent = "LIVE RACING";
      } else {
        el.textContent = countdown(el.dataset.targetTime);
      }
    }
  }, 1000);
}

function updateTrackStatus(telemetry) {
  const pill = document.querySelector("#track-status-pill");
  const text = document.querySelector("#track-status-text");
  if (!pill || !text) return;

  const currentGp = getCurrentGrandPrix(telemetry.schedule);
  if (!currentGp || !currentGp.startsAt) {
    pill.className = "status-pill green";
    text.textContent = "TRACK GREEN";
    return;
  }

  const now = Date.now();
  const raceTime = new Date(currentGp.startsAt).getTime();
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;

  if (raceTime <= now && now - raceTime <= 4 * 3600 * 1000) {
    pill.className = "status-pill green";
    text.textContent = `LIVE: ${currentGp.meetingName.toUpperCase()}`;
  } else if (raceTime > now && raceTime - now <= TWELVE_HOURS) {
    pill.className = "status-pill yellow";
    text.textContent = `LIGHTS OUT SOON: ${currentGp.meetingName.toUpperCase()}`;
  } else {
    pill.className = "status-pill green";
    text.textContent = `TRACK GREEN · ${currentGp.meetingName.toUpperCase()}`;
  }
}

function renderTeamPills() {
  const container = document.querySelector("#team-pill-bar");
  if (!container) return;
  container.replaceChildren();

  teams.forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `team-pill-btn ${state.theme.teamFilter === t.id ? "active" : ""}`;
    btn.textContent = t.short || t.label;
    btn.title = t.label;

    btn.addEventListener("click", () => {
      state.theme.teamFilter = t.id;
      state.theme.accentColor = t.accent;
      state.cache.lastBackground = null;
      save();
      applyCssTokens();
      applyBackground(state);
      renderTeamPills();
      rerender();
    });

    container.append(btn);
  });
}

function rerender() {
  const currentGp = getCurrentGrandPrix(data.schedule);
  const gpName = currentGp?.meetingName || "Formula 1";

  grid().replaceChildren(
    renderRaceWeekend(state, data),
    renderStandings(state, data),
    renderStreams(state, {
      ...streams,
      grandPrix: gpName,
    }),
    renderShortcuts(state, () => {
      save();
      rerender();
    }),
  );

  applyLayout(state);
  enableDragging(state, () => {
    save();
    applyLayout(state);
  });
  applyCssTokens();
  updateTrackStatus(data);
}

function save() {
  saveState(state);
}

async function refreshData() {
  announce("Refreshing F1 telemetry…");
  const controller = new AbortController();
  try {
    const [schedule, standings, constr] = await Promise.all([
      jolpica.getSchedule({ season: CONFIG.season, signal: controller.signal }),
      jolpica.getStandings({ season: CONFIG.season, signal: controller.signal }),
      jolpica.getConstructorStandings({ season: CONFIG.season, signal: controller.signal }),
    ]);

    data = {
      ...schedule,
      ...standings,
      ...constr,
      provider: "jolpica",
      fetchedAt: new Date().toISOString(),
    };

    state.cache.schedule = { ...schedule, expiresAt: Date.now() + 1800000 };
    state.cache.standings = { ...standings, expiresAt: Date.now() + 1800000 };
    state.cache.constructors = { ...constr, expiresAt: Date.now() + 1800000 };

    save();
    updateTrackStatus(data);
    rerender();
    announce(`F1 telemetry synced from Jolpica at ${new Date().toLocaleTimeString()}.`);
  } catch (error) {
    const cachedSchedule = state.cache.schedule;
    const cachedStandings = state.cache.standings;
    const cachedConstr = state.cache.constructors;

    data = {
      ...cachedSchedule,
      ...cachedStandings,
      ...cachedConstr,
      provider: "jolpica",
      stale: true,
      error: error.message,
    };
    updateTrackStatus(data);
    rerender();
    announce("F1 telemetry is offline; showing cached data.");
  }
}

function exportSettings() {
  const payload = {
    app: "f1-fans-new-tab",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    settings: { theme: state.theme, preferences: state.preferences },
    layout: state.layout,
    shortcuts: state.shortcuts,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hypr-f1-settings.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function importSettings(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (parsed.app !== "f1-fans-new-tab" || !parsed.settings) {
      throw new Error("This is not a valid F1 Fans configuration file.");
    }
    if (confirm("Replace current settings and layout with this file?")) {
      state = {
        ...state,
        ...parsed.settings,
        layout: parsed.layout || state.layout,
        shortcuts: parsed.shortcuts || state.shortcuts,
      };
      save();
      applyCssTokens();
      rerender();
      await applyBackground(state);
      renderTeamPills();
      announce("Configuration imported.");
    }
  } catch (e) {
    alert(`Import failed: ${e.message}`);
  }
}

async function reset(kind) {
  if (kind === "all") state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  else {
    const fresh = await loadState();
    state.layout = fresh.layout;
  }
  save();
  applyCssTokens();
  rerender();
  await applyBackground(state);
  renderTeamPills();
  announce(kind === "all" ? "Settings reset to default." : "Layout grid reset.");
}

function openSettings() {
  renderSettings(state, {
    onChange: () => {
      applyCssTokens();
      save();
      applyBackground(state);
      renderTeamPills();
      rerender();
    },
    onReset: reset,
    onImport: importSettings,
    onExport: exportSettings,
    onDelete: async () => {
      state = await loadState();
      rerender();
      announce("Local data wiped.");
    },
  });

  const panel = document.querySelector("#settings-panel");
  const backdrop = document.querySelector("#settings-backdrop");
  panel.hidden = false;
  backdrop.hidden = false;
  document.querySelector("#settings-button").setAttribute("aria-expanded", "true");
}

async function init() {
  state = await loadState();
  state.theme.reduceMotion = state.theme.reduceMotion || prefersReducedMotion();

  initClock();
  initCountdownTicker();
  initSearch(state.preferences.defaultSearchTarget || "google");
  renderTeamPills();

  // Settings & Refresh Buttons
  document.querySelector("#settings-button").addEventListener("click", openSettings);
  document.querySelector("#refresh-button").addEventListener("click", refreshData);

  // Light/Dark Theme Quick Toggle Button
  const themeToggleBtn = document.querySelector("#theme-toggle-btn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      state.theme.colorScheme = state.theme.colorScheme === "light" ? "dark" : "light";
      save();
      applyCssTokens();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const panel = document.querySelector("#settings-panel");
      const backdrop = document.querySelector("#settings-backdrop");
      if (panel && !panel.hidden) {
        panel.hidden = true;
        backdrop.hidden = true;
        document.querySelector("#settings-button").setAttribute("aria-expanded", "false");
      }
    }
  });

  window.addEventListener("beforeunload", cleanupBackgroundUrls);

  // Load from cache immediately if available
  if (state.cache.schedule?.schedule?.length) {
    data = {
      ...state.cache.schedule,
      ...state.cache.standings,
      ...state.cache.constructors,
      provider: "jolpica",
    };
  }

  await applyBackground(state);
  applyCssTokens();
  rerender();

  // Always fetch latest data when online
  if (navigator.onLine) {
    refreshData();
  } else {
    announce("Offline mode: showing cached telemetry.");
  }
}

init().catch((error) => announce(`Startup error: ${error.message}`));
