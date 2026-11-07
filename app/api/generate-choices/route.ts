import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";
import { getChoicesStyleDirective, getNarrationProseDirective } from "@/lib/narrationStyles";
import { sanitizeVisualNovelProse, ensureChoiceIntentTag } from "@/lib/proseSanitizer";
import {
  buildDynamicChoiceDirective,
  buildPersonalityFallbackChoices,
  getPersonaVoiceProfile,
  buildProtagonistOriginAndIdentityDirective,
} from "@/lib/personalityArchitect";
import { buildAntiRepetitionDirective } from "@/lib/repetitionGuard";

export const runtime = "nodejs";
export const maxDuration = 60;

const FALLBACK_MODELS = [
  "google/gemini-2.5-flash",
  "deepseek/deepseek-v3.2",
  "thedrummer/cydonia-24b-v4.1",
  "sao10k/l3-lunaris-8b",
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
      // Graceful personality-aware fallback if API key is unconfigured
      return NextResponse.json({
        choices: buildPersonalityFallbackChoices({
          personality: playerProfile?.personality,
          personalityTraits: playerProfile?.personalityTraits,
          playerRole: playerProfile?.role,
          playerRace: playerProfile?.race,
          activeSpeaker: sanitizedSpeaker,
          location: gameState?.location || "this area",
          isProtagonistAlone,
        }),
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

    const choiceDirective = buildDynamicChoiceDirective({
      playerName: playerProfile?.name || "Protagonist",
      playerRole: playerProfile?.role || "Adventurer",
      playerGender: playerProfile?.gender,
      playerAge: playerProfile?.age,
      worldOrigin: playerProfile?.worldOrigin,
      worldOriginDetails: playerProfile?.worldOriginDetails,
      playerRace: playerProfile?.race,
      racialTraits: playerProfile?.racialTraits,
      personality: playerProfile?.personality,
      personalityTraits: playerProfile?.personalityTraits,
      behavioralTendencies: playerProfile?.behavioralTendencies,
      activeStance: playerProfile?.activeStance,
      abilities: playerProfile?.abilities,
      location: gameState?.location || "Uncharted Sector",
      activeSpeaker: sanitizedSpeaker,
      latestDialogue: gameState?.dialogue,
      mood: gameState?.mood,
      isProtagonistAlone,
      presentHeroineNames,
    });

    const originAndIdentityDirective = buildProtagonistOriginAndIdentityDirective(playerProfile);

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

${buildAntiRepetitionDirective(recentHistory, playerProfile?.name || "Protagonist", gameState?.location || "Current Sector")}

${originAndIdentityDirective}

${choiceDirective}

Format Requirement:
- Every choice MUST strictly follow the format: [Tone/Action]: Short summary of character action/dialogue (e.g. "[Traversal/Agile]: Vault across the roof gap toward the canal", "[Combat/Aggressive]: Draw blade and lunge forward", "[Arcana/Analytical]: Channel mana into the containment ward", "[Command/Strategic]: Demand to know which tunnel leads to safety").
- Never output bare single brackets like [Combat] or [Inquire]. Always use the [Tone/Action]: format.
- Each choice must be 1 concise, vivid, natural sentence summarizing the protagonist's intended move or reply that ACTIVELY MOVES THE STORY FORWARD.
- Return strictly JSON matching:
{
  "choices": [string, string, string, string]
}`;

    const personaVoice = getPersonaVoiceProfile(
      playerProfile?.personality,
      playerProfile?.personalityTraits
    );

    const messages = [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: isProtagonistAlone
          ? `Generate 4 dynamic, story-advancing choices for ${playerProfile?.name} exploring ${gameState?.location} alone, voiced strictly in their "${personaVoice.personaTitle}" (${personaVoice.traitsList.join(", ")}) personality.`
          : `Generate 4 distinct, story-advancing choices for ${playerProfile?.name} reacting to ${sanitizedSpeaker}'s dialogue in ${gameState?.location}, voiced strictly in their "${personaVoice.personaTitle}" (${personaVoice.traitsList.join(", ")}) personality and speech cadence.`
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
            repetition_penalty: 1.15,
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
      dynamicChoices = buildPersonalityFallbackChoices({
        personality: playerProfile?.personality,
        personalityTraits: playerProfile?.personalityTraits,
        playerRole: playerProfile?.role,
        playerRace: playerProfile?.race,
        activeSpeaker: sanitizedSpeaker || "Companion",
        location: gameState?.location || "the area",
        isProtagonistAlone,
      });
    }

    // Guarantee all choices conform strictly to [Tone/Action]: format and clean prose
    const sanitizedChoices = dynamicChoices.map((c: string) => {
      const match = c.trim().match(/^\[([A-Za-z0-9\s/]+)\](?::)?\s*(.+)$/);
      if (match) {
        const rawTag = match[1].trim();
        const body = sanitizeVisualNovelProse(match[2].trim());
        return ensureChoiceIntentTag(`[${rawTag}]: ${body}`);
      }
      return ensureChoiceIntentTag(sanitizeVisualNovelProse(c));
    });

    return NextResponse.json({
      success: true,
      choices: sanitizedChoices,
    });
  } catch (error: any) {
    console.error("API /api/generate-choices Error:", error);
    return NextResponse.json(
      {
        choices: [
          `[Inquire/Diplomatic]: Press the speaker on the matters unfolding before you.`,
          `[Pragmatism/Tactical]: Propose a pragmatic mutual alliance under clear conditions.`,
          `[Combat/Defiant]: Prepare your weapons and ready yourself for sudden escalation.`,
          `[Tactics/Caution]: Remain guarded, maintain distance, and evaluate the atmosphere.`,
        ]
      },
      { status: 200 }
    );
  }
}

