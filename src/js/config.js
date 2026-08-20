export const CONFIG = Object.freeze({
  schemaVersion: 1,
  season: new Date().getFullYear(),
  maxUploadBytes: 12_582_912,
  maxImagePixels: 25_000_000,
  youtubeProxyUrl: "==YOUTUBE_PROXY_URL==",
  providerTimeoutMs: 8000,
  providers: {
    jolpicaBaseUrl: "https://api.jolpi.ca/ergast/f1",
    openF1BaseUrl: "https://api.openf1.org/v1",
  },
});
export const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, Number(value) || min));
export const safeHex = (value, fallback = "#e10600") =>
  /^#[\da-f]{6}([\da-f]{2})?$/i.test(value) ? value : fallback;
export const isoNow = () => new Date().toISOString();
