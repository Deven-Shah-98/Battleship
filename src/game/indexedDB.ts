/** IndexedDB wrapper for larger storage (replays, match history) */

const DB_NAME = "battleship";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("replays")) {
        db.createObjectStore("replays", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("matchHistory")) {
        db.createObjectStore("matchHistory", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("journal")) {
        db.createObjectStore("journal", { keyPath: "id" });
      }
    };
  });
}

export async function idbPut(store: string, data: Record<string, unknown>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(data);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fall back silently — localStorage is the primary storage
  }
}

export async function idbGetAll<T>(store: string): Promise<T[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function idbDelete(store: string, key: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fall back silently
  }
}

export async function idbClear(store: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fall back silently
  }
}
