import test from "node:test";
import assert from "node:assert/strict";
import { validateRequest } from "../../server/youtube-search.js";
test("server accepts only structured requests", () => {
  assert.deepEqual(
    validateRequest({
      season: 2026,
      grandPrix: "Monaco",
      session: "FP2",
      language: "en",
    }),
    {
      season: 2026,
      grandPrix: "Monaco",
      session: "FP2",
      language: "en",
      forceRefresh: false,
    },
  );
  assert.throws(() =>
    validateRequest({
      season: 2026,
      grandPrix: "https://evil",
      session: "FP2",
      language: "en",
    })
  );
});
