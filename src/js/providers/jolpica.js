import { CONFIG } from "../config.js";
import { fetchJson, providerMeta, withBackoff } from "./provider-utils.js";
const base = CONFIG.providers.jolpicaBaseUrl;
const race = (r, source = "jolpica") => ({
  round: Number(r.round) || 0,
  meetingName: r.raceName || r.Circuit?.circuitName || "Grand Prix",
  country: r.Circuit?.Location?.country || "",
  startsAt: r.date && r.time ? `${r.date}T${r.time}` : r.date || null,
  source,
});
export const jolpica = {
  id: "jolpica",
  async getSchedule({ season = CONFIG.season, signal } = {}) {
    const json = await withBackoff(() =>
      fetchJson(`${base}/${season}.json`, { signal })
    );
    return {
      ...providerMeta("jolpica"),
      schedule: (json.MRData?.RaceTable?.Races || []).map(race),
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
        name: [x.Driver?.givenName, x.Driver?.familyName].filter(Boolean).join(
          " ",
        ),
        team: x.Constructors?.[0]?.name || "Unknown",
        points: Number(x.points) || 0,
        wins: Number(x.wins) || 0,
      })),
      sourceUrl: "https://api.jolpi.ca/ergast/f1/",
    };
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
        name: [x.Driver?.givenName, x.Driver?.familyName].filter(Boolean).join(
          " ",
        ),
        team: x.Constructor?.name || "",
        status: x.status || "",
      })),
      sourceUrl: "https://api.jolpi.ca/ergast/f1/",
    };
  },
};
