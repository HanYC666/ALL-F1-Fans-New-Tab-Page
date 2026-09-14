import backgrounds from "../data/built-in-backgrounds.json" with { type: "json" };
import teams from "../data/teams.json" with { type: "json" };
import { clamp } from "./config.js";
import { listImages } from "./indexeddb.js";

let urls = [];
let slideshowTimer = null;

export async function eligibleImages(state) {
  const uploads = (await listImages()) || [];
  const selected = state.theme.teamFilter || "all";
  const disabled = new Set(state.theme.disabledBackgrounds || []);

  const built = backgrounds.filter((x) =>
    (selected === "all" ? true : x.team === selected) &&
    x.enabled !== false &&
    !disabled.has(x.id)
  );

  const local = uploads.filter((x) =>
    x.enabled !== false && (selected === "all" ? true : x.team === selected)
  ).map((x) => {
    const url = URL.createObjectURL(x.blob);
    urls.push(url);
    return {
      ...x,
      src: url,
      alt: x.filename,
      credit: x.credit || "Personal upload",
    };
  });

  return [...built, ...local];
}

export async function applyBackground(state) {
  let pool = await eligibleImages(state);
  if (!pool.length) {
    pool = await eligibleImages({
      ...state,
      theme: { ...state.theme, teamFilter: "all" },
    });
  }
  if (!pool.length) return;

  let index = 0;
  const lastIndex = pool.findIndex((x) => x.id === state.cache.lastBackground);

  if (state._explicitBackground && lastIndex >= 0) {
    index = lastIndex;
    state._explicitBackground = false;
  } else if (state.theme.backgroundMode === "static") {
    index = lastIndex >= 0 ? lastIndex : 0;
    state.cache.lastBackground = pool[index].id;
  } else if (state.theme.backgroundMode === "sequential-new-tab") {
    index = (Number.isInteger(Number(state.cache.f1BackgroundIndex))
      ? Number(state.cache.f1BackgroundIndex) + 1
      : 0) % pool.length;
    state.cache.f1BackgroundIndex = index;
    state.cache.lastBackground = pool[index].id;
  } else if (state.theme.backgroundMode === "random-new-tab") {
    if (pool.length > 1 && lastIndex >= 0) {
      const choices = pool.filter((x) => x.id !== state.cache.lastBackground);
      const chosen = choices[Math.floor(Math.random() * choices.length)];
      index = pool.findIndex((x) => x.id === chosen.id);
    } else {
      index = lastIndex >= 0 ? lastIndex : Math.floor(Math.random() * pool.length);
    }
    state.cache.lastBackground = pool[index].id;
  } else {
    index = lastIndex >= 0 ? lastIndex : 0;
    state.cache.lastBackground = pool[index].id;
  }

  const chosenItem = pool[index] || pool[0];
  const layer = document.querySelector("#background-layer");

  if (layer) {
    layer.style.backgroundSize = state.theme.backgroundFit || "cover";
    if (chosenItem?.src) {
      layer.style.backgroundImage = `url(${JSON.stringify(chosenItem.src)})`;
    }
  }

  // Set team accent
  const currentTeam = teams.find((t) => t.id === state.theme.teamFilter) || teams[0];
  const activeAccent = state.theme.accentColor || currentTeam.accent;

  document.documentElement.style.setProperty("--page-accent", activeAccent);

  // Hex to RGB for glow variables
  if (/^#[\da-f]{6}$/i.test(activeAccent)) {
    const r = parseInt(activeAccent.slice(1, 3), 16);
    const g = parseInt(activeAccent.slice(3, 5), 16);
    const b = parseInt(activeAccent.slice(5, 7), 16);
    document.documentElement.style.setProperty("--page-accent-rgb", `${r}, ${g}, ${b}`);
  }

  // Manage Slideshow
  if (slideshowTimer) {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
  }

  if (state.theme.backgroundMode === "slideshow" && pool.length > 1) {
    let current = index;
    const interval = clamp(state.theme.backgroundIntervalSeconds, 5, 3600) * 1000;

    const rotate = () => {
      if (document.hidden) return;
      current = (current + 1) % pool.length;
      const nextBg = pool[current];
      if (layer && nextBg?.src) {
        layer.style.backgroundImage = `url(${JSON.stringify(nextBg.src)})`;
      }
    };

    slideshowTimer = setInterval(rotate, interval);
  }
}

export function cleanupBackgroundUrls() {
  if (slideshowTimer) clearInterval(slideshowTimer);
  urls.splice(0).forEach(URL.revokeObjectURL);
}
