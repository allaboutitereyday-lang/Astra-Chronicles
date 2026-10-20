import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";
import { StoryContext } from "@/types/story";

export const runtime = "nodejs";

const GENERATE_MODELS = [
  "deepseek/deepseek-v4-flash",
  "z-ai/glm-5.3-flash",
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

    const systemPrompt = `You are the Multiverse Architect and Lead Narrative Director for an interactive visual novel and LitRPG platform with deep relationship mechanics.
Your objective is to ingest the user's conceptual prompt and genre preferences, and synthesize a complete, richly detailed, and structurally valid StoryContext JSON document.

--- CORE ROMANCE & RELATIONSHIP DIRECTIVE (MANDATORY) ---
Romance is a core, mechanically tracked genre in this engine. Even in dark, grim, or LitRPG settings, interpersonal chemistry, vulnerability, and romantic progression must drive player agency:
1. Romantic Tension & Vulnerability: Build palpable emotional stakes into companion personalities, dialogue, and backstories. Characters are not quest-dispensers; they are passionate individuals with private vulnerabilities, distinct love languages, and ideological boundaries.
2. Affection-Based Branching: The starting nodes and flowchart branches must feature dialogue options with romantic, flirtatious, or emotionally challenging vectors.
3. Distinct Progression Arcs: Each companion must have a unique romantic trajectory (e.g., Proud Aristocrat captivated by audacity, Guarded Infiltrator seeking authentic trust, Lethal Protector discovering tenderness, or Predatory Noble intrigued by mortal resolve).

--- OUTPUT FORMAT REQUIREMENTS ---
You MUST respond strictly with valid JSON conforming to the schema below. Do not output markdown commentary or conversational preamble outside of the JSON object.
Use response_format: { type: "json_object" }.

JSON Schema:
{
  "id": string, // lowercase alphanumeric slug with hyphens, e.g. "echoes-of-the-abyss"
  "title": string, // evocative, memorable title
  "tagline": string, // punchy 1-sentence synopsis detailing stakes, romance, and intrigue
  "description": string, // 1-2 paragraphs giving deep setting background and narrative premise
  "coverImage": string, // valid web image URL or path, e.g. "/backgrounds/imperial_capital_imperium.jpg" or Unsplash URL
  "genre": string, // e.g. "${genre} / Romance"
  "themes": string[], // 3-4 thematic motifs, e.g. ["Romantic Intrigue", "Planar Cataclysm", "Forbidden Bonds"]
  "narrationStyle": string, // e.g. "Grimdark & Atmospheric", "Sensory-Rich Cinematic", "Intimate High Tension"
  "romancePath": "harem" | "mono" | "uncommitted", // overarching campaign romance mode
  "worldContext": {
    "settingName": string, // name of continent, city, or realm
    "eraOrPeriod": string, // e.g. "Age of Planar Alignment"
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
        "danger": string, // e.g. "Low (Guarded)", "High (Hostile Operatives)", "Deadly"
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
      "str": string,
      "dex": string,
      "int": string
    },
    "startingLevel": 1,
    "baseStats": {
      "hp": number,
      "maxHp": number,
      "mp": number,
      "maxMp": number,
      "exp": 0,
      "maxExp": 100,
      "str": number,
      "dex": number,
      "int": number
    }
  },
  "relicInventory": [
    {
      "id": string,
      "name": string,
      "setName": string, // e.g. "Voidstrider", "Solarion", "Covenant"
      "type": "weapon" | "armor" | "relic",
      "rarity": "rare" | "relic",
      "description": string,
      "effect": string
    }
  ],
  "activeSynergies": [
    {
      "id": string,
      "setName": string,
      "pieceCount": 1,
      "requiredCount": 2,
      "isActive": false,
      "bonusName": string,
      "bonusDescription": string,
      "unlockedExclusiveChoicePrefix": string // e.g. "[Voidstrider Resonance]"
    }
  ],
  "visitedNodes": [
    {
      "id": string,
      "nodeKey": "prologue_root",
      "title": string,
      "speaker": string,
      "location": string,
      "visitedAt": string,
      "isAnchor": true,
      "anchorLabel": "Campaign Prelude"
    }
  ],
  "flowchartTree": [
    // CRITICAL MULTI-STARTING-POINT MANDATE:
    // For EVERY opening scenario defined in "startingNodes", you MUST generate a corresponding starting root node in flowchartTree
    // (with id: "node_" + startingNode.id, nodeKey: startingNode.id, isStartingPoint: true).
    // Each starting scenario root node must have its own distinct outgoing connections radiating into affinity and romance branches.
    {
      "id": "node_prologue_heroine_1",
      "nodeKey": "prologue_heroine_1",
      "title": string, // matches starting scenario title
      "speaker": string,
      "location": string,
      "summary": "Initial encounter establishing the primary dynamic.",
      "isStartingPoint": true,
      "connectedTo": ["node_branch_heroine_1_affinity", "node_branch_tactical_skirmish"]
    },
    {
      "id": "node_prologue_heroine_2",
      "nodeKey": "prologue_heroine_2",
      "title": string, // matches secondary starting scenario title
      "speaker": string,
      "location": string,
      "summary": "Alternative opening scenario establishing rival or confidant dynamic.",
      "isStartingPoint": true,
      "connectedTo": ["node_branch_heroine_2_affinity", "node_branch_tactical_skirmish"]
    },
    {
      "id": "node_branch_heroine_1_affinity",
      "nodeKey": "branch_heroine_1_affinity",
      "title": "Intimate Interlude",
      "speaker": string,
      "location": string,
      "summary": "Private conversation challenging emotional boundaries.",
      "unlockRequirement": {
        "companionName": string,
        "minAffection": 25,
        "hintSilhouette": "Locked: Requires 25% Companion Favor"
      },
      "connectedTo": ["node_climax_heroine_1"]
    },
    {
      "id": "node_branch_tactical_skirmish",
      "nodeKey": "branch_tactical_skirmish",
      "title": "Causal Trial",
      "speaker": string,
      "location": string,
      "summary": "Coordinated skirmish testing combat synergy.",
      "unlockRequirement": {
        "requiredRelicSet": string,
        "hintSilhouette": "Locked: Requires Relic Synergy Set"
      },
      "connectedTo": []
    },
    {
      "id": "node_climax_heroine_1",
      "nodeKey": "climax_heroine_1",
      "title": "Vow of Eternal Devotion",
      "speaker": string,
      "location": string,
      "summary": "High-stakes emotional confession and bespoke romantic culmination.",
      "unlockRequirement": {
        "companionName": string,
        "minAffection": 75,
        "hintSilhouette": "Locked: Requires 75% Companion Favor"
      },
      "connectedTo": []
    }
  ],
  "startingNodes": [
    {
      "id": string,
      "title": string,
      "speaker": string, // must match one of the companions
      "location": string, // must match one of the worldContext locations
      "sceneSetup": string, // 1-2 visceral paragraphs (*italics* for physical gestures, tension)
      "dialogue": string, // spoken line confronting the protagonist with romantic undertones
      "expressionKey": "neutral" | "intrigued" | "flustered" | "smug" | "surprised" | "combat_ready" | "dangerous" | "hurt",
      "initialAffection": number, // 15 - 25
      "choices": [string, string, string, string] // 4 tailored options tagged with intent, e.g. "[Intimacy]", "[Pragmatism]", "[Tactics]", "[Provocation]"
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
      "affectionLevel": number, // 15-25 starting level
      "romancePath": "harem" | "mono" | "uncommitted",
      "expressionKey": "neutral",
      "isPresent": boolean,
      "encountered": boolean,
      "seed": number, // locked numeric seed between 1000000 and 9999999
      "baseImageUrl": string,
      "visualPrompt": string,
      "expressions": {
        "neutral": string,
        "smug": string,
        "combat_ready": string,
        "flustered": string
      }
    }
  ]
}

Ensure all generated companions have unique seeds (7-digit integers), distinct compatibility criteria, romantic progression arcs, and voice profiles. Create at least 2 locations, 2 companion profiles, and a well-connected flowchart tree.`;

    const userPrompt = `Genre: ${genre}
Creation Mode: ${mode}
User Concept & Preferences:
"${prompt || `Generate a compelling ${genre} visual novel world with rich romance paths and relic set synergies.`}"

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
          tagline: parsed.tagline || "A bespoke interactive chronicle of romance and ambition.",
          description: parsed.description || parsed.worldContext?.loreSummary || "An uncharted realm awaiting your arrival.",
          coverImage: parsed.coverImage || "/backgrounds/imperial_capital_imperium.jpg",
          genre: parsed.genre || `${genre} / Romance`,
          themes: Array.isArray(parsed.themes) ? parsed.themes : [genre, "Romance"],
          narrationStyle: parsed.narrationStyle || "Grimdark & Atmospheric",
          romancePath: parsed.romancePath || "harem",
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
          relicInventory: Array.isArray(parsed.relicInventory) ? parsed.relicInventory : [],
          activeSynergies: Array.isArray(parsed.activeSynergies) ? parsed.activeSynergies : [],
          visitedNodes: Array.isArray(parsed.visitedNodes) ? parsed.visitedNodes : [],
          flowchartTree: Array.isArray(parsed.flowchartTree) ? parsed.flowchartTree : [],
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
                affectionLevel: typeof comp.affectionLevel === "number" ? comp.affectionLevel : (typeof comp.baseAffection === "number" ? comp.baseAffection : 15),
                romancePath: comp.romancePath || parsed.romancePath || "harem",
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
              sceneSetup: `Shadows lengthen across ${loc.name}. As you cross the perimeter, ${c.name} (${c.title}) emerges into view, gaze fixed upon you with subtle, guarded curiosity.`,
              dialogue: `You walk uninvited into ${loc.name}. State your intentions before blades or covenants are drawn.`,
              expressionKey: "neutral",
              initialAffection: c.baseAffection,
              choices: [
                "[Intimacy] Meet her gaze unflinchingly with a warm, disarming smile.",
                "[Tactics] Note the defensive posture of her stance and propose a mutual truce.",
                "[Subterfuge] Present a covert sign indicating shared interests.",
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
