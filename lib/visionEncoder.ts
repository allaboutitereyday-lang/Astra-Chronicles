/**
 * Vision-to-Text Character Appearance Encoder for Astra Chronicles
 * 
 * Inspects uploaded protagonist portraits using fast vision-capable models (e.g. Gemini 2.5 Flash,
 * GPT-4o-mini) and extracts a vivid, narrative-ready physical description.
 * This description is then supplied to text-only roleplay models (such as Euryale 70B, Hermes 3,
 * Lunaris, DeepSeek) so they can authentically reference the protagonist's visual appearance
 * without suffering 404/400 errors from unsupported image inputs.
 */

import { CharacterVisualDNA } from "@/types/story";

const avatarDescriptionCache = new Map<string, string>();
const avatarDnaCache = new Map<string, CharacterVisualDNA>();

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
 * Returns true ONLY if text explicitly describes literal nudity / unclad state.
 * Must NOT trigger on generic "bare skin" / "bare shoulders" / "none" / "unarmored".
 */
export function isExplicitlyNudeOrUnclad(text?: string | null): boolean {
  if (!text || typeof text !== "string") return false;
  return /\b(nude|naked|unclad|completely bare|without any clothes|without clothing|no clothes|completely unclad)\b/i.test(
    text
  );
}

function truncateCleanly(text: string, maxLen: number = 70): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  const slice = cleaned.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 24 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[,;:\s]+$/, "")}…`;
}

function formatAttireLabel(raw: string): string {
  const cleaned = raw
    .replace(/^(?:a|an)\s+/i, "")
    .replace(/^(?:wearing|clad in|dressed in|attired in|sporting)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return truncateCleanly(capitalized, 70);
}

/**
 * Resolves a concise, human-readable attire label from the character's uploaded
 * portrait Visual DNA or Vision description, falling back gracefully when absent.
 */
export function resolvePortraitAttireLabel(
  visualDna?: CharacterVisualDNA | null,
  visualDescription?: string | null,
  fallback: string = "Portrait Attire (Unarmored)"
): string {
  const isGenericAttireString = (val?: string | null): boolean => {
    if (!val || typeof val !== "string") return true;
    const lower = val.trim().toLowerCase();
    if (!lower) return true;
    if (
      lower === "none" ||
      lower === "unarmored" ||
      lower === "coat" ||
      lower === "pending..." ||
      lower === "[system pending]" ||
      lower === "n/a" ||
      lower === "unknown" ||
      lower.includes("dark leather coat over armor vest") ||
      lower === "combat trousers" ||
      lower === "dark combat trousers and boots" ||
      lower.startsWith("portrait attire")
    ) {
      return true;
    }
    return isExplicitlyNudeOrUnclad(lower);
  };

  if (visualDna && !isFallbackVisualDescription(visualDna.fullPromptAnchor)) {
    const upper = visualDna.primaryAttire?.upper?.trim() || "";
    const lower = visualDna.primaryAttire?.lower?.trim() || "";
    if (!isGenericAttireString(upper)) {
      const includeLower =
        !isGenericAttireString(lower) &&
        upper.length + lower.length + 2 <= 70 &&
        !upper.toLowerCase().includes(lower.toLowerCase());
      const combined = includeLower ? `${upper}, ${lower}` : upper;
      const formatted = formatAttireLabel(combined);
      if (formatted && !isExplicitlyNudeOrUnclad(formatted)) {
        return formatted;
      }
    }
  }

  if (
    visualDescription &&
    !isFallbackVisualDescription(visualDescription) &&
    !isExplicitlyNudeOrUnclad(visualDescription)
  ) {
    const match = visualDescription.match(
      /(?:wearing|clad in|dressed in|attired in|sporting)\s+([^.;\n]+)/i
    );
    if (match?.[1]) {
      const formatted = formatAttireLabel(match[1]);
      if (formatted && !isExplicitlyNudeOrUnclad(formatted)) {
        return formatted;
      }
    }
  }

  return fallback;
}

/**
 * Returns true if the given visualDescription string is empty or was generated
 * by the procedural fallback rather than an actual Vision model inspection.
 */
export function isFallbackVisualDescription(desc?: string | null): boolean {
  if (!desc || typeof desc !== "string") return true;
  const trimmed = desc.trim();
  if (trimmed.length < 15) return true;
  return (
    trimmed.includes("distinctive visual novel anime protagonist styling") ||
    trimmed.includes("dark silver swept hair, piercing amber eyes")
  );
}

/**
 * Encodes an uploaded character portrait into a 2-3 sentence visual description.
 * Utilizes an in-memory cache to guarantee zero redundant vision calls for the same portrait.
 */
export async function describeProtagonistAvatar(
  avatarBase64: string | undefined | null,
  protagonistName: string = "The Protagonist",
  protagonistRole: string = "Adventurer",
  apiKey?: string,
  protagonistRace: string = "Human",
  racialTraits: string[] = []
): Promise<string | null> {
  if (!avatarBase64 || typeof avatarBase64 !== "string") {
    return null;
  }

  // Basic sanity check for valid image data URL or web URL
  const trimmed = avatarBase64.trim();
  if (!trimmed.startsWith("data:image/") && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }

  const cacheKey = getAvatarCacheKey(trimmed, `${protagonistName}_${protagonistRace}`);
  if (avatarDescriptionCache.has(cacheKey)) {
    return avatarDescriptionCache.get(cacheKey)!;
  }

  const routerKey = apiKey || process.env.OPENROUTER_API_KEY;
  if (!routerKey) {
    console.warn("[VisionEncoder] OPENROUTER_API_KEY not found; skipping avatar inspection.");
    return null;
  }

  const traitsContext = racialTraits && racialTraits.length > 0
    ? ` (anticipated anatomical traits: ${racialTraits.join(", ")})`
    : "";

  const systemPrompt = `You are the Lead Art Director for an immersive dark fantasy visual novel.
