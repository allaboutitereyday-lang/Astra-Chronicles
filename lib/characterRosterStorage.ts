/**
 * Cross-World & Cross-Introduction Character Roster Storage
 * for Astra Chronicles
 *
 * Allows players to save individual character blueprints (identity, portrait,
 * lineage/race, racial traits, class archetype, personality, personality traits,
 * visual DNA, and narration style) and reuse them across different worlds or
 * different prologue introductions.
 *
 * STRICT CONSTRAINT: Only saves character identity info — NEVER saves level,
 * stats progression, inventory items, equipped gear, or story progress.
 */

import { CharacterVisualDNA, PlayerProfile } from "@/types/story";
import { notifySaveStorageMutated } from "@/lib/saveStorage";

export interface SavedCharacterBlueprint {
  id: string;
  name: string;
  role: string; // Class / Archetype
  gender?: string;
  age?: string;
  worldOrigin?: string;
  worldOriginDetails?: string;
  race: string;
  racialTraits: string[];
  personality: string;
  personalityTraits: string[];
  avatar: string; // Portrait base64 or URL
  visualDescription?: string;
  visualDna?: CharacterVisualDNA;
  narrationStyle?: string;
  originWorldTitle?: string;
  createdAt: string;
  updatedAt: string;
  updatedAtMs: number;
}

const DB_NAME = "astra_character_roster_db";
const DB_VERSION = 1;
const STORE_NAME = "blueprints";
const LOCAL_STORAGE_KEY = "astra_character_roster_v1";

function openRosterDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Sanitizes a raw object into a strict identity-only SavedCharacterBlueprint,
 * stripping any accidental level, stats, or item fields.
 */
export function normalizeCharacterBlueprint(rawInput: unknown): SavedCharacterBlueprint | null {
  if (!rawInput || typeof rawInput !== "object") {
    return null;
  }
  const raw = rawInput as Record<string, unknown>;
  if (typeof raw.name !== "string" || !raw.name.trim()) {
    return null;
  }
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  return {
    id:
      typeof raw.id === "string" && raw.id.trim()
        ? raw.id.trim()
        : `char_${raw.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${nowMs}`,
    name: raw.name.trim(),
    role: typeof raw.role === "string" && raw.role.trim() ? raw.role.trim() : "Voidstrider",
    gender: typeof raw.gender === "string" && raw.gender.trim() ? raw.gender.trim() : "Male",
    age: typeof raw.age === "string" && raw.age.trim() ? raw.age.trim() : "22",
    worldOrigin:
      typeof raw.worldOrigin === "string" && raw.worldOrigin.trim()
        ? raw.worldOrigin.trim()
        : "Born & Raised (Native)",
    worldOriginDetails:
      typeof raw.worldOriginDetails === "string" && raw.worldOriginDetails.trim()
        ? raw.worldOriginDetails.trim()
        : undefined,
    race: typeof raw.race === "string" && raw.race.trim() ? raw.race.trim() : "Human",
    racialTraits: Array.isArray(raw.racialTraits)
      ? raw.racialTraits
          .filter((t: unknown): t is string => typeof t === "string" && Boolean(t.trim()))
          .map((t: string) => t.trim())
      : [],
    personality:
      typeof raw.personality === "string" && raw.personality.trim()
        ? raw.personality.trim()
        : "Stoic Pragmatist",
    personalityTraits: Array.isArray(raw.personalityTraits)
      ? raw.personalityTraits
          .filter((t: unknown): t is string => typeof t === "string" && Boolean(t.trim()))
          .map((t: string) => t.trim())
      : ["Calculated", "Composed", "Observant", "Resolute"],
    avatar: typeof raw.avatar === "string" ? raw.avatar : "",
    visualDescription:
      typeof raw.visualDescription === "string" ? raw.visualDescription : undefined,
    visualDna:
      raw.visualDna && typeof raw.visualDna === "object"
        ? (raw.visualDna as CharacterVisualDNA)
        : undefined,
    narrationStyle:
      typeof raw.narrationStyle === "string" ? raw.narrationStyle : undefined,
    originWorldTitle:
      typeof raw.originWorldTitle === "string" ? raw.originWorldTitle : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : nowIso,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : nowIso,
    updatedAtMs: typeof raw.updatedAtMs === "number" && !isNaN(raw.updatedAtMs) ? raw.updatedAtMs : nowMs,
  };
}

/**
 * Extracts a clean identity-only SavedCharacterBlueprint from a live PlayerProfile.
 * Explicitly excludes level, stats, inventory, gear, and unlocked abilities.
 */
