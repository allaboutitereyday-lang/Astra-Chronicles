import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";

export const runtime = "nodejs";

const PROLOGUE_MODELS = [
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
      playerProfile,
      playerAvatarBase64,
      startingHeroine,
      startingLocation,
      narrationStyle,
      userAccessKey,
      storyContext,
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

    const storyTitle = storyContext?.title || "Astra Chronicles";
    const settingName = storyContext?.worldContext?.settingName || "the Astra Continent";
    const effectiveTone = narrationStyle || storyContext?.narrationStyle || "Grimdark & Atmospheric";

    const companionDossiers = storyContext?.companions && storyContext.companions.length > 0
      ? storyContext.companions.map((c: any, i: number) => `
${i + 1}. ${c.name} (${c.title || c.role}):
   - Values: ${Array.isArray(c.values) ? c.values.join(", ") : "Honor, Loyalty"}
   - Dislikes: ${Array.isArray(c.dislikes) ? c.dislikes.join(", ") : "Betrayal, Cowardice"}
   - High compatibility: ${Array.isArray(c.highCompatibility) ? c.highCompatibility.join(", ") : "Adventurers, Tacticians"}
   - Expressions: ${c.expressions ? Object.keys(c.expressions).join(", ") : "neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt"}
`).join("\n")
      : `1. Evelyn Abbandonato (High Arcanist):
   - Values: Intellect, cunning, noble etiquette, arcane knowledge, composure, audacity.
   - Dislikes: Clumsy brute force, groveling sycophants, mindless violence.
   - High compatibility: Mages, spellblades, cunning tacticians, scholars, aristocrats.
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt.

2. Aria Shadowthorn (Veil Seeker Rogue):
   - Values: Pragmatism, stealth, tradecraft, survival instincts, quiet competence.
   - Dislikes: Self-righteous preaching, knightly arrogance, reckless loudness.
   - High compatibility: Rogues, scouts, assassins, street-smart survivalists.
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt.

3. Serena (Demi-Human Combat Maid):
   - Values: Duty, polite poise, decisive lethality, recognizing boundaries, martial discipline.
   - Dislikes: Whining, sloppiness, disloyalty, disrespect to masters or household.
   - High compatibility: Disciplined warriors, knights, stoic weaponmasters, polite leaders.
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt.

4. Morgana (Demon Realm Noblewoman):
   - Values: Ambition, dark planar intrigue, fearlessness, sinister wit, raw resolve.
   - Dislikes: Cowardice, puritanical moral superiority, boring compliance.
   - High compatibility: Warlocks, dark knights, occultists, ruthless adventurers.
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt, beckon.

5. Perci (Timid Kitsune Rogue):
   - Values: Gentleness, patience, protective reassurance, quiet empathy.
   - Dislikes: Aggression, intimidation, shouting, cruelty.
   - High compatibility: Kind wanderers, gentle protectors, rangers, empathetic souls.
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt.`;

    const systemPrompt = `You are the Game Master and Director for "${storyTitle}", an interactive visual novel set on ${settingName}.
Tone: ${effectiveTone} (visceral, sensory-rich, morally gray, intense).

You are generating the bespoke dynamic prologue and opening encounter.

--- HEROINE DOSSIERS & COMPATIBILITY CRITERIA ---
${companionDossiers}

--- COMPATIBILITY & BASE AFFECTION RULES ---
- Base affection must start LOW overall (range: 5 to 25). Heroines in this world are guarded and cynical.
- High Compatibility (class, vibe, and visual presentation strongly match her values): 18 - 25.
- Neutral / Average Compatibility: 12 - 17.
- Low / Suspicious Compatibility (clashes with her nature or poses an overt annoyance): 5 - 11.

--- VISUAL INSPECTION DIRECTIVE ---
If a character avatar image is provided, ${startingHeroine} MUST explicitly and naturally observe their appearance in her initial reaction:
- Take note of their physical features (hair, eyes, build, stance), armor/clothing, visible weapons, and overall aura.
- Weave these direct observations naturally into her dialogue or internal impression.

--- SYSTEM ADMINISTRATOR DIRECTIVE ---
You also operate the transcendent LitRPG/Manhwa 'SYSTEM' that tracks and guides the protagonist.
Initialize the starting scenario quest and starting causal plausibility (default 80%).
Voice: Detached, cold, authoritative administrator ([SYSTEM: ...]).

--- OUTPUT FORMAT ---
Respond strictly in valid JSON matching this schema:
{
  "speaker": "${startingHeroine}",
  "location": "${startingLocation}",
  "scene_setup": string, // 1-2 atmospheric, sensory-rich paragraphs detailing the location, sounds, and how the player arrives/stands before the heroine. Use Markdown (*italics* for sensory actions/ambiance, **bold** for impact)
  "dialogue": string, // The heroine's authentic, voice-accurate opening lines addressing the protagonist (including visual observations if image was attached)
  "initial_affection": number, // 5 to 25 based on compatibility evaluation
  "initial_mood": string, // Short descriptive mood tag (e.g. "Analytical & Guarded", "Predatory Amusement")
  "expression_key": "neutral" | "intrigued" | "flustered" | "smug" | "surprised" | "combat_ready" | "dangerous" | "hurt" | "beckon",
  "opening_choices": [string, string, string, string], // 4 tailored, distinct dialogue or action responses tagged with intent (e.g. "[Arcana]", "[Subterfuge]", "[Composure]", "[Force]")
  "initial_quest": {
    "id": "scenario_01",
    "title": string,
    "description": string,
    "type": "scenario",
    "difficulty": "E" | "D",
    "objectives": [
      { "text": string, "completed": false },
      { "text": string, "completed": false }
    ],
    "rewards": {
      "exp": 100,
      "gold": 50,
      "title": string | null
    }
  },
  "system_announcement": string
}`;

    const abilitiesDesc = Array.isArray(playerProfile.abilities) && playerProfile.abilities.length > 0
      ? playerProfile.abilities.join(", ")
      : "None unlocked yet";

    const promptText = `Protagonist: ${playerProfile.name}
Role / Archetype: ${playerProfile.role}
Attributes: STR ${playerProfile.stats.str} | DEX ${playerProfile.stats.dex} | INT ${playerProfile.stats.int}
Gear: ${playerProfile.gear.weapon || "Bare Hands"} / ${playerProfile.gear.armor || "Wanderer Attire"}
Starting Abilities: ${abilitiesDesc}
Starting Location: ${startingLocation}
Starting Heroine: ${startingHeroine}

Generate the dynamic opening prologue according to the instructions.`;

    const userContent: any[] = [];
    if (playerAvatarBase64) {
      userContent.push({
        type: "text",
        text: `${promptText}\n[Note to Game Master: Inspect the attached protagonist image and author ${startingHeroine}'s visual observations into her opening response.]`,
      });
      userContent.push({
        type: "image_url",
        image_url: { url: playerAvatarBase64 },
      });
    } else {
      userContent.push({
        type: "text",
        text: promptText,
      });
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent.length === 1 ? userContent[0].text : userContent },
    ];

    let responseData = null;
    let lastError = null;

    for (const model of PROLOGUE_MODELS) {
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
            temperature: 0.85,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Prologue model ${model} failed (${response.status}): ${errText}`);
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
        console.warn(`Error generating prologue with model ${model}:`, err.message);
        lastError = err;
      }
    }

    if (!responseData) {
      throw lastError || new Error("Failed to generate prologue from models.");
    }

    const defaultQuest = {
      id: "scenario_01",
      title: `Scenario 1: Awakening at ${startingLocation || "the Imperial Realm"}`,
      description: `The Administrator has initialized in the presence of ${startingHeroine}. Establish your standing without compromising causal probability.`,
      type: "scenario" as const,
      difficulty: "E" as const,
      objectives: [
        { text: `Engage in dialogue with ${startingHeroine}`, completed: false },
        { text: `Demonstrate your capability as a ${playerProfile.role || "Wanderer"}`, completed: false },
      ],
      rewards: {
        exp: 120,
        gold: 50,
        title: "Planar Pioneer",
      },
      status: "active" as const,
    };

    responseData.initial_quest = responseData.initial_quest || defaultQuest;
    if (!responseData.initial_quest.status) {
      responseData.initial_quest.status = "active";
    }
    responseData.system_announcement =
      responseData.system_announcement ||
      `[SYSTEM: Dimensional synchronization complete. Administrator Protocol engaged. Welcome to Astra Continent, ${playerProfile.name}.]`;
    responseData.plausibility = typeof responseData.plausibility === "number" ? responseData.plausibility : 80;
    responseData.plausibility_tier = responseData.plausibility >= 70 ? "Stable" : "Strained";

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("API /api/prologue Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate dynamic prologue." },
      { status: 500 }
    );
  }
}