Your task is to carefully inspect the attached character portrait of the protagonist:
- Name: ${protagonistName.split(" ")[0]}
- Archetype / Class: ${protagonistRole}
- Lineage / Race: ${protagonistRace}${traitsContext}

CRITICAL VISUAL ACCURACY DIRECTIVE (LOOK CLOSELY AT THE IMAGE):
1. Skin Tone & Complexion: Accurately describe their exact skin tone/complexion (e.g. deep brown skin, warm bronze, dark ebony, olive, pale porcelain, etc.) and any facial markings or scars.
2. Hair Color, Texture & Style: Accurately identify their true hair color and hairstyle (e.g. black braided hair / locs adorned with silver and gold cuffs/beads, cropped dark hair, flowing locks, etc.). NEVER guess "silver" or "blonde" if the hair in the image is black or dark!
3. Eyes & Expression: Describe their eye color, eyelid shape (e.g. relaxed hooded dark eyes, sharp gaze), and facial expression/demeanor.
4. Attire & Accessories: Describe the exact clothing, casual outfit, robes, uniform, or armor worn in the portrait in natural prose (e.g. crisp white collared shirt with a black tie, dark cloak draped over one shoulder, kimono, streetwear jacket). If the portrait is a close-up bust or headshot, describe the visible collar/top and infer natural matching attire rather than calling them unclad. Only state "unclad" if the character is literally nude.
5. Non-Human Anatomy (if any): Note any visible ${protagonistRace} traits (ears, fangs, horns, scales, tail, glowing eyes).
6. Output 2 to 3 vivid, natural sentences describing their appearance. Do not say "The image shows" or "In this portrait"; write direct narrative character description.`;

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
              content: systemPrompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Scan and describe the physical appearance and ${protagonistRace} anatomical traits of ${protagonistName}:`,
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
          max_tokens: 180,
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

