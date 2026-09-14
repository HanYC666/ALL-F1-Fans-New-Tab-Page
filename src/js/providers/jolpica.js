import { CONFIG } from "../config.js";
import { fetchJson, providerMeta, withBackoff } from "./provider-utils.js";

const base = CONFIG.providers.jolpicaBaseUrl;

const sessionIso = (sess) => {
  if (!sess) return null;
  if (sess.date && sess.time) return `${sess.date}T${sess.time}`;
  return sess.date || null;
};

const parseRace = (r, source = "jolpica") => {
  const raceStartsAt = r.date && r.time ? `${r.date}T${r.time}` : r.date || null;
  return {
    round: Number(r.round) || 0,
    season: Number(r.season) || CONFIG.season,
    meetingName: r.raceName || r.Circuit?.circuitName || "Grand Prix",
    circuitName: r.Circuit?.circuitName || "",
    circuitId: r.Circuit?.circuitId || "",
    country: r.Circuit?.Location?.country || "",
    locality: r.Circuit?.Location?.locality || "",
    startsAt: raceStartsAt,
    sessions: [
      { id: "fp1", name: "Free Practice 1", short: "FP1", startsAt: sessionIso(r.FirstPractice) },
      { id: "fp2", name: "Free Practice 2", short: "FP2", startsAt: sessionIso(r.SecondPractice) },
      { id: "fp3", name: "Free Practice 3", short: "FP3", startsAt: sessionIso(r.ThirdPractice) },
      { id: "sprint_quali", name: "Sprint Shootout", short: "SS", startsAt: sessionIso(r.SprintQualifying || r.SprintShootout) },
      { id: "sprint", name: "Sprint Race", short: "SPR", startsAt: sessionIso(r.Sprint) },
      { id: "quali", name: "Qualifying", short: "Q", startsAt: sessionIso(r.Qualifying) },
      { id: "race", name: "Grand Prix Race", short: "RAC", startsAt: raceStartsAt },
    ].filter((s) => Boolean(s.startsAt)),
    source,
  };
};

export const jolpica = {
  id: "jolpica",
  async getSchedule({ season = CONFIG.season, signal } = {}) {
    const json = await withBackoff(() =>
      fetchJson(`${base}/${season}.json`, { signal })
    );
    return {
      ...providerMeta("jolpica"),
      schedule: (json.MRData?.RaceTable?.Races || []).map((r) => parseRace(r, "jolpica")),
      sourceUrl: "https://api.jolpi.ca/ergast/f1/",
    };
  },
  async getStandings({ season = CONFIG.season, signal } = {}) {
    const json = await withBackoff(() =>
      fetchJson(`${base}/${season}/driverstandings.json`, { signal })
    );
    const list = json.MRData?.StandingsTable?.StandingsLists?.[0];
    return {
      ...providerMeta("jolpica"),
      season: Number(season),
      drivers: (list?.DriverStandings || []).map((x) => ({
        position: Number(x.position),
        driverId: x.Driver?.driverId || "",
        code: x.Driver?.code || (x.Driver?.familyName || "").slice(0, 3).toUpperCase(),
        number: x.Driver?.permanentNumber || "",
        name: [x.Driver?.givenName, x.Driver?.familyName].filter(Boolean).join(" "),
        team: x.Constructors?.[0]?.name || "Unknown",
        constructorId: x.Constructors?.[0]?.constructorId || "",
        points: Number(x.points) || 0,
        wins: Number(x.wins) || 0,
      })),
      sourceUrl: "https://api.jolpi.ca/ergast/f1/",
    };
  },
  async getConstructorStandings({ season = CONFIG.season, signal } = {}) {
    try {
      const json = await withBackoff(() =>
        fetchJson(`${base}/${season}/constructorstandings.json`, { signal })
      );
      const list = json.MRData?.StandingsTable?.StandingsLists?.[0];
      return {
        ...providerMeta("jolpica"),
        season: Number(season),
        constructors: (list?.ConstructorStandings || []).map((x) => ({
          position: Number(x.position),
          constructorId: x.Constructor?.constructorId || "",
          name: x.Constructor?.name || "Unknown",
          points: Number(x.points) || 0,
          wins: Number(x.wins) || 0,
        })),
        sourceUrl: "https://api.jolpi.ca/ergast/f1/",
      };
    } catch {
      return { constructors: [] };
    }
  },
  async getResults({ season = CONFIG.season, round, signal } = {}) {
    const json = await withBackoff(() =>
      fetchJson(`${base}/${season}/${round}/results.json`, { signal })
    );
    return {
      ...providerMeta("jolpica"),
      results: (json.MRData?.RaceTable?.Races?.[0]?.Results || []).map((x) => ({
        position: Number(x.position),
        driverId: x.Driver?.driverId || "",
        name: [x.Driver?.givenName, x.Driver?.familyName].filter(Boolean).join(" "),
        team: x.Constructor?.name || "",
        status: x.status || "",
        points: Number(x.points) || 0,
      })),
      sourceUrl: "https://api.jolpi.ca/ergast/f1/",
    };
  },
};
