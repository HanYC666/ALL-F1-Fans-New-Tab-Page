import { createWidget } from "./widget-registry.js";
import { safeExternalUrl } from "../search.js";

export function renderShortcuts(state, onChange) {
  const body = document.createElement("div");
  const grid = document.createElement("div");
  grid.className = "shortcut-grid";

  (state.shortcuts || []).forEach((s, index) => {
    let hostname = "";
    try {
      hostname = new URL(s.url).hostname;
    } catch {
      hostname = s.url;
    }

    const tile = document.createElement("a");
    tile.className = "shortcut-tile";
    tile.href = safeExternalUrl(s.url) || "#";
    tile.target = state.preferences.openLinksInNewTab ? "_blank" : "_self";
    tile.rel = "noopener noreferrer";

    // High-resolution Google favicon resolver
    const icon = document.createElement("img");
    icon.className = "shortcut-favicon";
    icon.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
    icon.alt = `${s.title} icon`;
    icon.loading = "lazy";
    icon.onerror = () => {
      icon.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/></svg>";
    };

    const titleSpan = document.createElement("span");
    titleSpan.className = "shortcut-title-text";
    titleSpan.textContent = s.title;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "shortcut-delete-btn";
    delBtn.innerHTML = "×";
    delBtn.title = `Delete ${s.title}`;
    delBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      state.shortcuts.splice(index, 1);
      onChange(state);
    });

    tile.append(icon, titleSpan, delBtn);
    grid.append(tile);
  });

  // "+ Add Shortcut" card
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "add-shortcut-btn";
  addBtn.innerHTML = `<span>➕</span><span>Add Link</span>`;
  addBtn.addEventListener("click", () => {
    const title = prompt("Shortcut Title (e.g. F1 Live Tracker):");
    if (!title?.trim()) return;
    let url = prompt("URL (e.g. https://f1.com):");
    if (!url?.trim()) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url.trim()}`;
    state.shortcuts.push({
      id: crypto.randomUUID(),
      title: title.trim(),
      url: url.trim(),
      position: state.shortcuts.length,
      iconMode: "favicon",
      createdAt: Date.now(),
    });
    onChange(state);
  });
  grid.append(addBtn);

  body.append(grid);
  return createWidget("shortcuts", "Pinned Shortcuts", state, body, "🔗");
}
