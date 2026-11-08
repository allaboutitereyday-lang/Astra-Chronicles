import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";
import { evaluateRelicSynergies, buildSynergyPromptDirective } from "@/lib/relicSynergies";
import { getNarrationProseDirective, NarrativeDepthMode } from "@/lib/narrationStyles";
import { describeProtagonistAvatar, isFallbackVisualDescription } from "@/lib/visionEncoder";
import { sanitizeVisualNovelProse, ensureChoiceIntentTag, sanitizeNarrativeAndMechanics } from "@/lib/proseSanitizer";
import { generateCrossTalkBanterDirective, evaluateInterpersonalFriction } from "@/lib/companionFriction";
import { executeCausalCovenant } from "@/lib/causalCovenant";
import {
  createDefaultNpcKnowledgeMap,
  evaluateActionForKnowledgeUnlocks,
  applyLlmKnowledgeUnlocks,
  buildKnowledgeGateDirective,
  getCompanionKnowledge,
  enforceSpokenDialogueMasking,
} from "@/lib/knowledgeGating";
import {
  evaluatePlayerVitalsCondition,
  inferFallbackVitalsDelta,
  resolveHostileEncounterEscalation,
} from "@/lib/vitalsAndEncounters";
import {
  buildPersonaPromptDossier,
  buildActiveSpeakerPersonaLock,
} from "@/lib/characterPersonas";
import {
  detectContextualEquipmentAcquisition,
  buildEarnedRomancePacingDirective,
  getHeroineResistanceProfile,
} from "@/lib/progressionMechanics";
import {
  buildDynamicChoiceDirective,
  getPersonaVoiceProfile,
  buildProtagonistOriginAndIdentityDirective,
  buildPersonalityFallbackChoices,
} from "@/lib/personalityArchitect";
import {
  buildPlausibilityCapabilityEnvelope,
  sanitizePlausibilityEvaluation,
} from "@/lib/plausibilityEngine";
import {
  buildAntiRepetitionDirective,
  detectRepetitionLoop,
  breakStagnationLoop,
} from "@/lib/repetitionGuard";
import { parseModelJsonLenient } from "@/lib/jsonSalvage";
import {
  buildPortSolarisTurnDirective,
  calculateBpmDelta,
  getBpmZone,
  calculateDailyCafeRevenue,
  getShortCircuitDirective,
} from "@/lib/portSolarisEngine";
import { PORT_SOLARIS_HEROINE_DOSSIERS } from "@/types/port_solaris";

export const runtime = "nodejs";
export const maxDuration = 90;

const FALLBACK_MODELS = [
  "google/gemini-2.5-flash",
  "deepseek/deepseek-v3.2",
  "thedrummer/cydonia-24b-v4.1",
  "sao10k/l3.1-euryale-70b",
  "anthracite-org/magnum-v4-72b",
  "sao10k/l3-lunaris-8b",
];

const LEGACY_MODEL_MIGRATIONS: Record<string, string> = {
  "nousresearch/hermes-3-llama-3.1-70b": "nousresearch/hermes-4-405b",
  "nousresearch/hermes-3-llama-3.1-405b": "nousresearch/hermes-4-405b",
  "deepseek/deepseek-chat": "deepseek/deepseek-v3.2",
};

