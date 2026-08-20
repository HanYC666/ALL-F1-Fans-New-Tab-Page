import { createWidget } from "./widget-registry.js";
export function renderStandings(state, data = {}) {
  const body = document.createElement("div");
  const list = document.createElement("div");
  list.className = "data-list";
  (data.drivers || []).slice(0, 5).forEach((x) => {
    const row = document.createElement("div");
    row.className = "data-row";
    const pos = document.createElement("span");
    pos.className = "position";
    pos.textContent = x.position;
    const name = document.createElement("span");
    name.textContent = `${x.name} · ${x.team}`;
    const points = document.createElement("strong");
    points.textContent = x.points;
    row.append(pos, name, points);
    list.append(row);
  });
  if (!data.drivers?.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = data.error
      ? "Standings unavailable offline."
      : "Standings will appear after the first successful refresh.";
    list.append(p);
  }
  body.append(list);
  const source = document.createElement("div");
  source.className = "source-line";
  source.append(
    Object.assign(document.createElement("span"), {
      className: "muted",
      textContent: `Source: ${data.provider || "offline"}`,
    }),
    Object.assign(document.createElement("span"), {
      className: "muted",
      textContent: data.stale ? "STALE" : "",
    }),
  );
  body.append(source);
  return createWidget("standings", "Driver Standings", state, body);
}
