import { button } from "../accessibility.js";
import { CONFIG, safeHex } from "../config.js";
import { clearLocalState } from "../storage.js";
import { clearImages, prepareImage, putImage } from "../indexeddb.js";
const field = (label, control) => {
  const row = document.createElement("label");
  row.className = "setting-control";
  const text = document.createElement("span");
  text.textContent = label;
  row.append(text, control);
  return row;
};
export function renderSettings(
  state,
  { onChange, onReset, onImport, onExport, onDelete },
) {
  const panel = document.querySelector("#settings-panel");
  panel.replaceChildren();
  const close = button("Close", () => {
    panel.hidden = true;
    document.querySelector("#settings-button").setAttribute(
      "aria-expanded",
      "false",
    );
  });
  close.className = "panel-close";
  panel.append(close);
  const title = document.createElement("h2");
  title.textContent = "Settings";
  panel.append(title);
  const note = document.createElement("p");
  note.className = "notice";
  note.textContent =
    "Chrome’s native New Tab tiles cannot be read by extensions. Pinned Shortcuts below is the extension-owned replacement; it is not Chrome’s original tile list.";
  panel.append(note);
  const timezone = document.createElement("select");
  ["local", "utc"].forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v === "local" ? "Browser local time" : "UTC";
    timezone.append(o);
  });
  timezone.value = state.preferences.timezone;
  const density = select(
    ["comfortable", "compact", "spacious"],
    state.layout.density,
  );
  const sections = [["General", [
    field(
      "Open links in new tabs",
      Object.assign(document.createElement("input"), {
        type: "checkbox",
        checked: state.preferences.openLinksInNewTab,
      }),
    ),
    field("Timezone", timezone),
  ]], ["Appearance", [
    field(
      "Panel opacity",
      range(state.theme.panelOpacity, .2, 1, .01, (v) => {
        state.theme.panelOpacity = v;
        onChange();
      }),
    ),
    field(
      "Panel blur",
      range(state.theme.panelBlurPx, 0, 40, 1, (v) => {
        state.theme.panelBlurPx = v;
        onChange();
      }),
    ),
    field(
      "Panel radius",
      range(state.theme.panelRadiusPx, 0, 40, 1, (v) => {
        state.theme.panelRadiusPx = v;
        onChange();
      }),
    ),
    field(
      "Accent color",
      Object.assign(document.createElement("input"), {
        type: "color",
        value: safeHex(state.theme.accentColor),
      }),
    ),
  ]], ["Layout", [
    field("Density", density),
    field(
      "Lock layout",
      Object.assign(document.createElement("input"), {
        type: "checkbox",
        checked: state.layout.locked,
      }),
    ),
  ]], ["Backgrounds", [
    field(
      "Rotation mode",
      select(
        ["static", "random-new-tab", "sequential-new-tab", "slideshow"],
        state.theme.backgroundMode,
      ),
    ),
    field(
      "Slideshow seconds",
      range(state.theme.backgroundIntervalSeconds, 5, 3600, 1, (v) => {
        state.theme.backgroundIntervalSeconds = v;
        onChange();
      }),
    ),
    field(
      "Team filter",
      select([
        "all",
        "red-bull",
        "ferrari",
        "mclaren",
        "mercedes",
        "aston-martin",
        "alpine",
        "williams",
        "haas",
        "sauber",
        "rb",
      ], state.theme.teamFilter),
    ),
  ]], ["Privacy & data", []]];
  for (const [name, controls] of sections) {
    const section = document.createElement("section");
    section.className = "settings-section";
    const h = document.createElement("h2");
    h.textContent = name;
    section.append(h);
    const grid = document.createElement("div");
    grid.className = "settings-grid";
    controls.forEach((c) => grid.append(c));
    section.append(grid);
    panel.append(section);
  }
  const actions = document.createElement("div");
  actions.className = "settings-actions";
  actions.append(
    button("Reset layout", () => {
      onReset("layout");
    }),
    button("Reset all settings", () => {
      onReset("all");
    }),
    button("Export settings", onExport),
  );
  const importLabel = document.createElement("label");
  importLabel.append("Import settings");
  const file = document.createElement("input");
  file.type = "file";
  file.accept = "application/json";
  file.addEventListener(
    "change",
    () => file.files[0] && onImport(file.files[0]),
  );
  importLabel.append(file);
  actions.append(
    importLabel,
    button("Delete local data", async () => {
      if (confirm("Delete local settings, cache, and uploaded images?")) {
        await clearLocalState();
        await clearImages();
        onDelete();
      }
    }),
  );
  panel.append(actions);
  const inputs = panel.querySelectorAll("input,select");
  inputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.type === "checkbox") {
        if (input.parentElement.textContent.includes("new tabs")) {
          state.preferences.openLinksInNewTab = input.checked;
        } else state.layout.locked = input.checked;
      } else if (input.type === "color") {
        state.theme.accentColor = safeHex(input.value);
      } else if (input.parentElement.textContent.includes("Timezone")) {
        state.preferences.timezone = input.value;
      } else if (input.parentElement.textContent.includes("Density")) {
        state.layout.density = input.value;
      } else if (input.parentElement.textContent.includes("Rotation")) {
        state.theme.backgroundMode = input.value;
      } else if (input.parentElement.textContent.includes("Team")) {
        state.theme.teamFilter = input.value;
      }
      onChange();
    });
  });
  return panel;
}
function range(value, min, max, step, change) {
  const x = document.createElement("input");
  x.type = "range";
  x.min = min;
  x.max = max;
  x.step = step;
  x.value = value;
  x.addEventListener("input", () => change(Number(x.value)));
  return x;
}
function select(values, value) {
  const x = document.createElement("select");
  values.forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    x.append(o);
  });
  x.value = value;
  return x;
}
