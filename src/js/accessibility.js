export function announce(message) {
  const el = document.querySelector("#status-footer");
  if (el) el.textContent = message;
}
export function prefersReducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
export function button(label, handler) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.addEventListener("click", handler);
  return b;
}
