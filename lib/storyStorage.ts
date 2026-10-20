import { StoryContext } from "@/types/story";
import { ASTRA_CHRONICLES_STORY } from "./defaultStory";
import neonEclipseStory from "@/data/stories/neon-eclipse.json";

const STORAGE_KEY = "astra_multi_story_catalog";
const DB_NAME = "AstraStoryCatalogDB";
const STORE_NAME = "stories";
const DB_VERSION = 1;

export const PRESET_STORIES: StoryContext[] = [
  ASTRA_CHRONICLES_STORY,
  neonEclipseStory as unknown as StoryContext,
];

function openStoryDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not available in this environment."));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Returns all available stories (presets + user-created).
 */
export async function getAllStories(): Promise<StoryContext[]> {
  const storyMap = new Map<string, StoryContext>();

  // 1. Seed presets
  PRESET_STORIES.forEach((story) => {
    storyMap.set(story.id, story);
  });

  // 2. Try IndexedDB
  try {
    const db = await openStoryDB();
    const idbStories = await new Promise<StoryContext[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    idbStories.forEach((s) => storyMap.set(s.id, s));
  } catch {
    // 3. Fallback to localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: StoryContext[] = JSON.parse(raw);
          parsed.forEach((s) => storyMap.set(s.id, s));
        }
      } catch (e) {
        console.warn("Failed to parse local storage stories:", e);
      }
    }
  }

  return Array.from(storyMap.values());
}

/**
 * Retrieves a single story by its ID.
 */
export async function getStoryById(storyId: string): Promise<StoryContext> {
  const all = await getAllStories();
  const match = all.find((s) => s.id.toLowerCase() === storyId.toLowerCase());
  return match || ASTRA_CHRONICLES_STORY;
}

/**
 * Saves or updates a custom story in both IndexedDB and localStorage.
 */
export async function saveStory(story: StoryContext): Promise<void> {
  // 1. IndexedDB
  try {
    const db = await openStoryDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(story);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB story save failed, relying on localStorage:", err);
  }

  // 2. LocalStorage mirror
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let list: StoryContext[] = raw ? JSON.parse(raw) : [];
      list = list.filter((s) => s.id !== story.id);
      list.unshift(story);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  }
}

/**
 * Deletes a custom story (presets cannot be deleted).
 */
export async function deleteStory(storyId: string): Promise<boolean> {
  const isPreset = PRESET_STORIES.some((p) => p.id === storyId);
  if (isPreset) {
    return false; // Protected preset
  }

  try {
    const db = await openStoryDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(storyId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        let list: StoryContext[] = JSON.parse(raw);
        list = list.filter((s) => s.id !== storyId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch {}
  }

  return true;
}

