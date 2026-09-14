import { migrateState } from "./state.js";

const KEY = "f1FansState";
const memory = new Map();
const api = () => globalThis.chrome?.storage?.local;

let savePromise = Promise.resolve();

export async function loadState() {
  const area = api();
  if (area) {
    try {
      const r = await area.get(KEY);
      if (r && r[KEY]) return migrateState(r[KEY]);
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

export function saveState(state) {
  const value = migrateState(state);
  memory.set(KEY, value);

  // Queue disk/storage operations sequentially
  savePromise = savePromise.then(async () => {
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
  }).catch(() => {});

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
