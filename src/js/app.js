import { CONFIG } from "./config.js";
import { loadState, saveState } from "./storage.js";
import { applyLayout, enableDragging } from "./layout.js";
import { applyBackground, cleanupBackgroundUrls } from "./background.js";
import { initSearch } from "./search.js";
import { announce, prefersReducedMotion } from "./accessibility.js";
import { jolpica } from "./providers/jolpica.js";
import { renderShortcuts } from "./widgets/shortcuts.js";
import { renderRaceWeekend } from "./widgets/race-weekend.js";
import { renderStandings } from "./widgets/standings.js";
import { renderStreams } from "./widgets/streams.js";
import { renderSettings } from "./widgets/settings.js";
import { countdown } from "./providers/provider-utils.js";
import { DEFAULT_STATE } from "./state.js";
import teams from "../data/teams.json" with { type: "json" };

let state,
  data = { schedule: [], drivers: [], constructors: [], provider: "offline" },
  streams = { results: [] };

const grid = () => document.querySelector("#widget-grid");

function applyCssTokens() {
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
      el.textContent = countdown(el.dataset.targetTime);
    }
  }, 1000);
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

    btn.addEventListener("click", async () => {
      state.theme.teamFilter = t.id;
      state.theme.accentColor = t.accent;
      await save();
      applyCssTokens();
      await applyBackground(state);
      renderTeamPills();
      rerender();
    });

    container.append(btn);
  });
}

function rerender() {
  grid().replaceChildren(
    renderRaceWeekend(state, data),
    renderStandings(state, data),
    renderStreams(state, {
      ...streams,
      grandPrix: data.schedule?.[0]?.meetingName || "Formula 1",
      onRefresh: findStreams,
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
}

async function save() {
  state = await saveState(state);
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
    };

    state.cache.schedule = { ...schedule, expiresAt: Date.now() + 1800000 };
    state.cache.standings = { ...standings, expiresAt: Date.now() + 1800000 };
    state.cache.constructors = { ...constr, expiresAt: Date.now() + 1800000 };

    await save();
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
    announce("F1 telemetry is offline; showing cached data.");
  }
  rerender();
}

async function findStreams(session = "Race commentary") {
  const url = CONFIG.youtubeProxyUrl;
  if (!url || url.includes("==")) {
    streams = {
      results: [],
      error: "Proxy is optional. Direct search links above work instantly without credentials.",
    };
    rerender();
    return;
  }
  streams = { ...streams, loading: true, error: null };
  rerender();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        season: CONFIG.season,
        grandPrix: data.schedule?.[0]?.meetingName || "Formula 1",
        session,
        language: state.preferences.language,
      }),
    });
    if (!res.ok) throw new Error(`Proxy error ${res.status}`);
    const payload = await res.json();
    streams = {
      results: Array.isArray(payload.results) ? payload.results : [],
      loading: false,
    };
  } catch (e) {
    streams = {
      results: [],
      loading: false,
      error: navigator.onLine ? "Search unavailable right now." : "Offline.",
    };
  }
  rerender();
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
      await save();
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
  await save();
  rerender();
  await applyBackground(state);
  renderTeamPills();
  announce(kind === "all" ? "Settings reset to default." : "Layout grid reset.");
}

function openSettings() {
  renderSettings(state, {
    onChange: async () => {
      await save();
      rerender();
      await applyBackground(state);
      renderTeamPills();
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

  document.querySelector("#settings-button").addEventListener("click", openSettings);
  document.querySelector("#refresh-button").addEventListener("click", refreshData);

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

  await applyBackground(state);
  applyCssTokens();
  rerender();

  const cacheOk = state.cache.schedule && state.cache.standings &&
    state.cache.schedule.expiresAt > Date.now();

  if (cacheOk) {
    data = {
      ...state.cache.schedule,
      ...state.cache.standings,
      ...state.cache.constructors,
      provider: "jolpica",
    };
  } else if (navigator.onLine) {
    refreshData();
  } else {
    announce("Offline mode: showing local telemetry shell.");
  }
}

init().catch((error) => announce(`Startup error: ${error.message}`));
