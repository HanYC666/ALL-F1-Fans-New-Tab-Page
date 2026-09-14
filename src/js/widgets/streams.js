import { createWidget } from "./widget-registry.js";
import { safeExternalUrl, youtubeSearchUrl } from "../search.js";

const CURATED_COMMENTARY_CHANNELS = [
  { name: "P1 Matt & Tommy", query: "P1 with Matt and Tommy live commentary" },
  { name: "The Race", query: "The Race F1 live watchalong commentary" },
  { name: "Sky Sports F1", query: "Sky Sports F1 live race commentary" },
  { name: "Autosport", query: "Autosport F1 live podcast commentary" },
  { name: "F1 Official", query: "Formula 1 official live reaction" },
];

export function renderStreams(
  state,
  {
    results = [],
    loading = false,
    grandPrix = "Formula 1",
    onRefresh = () => {},
  } = {},
) {
  const body = document.createElement("div");
  const hub = document.createElement("div");
  hub.className = "streams-hub";

  // Session Selector
  const selectorBar = document.createElement("div");
  selectorBar.className = "session-selector-bar";

  const select = document.createElement("select");
  select.className = "session-dropdown";
  select.setAttribute("aria-label", "Session commentary to search");

  [
    "Race live commentary",
    "Qualifying live commentary",
    "FP2 live commentary",
    "Sprint live commentary",
    "Post-Race reaction & analysis",
  ].forEach((x) => {
    const o = document.createElement("option");
    o.value = x;
    o.textContent = x;
    select.append(o);
  });

  selectorBar.append(select);
  hub.append(selectorBar);

  // Hero YouTube Direct Search Button (Styled with Theme Color)
  const directLink = document.createElement("a");
  directLink.className = "youtube-hero-btn";
  directLink.target = "_blank";
  directLink.rel = "noopener noreferrer";

  const updateDirectLink = () => {
    directLink.href = safeExternalUrl(
      youtubeSearchUrl({ grandPrix, session: select.value })
    ) || "#";
    directLink.innerHTML = `<span>▶</span> <span>Search "${grandPrix} ${select.value}"</span>`;
  };

  select.addEventListener("change", updateDirectLink);
  updateDirectLink();
  hub.append(directLink);

  // Curated Channels Quick Links
  const curTitle = document.createElement("p");
  curTitle.className = "muted";
  curTitle.textContent = "Featured Fan & Official Watchalongs:";
  hub.append(curTitle);

  const channelRow = document.createElement("div");
  channelRow.className = "curated-channels";

  CURATED_COMMENTARY_CHANNELS.forEach((c) => {
    const chip = document.createElement("a");
    chip.className = "channel-chip";
    chip.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(grandPrix + " " + c.query)}`;
    chip.target = "_blank";
    chip.rel = "noopener noreferrer";
    chip.innerHTML = `<span>📺</span> <span>${c.name}</span>`;
    channelRow.append(chip);
  });
  hub.append(channelRow);

  // Structured Proxy Results (if any)
  if (results?.length) {
    const resList = document.createElement("div");
    resList.className = "standings-list";
    results.forEach((x) => {
      const url = safeExternalUrl(x.url);
      if (!url) return;
      const a = document.createElement("a");
      a.className = "standing-row";
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `
        <span class="widget-icon">▶</span>
        <span class="team-color-bar" style="background:var(--page-accent); box-shadow:0 0 8px var(--page-accent);"></span>
        <div class="driver-info">
          <span class="driver-name">${x.title}</span>
          <span class="team-name">${x.channelTitle || "YouTube"} · ${x.verifiedByAllowlist ? "Verified" : "Stream"}</span>
        </div>
        <span class="points-badge">OPEN</span>
      `;
      resList.append(a);
    });
    hub.append(resList);
  }

  body.append(hub);

  // Clean, meaningful status line
  const source = document.createElement("div");
  source.className = "source-footer";
  source.innerHTML = `
    <span>Active: ${grandPrix}</span>
    <span>Direct YouTube search · 0 API keys</span>
  `;
  body.append(source);

  return createWidget("streams", "Live Streams & Commentary", state, body, "📺");
}
