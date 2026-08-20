import { clamp, CONFIG, safeHex } from "./config.js";
export const DEFAULT_STATE = {
  schemaVersion: CONFIG.schemaVersion,
  theme: {
    teamFilter: "all",
    backgroundMode: "random-new-tab",
    backgroundIntervalSeconds: 30,
    backgroundFit: "cover",
    overlayOpacity: .42,
    accentColor: "#e10600",
    panelOpacity: .72,
    panelBlurPx: 18,
    panelRadiusPx: 18,
    reduceMotion: false,
  },
  layout: {
    locked: false,
    density: "comfortable",
    widgets: {
      raceWeekend: {
        visible: true,
        x: 1,
        y: 1,
        w: 4,
        h: 3,
        opacity: .78,
        blurPx: 18,
      },
      standings: {
        visible: true,
        x: 1,
        y: 5,
        w: 5,
        h: 4,
        opacity: .78,
        blurPx: 18,
      },
      streams: {
        visible: true,
        x: 8,
        y: 5,
        w: 4,
        h: 4,
        opacity: .78,
        blurPx: 18,
      },
      shortcuts: {
        visible: true,
        x: 8,
        y: 1,
        w: 4,
        h: 3,
        opacity: .78,
        blurPx: 18,
      },
    },
  },
  shortcuts: [],
  preferences: {
    defaultSearchTarget: "google",
    openLinksInNewTab: true,
    timezone: "local",
    language: "en",
  },
  cache: {},
};
const copy = (value) => JSON.parse(JSON.stringify(value));
export function sanitizeShortcut(input) {
  const raw = String(input?.url || "").trim();
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (
    !["https:", "http:"].includes(url.protocol) || url.username || url.password
  ) return null;
  return {
    id: String(input.id || crypto.randomUUID()),
    title: String(input.title || url.hostname).trim().slice(0, 100) ||
      url.hostname,
    url: url.href,
    position: Math.max(0, Number(input.position) || 0),
    iconMode: "favicon",
    createdAt: Number(input.createdAt) || Date.now(),
  };
}
export function sanitizeState(input = {}) {
  const s = copy(DEFAULT_STATE);
  if (!input || typeof input !== "object") return s;
  s.schemaVersion = CONFIG.schemaVersion;
  const t = input.theme || {};
  Object.assign(s.theme, t);
  s.theme.overlayOpacity = clamp(
    t.overlayOpacity ?? DEFAULT_STATE.theme.overlayOpacity,
    .2,
    1,
  );
  s.theme.panelOpacity = clamp(
    t.panelOpacity ?? DEFAULT_STATE.theme.panelOpacity,
    .2,
    1,
  );
  s.theme.panelBlurPx = clamp(
    t.panelBlurPx ?? DEFAULT_STATE.theme.panelBlurPx,
    0,
    40,
  );
  s.theme.panelRadiusPx = clamp(
    t.panelRadiusPx ?? DEFAULT_STATE.theme.panelRadiusPx,
    0,
    40,
  );
  s.theme.backgroundIntervalSeconds = clamp(
    t.backgroundIntervalSeconds ??
      DEFAULT_STATE.theme.backgroundIntervalSeconds,
    5,
    3600,
  );
  s.theme.accentColor = safeHex(t.accentColor, DEFAULT_STATE.theme.accentColor);
  if (
    ["static", "random-new-tab", "sequential-new-tab", "slideshow"].includes(
      t.backgroundMode,
    )
  ) s.theme.backgroundMode = t.backgroundMode;
  if (typeof t.reduceMotion === "boolean") {
    s.theme.reduceMotion = t.reduceMotion;
  }
  if (input.layout) {
    s.layout.locked = Boolean(input.layout.locked);
    if (["comfortable", "compact", "spacious"].includes(input.layout.density)) {
      s.layout.density = input.layout.density;
    }
    for (const [id, raw] of Object.entries(s.layout.widgets)) {
      const v = input.layout.widgets?.[id] || {};
      raw.visible = v.visible !== false;
      raw.x = clamp(v.x, 1, 12);
      raw.y = clamp(v.y, 1, 20);
      raw.w = clamp(v.w, 2, 12);
      raw.h = clamp(v.h, 2, 8);
      raw.opacity = clamp(v.opacity ?? raw.opacity, .2, 1);
      raw.blurPx = clamp(v.blurPx ?? raw.blurPx, 0, 40);
      if (raw.x + raw.w > 13) raw.x = 13 - raw.w;
    }
  }
  s.shortcuts = (Array.isArray(input.shortcuts) ? input.shortcuts : []).map(
    sanitizeShortcut,
  ).filter(Boolean).sort((a, b) => a.position - b.position).map((x, i) => ({
    ...x,
    position: i,
  }));
  s.preferences = { ...s.preferences, ...(input.preferences || {}) };
  if (!["local", "utc"].includes(s.preferences.timezone)) {
    s.preferences.timezone = "local";
  }
  s.cache = input.cache && typeof input.cache === "object" ? input.cache : {};
  return s;
}
export function migrateState(input) {
  return sanitizeState(input);
}
