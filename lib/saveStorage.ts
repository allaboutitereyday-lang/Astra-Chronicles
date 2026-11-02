/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// Robust Save Storage & Image Compression Engine for Astra Chronicles
// Handles IndexedDB storage (unlimited quota) with localStorage fallback & auto-compression

import { TimelineEcho, TimelineScar, CausalCovenantState, CompanionFrictionState, ActiveStoryClashState } from "@/types/story";
import { DeathRegressionRecord, PenaltyScenarioState } from "@/types/system";

export interface SaveSlotPayload {
  slotId: number;
  savedAt: string;
  savedAtISO?: string;
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
  narrationStyle?: string; // Preserved narration atmosphere & prose tone

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

  // System Evolution Fields (Pillars A, B, C)
  timelineScars?: TimelineScar[];
  covenantState?: CausalCovenantState;
  frictionState?: CompanionFrictionState;
  activeClash?: ActiveStoryClashState | null;
}

const DB_NAME = "AstraChroniclesSaveDB";
const STORE_NAME = "chronicle_saves";
const DB_VERSION = 1;

export function notifySaveStorageMutated(slotId: number = 0): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent("astra-save-mutated", { detail: { slotId, timestamp: Date.now() } })
    );
  } catch {}
}

/**
 * Defensively normalizes any loaded SaveSlotPayload across git deployments / schema updates
 * so older or partially-written saves never crash or render broken state on load.
 */
