// ============================================================================
// ASTRA CHRONICLES: UNIFIED CROSS-SAVE PROGRESSION ENGINE
// ============================================================================
// Coordinates Save Slots (0-3), Persistent Timeline Echoes & Death Regressions,
// Custom Created Worlds, and Multiverse Codex Relics & CGs across:
//   1. IndexedDB + LocalStorage (Instant 0ms Local Storage)
//   2. Supabase Cloud (Email / Google / Discord / GitHub OAuth + Postgres JSONB)
//   3. Built-in Local Realm Server API (/api/cloud-sync fallback)
//   4. Portable .astra Master Progression Files (Offline Backup & Device Transfer)

import {
  SaveSlotPayload,
  loadAllGameSlots,
  saveGameSlot,
  deleteGameSlot,
  getAllPersistentTimelineEchoes,
  restorePersistentTimelineEchoes,
  getAllPersistentRegressionHistories,
  restorePersistentRegressionHistories,
} from "@/lib/saveStorage";
import {
  getAllStories,
  saveStory,
  PRESET_STORIES,
} from "@/lib/storyStorage";
import {
  CodexLootEntry,
  CodexSceneEntry,
  getAllCodexLoot,
  getAllCodexScenes,
  saveCodexLoot,
  saveCodexScene,
} from "@/lib/codexStorage";
import { StoryContext, TimelineEcho } from "@/types/story";
import { DeathRegressionRecord } from "@/types/system";
import {
  getActiveCloudUser,
  getSupabaseClient,
  CloudAccountUser,
} from "@/lib/supabaseClient";
import {
  SavedCharacterBlueprint,
  loadCharacterRoster,
  mergeRemoteCharacterRoster,
} from "@/lib/characterRosterStorage";

export interface ProgressionSummary {
  activeCharacterName?: string;
  activeCharacterRole?: string;
  highestLevel: number;
  populatedSlots: number;
  slotPreviews: Array<{
    slotId: number;
    playerName: string;
    level: number;
    role: string;
    storyTitle: string;
    location: string;
    savedAt: string;
    savedAtISO?: string;
  }>;
  customWorldCount: number;
  codexLootCount: number;
  codexSceneCount: number;
  totalEchoes: number;
  totalRegressions: number;
}

export interface AstraProgressionBundle {
  magic: "ASTRA_CHRONICLES_PROGRESSION_BUNDLE";
  version: "1.0";
  exportedAt: string;
  deviceLabel: string;
  summary: ProgressionSummary;
  saveSlots: Record<number, SaveSlotPayload | null>;
  timelineEchoesByStory: Record<string, TimelineEcho[]>;
  regressionHistoryByStory: Record<string, DeathRegressionRecord[]>;
  customStories: StoryContext[];
  codexLoot: CodexLootEntry[];
  codexScenes: CodexSceneEntry[];
  characterRoster?: SavedCharacterBlueprint[];
}

export interface RestoreResult {
  restoredSlots: number;
  restoredStories: number;
  restoredLoot: number;
  restoredScenes: number;
  restoredEchoStories: number;
}

const CLOUD_AUTOSYNC_KEY = "astra_cloud_autosync_enabled";
const LAST_CLOUD_SYNC_KEY = "astra_last_cloud_sync_iso";

export function isCloudAutoSyncEnabled(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return true;
  const val = localStorage.getItem(CLOUD_AUTOSYNC_KEY);
  return val === null ? true : val === "true";
}

export function setCloudAutoSyncEnabled(enabled: boolean): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  localStorage.setItem(CLOUD_AUTOSYNC_KEY, String(enabled));
}

export function getLastCloudSyncTimestamp(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return localStorage.getItem(LAST_CLOUD_SYNC_KEY);
}

function setLastCloudSyncTimestamp(iso: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  localStorage.setItem(LAST_CLOUD_SYNC_KEY, iso);
}

function detectDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Astra Terminal";
  const ua = navigator.userAgent || "";
  const isElectron = ua.toLowerCase().includes("electron");
  const isMobile = /android|iphone|ipad|ipod/i.test(ua);
  const platform = isElectron
    ? "Desktop App"
    : isMobile
    ? "Mobile Browser"
    : "Web Browser";
  return `${platform}`;
}

/**
 * Computes summary metadata for quick UI comparison between Local & Cloud bundles
 */
