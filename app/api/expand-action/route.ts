import { NextResponse } from "next/server";
import { validateUserKey } from "@/lib/userAccess";
import { getNarrationProseDirective } from "@/lib/narrationStyles";
import { sanitizeVisualNovelProse, humanizeGearForProse, humanizeLocationForProse } from "@/lib/proseSanitizer";
import {
  getPersonaVoiceProfile,
  buildProtagonistOriginAndIdentityDirective,
} from "@/lib/personalityArchitect";
import { buildAntiRepetitionDirective } from "@/lib/repetitionGuard";

export const runtime = "nodejs";
export const maxDuration = 60;

const EXPAND_MODELS = [
  "google/gemini-2.5-flash",
  "deepseek/deepseek-v3.2",
  "thedrummer/cydonia-24b-v4.1",
  "sao10k/l3.1-euryale-70b",
  "sao10k/l3-lunaris-8b",
];

const LEGACY_MODEL_MIGRATIONS: Record<string, string> = {
  "nousresearch/hermes-3-llama-3.1-70b": "nousresearch/hermes-4-405b",
  "nousresearch/hermes-3-llama-3.1-405b": "nousresearch/hermes-4-405b",
  "deepseek/deepseek-chat": "deepseek/deepseek-v3.2",
};

function shouldUseJsonObjectFormat(model: string): boolean {
  const m = (model || "").toLowerCase();
  return m.startsWith("google/") || m.includes("gemini") || m.startsWith("openai/");
}

function buildFallbackTwoParagraphAction(params: {
  rawAction: string;
  playerName: string;
  playerRole: string;
  playerRace?: string;
  racialTraits?: string[];
  activeStance?: string;
  location?: string;
  activeSpeaker?: string;
  isProtagonistAlone: boolean;
  personaTitle: string;
}): string {
  const {
    rawAction,
    playerName,
    playerRole,
    playerRace = "Human",
    racialTraits = [],
    activeStance = "neutral",
    location = "the sector",
    activeSpeaker = "the companion",
    isProtagonistAlone,
    personaTitle,
  } = params;

  const playerFirstName = (playerName || "The protagonist").trim().split(/\s+/)[0] || playerName;
  const speakerFirstName = (activeSpeaker || "the companion").trim().split(/\s+/)[0] || activeSpeaker;
  const naturalLoc = humanizeLocationForProse(location);

  const cleanSummary = rawAction.replace(/^\[[^\]]+\](?::)?\s*/, "").trim();
  const quotedMatch = cleanSummary.match(/"([^"]+)"|'([^']+)'/);
  const extractedQuote = quotedMatch ? (quotedMatch[1] || quotedMatch[2]).trim() : null;

  const stancePhrase =
    activeStance === "aggressive" || activeStance === "flame"
      ? "shifting into a forward-driving offensive stance with weapon poised to strike"
      : activeStance === "defensive" || activeStance === "frost"
      ? "settling into a grounded, warded guard with weight balanced low across the flagstones"
      : "squaring shoulders with measured, deliberate composure";

  const traitFlavor =
    racialTraits.length > 0
      ? `Keen ${playerRace.toLowerCase()} instincts sharpen every sensory detail (${racialTraits.slice(0, 2).join(", ").toLowerCase()}) as `
      : `Trained instincts sharpen every sensory detail as `;

  const paragraph1 = `${traitFlavor}${playerFirstName} steps forward through ${naturalLoc}, ${stancePhrase}. Every movement carries a ${personaTitle.toLowerCase()} bearing, reading the sightlines and ambient tension of the immediate surroundings before committing to the maneuver. ${cleanSummary.replace(/"[^"]+"/g, "").replace(/'[^']+'/g, "").trim() || `With practiced precision, ${playerFirstName} closes the distance and seizes the initiative.`}`;

  const spokenLine =
    extractedQuote ||
    (isProtagonistAlone
      ? `The trail doesn't end here. Whatever is waiting deeper inside, I'm going to draw it into the light.`
      : `Listen closely, ${speakerFirstName}. We handle this on my terms—stay sharp and watch the perimeter while we make our move.`);

  const paragraph2 = isProtagonistAlone
    ? `Drawing a slow, steadying breath against the chill air, ${playerFirstName}'s gaze locks onto the path ahead with unflinching resolve. "${spokenLine}" The quiet declaration hangs in the air for a beat before ${playerFirstName} advances another step, ready for whatever answers from the shadows.`
    : `Meeting ${speakerFirstName}'s gaze without a flicker of hesitation, ${playerFirstName} lets the weight of the moment settle between them before speaking in a steady, resonant voice. "${spokenLine}" Holding that eye contact for a deliberate beat, ${playerFirstName} waits for her answer.`;

  return `${ sanitizeVisualNovelProse(paragraph1) }\n\n${ sanitizeVisualNovelProse(paragraph2) }`;
}