export function normalizeSaveSlotData(raw: any): SaveSlotPayload | null {
  if (!raw || typeof raw !== "object" || !raw.player || typeof raw.player !== "object") {
    return null;
  }

  const p = raw.player;
  const rawStats = p.stats && typeof p.stats === "object" ? p.stats : {};
  const maxHp = typeof rawStats.maxHp === "number" && rawStats.maxHp > 0 ? rawStats.maxHp : 100;
  const maxMp = typeof rawStats.maxMp === "number" && rawStats.maxMp > 0 ? rawStats.maxMp : 60;
  const maxExp = typeof rawStats.maxExp === "number" && rawStats.maxExp > 0 ? rawStats.maxExp : 100;

  const normalizedPlayer = {
    ...p,
    name: typeof p.name === "string" && p.name.trim() ? p.name.trim() : "Kaelen",
    role: typeof p.role === "string" && p.role.trim() ? p.role.trim() : "Voidstrider",
    race: typeof p.race === "string" && p.race.trim() ? p.race.trim() : "Human",
    racialTraits: Array.isArray(p.racialTraits) ? p.racialTraits : [],
    personality:
      typeof p.personality === "string" && p.personality.trim()
        ? p.personality.trim()
        : "Stoic Pragmatist",
    personalityTraits: Array.isArray(p.personalityTraits)
      ? p.personalityTraits
      : ["Calculated", "Composed", "Observant", "Resolute"],
    level: typeof p.level === "number" && p.level >= 1 ? p.level : 1,
    stats: {
      hp: typeof rawStats.hp === "number" ? Math.max(1, Math.min(maxHp, rawStats.hp)) : maxHp,
      maxHp,
      mp: typeof rawStats.mp === "number" ? Math.max(0, Math.min(maxMp, rawStats.mp)) : maxMp,
      maxMp,
      exp: typeof rawStats.exp === "number" && rawStats.exp >= 0 ? rawStats.exp : 0,
      maxExp,
      str: typeof rawStats.str === "number" ? rawStats.str : 10,
      dex: typeof rawStats.dex === "number" ? rawStats.dex : 10,
      int: typeof rawStats.int === "number" ? rawStats.int : 10,
    },
    gear: {
      weapon: p.gear?.weapon || "Unarmed",
      armor: p.gear?.armor || "Traveler's Garb",
      relic: p.gear?.relic || "None",
    },
    gearImages: p.gearImages && typeof p.gearImages === "object" ? p.gearImages : {},
    abilities: Array.isArray(p.abilities) ? p.abilities : [],
    abilityDetails: p.abilityDetails && typeof p.abilityDetails === "object" ? p.abilityDetails : {},
    inventory: Array.isArray(p.inventory) ? p.inventory : [],
    unlockedStances:
      Array.isArray(p.unlockedStances) && p.unlockedStances.length > 0
        ? p.unlockedStances
        : ["neutral", "flame", "frost", "shadow", "graviton", "phase"],
    activeStance: p.activeStance || raw.activeStance || "neutral",
  };

  const gs = raw.gameState && typeof raw.gameState === "object" ? raw.gameState : {};
  const rawChatLog = Array.isArray(raw.chatLog) ? raw.chatLog : [];
  // Filter out any corrupted or empty pending messages and ensure every message has an ID & text
  const normalizedChatLog = rawChatLog
    .filter((m: any) => m && typeof m === "object" && (typeof m.text === "string" && m.text.trim().length > 0))
    .map((m: any, idx: number) => ({
      ...m,
      id: m.id || `msg_restored_${idx}_${Date.now()}`,
      sender: m.sender === "user" ? "user" : "character",
      text: String(m.text || "").trim(),
      isPending: false,
    }));

  const lastCharacterMsg = [...normalizedChatLog].reverse().find((m: any) => m.sender === "character");
  const normalizedGameState = {
    location: gs.location || "Astral Convergence",
    speaker: gs.speaker || lastCharacterMsg?.speakerName || "Narrator",
    dialogue:
      (typeof gs.dialogue === "string" && gs.dialogue.trim()) ||
      lastCharacterMsg?.text ||
      "The chronicle resumes...",
    bgImage:
      typeof gs.bgImage === "string" && gs.bgImage.startsWith("data:image") && gs.bgImage.length > 350000
        ? "/images/backgrounds/imperial_capital.png"
        : gs.bgImage || "/images/backgrounds/imperial_capital.png",
    mood: gs.mood || "Tense",
    npcKnowledgeMap: gs.npcKnowledgeMap && typeof gs.npcKnowledgeMap === "object" ? gs.npcKnowledgeMap : {},
  };

  const sys = raw.systemState && typeof raw.systemState === "object" ? raw.systemState : {};
  const normalizedSystemState = {
    plausibility: typeof sys.plausibility === "number" ? sys.plausibility : 100,
    plausibilityTier: sys.plausibilityTier || "Stable",
    activeQuests: Array.isArray(sys.activeQuests) ? sys.activeQuests : [],
    completedQuests: Array.isArray(sys.completedQuests) ? sys.completedQuests : [],
    systemDirectives: Array.isArray(sys.systemDirectives)
      ? sys.systemDirectives
      : ["[SYSTEM INITIALIZED: Causal Plausibility Nominal (100%)]"],
    penaltyScenario: sys.penaltyScenario || raw.penaltyScenarioState || null,
    covenantState: sys.covenantState || raw.covenantState || {
      covenantsInvoked: 0,
      maxPlausibilityCap: 100,
      timelineScars: Array.isArray(raw.timelineScars) ? raw.timelineScars : [],
      activeAnomalies: [],
    },
    regressionCount:
      typeof sys.regressionCount === "number" ? sys.regressionCount : raw.regressionCount || 0,
  };

  // Validate activeClash so finished or corrupted clashes don't get stuck on screen
  let normalizedClash: ActiveStoryClashState | null = null;
  if (
    raw.activeClash &&
    typeof raw.activeClash === "object" &&
    raw.activeClash.isActive === true &&
    raw.activeClash.status === "ongoing" &&
    typeof raw.activeClash.enemyHp === "number" &&
    raw.activeClash.enemyHp > 0
  ) {
    normalizedClash = {
      ...raw.activeClash,
      enemyMaxHp: raw.activeClash.enemyMaxHp || Math.max(30, raw.activeClash.enemyHp),
      clashTurn: raw.activeClash.clashTurn || 1,
      maxClashTurns: raw.activeClash.maxClashTurns || 6,
      log: Array.isArray(raw.activeClash.log) ? raw.activeClash.log : [],
    };
  }

  return {
    ...raw,
    slotId: typeof raw.slotId === "number" ? raw.slotId : 0,
    savedAt: raw.savedAt || "Saved Session",
    savedAtISO: raw.savedAtISO || new Date(0).toISOString(),
    player: normalizedPlayer,
    playerAvatar: typeof raw.playerAvatar === "string" ? raw.playerAvatar : null,
    gameState: normalizedGameState,
    party: Array.isArray(raw.party) ? raw.party : [],
    memories: Array.isArray(raw.memories) ? raw.memories : [],
    chatLog:
      normalizedChatLog.length > 0
        ? normalizedChatLog
        : [
            {
              id: `init_restored_${Date.now()}`,
              sender: "character",
              speakerName: normalizedGameState.speaker,
              text: normalizedGameState.dialogue,
              timestamp: "Resumed",
            },
          ],
    systemState: normalizedSystemState,
    activeClash: normalizedClash,
    choices: Array.isArray(raw.choices) && raw.choices.length === 4 ? raw.choices : undefined,
  };
}

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
 * Clean save payload to remove duplicate avatar copies and prune quadratic visitedNodes snapshot bloat
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

  const rawNodes = Array.isArray(payload.visitedNodes) ? payload.visitedNodes : undefined;
  const sanitizedVisitedNodes = rawNodes
    ? rawNodes.map((node, idx) => {
        if (!node || !node.gameStateSnapshot) return node;
        // Keep full snapshots only for starting anchors and the most recent 15 turn anchors
        const isRecent = idx >= rawNodes.length - 15;
        if (!isRecent && !node.isStartingPoint) {
          const { gameStateSnapshot: _dropped, ...lightNode } = node;
          return lightNode;
        }

        const snap = node.gameStateSnapshot;
        let lightPlayer = snap.player;
        if (lightPlayer) {
          const { gearImages: _omittedGear, ...restPlayer } = lightPlayer;
          const lightInventory = Array.isArray(restPlayer.inventory)
            ? restPlayer.inventory.map((item: any) => {
                if (item?.imageUrl && item.imageUrl.length > 500) {
                  const { imageUrl: _omittedImg, ...restItem } = item;
                  return restItem;
                }
                return item;
              })
            : restPlayer.inventory;
          lightPlayer = { ...restPlayer, inventory: lightInventory };
        }

        const lightChatLog = Array.isArray(snap.chatLog)
          ? snap.chatLog.slice(-20).map((msg: any) => {
              if (msg?.avatarSrc && msg.avatarSrc.length > 500) {
                const { avatarSrc: _omittedAvatar, ...restMsg } = msg;
                return restMsg;
              }
              return msg;
            })
          : snap.chatLog;

        return {
          ...node,
          gameStateSnapshot: {
            ...snap,
            player: lightPlayer,
            chatLog: lightChatLog,
          },
        };
      })
    : undefined;

  return {
    ...payload,
    chatLog: sanitizedChatLog,
    ...(sanitizedVisitedNodes ? { visitedNodes: sanitizedVisitedNodes } : {}),
  };
}