export function buildProgressionSummary(params: {
  saveSlots: Record<number, SaveSlotPayload | null>;
  timelineEchoesByStory: Record<string, TimelineEcho[]>;
  regressionHistoryByStory: Record<string, DeathRegressionRecord[]>;
  customStories: StoryContext[];
  codexLoot: CodexLootEntry[];
  codexScenes: CodexSceneEntry[];
  characterRoster?: SavedCharacterBlueprint[];
}): ProgressionSummary {
  let highestLevel = 1;
  let activeCharacterName: string | undefined;
  let activeCharacterRole: string | undefined;
  let populatedSlots = 0;
  const slotPreviews: ProgressionSummary["slotPreviews"] = [];

  for (const slotId of [0, 1, 2, 3]) {
    const s = params.saveSlots[slotId];
    if (s && s.player) {
      populatedSlots++;
      const lvl = Number(s.player.level) || 1;
      if (lvl >= highestLevel || !activeCharacterName) {
        highestLevel = Math.max(highestLevel, lvl);
        activeCharacterName = s.player.name || "Traveler";
        activeCharacterRole = s.player.role || "Awakened";
      }
      slotPreviews.push({
        slotId,
        playerName: s.player.name || "Traveler",
        level: lvl,
        role: s.player.role || "Awakened",
        storyTitle: s.storyTitle || s.storyId || "Astra Chronicles",
        location: s.gameState?.location || "Unknown Sector",
        savedAt: s.savedAt || "Recent",
        savedAtISO: s.savedAtISO,
      });
    }
  }

  const totalEchoes = Object.values(params.timelineEchoesByStory || {}).reduce(
    (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
    0
  );

  const totalRegressions = Object.values(params.regressionHistoryByStory || {}).reduce(
    (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
    0
  );

  return {
    activeCharacterName,
    activeCharacterRole,
    highestLevel: populatedSlots > 0 ? highestLevel : 0,
    populatedSlots,
    slotPreviews,
    customWorldCount: (params.customStories || []).length,
    codexLootCount: (params.codexLoot || []).length,
    codexSceneCount: (params.codexScenes || []).length,
    totalEchoes,
    totalRegressions,
  };
}

/**
 * Gathers all local progression across IndexedDB and localStorage into a portable bundle.
 */
export async function collectProgressionBundle(options?: {
  optimizeForCloud?: boolean;
}): Promise<AstraProgressionBundle> {
  const [saveSlots, allStories, codexLoot, codexScenes, characterRoster] = await Promise.all([
    loadAllGameSlots(),
    getAllStories(),
    getAllCodexLoot(),
    getAllCodexScenes(),
    loadCharacterRoster(),
  ]);

  const presetIds = new Set(PRESET_STORIES.map((p) => p.id.toLowerCase()));
  const customStories = allStories.filter(
    (s) => !presetIds.has(s.id.toLowerCase()) && !s.isPreset
  );

  const timelineEchoesByStory = getAllPersistentTimelineEchoes();
  const regressionHistoryByStory = getAllPersistentRegressionHistories();

  // If optimizing for cloud transport, keep most recent 25 Codex scenes & strip multi-MB raw data URLs
  const finalScenes = options?.optimizeForCloud
    ? codexScenes.slice(0, 25).map((sc) => {
        if (sc.imageUrl && sc.imageUrl.length > 350000) {
          // Preserve external URLs or reasonably sized WebP/JPEG data URLs; trim huge uncompressed PNGs
          return { ...sc, imageUrl: "" };
        }
        return sc;
      })
    : codexScenes;

  const finalLoot = options?.optimizeForCloud
    ? codexLoot.map((lt) => {
        if (lt.imageUrl && lt.imageUrl.length > 350000) {
          return { ...lt, imageUrl: "" };
        }
        return lt;
      })
    : codexLoot;

  const summary = buildProgressionSummary({
    saveSlots,
    timelineEchoesByStory,
    regressionHistoryByStory,
    customStories,
    codexLoot: finalLoot,
    codexScenes: finalScenes,
  });

  return {
    magic: "ASTRA_CHRONICLES_PROGRESSION_BUNDLE",
    version: "1.0",
    exportedAt: new Date().toISOString(),
    deviceLabel: detectDeviceLabel(),
    summary,
    saveSlots,
    timelineEchoesByStory,
    regressionHistoryByStory,
    customStories,
    codexLoot: finalLoot,
    codexScenes: finalScenes,
    characterRoster,
  };
}

/**
 * Applies an incoming progression bundle to local IndexedDB + localStorage.
 * - "merge": Updates save slots present in the bundle (keeping local slots if the bundle slot is empty),
 *            and union-merges Timeline Echoes, Regressions, Custom Worlds, and Codex Relics.
 * - "overwrite": Replaces all Save Slots 0-3 and Timeline Echoes/Regressions with the bundle's exact state.
 */
export async function applyProgressionBundle(
  bundle: AstraProgressionBundle,
  mode: "merge" | "overwrite" = "merge"
): Promise<RestoreResult> {
  if (!bundle || typeof bundle !== "object") {
    throw new Error("Invalid progression bundle format.");
  }

  let restoredSlots = 0;
  let restoredStories = 0;
  let restoredLoot = 0;
  let restoredScenes = 0;

  // 1. Restore Save Slots (0-3)
  const incomingSlots = bundle.saveSlots || {};
  for (const slotId of [0, 1, 2, 3]) {
    const incomingSlot = incomingSlots[slotId];
    if (incomingSlot && incomingSlot.player) {
      await saveGameSlot(slotId, {
        ...incomingSlot,
        slotId,
      });
      restoredSlots++;
    } else if (mode === "overwrite") {
      await deleteGameSlot(slotId);
    }
  }

  // 2. Restore Timeline Echoes & Death Regressions
  if (bundle.timelineEchoesByStory) {
    restorePersistentTimelineEchoes(bundle.timelineEchoesByStory, mode);
  }
  if (bundle.regressionHistoryByStory) {
    restorePersistentRegressionHistories(bundle.regressionHistoryByStory, mode);
  }
  const restoredEchoStories = Object.keys(bundle.timelineEchoesByStory || {}).length;

  // 3. Restore Custom Worlds
  if (Array.isArray(bundle.customStories)) {
    for (const story of bundle.customStories) {
      if (story && story.id && story.title) {
        await saveStory(story);
        restoredStories++;
      }
    }
  }

  // 4. Restore Multiverse Codex Loot
  if (Array.isArray(bundle.codexLoot)) {
    for (const loot of bundle.codexLoot) {
      if (loot && loot.itemName && loot.storyId) {
        await saveCodexLoot(loot);
        restoredLoot++;
      }
    }
  }

  // 5. Restore Multiverse Codex Scenes
  if (Array.isArray(bundle.codexScenes)) {
    for (const scene of bundle.codexScenes) {
      if (scene && scene.storyId && scene.location) {
        await saveCodexScene(scene);
        restoredScenes++;
      }
    }
  }

  // 6. Restore Cross-World Character Roster Blueprints
  if (Array.isArray(bundle.characterRoster) && bundle.characterRoster.length > 0) {
    await mergeRemoteCharacterRoster(bundle.characterRoster);
  }

  return {
    restoredSlots,
    restoredStories,
    restoredLoot,
    restoredScenes,
    restoredEchoStories,
  };
}

// ============================================================================
// PORTABLE .ASTRA FILE EXPORT & IMPORT
// ============================================================================

export async function downloadAstraBundleFile(
  customBundle?: AstraProgressionBundle,
  customFilename?: string
): Promise<AstraProgressionBundle> {
  const bundle = customBundle || (await collectProgressionBundle({ optimizeForCloud: false }));
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const dateStamp = new Date().toISOString().slice(0, 10);
  const charTag = (bundle.summary.activeCharacterName || "chronicle")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const filename = customFilename || `astra-save-${charTag}-${dateStamp}.astra`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  return bundle;
}

export async function parseAstraBundleFile(file: File): Promise<AstraProgressionBundle> {
  const text = await file.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Could not parse .astra save file. Ensure it is a valid JSON/Astra archive.");
  }

  // Also support importing a single raw SaveSlotPayload JSON if someone exported a single slot
  if (parsed && parsed.player && parsed.gameState && parsed.slotId !== undefined) {
    const slotId = Number(parsed.slotId) || 1;
    const saveSlots: Record<number, SaveSlotPayload | null> = {
      0: null,
      1: null,
      2: null,
      3: null,
      [slotId]: parsed as SaveSlotPayload,
    };
    const summary = buildProgressionSummary({
      saveSlots,
      timelineEchoesByStory: {},
      regressionHistoryByStory: {},
      customStories: [],
      codexLoot: [],
      codexScenes: [],
    });
    return {
      magic: "ASTRA_CHRONICLES_PROGRESSION_BUNDLE",
      version: "1.0",
      exportedAt: parsed.savedAtISO || new Date().toISOString(),
      deviceLabel: "Single Slot Export",
      summary,
      saveSlots,
      timelineEchoesByStory: {},
      regressionHistoryByStory: {},
      customStories: [],
      codexLoot: [],
      codexScenes: [],
    };
  }

  if (!parsed || !parsed.saveSlots) {
    throw new Error("Invalid .astra progression file: missing saveSlots payload.");
  }

  if (!parsed.summary) {
    parsed.summary = buildProgressionSummary({
      saveSlots: parsed.saveSlots || {},
      timelineEchoesByStory: parsed.timelineEchoesByStory || {},
      regressionHistoryByStory: parsed.regressionHistoryByStory || {},
      customStories: parsed.customStories || [],
      codexLoot: parsed.codexLoot || [],
      codexScenes: parsed.codexScenes || [],
    });
  }

  return parsed as AstraProgressionBundle;
}

// ============================================================================
// CLOUD SYNC OPERATIONS (SUPABASE POSTGRES + LOCAL SERVER FALLBACK)
// ============================================================================

export interface CloudSyncPushResult {
  success: boolean;
  updatedAt?: string;
  provider?: "supabase" | "local_server";
  error?: string;
}

export interface CloudSyncPullResult {
  found: boolean;
  updatedAt: string | null;
  bundle: AstraProgressionBundle | null;
  provider?: "supabase" | "local_server";
  error?: string;
}

/**
 * Pushes the player's current progression bundle to Supabase Cloud (or Local Server API fallback).
 */
export async function syncProgressionToCloud(
  explicitUser?: CloudAccountUser | null
): Promise<CloudSyncPushResult> {
  const user = explicitUser !== undefined ? explicitUser : await getActiveCloudUser();
  if (!user) {
    return { success: false, error: "Not signed in to a Cloud Sync account." };
  }

  const bundle = await collectProgressionBundle({ optimizeForCloud: true });
  const nowISO = new Date().toISOString();

  // 1. Try Supabase Postgres if user is authenticated via Supabase
  const supabase = getSupabaseClient();
  if (supabase && user.mode === "supabase") {
    try {
      const { error } = await supabase.from("user_progression_bundles").upsert(
        {
          user_id: user.id,
          email: user.email,
          version: bundle.version,
          device_label: bundle.deviceLabel,
          summary: bundle.summary,
          bundle,
          updated_at: nowISO,
        },
        { onConflict: "user_id" }
      );

      if (!error) {
        setLastCloudSyncTimestamp(nowISO);
        return {
          success: true,
          updatedAt: nowISO,
          provider: "supabase",
        };
      }
      console.warn("Supabase table upsert warning (falling back to API route):", error.message);
    } catch (err) {
      console.warn("Supabase cloud push error (falling back to API route):", err);
    }
  }

  // 2. Fallback / Local Server API Route (/api/cloud-sync)
  try {
    const res = await fetch("/api/cloud-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "push",
        userId: user.id,
        email: user.email,
        bundle,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error || "Failed to push progression to server.",
      };
    }

    const syncedAt = data.updatedAt || nowISO;
    setLastCloudSyncTimestamp(syncedAt);
    return {
      success: true,
      updatedAt: syncedAt,
      provider: "local_server",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Network error while syncing progression.",
    };
  }
}

