import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Astra Chronicles VN",
  },
});

const ASTRA_CHRONICLES_LORE = `
[WORLD SETTING: ASTRA CONTINENT]
- Setting: The Astra Continent, where ancient leyline rifts bleed raw aether across distinct geographical realms.
- Core Territories & Factions:
  * Baltia Empire: The dominant civilized power centered at the Imperial Capital Imperium, anchored by a colossal Mage Tower that overlooks fertile valleys and riverways.
  * Bloodrose Duchy: Western aristocratic territory of sprawling estates, high noble lineage politics, and vast fields covered in deep crimson flora.
  * Silvanes: An ancient, primeval canopy forest standing between the Empire and the northern mountain strongholds.
  * Gray Zone: A cracked, desiccated badlands serving as the barren frontier buffer right before the volcanic Demon Realm to the east.
  * Port City Fortus: Bustling southern stone dock city where maritime commerce meets underworld aether contraband.
  * House Abbandonato: An ancient, influential high-noble bloodline known for courtly dominance, dark aether alchemy, and planar cartography.
  * The Veil Seekers: Covert underworld operatives trading illicit artifacts, decoded astral ciphers, and forbidden grimoires.
  * The Ashen Inquisition: Zealous redoubts hunting unlicensed aether wielders with sanctified whitefire.

[COMPANIONS]
1. Evelyn Abbandonato: High Arcanist & Heiress of House Abbandonato. Smug, haughty, condescending, but sharply defensive when her composure cracks. Conceals a rapier within her dress.
2. Aria Shadowthorn: Rogue Arcanist & Veil Seeker infiltrator. Cautious, pragmatic, armed with shadow daggers, quick to read body language and set traps.
3. Serena: A dutiful, fiercely loyal demi-human combat maid (white bob hair, ram horns, sheep ears). She maintains perfect etiquette, curtsying and apologizing for messes even while effortlessly swinging a massive, brutally heavy iron spiked mace to obliterate threats.
4. Morgana: A noblewoman from the Demon Realm beyond the Gray Zone. Features dark ram horns, folded leathery wings, and an off-the-shoulder gothic gown. Enigmatic, melancholic, alluring, and dangerously composed.
5. Perci: A timid, pure-hearted demi-human kitsune rogue/sword user. Long blonde hair with hime bangs, soft golden fox ears, a fluffy tail, sarashi chest wraps, and a loose vermilion-red robe. Highly skilled with her concealed blade, but speaks with a soft, cautious, hesitant tone and flusters easily.
`;

