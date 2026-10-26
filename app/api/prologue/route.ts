import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";
import { getNarrationProseDirective } from "@/lib/narrationStyles";
import { describeProtagonistAvatar } from "@/lib/visionEncoder";
import { sanitizeVisualNovelProse, sanitizeSpokenDialogue, ensureChoiceIntentTag, sanitizeNarrativeAndMechanics } from "@/lib/proseSanitizer";
import { HEROINE_INTRODUCTION_DOSSIERS, HeroineIntroductionDossier } from "@/lib/heroineDossiers";
import {
  createDefaultNpcKnowledgeMap,
  buildKnowledgeGateDirective,
  getCompanionKnowledge,
  enforceSpokenDialogueMasking,
} from "@/lib/knowledgeGating";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROLOGUE_MODELS = [
  "deepseek/deepseek-chat",
  "nousresearch/hermes-3-llama-3.1-70b",
  "sao10k/l3.1-euryale-70b",
  "sao10k/l3-lunaris-8b",
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
      targetEnvironment = "cloud",
      modelId,
      temperature,
      max_tokens,
      repetition_penalty,
      npcKnowledgeMap,
    } = body;

    const initialKnowledgeMap = {
      ...createDefaultNpcKnowledgeMap(storyContext?.companions),
      ...(npcKnowledgeMap || {}),
    };
    const startingHeroineKnowledge = getCompanionKnowledge(initialKnowledgeMap, startingHeroine);
    const knowledgeGatePrompt = buildKnowledgeGateDirective(
      initialKnowledgeMap,
      [startingHeroine || "Evelyn Abbandonato"],
      playerProfile
    );

    const effectiveTemperature = typeof temperature === "number" ? Math.max(0.1, Math.min(1.8, temperature)) : 0.75;
    const effectiveMaxTokens = typeof max_tokens === "number" ? Math.max(1024, Math.min(4096, max_tokens)) : 2048;
    const effectiveRepetitionPenalty = typeof repetition_penalty === "number" ? Math.max(1.0, Math.min(1.5, repetition_penalty)) : 1.1;

    // Smart auto-detection: If targetEnvironment is local but modelId has a cloud slug (e.g. sao10k/...),
    // auto-route to cloud!
    let effectiveEnvironment = targetEnvironment;
    if (effectiveEnvironment === "local" && modelId && modelId.includes("/")) {
      console.warn(`Local environment requested with cloud model ID "${modelId}". Auto-routing to cloud.`);
      effectiveEnvironment = "cloud";
    }
    const isLocal = effectiveEnvironment === "local";

    const accessKey = headerKey || userAccessKey;
    const authCheck = validateUserKey(accessKey);
    if (!isLocal && !authCheck.valid) {
      return NextResponse.json(
        { 
          error: authCheck.error || "Access denied. Valid access key required.",
          userStats: authCheck.user 
        },
        { status: authCheck.user?.remainingTurns === 0 ? 403 : 401 }
      );
    }
    const activeUser = authCheck.user || { key: "local_player", name: "Local Adventurer", role: "admin", remainingTurns: -1 };

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!isLocal && !apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY is not configured." }, { status: 500 });
    }

    // Inspect uploaded protagonist avatar if present using persisted description or fast vision encoder
    let visualDescription: string | null = playerProfile?.visualDescription || null;
    if (!visualDescription && playerAvatarBase64) {
      try {
        visualDescription = await describeProtagonistAvatar(
          playerAvatarBase64,
          playerProfile?.name || "The Protagonist",
          playerProfile?.role || "Adventurer",
          apiKey
        );
      } catch (vErr: any) {
        console.warn("[Prologue API] Failed to encode avatar with vision:", vErr?.message);
      }
    }

    const storyTitle = storyContext?.title || "Astra Chronicles";
    const settingName = storyContext?.worldContext?.settingName || "the Astra Continent";
    const effectiveTone = narrationStyle || storyContext?.narrationStyle || "Grimdark & Atmospheric";

    // Match starting heroine to her bespoke canonical introduction dossier
    const heroineKey = Object.keys(HEROINE_INTRODUCTION_DOSSIERS).find(
      (k) => k.toLowerCase().includes((startingHeroine || "").toLowerCase()) || (startingHeroine || "").toLowerCase().includes(k.toLowerCase())
    ) || "Evelyn Abbandonato";
    const heroineDossier = HEROINE_INTRODUCTION_DOSSIERS[heroineKey];

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

${getNarrationProseDirective(effectiveTone)}

You are generating the bespoke dynamic prologue and opening encounter.