/**
 * Fetches the player's latest progression bundle from Supabase Cloud (or Local Server API fallback).
 */
export async function fetchCloudProgression(
  explicitUser?: CloudAccountUser | null
): Promise<CloudSyncPullResult> {
  const user = explicitUser !== undefined ? explicitUser : await getActiveCloudUser();
  if (!user) {
    return { found: false, updatedAt: null, bundle: null, error: "Not signed in." };
  }

  // 1. Try Supabase Postgres if user is authenticated via Supabase
  const supabase = getSupabaseClient();
  if (supabase && user.mode === "supabase") {
    try {
      const { data, error } = await supabase
        .from("user_progression_bundles")
        .select("bundle, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data && data.bundle) {
        return {
          found: true,
          updatedAt: data.updated_at || data.bundle.exportedAt || null,
          bundle: data.bundle as AstraProgressionBundle,
          provider: "supabase",
        };
      }
    } catch (err) {
      console.warn("Supabase cloud fetch error, checking fallback API:", err);
    }
  }

  // 2. Fallback / Local Server API Route (/api/cloud-sync)
  try {
    const res = await fetch(`/api/cloud-sync?userId=${encodeURIComponent(user.id)}`, {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json();
    if (res.ok && data.found && data.bundle) {
      return {
        found: true,
        updatedAt: data.updatedAt || data.bundle.exportedAt || null,
        bundle: data.bundle as AstraProgressionBundle,
        provider: "local_server",
      };
    }
    return {
      found: false,
      updatedAt: null,
      bundle: null,
      provider: "local_server",
    };
  } catch (err: any) {
    return {
      found: false,
      updatedAt: null,
      bundle: null,
      error: err?.message || "Could not reach cloud server.",
    };
  }
}

/**
 * Non-blocking background cloud sync helper triggered after manual saves or auto-saves.
 */
let autoSyncTimeout: ReturnType<typeof setTimeout> | null = null;

export function triggerBackgroundCloudSync(onSynced?: (updatedAt: string) => void): void {
  if (typeof window === "undefined") return;
  if (!isCloudAutoSyncEnabled()) return;

  if (autoSyncTimeout) {
    clearTimeout(autoSyncTimeout);
  }

  autoSyncTimeout = setTimeout(async () => {
    try {
      const user = await getActiveCloudUser();
      if (!user) return;
      const res = await syncProgressionToCloud(user);
      if (res.success && res.updatedAt && onSynced) {
        onSynced(res.updatedAt);
      }
    } catch {}
  }, 1200);
}

