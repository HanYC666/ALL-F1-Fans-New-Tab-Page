import { createWidget } from "./widget-registry.js";
import { countdown, formatDate, formatTimeOnly } from "../providers/provider-utils.js";

export function getCurrentGrandPrix(schedule = []) {
  if (!Array.isArray(schedule) || !schedule.length) return null;
  const now = Date.now();
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;

  // 1. Check if any race has lights out within 12 hours (or up to 4h after start)
  const activeRace = schedule.find((r) => {
    if (!r.startsAt) return false;
    const t = new Date(r.startsAt).getTime();
    return t - now <= TWELVE_HOURS && now - t <= 4 * 3600 * 1000;
  });
  if (activeRace) return activeRace;

  // 2. Next upcoming race
  const upcomingRace = schedule.find((r) => {
    if (!r.startsAt) return false;
    const t = new Date(r.startsAt).getTime();
    return t > now;
  });
  if (upcomingRace) return upcomingRace;

  // 3. Past 1 Grand Prix (most recent past race)
  const pastRaces = schedule.filter((r) => {
    if (!r.startsAt) return false;
    return new Date(r.startsAt).getTime() <= now;
  });
  if (pastRaces.length) {
    return pastRaces[pastRaces.length - 1];
  }

  return schedule[0];
}

export function renderRaceWeekend(state, data = {}) {
  const body = document.createElement("div");

  const race = getCurrentGrandPrix(data.schedule);

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
  roundBadge.textContent = race.round ? `ROUND ${race.round}` : "ACTIVE GP";

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

  const now = Date.now();
  const raceTime = race.startsAt ? new Date(race.startsAt).getTime() : 0;
  const isRaceActive = raceTime <= now && now - raceTime <= 4 * 3600 * 1000;
  const isPast = raceTime && raceTime < now && !isRaceActive;

  if (isRaceActive) {
    countLabel.textContent = "GRAND PRIX";
  } else if (isPast) {
    countLabel.textContent = "RACE FINISHED";
  } else {
    countLabel.textContent = "LIGHTS OUT IN";
  }

  const countDigits = document.createElement("span");
  countDigits.className = "countdown-digits";
  countDigits.id = "race-countdown-timer";
  countDigits.dataset.targetTime = race.startsAt;
  countDigits.textContent = isRaceActive ? "LIVE RACING" : countdown(race.startsAt);

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

  let nextFound = false;

  sessions.forEach((s) => {
    if (!s.startsAt) return;
    const sTime = new Date(s.startsAt).getTime();
    const isSessionPast = sTime + 7200000 < now;
    const isSessionLive = sTime <= now && sTime + 7200000 >= now;
    const isNext = !isSessionPast && !isSessionLive && !nextFound;
    if (isNext || isSessionLive) nextFound = true;

    const row = document.createElement("div");
    row.className = `session-item ${isSessionLive ? "active" : ""} ${isSessionPast ? "done" : ""}`;

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

    if (isSessionLive) {
      timeCol.innerHTML = `<span class="status-pill green"><span class="status-dot"></span> LIVE</span>`;
    } else if (isSessionPast) {
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
    <span>Schedule: ${data.provider || "jolpica"}</span>
    <span>${data.stale ? "⚠️ CACHED" : data.fetchedAt ? "🟢 Live Telemetry" : ""}</span>
  `;
  body.append(source);

  return createWidget("raceWeekend", "Grand Prix Hub", state, body, "🏁");
}
