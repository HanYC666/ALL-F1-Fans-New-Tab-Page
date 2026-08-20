import { createWidget } from "./widget-registry.js";
import { safeExternalUrl, youtubeSearchUrl } from "../search.js";
export function renderStreams(
  state,
  {
    results = [],
    loading = false,
    error = null,
    grandPrix = "Formula 1",
    onRefresh = () => {},
  } = {},
) {
  const body = document.createElement("div");
  const controls = document.createElement("div");
  controls.className = "stream-controls";
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Session to search");
  ["Race commentary", "Qualifying commentary", "FP2 commentary"].forEach(
    (x) => {
      const o = document.createElement("option");
      o.value = x;
      o.textContent = x;
      select.append(o);
    },
  );
  const refresh = document.createElement("button");
  refresh.type = "button";
  refresh.textContent = loading ? "Searching…" : "Find streams";
  refresh.disabled = loading;
  refresh.addEventListener("click", () => onRefresh(select.value));
  controls.append(select, refresh);
  body.append(controls);
  const direct = document.createElement("a");
  direct.className = "button-link";
  direct.href = safeExternalUrl(
    youtubeSearchUrl({ grandPrix, session: select.value }),
  );
  direct.target = "_blank";
  direct.rel = "noopener noreferrer";
  direct.textContent = "Search YouTube directly (no API key)";
  select.addEventListener("change", () => {
    direct.href = safeExternalUrl(
      youtubeSearchUrl({ grandPrix, session: select.value }),
    );
  });
  body.append(direct);
  const disclaimer = document.createElement("p");
  disclaimer.className = "muted";
  disclaimer.textContent =
    "Commentary search only. Availability and rights vary by region; check the uploader and official page.";
  body.append(disclaimer);
  const list = document.createElement("div");
  (results || []).forEach((x) => {
    const url = safeExternalUrl(x.url);
    if (!url) return;
    const a = document.createElement("a");
    a.className = "stream-result";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    const t = document.createElement("strong");
    t.textContent = x.title;
    const m = document.createElement("span");
    m.className = "muted";
    m.textContent = `${x.channelTitle || "Unknown channel"} · ${
      x.verifiedByAllowlist ? "Allowlisted" : "Unverified result"
    } · ${x.status || "video"}`;
    a.append(t, m);
    list.append(a);
  });
  if (!results?.length && !loading) {
    const p = document.createElement("p");
    p.className = error ? "error" : "empty";
    p.textContent = error ||
      "Use the direct YouTube search above, or configure the optional proxy for results in this card.";
    list.append(p);
  }
  body.append(list);
  return createWidget("streams", "YouTube Commentary Discovery", state, body);
}
