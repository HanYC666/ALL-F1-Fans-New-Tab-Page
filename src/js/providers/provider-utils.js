import { CONFIG, isoNow } from "../config.js";
export async function fetchJson(
  url,
  { signal, timeoutMs = CONFIG.providerTimeoutMs } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Provider returned ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
export function retryable(error) {
  return error?.name === "AbortError" ||
    /^(Provider returned (408|429|5\d\d))/.test(error?.message || "");
}
export async function withBackoff(task, { attempts = 2 } = {}) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await task();
    } catch (e) {
      last = e;
      if (!retryable(e) || i === attempts - 1) break;
      await new Promise((r) => setTimeout(r, 250 * 2 ** i));
    }
  }
  throw last;
}
export function providerMeta(provider, extra = {}) {
  return {
    provider,
    fetchedAt: isoNow(),
    dataTimestamp: null,
    stale: false,
    error: null,
    ...extra,
  };
}
export function formatDate(value, timezone = "local") {
  if (!value) return "TBC";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "TBC";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone === "utc" ? "UTC" : undefined,
  }).format(date);
}
export function countdown(value) {
  const ms = new Date(value) - Date.now();
  if (!Number.isFinite(ms)) return "TBC";
  if (ms <= 0) return "in progress";
  const total = Math.floor(ms / 1000),
    d = Math.floor(total / 86400),
    h = Math.floor(total % 86400 / 3600),
    m = Math.floor(total % 3600 / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}
