/**
 * Vision-to-Text Character Appearance Encoder for Astra Chronicles
 * 
 * Inspects uploaded protagonist portraits using fast vision-capable models (e.g. Gemini 2.5 Flash,
 * GPT-4o-mini) and extracts a vivid, narrative-ready physical description.
 * This description is then supplied to text-only roleplay models (such as Euryale 70B, Hermes 3,
 * Lunaris, DeepSeek) so they can authentically reference the protagonist's visual appearance
 * without suffering 404/400 errors from unsupported image inputs.
 */

const avatarDescriptionCache = new Map<string, string>();

/**
 * Computes a unique lightweight cache key for an image string without storing
 * duplicate massive base64 payloads as keys.
 */
function getAvatarCacheKey(avatarStr: string, name: string): string {
  if (avatarStr.length < 120) return `${name}_${avatarStr}`;
  const prefix = avatarStr.slice(0, 60);
  const suffix = avatarStr.slice(-60);
  return `${name}_${avatarStr.length}_${prefix}_${suffix}`;
}

export const VISION_FALLBACK_CHAIN = [
  "google/gemini-2.5-flash",
  "openai/gpt-4o-mini",
  "qwen/qwen-2-vl-72b-instruct",
];

/**
 * Encodes an uploaded character portrait into a 2-3 sentence visual description.
 * Utilizes an in-memory cache to guarantee zero redundant vision calls for the same portrait.
 */
export async function describeProtagonistAvatar(
  avatarBase64: string | undefined | null,
  protagonistName: string = "The Protagonist",
  protagonistRole: string = "Adventurer",
  apiKey?: string
): Promise<string | null> {
  if (!avatarBase64 || typeof avatarBase64 !== "string") {
    return null;
  }

  // Basic sanity check for valid image data URL or web URL
  const trimmed = avatarBase64.trim();
  if (!trimmed.startsWith("data:image/") && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }

  const cacheKey = getAvatarCacheKey(trimmed, protagonistName);
  if (avatarDescriptionCache.has(cacheKey)) {
    return avatarDescriptionCache.get(cacheKey)!;
  }

  const routerKey = apiKey || process.env.OPENROUTER_API_KEY;
  if (!routerKey) {
    console.warn("[VisionEncoder] OPENROUTER_API_KEY not found; skipping avatar inspection.");
    return null;
  }

  for (const model of VISION_FALLBACK_CHAIN) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${routerKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://astra-chronicles.local",
          "X-Title": "Astra Chronicles Vision Encoder",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: `You are the Art Director for an immersive visual novel. In 2 to 3 vivid, atmospheric sentences, describe this character portrait of the protagonist (${protagonistName}, ${protagonistRole}). Highlight their hair color/style, eye color/expression, physical build, armor/clothing textures, visible weapons or accessories, and overall aura. Be evocative, specific, and direct. Do not say "The image shows" or "In this portrait"; write direct narrative character descriptions.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this protagonist portrait for ${protagonistName}:`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: trimmed,
                  },
                },
              ],
            },
          ],
          max_tokens: 160,
          temperature: 0.6,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const description = data.choices?.[0]?.message?.content?.trim();
        if (description && description.length > 20) {
          console.log(`[VisionEncoder] Successfully generated avatar description using ${model}: "${description.slice(0, 80)}..."`);
          avatarDescriptionCache.set(cacheKey, description);
          return description;
        }
      } else {
        const errText = await response.text();
        console.warn(`[VisionEncoder] Model ${model} returned HTTP ${response.status}: ${errText.slice(0, 150)}`);
      }
    } catch (err: any) {
      console.warn(`[VisionEncoder] Model ${model} fetch failed: ${err?.message || err}`);
    }
  }

  return null;
}

