export const registry = new Map();

export function registerWidget(id, render) {
  registry.set(id, render);
}

export function createWidget(id, title, state, content, icon = "⚡") {
  const el = document.createElement("article");
  el.className = "widget";
  el.dataset.widgetId = id;
  el.setAttribute("draggable", state.layout?.locked ? "false" : "true");

  const head = document.createElement("header");
  head.className = "widget-header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "widget-title-group";

  const iconSpan = document.createElement("span");
  iconSpan.className = "widget-icon";
  iconSpan.textContent = icon;

  const h = document.createElement("h2");
  h.className = "widget-title";
  h.textContent = title;

  titleGroup.append(iconSpan, h);

  const actions = document.createElement("div");
  actions.className = "widget-actions";

  // Quick Move Arrow Buttons
  if (!state.layout?.locked) {
    const moveGroup = document.createElement("div");
    moveGroup.className = "move-btn-group";

    const createMoveBtn = (symbol, dx, dy, label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "move-arrow-btn";
      btn.textContent = symbol;
      btn.title = `Move ${label}`;
      btn.setAttribute("aria-label", `Move ${title} ${label}`);
      btn.dataset.dx = dx;
      btn.dataset.dy = dy;
      return btn;
    };

    moveGroup.append(
      createMoveBtn("◀", -1, 0, "left"),
      createMoveBtn("▲", 0, -1, "up"),
      createMoveBtn("▼", 0, 1, "down"),
      createMoveBtn("▶", 1, 0, "right")
    );

    const dragHandle = document.createElement("button");
    dragHandle.type = "button";
    dragHandle.className = "widget-btn drag-handle";
    dragHandle.textContent = "✥ Drag";
    dragHandle.title = "Drag card or use arrow buttons to move";
    dragHandle.setAttribute("aria-label", `Drag ${title}`);

    actions.append(moveGroup, dragHandle);
  }

  head.append(titleGroup, actions);

  const body = document.createElement("div");
  body.className = "widget-body";
  body.append(content);

  el.append(head, body);
  return el;
}
