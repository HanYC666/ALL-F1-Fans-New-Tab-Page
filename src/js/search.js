const SEARCH_ENGINES = {
  google: {
    name: "Google",
    icon: "G",
    action: "https://www.google.com/search",
    param: "q",
  },
  duckduckgo: {
    name: "DuckDuckGo",
    icon: "🦆",
    action: "https://duckduckgo.com/",
    param: "q",
  },
  bing: {
    name: "Bing",
    icon: "b",
    action: "https://www.bing.com/search",
    param: "q",
  },
  youtube: {
    name: "YouTube",
    icon: "▶",
    action: "https://www.youtube.com/results",
    param: "search_query",
  },
  f1: {
    name: "F1.com",
    icon: "🏁",
    action: "https://www.formula1.com/en/latest/search.html",
    param: "q",
  },
};

export function initSearch(defaultEngine = "google") {
  const form = document.querySelector("#google-search-form");
  const input = document.querySelector("#search-input");
  const engineBtn = document.querySelector("#search-engine-btn");
  const engineIcon = document.querySelector("#search-engine-icon");
  const engineName = document.querySelector("#search-engine-name");
  const searchFocusBtn = document.querySelector("#search-focus-btn");

  let currentEngineKey = SEARCH_ENGINES[defaultEngine] ? defaultEngine : "google";

  const applyEngine = (key) => {
    const eng = SEARCH_ENGINES[key] || SEARCH_ENGINES.google;
    currentEngineKey = key;
    form.action = eng.action;
    input.name = eng.param;
    if (engineIcon) engineIcon.textContent = eng.icon;
    if (engineName) engineName.textContent = eng.name;
  };

  applyEngine(currentEngineKey);

  // Switch engine on click
  if (engineBtn) {
    const keys = Object.keys(SEARCH_ENGINES);
    engineBtn.addEventListener("click", () => {
      const nextIdx = (keys.indexOf(currentEngineKey) + 1) % keys.length;
      applyEngine(keys[nextIdx]);
      input.focus();
    });
  }

  // Focus shortcut '/'
  window.addEventListener("keydown", (e) => {
    if (
      e.key === "/" &&
      document.activeElement?.tagName !== "INPUT" &&
      document.activeElement?.tagName !== "TEXTAREA"
    ) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  if (searchFocusBtn) {
    searchFocusBtn.addEventListener("click", () => {
      input.focus();
      input.select();
    });
  }

  form.addEventListener("submit", (e) => {
    if (!input.value.trim()) {
      e.preventDefault();
      input.focus();
    }
  });

  return { focus: () => input.focus(), setEngine: applyEngine };
}

export function safeExternalUrl(value) {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

export function youtubeSearchUrl(
  {
    season = new Date().getFullYear(),
    grandPrix = "Formula 1",
    session = "Race commentary",
  } = {},
) {
  const query = [season, grandPrix, session, "YouTube"].filter(Boolean).join(" ");
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
