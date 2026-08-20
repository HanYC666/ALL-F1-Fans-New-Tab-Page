import { CONFIG } from "../config.js";
import { fetchJson, providerMeta, withBackoff } from "./provider-utils.js";
export const openF1 = {
  id: "openf1",
  async getSessions({ year = CONFIG.season, signal } = {}) {
    const data = await withBackoff(() =>
      fetchJson(
        `${CONFIG.providers.openF1BaseUrl}/sessions?year=${
          encodeURIComponent(year)
        }`,
        { signal },
      )
    );
    return {
      ...providerMeta("openf1"),
      sessions: Array.isArray(data)
        ? data.map((x) => ({
          meetingName: x.meeting_name || x.circuit_short_name || "Session",
          sessionName: x.session_name || "Session",
          startsAt: x.date_start || null,
          status: "scheduled",
          source: "openf1",
        }))
        : [],
      sourceUrl: "https://openf1.org/",
    };
  },
};
