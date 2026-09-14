import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeShortcut, sanitizeState, DEFAULT_STATE } from "../../src/js/state.js";
import { youtubeSearchUrl } from "../../src/js/search.js";
import { moveWidget, swapWidgets } from "../../src/js/layout.js";

test("state values are constrained", () => {
  const s = sanitizeState({
    theme: {
      panelOpacity: 9,
      panelBlurPx: -2,
      backgroundIntervalSeconds: 1,
      accentColor: "red",
    },
    layout: { widgets: { raceWeekend: { x: 99, w: 99 } } },
  });
  assert.equal(s.theme.panelOpacity, 1);
  assert.equal(s.theme.panelBlurPx, 0);
  assert.equal(s.theme.backgroundIntervalSeconds, 5);
  assert.equal(s.theme.accentColor, "#e10600");
  assert.ok(
    s.layout.widgets.raceWeekend.x + s.layout.widgets.raceWeekend.w <= 13,
  );
});

test("moveWidget adjusts coordinates within grid bounds", () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  moveWidget(state, "raceWeekend", 2, 1);
  assert.equal(state.layout.widgets.raceWeekend.x, 3);
  assert.equal(state.layout.widgets.raceWeekend.y, 2);
});

test("swapWidgets exchanges positions of two widgets", () => {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  const origRaceX = state.layout.widgets.raceWeekend.x;
  const origStandingsX = state.layout.widgets.standings.x;

  swapWidgets(state, "raceWeekend", "standings");

  assert.equal(state.layout.widgets.raceWeekend.x, origStandingsX);
  assert.equal(state.layout.widgets.standings.x, origRaceX);
});

test("shortcut validation rejects unsafe schemes", () => {
  assert.equal(sanitizeShortcut({ url: "javascript:alert(1)" }), null);
  assert.equal(sanitizeShortcut({ url: "data:text/html,x" }), null);
  assert.equal(
    sanitizeShortcut({ url: "https://example.com" }).url,
    "https://example.com/",
  );
});

test("direct YouTube search does not need an API key", () => {
  const url = youtubeSearchUrl({
    season: 2026,
    grandPrix: "Monaco",
    session: "FP2 commentary",
  });
  assert.match(url, /^https:\/\/www\.youtube\.com\/results\?search_query=/);
  assert.match(decodeURIComponent(url), /2026 Monaco FP2 commentary YouTube/);
});

test("default settings survive sanitization and cache is retained", () => {
  const s = sanitizeState({
    cache: { lastBackground: "fallback-grid" },
    theme: { disabledBackgrounds: ["ferrari", "mclaren", 123] },
  });
  assert.equal(s.theme.panelOpacity, 0.72);
  assert.equal(s.theme.backgroundIntervalSeconds, 30);
  assert.equal(s.cache.lastBackground, "fallback-grid");
  assert.deepEqual(s.theme.disabledBackgrounds, ["ferrari", "mclaren"]);
});

