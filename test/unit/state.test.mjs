import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeShortcut, sanitizeState } from "../../src/js/state.js";
import { youtubeSearchUrl } from "../../src/js/search.js";
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
  const s = sanitizeState({ cache: { lastBackground: "fallback-grid" } });
  assert.equal(s.theme.panelOpacity, .72);
  assert.equal(s.theme.backgroundIntervalSeconds, 30);
  assert.equal(s.cache.lastBackground, "fallback-grid");
});