export async function POST(req: Request) {
  try {
    const headerKey = req.headers.get("x-user-key");
    const body = await req.json();

    const {
      action = "",
      playerProfile,
      gameState,
      partyMembers = [],
      activeStance = "neutral",
      narrationStyle,
      recentHistory = [],
      targetEnvironment = "cloud",
      modelId,
      temperature,
      repetition_penalty,
      userAccessKey,
    } = body;

    const playerName = playerProfile?.name || "The Protagonist";
    const playerRole = playerProfile?.role || "Adventurer";
    const playerRace = playerProfile?.race || "Human";
    const racialTraits: string[] = Array.isArray(playerProfile?.racialTraits) ? playerProfile.racialTraits : [];
    const location = gameState?.location || "Uncharted Sector";

    const physicallyPresentCompanions = (partyMembers || []).filter((c: any) => Boolean(c.isPresent));
    const isProtagonistAlone = physicallyPresentCompanions.length === 0;
    const presentHeroineNames = physicallyPresentCompanions.map((c: any) => c.name);

    let sanitizedSpeaker = gameState?.speaker || "Narrator";
    if (sanitizedSpeaker.trim().toLowerCase() === playerName.trim().toLowerCase()) {
      sanitizedSpeaker = isProtagonistAlone ? "Narrator" : (presentHeroineNames[0] || "Narrator");
    }

    const personaVoice = getPersonaVoiceProfile(
      playerProfile?.personality,
      playerProfile?.personalityTraits
    );

    let effectiveEnvironment = targetEnvironment;
    if (effectiveEnvironment === "local" && modelId && modelId.includes("/")) {
      effectiveEnvironment = "cloud";
    }
    const isLocal = effectiveEnvironment === "local";

    const accessKey = headerKey || userAccessKey;
    const authCheck = validateUserKey(accessKey);
    const apiKey = process.env.OPENROUTER_API_KEY;

    if ((!isLocal && !authCheck.valid) || (!isLocal && !apiKey)) {
      const fallbackText = buildFallbackTwoParagraphAction({
        rawAction: action,
        playerName,
        playerRole,
        playerRace,
        racialTraits,
        activeStance,
        location,
        activeSpeaker: sanitizedSpeaker,
        isProtagonistAlone,
        personaTitle: personaVoice.personaTitle,
      });
      return NextResponse.json({
        success: true,
        expanded_action: fallbackText,
      });
    }

    const effectiveTone = narrationStyle || playerProfile?.narrationStyle || "Grimdark & Atmospheric";
    const effectiveTemperature = typeof temperature === "number" ? Math.max(0.2, Math.min(1.5, temperature)) : 0.8;
    const effectiveRepetitionPenalty = typeof repetition_penalty === "number" ? Math.max(1.0, Math.min(1.4, repetition_penalty)) : 1.12;

    const visibleWeapon = humanizeGearForProse(playerProfile?.gear?.weapon, "unarmed stance");
    const visibleArmor = humanizeGearForProse(playerProfile?.gear?.armor, "traveler attire");
    const naturalLocation = humanizeLocationForProse(location);
    const playerFirstName = playerName.trim().split(/\s+/)[0] || playerName;
    const speakerFirstName = sanitizedSpeaker.trim().split(/\s+/)[0] || sanitizedSpeaker;
    const originAndIdentityDirective = buildProtagonistOriginAndIdentityDirective(playerProfile);

    const systemPrompt = `You are the Protagonist Action & Dialogue Author for an interactive dark fantasy visual novel.
${getNarrationProseDirective(effectiveTone, "standard")}

Your sole task is to expand the player's selected choice vector into an immersive, publication-grade **2-paragraph protagonist action and spoken dialogue passage** from ${playerFirstName}'s perspective so the player can review and edit it before sending.

--- PROTAGONIST PROFILE ---
- First Name (Use this in prose): ${playerFirstName} (Full Name: ${playerName} — do NOT repeat their surname in narrative prose)
- Gender & Age: ${playerProfile?.gender || "Male"} | Age: ${playerProfile?.age || "22"}
- World Origin & System Familiarity: ${playerProfile?.worldOrigin || "Born & Raised (Native)"}${playerProfile?.worldOriginDetails ? ` (${playerProfile.worldOriginDetails})` : ""}
- Class / Archetype: ${playerRole} (Lv.${playerProfile?.level || 1})
- Lineage / Species: ${playerRace}${racialTraits.length > 0 ? ` (Biological Traits: ${racialTraits.join(", ")})` : ""}
- Chosen Personality: "${personaVoice.personaTitle}" [${personaVoice.traitsList.join(", ")}]
- Speech Cadence: ${personaVoice.speechCadence}
- Demeanor & Worldview: ${personaVoice.attitudeAndWorldview}
- Active Stance: [${(activeStance || "neutral").toUpperCase()}]
- Physical Gear Description: ${visibleWeapon} | ${visibleArmor}

${originAndIdentityDirective}

--- ACTIVE SCENE CONTEXT ---
- Setting: ${naturalLocation}
- Scene Presence: ${isProtagonistAlone ? "Protagonist is PHYSICALLY ALONE" : `Standing with: ${presentHeroineNames.map((n: string) => n.trim().split(/\s+/)[0]).join(", ")} (Active Companion: ${speakerFirstName})`}
${Array.isArray(playerProfile?.pinnedMemories) && playerProfile.pinnedMemories.length > 0 ? `- Pinned Core Canon Facts: ${playerProfile.pinnedMemories.join(" | ")}\n` : ""}- Latest Scene / Companion Beat:
"${(gameState?.dialogue || "").slice(-600)}"

${buildAntiRepetitionDirective(recentHistory, playerFirstName, naturalLocation)}

--- MANDATORY 2-PARAGRAPH STRUCTURE & HUMAN-PROSE CONSTRAINTS ---
1. EXACTLY 2 RICH PARAGRAPHS (6 to 10 sentences total), separated by a double line break ("\\n\\n"):
   - PARAGRAPH 1 (Physical Choreography, Sensory Grounding & Tactical Presence): Describe ${playerFirstName}'s physical movements, posture, natural weapon handling (${visibleWeapon}), anatomical/lineage sensory awareness (${playerRace}), and spatial maneuvering as they execute the chosen intent.
   - PARAGRAPH 2 (Spoken Dialogue & Psychological Delivery): Include ${playerFirstName}'s actual spoken dialogue enclosed in standard double quotation marks ("...") voiced unmistakably in their "${personaVoice.personaTitle}" (${personaVoice.traitsList.join(", ")}) cadence, anchored to facial micro-expressions, eye contact with ${speakerFirstName}, and vocal tone.
2. NATURAL HUMAN DICTION (CRITICAL):
   - Refer to the protagonist strictly by first name ("${playerFirstName}") and pronouns, and refer to companions by their first name ("${speakerFirstName}")—NEVER repeat full first+last names ("${playerName}", "${sanitizedSpeaker}").
   - NEVER paste capitalized inventory item strings, class titles, or map banner headers into the prose. Describe weapons, clothing, and surroundings naturally like a human novelist (e.g., "his blade", "her gloved wrist", "the stone floor", "the damp air").
3. STRICT BOUNDARIES:
   - Write ONLY ${playerFirstName}'s action, internal focus, and spoken dialogue.
   - DO NOT narrate ${speakerFirstName}'s reply or decide the outcome of the companion's reaction yet (the companion will react after the user sends this turn).
   - DO NOT include bracket tags like "[Combat/Aggressive]:" or Markdown asterisks (* or **).
   - Respond strictly in JSON matching:
{
  "expanded_action": "Paragraph 1...\\n\\nParagraph 2..."
}`;

    const normalizedRequestedModel = modelId ? (LEGACY_MODEL_MIGRATIONS[modelId] || modelId) : "";
    const effectiveModelId =
      normalizedRequestedModel === "orchestrated-hybrid" || !normalizedRequestedModel
        ? "google/gemini-2.5-flash"
        : normalizedRequestedModel === "orchestrated-hybrid-deepseek"
        ? "deepseek/deepseek-v3.2"
        : normalizedRequestedModel;
    const modelsToTry = isLocal
      ? [effectiveModelId || "hermes3:8b"]
      : [effectiveModelId, ...EXPAND_MODELS.filter((m) => m !== effectiveModelId)];

    let expandedText: string | null = null;

    for (let modelIdx = 0; modelIdx < modelsToTry.length; modelIdx++) {
      const model = modelsToTry[modelIdx];
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

        const isAnthropicModel = model.toLowerCase().includes("claude") || model.toLowerCase().startsWith("anthropic/");
        const useJsonFormat = shouldUseJsonObjectFormat(model);

        const response = await fetch(fetchUrl, {
          method: "POST",
          headers,
          signal: AbortSignal.timeout(isLocal ? 30000 : modelIdx === 0 ? 18000 : 12000),
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Selected Choice Vector: "${action}"\n\nExpand this choice into a vivid 2-paragraph protagonist action and spoken dialogue passage for ${playerName} (${personaVoice.personaTitle}). Separate the 2 paragraphs with "\\n\\n". Do NOT include bracket tags or companion reactions.`,
              },
            ],
            temperature: effectiveTemperature,
            max_tokens: 768,
            ...(isAnthropicModel ? {} : { repetition_penalty: effectiveRepetitionPenalty }),
            ...(useJsonFormat ? { response_format: { type: "json_object" } } : {}),
            ...(isLocal ? {} : { provider: { allow_fallbacks: true, sort: "throughput" } }),
          }),
        });

        if (!response.ok) continue;

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        content = content.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim();

        let parsed: any = null;
        try {
          parsed = JSON.parse(content);
        } catch {
          const firstBrace = content.indexOf("{");
          const lastBrace = content.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            try {
              parsed = JSON.parse(content.slice(firstBrace, lastBrace + 1));
            } catch {
              const match = content.match(/"expanded_action"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/);
              if (match && match[1]) {
                parsed = {
                  expanded_action: match[1]
                    .replace(/\\n/g, "\n")
                    .replace(/\\"/g, '"')
                    .replace(/\\'/g, "'"),
                };
              }
            }
          } else if (!content.startsWith("[") && content.length > 60) {
            parsed = { expanded_action: content };
          }
        }

        const candidate = parsed?.expanded_action || parsed?.player_execution || parsed?.text || "";
        if (typeof candidate === "string" && candidate.trim().length > 40) {
          expandedText = sanitizeVisualNovelProse(candidate.trim());
          break;
        }
      } catch (err: any) {
        console.warn(`[ExpandAction] Model ${model} failed:`, err?.message);
      }
    }

    if (!expandedText) {
      expandedText = buildFallbackTwoParagraphAction({
        rawAction: action,
        playerName,
        playerRole,
        playerRace,
        racialTraits,
        activeStance,
        location,
        activeSpeaker: sanitizedSpeaker,
        isProtagonistAlone,
        personaTitle: personaVoice.personaTitle,
      });
    }

    return NextResponse.json({
      success: true,
      expanded_action: expandedText,
    });
  } catch (error: any) {
    console.error("API /api/expand-action Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to expand protagonist action." },
      { status: 500 }
    );
  }
}

