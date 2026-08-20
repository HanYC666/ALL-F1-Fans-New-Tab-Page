import test from "node:test";
import assert from "node:assert/strict";
import { countdown } from "../../src/js/providers/provider-utils.js";
test("countdown handles invalid and past values", () => {
  assert.equal(countdown("not-a-date"), "TBC");
  assert.equal(
    countdown(new Date(Date.now() - 1000).toISOString()),
    "in progress",
  );
});
