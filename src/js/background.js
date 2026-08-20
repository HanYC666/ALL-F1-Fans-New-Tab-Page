import backgrounds from "../data/built-in-backgrounds.json" with {
  type: "json",
};
import teams from "../data/teams.json" with { type: "json" };
import { clamp } from "./config.js";
import { listImages } from "./indexeddb.js";
let urls = [];
export async function eligibleImages(state) {
  const uploads = (await listImages()) || [];
  const selected = state.theme.teamFilter;
  const built = backgrounds.filter((x) =>
    (selected === "all" || x.team === selected) && x.enabled !== false
  );
  const local = uploads.filter((x) =>
    x.enabled !== false && (selected === "all" || x.team === selected)
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
  if (state.theme.backgroundMode === "sequential-new-tab") {
    index = (Number.isInteger(Number(state.cache.f1BackgroundIndex))
      ? Number(state.cache.f1BackgroundIndex) + 1
      : 0) % pool.length;
    state.cache.f1BackgroundIndex = index;
  } else if (state.theme.backgroundMode === "random-new-tab") {
    const choices = pool.filter((x) => x.id !== state.cache.lastBackground);
    const source = choices.length ? choices : pool;
    const chosen = source[Math.floor(Math.random() * source.length)];
    index = pool.findIndex((x) => x.id === chosen.id);
    state.cache.lastBackground = chosen.id;
  }
  const layer = document.querySelector("#background-layer");
  layer.style.backgroundSize = state.theme.backgroundFit;
  const setImage = (item) => {
    layer.style.backgroundImage = item?.src
      ? `url(${JSON.stringify(item.src)})`
      : "";
    layer.dataset.credit = item?.credit || "";
  };
  setImage(pool[index] || pool[0]);
  document.documentElement.style.setProperty(
    "--page-accent",
    state.theme.accentColor || teams[0].accent,
  );
  if (state.theme.backgroundMode === "slideshow" && pool.length > 1) {
    let timer;
    let current = index;
    const interval = clamp(state.theme.backgroundIntervalSeconds, 5, 3600) *
      1000;
    const rotate = () => {
      if (document.hidden) return;
      current = (current + 1) % pool.length;
      setImage(pool[current]);
    };
    const start = () => {
      clearInterval(timer);
      timer = setInterval(rotate, interval);
    };
    start();
    document.addEventListener(
      "visibilitychange",
      () => document.hidden ? clearInterval(timer) : start(),
    );
  }
}
export function cleanupBackgroundUrls() {
  urls.splice(0).forEach(URL.revokeObjectURL);
}
