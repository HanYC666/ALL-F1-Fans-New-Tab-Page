import { createWidget } from "./widget-registry.js";
import { countdown, formatDate, formatTimeOnly } from "../providers/provider-utils.js";

export function renderRaceWeekend(state, data = {}) {
  const body = document.createElement("div");

  const race = data.schedule?.find((x) => new Date(x.startsAt) >= Date.now() - 7200000) ||
    data.schedule?.[0];

  if (!race) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = data.error
      ? "Schedule unavailable offline. Try refreshing when online."
      : "Loading 2026 F1 schedule…";
    body.append(p);
    return createWidget("raceWeekend", "Grand Prix Hub", state, body, "🏁");
  }

  // Race Hero Card
  const hero = document.createElement("div");
  hero.className = "race-hero";

  const meta = document.createElement("div");
  meta.className = "race-meta";

  const roundBadge = document.createElement("span");
  roundBadge.className = "status-pill";
  roundBadge.textContent = race.round ? `ROUND ${race.round}` : "NEXT GP";

  const name = document.createElement("h3");
  name.textContent = race.meetingName;

  const country = document.createElement("div");
  country.className = "race-country";
  country.innerHTML = `<span>📍</span> <span>${race.circuitName || race.country || "Formula 1"}</span>`;

  meta.append(roundBadge, name, country);

  // Countdown Box
  const countdownBox = document.createElement("div");
  countdownBox.className = "countdown-box";

  const countLabel = document.createElement("span");
  countLabel.className = "countdown-label";
  countLabel.textContent = "LIGHTS OUT IN";

  const countDigits = document.createElement("span");
  countDigits.className = "countdown-digits";
  countDigits.id = "race-countdown-timer";
  countDigits.dataset.targetTime = race.startsAt;
  countDigits.textContent = countdown(race.startsAt);

  countdownBox.append(countLabel, countDigits);
  hero.append(meta, countdownBox);
  body.append(hero);

  // Sessions Timetable List
  const sessionList = document.createElement("div");
  sessionList.className = "session-list";

  const sessions = Array.isArray(race.sessions) && race.sessions.length
    ? race.sessions
    : [
      { name: "Qualifying", short: "Q", startsAt: race.startsAt ? new Date(new Date(race.startsAt) - 86400000).toISOString() : null },
      { name: "Grand Prix Race", short: "RAC", startsAt: race.startsAt },
    ];

  const now = Date.now();
  let nextFound = false;

  sessions.forEach((s) => {
    if (!s.startsAt) return;
    const sTime = new Date(s.startsAt).getTime();
    const isPast = sTime + 7200000 < now;
    const isLive = sTime <= now && sTime + 7200000 >= now;
    const isNext = !isPast && !isLive && !nextFound;
    if (isNext || isLive) nextFound = true;

    const row = document.createElement("div");
    row.className = `session-item ${isLive ? "active" : ""} ${isPast ? "done" : ""}`;

    const group = document.createElement("div");
    group.className = "session-name-group";

    const badge = document.createElement("span");
    badge.className = "session-badge";
    badge.textContent = s.short || "FP";

    const sName = document.createElement("span");
    sName.textContent = s.name;

    group.append(badge, sName);

    const timeCol = document.createElement("div");
    timeCol.className = "session-time";

    if (isLive) {
      timeCol.innerHTML = `<span class="status-pill green"><span class="status-dot"></span> LIVE</span>`;
    } else if (isPast) {
      timeCol.innerHTML = `<span class="muted">Finished</span>`;
    } else {
      timeCol.textContent = formatDate(s.startsAt, state.preferences.timezone);
    }

    row.append(group, timeCol);
    sessionList.append(row);
  });

  body.append(sessionList);

  // Source Footer
  const source = document.createElement("div");
  source.className = "source-footer";
  source.innerHTML = `
    <span>Source: ${data.provider || "jolpica"}</span>
    <span>${data.stale ? "⚠️ CACHED" : data.fetchedAt ? "🟢 Live" : ""}</span>
  `;
  body.append(source);

  return createWidget("raceWeekend", "Grand Prix Hub", state, body, "🏁");
}