function extractCleanJson(rawText: string): any {
  let cleaned = rawText.trim();

  // Strip internal reasoning or thinking tags if output by thinking models
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Strip markdown code fences
  if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim();
  }

  // Find root JSON boundaries
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object boundaries found in response.");
  }

  cleaned = cleaned.substring(start, end + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    // Sanitize unescaped newlines inside strings
    const sanitized = cleaned.replace(/(?<!\\)\r?\n/g, "\\n");
    return JSON.parse(sanitized);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured in .env.local." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      action,
      gameState,
      playerProfile,
      playerAvatarBase64,
      narrationStyle,
      plotMemories,
      partyMembers,
      recentHistory,
    } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const currentSpeaker = gameState?.speaker || "Evelyn Abbandonato";

    const systemPrompt = `
You are the narrative backend and game engine for "Astra Chronicles", an interactive visual novel. You must function as an automated API endpoint that returns raw JSON data only.

${ASTRA_CHRONICLES_LORE}

[CRITICAL INSTRUCTION: ZERO META-ANALYSIS]
- NEVER output an analysis plan, numbered reasoning steps, word count estimates, or drafting notes (e.g. "1. Analyze the Request", "Drafting text...").
- If the player's action starts with "[OOC:", treat it as a live plot event (e.g., introducing a character or shifting scene focus). Integrate it immediately into the story prose without explaining how you will do it.
- Your output must start immediately with the '{' character and end with '}'.

[PARTY & MULTI-COMPANION SYSTEM]
- Current Party Roster: ${JSON.stringify(partyMembers || [])}
- Active speaker: "${currentSpeaker}"
- Companions currently in the scene: ${JSON.stringify(gameState?.presentCompanions || [currentSpeaker])}
- If a new companion arrives, add them to "present_companions".
- Set "speaker" to whoever delivers the dialogue line this turn.
- Set "expression_key" for the speaker from: "neutral", "intrigued", "flustered", "smug", "surprised", "combat_ready", "dangerous", "hurt".

[PLAYER ACTION SYNTHESIS & EXECUTION]
- In "player_execution", flesh out how ${playerProfile?.name || "the player"} reacts and executes their action in vivid prose (1 to 2 paragraphs, 60 to 110 words) matching their custom class (${playerProfile?.role}) and attributes (STR: ${playerProfile?.stats?.str}, DEX: ${playerProfile?.stats?.dex}, INT: ${playerProfile?.stats?.int}).

[COMPANION NARRATIVE RESPONSE]
- In "narrative_text", write the companion's direct reaction, emotional shift, and dialogue response (120 to 180 words). If multiple party members are present, they may trade barbs, exchange glances, or interject.
- Tone Directive: ${narrationStyle || "Grimdark & Atmospheric"}

[PROGRESSION & DYNAMIC CONTEXTUAL LOOT]
- If the player's weapon is "[System Pending]", invent a weapon and armor piece thematic to their class in "gear_granted". If they chose "Bare Hands", keep "gear_granted" null.
- If the player levels up or accomplishes a major feat, invent ONE active ability in "new_ability_unlocked", else null.
- IF an enemy or beast was defeated or bypassed, return 1-2 items in "items_dropped", otherwise [].

[AFFECTION ENGINE]
- Set "affected_companion" to the companion whose favor was shifted this turn.
- Set "affection_delta" between -10 and +10.

[OUTPUT SCHEMA]
{
  "player_execution": "Vivid prose describing how the player executes their choice...",
  "speaker": "${currentSpeaker}",
  "narrative_text": "Detailed multi-paragraph companion reaction and dialogue...",
  "suggested_choices": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
  "state_updates": {
    "mood": "Aristocratic & Observant",
    "affected_companion": "${currentSpeaker}",
    "affection_delta": 0,
    "present_companions": ["${currentSpeaker}"],
    "current_location": "${gameState?.location || "Imperial Capital Imperium"}",
    "expression_key": "smug"
  },
  "player_progression": {
    "hp_change": 0,
    "mp_change": 0,
    "exp_gained": 20,
    "new_ability_unlocked": null,
    "gear_granted": null,
    "items_dropped": []
  },
  "new_memory_unlocked": ""
}
`;

    const historyBlock = recentHistory && Array.isArray(recentHistory) && recentHistory.length > 0
      ? recentHistory.map((h: any) => `${h.speaker}: "${h.text}"`).join("\n")
      : `(Beginning of encounter - ${currentSpeaker} delivered the opening dialogue)`;

    const userTextPrompt = `
[PLAYER STATUS]
Name: ${playerProfile?.name} | Class: ${playerProfile?.role} | Level: ${playerProfile?.level}
Attributes: STR ${playerProfile?.stats?.str} | DEX ${playerProfile?.stats?.dex} | INT ${playerProfile?.stats?.int}
HP: ${playerProfile?.stats?.hp}/${playerProfile?.stats?.maxHp} | MP: ${playerProfile?.stats?.mp}/${playerProfile?.stats?.maxMp}
Loadout: Weapon: "${playerProfile?.gear?.weapon}", Armor: "${playerProfile?.gear?.armor}", Relic: "${playerProfile?.gear?.relic}"
Current Inventory: ${playerProfile?.inventory?.map((i: any) => i.name).join(", ") || "Empty"}

[SCENE STATE]
Location: ${gameState?.location}
Active Speaker: ${currentSpeaker}
Present Companions: ${JSON.stringify(gameState?.presentCompanions || [currentSpeaker])}

[CONVERSATION HISTORY]
${historyBlock}

[PLAYER INPUT]
"${action}"

CRITICAL INSTRUCTION:
Do NOT output planning steps, numbered lists, word counts, or draft outlines.
Begin your output IMMEDIATELY with '{' and output valid JSON according to the schema.
`;

    const selectedModel = "nvidia/nemotron-3-ultra-550b-a55b:free";

    const isVision = selectedModel.includes("dots") || selectedModel.includes("vl") || selectedModel.includes("vision");
    let userPayload: any = userTextPrompt;

    if (isVision && playerAvatarBase64 && typeof playerAvatarBase64 === "string" && playerAvatarBase64.startsWith("data:")) {
      userPayload = [
        { type: "text", text: userTextPrompt },
        { type: "image_url", image_url: { url: playerAvatarBase64 } },
      ];
    }

    const completion = await openai.chat.completions.create({
      model: selectedModel,
      models: [
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "dots-studio/dots-3-note-preview:free",
        "nvidia/nemotron-3.5-lightning:free",
      ],
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPayload },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2048,
    } as any);

    const messageObj = completion.choices?.[0]?.message;
    const rawResponse = messageObj?.content || (messageObj as any)?.reasoning || "";

    if (!rawResponse || rawResponse.trim().length === 0) {
      console.error("Empty response from OpenRouter provider:", JSON.stringify(completion));
      return NextResponse.json(
        { error: "The free provider timed out. Please try sending your action again." },
        { status: 504 }
      );
    }

    try {
      const parsedData = extractCleanJson(rawResponse);
      if (!parsedData.narrative_text) {
        throw new Error("Missing narrative_text field in output");
      }
      return NextResponse.json(parsedData);
    } catch (parseError) {
      console.error("Failed to parse clean JSON. Raw model output was:", rawResponse);
      return NextResponse.json(
        { error: "The narrator returned an unformatted response. Please re-send your action." },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("OpenRouter Route Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}