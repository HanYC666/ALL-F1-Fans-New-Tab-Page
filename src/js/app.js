import { CONFIG } from "./config.js";
import { loadState, saveState } from "./storage.js";
import { applyLayout, enableDragging } from "./layout.js";
import { applyBackground, cleanupBackgroundUrls } from "./background.js";
import { initSearch } from "./search.js";
import { announce, prefersReducedMotion } from "./accessibility.js";
import { jolpica } from "./providers/jolpica.js";
import { openF1 } from "./providers/openf1.js";
import { renderShortcuts } from "./widgets/shortcuts.js";
import { renderRaceWeekend } from "./widgets/race-weekend.js";
import { renderStandings } from "./widgets/standings.js";
import { renderStreams } from "./widgets/streams.js";
import { renderSettings } from "./widgets/settings.js";
import { DEFAULT_STATE } from "./state.js";
let state,
  data = { schedule: [], drivers: [], provider: "offline" },
  streams = { results: [] };
const grid = () => document.querySelector("#widget-grid");
function cssTheme() {
  document.documentElement.style.setProperty(
    "--panel-opacity",
    state.theme.panelOpacity,
  );
  document.documentElement.style.setProperty(
    "--panel-blur",
    `${state.theme.panelBlurPx}px`,
  );
  document.documentElement.style.setProperty(
    "--panel-radius",
    `${state.theme.panelRadiusPx}px`,
  );
  document.documentElement.style.setProperty(
    "--page-accent",
    state.theme.accentColor,
  );
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
  cssTheme();
}
async function save() {
  state = await saveState(state);
}
async function refreshData() {
  announce("Refreshing F1 data…");
  const controller = new AbortController();
  try {
    const [schedule, standings] = await Promise.all([
      jolpica.getSchedule({ season: CONFIG.season, signal: controller.signal }),
      jolpica.getStandings({
        season: CONFIG.season,
        signal: controller.signal,
      }),
    ]);
    data = { ...schedule, ...standings, provider: "jolpica" };
    state.cache.schedule = { ...schedule, expiresAt: Date.now() + 1800000 };
    state.cache.standings = { ...standings, expiresAt: Date.now() + 1800000 };
    await save();
    announce(
      `F1 data updated from Jolpica at ${new Date().toLocaleTimeString()}.`,
    );
  } catch (error) {
    const cachedSchedule = state.cache.schedule,
      cachedStandings = state.cache.standings;
    data = {
      ...cachedSchedule,
      ...cachedStandings,
      provider: "jolpica",
      stale: true,
      error: error.message,
    };
    announce("F1 data is unavailable; showing cached or offline state.");
  }
  rerender();
}
async function findStreams(session = "Race commentary") {
  const url = CONFIG.youtubeProxyUrl;
  if (!url || url.includes("==")) {
    streams = {
      results: [],
      error:
        "The optional proxy is not configured. Use the direct YouTube search link, or deploy the proxy first.",
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
    if (!res.ok) {
      throw new Error(
        res.status === 429
          ? "Search quota or rate limit reached. Try again later."
          : `Proxy returned ${res.status}.`,
      );
    }
    const payload = await res.json();
    streams = {
      results: Array.isArray(payload.results) ? payload.results : [],
      loading: false,
    };
  } catch (e) {
    streams = {
      results: [],
      loading: false,
      error: navigator.onLine
        ? "Stream search failed. Try again later."
        : "Stream search is unavailable offline.",
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
    imageMetadata: [],
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "f1-fans-settings.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
async function importSettings(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (parsed.app !== "f1-fans-new-tab" || !parsed.settings) {
      throw new Error("This is not a supported F1 Fans settings export.");
    }
    if (confirm("Replace current settings with this import?")) {
      state = {
        ...state,
        ...parsed.settings,
        layout: parsed.layout || state.layout,
        shortcuts: parsed.shortcuts || state.shortcuts,
      };
      await save();
      rerender();
      announce("Settings imported.");
    }
  } catch (e) {
    announce(`Import rejected: ${e.message}`);
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
  announce(kind === "all" ? "Settings reset." : "Layout reset.");
}
function openSettings() {
  renderSettings(state, {
    onChange: async () => {
      await save();
      rerender();
      await applyBackground(state);
    },
    onReset: reset,
    onImport: importSettings,
    onExport: exportSettings,
    onDelete: async () => {
      state = await loadState();
      rerender();
      announce("Local data deleted.");
    },
  });
  const panel = document.querySelector("#settings-panel");
  panel.hidden = false;
  document.querySelector("#settings-button").setAttribute(
    "aria-expanded",
    "true",
  );
}
async function init() {
  state = await loadState();
  state.theme.reduceMotion = state.theme.reduceMotion || prefersReducedMotion();
  initSearch();
  document.querySelector("#settings-button").addEventListener(
    "click",
    openSettings,
  );
  document.querySelector("#refresh-button").addEventListener(
    "click",
    refreshData,
  );
  window.addEventListener("beforeunload", cleanupBackgroundUrls);
  await applyBackground(state);
  rerender();
  const cacheOk = state.cache.schedule && state.cache.standings &&
    state.cache.schedule.expiresAt > Date.now();
  if (cacheOk) {
    data = {
      ...state.cache.schedule,
      ...state.cache.standings,
      provider: "jolpica",
    };
  } else if (navigator.onLine) refreshData();
  else announce("Offline mode: showing the local shell and any saved data.");
}
init().catch((error) => announce(`Startup error: ${error.message}`));
