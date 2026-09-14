import { createWidget } from "./widget-registry.js";
import teams from "../../data/teams.json" with { type: "json" };

const getTeamColor = (teamName = "") => {
  const norm = teamName.toLowerCase();
  if (norm.includes("red bull")) return "#3671c6";
  if (norm.includes("ferrari")) return "#e8002d";
  if (norm.includes("mclaren")) return "#ff8000";
  if (norm.includes("mercedes")) return "#27f4d2";
  if (norm.includes("aston")) return "#229971";
  if (norm.includes("alpine")) return "#0093cc";
  if (norm.includes("williams")) return "#64c4ff";
  if (norm.includes("haas")) return "#b6babd";
  if (norm.includes("sauber") || norm.includes("audi")) return "#52e252";
  if (norm.includes("rb") || norm.includes("racing bulls") || norm.includes("alphatauri")) return "#6692ff";
  return "#e10600";
};

let currentTab = "drivers";

export function renderStandings(state, data = {}) {
  const body = document.createElement("div");

  // Tabs for Drivers vs Constructors
  const tabs = document.createElement("div");
  tabs.className = "standings-tabs";

  const driverTab = document.createElement("button");
  driverTab.type = "button";
  driverTab.className = `tab-btn ${currentTab === "drivers" ? "active" : ""}`;
  driverTab.textContent = "Drivers";

  const constrTab = document.createElement("button");
  constrTab.type = "button";
  constrTab.className = `tab-btn ${currentTab === "constructors" ? "active" : ""}`;
  constrTab.textContent = "Constructors";

  tabs.append(driverTab, constrTab);
  body.append(tabs);

  const listContainer = document.createElement("div");
  listContainer.className = "standings-list";

  const renderList = () => {
    listContainer.replaceChildren();

    if (currentTab === "drivers") {
      const drivers = data.drivers || [];
      if (!drivers.length) {
        const p = document.createElement("p");
        p.className = "empty";
        p.textContent = data.error
          ? "Standings unavailable offline."
          : "Loading driver standings…";
        listContainer.append(p);
      } else {
        drivers.slice(0, 10).forEach((x) => {
          const row = document.createElement("div");
          row.className = "standing-row";

          const teamCol = getTeamColor(x.team);
          row.style.setProperty("--row-team-color", teamCol);

          const pos = document.createElement("span");
          pos.className = "standing-pos";
          pos.textContent = x.position;

          const bar = document.createElement("span");
          bar.className = "team-color-bar";

          const info = document.createElement("div");
          info.className = "driver-info";

          const name = document.createElement("span");
          name.className = "driver-name";
          name.textContent = `${x.name} (${x.code || "F1"})`;

          const tName = document.createElement("span");
          tName.className = "team-name";
          tName.textContent = x.team;

          info.append(name, tName);

          const pts = document.createElement("span");
          pts.className = "points-badge";
          pts.textContent = `${x.points} PTS`;

          row.append(pos, bar, info, pts);
          listContainer.append(row);
        });
      }
    } else {
      const constructors = data.constructors || [];
      if (!constructors.length) {
        const p = document.createElement("p");
        p.className = "empty";
        p.textContent = data.error
          ? "Constructor standings unavailable offline."
          : "Loading constructor standings…";
        listContainer.append(p);
      } else {
        constructors.slice(0, 10).forEach((x) => {
          const row = document.createElement("div");
          row.className = "standing-row";

          const teamCol = getTeamColor(x.name);
          row.style.setProperty("--row-team-color", teamCol);

          const pos = document.createElement("span");
          pos.className = "standing-pos";
          pos.textContent = x.position;

          const bar = document.createElement("span");
          bar.className = "team-color-bar";

          const info = document.createElement("div");
          info.className = "driver-info";

          const name = document.createElement("span");
          name.className = "driver-name";
          name.textContent = x.name;

          const sub = document.createElement("span");
          sub.className = "team-name";
          sub.textContent = x.wins ? `${x.wins} wins` : "0 wins";

          info.append(name, sub);

          const pts = document.createElement("span");
          pts.className = "points-badge";
          pts.textContent = `${x.points} PTS`;

          row.append(pos, bar, info, pts);
          listContainer.append(row);
        });
      }
    }
  };

  driverTab.addEventListener("click", () => {
    currentTab = "drivers";
    driverTab.className = "tab-btn active";
    constrTab.className = "tab-btn";
    renderList();
  });

  constrTab.addEventListener("click", () => {
    currentTab = "constructors";
    constrTab.className = "tab-btn active";
    driverTab.className = "tab-btn";
    renderList();
  });

  renderList();
  body.append(listContainer);

  const source = document.createElement("div");
  source.className = "source-footer";
  source.innerHTML = `
    <span>Championship Standings</span>
    <span>${data.stale ? "⚠️ CACHED" : "🟢 Live"}</span>
  `;
  body.append(source);

  return createWidget("standings", "Championship Standings", state, body, "🏆");
}
