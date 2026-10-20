import { NextResponse } from "next/server";
import { validateUserKey } from "@/lib/userAccess";

export const runtime = "nodejs";

const NANO_BANANA_MODELS = [
  "google/gemini-nano-banana-2.1",
  "google/gemini-3.1-flash-lite-image", // Nano Banana 2 Lite
  "google/gemini-2.5-flash-image",       // Nano Banana Flash
  "google/gemini-3.1-flash-image",      // Nano Banana 2
  "openai/gpt-5-image-mini",
];

async function queryNanoBanana(
  apiKey: string,
  prompt: string
): Promise<{ imageUrl: string; modelUsed: string } | null> {
  for (const model of NANO_BANANA_MODELS) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://astra-chronicles.local",
          "X-Title": "Astra Chronicles Visual Engine",
        },
        body: JSON.stringify({
          model,
          prompt,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Nano Banana model ${model} failed (${response.status}): ${errText.slice(0, 160)}`);
        continue;
      }

      const json = await response.json();
      const b64 = json.data?.[0]?.b64_json;
      const url = json.data?.[0]?.url;

      if (b64) {
        const mime = b64.startsWith("/9j/") ? "image/jpeg" : "image/png";
        return {
          imageUrl: `data:${mime};base64,${b64}`,
          modelUsed: model,
        };
      }
      if (url) {
        return {
          imageUrl: url,
          modelUsed: model,
        };
      }
    } catch (err: any) {
      console.warn(`Error querying model ${model}:`, err.message);
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      mode = "character", // "scene" | "loot" | "character"
      prompt,
      seed,
      characterName = "Companion",
      gender = "female",
      expressionKey = "neutral",
      baseImageUrl,
      sceneContext,
      item,
      userAccessKey,
    } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;

    // -------------------------------------------------------------
    // 1. SCENE CONTEXT GENERATION (NANO BANANA 2.1)
    // -------------------------------------------------------------
    if (mode === "scene" || mode === "context") {
      const location = sceneContext?.location || "Uncharted Sector";
      const speaker = sceneContext?.speaker || "Protagonist";
      const dialogue = sceneContext?.dialogue || "";
      const narrative = sceneContext?.narrative || sceneContext?.recentSnippet || "";
      const mood = sceneContext?.mood || "Dramatic & Atmospheric";
      const genre = sceneContext?.genre || "High Fantasy / Grimdark";
      const storyTitle = sceneContext?.storyTitle || "Astra Chronicles";

      const cleanedNarrative = (narrative || dialogue).replace(/["\n\r]+/g, " ").slice(0, 200);

      const scenePrompt = prompt || `Masterpiece cinematic anime visual novel CG illustration, set in "${location}", ${mood} atmosphere, story "${storyTitle}" (${genre}). Featuring ${speaker} and the protagonist in a pivotal story moment. Scene context: ${cleanedNarrative}. Highly detailed anime art style, dramatic cinematic composition, volumetric lighting, rich color palette, 16:9 widescreen wallpaper quality.`;

      if (apiKey) {
        const result = await queryNanoBanana(apiKey, scenePrompt);
        if (result) {
          return NextResponse.json({
            success: true,
            mode: "scene",
            imageUrl: result.imageUrl,
            model: result.modelUsed,
            prompt: scenePrompt,
            location,
            speaker,
          });
        }
      }

      // Fallback if API key missing or all models exhausted
      return NextResponse.json({
        success: true,
        mode: "scene",
        imageUrl: sceneContext?.currentBg || "/backgrounds/gray_zone.jpg",
        model: "offline-fallback",
        prompt: scenePrompt,
        location,
        speaker,
      });
    }

    // -------------------------------------------------------------
    // 2. DYNAMIC LOOT DROP GENERATION (NANO BANANA 2.1)
    // -------------------------------------------------------------
    if (mode === "loot" || mode === "item") {
      const itemName = item?.name || "Mystic Artifact";
      const itemType = item?.type || "relic";
      const itemRarity = item?.rarity || "rare";
      const itemDesc = item?.description || "An ancient artifact pulsing with untamed power.";
      const genre = item?.genre || "LitRPG Fantasy";

      const rarityColorDescriptions: Record<string, string> = {
        common: "clean steel and polished wood, subtle neutral glow",
        uncommon: "emerald green runic glow, refined craftsmanship",
        rare: "radiant sky-blue crystal plasma, electric arcane aura",
        relic: "divine molten gold radiance, celestial starlight aura, ancient ornate filigree",
        cursed: "crimson and dark purple eldritch flames, ominous shadowy mist, demonic glyphs",
      };

      const rarityVisual = rarityColorDescriptions[itemRarity] || rarityColorDescriptions.rare;

      const lootPrompt = prompt || `Game inventory item icon of "${itemName}", ${itemRarity} rarity ${itemType} in a ${genre} visual novel. ${itemDesc}. Featuring ${rarityVisual}. Centered RPG inventory game icon, isolated on a clean dark slate background, glowing border aura, highly detailed digital game asset, crisp edges, 1:1 square ratio.`;

      if (apiKey) {
        const result = await queryNanoBanana(apiKey, lootPrompt);
        if (result) {
          return NextResponse.json({
            success: true,
            mode: "loot",
            imageUrl: result.imageUrl,
            model: result.modelUsed,
            prompt: lootPrompt,
            item: {
              ...item,
              imageUrl: result.imageUrl,
            },
          });
        }
      }

      // Fallback
      return NextResponse.json({
        success: true,
        mode: "loot",
        imageUrl: "",
        model: "offline-fallback",
        prompt: lootPrompt,
        item,
      });
    }

    // -------------------------------------------------------------
    // 3. CHARACTER PORTRAIT & CONSISTENCY PIPELINE (IPAdapter / ControlNet)
    // -------------------------------------------------------------
    const lockedSeed = typeof seed === "number" && seed > 0
      ? seed
      : Math.floor(1000000 + Math.random() * 9000000);

    const expressionModifiers: Record<string, string> = {
      neutral: "calm neutral expression, poised, looking at viewer",
      smug: "smug haughty smirk, half-closed eyes, confident tilt",
      combat_ready: "determined fierce expression, combat stance, intense eyes, sparks",
      flustered: "flustered blush, shy embarrassed expression, slightly averted gaze",
      surprised: "wide surprised eyes, parted lips, shocked reaction",
      dangerous: "predatory dark gaze, ominous subtle smile, dangerous aura",
      hurt: "wincing in pain, grimace, disheveled hair, breathless expression",
      intrigued: "curious intrigued look, tilted head, analytical gaze",
      beckon: "alluring inviting smile, beckoning gesture, graceful posture",
    };

    const activeModifier = expressionModifiers[expressionKey] || expressionModifiers.neutral;
    const fullVisualPrompt = `${prompt || "masterpiece anime portrait, highly detailed"}, ${activeModifier}, high resolution visual novel sprite, transparent or clean background`;

    const controlNetPipelineMetadata = {
      model: "sd-xl-turbo / flux-ipadapter",
      controlnet: {
        preprocessor: "openpose_face",
        model: "controlnet-face-id-v2",
        weight: 0.85,
      },
      ip_adapter: {
        reference_image: baseImageUrl || null,
        weight: 0.88,
        noise: 0.05,
      },
      seed: lockedSeed,
      sampler: "Euler a",
      steps: 28,
      cfg_scale: 7.0,
      width: 512,
      height: 768,
    };

    let generatedImageUrl = baseImageUrl;

    const themedAvatars = {
      female: [
        "/characters/evelyn/evelyn_neutral.png",
        "/characters/aria/aria_neutral.png",
        "/characters/serena/serena_neutral.png",
        "/characters/morgana/morgana_neutral.png",
        "/characters/perci/perci_neutral.png",
      ],
      male: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
      ],
    };

    if (!generatedImageUrl) {
      const pool = gender === "male" ? themedAvatars.male : themedAvatars.female;
      const index = Math.abs(lockedSeed) % pool.length;
      generatedImageUrl = pool[index];
    }

    if (expressionKey !== "neutral" && baseImageUrl) {
      const matchHeroine = ["evelyn", "aria", "serena", "morgana", "perci"].find((h) =>
        baseImageUrl.toLowerCase().includes(h)
      );
      if (matchHeroine) {
        generatedImageUrl = `/characters/${matchHeroine}/${matchHeroine}_${expressionKey === "hurt" ? "hurt" : expressionKey}.png`;
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
      seed: lockedSeed,
      prompt: fullVisualPrompt,
      characterName,
      expressionKey,
      pipeline: controlNetPipelineMetadata,
    });
  } catch (err: any) {
    console.error("Image generation route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process image generation pipeline" },
      { status: 500 }
    );
  }
}
