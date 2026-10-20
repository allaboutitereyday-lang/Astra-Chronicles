import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";
import { StoryContext } from "@/types/story";

export const runtime = "nodejs";

const GENERATE_MODELS = [
  "meta-llama/llama-3.2-11b-vision-instruct:free",
  "deepseek/deepseek-v4.1-flash-1017",
  "dots-studio/dots-3-note-preview:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3.5-lightning:free",
];

export async function POST(req: Request) {
  try {
    const headerKey = req.headers.get("x-user-key");
    const body = await req.json();

    const {
      prompt,
      genre = "High Fantasy / Grimdark",
      mode = "full", // "full" | "world" | "companions"
      userAccessKey,
    } = body;

    const accessKey = headerKey || userAccessKey;
    const authCheck = validateUserKey(accessKey);
    if (!authCheck.valid) {
      return NextResponse.json(
        {
          error: authCheck.error || "Access denied. Valid access key required.",
          userStats: authCheck.user,
        },
        { status: authCheck.user?.remainingTurns === 0 ? 403 : 401 }
      );
    }
    const activeUser = authCheck.user!;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured in server environment." },
        { status: 500 }
      );
    }

    const systemPrompt = `You are the Multiverse Architect and Lead Narrative Director for an interactive visual novel and LitRPG system platform.
Your objective is to ingest the user's conceptual prompt and genre preferences, and synthesize a complete, richly detailed, and structurally valid StoryContext JSON document.

--- OUTPUT FORMAT REQUIREMENTS ---
You MUST respond strictly with valid JSON conforming to the schema below. Do not output markdown commentary or conversational preamble outside of the JSON object.
Use response_format: { type: "json_object" }.

JSON Schema:
{
  "id": string, // lowercase alphanumeric slug with hyphens, e.g. "echoes-of-the-abyss"
  "title": string, // evocative, memorable title
  "tagline": string, // punchy 1-sentence synopsis detailing stakes and intrigue
  "description": string, // 1-2 paragraphs giving deep setting background and narrative premise
  "coverImage": string, // valid web image URL or path, e.g. "/backgrounds/imperial_capital_imperium.jpg" or Unsplash URL
  "genre": string, // e.g. "${genre}" or tailored subgenres
  "themes": string[], // 3-4 thematic motifs, e.g. ["Corporate Espionage", "Forbidden Magic", "Transhumanism"]
  "narrationStyle": string, // e.g. "Grimdark & Atmospheric", "Tech-Noir & Visceral", "Sensory-Rich Cinematic"
  "worldContext": {
    "settingName": string, // name of continent, city, or space station
    "eraOrPeriod": string, // e.g. "Age of Planar Alignment" or "The Silicon Ascendancy (2099)"
    "loreSummary": string, // 2-3 immersive paragraphs explaining factions, power structures, magic/tech systems
    "factions": [
      {
        "name": string,
        "description": string
      }
    ],
    "locations": [
      {
        "name": string,
        "zone": string,
        "danger": string, // e.g. "Low (Guarded)", "High (Hostile Operatives)", "Deadly (Aether Anomalies)"
        "description": string, // 1-2 sensory-rich sentences detailing ambiance, sounds, and sights
        "bgImage": string // image URL or backdrop path
      }
    ]
  },
  "rpgRules": {
    "systemName": string, // e.g. "LitRPG System Administrator", "Neural Sync Core", "Aether Matrix"
    "currencyName": string, // e.g. "Gold", "Credits", "Soul Shards"
    "causalAnchorName": string, // e.g. "Causal Plausibility", "Sanity Anchor", "Neural Coherence"
    "defaultPlausibility": number, // typically 80 or 85
    "statDefinitions": {
      "str": string, // e.g. "Strength / Kinetic Force"
      "dex": string, // e.g. "Reflexes / Finesse"
      "int": string // e.g. "Intelligence / Arcana Processing"
    },
    "startingLevel": 1,
    "baseStats": {
      "hp": number, // 100 - 120
      "maxHp": number,
      "mp": number, // 50 - 80
      "maxMp": number,
      "exp": 0,
      "maxExp": 100,
      "str": number, // 10
      "dex": number, // 10
      "int": number // 10
    }
  },
  "startingNodes": [
    {
      "id": string,
      "title": string,
      "speaker": string, // must match one of the companions
      "location": string, // must match one of the worldContext locations
      "sceneSetup": string, // 1-2 visceral, atmospheric paragraphs setting the scene (*italics* for physical actions)
      "dialogue": string, // the companion's authentic spoken line confronting the protagonist
      "expressionKey": "neutral" | "intrigued" | "flustered" | "smug" | "surprised" | "combat_ready" | "dangerous" | "hurt",
      "initialAffection": number, // 10 - 20
      "choices": [string, string, string, string] // 4 tailored dialogue/action options with intent tags, e.g. "[Arcana]", "[Composure]", "[Subterfuge]", "[Force]"
    }
  ],
  "companions": [
    {
      "id": string,
      "name": string,
      "title": string,
      "role": string,
      "gender": "female" | "male" | "non-binary",
      "color": "rose" | "sky" | "amber" | "purple" | "emerald" | "zinc",
      "personality": string,
      "values": string[],
      "dislikes": string[],
      "highCompatibility": string[],
      "baseAffection": number,
      "affection": number,
      "expressionKey": "neutral",
      "isPresent": boolean,
      "encountered": boolean,
      "seed": number, // locked numeric seed between 1000000 and 9999999 for ControlNet / IPAdapter consistency
      "baseImageUrl": string, // URL to portrait
      "visualPrompt": string, // high-detail anime prompt detailing facial traits, eyes, hair, attire for IPAdapter
      "expressions": {
        "neutral": string,
        "smug": string,
        "combat_ready": string,
        "flustered": string
      }
    }
  ]
}

Ensure all generated companions have unique seeds (7-digit integers), distinct high compatibility criteria, and voice profiles. Create at least 2 locations and 2 companion profiles.`;

    const userPrompt = `Genre: ${genre}
Creation Mode: ${mode}
User Concept & Preferences:
"${prompt || `Generate a compelling ${genre} visual novel world.`}"

Generate the complete StoryContext JSON now.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    let generatedStory: StoryContext | null = null;
    let lastError = null;

    for (const model of GENERATE_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://astra-chronicles.local",
            "X-Title": "Astra Chronicles Multi-Story Generator",
          },
          body: JSON.stringify({
            model,
            messages,
            user: activeUser.key,
            temperature: 0.8,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Story gen model ${model} failed (${response.status}): ${errText}`);
          lastError = new Error(`Model ${model} returned HTTP ${response.status}`);
          continue;
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        content = content.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim();

        const parsed = JSON.parse(content);
        const userStats = recordUserTurn(activeUser.key, data.usage, model);

        // Sanitize and ensure fallback fields
        const story: StoryContext = {
          id: (parsed.id || `story-${Date.now()}`).toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
          title: parsed.title || "Untitled Odyssey",
          tagline: parsed.tagline || "A bespoke interactive chronicle.",
          description: parsed.description || parsed.worldContext?.loreSummary || "An uncharted realm awaiting your arrival.",
          coverImage: parsed.coverImage || "/backgrounds/imperial_capital_imperium.jpg",
          genre: parsed.genre || genre,
          themes: Array.isArray(parsed.themes) ? parsed.themes : [genre],
          narrationStyle: parsed.narrationStyle || "Grimdark & Atmospheric",
          createdAt: new Date().toISOString(),
          author: "OpenRouter LLM",
          isPreset: false,
          worldContext: {
            settingName: parsed.worldContext?.settingName || "Unknown World",
            eraOrPeriod: parsed.worldContext?.eraOrPeriod || "Age of Awakening",
            loreSummary: parsed.worldContext?.loreSummary || "A world balanced on the knife-edge of transformation.",
            factions: Array.isArray(parsed.worldContext?.factions) ? parsed.worldContext.factions : [],
            locations: Array.isArray(parsed.worldContext?.locations) && parsed.worldContext.locations.length > 0
              ? parsed.worldContext.locations.map((loc: any) => ({
                  name: loc.name || "Sanctuary",
                  zone: loc.zone || "Borderland",
                  danger: loc.danger || "Moderate",
                  description: loc.description || "An evocative sector with distinct sensory characteristics.",
                  bgImage: loc.bgImage || "/backgrounds/imperial_capital_imperium.jpg",
                }))
              : [
                  {
                    name: "Central Sanctuary",
                    zone: "Heartland",
                    danger: "Low",
                    description: "A fortified meeting place overlooking the frontier.",
                    bgImage: "/backgrounds/imperial_capital_imperium.jpg",
                  },
                ],
          },
          rpgRules: {
            systemName: parsed.rpgRules?.systemName || "LitRPG System Administrator",
            currencyName: parsed.rpgRules?.currencyName || "Gold",
            causalAnchorName: parsed.rpgRules?.causalAnchorName || "Causal Plausibility",
            defaultPlausibility: parsed.rpgRules?.defaultPlausibility || 80,
            statDefinitions: parsed.rpgRules?.statDefinitions || {
              str: "Strength (Physical Might)",
              dex: "Dexterity (Reflexes & Agility)",
              int: "Intelligence (Arcana & Processing)",
            },
            startingLevel: 1,
            baseStats: parsed.rpgRules?.baseStats || {
              hp: 100,
              maxHp: 100,
              mp: 60,
              maxMp: 60,
              exp: 0,
              maxExp: 100,
              str: 10,
              dex: 10,
              int: 10,
            },
          },
          startingNodes: Array.isArray(parsed.startingNodes) && parsed.startingNodes.length > 0
            ? parsed.startingNodes
            : [],
          companions: Array.isArray(parsed.companions) && parsed.companions.length > 0
            ? parsed.companions.map((comp: any, idx: number) => ({
                id: comp.id || `comp_${idx + 1}`,
                name: comp.name || `Companion ${idx + 1}`,
                title: comp.title || "Allied Heroine",
                role: comp.role || "Operative",
                gender: comp.gender || "female",
                color: comp.color || "rose",
                personality: comp.personality || "Guarded, observant, evaluating your resolve.",
                values: Array.isArray(comp.values) ? comp.values : ["Survival", "Loyalty"],
                dislikes: Array.isArray(comp.dislikes) ? comp.dislikes : ["Treachery"],
                highCompatibility: Array.isArray(comp.highCompatibility) ? comp.highCompatibility : ["Wanderers"],
                baseAffection: typeof comp.baseAffection === "number" ? comp.baseAffection : 15,
                affection: typeof comp.baseAffection === "number" ? comp.baseAffection : 15,
                expressionKey: "neutral",
                isPresent: idx === 0,
                encountered: idx === 0,
                seed: typeof comp.seed === "number" ? comp.seed : Math.floor(1000000 + Math.random() * 9000000),
                baseImageUrl: comp.baseImageUrl || "/characters/aria/aria_neutral.png",
                visualPrompt: comp.visualPrompt || "masterpiece anime portrait, captivating eyes, high fantasy attire",
                expressions: comp.expressions || {
                  neutral: comp.baseImageUrl || "/characters/aria/aria_neutral.png",
                  smug: "/characters/evelyn/evelyn_smug.png",
                  combat_ready: "/characters/serena/serena_combat.png",
                },
              }))
            : [],
        };

        // If no startingNodes were produced, construct default nodes from companions
        if (story.startingNodes.length === 0 && story.companions.length > 0) {
          story.startingNodes = story.companions.map((c, i) => {
            const loc = story.worldContext.locations[i % story.worldContext.locations.length];
            return {
              id: `prologue_${c.id}`,
              title: `${c.name}: Encounter at ${loc.name}`,
              speaker: c.name,
              location: loc.name,
              sceneSetup: `Shadows lengthen across ${loc.name}. As you cross the perimeter, ${c.name} (${c.title}) emerges into view, gaze fixed upon your gear.`,
              dialogue: `You walk uninvited into ${loc.name}. Identify your affiliation before blades are drawn.`,
              expressionKey: "neutral",
              initialAffection: c.baseAffection,
              choices: [
                "[Composure] Meet their gaze calmly and state that you seek alliance, not conflict.",
                "[Tactics] Note the defensive posture of their stance and point out a tactical blind spot.",
                "[Subterfuge] Present a covert guild sign indicating you are on contract.",
                "[Force] Keep your hand near your weapon and claim right of passage.",
              ],
            };
          });
        }

        generatedStory = story;
        (generatedStory as any)._userStats = userStats;
        break;
      } catch (err: any) {
        console.warn(`Error generating story with model ${model}:`, err.message);
        lastError = err;
      }
    }

    if (!generatedStory) {
      return NextResponse.json(
        { error: lastError?.message || "Failed to generate structured story payload across all fallback models." },
        { status: 502 }
      );
    }

    return NextResponse.json({ story: generatedStory });
  } catch (err: any) {
    console.error("Story generation route exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

