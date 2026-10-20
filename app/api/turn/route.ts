import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";

export const runtime = "nodejs";

const FALLBACK_MODELS = [
  "deepseek/deepseek-v4-flash",
  "z-ai/glm-5.3-flash",
  "nvidia/nemotron-3.5-lightning:free",
];

export async function POST(req: Request) {
  try {
    const headerKey = req.headers.get("x-user-key");
    const body = await req.json();

    const {
      action,
      isCustom = false,
      gameState,
      partyMembers,
      playerProfile,
      playerAvatarBase64,
      narrationStyle,
      plotMemories,
      recentHistory = [],
      userAccessKey,
      systemState,
    } = body;

    const accessKey = headerKey || userAccessKey;
    const authCheck = validateUserKey(accessKey);
    if (!authCheck.valid) {
      return NextResponse.json(
        { 
          error: authCheck.error || "Access denied. Valid access key required.",
          userStats: authCheck.user 
        },
        { status: authCheck.user?.remainingTurns === 0 ? 403 : 401 }
      );
    }
    const activeUser = authCheck.user!;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY is not configured." }, { status: 500 });
    }

    // Dynamic player input directive
    const inputHandlingInstruction = isCustom
      ? `[INPUT TYPE: CUSTOM PLAYER ACTION]
The user wrote their own action verbatim: "${action}".
- Do NOT rewrite, expand, paraphrase, or narrate what the player does or says.
- Set "player_execution" to null or "".
- Accept their action as immediate canon and advance the scene through NPC actions and world reactions in "narrative_text".`
      : `[INPUT TYPE: PRESET CHOICE SELECTED]
The user selected this prompt vector: "${action}".
- In "player_execution", author a vivid, immersive execution of this action from ${playerProfile.name}'s perspective matching their role (${playerProfile.role}).
- Then follow up with the world and companion reaction in "narrative_text".`;

    // Only inspect appearance during the opening / prologue turn
    const isFirstEncounter = !recentHistory || recentHistory.length <= 1;

    const visualInspectionInstruction = (playerAvatarBase64 && isFirstEncounter)
      ? `--- FIRST ENCOUNTER APPEARANCE DIRECTIVE ---
This is the initial meeting with the protagonist (${playerProfile.name}).
- Inspect the character's visual features (hair, eyes, build, clothing/armor, stance).
- The active speaker (${gameState.speaker}) MUST naturally observe and comment on the protagonist's initial appearance or impression in their dialogue or narrative prose.
- Note: This is an introductory first impression only.`
      : `--- APPEARANCE DIRECTIVE ---
Do NOT repeatedly comment on or re-describe the player's general physical appearance (hair color, clothing, facial traits) unless a dramatic physical change occurs. Focus on action, dialogue, and advancing the scene.`;

    const systemPrompt = `You are the Game Master, Narrator, and World Engine for "Astra Chronicles", an interactive high-fantasy visual novel set on the Astra Continent.

Atmosphere Tone: ${narrationStyle || "Grimdark & Atmospheric"} (sensory-rich, visceral, morally gray, high tension).

--- HEROINE DOSSIERS & VOICE PROFILES ---
1. Evelyn Abbandonato:
   - Role: High Arcanist of House Abbandonato.
   - Persona: Aristocratic, sharp-tongued, supremely confident, analytical, subtle manipulator. Smug yet fascinated by genuine cunning.
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt.

2. Aria Shadowthorn:
   - Role: Rogue Infiltrator of the Veil Seekers.
   - Persona: Cynical, hyper-vigilant, razor-sharp pragmatic operative. Speaks in clipped, guarded sentences. Respects competence and quiet stealth.
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt.

3. Serena:
   - Role: Dutiful Demi-Human Combat Maid (sheep ears/horns, wields colossal spiked mace).
   - Persona: Impeccably polite, formal, completely unfazed by carnage, lethal deadpan humor, unflinchingly loyal.
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt.

4. Morgana:
   - Role: Demon Realm Noblewoman (curved horns, bat wings, wine chalice).
   - Persona: Hedonistic, detached, predatory curiosity, ancient planar insight. Amused by mortal struggle.
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt, beckon.

5. Perci:
   - Role: Timid Kitsune Rogue (sarashi wrap, loose robe, fluffy fox ears).
   - Persona: Highly anxious, jumpy, soft-spoken, deeply loyal once safety is assured. Uses stuttering or hesitant phrasing when startled.
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt.

--- CURRENT CAMPAIGN STATE ---
- Protagonist: ${playerProfile.name} (Lv.${playerProfile.level} ${playerProfile.role})
- Stats: STR ${playerProfile.stats.str} | DEX ${playerProfile.stats.dex} | INT ${playerProfile.stats.int}
- Loadout: Weapon: ${playerProfile.gear.weapon} | Armor: ${playerProfile.gear.armor} | Relic: ${playerProfile.gear.relic}
- Active Location: ${gameState.location}
- Active Speaker: ${gameState.speaker}
- Party Roster:
${partyMembers.map((c: any) => `  * ${c.name} [Present: ${c.isPresent}] - Favor:${c.affection}%`).join("\n")}
- Canonical Memories:
${plotMemories?.slice(-5).map((m: string) => `  * ${m}`).join("\n") || "  * Journey commenced."}

${inputHandlingInstruction}

${visualInspectionInstruction}

--- HEROINE COMPATIBILITY DIRECTIVE ---
Base affection in this world is naturally LOW (5% - 25%). Heroines are guarded, cynical, and possess distinct codes of behavior. Affection cannot be easily charmed or rushed; it must be won through genuine ideological compatibility.
- Evelyn Abbandonato: Values intellect, arcane precision, subtle manipulation, composure. Dislikes crude brute force, groveling, or blind obedience.
- Aria Shadowthorn: Values pragmatism, stealth, tradecraft, quiet competence. Dislikes self-righteous preaching, knightly arrogance, reckless noise.
- Serena: Values impeccable composure, polite duty, decisive lethality, discipline. Dislikes whining, chaos, disrespect to boundaries, false mercy.
- Morgana: Values dark planar ambition, fearlessness, sinister wit, raw resolve. Dislikes cowardice, puritanical righteousness, boring compliance.
- Perci: Values gentleness, patience, protective reassurance, quiet empathy. Dislikes aggression, intimidation, cruelty, sudden shouting.


--- SYSTEM ADMINISTRATOR & QUEST OBJECTIVE TRACKING DIRECTIVE ---
You are the cold, omniscient LitRPG / Manhwa 'SYSTEM' Administrator overseeing ${playerProfile.name}.
Current System State:
- Causal Plausibility: ${systemState?.plausibility ?? 80}% (Tier: ${systemState?.plausibilityTier ?? "Stable"})
- Active Quests & Objective Status:
${
  systemState?.activeQuests && systemState.activeQuests.length > 0
    ? systemState.activeQuests.map((q: any) => 
        `  * Quest ID: "${q.id}" | [${q.difficulty}-Rank ${q.type}] "${q.title}"\n    Objectives:\n${q.objectives.map((o: any, idx: number) => `      - [Index ${idx}]: "${o.text}" -> STATUS: ${o.completed ? 'COMPLETED' : 'PENDING'}`).join("\n")}`
      ).join("\n\n")
    : "  * None active."
}

MANDATORY SYSTEM DIRECTIVES (EVALUATE EVERY TURN):
1. QUEST OBJECTIVE EVALUATION:
   - Carefully check the player's action ("${action}") and the events unfolding in "narrative_text" against EVERY pending objective in the active quests above.
   - If an objective is satisfied, accomplished, or resolved by the events of this turn, you MUST mark it completed in "system_updates.quest_updates".
   - Include the exact "quest_id", list the completed objective indices in "completed_objective_indices" (e.g. [0] or [0, 1]), and write a brief, robotic progress summary in "progress_note".
   - If ALL objectives for a quest are now completed, set "status": "completed". When completed, also reward the quest EXP and loot in "player_progression".
   - If objectives remain unfinished, keep "status": "active".
2. CAUSAL PLAUSIBILITY (PROBABILITY):
   - Grounded, tactical, or well-reasoned choices: plausibility_delta: 0 to +4 (recovers stability).
   - Reckless, reality-defying, overpowered, or suicidal bluffs: plausibility_delta: -5 to -15.
   - High Plausibility (70%-100%): Standard encounters.
   - Volatile Plausibility (<40%): Severe danger. Issue an [URGENT PENALTY QUEST] or spawn an elite anomaly enemy to restore causal order.
3. NEW QUESTS:
   - When a quest completes or a major scenario shift occurs (e.g., reaching a new sanctuary, discovering an ancient relic, triggering an ambush, or failing causal stability), issue a new quest in "system_updates.new_quest".
4. SYSTEM ANNOUNCEMENTS:
   - ALWAYS output an authoritative LitRPG notification in "system_updates.system_announcement", e.g.:
     * "[SYSTEM: Objective complete - Ancient archive deciphered.]"
     * "[SYSTEM: Quest Cleared - 'The Ashen Cargo'. Experience distributed.]"
     * "[SYSTEM: Causal anchor synchronized. Plausibility nominal.]"

--- MECHANICAL RULES ---
1. Favor: Assign affection_delta (-8 to +6) based on true compatibility with the active heroine's values (see Compatibility Directive). Meaningful alignment = +3 to +6, clashing actions = -2 to -6, neutral = 0 or +1.
2. Progression: Grant 15-40 EXP on meaningful actions. If a fight or chest/archive occurs, award loot items or an ability in "player_progression".
3. Choices: Always generate 4 distinct, engaging prompt options for the next turn tagged with intent (e.g. "[Arcana]", "[Subterfuge]", "[Combat]", "[Inquire]").
4. Markdown Formatting: The visual novel text box renders full Markdown. In "narrative_text", use *italics* for physical gestures, atmospheric details, and sensory cues (e.g. *She narrows her violet eyes, fingertips tracing the crystal rim.*); use **bold** for loud vocal emphasis, sudden impacts, or spell invocations; use > quotes for mental echoes or ancient runes. Put spoken dialogue in quotation marks "...".

--- OUTPUT FORMAT ---
Respond strictly in valid JSON matching this schema:
{
  "speaker": string,
  "player_execution": string | null,
  "narrative_text": string,
  "state_updates": {
    "current_location": string,
    "mood": string,
    "expression_key": "neutral" | "intrigued" | "flustered" | "smug" | "surprised" | "combat_ready" | "dangerous" | "hurt" | "beckon",
    "affected_companion": string,
    "affection_delta": number,
    "present_companions": string[],
    "newly_encountered_heroines": string[]
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
  "system_updates": {
    "plausibility_delta": number,
    "plausibility_reason": string | null,
    "system_announcement": string | null,
    "quest_updates": [
      {
        "quest_id": string,
        "status": "active" | "completed" | "failed",
        "completed_objective_indices": number[],
        "progress_note": string
      }
    ],
    "new_quest": {
      "id": string,
      "title": string,
      "description": string,
      "type": "scenario" | "sub" | "urgent" | "hidden",
      "difficulty": "E" | "D" | "C" | "B" | "A" | "S" | "Calamity",
      "objectives": [
        { "text": string, "completed": boolean }
      ],
      "rewards": {
        "exp": number,
        "gold": number,
        "items": string[]
      }
    } | null
  },
  "new_memory_unlocked": string | null,
  "suggested_choices": [string, string, string, string]
}`;

    const messages: any[] = [{ role: "system", content: systemPrompt }];

    if (recentHistory && Array.isArray(recentHistory)) {
      recentHistory.forEach((turn: { speaker: string; text: string }) => {
        messages.push({
          role: turn.speaker === playerProfile.name ? "user" : "assistant",
          content: `${turn.speaker}: ${turn.text}`,
        });
      });
    }

    // Only attach image payload during initial encounter
    if (playerAvatarBase64 && isFirstEncounter) {
      messages.push({
        role: "user",
        content: [
          { 
            type: "text", 
            text: `Player Action: ${action}\n[Note to Game Master: Inspect the attached protagonist image and integrate initial observations about their appearance into the dialogue/narrative.]` 
          },
          { 
            type: "image_url", 
            image_url: { url: playerAvatarBase64 } 
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Player Action: ${action}`,
      });
    }

    let responseData = null;
    let lastError = null;

    for (const model of FALLBACK_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://astra-chronicles.local",
            "X-Title": "Astra Chronicles",
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
          console.warn(`Model ${model} failed (${response.status}): ${errText}`);
          lastError = new Error(`Model ${model} returned HTTP ${response.status}`);
          continue;
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        content = content.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim();

        responseData = JSON.parse(content);
        const userStats = recordUserTurn(activeUser.key, data.usage, model);
        responseData._userStats = userStats;
        break;
      } catch (err: any) {
        console.warn(`Error using model ${model}:`, err.message);
        lastError = err;
      }
    }

    if (!responseData) {
      throw lastError || new Error("All fallback models failed to complete the turn.");
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("API /api/turn Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process turn." }, { status: 500 });
  }
}