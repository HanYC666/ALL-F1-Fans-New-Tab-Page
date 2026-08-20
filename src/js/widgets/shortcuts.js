import { createWidget } from "./widget-registry.js";
import { button } from "../accessibility.js";
import { safeExternalUrl } from "../search.js";
export function renderShortcuts(state, onChange) {
  const body = document.createElement("div");
  const list = document.createElement("div");
  list.className = "shortcut-list";
  if (!state.shortcuts.length) {
    const n = document.createElement("p");
    n.className = "empty";
    n.textContent = "No shortcuts yet. Add one in Settings.";
    list.append(n);
  }
  state.shortcuts.forEach((s, index) => {
    const row = document.createElement("div");
    const a = document.createElement("a");
    a.className = "shortcut-link";
    a.href = safeExternalUrl(s.url) || "#";
    a.target = state.preferences.openLinksInNewTab ? "_blank" : "_self";
    a.rel = "noopener noreferrer";
    const title = document.createElement("span");
    title.textContent = s.title;
    const domain = document.createElement("span");
    domain.className = "shortcut-domain";
    try {
      domain.textContent = new URL(s.url).hostname;
    } catch {}
    a.append(title, domain);
    row.append(a);
    const remove = button("×", () => {
      state.shortcuts.splice(index, 1);
      onChange(state);
    });
    remove.title = `Remove ${s.title}`;
    row.append(remove);
    list.append(row);
  });
  body.append(list);
  return createWidget("shortcuts", "Pinned Shortcuts", state, body);
}
