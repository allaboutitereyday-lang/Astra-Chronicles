import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";
import { getChoicesStyleDirective, getNarrationProseDirective } from "@/lib/narrationStyles";

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
      storyContext,
      gameState,
      playerProfile,
      partyMembers = [],
      memories = [],
      recentHistory = [],
      systemState,
      userAccessKey,
      narrationStyle,
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

    // Track physical presence of companions in the active scene
    const physicallyPresentCompanions = (partyMembers || []).filter((c: any) => Boolean(c.isPresent));
    const isProtagonistAlone = physicallyPresentCompanions.length === 0;
    const presentHeroineNames = physicallyPresentCompanions.map((c: any) => c.name);

    let sanitizedSpeaker = gameState?.speaker || "Narrator";
    if (playerProfile?.name && sanitizedSpeaker.trim().toLowerCase() === playerProfile.name.trim().toLowerCase()) {
      sanitizedSpeaker = isProtagonistAlone ? "Narrator" : (presentHeroineNames[0] || "Narrator");
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      // Graceful fallback if API key is unconfigured
      return NextResponse.json({
        choices: isProtagonistAlone
          ? [
              `[Survey] Scrutinize the surroundings in ${gameState?.location || "this area"} for hidden runes, traps, or anomalies.`,
              `[Tactics] Stay low and steady your breathing, securing a quiet defensive perimeter.`,
              `[System] Check the LitRPG interface to analyze causal stability and active directives.`,
              `[Action] Draw your weapon and advance cautiously into the quiet expanse.`,
            ]
          : [
              `[Inquire] Press ${sanitizedSpeaker} on the deeper implications of what was just disclosed in ${gameState?.location || "this area"}.`,
              `[Pragmatism] Evaluate the tactical stakes and propose a calculated compromise with ${sanitizedSpeaker}.`,
              `[Action] Step forward as a ${playerProfile?.role || "wanderer"} and assert your intent directly.`,
              `[Empathy] Read ${sanitizedSpeaker}'s expression and look for unspoken motives behind their demeanor.`,
            ],
      });
    }

    const storyTitle = storyContext?.title || "Astra Chronicles";
    const settingName = storyContext?.worldContext?.settingName || "the world";
    const effectiveTone = narrationStyle || playerProfile?.narrationStyle || storyContext?.narrationStyle || "Grimdark & Atmospheric";

    const presentCompanions = physicallyPresentCompanions.length > 0
      ? physicallyPresentCompanions
          .map((c: any) => `${c.name} (${c.title || c.role || "Companion"}, Favor: ${c.affection}%)`)
          .join(", ")
      : "None present (Protagonist is PHYSICALLY ALONE)";

    const activeQuests = systemState?.activeQuests && systemState.activeQuests.length > 0
      ? systemState.activeQuests.map((q: any) => `- [${q.difficulty}-Rank] "${q.title}": ${q.description}`).join("\n")
      : "- No active scenario directives.";

    const canonicalMemories = Array.isArray(memories) && memories.length > 0
      ? memories.slice(-10).map((m: string) => `- ${m}`).join("\n")
      : "- Journey commenced.";

    const recentExchanges = Array.isArray(recentHistory) && recentHistory.length > 0
      ? recentHistory.slice(-6).map((h: any) => `${h.speaker}: "${h.text}"`).join("\n")
      : `Scene: ${sanitizedSpeaker}: "${gameState?.dialogue || "..."}"`;

    const choiceDirective = isProtagonistAlone
      ? `--- CHOICE AUTHORING DIRECTIVE (PROTAGONIST IS PHYSICALLY ALONE) ---
The protagonist (${playerProfile?.name || "Protagonist"}) is navigating ${gameState?.location || "this sector"} COMPLETELY ALONE.
- Absolutely DO NOT author options that address, speak to, inquire of, or converse with absent heroines (e.g. Serena, Aria, Evelyn, etc.).
- Generate exactly 4 distinct, immersive options tailored to solitary exploration, environmental examination, stealth/traps, LitRPG System analysis, or personal contemplation:
  1. [Survey / Lore]: Examining ancient architecture, inscriptions, strange footprints, or planar resonance.
  2. [Tactics / Stealth]: Checking vantage points, securing a perimeter, or moving silently through the shadows.
  3. [LitRPG / System]: Probing the System interface, evaluating causal plausibility, or priming an ability.
  4. [Action / Resolve]: Advancing decisively with weapon at the ready, determined to press onward alone.`
      : `--- CHOICE AUTHORING DIRECTIVE (ACCOMPANIED BY ${presentHeroineNames.join(", ")}) ---
Generate exactly 4 distinct, context-aware options that directly and compellingly respond to what ${sanitizedSpeaker} just said and the immediate situation in ${gameState?.location}.
Prefix each choice with a tactical/roleplay bracket tag indicating the vector of action:
1. [Inquire / Lore]: Probing, questioning, or pressing ${sanitizedSpeaker} about secrets, terms, or ancient lore.
2. [Pragmatism / Tactics]: Proposing a grounded compromise, tradecraft, preparation, or conditional alliance.
3. [Bold / Action]: Taking decisive physical action, asserting authority, casting a spell, or demonstrating resolve.
4. [Empathy / Intuition]: Reading ${sanitizedSpeaker}'s emotional state, appealing to shared survival, or forming an emotional bond.`;

    const systemPrompt = `You are the Interactive Decision Architect and Game Master for "${storyTitle}", set in ${settingName}.
Atmospheric Tone: ${effectiveTone}.
Style Directive: ${getChoicesStyleDirective(effectiveTone)}

The player is loading into a saved game state. Your sole task is to dynamically author exactly 4 distinct, immersive, and situationally tailored dialogue and action choices for the protagonist (${playerProfile?.name || "Protagonist"}).

--- CURRENT SCENE SNAPSHOT ---
- Location: ${gameState?.location || "Starting Point"}
- Active Speaker: ${sanitizedSpeaker}
- Latest Spoken Dialogue / Narrative Event:
"${gameState?.dialogue || "..."}"
- Mood / Atmosphere: ${gameState?.mood || "Tense"}
- Companions Present: ${presentCompanions}
- Protagonist: ${playerProfile?.name} (Lv.${playerProfile?.level || 1} ${playerProfile?.role || "Adventurer"})
- Active Quests & Directives:
${activeQuests}

--- RECENT CONTEXT & MEMORIES ---
Recent Exchanges:
${recentExchanges}

Chronological Memories & Past Interactions:
${canonicalMemories}

${choiceDirective}

Requirements:
- Each choice must be 1-2 vivid, natural sentences written from ${playerProfile?.name}'s perspective.
- Each option must address the exact specifics of the scene, not generic placeholder text.
- Return strictly JSON matching:
{
  "choices": [string, string, string, string]
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: isProtagonistAlone
          ? `Generate 4 dynamic contextual choices for ${playerProfile?.name} exploring ${gameState?.location} alone.`
          : `Generate the 4 dynamic contextual choices for ${playerProfile?.name} reacting to ${sanitizedSpeaker}'s dialogue in ${gameState?.location}.`
      }
    ];

    let dynamicChoices = null;

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
            temperature: 0.85,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        content = content.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim();

        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.choices) && parsed.choices.length === 4) {
          dynamicChoices = parsed.choices;
          recordUserTurn(activeUser.key, data.usage, model);
          break;
        }
      } catch (err: any) {
        console.warn(`Choice generation fallback on model ${model}:`, err.message);
      }
    }

    if (!dynamicChoices) {
      // High-quality contextual algorithmic fallback
      const speaker = gameState?.speaker || "Companion";
      const loc = gameState?.location || "the area";
      const role = playerProfile?.role || "Wanderer";
      dynamicChoices = [
        `[Inquire] Press ${speaker} on the deeper implications of what was just disclosed.`,
        `[Pragmatism] Evaluate the physical stakes in ${loc} and propose a balanced counter-term.`,
        `[Action] Ready your stance as a ${role} and demand immediate clarity on the next move.`,
        `[Observe] Scrutinize ${speaker}'s expression and look for unspoken motives behind their demeanor.`,
      ];
    }

    return NextResponse.json({
      success: true,
      choices: dynamicChoices,
    });
  } catch (error: any) {
    console.error("API /api/generate-choices Error:", error);
    return NextResponse.json(
      {
        choices: [
          `[Inquire] Press the speaker on the matters unfolding before you.`,
          `[Pragmatism] Propose a pragmatic mutual alliance under clear conditions.`,
          `[Action] Prepare your weapons and ready yourself for sudden escalation.`,
          `[Caution] Remain guarded, maintain distance, and evaluate the atmosphere.`,
        ]
      },
      { status: 200 }
    );
  }
}