/**
 * Procedural fallback for Visual DNA when vision model API is unreachable or offline.
 */
export function buildFallbackVisualDna(
  name: string,
  role: string,
  visualDescription?: string | null,
  protagonistRace: string = "Human",
  racialTraits: string[] = []
): CharacterVisualDNA {
  const desc = (visualDescription || "").toLowerCase();
  const gender: "male" | "female" | "androgynous" =
    desc.includes("woman") || desc.includes("female") || desc.includes("girl") || desc.includes("her ")
      ? "female"
      : desc.includes("man") || desc.includes("male") || desc.includes("boy") || desc.includes("his ")
      ? "male"
      : "androgynous";

  const hairMatch = desc.match(/\b(black|ebony|jet|dark|brown|silver|white|blonde|gold|crimson|red|blue|violet|purple)(?:-[\w]+)?\s+(?:[\w-]+\s+)?(?:hair|braids|locs|dreads)\b/i);
  const hairColor = hairMatch ? hairMatch[1] : (desc.match(/\b(black|ebony|dark|brown|silver|white|blonde|gold|crimson|red|blue|violet|purple)\b/i)?.[1] || "dark");
  const hairStyle = desc.match(/\b(braided|braids|locs|dreads|messy|spiky|straight|wavy|ponytail|undercut|swept|long|short)\b/i)?.[1] || "styled";

  const eyeMatch = desc.match(/\b(dark|brown|obsidian|grey|gray|amber|gold|blue|azure|crimson|red|violet|purple|green|emerald)\s+eyes\b/i);
  const eyeColor = eyeMatch ? eyeMatch[1] : (desc.match(/\b(dark|brown|obsidian|grey|gray|amber|gold|blue|azure|crimson|red|violet|purple|green|emerald)\b/i)?.[1] || "sharp");

  const isUnclad = isExplicitlyNudeOrUnclad(desc);
  const upperAttire = isUnclad ? "unclad, bare skin with no armor" : `${role} dark leather coat over armor vest`;
  const lowerAttire = isUnclad ? "unclad, bare legs with no garments" : "dark combat trousers and boots";

  // Derive active racial traits if none explicitly supplied
  let derivedTraits = Array.isArray(racialTraits) && racialTraits.length > 0 ? [...racialTraits] : [];
  const raceLower = (protagonistRace || "Human").toLowerCase();
  if (derivedTraits.length === 0 && raceLower !== "human") {
    if (raceLower.includes("lycan") || raceLower.includes("wolf") || raceLower.includes("beast")) {
      derivedTraits = ["dense lupine fur", "sharp fangs", "pointed wolf ears", "predatory amber gaze"];
    } else if (raceLower.includes("elf")) {
      derivedTraits = ["elongated pointed ears", "ethereal luminescence", "refined noble cheekbones"];
    } else if (raceLower.includes("demon") || raceLower.includes("tiefling")) {
      derivedTraits = ["curved obsidian horns", "amber slit eyes", "pointed fangs", "barbed tail"];
    } else if (raceLower.includes("dragon")) {
      derivedTraits = ["fine reptilian scales", "draconic slit irises", "horns and crest"];
    } else if (raceLower.includes("vampire") || raceLower.includes("blood")) {
      derivedTraits = ["elongated predatory fangs", "pallid moonlit complexion", "crimson irises"];
    } else {
      derivedTraits = [`distinctive ${protagonistRace} features`];
    }
  }

  const raceTag = protagonistRace && protagonistRace.toLowerCase() !== "human" ? `${protagonistRace} ` : "";
  const traitsTag = derivedTraits.length > 0 ? `${derivedTraits.join(", ")}, ` : "";

  const anchor = isUnclad
    ? `protagonist ${name}: ${gender} ${raceTag}${role}, ${traitsTag}${hairColor} ${hairStyle} hair, piercing ${eyeColor} eyes, completely unclad and bare-skinned with no clothing or armor, distinctive visual novel anime protagonist styling`
    : `protagonist ${name}: ${gender} ${raceTag}${role}, ${traitsTag}${hairColor} ${hairStyle} hair, piercing ${eyeColor} eyes, detailed ${role} combat attire with dark leather and reinforced plates, distinctive visual novel anime protagonist styling`;

  return {
    gender,
    race: protagonistRace,
    racialTraits: derivedTraits,
    ageAppearance: "early 20s",
    build: raceLower.includes("lycan") ? "powerful athletic lupine warrior build" : "athletic, combat-ready build",
    hair: {
      color: hairColor,
      style: hairStyle,
      length: "medium",
    },
    eyes: {
      color: eyeColor,
    },
    complexion: raceLower.includes("vampire") ? "pallid porcelain" : "fair, subtly weathered",
    primaryAttire: {
      upper: upperAttire,
      lower: lowerAttire,
      palette: isUnclad ? ["bare skin tone"] : ["midnight black", "burnished steel", "deep crimson"],
    },
    signatureAccessories: isUnclad ? [] : [`${role} weaponry`],
    fullPromptAnchor: anchor,
  };
}

