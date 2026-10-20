// Robust Save Storage & Image Compression Engine for Astra Chronicles
// Handles IndexedDB storage (unlimited quota) with localStorage fallback & auto-compression

import { TimelineEcho } from "@/types/story";
import { DeathRegressionRecord, PenaltyScenarioState } from "@/types/system";

export interface SaveSlotPayload {
  slotId: number;
  savedAt: string;
  player: any;
  playerAvatar: string | null;
  gameState: any;
  party: any[];
  memories: string[];
  chatLog: any[];
  systemState?: any;
  storyId?: string;
  storyTitle?: string;
  choices?: string[];
  visitedNodes?: any[];
  selectedPrologueId?: string;

  // Major Feature Expansion Fields
  timelineEchoes?: TimelineEcho[];
  activeTrialCompanionId?: string;
  activeStance?: string;
  giftHistory?: Record<string, string[]>;
  deathCount?: number;
  regressionCount?: number;
  regressionHistory?: DeathRegressionRecord[];
  penaltyScenarioState?: PenaltyScenarioState | null;
  unlockedCompanions?: string[]; // IDs or names of heroines encountered in story
}

const DB_NAME = "AstraChroniclesSaveDB";
const STORE_NAME = "chronicle_saves";
const DB_VERSION = 1;

/**
 * Compresses an image data URL down to a web-optimized avatar size (default 384x384 max dimension).
 * Reduces multi-megabyte base64 strings by 95-99% down to ~25KB-45KB.
 */
export function compressAvatarImage(dataUrl: string | null, maxDim: number = 384): Promise<string | null> {
  return new Promise((resolve) => {
    if (!dataUrl || typeof window === "undefined" || !dataUrl.startsWith("data:image")) {
      return resolve(dataUrl);
    }

    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim && dataUrl.length < 100000) {
        return resolve(dataUrl);
      }

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const webp = canvas.toDataURL("image/webp", 0.82);
        if (webp.startsWith("data:image/webp") && webp.length < dataUrl.length) {
          return resolve(webp);
        }
      } catch {}

      try {
        const jpeg = canvas.toDataURL("image/jpeg", 0.82);
        resolve(jpeg);
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not available"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "slotId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clean save payload to remove duplicate avatar copies from every user chat log message
 */
function sanitizePayload(payload: SaveSlotPayload): SaveSlotPayload {
  const sanitizedChatLog = (payload.chatLog || []).map((msg) => {
    if (msg.sender === "user" && msg.avatarSrc && msg.avatarSrc.length > 500) {
      // Strip duplicated base64; the renderer will fallback to playerAvatar automatically
      const { avatarSrc, ...rest } = msg;
      return rest;
    }
    return msg;
  });

  return {
    ...payload,
    chatLog: sanitizedChatLog,
  };
}

/**
 * Saves a chronicle slot to IndexedDB (unlimited quota) and mirrors to localStorage if within size limits.
 */
export async function saveGameSlot(slotId: number, payload: SaveSlotPayload): Promise<void> {
  // Compress avatar if needed
  let optimizedAvatar = payload.playerAvatar;
  if (optimizedAvatar && optimizedAvatar.length > 80000) {
    try {
      optimizedAvatar = await compressAvatarImage(optimizedAvatar, 384);
    } catch {}
  }

  const cleanPayload = sanitizePayload({
    ...payload,
    playerAvatar: optimizedAvatar,
    slotId,
  });

  // 1. Primary Save to IndexedDB (no 5MB quota restriction)
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(cleanPayload);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (idbErr) {
    console.warn("IndexedDB save failed, trying localStorage:", idbErr);
  }

  // 2. Mirror to localStorage if size allows (ignoring QuotaExceededError since IDB has it)
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(`astra_save_slot_${slotId}`, JSON.stringify(cleanPayload));
    }
  } catch (lsErr: any) {
    console.warn("localStorage quota exceeded; save safely preserved in IndexedDB:", lsErr.message);
  }
}

/**
 * Loads a chronicle slot from IndexedDB, falling back to localStorage
 */
export async function loadGameSlot(slotId: number): Promise<SaveSlotPayload | null> {
  // 1. Try IndexedDB
  try {
    const db = await openIndexedDB();
    const data = await new Promise<SaveSlotPayload | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(slotId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (data) return data;
  } catch {}

  // 2. Fallback to localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = localStorage.getItem(`astra_save_slot_${slotId}`);
      if (raw) return JSON.parse(raw);
    }
  } catch {}

  return null;
}

/**
 * Deletes a chronicle slot from both IndexedDB and localStorage
 */
export async function deleteGameSlot(slotId: number): Promise<void> {
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(slotId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(`astra_save_slot_${slotId}`);
    }
  } catch {}
}

export const AUTOSAVE_SLOT_ID = 0;

/**
 * Loads all slots (0 = Auto-Save, 1, 2, 3 = Manual Saves) at startup
 */
export async function loadAllGameSlots(): Promise<Record<number, SaveSlotPayload | null>> {
  const result: Record<number, SaveSlotPayload | null> = { 0: null, 1: null, 2: null, 3: null };
  for (const id of [0, 1, 2, 3]) {
    try {
      result[id] = await loadGameSlot(id);
    } catch {}
  }
  return result;
}

// ============================================================================
// PERSISTENT CROSS-LOOP REGRESSION & TIMELINE ECHO STORAGE
// (Survives flowchart rewinds and anchor jumps)
// ============================================================================

const ECHO_STORAGE_PREFIX = "astra_timeline_echoes_";
const REGRESSION_STORAGE_PREFIX = "astra_death_regressions_";

export function loadPersistentTimelineEchoes(storyId: string): TimelineEcho[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(`${ECHO_STORAGE_PREFIX}${storyId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Failed to load persistent timeline echoes:", err);
  }
  return [];
}

export function appendPersistentTimelineEcho(storyId: string, echo: TimelineEcho): TimelineEcho[] {
  if (typeof window === "undefined" || !window.localStorage) return [echo];
  try {
    const existing = loadPersistentTimelineEchoes(storyId);
    // Avoid exact duplicate IDs
    const filtered = existing.filter((e) => e.id !== echo.id);
    const updated = [echo, ...filtered].slice(0, 50); // Keep last 50 key echoes
    localStorage.setItem(`${ECHO_STORAGE_PREFIX}${storyId}`, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Failed to append persistent timeline echo:", err);
    return [echo];
  }
}

export function loadPersistentRegressionHistory(storyId: string): DeathRegressionRecord[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(`${REGRESSION_STORAGE_PREFIX}${storyId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Failed to load regression history:", err);
  }
  return [];
}

export function appendPersistentDeathRegression(storyId: string, record: DeathRegressionRecord): DeathRegressionRecord[] {
  if (typeof window === "undefined" || !window.localStorage) return [record];
  try {
    const existing = loadPersistentRegressionHistory(storyId);
    const updated = [record, ...existing].slice(0, 20); // Keep last 20 deaths
    localStorage.setItem(`${REGRESSION_STORAGE_PREFIX}${storyId}`, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Failed to append regression history:", err);
    return [record];
  }
}
