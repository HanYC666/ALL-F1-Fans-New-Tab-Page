const DB = "f1-fans-new-tab", STORE = "images";
export function openImageDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return resolve(null);
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx(mode, action) {
  const db = await openImageDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode), s = t.objectStore(STORE);
    let result;
    try {
      result = action(s);
    } catch (e) {
      reject(e);
      return;
    }
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
  });
}
export const putImage = (image) => tx("readwrite", (s) => s.put(image));
export const deleteImage = (id) => tx("readwrite", (s) => s.delete(id));
export const listImages = () =>
  tx("readonly", (s) => {
    const r = s.getAll();
    return new Promise((res, rej) => {
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  });
export const clearImages = () => tx("readwrite", (s) => s.clear());
export async function prepareImage(file, { maxBytes, maxPixels }) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Use a JPEG, PNG, or WebP image.");
  }
  if (file.size > maxBytes) {
    throw new Error("Image is larger than the local upload limit.");
  }
  const bitmap = await createImageBitmap(file);
  const pixels = bitmap.width * bitmap.height;
  if (pixels > maxPixels) {
    bitmap.close();
    throw new Error("Image dimensions exceed the local pixel limit.");
  }
  const scale = Math.min(1, 1920 / bitmap.width, 1080 / bitmap.height),
    canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((r) => canvas.toBlob(r, "image/webp", .86));
  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = 320;
  thumbCanvas.height = Math.max(
    1,
    Math.round(320 * canvas.height / canvas.width),
  );
  thumbCanvas.getContext("2d").drawImage(
    canvas,
    0,
    0,
    thumbCanvas.width,
    thumbCanvas.height,
  );
  const thumbnailBlob = await new Promise((r) =>
    thumbCanvas.toBlob(r, "image/webp", .78)
  );
  return {
    blob,
    thumbnailBlob,
    width: canvas.width,
    height: canvas.height,
    bytes: blob.size,
  };
}
