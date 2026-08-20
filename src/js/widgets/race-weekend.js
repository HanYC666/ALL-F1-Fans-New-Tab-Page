import { createWidget } from "./widget-registry.js";
import { countdown, formatDate } from "../providers/provider-utils.js";
export function renderRaceWeekend(state, data = {}) {
  const body = document.createElement("div");
  const race = data.schedule?.find((x) => new Date(x.startsAt) >= Date.now()) ||
    data.schedule?.[0];
  if (!race) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = data.error
      ? "Schedule unavailable offline. Try Refresh when connected."
      : "No schedule data yet.";
    body.append(p);
    return createWidget("raceWeekend", "Race Weekend", state, body);
  }
  const name = document.createElement("h3");
  name.textContent = race.meetingName;
  const details = document.createElement("p");
  details.className = "muted";
  details.textContent = `${race.country || "F1"} · ${
    formatDate(race.startsAt, state.preferences.timezone)
  }`;
  const count = document.createElement("p");
  count.textContent = `Next event ${countdown(race.startsAt)}`;
  body.append(name, details, count);
  const source = document.createElement("div");
  source.className = "source-line";
  source.append(
    Object.assign(document.createElement("span"), {
      className: "muted",
      textContent: `Source: ${data.provider || "offline"}`,
    }),
    Object.assign(document.createElement("span"), {
      className: "muted",
      textContent: data.stale
        ? "STALE"
        : data.fetchedAt
        ? `Updated ${formatDate(data.fetchedAt)}`
        : "",
    }),
  );
  body.append(source);
  return createWidget("raceWeekend", "Race Weekend", state, body);
}
