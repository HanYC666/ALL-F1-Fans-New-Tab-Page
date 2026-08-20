const CONFIG = {
  apiKey: process.env.YOUTUBE_DATA_API_KEY || "==YOUTUBE_DATA_API_KEY==",
  allowlist: new Set(
    (process.env.YOUTUBE_ALLOWED_CHANNEL_IDS || "").split(",").map((x) =>
      x.trim()
    ).filter(Boolean),
  ),
  maxResults: 5,
  ttlMs: 60_000,
};
const cache = new Map();
const hits = new Map();
const allowedSeason = (x) => Number.isInteger(x) && x >= 1950 && x <= 2100;
const allowedText = (x) =>
  typeof x === "string" && x.length >= 1 && x.length <= 80 &&
  /^[\p{L}\p{N} &'().-]+$/u.test(x);
export function validateRequest(body) {
  if (
    !body || typeof body !== "object" || !allowedSeason(body.season) ||
    !allowedText(body.grandPrix) || !allowedText(body.session) ||
    !["en", "es", "fr", "de", "it", "pt"].includes(body.language)
  ) throw new Error("Invalid structured search parameters.");
  return {
    season: body.season,
    grandPrix: body.grandPrix,
    session: body.session,
    language: body.language,
    forceRefresh: Boolean(body.forceRefresh),
  };
}
function clientKey(req) {
  return String(
    req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress ||
      "anonymous",
  ).split(",")[0].slice(0, 80);
}
function rateLimited(key) {
  const now = Date.now(),
    recent = (hits.get(key) || []).filter((x) => now - x < 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 10;
}
export async function handler(req, res) {
  if (req.method !== "POST") {
    return respond(res, 405, { error: "POST required" });
  }
  if (rateLimited(clientKey(req))) {
    return respond(res, 429, { error: "Rate limit reached. Try again later." });
  }
  try {
    const body = validateRequest(
      typeof req.body === "string" ? JSON.parse(req.body) : req.body,
    );
    const key = JSON.stringify(body);
    const old = cache.get(key);
    if (old && !body.forceRefresh && old.expiresAt > Date.now()) {
      return respond(res, 200, old.payload);
    }
    if (!CONFIG.apiKey || CONFIG.apiKey.includes("==")) {
      return respond(res, 503, { error: "YouTube proxy is not configured." });
    }
    const params = new URLSearchParams({
      part: "snippet",
      q: `${body.grandPrix} Grand Prix ${body.session} live commentary ${body.season}`,
      type: "video",
      maxResults: String(CONFIG.maxResults),
      order: "relevance",
      key: CONFIG.apiKey,
    });
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
    );
    if (response.status === 403) {
      return respond(res, 429, { error: "YouTube quota is unavailable." });
    }
    if (!response.ok) throw new Error("YouTube provider failed.");
    const json = await response.json();
    const payload = {
      provider: "youtube",
      fetchedAt: new Date().toISOString(),
      results: (json.items || []).map((x) => ({
        videoId: x.id?.videoId,
        title: x.snippet?.title || "Untitled",
        channelTitle: x.snippet?.channelTitle || "Unknown channel",
        channelId: x.snippet?.channelId || "",
        status: "video",
        verifiedByAllowlist: CONFIG.allowlist.has(x.snippet?.channelId),
        url: `https://www.youtube.com/watch?v=${
          encodeURIComponent(x.id?.videoId || "")
        }`,
      })).filter((x) => x.videoId),
    };
    cache.set(key, { expiresAt: Date.now() + CONFIG.ttlMs, payload });
    return respond(res, 200, payload);
  } catch (e) {
    return respond(res, 400, { error: e.message || "Invalid request" });
  }
}
function respond(res, status, payload) {
  res.statusCode = status;
  res.setHeader?.("Content-Type", "application/json");
  return res.end?.(JSON.stringify(payload));
}
export default handler;