/**
 * Saves a chronicle slot to IndexedDB (unlimited quota) and mirrors to localStorage during idle time.
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
    savedAtISO: payload.savedAtISO || new Date().toISOString(),
    playerAvatar: optimizedAvatar,
    slotId,
  });

  // 1. Primary Save to IndexedDB (no 5MB quota restriction)
  let idbSucceeded = false;
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(cleanPayload);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    idbSucceeded = true;
  } catch (idbErr) {
    console.warn("IndexedDB save failed, trying localStorage:", idbErr);
  }

  // 2. Mirror to localStorage off the critical UI path so JSON.stringify never blocks frame rendering
  const writeLocalStorageMirror = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(`astra_save_slot_${slotId}`, JSON.stringify(cleanPayload));
      }
    } catch (lsErr: any) {
      if (!idbSucceeded) {
        console.warn("localStorage quota exceeded:", lsErr.message);
      }
    }
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as any).requestIdleCallback(writeLocalStorageMirror, { timeout: 1500 });
  } else {
    setTimeout(writeLocalStorageMirror, 50);
  }
  notifySaveStorageMutated(slotId);
}

/**
 * Loads a chronicle slot from IndexedDB and localStorage, picking the freshest copy
 * and running schema normalization so post-deployment loads never break.
 */