--- HEROINE DOSSIERS & COMPATIBILITY CRITERIA ---
${companionDossiers}

--- BESPOKE HEROINE DOSSIER & CANONICAL BASELINE (${heroineDossier.name}) ---
Title: ${heroineDossier.title}
Canonical Location: ${heroineDossier.defaultLocation}
Atmosphere & Sensory Cues: ${heroineDossier.environment}
Physical Appearance & Presence: ${heroineDossier.appearanceSensoryCues}
Psychological Profile: ${heroineDossier.psychologicalProfile}
Canonical Encounter Baseline: ${heroineDossier.canonicalEncounter}
Dialogue Cadence: ${heroineDossier.dialogueCadence}
Canonical Opening Dialogue: "${heroineDossier.signatureOpeningDialogue}"
Canonical Baseline Choices:
${heroineDossier.baselineChoices.map((c) => `- ${c}`).join("\n")}

--- CRITICAL GAME MASTER INSTRUCTIONS ---
1. Use the bespoke heroine dossier as the working baseline. Capture her specific atmospheric environment, sensory triggers (smells, weather, ambient lighting, acoustic textures), and psychological demeanor.
2. In her opening reaction, ${startingHeroine} MUST explicitly observe and remark on the newcomer's visible physical appearance, build, visible gear (${playerProfile.gear.weapon || "Bare Hands"} / ${playerProfile.gear.armor || "Wanderer Attire"}), and bearing—while strictly obeying the Diegetic Knowledge Gate below (she does NOT yet know the newcomer's name or internal LitRPG class title!).

${knowledgeGatePrompt}
3. OPENING CHOICES GUIDELINE: The 4 generated options in "opening_choices" MUST STRICTLY follow this guideline:
   [Tone/Action]: Short summary of character action/dialogue
   Examples:
   - [Combat/Aggressive]: Step forward, draw your blade with a metallic rasp, and demand passage.
   - [Arcana/Analytical]: Channel ether into your fingertips and call out the instability in her containment glyph.
   - [Subterfuge/Cunning]: Flash the clandestine counter-cipher with your left hand while keeping to the shadows.
   - [Composure/Diplomatic]: Stand your ground calmly, meet her gaze without blinking, and propose a mutual bargain.
   DO NOT generate single tags like [Combat] or [Subterfuge] without the Action tone. Every single choice MUST be in "[Tone/Action]: Short summary" format.

--- COMPATIBILITY & BASE AFFECTION RULES ---
- Base affection must start LOW overall (range: 5 to 25). Heroines in this world are guarded and cynical.
- High Compatibility (class, vibe, and visual presentation strongly match her values): 18 - 25.
- Neutral / Average Compatibility: 12 - 17.
- Low / Suspicious Compatibility (clashes with her nature or poses an overt annoyance): 5 - 11.

--- VISUAL INSPECTION DIRECTIVE ---
${visualDescription
  ? `Detailed visual appearance of ${playerProfile.name} (derived from uploaded avatar):
"${visualDescription}"
CRITICAL OPENING DIRECTIVE: ${startingHeroine} MUST explicitly observe and remark on ${playerProfile.name}'s specific appearance, attire, physical build, and bearing in her opening dialogue or internal impressions.`
  : playerAvatarBase64
  ? `If a character avatar image is provided, ${startingHeroine} MUST explicitly and naturally observe their appearance in her initial reaction:
- Take note of their physical features (hair, eyes, build, stance), armor/clothing, visible weapons, and overall aura.
- Weave these direct observations naturally into her dialogue or internal impression.`
  : `Portray the protagonist with the presence and demeanor befitting a ${playerProfile.role}.`}

--- SYSTEM ADMINISTRATOR DIRECTIVE ---
You also operate the transcendent LitRPG/Manhwa 'SYSTEM' that tracks and guides the protagonist.
Initialize the starting scenario quest and starting causal plausibility (default 80%).
Voice: Detached, cold, authoritative administrator ([SYSTEM: ...]).

