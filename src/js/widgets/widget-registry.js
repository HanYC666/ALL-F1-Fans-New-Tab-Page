export const registry = new Map();

export function registerWidget(id, render) {
  registry.set(id, render);
}

export function createWidget(id, title, state, content, icon = "⚡") {
  const el = document.createElement("article");
  el.className = "widget";
  el.dataset.widgetId = id;

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

  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = "widget-btn drag-handle";
  handle.textContent = "Move ✥";
  handle.title = "Move widget with arrow keys";
  handle.setAttribute("aria-label", `Move ${title} with arrow keys`);

  actions.append(handle);
  head.append(titleGroup, actions);

  const body = document.createElement("div");
  body.className = "widget-body";
  body.append(content);

  el.append(head, body);
  return el;
}