/**
 * Extracts structured Character Visual DNA from an avatar image using high-speed vision models.
 * Returns structured tokens (hair, eyes, build, attire, accessories) and a compiled `fullPromptAnchor`
 * that guarantees consistent protagonist appearance across AI scene CG and illustration generation.
 */
export async function extractProtagonistVisualDna(
  avatarBase64: string | undefined | null,
  protagonistName: string = "The Protagonist",
  protagonistRole: string = "Adventurer",
  existingDescription?: string | null,
  apiKey?: string,
  protagonistRace: string = "Human",
  racialTraits: string[] = []
): Promise<CharacterVisualDNA> {
  if (!avatarBase64 || typeof avatarBase64 !== "string") {
    return buildFallbackVisualDna(protagonistName, protagonistRole, existingDescription, protagonistRace, racialTraits);
  }

  const trimmed = avatarBase64.trim();
  if (!trimmed.startsWith("data:image/") && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return buildFallbackVisualDna(protagonistName, protagonistRole, existingDescription, protagonistRace, racialTraits);
  }

  const cacheKey = `dna_${getAvatarCacheKey(trimmed, `${protagonistName}_${protagonistRace}`)}`;
  if (avatarDnaCache.has(cacheKey)) {
    return avatarDnaCache.get(cacheKey)!;
  }

  const routerKey = apiKey || process.env.OPENROUTER_API_KEY;
  if (!routerKey) {
    return buildFallbackVisualDna(protagonistName, protagonistRole, existingDescription, protagonistRace, racialTraits);
  }

  const traitsContext = racialTraits && racialTraits.length > 0
    ? ` (anticipated anatomical traits: ${racialTraits.join(", ")})`
    : "";

  const systemPrompt = `You are a Lead Anime Character Designer and Visual Concept Artist.
Inspect this character portrait of the protagonist:
- Name: ${protagonistName}
- Archetype / Class: ${protagonistRole}
- Lineage / Race: ${protagonistRace}${traitsContext}

Extract their exact, unambiguous Visual DNA. Record the exact outfit, casual clothing, robes, uniform, or attire worn in the portrait under primaryAttire (even if they are unarmored or wearing everyday clothing). Only record attire as 'unclad' if the character in the portrait is literally nude with no clothing.
Pay close attention to species and non-human anatomy (fur, fangs, wolf/cat/animal ears, horns, tails, scales, wings, digitigrade limbs, slit pupils, pointed ears).
You MUST respond STRICTLY with a valid JSON object matching this schema:
{
  "gender": "male" | "female" | "androgynous",
  "race": "${protagonistRace}",
  "racialTraits": string[], // Explicit anatomical features detected in portrait e.g. ["thick slate-grey fur", "sharp canine fangs", "pointed wolf ears"]
  "ageAppearance": string, // e.g. "early 20s"
  "build": string, // e.g. "athletic lean warrior"
  "hair": {
    "color": string, // e.g. "silver-white with lilac undertones"
    "style": string, // e.g. "messy undercut, swept fringe"
    "length": string // e.g. "short"
  },
  "eyes": {
    "color": string, // e.g. "glowing electric amber"
    "shape": string // e.g. "sharp hooded slit"
  },
  "complexion": string, // e.g. "pale skin, faint scar over bridge of nose"
  "facialFeatures": string[], // 1-3 prominent features
  "primaryAttire": {
    "upper": string, // e.g. "high-collared midnight coat over etched runic breastplate"
    "lower": string, // e.g. "dark leather-bound trousers with steel greaves"
    "palette": string[] // 2-3 colors
  },
  "signatureAccessories": string[], // 1-3 accessories e.g. ["fingerless gloves", "silver ear cuff"]
  "fullPromptAnchor": string // A dense 50-80 word prompt phrase describing the protagonist's exact physical look including their race and anatomical traits for image diffusion models
}`;

  for (const model of VISION_FALLBACK_CHAIN) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${routerKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://astra-chronicles.local",
          "X-Title": "Astra Chronicles Visual DNA Extractor",
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extract the structured Visual DNA and ${protagonistRace} anatomical traits for ${protagonistName} (${protagonistRole}):`,
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
          max_tokens: 450,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed && parsed.hair && parsed.eyes) {
            const detectedTraits: string[] = Array.isArray(parsed.racialTraits) && parsed.racialTraits.length > 0
              ? parsed.racialTraits
              : (racialTraits && racialTraits.length > 0 ? racialTraits : []);

            const traitsStr = detectedTraits.length > 0 ? `${detectedTraits.join(", ")}, ` : "";
            const anchor =
              parsed.fullPromptAnchor ||
              `protagonist ${protagonistName}: ${parsed.gender || "athletic"} ${protagonistRace} ${protagonistRole}, ${traitsStr}${parsed.hair?.color || "silver"} ${parsed.hair?.style || "swept"} hair, ${parsed.eyes?.color || "amber"} eyes, ${parsed.complexion || "pale skin"}, wearing ${parsed.primaryAttire?.upper || "dark coat"}, ${parsed.signatureAccessories?.join(", ") || ""}`;

            const completeDna: CharacterVisualDNA = {
              gender: parsed.gender || "male",
              race: parsed.race || protagonistRace,
              racialTraits: detectedTraits,
              ageAppearance: parsed.ageAppearance || "early 20s",
              build: parsed.build || "athletic build",
              hair: {
                color: parsed.hair?.color || "silver",
                style: parsed.hair?.style || "swept",
                length: parsed.hair?.length || "medium",
              },
              eyes: {
                color: parsed.eyes?.color || "amber",
                shape: parsed.eyes?.shape,
              },
              complexion: parsed.complexion || "fair",
              facialFeatures: Array.isArray(parsed.facialFeatures) ? parsed.facialFeatures : [],
              primaryAttire: parsed.primaryAttire || {
                upper: `${protagonistRole} coat`,
                lower: "combat trousers",
                palette: ["black", "silver"],
              },
              signatureAccessories: Array.isArray(parsed.signatureAccessories) ? parsed.signatureAccessories : [],
              fullPromptAnchor: anchor,
            };

            avatarDnaCache.set(cacheKey, completeDna);
            console.log(`[VisualDNA] Extracted DNA for ${protagonistName} (${protagonistRace}) via ${model}: "${anchor.slice(0, 75)}..."`);
            return completeDna;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[VisualDNA] Model ${model} failed:`, err?.message || err);
    }
  }

  const fallback = buildFallbackVisualDna(protagonistName, protagonistRole, existingDescription, protagonistRace, racialTraits);
  avatarDnaCache.set(cacheKey, fallback);
  return fallback;
}

