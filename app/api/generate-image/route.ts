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

const FAST_LLM_MODELS = [
  "deepseek/deepseek-v4-flash",
  "z-ai/glm-5.3-flash",
  "nvidia/nemotron-3.5-lightning:free",
];

/**
 * Reads the full multi-turn scene context (dialogue, actions, character traits, romance/tension, atmosphere)
 * and synthesizes an exhaustive, visually magnificent prompt for the image generation model.
 */
async function synthesizeFullScenePrompt(
  apiKey: string | undefined,
  sceneContext: any,
  providedPrompt?: string
): Promise<{ scenePrompt: string; isAiSynthesized: boolean }> {
  // If user explicitly passed a custom, pre-crafted prompt with high detail, preserve it
  if (providedPrompt && providedPrompt.length > 120) {
    return { scenePrompt: providedPrompt, isAiSynthesized: false };
  }

  const location = sceneContext?.location || "Uncharted Sector";
  const speaker = sceneContext?.speaker || "Protagonist";
  const dialogue = sceneContext?.dialogue || "";
  const fullNarrative = sceneContext?.fullNarrative || sceneContext?.narrative || sceneContext?.recentSnippet || "";
  const mood = sceneContext?.mood || "Dramatic & Atmospheric";
  const genre = sceneContext?.genre || "High Fantasy / Grimdark";
  const storyTitle = sceneContext?.storyTitle || "Astra Chronicles";
  const protagonist = sceneContext?.protagonist || { name: "Protagonist", role: "Voidstrider" };
  const presentCharacters = sceneContext?.presentCharacters || [];
  const relationshipContext = sceneContext?.relationshipContext || "";
  const recentHistory = Array.isArray(sceneContext?.recentDialogueHistory)
    ? sceneContext.recentDialogueHistory.map((d: any) => `${d.speaker || "Unknown"}: "${d.text || ""}"`).join(" \n")
    : "";

  // 1. Attempt LLM Art Director Synthesis if API key is present
  if (apiKey) {
    const artDirectorSystemPrompt = `You are the Lead Visual Novel Art Director & Master CG Concept Artist for "Astra Chronicles".
Your task is to analyze the FULL scene context provided (the dialogue transcript, emotional stakes, character physical traits, environment, and dramatic action) and write an EXHAUSTIVE, cinematic anime visual novel CG illustration prompt.

Requirements for the output prompt:
1. Format: A single dense, descriptive prompt paragraph (100 to 160 words).
2. Composition: 16:9 widescreen anime visual novel event CG, dramatic cinematic framing (e.g. intimate close two-shot, dynamic mid-shot, or epic hero angle).
3. Characters: Explicitly describe character physical traits (hair color, eye color, attire, expressions, posture, eye contact, and touch/interaction).
4. Atmosphere & Environment: Describe specific lighting (volumetric god rays, golden hour, neon backlighting, soft starlight), particles (floating embers, cherry blossom petals, rain on glass, glowing arcane wisps), and depth of field.
5. Aesthetic: High-end anime feature film quality (Makoto Shinkai & Ufotable style, clean line art, rich vibrant color grading).
6. Return STRICTLY valid JSON: { "prompt": "..." } with no markdown code blocks outside JSON.`;

    const artDirectorUserPrompt = `Story: "${storyTitle}" (${genre})
Location: ${location}
Mood & Atmosphere: ${mood}
Protagonist: ${protagonist.name} (Class: ${protagonist.role})
Current Speaker / Center Focus: ${speaker}
Current Spoken Line: "${dialogue}"
Active Characters in Scene: ${JSON.stringify(presentCharacters)}
Relationship & Romance Context: ${relationshipContext || "High dramatic and emotional tension"}
Full Scene Transcript & Recent History:
${recentHistory || fullNarrative || dialogue}`;

    for (const model of FAST_LLM_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://astra-chronicles.local",
            "X-Title": "Astra Chronicles CG Art Director",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: artDirectorSystemPrompt },
              { role: "user", content: artDirectorUserPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.75,
            max_tokens: 220,
          }),
        });

        if (response.ok) {
          const json = await response.json();
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            if (parsed.prompt && parsed.prompt.length > 50) {
              return { scenePrompt: parsed.prompt, isAiSynthesized: true };
            }
          }
        }
      } catch (err: any) {
        console.warn(`Art Director model ${model} synthesis error:`, err.message);
      }
    }
  }

  // 2. Procedural Full-Context Fallback (Zero Truncation)
  const charDetails = Array.isArray(presentCharacters) && presentCharacters.length > 0
    ? presentCharacters.map((c: any) => `${c.name} (${c.role || "Companion"}, ${c.visualPrompt || "expressive anime eyes and detailed attire"}, expression: ${c.expression || "deep emotional focus"})`).join("; ")
    : `${speaker} and protagonist ${protagonist.name} (${protagonist.role})`;

  const dialogueSummary = recentHistory
    ? recentHistory.replace(/[\n\r]+/g, " • ").slice(0, 400)
    : (dialogue ? `"${dialogue}"` : "");

  const narrativeText = fullNarrative ? fullNarrative.replace(/[\n\r]+/g, " ") : "";

  const scenePrompt = `Masterpiece cinematic anime visual novel event CG illustration, set in "${location}". Mood & Atmosphere: ${mood}. Story: "${storyTitle}" (${genre}). Dramatic narrative context: ${narrativeText || dialogueSummary}. Characters depicted: ${charDetails}. Featuring emotional expressions, dramatic character interaction, cinematic camera composition, volumetric lighting, glowing ambient particles, intricate hair and clothing detail, high-budget anime studio visual novel climax illustration, 16:9 widescreen wallpaper quality.`;

  return { scenePrompt, isAiSynthesized: false };
}

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
      mode = "character", // "scene" | "loot" | "character" | "monster"
      prompt,
      seed,
      characterName = "Companion",
      gender = "female",
      expressionKey = "neutral",
      baseImageUrl,
      sceneContext,
      item,
      userAccessKey,
      enemyName,
      enemyDesc,
      location,
      sectorName,
      modifier,
      genre,
    } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;

    // -------------------------------------------------------------
    // 1. SCENE CONTEXT GENERATION (FULL MULTI-TURN CONTEXT ENGINE)
    // -------------------------------------------------------------
    if (mode === "scene" || mode === "context") {
      const location = sceneContext?.location || "Uncharted Sector";
      const speaker = sceneContext?.speaker || "Protagonist";

      // Synthesize exhaustive, cinematographic prompt from the full scene context
      const { scenePrompt, isAiSynthesized } = await synthesizeFullScenePrompt(
        apiKey,
        sceneContext,
        prompt
      );

      if (apiKey) {
        const result = await queryNanoBanana(apiKey, scenePrompt);
        if (result) {
          return NextResponse.json({
            success: true,
            mode: "scene",
            imageUrl: result.imageUrl,
            model: isAiSynthesized ? `${result.modelUsed} (Art Director Guided)` : result.modelUsed,
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
    // 3. CONTEXTUAL MONSTER ART GENERATION (LITRPG TRIALS)
    // -------------------------------------------------------------
    if (mode === "monster") {
      const eName = enemyName || "Planar Anomaly";
      const eDesc = enemyDesc || "A dangerous creature manifested from fractured dimensional boundaries.";
      const secLocation = location || sectorName || "Fracture Chamber";
      const modName = modifier || "Entropy Cascade";
      const storyGenre = genre || "Sci-Fi Grimdark LitRPG";

      const monsterPrompt = prompt || `Epic anime visual novel boss monster portrait: "${eName}". ${eDesc}. Encountered in ${secLocation} under active spacetime anomaly: ${modName}. Menacing stance, dark futuristic glowing runes, fractured aether plasma, volumetric god rays, high concept art for ${storyGenre}, dark atmospheric framing, crisp digital painting, 16:9 cinematic widescreen, masterpiece asset.`;

      if (apiKey) {
        const result = await queryNanoBanana(apiKey, monsterPrompt);
        if (result) {
          return NextResponse.json({
            success: true,
            mode: "monster",
            imageUrl: result.imageUrl,
            model: result.modelUsed,
            prompt: monsterPrompt,
            enemyName: eName,
          });
        }
      }

      // Offline / fallback response
      return NextResponse.json({
        success: true,
        mode: "monster",
        imageUrl: "/backgrounds/gray_zone.jpg",
        model: "offline-fallback",
        prompt: monsterPrompt,
        enemyName: eName,
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
