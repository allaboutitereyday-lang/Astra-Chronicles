import { StoryContext } from "@/types/story";
import { ASTRA_CHRONICLES_STORY } from "@/lib/defaultStory";

export interface MultiverseExportPayload {
  version: "1.0";
  type?: "preset_override" | "full";
  storyId?: string;
  exportedAt: string;
  story: StoryContext;
  companionSeeds?: Record<string, { seed: number; romancePath?: string; affectionLevel?: number }>;
  preferences?: {
    theme?: string;
    autoSave?: boolean;
    audioMuted?: boolean;
  };
}

/**
 * Encodes a StoryContext and configuration into a URL-safe Base64 string
 */
export function encodeMultiverseSeed(
  story: StoryContext,
  preferences?: { theme?: string; autoSave?: boolean; audioMuted?: boolean }
): string {
  try {
    const isPresetWorld = story.id === "astra-chronicles" || story.isPreset;
    let payload: any;

    if (isPresetWorld) {
      // Highly compact preset payload (under 600 bytes)
      payload = {
        v: "1.0",
        type: "preset_override",
        id: story.id,
        exportedAt: new Date().toISOString(),
        seeds: (story.companions || []).map((c) => ({
          id: c.id,
          name: c.name,
          seed: c.seed || 1234567,
          romancePath: c.romancePath || "uncommitted",
          affectionLevel: c.affectionLevel ?? c.affection ?? 15,
        })),
        activeSynergies: (story.activeSynergies || []).map((s) => s.id),
        preferences,
      };
    } else {
      payload = {
        version: "1.0",
        type: "full",
        exportedAt: new Date().toISOString(),
        story: {
          ...story,
          // Prune save-specific runtime nodes from seed to keep URL compact
          visitedNodes: [],
          companions: (story.companions || []).map((c) => ({
            ...c,
            seed: c.seed || 1234567,
            romancePath: c.romancePath || "uncommitted",
            affectionLevel: c.affectionLevel ?? c.affection ?? 15,
          })),
        },
        preferences,
      };
    }

    const jsonString = JSON.stringify(payload);

    // Cross-environment UTF-8 base64 encoding
    if (typeof window !== "undefined") {
      const utf8Bytes = new TextEncoder().encode(jsonString);
      let binary = "";
      for (let i = 0; i < utf8Bytes.byteLength; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    } else {
      return Buffer.from(jsonString, "utf8").toString("base64url");
    }
  } catch (err) {
    console.error("Failed to encode multiverse seed:", err);
    return "";
  }
}

/**
 * Decodes a URL-safe Base64 string back into a MultiverseExportPayload
 */
export function decodeMultiverseSeed(seedString: string): MultiverseExportPayload | null {
  try {
    if (!seedString || typeof seedString !== "string") return null;

    let base64 = seedString.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    let jsonString = "";
    if (typeof window !== "undefined") {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      jsonString = new TextDecoder().decode(bytes);
    } else {
      jsonString = Buffer.from(base64, "base64").toString("utf8");
    }

    const parsed = JSON.parse(jsonString);

    if (parsed.type === "preset_override" && (parsed.id || parsed.storyId)) {
      const storyId = parsed.id || parsed.storyId;
      const baseStory = storyId === "astra-chronicles" ? ASTRA_CHRONICLES_STORY : null;
      if (baseStory) {
        const hydratedCompanions = baseStory.companions.map((comp) => {
          const override = (parsed.seeds || []).find(
            (s: any) => s.id === comp.id || (s.name && comp.name && s.name.toLowerCase() === comp.name.toLowerCase())
          );
          if (override) {
            return {
              ...comp,
              seed: override.seed || comp.seed,
              romancePath: override.romancePath || comp.romancePath || "uncommitted",
              affectionLevel: override.affectionLevel ?? comp.affectionLevel ?? 15,
            };
          }
          return comp;
        });

        return {
          version: "1.0",
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          story: {
            ...baseStory,
            companions: hydratedCompanions,
          },
          preferences: parsed.preferences,
        };
      }
    }

    if (parsed.story && parsed.story.id) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn("Failed to decode multiverse seed:", err);
    return null;
  }
}

/**
 * Generates a full shareable campaign link
 */
export function generateShareableUrl(story: StoryContext, baseUrl?: string): string {
  const origin = baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://astra-chronicles.local");
  const encoded = encodeMultiverseSeed(story);
  return `${origin}/play/${story.id}?seed=${encoded}`;
}

/**
 * Generates formatted Discord/Reddit Markdown World Card for 1-click sharing
 */
export function generateDiscordRedditWorldCard(story: StoryContext, shareUrl: string): string {
  const companionList = (story.companions || [])
    .map(
      (c) =>
        `• **${c.name}** (${c.title}) | Seed: \`${c.seed}\` | Path: *${c.romancePath || "Uncommitted"}*`
    )
    .join("\n");

  const synergyList = (story.activeSynergies || [])
    .filter((s) => s.isActive)
    .map((s) => `• ✦ **${s.bonusName}** (${s.setName} Set) -> \`${s.unlockedExclusiveChoicePrefix}\``)
    .join("\n");

  return `🌌 **ASTRA CHRONICLES: MULTIVERSE WORLD CARD**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**World**: ${story.title}
**Genre**: ${story.genre} | **Narration**: *${story.narrationStyle}*
**Tagline**: *"${story.tagline}"*

👑 **HEROINES & LOCKED VISUAL SEEDS**:
${companionList || "• Standard Heroine Cast"}

⚔️ **ACTIVE RELIC SYNERGIES**:
${synergyList || "• Unlocking in sector trials..."}

🪐 **1-CLICK CAMPAIGN IMPORT**:
👉 [**Click to Launch Universe in Astra Chronicles**](${shareUrl})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}