export function createBlueprintFromPlayer(params: {
  player: PlayerProfile;
  avatar?: string;
  narrationStyle?: string;
  originWorldTitle?: string;
  existingId?: string;
}): SavedCharacterBlueprint {
  const { player, avatar = "", narrationStyle, originWorldTitle, existingId } = params;
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const cleanName = (player.name || "Traveler").trim();
  const cleanRole = (player.role || "Adventurer").trim();
  const cleanRace = (player.race || "Human").trim();

  // Deterministic ID by Name + Race + Role if existingId is not passed, so saving the same character updates their card cleanly
  const deterministicId =
    existingId ||
    `char_${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${cleanRace
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")}_${cleanRole.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

  return {
    id: deterministicId,
    name: cleanName,
    role: cleanRole,
    gender: player.gender || "Male",
    age: player.age || "22",
    worldOrigin: player.worldOrigin || "Born & Raised (Native)",
    worldOriginDetails: player.worldOriginDetails,
    race: cleanRace,
    racialTraits: Array.isArray(player.racialTraits) ? [...player.racialTraits] : [],
    personality: player.personality || "Stoic Pragmatist",
    personalityTraits: Array.isArray(player.personalityTraits)
      ? [...player.personalityTraits]
      : ["Calculated", "Composed", "Observant", "Resolute"],
    avatar,
    visualDescription: player.visualDescription,
    visualDna: player.visualDna,
    narrationStyle: narrationStyle || player.narrationStyle,
    originWorldTitle,
    createdAt: nowIso,
    updatedAt: nowIso,
    updatedAtMs: nowMs,
  };
}

function mirrorRosterToLocalStorage(list: SavedCharacterBlueprint[]): void {
  if (typeof window === "undefined") return;
  try {
    // Store lightweight mirror in localStorage (strip oversized >120KB avatars if quota is tight)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    try {
      const compact = list.map((b) => ({
        ...b,
        avatar: b.avatar && b.avatar.length > 60000 ? "" : b.avatar,
      }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // Ignore quota errors
    }
  }
}

export async function loadCharacterRoster(): Promise<SavedCharacterBlueprint[]> {
  if (typeof window === "undefined") return [];

  let fromIdb: SavedCharacterBlueprint[] = [];
  try {
    const db = await openRosterDB();
    fromIdb = await new Promise<SavedCharacterBlueprint[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = Array.isArray(req.result) ? req.result : [];
        resolve(
          items
            .map((item) => normalizeCharacterBlueprint(item))
            .filter((item): item is SavedCharacterBlueprint => item !== null)
        );
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[CharacterRoster] IndexedDB read fallback to localStorage:", err);
  }

  let fromLocal: SavedCharacterBlueprint[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        fromLocal = parsed
          .map((item) => normalizeCharacterBlueprint(item))
          .filter((item): item is SavedCharacterBlueprint => item !== null);
      }
    }
  } catch {}

  const mergedMap = new Map<string, SavedCharacterBlueprint>();
  for (const item of [...fromLocal, ...fromIdb]) {
    const existing = mergedMap.get(item.id);
    if (!existing || item.updatedAtMs >= existing.updatedAtMs) {
      // Preserve avatar if IDB version has it and local mirror stripped it
      const avatar = item.avatar || existing?.avatar || "";
      mergedMap.set(item.id, { ...item, avatar });
    }
  }

  return Array.from(mergedMap.values()).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
}

export async function saveCharacterToRoster(
  blueprint: SavedCharacterBlueprint
): Promise<SavedCharacterBlueprint[]> {
  const clean = normalizeCharacterBlueprint(blueprint);
  if (!clean) return loadCharacterRoster();

  const existingList = await loadCharacterRoster();
  const existingMatch = existingList.find((c) => c.id === clean.id);
  const finalBlueprint: SavedCharacterBlueprint = {
    ...clean,
    createdAt: existingMatch?.createdAt || clean.createdAt,
    updatedAt: new Date().toISOString(),
    updatedAtMs: Date.now(),
  };

  try {
    const db = await openRosterDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(finalBlueprint);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[CharacterRoster] IndexedDB write fallback:", err);
  }

  const nextList = [
    finalBlueprint,
    ...existingList.filter((c) => c.id !== finalBlueprint.id),
  ].sort((a, b) => b.updatedAtMs - a.updatedAtMs);

  mirrorRosterToLocalStorage(nextList);
  notifySaveStorageMutated(0);
  return nextList;
}

export async function deleteCharacterFromRoster(id: string): Promise<SavedCharacterBlueprint[]> {
  try {
    const db = await openRosterDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[CharacterRoster] IndexedDB delete fallback:", err);
  }

  const existingList = await loadCharacterRoster();
  const nextList = existingList.filter((c) => c.id !== id);
  mirrorRosterToLocalStorage(nextList);
  notifySaveStorageMutated(0);
  return nextList;
}

export async function mergeRemoteCharacterRoster(
  remoteList: SavedCharacterBlueprint[]
): Promise<SavedCharacterBlueprint[]> {
  if (!Array.isArray(remoteList) || remoteList.length === 0) {
    return loadCharacterRoster();
  }
  const localList = await loadCharacterRoster();
  const map = new Map<string, SavedCharacterBlueprint>();

  for (const item of localList) {
    map.set(item.id, item);
  }
  for (const rawRemote of remoteList) {
    const clean = normalizeCharacterBlueprint(rawRemote);
    if (!clean) continue;
    const existing = map.get(clean.id);
    if (!existing || clean.updatedAtMs >= existing.updatedAtMs) {
      map.set(clean.id, {
        ...clean,
        avatar: clean.avatar || existing?.avatar || "",
      });
    }
  }

  const merged = Array.from(map.values()).sort((a, b) => b.updatedAtMs - a.updatedAtMs);

  try {
    const db = await openRosterDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const item of merged) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}

  mirrorRosterToLocalStorage(merged);
  return merged;
}

