import { migrateState } from "./state.js";

const KEY = "f1FansState";
const memory = new Map();
const api = () => globalThis.chrome?.storage?.local;

export async function loadState() {
  const area = api();
  if (area) {
    try {
      const r = await area.get(KEY);
      return migrateState(r[KEY]);
    } catch {
      // fallback
    }
  }

  // Web Browser localStorage fallback
  if (globalThis.localStorage) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return migrateState(JSON.parse(raw));
    } catch {
      // ignore
    }
  }

  return migrateState(memory.get(KEY));
}

export async function saveState(state) {
  const value = migrateState(state);
  const area = api();
  if (area) {
    try {
      await area.set({ [KEY]: value });
    } catch {
      // ignore
    }
  }

  if (globalThis.localStorage) {
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  memory.set(KEY, value);
  return value;
}

export async function clearLocalState() {
  const area = api();
  if (area) {
    try {
      await area.clear();
    } catch {
      // ignore
    }
  }

  if (globalThis.localStorage) {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  }

  memory.clear();
}

export async function saveCache(key, value) {
  const state = await loadState();
  state.cache[key] = value;
  return saveState(state);
}
