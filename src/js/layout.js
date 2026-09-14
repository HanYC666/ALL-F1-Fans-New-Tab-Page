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
  if (state.theme.panelOpacity !== undefined) {
    document.documentElement.style.setProperty("--hypr-opacity", state.theme.panelOpacity);
  }
  if (state.theme.panelBlurPx !== undefined) {
    document.documentElement.style.setProperty("--hypr-blur", `${state.theme.panelBlurPx}px`);
  }

  for (const [id, v] of Object.entries(state.layout.widgets || {})) {
    const el = document.querySelector(`[data-widget-id="${id}"]`);
    if (!el) continue;
    el.hidden = !v.visible;
    el.style.setProperty("--grid-x", v.x);
    el.style.setProperty("--grid-y", v.y);
    el.style.setProperty("--grid-w", v.w);
    el.style.setProperty("--grid-h", v.h);
  }
}

export function moveWidget(state, id, dx, dy) {
  const v = state.layout?.widgets?.[id];
  if (!v || state.layout?.locked) return state;
  v.x = clamp(v.x + dx, 1, 13 - v.w);
  v.y = clamp(v.y + dy, 1, 20);
  return state;
}

export function swapWidgets(state, id1, id2) {
  if (state.layout?.locked || id1 === id2) return state;
  const w1 = state.layout.widgets[id1];
  const w2 = state.layout.widgets[id2];
  if (!w1 || !w2) return state;

  const tempX = w1.x;
  const tempY = w1.y;
  w1.x = w2.x;
  w1.y = w2.y;
  w2.x = tempX;
  w2.y = tempY;

  // Clamp within bounds
  w1.x = clamp(w1.x, 1, 13 - w1.w);
  w2.x = clamp(w2.x, 1, 13 - w2.w);

  return state;
}

export function enableDragging(state, onChange) {
  if (state.layout?.locked) return;

  // 1. Move Arrow Buttons
  document.querySelectorAll(".move-arrow-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const widget = btn.closest(".widget");
      const id = widget?.dataset.widgetId;
      const dx = Number(btn.dataset.dx) || 0;
      const dy = Number(btn.dataset.dy) || 0;
      if (id) {
        moveWidget(state, id, dx, dy);
        onChange(state);
      }
    });
  });

  // 2. Keyboard Arrow Support
  document.querySelectorAll(".drag-handle").forEach((handle) => {
    handle.addEventListener("keydown", (e) => {
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

  // 3. HTML5 Drag & Drop for Cards
  let draggedWidgetId = null;

  document.querySelectorAll(".widget").forEach((widget) => {
    widget.addEventListener("dragstart", (e) => {
      if (state.layout?.locked) {
        e.preventDefault();
        return;
      }
      draggedWidgetId = widget.dataset.widgetId;
      widget.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", draggedWidgetId);
    });

    widget.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (widget.dataset.widgetId !== draggedWidgetId) {
        widget.classList.add("drag-over");
      }
    });

    widget.addEventListener("dragleave", () => {
      widget.classList.remove("drag-over");
    });

    widget.addEventListener("drop", (e) => {
      e.preventDefault();
      widget.classList.remove("drag-over");
      const targetId = widget.dataset.widgetId;
      if (draggedWidgetId && targetId && draggedWidgetId !== targetId) {
        swapWidgets(state, draggedWidgetId, targetId);
        onChange(state);
      }
    });

    widget.addEventListener("dragend", () => {
      widget.classList.remove("is-dragging");
      document.querySelectorAll(".widget").forEach((w) => w.classList.remove("drag-over"));
      draggedWidgetId = null;
    });
  });
}
