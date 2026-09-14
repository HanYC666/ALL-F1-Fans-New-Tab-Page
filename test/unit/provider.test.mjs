import test from "node:test";
import assert from "node:assert/strict";
import { countdown } from "../../src/js/providers/provider-utils.js";
import { getCurrentGrandPrix } from "../../src/js/widgets/race-weekend.js";

test("countdown handles invalid and past values", () => {
  assert.equal(countdown("not-a-date"), "TBC");
  assert.equal(
    countdown(new Date(Date.now() - 1000).toISOString()),
    "in progress",
  );
});

test("getCurrentGrandPrix prioritizes races within 12 hours or next upcoming", () => {
  const now = Date.now();
  const pastRace = {
    round: 1,
    meetingName: "Bahrain Grand Prix",
    startsAt: new Date(now - 86400000 * 7).toISOString(),
  };
  const activeRace = {
    round: 2,
    meetingName: "Saudi Arabian Grand Prix",
    startsAt: new Date(now + 2 * 3600 * 1000).toISOString(), // 2 hours from now (within 12h)
  };
  const futureRace = {
    round: 3,
    meetingName: "Australian Grand Prix",
    startsAt: new Date(now + 86400000 * 14).toISOString(),
  };

  const schedule = [pastRace, activeRace, futureRace];
  const selected = getCurrentGrandPrix(schedule);
  assert.equal(selected.meetingName, "Saudi Arabian Grand Prix");
});

test("getCurrentGrandPrix falls back to most recent past race if all past", () => {
  const now = Date.now();
  const pastRace1 = {
    round: 1,
    meetingName: "Race 1",
    startsAt: new Date(now - 86400000 * 14).toISOString(),
  };
  const pastRace2 = {
    round: 2,
    meetingName: "Race 2",
    startsAt: new Date(now - 86400000 * 7).toISOString(),
  };

  const selected = getCurrentGrandPrix([pastRace1, pastRace2]);
  assert.equal(selected.meetingName, "Race 2");
});