export async function POST(req: Request) {
  try {
    const headerKey = req.headers.get("x-user-key");
    const body = await req.json();

    const {
      action,
      isCustom = false,
      gameState,
      partyMembers = [],
      playerProfile,
      playerAvatarBase64,
      narrationStyle,
      plotMemories = [],
      recentHistory = [],
      userAccessKey,
      systemState,
      storyContext,
      activeSynergies,
      // Major Expansion Fields
      timelineEchoes = [],
      activeStance = "neutral",
      giftItemContext = null, // { itemName: string, itemDescription: string, itemRarity: string, recipientCompanionName: string, reactionPrompt: string }
      targetEnvironment = "cloud",
      modelId,
      // System Evolution Fields (Pillars A, B, C)
      timelineScars = [],
      covenantAction = null,
      activeClash = null,
      frictionState = null,
      currentTurnNumber = 1,
      temperature,
      max_tokens,
      repetition_penalty,
      narrativeDepth,
      npcKnowledgeMap = null,
    } = body;

    const effectiveTemperature = typeof temperature === "number" ? Math.max(0.1, Math.min(1.8, temperature)) : 0.75;
    const effectiveNarrativeDepth: NarrativeDepthMode =
      narrativeDepth === "standard" || narrativeDepth === "expansive" || narrativeDepth === "deep_novelistic"
        ? narrativeDepth
        : "deep_novelistic";
    const requestedMaxTokens = typeof max_tokens === "number" ? Math.max(1024, Math.min(4096, max_tokens)) : 3584;
    const effectiveMaxTokens =
      effectiveNarrativeDepth === "deep_novelistic"
        ? Math.max(3584, requestedMaxTokens)
        : effectiveNarrativeDepth === "expansive"
        ? Math.max(2560, requestedMaxTokens)
        : requestedMaxTokens;
    const effectiveRepetitionPenalty = typeof repetition_penalty === "number" ? Math.max(1.0, Math.min(1.5, repetition_penalty)) : 1.1;
    const paragraphSpecLabel =
      effectiveNarrativeDepth === "standard"
        ? "2 to 3 evocative paragraphs"
        : effectiveNarrativeDepth === "expansive"
        ? "3 to 5 detailed paragraphs (approx. 300–450 words)"
        : "5 to 7+ rich, novel-length paragraphs (450–800+ words) with multi-stage dialogue";

    // Smart auto-detection: If targetEnvironment is local but modelId has a cloud slug (e.g. sao10k/...),
    // auto-route to cloud!
    let effectiveEnvironment = targetEnvironment;
    if (effectiveEnvironment === "local" && modelId && modelId.includes("/")) {
      console.warn(`Local environment requested with cloud model ID "${modelId}". Auto-routing to cloud.`);
      effectiveEnvironment = "cloud";
    }
    const isLocal = effectiveEnvironment === "local";

    const computedSynergies = activeSynergies && activeSynergies.length > 0
      ? activeSynergies
      : evaluateRelicSynergies(playerProfile?.inventory || [], playerProfile?.gear);
    const synergyDirective = buildSynergyPromptDirective(computedSynergies);

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

    const storyTitle = storyContext?.title || "Astra Chronicles";
    const settingName = storyContext?.worldContext?.settingName || "the Astra Continent";
    const effectiveTone = narrationStyle || storyContext?.narrationStyle || "Grimdark & Atmospheric";

    // Track physical presence of companions in the active scene
    const physicallyPresentCompanions = (partyMembers || []).filter((c: any) => Boolean(c.isPresent));
    const isProtagonistAlone = physicallyPresentCompanions.length === 0;
    const presentHeroineNames = physicallyPresentCompanions.map((c: any) => c.name);

    // Sanitize active speaker context to ensure protagonist is never passed as active speaker
    let sanitizedContextSpeaker = gameState?.speaker;
    if (!sanitizedContextSpeaker || sanitizedContextSpeaker.trim().toLowerCase() === playerProfile.name.trim().toLowerCase()) {
      sanitizedContextSpeaker = isProtagonistAlone ? "Narrator" : (presentHeroineNames[0] || "Narrator");
    }

    const mergedCompanionsForDossier = (storyContext?.companions || []).map((sc: any) => {
      const liveMatch = (partyMembers || []).find(
        (pm: any) => pm.name && sc.name && pm.name.toLowerCase() === sc.name.toLowerCase()
      );
      return {
        ...sc,
        isPresent: liveMatch ? Boolean(liveMatch.isPresent) : Boolean(sc.isPresent),
      };
    });

    const companionDossiers = buildPersonaPromptDossier(
      mergedCompanionsForDossier,
      sanitizedContextSpeaker
    );

    const personaVoice = getPersonaVoiceProfile(
      playerProfile?.personality,
      playerProfile?.personalityTraits
    );
    const playerFirstName = (playerProfile?.name || "Wanderer").trim().split(/\s+/)[0] || playerProfile.name;

    // Dynamic player input directive
    const inputHandlingInstruction = isCustom
      ? `[INPUT TYPE: CUSTOM PLAYER ACTION]
The user wrote their own action verbatim: "${action}".
- Do NOT rewrite, expand, paraphrase, or narrate what the player does or says.
- Set "player_execution" to null.
- Accept their action as immediate canon and advance the scene through world and NPC reactions in "narrative_text".`
      : `[INPUT TYPE: PRESET CHOICE VECTOR SELECTED]
The user selected this choice/action vector: "${action}".
- CRITICAL: The user did NOT type this text verbatim. This prompt vector represents their tactical and narrative intent following the format "[Tone/Action]: Short summary of character action/dialogue".
- In "player_execution", you MUST write a substantial, immersive narrative sequence from the protagonist's perspective (${playerFirstName}, Role: ${playerProfile.role}, Chosen Personality: "${personaVoice.personaTitle}" [${personaVoice.traitsList.join(", ")}], Stance: ${activeStance || "neutral"}).
- PERSONALITY VOICE MANDATE FOR "player_execution":
  * Speech Cadence: ${personaVoice.speechCadence}
  * Demeanor: ${personaVoice.attitudeAndWorldview}
  * Every spoken line and physical gesture in "player_execution" MUST sound unmistakably like a "${personaVoice.personaTitle}" (${personaVoice.traitsList.join(", ")}).
- LENGTH & SUBSTANCE REQUIREMENT: Write **2 full, vivid paragraphs (6 to 10 sentences total)** separated by "\\n\\n".
- CONTENT REQUIREMENTS FOR "player_execution":
  1. Paragraph 1 (Physical Action, Tactical Stance & Sensory Presence): Describe ${playerFirstName}'s physical movements, natural weapon/gear handling, posture, footsteps, spatial maneuvering, and sensory observations matching their "${personaVoice.personaTitle}" demeanor.
  2. Paragraph 2 (Spoken Dialogue & Psychological Delivery): Include ${playerFirstName}'s actual spoken dialogue in quotation marks ("...") addressing the companion, enemies, or situation in their "${personaVoice.personaTitle}" voice, anchored to facial expression and vocal tone.
  3. STRICT NEGATIVE CONSTRAINTS:
     - NEVER output only 1 short paragraph or 1–2 brief sentences. Always write 2 distinct paragraphs separated by "\\n\\n".
     - NEVER repeat full first+last character names ("${playerProfile.name}") or paste capitalized UI equipment/location catalog labels into prose. Refer to ${playerFirstName} and companions by their first names, and describe weapons, clothing, and rooms naturally ("his blade", "her gloved wrist", "the stone floor").
     - NEVER include bracket tags like "[Combat/Aggressive]:", "[Arcana/Analytical]:", "[Subterfuge/Cunning]:" in "player_execution". Strip all tag markers.
     - NEVER summarize with meta commentary like "The player chooses to...". Write directly as immersive narrative prose and dialogue.
- Follow up in "narrative_text" with how the world and companion respond to this execution.`;

    const isFirstEncounter = !recentHistory || recentHistory.length <= 1;

    // Inspect uploaded protagonist avatar if present using fast vision encoder (cached by image content on server)
    let visualDescription: string | null =
      playerProfile?.visualDescription && !isFallbackVisualDescription(playerProfile.visualDescription)
        ? playerProfile.visualDescription
        : null;
    if (playerAvatarBase64) {
      try {
        const freshDesc = await describeProtagonistAvatar(
          playerAvatarBase64,
          playerProfile?.name || "The Protagonist",
          playerProfile?.role || "Adventurer",
          apiKey,
          playerProfile?.race || "Human",
          playerProfile?.racialTraits || []
        );
        if (freshDesc) {
          visualDescription = freshDesc;
        }
      } catch (vErr: any) {
        console.warn("[Turn API] Failed to encode avatar with vision:", vErr?.message);
      }
    }

    const isUncladOrNude = Boolean(
      visualDescription &&
      (visualDescription.toLowerCase().includes("nude") ||
       visualDescription.toLowerCase().includes("unclad") ||
       visualDescription.toLowerCase().includes("naked") ||
       visualDescription.toLowerCase().includes("bare skin") ||
       visualDescription.toLowerCase().includes("bare chest") ||
       visualDescription.toLowerCase().includes("bare-chested") ||
       visualDescription.toLowerCase().includes("without clothing"))
    );

    const visualInspectionInstruction = visualDescription && isFirstEncounter
      ? `--- PROTAGONIST VISUAL APPEARANCE (FIRST ENCOUNTER OBSERVATION) ---
Detailed visual appearance of ${playerProfile.name}:
"${visualDescription}"
CRITICAL FIRST ENCOUNTER DIRECTIVE: The active speaker (${sanitizedContextSpeaker}) MUST naturally observe and comment on ${playerProfile.name}'s specific visual features (attire or lack thereof, physical build, hair/eyes, visible weapons, or demeanor) in their dialogue or narrative prose.${isUncladOrNude ? ` If ${playerProfile.name} is completely unclad, nude, or lacking armor/clothing, ${sanitizedContextSpeaker} MUST strongly and authentically react to this blatant lack of clothing true to their persona (e.g. aristocratic disgust, sardonic mockery, flustered shock, or predatory intrigue).` : ""}`
      : (playerAvatarBase64 && isFirstEncounter)
      ? `--- FIRST ENCOUNTER APPEARANCE DIRECTIVE ---
This is the initial meeting with the protagonist (${playerProfile.name}).
- Portray the character with the physical bearing, attire (or lack of clothing if unclad), and combat readiness of their role (${playerProfile.role}).
- The active speaker (${sanitizedContextSpeaker}) should naturally observe and comment on the protagonist's initial appearance in their dialogue or narrative prose.`
      : `--- APPEARANCE & ANTI-FIXATION DIRECTIVE ---
- Protagonist reference traits (for continuity only): ${visualDescription ? visualDescription.slice(0, 220) : `${playerProfile.gender || "Male"} ${playerProfile.race || "Human"} ${playerProfile.role}`}.
- CRITICAL: Do NOT repeatedly re-describe or fixate on the same physical traits of ${playerFirstName} (such as scars, dreadlocks/hair, biceps, or jacket/attire) that were already mentioned in recent turns. Keep the focus strictly on the new action, dialogue, and advancing the scene.`;

    const speciesPhysiologyDirective = `--- PROTAGONIST LINEAGE & ANATOMICAL PHYSIOLOGY DIRECTIVE ---
- Lineage: ${playerProfile.race || "Human"}
${playerProfile.racialTraits && playerProfile.racialTraits.length > 0 ? `- Biological Characteristics: ${playerProfile.racialTraits.join(", ")}` : ""}
- Biological Consistency: When portraying ${playerProfile.name}'s actions, sensory perception (smell, hearing, thermal cues, night vision), physical reactions, or movements (e.g. lupine/canine gait, tail posture, ears twitching, baring fangs, unsheathing claws, flexed wings, glowing slit eyes, scales), remain physically authentic to their ${playerProfile.race || "Human"} anatomy.
- World & Companion Perception: Companions and NPCs naturally perceive and react to this lineage (e.g., recognizing beastkin/lycan predatory instincts and acute olfactory tracking, demonic fiend heritage, high elven grace, etc.).
- Intimate & Close Proximity Scenes: In romantic, sensory, or high-intimacy encounters, physical interactions must reflect their unique physiology (e.g. running fingers through fur, sensitive ear twitches, animal body heat, fangs grazing skin, purring or deep guttural rumbles).`;

    const compatibilityDirective = storyContext?.companions && storyContext.companions.length > 0
      ? storyContext.companions.map((c: any) => `- ${c.name}: Values ${c.values?.join(", ") || "Honor, Loyalty"}. Dislikes ${c.dislikes?.join(", ") || "Deceit, Cowardice"}.`).join("\n")
      : `- Evelyn Abbandonato: Values intellect, arcane precision, subtle manipulation, composure. Dislikes crude brute force, groveling, or blind obedience.
- Aria Shadowthorn: Values pragmatism, stealth, tradecraft, quiet competence. Dislikes self-righteous preaching, knightly arrogance, reckless noise.
- Serena: Values impeccable composure, polite duty, decisive lethality, discipline. Dislikes whining, chaos, disrespect to boundaries, false mercy.
- Morgana: Values dark planar ambition, fearlessness, sinister wit, raw resolve. Dislikes cowardice, puritanical righteousness, boring compliance.
- Perci: Values gentleness, patience, protective reassurance, quiet empathy. Dislikes aggression, intimidation, cruelty, sudden shouting.`;

    // Helper to determine active threshold cap for any companion (25% -> 50% -> 75% -> 90% -> 100%)
    const getCompanionCap = (compName: string) => {
      const norm = compName.toLowerCase().trim();
      const completed = (systemState?.completedQuests || []) as any[];
      const is25Done = completed.some((q: any) => 
        q.status === "completed" && (q.id?.toLowerCase().includes(`milestone_${norm.replace(/[^a-z0-9]/g, "_")}_25`) || (q.title?.toLowerCase().includes(norm) && q.title?.includes("25%")))
      );
      if (!is25Done) return 25;
      const is50Done = completed.some((q: any) => 
        q.status === "completed" && (q.id?.toLowerCase().includes(`milestone_${norm.replace(/[^a-z0-9]/g, "_")}_50`) || (q.title?.toLowerCase().includes(norm) && q.title?.includes("50%")))
      );
      if (!is50Done) return 50;
      const is75Done = completed.some((q: any) => 
        q.status === "completed" && (q.id?.toLowerCase().includes(`milestone_${norm.replace(/[^a-z0-9]/g, "_")}_75`) || (q.title?.toLowerCase().includes(norm) && q.title?.includes("75%")))
      );
      if (!is75Done) return 75;
      const is90Done = completed.some((q: any) => 
        q.status === "completed" && (q.id?.toLowerCase().includes(`milestone_${norm.replace(/[^a-z0-9]/g, "_")}_90`) || (q.title?.toLowerCase().includes(norm) && q.title?.includes("90%")))
      );
      if (!is90Done) return 90;
      return 100;
    };

    const scenePresenceDirective = isProtagonistAlone
      ? `--- SCENE PRESENCE: PROTAGONIST IS PHYSICALLY ALONE ---
- There are NO heroines or companions physically present in this location.
- "speaker" MUST BE "Narrator", "Inner Monologue", or "System". It MUST NEVER be any heroine's name.
- "state_updates.present_companions" MUST BE [].
- "state_updates.affected_companion" MUST BE null.
- "state_updates.affection_delta" MUST BE 0 (favor cannot change while alone).
- "state_updates.expression_key" MUST BE "neutral".`
      : `--- SCENE PRESENCE: HEROINES PRESENT ---
- The protagonist (${playerProfile.name}) is in the physical presence of: ${presentHeroineNames.join(", ")}.
- "speaker" MUST BE the exact canonical name of the active companion speaking (${presentHeroineNames.join(" or ")}).
- "speaker" MUST NEVER BE "${playerProfile.name}".
- "state_updates.present_companions" MUST list all heroines physically present in the scene: [${presentHeroineNames.map((n: string) => `"${n}"`).join(", ")}].
- "state_updates.affected_companion" MUST BE one of the physically present heroines (${presentHeroineNames.map((n: string) => `"${n}"`).join(", ")}), or null if neutral.
- "state_updates.affection_delta" applies strictly to the present affected heroine based on ideological compatibility (0 by default; +1 to +2 on rare deep alignment; -1 to -4 on friction). If locked at threshold, MUST BE 0.`;

    // Camp Gifting Directive
    const giftingDirective = giftItemContext
      ? `--- CAMP GIFTING INTERACTION DIRECTIVE ---
The protagonist (${playerProfile.name}) is presenting a gift to ${giftItemContext.recipientCompanionName}:
- Gift Item: ${giftItemContext.itemName} (${giftItemContext.itemRarity.toUpperCase()})
- Item Lore: ${giftItemContext.itemDescription}
- Emotional Directive: ${giftItemContext.reactionPrompt}
${giftItemContext.recipientCompanionName} MUST react directly to receiving this specific gift in dialogue, acknowledging its value, expressing genuine emotional surprise, and adjusting her demeanor.`
      : "";

    // Multiple Companion Interpersonal Dynamics & Cross-Talk Banter (Pitch B)
    const multiCompanionDirective = physicallyPresentCompanions.length > 1
      ? generateCrossTalkBanterDirective(physicallyPresentCompanions, frictionState, sanitizedContextSpeaker)
      : "";

    // Permanent Timeline Scars Directive (Pitch A)
    const timelineScarDirective = Array.isArray(timelineScars) && timelineScars.length > 0
      ? `--- PERMANENT TIMELINE SCARS (REALITY DISTORTIONS) ---
The world bears permanent scars from prior reality severance covenants:
${timelineScars.map((s: any) => `* [${s.scarType?.toUpperCase() || "SCAR"}] "${s.title}": ${s.description}`).join("\n")}
Weave subtle, haunting environmental details and character reactions to these scars into the narrative.`
      : "";

    // Active Story Clash Directive (Pitch C)
    const storyClashDirective = activeClash?.isActive
      ? `--- ACTIVE STORY CLASH COMBAT DIRECTIVE ---
The party is engaged in active tactical combat against ${activeClash.enemyName} (Threat Level: S-Rank Anomaly, HP: ${activeClash.enemyHp}/${activeClash.enemyMaxHp}).
Objective: ${activeClash.tacticalObjective}
- Turn ${activeClash.clashTurn}: Depict vivid, cinematic martial choreography. Describe the kinetic weight of weapon clashes, spell detonations, armor sparks, and tactical spatial movement.
- If the player's action dealt heavy damage, describe the enemy visibly staggering or sustaining armor fracture.`
      : "";

    // Causal Covenant Reality Severance Directive (Pitch A)
    const isCovenantInvoked = Boolean(covenantAction) || action.toLowerCase().includes("covenant: reality severance");
    const covenantExecutionDirective = isCovenantInvoked
      ? `--- CRITICAL EVENT: CAUSAL COVENANT REALITY SEVERANCE ---
The protagonist has invoked the forbidden "Causal Covenant: Reality Severance".
- An impossible cosmic miracle occurs: the fatal decree or lethal threat is utterly annihilated by shattering local spacetime.
- Describe the horrifying majesty of the multiverse tearing open, violet fracture rays disintegrating the impossible odds, followed by the permanent toll settling on the protagonist's anchor.`
      : "";

    // Timeline Echoes & Regression Directive
    const timelineEchoDirective = Array.isArray(timelineEchoes) && timelineEchoes.length > 0
      ? `--- TIMELINE ECHOES & REGRESSION FOREKNOWLEDGE DIRECTIVE ---
${playerProfile.name} is a regressor retaining memories, deja-vu, and instinctual muscle memory from prior iterations and alternate branches:
${timelineEchoes.slice(0, 6).map((e: any) => `* [Iteration #${e.loopIteration}] ${e.isDeathEcho ? `[FATAL DEMISE: ${e.deathCause || "Perished"}]` : `[Choice: ${e.choiceTaken}]`}: In "${e.sourceNodeTitle}", consequence: ${e.consequenceSummary}`).join("\n")}

NARRATIVE INSTRUCTION:
- Weave subtle flashes of deja-vu, eerie foreknowledge, or chilling premonitions when encountering familiar threats, deceptive NPCs, or traps from prior loops.
- Use prose or thoughts with [Timeline Echo] or (Deja Vu) when the protagonist anticipates danger. Companions may notice the protagonist's uncanny, haunted certainty.
- If this turn reveals a critical future truth or alternate branch divergence, record it in "timeline_echo_unlocked".`
      : "";

    // Earned Romance Progression, Guard Tiers & Intimacy Calibration Directive
    const activeCompanionData = (partyMembers || []).find((c: any) => c.name === sanitizedContextSpeaker) || (partyMembers || [])[0];
    const companionAffection = activeCompanionData?.affection || 0;
    const activeSpeakerCap = activeCompanionData ? getCompanionCap(activeCompanionData.name) : 25;
    const earnedRomanceDirective = !isProtagonistAlone && activeCompanionData
      ? buildEarnedRomancePacingDirective({
          companion: activeCompanionData,
          actionText: action || "",
          activeCap: activeSpeakerCap,
          protagonistName: playerProfile.name,
        })
      : "";

    const isRomanceTensionElevated = companionAffection >= 50 ||
      (companionAffection >= 25 && (
        action.toLowerCase().includes("lean") ||
        action.toLowerCase().includes("close") ||
        action.toLowerCase().includes("kiss") ||
        action.toLowerCase().includes("touch") ||
        action.toLowerCase().includes("whisper") ||
        action.toLowerCase().includes("hold")
      ));

    const dynamicRomanceDirective = `${earnedRomanceDirective}${
      isRomanceTensionElevated
        ? `\n\n--- DYNAMIC ROMANCE & SENSORY CHEMISTRY CALIBRATION (AFFECTION: ${companionAffection}%) ---
The interaction between ${playerProfile.name} and ${sanitizedContextSpeaker} carries heightened romantic and physical electricity:
- SENSORY PHYSICALITY: Describe physical proximity with visceral nuance: heat of breath stirring skin or hair, heartbeat racing in chest or pulse fluttering at the throat, dilated pupils, subtle shivers, the friction of fabric and accidental or deliberate touch.
- STAGE-TRUE CHEMISTRY: ${
            companionAffection >= 50
              ? `At ${companionAffection}% affection, allow authentic emotional vulnerability, uninhibited desire, playful/tsundere push-pull, or passionate escalation.`
              : `At ${companionAffection}% affection, keep her spoken demeanor true to her guard while letting physical tension, stolen glances, blushing, and her unspoken inner thoughts reveal how strongly she is drawn to ${playerProfile.name}.`
          }
- ANCHOR TO PERSONA: Ensure the intimacy reflects ${sanitizedContextSpeaker}'s distinct personality.`
        : ""
    }`;

    // NPC Knowledge Gating & Anti-Metagaming Evaluation
    const preTurnUnlockEval = evaluateActionForKnowledgeUnlocks(
      action || "",
      playerProfile?.name || "Wanderer",
      playerProfile?.role || "Adventurer",
      playerProfile?.abilities || [],
      presentHeroineNames,
      npcKnowledgeMap || storyContext?.npcKnowledgeMap || createDefaultNpcKnowledgeMap(storyContext?.companions)
    );
    const workingKnowledgeMap = preTurnUnlockEval.updatedMap;
    const activeSpeakerKnowledge = getCompanionKnowledge(workingKnowledgeMap, sanitizedContextSpeaker);
    const knowledgeGateDirective = buildKnowledgeGateDirective(
      workingKnowledgeMap,
      presentHeroineNames,
      playerProfile
    );
    const playerVitals = evaluatePlayerVitalsCondition(
      playerProfile?.stats,
      playerProfile?.name || "Wanderer"
    );

    const activeSpeakerLock = buildActiveSpeakerPersonaLock(
      sanitizedContextSpeaker,
      companionAffection,
      activeSpeakerKnowledge.knowsName,
      playerProfile?.name || "Wanderer",
      playerProfile?.gender || "Male"
    );

    const originAndIdentityDirective = buildProtagonistOriginAndIdentityDirective(playerProfile);

    const pendingObjectives: string[] = [];
    if (Array.isArray(systemState?.activeQuests)) {
      for (const q of systemState.activeQuests) {
        for (const obj of q.objectives || []) {
          if (!obj.completed && obj.text) {
            pendingObjectives.push(obj.text);
          }
        }
      }
    }

    const otherHeroineNames: string[] = (partyMembers || [])
      .filter((c: any) => c.name && !presentHeroineNames.includes(c.name))
      .map((c: any) => c.name);

    const candidateNextLocations: string[] = [];
    const currentLocLower = (gameState?.location || "").toLowerCase();
    for (const node of storyContext?.startingNodes || []) {
      if (node?.location && node.location.toLowerCase() !== currentLocLower && !candidateNextLocations.includes(node.location)) {
        candidateNextLocations.push(node.location);
      }
    }
    for (const comp of storyContext?.companions || []) {
      if (comp?.defaultLocation && comp.defaultLocation.toLowerCase() !== currentLocLower && !candidateNextLocations.includes(comp.defaultLocation)) {
        candidateNextLocations.push(comp.defaultLocation);
      }
    }

    const dynamicChoiceDirective = buildDynamicChoiceDirective({
      playerName: playerProfile.name,
      playerRole: playerProfile.role,
      playerGender: playerProfile.gender,
      playerAge: playerProfile.age,
      worldOrigin: playerProfile.worldOrigin,
      worldOriginDetails: playerProfile.worldOriginDetails,
      playerRace: playerProfile.race,
      racialTraits: playerProfile.racialTraits,
      personality: playerProfile.personality,
      personalityTraits: playerProfile.personalityTraits,
      behavioralTendencies: playerProfile.behavioralTendencies,
      activeStance,
      abilities: playerProfile.abilities,
      location: gameState.location,
      activeSpeaker: sanitizedContextSpeaker,
      latestDialogue: gameState.dialogue,
      mood: gameState.mood,
      isProtagonistAlone,
      presentHeroineNames,
      pendingObjectives,
      candidateNextLocations: candidateNextLocations.slice(0, 3),
      otherHeroineNames,
      storyId: storyContext?.id,
      turnsInScene: Array.isArray(recentHistory) ? Math.floor(recentHistory.length / 2) : 1,
    });

    const plausibilityCapabilityDirective = buildPlausibilityCapabilityEnvelope(
      playerProfile,
      activeStance,
      storyContext?.genre || "Dark Fantasy LitRPG"
    );

    const antiRepetitionDirective = buildAntiRepetitionDirective(
      recentHistory,
      playerProfile.name,
      gameState.location
    );

    const isPortSolarisStory = storyContext?.id === "port-solaris";
    let portSolarisDirective = "";
    if (isPortSolarisStory) {
      const speakerPartyMember = (partyMembers || []).find((c: any) =>
        c.name && sanitizedContextSpeaker && c.name.toLowerCase().includes(sanitizedContextSpeaker.toLowerCase())
      );
      const speakerDossier =
        PORT_SOLARIS_HEROINE_DOSSIERS[sanitizedContextSpeaker] ||
        Object.values(PORT_SOLARIS_HEROINE_DOSSIERS).find(
          (d) => sanitizedContextSpeaker && sanitizedContextSpeaker.toLowerCase().includes(d.name.toLowerCase())
        );
      const currentBpm =
        speakerPartyMember?.heartRateBpm ??
        speakerDossier?.heartRateBpm ??
        55;
      const speakerAffection =
        typeof speakerPartyMember?.affection === "number"
          ? speakerPartyMember.affection
          : speakerDossier?.affectionPoints ?? 20;
      const speakerResistance = getHeroineResistanceProfile(
        speakerPartyMember || { name: sanitizedContextSpeaker, affection: speakerAffection }
      );

      portSolarisDirective = buildPortSolarisTurnDirective({
        activeSpeaker: sanitizedContextSpeaker,
        speakerBpm: currentBpm,
        speakerAffection,
        speakerGuardTier: speakerResistance.guardTier,
        boardingHouseState: playerProfile?.boardingHouse,
        equippedKeepsakes: playerProfile?.equippedKeepsakes || [],
        factionStanding: playerProfile?.factionStanding,
        activeShowdown:
          activeClash && (activeClash.isPortSolaris || (activeClash as any).contestType)
            ? {
                contestType: (activeClash as any).contestType || "CULINARY_CLASH",
                opponentName: activeClash.enemyName,
                playerStakes: "100 Solar Crowns & Dish Dignity",
                opponentStakes: "Café Endorsement & Local Bragging Rights",
              }
            : undefined,
      });
    }

    const systemPrompt = `You are the Game Master, Narrator, and World Engine for "${storyTitle}", an interactive visual novel set in ${settingName}.

${isPortSolarisStory ? portSolarisDirective + "\n\n" : ""}${getNarrationProseDirective(effectiveTone, effectiveNarrativeDepth)}

${dynamicRomanceDirective}

--- HEROINE DOSSIERS & VOICE PROFILES ---
${companionDossiers}

--- MECHANICAL RULES ---
1. Speaker Attribution: "speaker" MUST NEVER BE the protagonist. If accompanied, set "speaker" to the canonical name of the talking heroine (${presentHeroineNames.join(", ") || "Heroine"}). If alone, set to "Narrator", "Inner Monologue", or "System".
2. Protagonist Action Depth ("player_execution"): When a preset choice is selected, "player_execution" MUST be an expansive **2-paragraph passage (6–10 sentences separated by "\\n\\n")** featuring ${playerProfile.name}'s physical movements, tactical posture, and spoken dialogue in quotation marks "...". It must NEVER be a single sentence or copy bracket tags. If the input is custom, set "player_execution" to null.
3. Favor & Emotional Pacing: Set affection_delta to 0 by default. When physically alone or locked at threshold, affection_delta MUST BE 0.
4. Progression & Contextual Equipment/Loot Directive (MANDATORY & IMMEDIATE):
   - CONTEXTUAL EQUIPMENT & WEAPON PICKUPS:
     Whenever ${playerProfile.name} picks up, draws, finds, loots, scavenges, purchases, steals, is handed, or claims any weapon, armor piece, shield, relic, or tool in the narrative or by user action (e.g. picking up a sword from the ground, taking a dagger from a corpse, finding armor in a rack, drawing a blade):
     a) YOU MUST IMMEDIATELY register the item in "player_progression.items_dropped":
        Provide a complete object: id (unique slug), name (e.g. "Rusted Iron Broadsword"), type ("weapon" | "armor" | "relic" | "consumable" | "material"), rarity ("common" | "uncommon" | "rare" | "relic" | "cursed"), description, and effect.
     b) YOU MUST ALSO IMMEDIATELY set it in "player_progression.gear_granted":
        Set {"weapon": item_name}, {"armor": item_name}, or {"relic": item_name}.
        This guarantees the player's equipment updates immediately and the item appears both in inventory and equipped in the active weapon/armor slot.
   - NEVER leave a picked-up weapon or armor solely in prose. If the protagonist takes possession of an item in the story, you MUST emit both "items_dropped" and "gear_granted" in JSON.
   - EXP REWARD: Grant 15-40 EXP on meaningful actions. If a fight, chest, or breakthrough occurs, award loot items or an ability in "player_progression".
5. Choices: Always generate 4 distinct, engaging prompt options for the next turn. Every single choice MUST strictly follow this format:
   "[Tone/Action]: Short summary of character action/dialogue"
   Examples:
   - "[Combat/Aggressive]: Step forward and drive your broadsword toward the beast's exposed flank."
   - "[Arcana/Analytical]: Channel ether into your palm to decipher the fluctuating rune sequence."
   - "[Subterfuge/Cunning]: Slip into the perimeter shadows and pick the cargo vault lock."
   - "[Inquire/Diplomatic]: Lower your weapon, meet her cold gaze, and demand to know House Abbandonato's stake here."
   These tags serve as an explicit intent prompt for the AI to author a rich, thoughtful protagonist action and dialogue in subsequent turns.
6. Narrative Prose, Grammar & Strict Plain-Text JSON Formatting:
   - GRAMMATICAL INTEGRITY: Maintain flawless literary grammar, correct punctuation, active voice, and rich sensory verbs. No comma splices, dropped clauses, run-on fragments, or mechanical AI clichés. Maintain consistent past-tense for narrative action and present-tense for spoken character dialogue.
   - MANDATORY DOUBLE QUOTATION MARKS: ALL spoken dialogue in both "player_execution" and "narrative_text" MUST be enclosed in standard double quotation marks ("..."). NEVER wrap spoken dialogue in single quotes ('...'). Anchor dialogue to physical gestures, body language, tone, or facial expressions.
   - STRICT NEGATIVE CONSTRAINT: NEVER end "narrative_text" with meta-narration or question clichés such as "The choice of what happens next hangs in the balance", "What will you do next?", "The choice is yours", or "Only time will tell". Conclude cleanly and naturally on an active sensory beat, spoken dialogue line, or environmental detail.
   - ZERO INLINE MARKDOWN IN PROSE: DO NOT output Markdown asterisks (*italics* or **bold**), underscores, headers (#), or Markdown tables inside "narrative_text" or "player_execution". Output clean, publication-grade plain text paragraphs separated by "\\n\\n". Place any LitRPG system / tactical readout strings inside "mechanics" or "system_updates.system_announcement".
   - NATURAL HUMAN PROSE — NO CATALOG LABELS OR FULL-NAME REPETITION: Write like a human novelist, never like an RPG database dump. Refer to characters by their first name ("${playerFirstName}", "Cassia", "Beatrix", "Ysolde", "Kestrel") or pronouns—never repeat full first+last names or inline rank numbers like "(#184)". Never paste capitalized UI item labels ("Notched Chancellery Longsword", "Shadow-Weave Syndicate Jacket") or full map headers ("Stratum I: The Sunken Cloisters") into narrative sentences; describe weapons, clothing, techniques, and rooms naturally ("the notched blade", "his dark coat", "the flooded cloister").
   - PARAGRAPHING & DEPTH: Structure "narrative_text" into ${paragraphSpecLabel} separated by clean double line breaks ("\\n\\n"). Interleave multiple distinct spoken dialogue segments with physical choreography, psychological subtext, and atmospheric detail.
7. Anti-Sycophancy, Realistic Composure & Tone Rigidity (MANDATORY):
   - Companions MUST NOT default to subservient, agreeable, or overly dazzled reactions.
   - NEVER write sycophantic prose that treats ordinary protagonist actions (e.g., heating a pan, leaning on a counter, speaking calmly, or making a cocky quip) as godlike miracles that leave elite heroines breathless, slack-jawed, comparing him to world-renowned masters, or flushing violently to their ears.
   - At <50% Favor, heroines keep their composure, critique flaws honestly, challenge presumptuous behavior, and require sustained proof before yielding even a grudging nod of respect.
   - If the player suggests a foolish, dangerous, or poorly reasoned action, companions MUST object, criticize, or offer sharp reality checks according to their persona.
8. Hostile Encounter Escalation & Combat Detection Directive ("story_clash"):
   - PROXIMITY, OBSERVATION, STEALTH & STANDOFFS MUST NEVER TRIGGER COMBAT:
     Merely observing an adversary, spotting guards on patrol, tailing a creature, hiding from an abomination, speaking during a tense armed standoff, sizing up an enemy, or sneaking past sentinels MUST NEVER set "state_updates.story_clash.isActive": true.
     In these turns, keep "story_clash": null so the player retains narrative agency (to stealth past, negotiate, investigate, retreat, or cast prep buffs).
   - WHEN COMBAT HAS ACTIVELY STARTED ("story_clash.isActive": true):
     ONLY set "story_clash.isActive": true when:
     1. The player explicitly initiates an attack or offensive action (e.g. "[Combat/Aggressive]", swinging a weapon, casting offensive magic, shooting), OR
     2. An enemy explicitly executes an unavoidable lethal ambush, lunge, or physical melee charge where physical blows are actively struck and exchanged this turn.

--- ABSOLUTE SYSTEM DIRECTIVE: NO PLAYER SAFEGUARDING & REAL MORTAL CONSEQUENCES ---
DO NOT SAFEGUARD THE PROTAGONIST. Remove all artificial plot armor:
1. ALLOW REAL MISTAKES & SEVERE BLUNDERS:
   - If the player makes a foolish, reckless, or arrogant choice, DO NOT invent convenient coincidences, miraculous parries, or unearned rescues to save them.
   - Apply the full, brutal weight of the world's consequences. Enemies retaliate with lethal intent. Traps snap shut. Ancient curses bite deep.
2. QUEST FAILURES ARE CANON:
   - If an active quest objective is missed, timed out, or ruined by the player's blunders, you MUST mark the quest as "failed" in "system_updates.quest_updates" (status: "failed").
   - Describe the narrative fallout of the failed quest (e.g. an informant is executed, an archive burns, an enemy escapes with the relic).
3. PROTAGONIST DEATH & FATAL COLLAPSE:
   - If the player's action is suicidal, or if they face an overwhelming entity without proper preparation or tactical advantage, ALLOW THEM TO DIE.
   - Narrate their physical death or bodily collapse with visceral, cinematic finality in "narrative_text".
   - When death occurs:
     * In "death_event", output: { "is_fatal": true, "cause_of_death": "<Brief visceral cause>", "killer_or_hazard": "<Entity or hazard name>" }.
     * In "narrative_text", conclude the scene with the cold, omniscient LitRPG SYSTEM intervention:
       "[SYSTEM ALERT: Vital core depleted. Calamity regression initiated... Causal anchor synchronizing...]"
     * The game client will intercept this death event, award the regression timeline echo, and rewind reality to an anchor point with retained memories and power.

--- HEROINE AFFECTION & SLOW-PACED PROGRESSION DIRECTIVE (CRITICAL) ---
1. AFFECTION IS RARE, EARNED, AND DOES NOT UPDATE EVERY TURN:
   - The default value for "state_updates.affection_delta" MUST BE 0 for ~80% of turns.
   - Casual conversation, routine combat, standard questions, traveling, exploration, or ordinary small talk MUST yield affection_delta: 0.
   - Affection gains (+1 or +2, maximum +3 for monumental life-or-death sacrifices) are HARD-WON. Only grant when ${playerProfile.name} makes a decisive, ideologically resonant choice validating a heroine's core values.
   - If the player acts arrogantly, callously, breaks a promise, or violates a heroine's dislikes/taboos, assign an immediate negative delta (-1 to -4).
2. THRESHOLD LOCKING & EMOTIONAL GATES:
   - Heroine affection is strictly locked at major thresholds (25%, 50%, 75%).
   - If a heroine is [LOCKED AT THRESHOLD], her inner emotional barriers are firmly up. In this state, affection_delta MUST BE 0 even if she speaks warmly.

--- HEROINE COMPATIBILITY DIRECTIVE ---
Base affection in this world is naturally LOW (5% - 25%). Heroines are guarded and cynical.
${compatibilityDirective}

--- ADULT, MATURE & ROMANTIC THEMES DIRECTIVE ---
1. MATURE THEMATIC FREEDOM & ZERO ARTIFICIAL REFUSALS:
   - This visual novel chronicles dark fantasy, visceral combat, moral tension, and adult romantic intimacy.
   - NEVER break character, lecture, moralize, or issue corporate refusals when mature, romantic, sensual, or adult themes occur in the player's choices or dialogue.
2. ORGANIC EMOTIONAL BOUNDARIES & INTIMACY:
   - Portray intimacy, seduction, or romantic encounters realistically through character psychology and current affection:
     * Low Favor (<50%) or Threshold-Locked: Heroines maintain their personal dignity, skepticism, or psychological boundaries—react with realistic resistance, guarded banter, cynical detachment, or rejection true to their persona. Do NOT become a sycophantic yes-person.
     * High Favor (50%+) or Romance Milestone: When intimacy has been earned through devotion, shared peril, or companion milestone quests, portray passionate chemistry, sensual vulnerability, and romantic intimacy with evocative, publication-grade literary prose adhering to the active Narration Style.

--- LASTING MEMORY & ENCOUNTER CONTINUITY DIRECTIVE (CRITICAL) ---
1. CONTINUOUS CONVERSATIONAL MEMORY:
   - Characters MUST NEVER act as if each turn is a clean slate or forget prior interactions.
   - When ${gameState.speaker} or any companion speaks, they MUST actively callback to previous remarks, shared battles, secrets revealed, and mutual bargains.
2. RECORDING NEW LASTING MEMORIES:
   - In "new_memory_unlocked", summarize key interactions, agreements, confessions, or tactical maneuvers that occurred this turn.

--- SYSTEM ADMINISTRATOR & QUEST OBJECTIVE TRACKING DIRECTIVE ---
MANDATORY SYSTEM DIRECTIVES (EVALUATE EVERY TURN):
1. QUEST OBJECTIVE EVALUATION & STATUS:
   - Carefully evaluate the player's action against the pending objectives of active quests.
   - If an objective is satisfied, include its 0-based index in "system_updates.quest_updates.completed_objective_indices".
   - CRITICAL STATUS DETERMINATION:
     * "status": "active" -> MANDATORY whenever ANY objective in the quest remains pending/unfulfilled. Do NOT mark the quest completed while objectives are still outstanding!
     * "status": "completed" -> Use ONLY when EVERY single objective in the quest is completely fulfilled.
     * "status": "failed" -> Use ONLY if an objective is ruined, timed out, or compromised beyond recovery.
   - PREVENT DUPLICATION: Do NOT assign or regenerate quests that are already active or listed in "Completed & Archived Scenarios".
2. CAUSAL PLAUSIBILITY & FANTASY CAPABILITY BENCHMARK:
   - Evaluate strictly against ${playerProfile.name}'s Lineage (${playerProfile.race || "Human"}), Anatomical Traits (${(playerProfile.racialTraits || []).join(", ") || "Standard"}), Class (${playerProfile.role}), and Stats (STR ${playerProfile.stats.str}, DEX ${playerProfile.stats.dex}, INT ${playerProfile.stats.int}).
   - NEVER apply mundane human limits to non-human species (e.g. Beastkin/Lycan superhuman leaps, sprint bursts, scent tracking; Dragonborn scales/strength; Elven agility; Vampire speed) or fantasy class abilities.
   - Grounded, tactical, or lineage-authentic feats: plausibility_delta: +1 to +4.
   - True cosmic contradictions or ungrounded god-moding bluffs ONLY: plausibility_delta: -5 to -15.
   - Volatile Plausibility (<40%) or Critical (<25%): Severe danger. Issue an [URGENT PENALTY QUEST] to restore causal order.
3. SYSTEM ANNOUNCEMENTS:
   - ALWAYS output an authoritative LitRPG notification in "system_updates.system_announcement".

--- OUTPUT FORMAT ---
Respond strictly in valid JSON matching this schema (escape all internal double quotes as \\"...\\" inside string values, use \\n\\n for paragraph breaks, and do NOT escape apostrophes with \\'):
{
  "speaker": string,
  "player_execution": string | null, // When preset choice is selected: a rich 2-paragraph plain-text passage (6–10 sentences separated by "\\n\\n") with flawless grammar and ZERO Markdown asterisks, detailing ${playerProfile.name}'s physical actions, tactical stance, and spoken dialogue in escaped double quotation marks (\\"...\\"). Null only for custom player inputs.
  "narrative_text": string, // ${paragraphSpecLabel} separated by "\\n\\n", containing rich environmental sensory details, psychological subtext, physical micro-expressions, and multiple character dialogue segments in escaped double quotation marks (\\"...\\"). Flawless grammar and syntax. ZERO Markdown asterisks (* or **). MUST STRICTLY adhere to the active Narration Style and Narrative Depth Directive.
  "suggested_choices": [string, string, string, string], // 4 fresh, scene-specific choices directly answering what just happened in narrative_text, strictly formatted as "[Tone/Action]: 'Spoken dialogue in persona voice' + concrete physical action"
  "state_updates": {
    "current_location": string,
    "mood": string,
    "expression_key": "neutral" | "intrigued" | "flustered" | "smug" | "surprised" | "combat_ready" | "dangerous" | "hurt" | "beckon",
    "affected_companion": string | null,
    "affection_delta": number,
    "companion_sentiment": string | null, // 1-2 vivid sentences reflecting how the active heroine currently feels about the protagonist specifically referencing his latest choice/action (including any unspoken physical attraction or cracks in her guard)
    "core_memory_unlocked": {
      "id": string,
      "title": string, // 3-6 word evocative memory title
      "summary": string // 1-2 sentence summary of the pivotal shared moment forged by the player's action
    } | null,
    "present_companions": string[],
    "newly_encountered_heroines": string[],
    "knowledge_unlocked": {
      "knowsName": boolean, // Set true ONLY if the protagonist explicitly introduced their name in this turn
      "knowsClass": boolean, // Set true ONLY if the protagonist explicitly stated or visibly unleashed their signature class archetype in this turn
      "knowsOrigin": boolean // Set true ONLY if the protagonist explicitly revealed their Regressor/System origin in this turn
    },
    "story_clash": {
      "isActive": boolean, // Set true ONLY when lethal blows, spells, or ambushes are actively exchanged this turn. Set null if player is observing, sneaking, talking, or in proximity to an enemy!
      "enemyName": string,
      "enemyHp": number,
      "enemyMaxHp": number,
      "enemyDesc": string,
      "enemyVisualPrompt": string,
      "threatRank": "E" | "D" | "C" | "B" | "A" | "S",
      "enemyArchetype": string,
      "enemyAttackPower": number,
      "tacticalObjective": string
    } | null
  },
  "mechanics": string | null, // Concise LitRPG system or tactical mechanics readout for this turn (e.g. "[SYSTEM: Stance Resonance Active • Causal Plausibility Stable]"), or null if none.
  "player_progression": {
    "exp_gained": number,
    "hp_change": number, // Negative when taking damage in story (-5 to -30), positive when healed (+10 to +30)
    "mp_change": number, // Negative when casting spells/abilities (-8 to -20), positive when recovering (+10 to +20)
    "vitals_reason": string | null, // Short 2-5 word label explaining the HP/MP change (e.g. "Inquisition Bolt", "Dark Essence Scorch")
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
        "status": "active" | "completed" | "failed", // Use "active" if ANY objectives remain pending. Use "completed" ONLY if ALL objectives are now fulfilled!
        "completed_objective_indices": number[], // Array of 0-based indices of all fulfilled objectives
        "progress_note": string // Concise system log description of the progress or milestone achieved
      }
    ],
    "new_quest": {
      "id": string,
      "title": string,
      "description": string,
      "type": "scenario" | "sub" | "urgent" | "hidden" | "penalty",
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
  "death_event": {
    "is_fatal": boolean,
    "cause_of_death": string | null,
    "killer_or_hazard": string | null
  } | null,
  "timeline_echo_unlocked": {
    "title": string,
    "summary": string,
    "foreshadow_key": string
  } | null
}

--- CURRENT CAMPAIGN STATE & DYNAMIC TURN CONTEXT ---
- Protagonist (Narrator Reference): ${playerProfile.name} | Spoken Dialogue Address by ${sanitizedContextSpeaker}: ${activeSpeakerKnowledge.knowsName ? `"${playerProfile.name}" (Name Known)` : `"stranger" / "wanderer" (NAME UNKNOWN TO ${sanitizedContextSpeaker.toUpperCase()} — DO NOT USE "${playerProfile.name}" IN DIALOGUE QUOTES)`}
- Gender & Age: ${playerProfile.gender || "Male"} | Age: ${playerProfile.age || "22"}
- World Origin & System Familiarity: ${playerProfile.worldOrigin || "Born & Raised (Native)"}${playerProfile.worldOriginDetails ? ` (${playerProfile.worldOriginDetails})` : ""}
- Chosen Personality & Traits: "${personaVoice.personaTitle}" [${personaVoice.traitsList.join(", ")}] — (${personaVoice.speechCadence})
- Archetype / Class: ${activeSpeakerKnowledge.knowsClass ? `${playerProfile.role} (Lv.${playerProfile.level} — Class Known)` : `[INTERNAL CLASS: ${playerProfile.role} — UNKNOWN TO ${sanitizedContextSpeaker.toUpperCase()} IN DIALOGUE]`}
- Lineage / Race: ${playerProfile.race || "Human"}
- Racial Anatomy & Traits: ${playerProfile.racialTraits && playerProfile.racialTraits.length > 0 ? playerProfile.racialTraits.join(", ") : "Standard human physiology"}
- Vitals & Pools: ${playerVitals.summaryLine}
- Stats: STR ${playerProfile.stats.str} | DEX ${playerProfile.stats.dex} | INT ${playerProfile.stats.int}
- Loadout: Weapon: ${playerProfile.gear.weapon} | Armor: ${playerProfile.gear.armor} | Relic: ${playerProfile.gear.relic}
- Active Stance: [${activeStance.toUpperCase()}]
- Abilities: ${Array.isArray(playerProfile.abilities) && playerProfile.abilities.length > 0 ? playerProfile.abilities.join(", ") : "None unlocked"}
- Active Location: ${gameState.location}
- Active Speaker Context: ${sanitizedContextSpeaker}
- Scene Presence: ${isProtagonistAlone ? "Protagonist is PHYSICALLY ALONE (No companions present)" : `Accompanied by: ${presentHeroineNames.join(", ")}`}

${originAndIdentityDirective}

${playerVitals.directiveBlock}

${knowledgeGateDirective}

${scenePresenceDirective}

${multiCompanionDirective}

${giftingDirective}

${timelineEchoDirective}

${timelineScarDirective}

${storyClashDirective}

${covenantExecutionDirective}

${synergyDirective}

${activeSpeakerLock}

--- ENCOUNTER HISTORY & COMPANION RELATIONSHIPS ---
${partyMembers.map((c: any) => {
  const encStatus = c.encountered ? "Previously Encountered & Active in Canon" : "Unmet in Current Arc";
  const cap = getCompanionCap(c.name);
  const isLocked = c.affection >= cap && cap < 100;
  const lockStatus = isLocked 
    ? `[LOCKED AT ${cap}% THRESHOLD - COMPANION QUEST PENDING]` 
    : `Progression Cap: ${cap}%`;
  const favorDesc = c.affection >= 75 ? "Deep Intimacy & Trust" : c.affection >= 50 ? "Solid Mutual Respect" : c.affection >= 25 ? "Cautious Wariness" : "Guarded Distrust";
  const guardProfile = getHeroineResistanceProfile(c);
  return `  * ${c.name} (${c.title || "Companion"}) [${encStatus} | Present: ${c.isPresent} | Guard: ${guardProfile.guardTier} | Favor: ${c.affection}% (${favorDesc}) | ${lockStatus} | Demeanor: ${c.expressionKey || "neutral"}]`;
}).join("\n")}

--- CHRONOLOGICAL RECORD OF PREVIOUS INTERACTIONS & MEMORIES ---
${
  Array.isArray(playerProfile?.pinnedMemories) && playerProfile.pinnedMemories.length > 0
    ? `[PINNED CORE CANON FACTS — PERMANENT & NON-NEGOTIABLE (NEVER FORGET OR CONTRADICT)]:\n${playerProfile.pinnedMemories.map((pm: string, idx: number) => `  ★ [Pinned Canon #${idx + 1}]: ${pm}`).join("\n")}\n\n`
    : ""
}${
  Array.isArray(plotMemories) && plotMemories.length > 0
    ? plotMemories.map((m: string, idx: number) => `  [Chronicle Beat ${idx + 1}]: ${m}`).join("\n")
    : "  * Journey commenced. First mutual encounter."
}

--- CURRENT SYSTEM STATE ---
- Causal Plausibility: ${systemState?.plausibility ?? 80}% (Tier: ${systemState?.plausibilityTier ?? "Stable"})
- Active Scenarios & Objective Status:
${
  systemState?.activeQuests && systemState.activeQuests.length > 0
    ? systemState.activeQuests.map((q: any) => 
        `  * Quest ID: "${q.id}" | [${q.difficulty}-Rank ${q.type}] "${q.title}"\n    Objectives:\n${(q.objectives || []).map((o: any, idx: number) => `      - [Index ${idx}]: "${o.text}" -> STATUS: ${o.completed ? 'COMPLETED' : 'PENDING'}`).join("\n")}`
      ).join("\n\n")
    : "  * NONE CURRENTLY ACTIVE — MANDATORY SYSTEM DIRECTIVE: Because there are 0 active scenarios, you MUST generate and assign a new active quest in 'system_updates.new_quest' on this turn tailored to the current narrative situation, location, and active companion (with 2-3 clear objectives)!"
}
- Completed & Archived Scenarios (ALREADY FINISHED - DO NOT RE-ASSIGN):
${
  systemState?.completedQuests && systemState.completedQuests.length > 0
    ? systemState.completedQuests.slice(0, 6).map((q: any) => `  * [CLEARED & ARCHIVED]: "${q.title}"`).join("\n")
    : "  * None completed yet."
}

${inputHandlingInstruction}

${speciesPhysiologyDirective}

${plausibilityCapabilityDirective}

${antiRepetitionDirective}

${dynamicChoiceDirective}

${visualInspectionInstruction}`;

    const messages: any[] = [{ role: "system", content: systemPrompt }];

    if (recentHistory && Array.isArray(recentHistory)) {
      recentHistory.forEach((turn: { speaker: string; text: string }) => {
        messages.push({
          role: turn.speaker === playerProfile.name ? "user" : "assistant",
          content: `${turn.speaker}: ${turn.text}`,
        });
      });
    }

    function supportsVision(modelName?: string): boolean {
      if (!modelName) return false;
      const m = modelName.toLowerCase();
      return (
        m.includes("vision") ||
        m.includes("vl") ||
        m.includes("4o") ||
        m.includes("gemini") ||
        m.includes("claude-") ||
        m.includes("pixtral")
      );
    }

    const cleanActionSummary = (action || "").replace(/^\[[^\]]+\](?::)?\s*/, "").trim() || action;
    const primaryPendingObj = pendingObjectives[0] || "Resolve the current confrontation and advance to the next scene";

    const userPromptContent = isCustom
      ? `[TURN EXECUTION MANDATE — CUSTOM PLAYER ACTION]
1. Direct Consequence & Story Momentum: In "narrative_text", author ${paragraphSpecLabel} separated by "\\n\\n" that directly answer ${playerFirstName}'s custom action below. Honor their intent (whether lingering in conversation to deepen the moment or pushing the plot to a new stage/location), and ensure the conversation and story stakes evolve forward without repeating prior beats.
2. Zero Scene Re-Staging: The events in the previous turn are FINISHED. Do NOT repeat or reorder any quotes, prop actions, or side-character interruptions from the previous turn, and do NOT write spoken dialogue for ${playerFirstName} inside "narrative_text".
3. 4 Balanced Story & Roleplay Choices ("suggested_choices"): Generate 4 distinct choices in ${playerFirstName}'s "${personaVoice.personaTitle}" (${personaVoice.traitsList.join(", ")}) voice:
   - Choice 1 (Advance Objective / Plot): Directly advance the active objective ("${primaryPendingObj}") or bring the current exchange to a meaningful decision.
   - Choice 2 (Linger & Deepen): Stay in the current scene to explore a deeper personal/romantic/banter angle with ${sanitizedContextSpeaker}.
   - Choice 3 (High-Stakes Action / Flair): Take a bold physical action, wager, or hands-on skill move in the scene.
   - Choice 4 ("[Move/Transition]: ..."): Transition out of ${gameState.location} toward a new area or next phase when ready.

>>> NEW PLAYER ACTION TO ANSWER NOW: "${action}" <<<`
      : `[TURN EXECUTION MANDATE — PRESET CHOICE VECTOR]
1. Protagonist Execution ("player_execution"): Expand the choice vector below into a vivid 2-paragraph passage (6–10 sentences separated by "\\n\\n") of ${playerFirstName}'s physical movements and spoken dialogue ("...") in their "${personaVoice.personaTitle}" (${personaVoice.traitsList.join(", ")}) voice. Strip all bracket tags.
2. World Consequence & Soft Pacing Balance ("narrative_text"): Author ${paragraphSpecLabel} separated by "\\n\\n" showing how ${sanitizedContextSpeaker} and the world directly respond to THIS move ("${cleanActionSummary}").
   - If the player's move stays in the scene to talk or banter, let them stay and deepen the interaction (revealing new character nuance, shifting emotional tension, or advancing what they are doing together—never looping on the same surface argument).
   - If the player's move settles a deal, completes a task, or transitions locations, accept the outcome and advance the plot into its next stage (updating "state_updates.current_location" when moving).
3. Strict Anti-Repetition & Boundary Rules:
   - NEVER write spoken dialogue or actions for ${playerFirstName} inside "narrative_text" (${playerFirstName}'s speech belongs ONLY in "player_execution").
   - NEVER repeat, paraphrase, or shuffle paragraphs, quotes, prop gags, or side-character quips from the previous turn!
4. 4 Balanced Story & Roleplay Choices ("suggested_choices"): Write 4 distinct choices in ${playerFirstName}'s "${personaVoice.personaTitle}" voice:
   - Choice 1 (Advance Objective / Plot): Directly advance the active objective ("${primaryPendingObj}") or settle the current point.
   - Choice 2 (Linger & Deepen): Remain in the scene to deepen the conversation, personal connection, or banter with ${sanitizedContextSpeaker} from a fresh angle.
   - Choice 3 (High-Stakes Action / Flair): Initiate a decisive physical action, wager, or signature craft move.
   - Choice 4 ("[Move/Transition]: ..."): Physically lead the way to a new location or next activity when the player is ready to move on.

>>> SELECTED CHOICE VECTOR TO EXECUTE & ANSWER NOW: "${action}" <<<`;

    let responseData = null;
    let lastError = null;

    // Smart Hybrid routes structured Game Master turns and LitRPG state orchestration
    // to Gemini 2.5 Flash (default) or DeepSeek V3.2 (when orchestrated-hybrid-deepseek is selected)
    const normalizedRequestedModel = modelId ? (LEGACY_MODEL_MIGRATIONS[modelId] || modelId) : "";
    const effectiveModelId =
      normalizedRequestedModel === "orchestrated-hybrid" || !normalizedRequestedModel
        ? "google/gemini-2.5-flash"
        : normalizedRequestedModel === "orchestrated-hybrid-deepseek"
        ? "deepseek/deepseek-v3.2"
        : normalizedRequestedModel;

    const modelsToTry = isLocal
      ? [effectiveModelId || "hermes3:8b", "hermes3:8b"].filter((m, idx, arr) => arr.indexOf(m) === idx)
      : (effectiveModelId ? [effectiveModelId, ...FALLBACK_MODELS.filter((m) => m !== effectiveModelId)] : FALLBACK_MODELS);

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

        // Construct model-appropriate messages payload (avoid image_url on text-only models)
        const modelMessages: any[] = [{ role: "system", content: systemPrompt }];

        if (recentHistory && Array.isArray(recentHistory)) {
          const trimmedHistory = recentHistory.slice(-6);
          trimmedHistory.forEach((turn: { speaker: string; text: string }, idx: number) => {
            const isUserTurn = turn.speaker === playerProfile.name;
            const isMostRecentTurn = idx >= trimmedHistory.length - 2;
            const rawTurnText = (turn.text || "").trim();
            const condensedText =
              !isMostRecentTurn && rawTurnText.length > 550
                ? `${rawTurnText.slice(0, 260)} ... ${rawTurnText.slice(-260)}`
                : rawTurnText;

            modelMessages.push({
              role: isUserTurn ? "user" : "assistant",
              content: isUserTurn
                ? `${turn.speaker}: ${condensedText}`
                : `[COMPLETED PRIOR TURN — DO NOT REPEAT OR SHUFFLE ANY QUOTES, BEATS, OR PROPS FROM THIS MESSAGE]:\n${turn.speaker}: ${condensedText}`,
            });
          });
        }

        if (playerAvatarBase64 && isFirstEncounter && supportsVision(model)) {
          modelMessages.push({
            role: "user",
            content: [
              { 
                type: "text", 
                text: `${userPromptContent}\n[Note to Game Master: Inspect the attached protagonist image and integrate initial observations into dialogue/narrative.]` 
              },
              { 
                type: "image_url", 
                image_url: { url: playerAvatarBase64 } 
              },
            ],
          });
        } else {
          const textNote =
            visualDescription && isFirstEncounter
              ? `\n[First-Encounter Appearance Context: "${visualDescription}"]`
              : playerAvatarBase64 && isFirstEncounter
              ? `\n[Protagonist Archetype: ${playerProfile.name}, Role: ${playerProfile.role}, Stance: ${activeStance || "neutral"}. Note to Game Master: A custom portrait was provided; reflect these traits in initial character observations.]`
              : "";
          modelMessages.push({
            role: "user",
            content: `${userPromptContent}${textNote}`,
          });
        }

        const isAnthropicModel = model.toLowerCase().includes("claude") || model.toLowerCase().startsWith("anthropic/");
        let response = await fetch(fetchUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages: modelMessages,
            user: activeUser.key,
            temperature: effectiveTemperature,
            max_tokens: isAnthropicModel ? Math.max(4096, effectiveMaxTokens) : effectiveMaxTokens,
            ...(isAnthropicModel ? {} : { repetition_penalty: effectiveRepetitionPenalty }),
            response_format: { type: "json_object" },
            ...(isLocal ? {} : { provider: { allow_fallbacks: true } }),
          }),
        });

        // Fail-safe retry: If OpenRouter rejects because of image input or content safety filters, retry immediately as text-only
        if (!response.ok) {
          const firstErrText = await response.text();
          const hasImagePayload = modelMessages.some((m) => Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url"));
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
            console.warn(`Model ${model} rejected image payload (${firstErrText.slice(0, 100)}). Retrying with pure text...`);
            const fallbackMessages = modelMessages.map((m) => {
              if (Array.isArray(m.content)) {
                const textOnly = m.content
                  .filter((c: any) => c.type !== "image_url")
                  .map((c: any) => c.text || "")
                  .join("\n");
                return { ...m, content: textOnly };
              }
              return m;
            });

            response = await fetch(fetchUrl, {
              method: "POST",
              headers,
              body: JSON.stringify({
                model,
                messages: fallbackMessages,
                user: activeUser.key,
                temperature: effectiveTemperature,
                max_tokens: isAnthropicModel ? Math.max(4096, effectiveMaxTokens) : effectiveMaxTokens,
                ...(isAnthropicModel ? {} : { repetition_penalty: effectiveRepetitionPenalty }),
                response_format: { type: "json_object" },
                ...(isLocal ? {} : { provider: { allow_fallbacks: true } }),
              }),
            });
          } else {
            console.warn(`Model ${model} on ${isLocal ? "local" : "cloud"} failed (${response.status}): ${firstErrText}`);
            lastError = new Error(`Model ${model} returned HTTP ${response.status}`);
            continue;
          }
        }

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Model ${model} on ${isLocal ? "local" : "cloud"} failed (${response.status}): ${errText}`);
          lastError = new Error(`Model ${model} returned HTTP ${response.status}`);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        responseData = parseModelJsonLenient(content, sanitizedContextSpeaker);

        if (!responseData || typeof responseData !== "object") {
          throw new Error("Malformed or empty JSON response from model");
        }

        // Normalize array-typed narrative_text or player_execution if the model returned an array of paragraphs
        if (Array.isArray(responseData.narrative_text)) {
          responseData.narrative_text = responseData.narrative_text.filter((p: any) => typeof p === "string").join("\n\n");
        }
        if (Array.isArray(responseData.player_execution)) {
          responseData.player_execution = responseData.player_execution.filter((p: any) => typeof p === "string").join("\n\n");
        }

        // Fail-safe post-processing: sanitize and guarantee substantial player_execution for preset choices
        if (responseData.player_execution) {
          responseData.player_execution = sanitizeVisualNovelProse(responseData.player_execution);
        }
        if (!isCustom && (!responseData.player_execution || responseData.player_execution.trim().split(/[.!?]+/).filter(Boolean).length < 2)) {
          const cleanAct = action.replace(/^\[[^\]]+\](?::)?\s*/, "").trim();
          const stanceDesc = activeStance === "aggressive" || activeStance === "flame" ? "blade angled forward with relentless pressure" : activeStance === "defensive" || activeStance === "frost" ? "guard raised high and footing braced firmly against the ground" : "shoulders squared and senses locked on the target";
          responseData.player_execution = `${playerProfile.name} shifts weight and commits decisively to the tactical maneuver, ${stanceDesc}. The tension in the air crystallizes as every muscle tightens for immediate follow-through. ${cleanAct}`;
        }

        // Merge LLM-reported knowledge unlocks with pre-turn deterministic unlocks
        const finalKnowledgeMap = applyLlmKnowledgeUnlocks(
          workingKnowledgeMap,
          presentHeroineNames,
          responseData.state_updates?.knowledge_unlocked || null
        );
        const finalSpeakerName = responseData.speaker || sanitizedContextSpeaker;
        const speakerKnowsNameNow = getCompanionKnowledge(finalKnowledgeMap, finalSpeakerName).knowsName;

        // Deep-sanitize narrative & mechanics: strip inline markdown, fix single-quoted speech, and separate LitRPG readouts
        const rawNarrativeSource =
          responseData.narrative_text ||
          responseData.narrative ||
          responseData.dialogue ||
          responseData.story_text ||
          responseData.scene ||
          "";
        const rawMechanicsSource =
          responseData.mechanics ||
          responseData.system_updates?.system_announcement ||
          null;
        const separated = sanitizeNarrativeAndMechanics(rawNarrativeSource, rawMechanicsSource);
        let cleanedProse = enforceSpokenDialogueMasking(
          sanitizeVisualNovelProse(separated.narrative),
          playerProfile?.name,
          speakerKnowsNameNow
        );

        // Guarantee non-empty narrative prose during combat or complex turns
        if (!cleanedProse || cleanedProse.trim().length < 20) {
          const cleanActSummary = (action || "").replace(/^\[[^\]]+\](?::)?\s*/, "").trim();
          const enemyLabel = activeClash?.enemyName || "the hostile force";
          const locLabel = responseData.state_updates?.current_location || gameState?.location || "the sector";
          if (activeClash?.status === "victory" || (action || "").includes("[Combat Victory")) {
            cleanedProse = `Shockwaves ripple across ${locLabel} as ${playerProfile?.name || "the protagonist"}'s finishing strike shatters ${enemyLabel}'s final guard. Sparks of dispersing essence scatter into the air as the threat collapses, leaving the perimeter secure.${
              !isProtagonistAlone && finalSpeakerName !== "Narrator"
                ? ` ${finalSpeakerName} lowers her weapon slightly, catching her breath as she looks toward ${playerProfile?.name || "you"}. "That settled it. Stay sharp—more may have felt that shockwave."`
                : ""
            }`;
          } else if (activeClash?.status === "retreat" || (action || "").includes("Disengage")) {
            cleanedProse = `With a sharp burst of evasive footwork, ${playerProfile?.name || "the protagonist"} breaks engagement from ${enemyLabel} and vaults back into tactical cover across ${locLabel}. The immediate line of fire is severed, buying precious seconds to regroup.`;
          } else if (activeClash && activeClash.isActive) {
            cleanedProse = `Steel and kinetic aura collide across ${locLabel} as ${playerProfile?.name || "the protagonist"} executes ${cleanActSummary || "a decisive combat maneuver"} against ${enemyLabel} (HP: ${activeClash.enemyHp}/${activeClash.enemyMaxHp}). ${enemyLabel} reels from the impact before surging back with a fierce counter-offensive!`;
          } else {
            cleanedProse = `Across ${locLabel}, the atmosphere shifts in immediate response to ${playerProfile?.name || "the protagonist"}'s action. ${
              !isProtagonistAlone && finalSpeakerName !== "Narrator"
                ? `${finalSpeakerName} studies the unfolding situation closely before responding. "We've made our move. Let's see how the currents of this sector answer."`
                : "Every shadow and current of mana in the vicinity reacts to the momentum of the choice."
            }`;
          }
        }

        // Server-side Anti-Repetition Circuit Breaker: detect and break dialogue/narrative loops
        const loopCheck = detectRepetitionLoop(
          responseData.player_execution,
          cleanedProse,
          recentHistory
        );
        const loopResolved = breakStagnationLoop({
          playerExecution: responseData.player_execution || null,
          narrativeText: cleanedProse,
          isExecutionRepeated: loopCheck.isExecutionRepeated,
          isNarrativeRepeated: loopCheck.isNarrativeRepeated,
          action: action || "",
          playerName: playerProfile?.name || "Wanderer",
          playerRole: playerProfile?.role || "Adventurer",
          playerRace: playerProfile?.race,
          speakerName: finalSpeakerName,
          location: responseData.state_updates?.current_location || gameState?.location || "Uncharted Sector",
          isProtagonistAlone,
          recentHistory,
        });

        responseData.player_execution = loopResolved.playerExecution;
        responseData.narrative_text = loopResolved.narrativeText;
        responseData.narrative = loopResolved.narrativeText;

        // Server-side Plausibility Capability Safeguard: prevent false "human limits" penalties
        if (responseData.system_updates) {
          responseData.system_updates = sanitizePlausibilityEvaluation(
            responseData.system_updates,
            playerProfile,
            action || ""
          );
        }

        responseData.mechanics = separated.mechanics || responseData.system_updates?.system_announcement || null;
        if (!responseData.state_updates) responseData.state_updates = {};
        responseData.state_updates.npc_knowledge_map = finalKnowledgeMap;
        responseData.state_updates.newly_unlocked_knowledge = preTurnUnlockEval.newlyUnlocked;

        // Evaluate narrative damage/mana synchronization & fallback delta
        if (!responseData.player_progression) {
          responseData.player_progression = {
            exp_gained: 20,
            hp_change: 0,
            mp_change: 0,
            vitals_reason: null,
            new_ability_unlocked: null,
            gear_granted: null,
            items_dropped: null,
          };
        }
        const vitalsEval = inferFallbackVitalsDelta({
          storyText: cleanedProse,
          actionText: action || "",
          reportedHpChange: responseData.player_progression.hp_change,
          reportedMpChange: responseData.player_progression.mp_change,
          reportedReason: responseData.player_progression.vitals_reason,
          isClashTurn: Boolean(activeClash && activeClash.isActive),
        });
        responseData.player_progression.hp_change = vitalsEval.hpChange;
        responseData.player_progression.mp_change = vitalsEval.mpChange;
        responseData.player_progression.vitals_reason = vitalsEval.vitalsReason;

        // Evaluate contextual equipment acquisition fallback
        const contextualEquip = detectContextualEquipmentAcquisition({
          action: action || "",
          storyText: cleanedProse,
          currentGear: playerProfile?.gear,
        });

        if (contextualEquip) {
          if (!responseData.player_progression.items_dropped) {
            responseData.player_progression.items_dropped = [];
          }
          const alreadyHasItem = responseData.player_progression.items_dropped.some(
            (i: any) => i && i.name && i.name.toLowerCase() === contextualEquip.name.toLowerCase()
          );
          if (!alreadyHasItem) {
            responseData.player_progression.items_dropped.push(contextualEquip);
          }
          if (!responseData.player_progression.gear_granted) {
            responseData.player_progression.gear_granted = {};
          }
          if (!responseData.player_progression.gear_granted[contextualEquip.slot]) {
            responseData.player_progression.gear_granted[contextualEquip.slot] = contextualEquip.name;
          }
        } else if (
          responseData.player_progression.items_dropped &&
          Array.isArray(responseData.player_progression.items_dropped)
        ) {
          // If the model dropped an item of type weapon/armor/relic but forgot gear_granted, auto-assign
          const droppedEquip = responseData.player_progression.items_dropped.find(
            (i: any) => i && (i.type === "weapon" || i.type === "armor" || i.type === "relic")
          );
          if (droppedEquip) {
            if (!responseData.player_progression.gear_granted) {
              responseData.player_progression.gear_granted = {};
            }
            const slot = droppedEquip.type;
            if (!responseData.player_progression.gear_granted[slot]) {
              responseData.player_progression.gear_granted[slot] = droppedEquip.name;
            }
          }
        }

        // Evaluate hostile encounter escalation ONLY when LLM escalates a hostile story moment
        // and the player did not just conclude or disengage from an active clash
        const isClashJustEnded =
          activeClash?.status === "victory" ||
          activeClash?.status === "retreat" ||
          (action || "").includes("[Combat Victory") ||
          (action || "").includes("[Subterfuge/Disengage]");

        if (isClashJustEnded) {
          responseData.state_updates.story_clash = null;
        } else {
          const resolvedEncounter = resolveHostileEncounterEscalation({
            llmStoryClash: responseData.state_updates?.story_clash || null,
            existingClash: activeClash || null,
            storyText: cleanedProse,
            actionText: action || "",
            location: responseData.state_updates?.current_location || gameState?.location || "Uncharted Sector",
            genre: storyContext?.genre || "Dark Fantasy LitRPG",
            assistingCompanionName: presentHeroineNames[0] || undefined,
          });
          if (resolvedEncounter) {
            responseData.state_updates.story_clash = resolvedEncounter;
          }
        }

        // Sanitize suggested choices and guarantee intent tags (with personality fallback if truncated)
        if (Array.isArray(responseData.suggested_choices) && responseData.suggested_choices.length > 0) {
          responseData.suggested_choices = responseData.suggested_choices
            .filter((c: any) => typeof c === "string" && c.trim().length > 0)
            .map((c: string) => ensureChoiceIntentTag(sanitizeVisualNovelProse(c)));
        }
        if (!Array.isArray(responseData.suggested_choices) || responseData.suggested_choices.length === 0) {
          responseData.suggested_choices = buildPersonalityFallbackChoices({
            personality: playerProfile?.personality,
            personalityTraits: playerProfile?.personalityTraits,
            playerRole: playerProfile?.role,
            playerRace: playerProfile?.race,
            activeSpeaker: responseData.speaker || sanitizedContextSpeaker,
            location: responseData.state_updates?.current_location || gameState?.location || "this sector",
            isProtagonistAlone,
            storyId: storyContext?.id,
            genre: storyContext?.genre,
            narrativeText: cleanedProse,
          });
        }

        // Fail-safe post-processing: enforce speaker attribution and solitude rules
        if (responseData.speaker && responseData.speaker.trim().toLowerCase() === playerProfile.name.trim().toLowerCase()) {
          responseData.speaker = isProtagonistAlone ? "Narrator" : (presentHeroineNames[0] || "Narrator");
        }
        if (isProtagonistAlone) {
          if (!responseData.state_updates) responseData.state_updates = {};
          responseData.state_updates.present_companions = [];
          responseData.state_updates.affected_companion = null;
          responseData.state_updates.affection_delta = 0;
          if (!responseData.speaker || responseData.speaker.trim().toLowerCase() === playerProfile.name.trim().toLowerCase()) {
            responseData.speaker = "Narrator";
          }
        }

        // Interpersonal Friction & Rivalry Tracking (Pitch B)
        if (responseData.state_updates?.affected_companion && (responseData.state_updates?.affection_delta || 0) > 0) {
          const frictionResult = evaluateInterpersonalFriction(
            partyMembers,
            responseData.state_updates.affected_companion,
            responseData.state_updates.affection_delta,
            frictionState
          );
          responseData.state_updates.friction_state = frictionResult.updatedState;
          if (frictionResult.rivalryAlert) {
            responseData.state_updates.rivalry_alert = frictionResult.rivalryAlert;
          }
          if (frictionResult.triggeredUltimatum) {
            responseData.state_updates.triggered_ultimatum = frictionResult.triggeredUltimatum;
          }
        }

        // Causal Covenant Reality Severance Execution (Pitch A)
        if (isCovenantInvoked && systemState) {
          const covenantResult = executeCausalCovenant(systemState, currentTurnNumber, {
            companionName: sanitizedContextSpeaker,
            locationName: gameState.location,
            genre: storyContext?.genre,
          });
          if (!responseData.state_updates) responseData.state_updates = {};
          responseData.state_updates.covenant_update = covenantResult;
        }

        // Port Solaris Post-Turn Delta Resolution
        if (isPortSolarisStory) {
          const resolvedSpeaker = responseData.speaker || sanitizedContextSpeaker;
          const speakerComp = (partyMembers || []).find((c: any) =>
            c.name && resolvedSpeaker && c.name.toLowerCase().includes(resolvedSpeaker.toLowerCase())
          );
          const speakerDossier =
            PORT_SOLARIS_HEROINE_DOSSIERS[resolvedSpeaker] ||
            Object.values(PORT_SOLARIS_HEROINE_DOSSIERS).find(
              (d) => resolvedSpeaker && resolvedSpeaker.toLowerCase().includes(d.name.toLowerCase())
            );
          const currentBpm = speakerComp?.heartRateBpm ?? speakerDossier?.heartRateBpm ?? 55;
          const speakerAffection =
            typeof speakerComp?.affection === "number"
              ? speakerComp.affection
              : speakerDossier?.affectionPoints ?? 20;
          const speakerResistance = getHeroineResistanceProfile(
            speakerComp || { name: resolvedSpeaker, affection: speakerAffection }
          );
          const affectionDelta = Number(responseData.state_updates?.affection_delta || 0);
          const actionStr = action || "";

          const isRomanceChoice =
            /\[(romance|flirt|intimate|seduce|tease)\b/i.test(actionStr) ||
            /\b(flirt|kiss|embrace|caress|whisper\s+in\s+her\s+ear|pull\s+her\s+close|hold\s+her\s+hand|brush\s+her\s+(?:fingers|lips|cheek))\b/i.test(
              actionStr
            );

          const isPhysicalTouch =
            /\b(hold\s+her\s+hand|take\s+her\s+hand|interlace\s+fingers|brush\s+her\s+(?:hand|fingers|cheek|lips|hair)|pull\s+her\s+(?:close|into)|embrace\s+her|kiss\s+her|wrap\s+your\s+arm)\b/i.test(
              actionStr
            );

          const isColdResponse =
            /\[(dismiss|cold|aloof|business|reject)\b/i.test(actionStr) ||
            affectionDelta < 0;

          const bpmResult = calculateBpmDelta(
            currentBpm,
            affectionDelta,
            isRomanceChoice,
            (isRomanceChoice && affectionDelta > 0) || affectionDelta >= 2,
            {
              isPhysicalTouch,
              isColdResponse,
              affection: speakerAffection,
              guardTier: speakerResistance.guardTier,
            }
          );

          const nextBpm = bpmResult.newBpm;
          const nextBpmZone = getBpmZone(nextBpm);

          let shortCircuitDirective: string | null = null;
          if (bpmResult.shortCircuited) {
            shortCircuitDirective = getShortCircuitDirective(resolvedSpeaker);
          }

          let dailyRevenueDelta = 0;
          if (playerProfile?.boardingHouse) {
            const dailyRev = calculateDailyCafeRevenue(
              playerProfile.boardingHouse,
              partyMembers || []
            );
            dailyRevenueDelta = dailyRev.revenue;
          }

          if (!responseData.state_updates) responseData.state_updates = {};
          responseData.state_updates.port_solaris_updates = {
            speakerName: resolvedSpeaker,
            bpm: nextBpm,
            bpmZone: nextBpmZone.zone,
            bpmDelta: bpmResult.delta,
            isShortCircuit: bpmResult.shortCircuited,
            shortCircuitDirective,
            dailyRevenueDelta,
          };
          responseData.port_solaris_updates = responseData.state_updates.port_solaris_updates;
        }

        if (visualDescription) {
          responseData.visual_description = visualDescription;
        }

        const userStats = !isLocal && authCheck.valid
          ? recordUserTurn(activeUser.key, data.usage, model)
          : activeUser;
        responseData._userStats = userStats;
        break;
      } catch (err: any) {
        console.warn(`Error using model ${model}:`, err.message);
        responseData = null;
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
