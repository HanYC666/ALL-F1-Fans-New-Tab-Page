import { clamp } from "./config.js";

export function applyLayout(state) {
  const grid = document.querySelector("#widget-grid");
  if (!grid) return;

  grid.className = `density-${state.layout.density || "comfortable"}`;

  if (state.theme.gridGapPx !== undefined) {
    grid.style.setProperty("--hypr-gap", `${state.theme.gridGapPx}px`);
  }
  if (state.theme.panelRadiusPx !== undefined) {
    document.documentElement.style.setProperty("--hypr-radius", `${state.theme.panelRadiusPx}px`);
  }

  for (const [id, v] of Object.entries(state.layout.widgets || {})) {
    const el = document.querySelector(`[data-widget-id="${id}"]`);
    if (!el) continue;
    el.hidden = !v.visible;
    el.style.setProperty("--grid-x", v.x);
    el.style.setProperty("--grid-y", v.y);
    el.style.setProperty("--grid-w", v.w);
    el.style.setProperty("--grid-h", v.h);
    el.style.setProperty("--widget-opacity", v.opacity);
    el.style.setProperty("--widget-blur", `${v.blurPx}px`);
  }
}

export function moveWidget(state, id, dx, dy) {
  const v = state.layout.widgets[id];
  if (!v || state.layout.locked) return state;
  v.x = clamp(v.x + dx, 1, 13 - v.w);
  v.y = clamp(v.y + dy, 1, 20);
  return state;
}

export function resizeWidget(state, id, preset) {
  const v = state.layout.widgets[id];
  if (!v || state.layout.locked) return state;
  const sizes = { small: [4, 3], medium: [4, 5], large: [6, 6], full: [12, 4] };
  const [w, h] = sizes[preset] || sizes.medium;
  v.w = w;
  v.h = h;
  v.x = clamp(v.x, 1, 13 - w);
  v.y = clamp(v.y, 1, 20);
  return state;
}

export function enableDragging(state, onChange) {
  document.querySelectorAll(".drag-handle").forEach((handle) => {
    handle.addEventListener("keydown", (e) => {
      if (state.layout.locked) return;
      const id = handle.closest(".widget")?.dataset.widgetId;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        moveWidget(
          state,
          id,
          e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0,
          e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0,
        );
        onChange(state);
      }
    });
  });
}