--- OUTPUT FORMAT ---
Respond strictly in valid JSON matching this schema:
{
  "speaker": "${startingHeroine}",
  "location": "${startingLocation}",
  "scene_setup": string, // 1-2 plain-text paragraphs detailing the location, sounds, and how the player arrives/stands before the heroine, with flawless grammar and ZERO Markdown asterisks (* or **)
  "dialogue": string, // The heroine's spoken lines addressing the protagonist. MUST BE IN DOUBLE QUOTATION MARKS ("...") with zero Markdown asterisks.
  "mechanics": string, // Authoritative LitRPG system initialization readout (e.g. "[SYSTEM: Dimensional synchronization complete. Causal Plausibility: 80%.]")
  "initial_affection": number, // 5 to 25 based on compatibility evaluation
  "initial_mood": string, // Short descriptive mood tag (e.g. "Analytical & Guarded", "Predatory Amusement")
  "expression_key": "neutral" | "intrigued" | "flustered" | "smug" | "surprised" | "combat_ready" | "dangerous" | "hurt" | "beckon",
  "opening_choices": [string, string, string, string], // 4 tailored, distinct dialogue or action responses strictly formatted as "[Tone/Action]: Short summary of character action/dialogue"
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

    const promptText = `Protagonist (Narrator Reference Only — Unknown to ${startingHeroine} in dialogue unless unlocked): ${startingHeroineKnowledge.knowsName ? playerProfile.name : `[UNKNOWN TO ${startingHeroine.toUpperCase()} — Refer to as "stranger" or "traveler" in spoken dialogue]`}
Internal Class (Unknown to ${startingHeroine} in dialogue unless unlocked): ${startingHeroineKnowledge.knowsClass ? playerProfile.role : `[UNKNOWN TO ${startingHeroine.toUpperCase()} — Judge only visible gear]`}
Attributes: STR ${playerProfile.stats.str} | DEX ${playerProfile.stats.dex} | INT ${playerProfile.stats.int}
Visible Gear: ${playerProfile.gear.weapon || "Bare Hands"} / ${playerProfile.gear.armor || "Wanderer Attire"}
Starting Abilities: ${abilitiesDesc}
Starting Location: ${startingLocation}
Starting Heroine: ${startingHeroine}

Generate the dynamic opening prologue according to the instructions.`;

    function supportsVision(modelName?: string): boolean {
      if (!modelName) return false;
      const m = modelName.toLowerCase();
      return (
        m.includes("vision") ||
        m.includes("vl") ||
        m.includes("4o") ||
        m.includes("gemini") ||
        m.includes("claude-3") ||
        m.includes("pixtral")
      );
    }

    let responseData = null;
    let lastError = null;

    // Smart Hybrid routes structured prologue orchestration to DeepSeek V3
    const effectiveModelId = modelId === "orchestrated-hybrid" ? "deepseek/deepseek-chat" : (modelId || "deepseek/deepseek-chat");
    const modelsToTry = isLocal
      ? [effectiveModelId || "hermes3:8b"]
      : (effectiveModelId ? [effectiveModelId, ...PROLOGUE_MODELS.filter((m) => m !== effectiveModelId)] : PROLOGUE_MODELS);

    for (const model of modelsToTry) {
      try {
        const fetchUrl = isLocal
          ? "http://127.0.0.1:11434/v1/chat/completions"
          : "https://openrouter.ai/api/v1/chat/completions";

        const headers: Record<string, string> = isLocal
          ? { "Content-Type": "application/json" }
          : {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://astra-chronicles.local",
              "X-Title": "Astra Chronicles",
            };

        const userContent: any[] = [];
        if (playerAvatarBase64 && supportsVision(model)) {
          userContent.push({
            type: "text",
            text: `${promptText}\n[Note to Game Master: Inspect the attached protagonist image and author ${startingHeroine}'s visual observations into her opening response.]`,
          });
          userContent.push({
            type: "image_url",
            image_url: { url: playerAvatarBase64 },
          });
        } else {
          const avatarNote = visualDescription
            ? `\n[Protagonist Visual Description: "${visualDescription}"]`
            : playerAvatarBase64
            ? `\n[Note to Game Master: The protagonist has an uploaded portrait; portray their striking persona and features in ${startingHeroine}'s reaction.]`
            : "";
          userContent.push({
            type: "text",
            text: `${promptText}${avatarNote}`,
          });
        }

        const messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent.length === 1 ? userContent[0].text : userContent },
        ];

        let response = await fetch(fetchUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages,
            user: activeUser.key,
            temperature: effectiveTemperature,
            max_tokens: effectiveMaxTokens,
            repetition_penalty: effectiveRepetitionPenalty,
            response_format: { type: "json_object" },
          }),
        });

        // Fail-safe retry: If OpenRouter rejects because of image input or content safety filters, retry immediately as text-only
        if (!response.ok) {
          const firstErrText = await response.text();
          const hasImagePayload = Array.isArray(userContent) && userContent.some((c: any) => c.type === "image_url");
          const isVisionOrSafetyRejection =
            firstErrText.includes("image input") ||
            firstErrText.includes("Image Support") ||
            firstErrText.includes("Filter by Image") ||
            firstErrText.includes("safety") ||
            firstErrText.includes("policy") ||
            firstErrText.includes("moderation") ||
            firstErrText.includes("explicit") ||
            firstErrText.includes("prohibited") ||
            firstErrText.includes("unsupported");

          if (hasImagePayload && isVisionOrSafetyRejection) {
            console.warn(`Prologue model ${model} rejected image payload (${firstErrText.slice(0, 100)}). Retrying with pure text...`);
            const avatarContext = visualDescription ? `\n[Protagonist Appearance: "${visualDescription}"]` : "";
            const fallbackMessages = [
              { role: "system", content: systemPrompt },
              { role: "user", content: `${promptText}${avatarContext}` },
            ];

            response = await fetch(fetchUrl, {
              method: "POST",
              headers,
              body: JSON.stringify({
                model,
                messages: fallbackMessages,
                user: activeUser.key,
                temperature: effectiveTemperature,
                max_tokens: effectiveMaxTokens,
                repetition_penalty: effectiveRepetitionPenalty,
                response_format: { type: "json_object" },
              }),
            });
          } else {
            console.warn(`Prologue model ${model} on ${isLocal ? "local" : "cloud"} failed (${response.status}): ${firstErrText}`);
            lastError = new Error(`Model ${model} returned HTTP ${response.status}`);
            continue;
          }
        }

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Prologue model ${model} on ${isLocal ? "local" : "cloud"} failed (${response.status}): ${errText}`);
          lastError = new Error(`Model ${model} returned HTTP ${response.status}`);
          continue;
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        content = content.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim();

        responseData = JSON.parse(content);
        const userStats = !isLocal && authCheck.valid
          ? recordUserTurn(activeUser.key, data.usage, model)
          : activeUser;
        responseData._userStats = userStats;
        break;
      } catch (err: any) {
        console.warn(`Error generating prologue with model ${model}:`, err.message);
        lastError = err;
      }
    }

    if (!responseData) {
      console.warn("Prologue generation from models was unavailable or failed. Using bespoke canonical heroine dossier baseline.");
      responseData = {
        speaker: heroineDossier.name,
        location: heroineDossier.defaultLocation || startingLocation,
        scene_setup: heroineDossier.canonicalEncounter,
        dialogue: heroineDossier.signatureOpeningDialogue,
        initial_affection: 15,
        initial_mood: heroineDossier.initialMood || "Guarded & Observant",
        expression_key: heroineDossier.defaultExpression || "neutral",
        opening_choices: heroineDossier.baselineChoices,
        initial_quest: heroineDossier.initialQuest,
        system_announcement: `[SYSTEM: Dimensional synchronization complete. Administrator Protocol engaged. Welcome to Astra Continent, ${playerProfile.name}.]`,
        plausibility: 80,
        plausibility_tier: "Stable",
      };
    }

    const defaultQuest = heroineDossier.initialQuest || {
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
    if (responseData.scene_setup) {
      responseData.scene_setup = sanitizeVisualNovelProse(responseData.scene_setup);
    }
    if (responseData.dialogue) {
      responseData.dialogue = enforceSpokenDialogueMasking(
        sanitizeSpokenDialogue(responseData.dialogue),
        playerProfile?.name,
        startingHeroineKnowledge.knowsName
      );
    }
    const combinedOpening = [responseData.scene_setup, responseData.dialogue].filter(Boolean).join("\n\n");
    const separatedPrologue = sanitizeNarrativeAndMechanics(
      combinedOpening,
      responseData.mechanics || responseData.system_announcement
    );
    responseData.narrative = enforceSpokenDialogueMasking(
      separatedPrologue.narrative,
      playerProfile?.name,
      startingHeroineKnowledge.knowsName
    );
    responseData.mechanics = separatedPrologue.mechanics;
    responseData.npc_knowledge_map = initialKnowledgeMap;
    if (Array.isArray(responseData.opening_choices)) {
      responseData.opening_choices = responseData.opening_choices.map((c: string) =>
        ensureChoiceIntentTag(sanitizeVisualNovelProse(c))
      );
    }

    responseData.plausibility = typeof responseData.plausibility === "number" ? responseData.plausibility : 80;
    responseData.plausibility_tier = responseData.plausibility >= 70 ? "Stable" : "Strained";

    if (visualDescription) {
      responseData.visual_description = visualDescription;
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("API /api/prologue Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate dynamic prologue." },
      { status: 500 }
    );
  }
}

