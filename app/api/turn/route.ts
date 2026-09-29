import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const {
      action,
      isCustom = false,
      gameState,
      partyMembers,
      playerProfile,
      playerAvatarBase64,
      narrationStyle,
      plotMemories,
      recentHistory,
    } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY is not configured." }, { status: 500 });
    }

    // Build the dynamic instruction depending on whether input was selected or typed
    const inputHandlingInstruction = isCustom
      ? `[INPUT TYPE: CUSTOM PLAYER ACTION]
The user typed their own action directly: "${action}".
- Do NOT rewrite, embellish, expand, or speak for the player.
- Set "player_execution" to null or "".
- Treat "${action}" as canon and react to it directly through the world and NPCs in "narrative_text".`
      : `[INPUT TYPE: PRE-GENERATED OPTION SELECTED]
The user picked the following prompt option: "${action}".
- In "player_execution", write a vivid, immersive first- or third-person action/dialogue for ${playerProfile.name} that roleplays out this selected option.
- Then, have the world and NPCs respond in "narrative_text".`;

    const systemPrompt = `You are the Game Master and Storyteller engine for "Astra Chronicles", an interactive grimdark fantasy visual novel set on the Astra Continent.

Atmosphere Tone: ${narrationStyle || "Grimdark & Atmospheric"}

Current State:
- Protagonist: ${playerProfile.name} (Lv.${playerProfile.level} ${playerProfile.role})
- Stats: STR ${playerProfile.stats.str}, DEX ${playerProfile.stats.dex}, INT ${playerProfile.stats.int}
- Equipped: Weapon: ${playerProfile.gear.weapon}, Armor: ${playerProfile.gear.armor}, Relic: ${playerProfile.gear.relic}
- Active Location: ${gameState.location}
- Active Speaker: ${gameState.speaker}
- Companions in party: ${partyMembers.map((c: any) => `${c.name} (Favor: ${c.affection}\%, Present:${c.isPresent})`).join(", ")}
- Major Memories: ${plotMemories?.slice(-5).join(" | ") || "None"}

${inputHandlingInstruction}

OUTPUT REQUIREMENTS:
You MUST respond with valid, parseable JSON only (no markdown code blocks, no backticks, no text outside the JSON object) following this exact schema:
{
  "speaker": string, // The name of the companion or NPC speaking/acting in narrative_text
  "player_execution": string | null, // The player's expanded action if isCustom is false, otherwise null
  "narrative_text": string, // The dialogue and sensory scene narrative responding to the player
  "state_updates": {
    "current_location": string, // One of: "Imperial Capital Imperium", "Bloodrose Duchy", "Gray Zone", "Mage Tower", "Port City Fortus", "Archon Spire Vault", "Silvanes"
    "mood": string,
    "expression_key": "neutral" | "intrigued" | "flustered" | "smug" | "surprised" | "combat_ready" | "dangerous" | "hurt",
    "affected_companion": string,
    "affection_delta": number, // Favor increase or decrease (-10 to +10)
    "present_companions": string[]
  },
  "player_progression": {
    "exp_gained": number,
    "hp_change": number,
    "mp_change": number,
    "new_ability_unlocked": string | null,
    "gear_granted": { "weapon"?: string, "armor"?: string, "relic"?: string } | null,
    "items_dropped": [
      {
        "id": string,
        "name": string,
        "type": "weapon" | "armor" | "relic" | "consumable" | "material",
        "rarity": "common" | "uncommon" | "rare" | "relic" | "cursed",
        "description": string,
        "effect": string
      }
    ] | null
  },
  "new_memory_unlocked": string | null,
  "suggested_choices": [string, string, string, string] // Exactly 4 interactive prompt options for the next turn
}`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (recentHistory && Array.isArray(recentHistory)) {
      recentHistory.forEach((turn: { speaker: string; text: string }) => {
        messages.push({
          role: turn.speaker === playerProfile.name ? "user" : "assistant",
          content: `${turn.speaker}: ${turn.text}`,
        });
      });
    }

    // Attach user prompt with portrait image payload if available
    if (playerAvatarBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: `Player Action: ${action}` },
          { type: "image_url", image_url: { url: playerAvatarBase64 } }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: `Player Action: ${action}`,
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://astra-chronicles.local",
        "X-Title": "Astra Chronicles",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet", // Or your preferred OpenRouter model
        messages,
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `OpenRouter error: ${errorText}` }, { status: response.status });
    }

    const rawData = await response.json();
    let content = rawData.choices?.[0]?.message?.content || "{}";

    // Clean potential markdown fencing from response
    content = content.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim();

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("API /api/turn Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process turn." }, { status: 500 });
  }
}