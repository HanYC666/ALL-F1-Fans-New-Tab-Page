import { migrateState } from "./state.js";
const KEY = "f1FansState";
const memory = new Map();
const api = () => globalThis.chrome?.storage?.local;
export async function loadState() {
  const area = api();
  if (area) {
    const r = await area.get(KEY);
    return migrateState(r[KEY]);
  }
  return migrateState(memory.get(KEY));
}
export async function saveState(state) {
  const value = migrateState(state);
  const area = api();
  if (area) await area.set({ [KEY]: value });
  else memory.set(KEY, value);
  return value;
}
export async function clearLocalState() {
  const area = api();
  if (area) await area.clear();
  else memory.clear();
}
export async function saveCache(key, value) {
  const state = await loadState();
  state.cache[key] = value;
  return saveState(state);
}
