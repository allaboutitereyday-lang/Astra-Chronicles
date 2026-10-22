// Persistent Multiverse Codex Storage Engine (IndexedDB + LocalStorage fallback)
// Permanently chronicles Nano Banana 2.1 scene illustrations and unique discovered loot drops across stories & saves.

export interface CodexSceneEntry {
  id: string;
  cacheKey: string;
  storyId: string;
  storyTitle: string;
  location: string;
  speaker: string;
  prompt: string;
  imageUrl: string;
  model: string;
  unlockedAt: string;
  isFavorite?: boolean;
  timelineSnapshot?: {
    location: string;
    speaker: string;
    speakerRole?: string;
    emotion?: string;
    dialogue: string;
    narrativeText: string;
    choices: { id: string; text: string; tone: string }[];
    turnNumber?: number;
    causalPlausibility?: number;
    player?: any;
    party?: any[];
  };
}

export interface CodexLootEntry {
  id: string;
  cacheKey: string;
  storyId: string;
  storyTitle: string;
  itemName: string;
  itemType: "weapon" | "armor" | "relic" | "consumable" | "material";
  rarity: "common" | "uncommon" | "rare" | "relic" | "cursed";
  description: string;
  effect?: string;
  imageUrl: string;
  model: string;
  unlockedAt: string;
  discoveredCount?: number;
}

const DB_NAME = "AstraMultiverseCodexDB";
const SCENES_STORE = "codex_scenes";
const LOOT_STORE = "codex_loot";
const DB_VERSION = 1;

const LOCAL_FALLBACK_SCENES = "astra_codex_scenes_fallback";
const LOCAL_FALLBACK_LOOT = "astra_codex_loot_fallback";

function openCodexDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB unavailable in this environment"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(SCENES_STORE)) {
        const sceneStore = db.createObjectStore(SCENES_STORE, { keyPath: "id" });
        sceneStore.createIndex("cacheKey", "cacheKey", { unique: false });
        sceneStore.createIndex("storyId", "storyId", { unique: false });
        sceneStore.createIndex("unlockedAt", "unlockedAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(LOOT_STORE)) {
        const lootStore = db.createObjectStore(LOOT_STORE, { keyPath: "id" });
        lootStore.createIndex("cacheKey", "cacheKey", { unique: false });
        lootStore.createIndex("storyId", "storyId", { unique: false });
        lootStore.createIndex("rarity", "rarity", { unique: false });
        lootStore.createIndex("unlockedAt", "unlockedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function makeSceneCacheKey(storyId: string, location: string, speaker: string): string {
  const normStory = (storyId || "default").trim().toLowerCase();
  const normLoc = (location || "unknown").trim().toLowerCase();
  const normSpk = (speaker || "scene").trim().toLowerCase();
  return `${normStory}::${normLoc}::${normSpk}`;
}

function makeLootCacheKey(storyId: string, itemName: string): string {
  const normStory = (storyId || "default").trim().toLowerCase();
  const normItem = (itemName || "item").trim().toLowerCase();
  return `${normStory}::${normItem}`;
}

// ---------------------------------------------------------------------------
// SCENE CHRONICLE OPERATIONS
// ---------------------------------------------------------------------------

export async function saveCodexScene(
  entry: Omit<CodexSceneEntry, "id" | "cacheKey" | "unlockedAt"> & { id?: string; unlockedAt?: string }
): Promise<CodexSceneEntry> {
  const cacheKey = makeSceneCacheKey(entry.storyId, entry.location, entry.speaker);
  const id = entry.id || `scene_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const unlockedAt = entry.unlockedAt || new Date().toISOString();

  const record: CodexSceneEntry = {
    ...entry,
    id,
    cacheKey,
    unlockedAt,
    isFavorite: entry.isFavorite ?? false,
  };

  try {
    const db = await openCodexDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SCENES_STORE, "readwrite");
      const store = tx.objectStore(SCENES_STORE);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (idbErr) {
    console.warn("IndexedDB scene save failed, using localStorage fallback:", idbErr);
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = localStorage.getItem(LOCAL_FALLBACK_SCENES);
        const list: CodexSceneEntry[] = raw ? JSON.parse(raw) : [];
        const existingIdx = list.findIndex((s) => s.id === record.id || s.cacheKey === record.cacheKey);
        if (existingIdx !== -1) {
          list[existingIdx] = record;
        } else {
          list.unshift(record);
        }
        localStorage.setItem(LOCAL_FALLBACK_SCENES, JSON.stringify(list.slice(0, 30)));
      } catch (lsErr) {
        console.warn("LocalStorage fallback also failed:", lsErr);
      }
    }
  }

  return record;
}

export async function findSceneForContext(
  storyId: string,
  location: string,
  speaker: string
): Promise<CodexSceneEntry | null> {
  const targetKey = makeSceneCacheKey(storyId, location, speaker);

  try {
    const db = await openCodexDB();
    return await new Promise<CodexSceneEntry | null>((resolve) => {
      const tx = db.transaction(SCENES_STORE, "readonly");
      const store = tx.objectStore(SCENES_STORE);
      const index = store.index("cacheKey");
      const req = index.getAll(targetKey);

      req.onsuccess = () => {
        const results = req.result as CodexSceneEntry[];
        if (results && results.length > 0) {
          // Return most recent one
          results.sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
          resolve(results[0]);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = localStorage.getItem(LOCAL_FALLBACK_SCENES);
        if (raw) {
          const list: CodexSceneEntry[] = JSON.parse(raw);
          const match = list.find((s) => s.cacheKey === targetKey);
          if (match) return match;
        }
      } catch {}
    }
    return null;
  }
}

export async function getAllCodexScenes(): Promise<CodexSceneEntry[]> {
  try {
    const db = await openCodexDB();
    const results = await new Promise<CodexSceneEntry[]>((resolve, reject) => {
      const tx = db.transaction(SCENES_STORE, "readonly");
      const store = tx.objectStore(SCENES_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    results.sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
    return results;
  } catch {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = localStorage.getItem(LOCAL_FALLBACK_SCENES);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch {}
    }
    return [];
  }
}

export async function updateCodexSceneImage(
  id: string,
  newImageUrl: string,
  newModel?: string
): Promise<CodexSceneEntry | null> {
  try {
    const db = await openCodexDB();
    return await new Promise<CodexSceneEntry | null>((resolve, reject) => {
      const tx = db.transaction(SCENES_STORE, "readwrite");
      const store = tx.objectStore(SCENES_STORE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const entry: CodexSceneEntry = getReq.result;
        if (!entry) {
          return resolve(null);
        }
        entry.imageUrl = newImageUrl;
        if (newModel) entry.model = newModel;
        entry.unlockedAt = new Date().toISOString(); // update timestamp
        const putReq = store.put(entry);
        putReq.onsuccess = () => resolve(entry);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn("Failed to update codex scene image in IDB:", err);
    return null;
  }
}

export async function toggleCodexSceneFavorite(id: string): Promise<boolean> {
  try {
    const db = await openCodexDB();
    return await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(SCENES_STORE, "readwrite");
      const store = tx.objectStore(SCENES_STORE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const entry: CodexSceneEntry = getReq.result;
        if (!entry) return resolve(false);
        entry.isFavorite = !entry.isFavorite;
        const putReq = store.put(entry);
        putReq.onsuccess = () => resolve(entry.isFavorite ?? false);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    return false;
  }
}

export async function deleteCodexScene(id: string): Promise<void> {
  try {
    const db = await openCodexDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SCENES_STORE, "readwrite");
      const store = tx.objectStore(SCENES_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Failed to delete scene from IDB:", err);
  }

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(LOCAL_FALLBACK_SCENES);
      if (raw) {
        const list: CodexSceneEntry[] = JSON.parse(raw);
        const filtered = list.filter((s) => s.id !== id);
        localStorage.setItem(LOCAL_FALLBACK_SCENES, JSON.stringify(filtered));
      }
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// LOOT & RELIQUARY OPERATIONS
// ---------------------------------------------------------------------------

export async function saveCodexLoot(
  entry: Omit<CodexLootEntry, "id" | "cacheKey" | "unlockedAt"> & { id?: string; unlockedAt?: string }
): Promise<CodexLootEntry> {
  const cacheKey = makeLootCacheKey(entry.storyId, entry.itemName);
  const id = entry.id || `loot_${entry.storyId}_${entry.itemName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const unlockedAt = entry.unlockedAt || new Date().toISOString();

  try {
    const db = await openCodexDB();
    return await new Promise<CodexLootEntry>((resolve, reject) => {
      const tx = db.transaction(LOOT_STORE, "readwrite");
      const store = tx.objectStore(LOOT_STORE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing: CodexLootEntry | undefined = getReq.result;
        const record: CodexLootEntry = {
          ...entry,
          id,
          cacheKey,
          unlockedAt,
          discoveredCount: (existing?.discoveredCount || 0) + 1,
          imageUrl: entry.imageUrl || existing?.imageUrl || "",
        };

        const putReq = store.put(record);
        putReq.onsuccess = () => resolve(record);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (idbErr) {
    console.warn("IndexedDB loot save failed, using localStorage fallback:", idbErr);
    const record: CodexLootEntry = {
      ...entry,
      id,
      cacheKey,
      unlockedAt,
      discoveredCount: 1,
    };
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = localStorage.getItem(LOCAL_FALLBACK_LOOT);
        const list: CodexLootEntry[] = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex((l) => l.id === id || l.cacheKey === cacheKey);
        if (idx !== -1) {
          list[idx] = { ...record, discoveredCount: (list[idx].discoveredCount || 1) + 1 };
        } else {
          list.unshift(record);
        }
        localStorage.setItem(LOCAL_FALLBACK_LOOT, JSON.stringify(list.slice(0, 50)));
      } catch {}
    }
    return record;
  }
}

export async function getCodexLootByItem(
  storyId: string,
  itemName: string
): Promise<CodexLootEntry | null> {
  const targetKey = makeLootCacheKey(storyId, itemName);
  const cleanItemName = (itemName || "").trim().toLowerCase();

  try {
    const db = await openCodexDB();
    return await new Promise<CodexLootEntry | null>((resolve) => {
      const tx = db.transaction(LOOT_STORE, "readonly");
      const store = tx.objectStore(LOOT_STORE);
      const index = store.index("cacheKey");
      const req = index.get(targetKey);

      req.onsuccess = () => {
        const res = req.result as CodexLootEntry | undefined;
        if (res && res.imageUrl && res.imageUrl.trim().length > 0) {
          resolve(res);
        } else {
          // Also try global match across stories by itemName if story-specific not found or missing image
          const allReq = store.getAll();
          allReq.onsuccess = () => {
            const all = allReq.result as CodexLootEntry[];
            const match = all.find(
              (l) =>
                l.itemName &&
                l.itemName.trim().toLowerCase() === cleanItemName &&
                Boolean(l.imageUrl && l.imageUrl.trim().length > 0)
            );
            resolve(match || null);
          };
          allReq.onerror = () => resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = localStorage.getItem(LOCAL_FALLBACK_LOOT);
        if (raw) {
          const list: CodexLootEntry[] = JSON.parse(raw);
          const match = list.find(
            (l) =>
              (l.cacheKey === targetKey || l.itemName?.trim().toLowerCase() === cleanItemName) &&
              Boolean(l.imageUrl && l.imageUrl.trim().length > 0)
          );
          if (match) return match;
        }
      } catch {}
    }
    return null;
  }
}

/**
 * Hydrates an inventory list with persistent images from the Multiverse Codex.
 * Guarantees that discovered artifacts retain their artwork even across reload, saves, or turn boundaries.
 */
export async function hydrateInventoryItems<T extends { id?: string; name: string; imageUrl?: string }>(
  storyId: string,
  items: T[]
): Promise<{ hydrated: T[]; updatedCount: number }> {
  if (!Array.isArray(items) || items.length === 0) {
    return { hydrated: [], updatedCount: 0 };
  }

  let updatedCount = 0;
  const hydrated = await Promise.all(
    items.map(async (item) => {
      if (item.imageUrl && item.imageUrl.trim().length > 0) {
        return item;
      }
      try {
        const cached = await getCodexLootByItem(storyId, item.name);
        if (cached && cached.imageUrl && cached.imageUrl.trim().length > 0) {
          updatedCount++;
          return {
            ...item,
            imageUrl: cached.imageUrl,
          };
        }
      } catch {}
      return item;
    })
  );

  return { hydrated, updatedCount };
}

export async function getAllCodexLoot(): Promise<CodexLootEntry[]> {
  try {
    const db = await openCodexDB();
    const results = await new Promise<CodexLootEntry[]>((resolve, reject) => {
      const tx = db.transaction(LOOT_STORE, "readonly");
      const store = tx.objectStore(LOOT_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    results.sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
    return results;
  } catch {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = localStorage.getItem(LOCAL_FALLBACK_LOOT);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch {}
    }
    return [];
  }
}

export async function updateCodexLootImage(
  id: string,
  newImageUrl: string,
  newModel?: string
): Promise<CodexLootEntry | null> {
  try {
    const db = await openCodexDB();
    return await new Promise<CodexLootEntry | null>((resolve, reject) => {
      const tx = db.transaction(LOOT_STORE, "readwrite");
      const store = tx.objectStore(LOOT_STORE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const entry: CodexLootEntry = getReq.result;
        if (!entry) return resolve(null);
        entry.imageUrl = newImageUrl;
        if (newModel) entry.model = newModel;
        entry.unlockedAt = new Date().toISOString();
        const putReq = store.put(entry);
        putReq.onsuccess = () => resolve(entry);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn("Failed to update codex loot image in IDB:", err);
    return null;
  }
}

export async function deleteCodexLoot(id: string): Promise<void> {
  try {
    const db = await openCodexDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LOOT_STORE, "readwrite");
      const store = tx.objectStore(LOOT_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Failed to delete loot from IDB:", err);
  }

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(LOCAL_FALLBACK_LOOT);
      if (raw) {
        const list: CodexLootEntry[] = JSON.parse(raw);
        const filtered = list.filter((l) => l.id !== id);
        localStorage.setItem(LOCAL_FALLBACK_LOOT, JSON.stringify(filtered));
      }
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// GLOBAL CODEX METRICS & STATS
// ---------------------------------------------------------------------------

export async function getCodexStats(): Promise<{
  totalScenes: number;
  totalLoot: number;
  totalFavorites: number;
  uniqueStories: number;
}> {
  const [scenes, loot] = await Promise.all([getAllCodexScenes(), getAllCodexLoot()]);

  const storySet = new Set<string>();
  scenes.forEach((s) => storySet.add(s.storyId));
  loot.forEach((l) => storySet.add(l.storyId));

  const favorites = scenes.filter((s) => s.isFavorite).length;

  return {
    totalScenes: scenes.length,
    totalLoot: loot.length,
    totalFavorites: favorites,
    uniqueStories: storySet.size,
  };
}