export async function loadGameSlot(slotId: number): Promise<SaveSlotPayload | null> {
  let idbData: SaveSlotPayload | null = null;
  let lsData: SaveSlotPayload | null = null;

  // 1. Try IndexedDB
  try {
    const db = await openIndexedDB();
    idbData = await new Promise<SaveSlotPayload | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(slotId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {}

  // 2. Also check localStorage mirror
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = localStorage.getItem(`astra_save_slot_${slotId}`);
      if (raw) lsData = JSON.parse(raw);
    }
  } catch {}

  const normIdb = normalizeSaveSlotData(idbData);
  const normLs = normalizeSaveSlotData(lsData);

  if (normIdb && normLs) {
    const idbTime = normIdb.savedAtISO ? Date.parse(normIdb.savedAtISO) || 0 : 0;
    const lsTime = normLs.savedAtISO ? Date.parse(normLs.savedAtISO) || 0 : 0;
    // Choose whichever copy was saved more recently, preserving avatar if one copy has it
    const chosen = lsTime > idbTime ? normLs : normIdb;
    const fallbackAvatar = normIdb.playerAvatar || normLs.playerAvatar || null;
    return {
      ...chosen,
      playerAvatar: chosen.playerAvatar || fallbackAvatar,
    };
  }

  return normIdb || normLs || null;
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

/**
 * Collects all persistent timeline echoes across all storyIds for cross-save bundling
 */
export function getAllPersistentTimelineEchoes(): Record<string, TimelineEcho[]> {
  if (typeof window === "undefined" || !window.localStorage) return {};
  const result: Record<string, TimelineEcho[]> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(ECHO_STORAGE_PREFIX)) {
        const storyId = key.slice(ECHO_STORAGE_PREFIX.length);
        const raw = localStorage.getItem(key);
        if (raw && storyId) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) result[storyId] = parsed;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to enumerate persistent timeline echoes:", err);
  }
  return result;
}

/**
 * Restores or merges persistent timeline echoes across stories
 */
export function restorePersistentTimelineEchoes(
  echoMap: Record<string, TimelineEcho[]>,
  mode: "merge" | "overwrite" = "merge"
): void {
  if (typeof window === "undefined" || !window.localStorage || !echoMap) return;
  try {
    if (mode === "overwrite") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(ECHO_STORAGE_PREFIX)) keysToRemove.push(key);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }

    for (const [storyId, incoming] of Object.entries(echoMap)) {
      if (!Array.isArray(incoming)) continue;
      if (mode === "overwrite") {
        localStorage.setItem(`${ECHO_STORAGE_PREFIX}${storyId}`, JSON.stringify(incoming.slice(0, 50)));
      } else {
        const existing = loadPersistentTimelineEchoes(storyId);
        const mergedMap = new Map<string, TimelineEcho>();
        [...incoming, ...existing].forEach((echo) => {
          if (echo && echo.id && !mergedMap.has(echo.id)) {
            mergedMap.set(echo.id, echo);
          }
        });
        const merged = Array.from(mergedMap.values()).slice(0, 50);
        localStorage.setItem(`${ECHO_STORAGE_PREFIX}${storyId}`, JSON.stringify(merged));
      }
    }
  } catch (err) {
    console.warn("Failed to restore persistent timeline echoes:", err);
  }
}

/**
 * Collects all persistent death regression histories across all storyIds
 */
export function getAllPersistentRegressionHistories(): Record<string, DeathRegressionRecord[]> {
  if (typeof window === "undefined" || !window.localStorage) return {};
  const result: Record<string, DeathRegressionRecord[]> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(REGRESSION_STORAGE_PREFIX)) {
        const storyId = key.slice(REGRESSION_STORAGE_PREFIX.length);
        const raw = localStorage.getItem(key);
        if (raw && storyId) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) result[storyId] = parsed;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to enumerate persistent regression histories:", err);
  }
  return result;
}

/**
 * Restores or merges persistent death regression histories across stories
 */
export function restorePersistentRegressionHistories(
  regressionMap: Record<string, DeathRegressionRecord[]>,
  mode: "merge" | "overwrite" = "merge"
): void {
  if (typeof window === "undefined" || !window.localStorage || !regressionMap) return;
  try {
    if (mode === "overwrite") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(REGRESSION_STORAGE_PREFIX)) keysToRemove.push(key);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }

    for (const [storyId, incoming] of Object.entries(regressionMap)) {
      if (!Array.isArray(incoming)) continue;
      if (mode === "overwrite") {
        localStorage.setItem(`${REGRESSION_STORAGE_PREFIX}${storyId}`, JSON.stringify(incoming.slice(0, 20)));
      } else {
        const existing = loadPersistentRegressionHistory(storyId);
        const mergedMap = new Map<string, DeathRegressionRecord>();
        [...incoming, ...existing].forEach((rec) => {
          if (rec) {
            const key = rec.id || `${rec.deathNumber ?? 0}_${rec.causeOfDeath ?? ""}_${rec.timestamp ?? ""}`;
            if (!mergedMap.has(key)) mergedMap.set(key, rec);
          }
        });
        const merged = Array.from(mergedMap.values()).slice(0, 20);
        localStorage.setItem(`${REGRESSION_STORAGE_PREFIX}${storyId}`, JSON.stringify(merged));
      }
    }
  } catch (err) {
    console.warn("Failed to restore regression histories:", err);
  }
}

