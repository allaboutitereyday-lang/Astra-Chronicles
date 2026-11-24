import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";
import { evaluateRelicSynergies, buildSynergyPromptDirective } from "@/lib/relicSynergies";
import { getNarrationProseDirective, NarrativeDepthMode } from "@/lib/narrationStyles";
import {
  describeProtagonistAvatar,
  isExplicitlyNudeOrUnclad,
  isFallbackVisualDescription,
  resolvePortraitAttireLabel,
} from "@/lib/visionEncoder";
import { sanitizeVisualNovelProse, ensureChoiceIntentTag, sanitizeNarrativeAndMechanics, sanitizeAndFilterChoices } from "@/lib/proseSanitizer";
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
  calibrateQuestRankAndRewards,
  clampTurnProgressionDeltas,
  evaluateEarnedTurnExp,
} from "@/lib/progressionMechanics";
import {
  buildDynamicChoiceDirective,
  extractPlayerVoiceStyleFromHistory,
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
  createInitialBoardingHouseState,
  paydownDebt,
  advanceAuditDay,
  applyTurnScandalDecay,
} from "@/lib/portSolarisEngine";
import { PORT_SOLARIS_HEROINE_DOSSIERS } from "@/types/port_solaris";
import {
  buildStarfallTurnDirective,
  createInitialLabyrinthState,
  syncRosterWithParty,
  resolveHeroCasualty,
  advanceFloor,
  completeCurrentFloorAtTransferRing,
  adjustMasterTrust,
  inferFloorFromLocation,
  isStarfallLobbyLocation,
  isStarfallDungeonLocation,
  matchesHeroineName,
  getFloorType,
  healRosterAtSafeZoneOrLobby,
} from "@/lib/starfallEngine";
import {
  getTowerThemeForFloor,
  getTotalWavesForFloor,
  matchCuratedEnemyFromProse,
} from "@/lib/starfallTowerThemes";
import {
  startFloorCombatEncounter,
  resolveStarfallCombatTurn,
  syncEncounterWithProseIfVicinity,
  isActionEngagingHostile,
  StarfallCombatResolutionResult,
} from "@/lib/starfallCombatEngine";
import {
  buildAshVelvetPromptDirective,
  createInitialAshVelvetState,
  evaluateAshVelvetClockAndScheduleTick,
  inferNaturalWardrobeKey,
  isOffSiteRedbridgeLocation,
  locationsMatchAshVelvet,
  resolveAshVelvetDestinationFromAction,
  resolveHeroineMeters,
} from "@/lib/ashVelvetEngine";
import {
  executeOocTwoPassTurn,
  shouldUseOocTwoPassEngine,
  buildCleanConversationHistory,
  parseOocInput,
  extractOpenRouterErrorInfo,
  isIntimateSceneContext,
  resolveChoiceModelChain,
} from "@/lib/oocNarrativeEngine";
import {
  detectPresentCompanionsFromProse,
  matchCanonicalCompanionName,
} from "@/lib/scenePresence";

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

/**
 * Only enable OpenRouter `response_format: { type: "json_object" }` on models with native
 * schema-Safe JSON mode. Fine-tuned RP models (Euryale, Lunaris, Cydonia, Magnum, MythoMax)
 * suffer grammar-sampler collapse on OpenRouter (emitting `[1]`, empty 0-byte bodies, or mangled keys)
 * when `json_object` mode is forced, whereas they output clean JSON directly from prompt instructions.
 */
function shouldUseJsonObjectFormat(model: string): boolean {
  const m = (model || "").toLowerCase();
  return m.startsWith("google/") || m.includes("gemini") || m.startsWith("openai/");
}

/**
 * Calibrates max_tokens per model architecture and context window so requests never exceed
 * context limits (e.g. MythoMax 4k, Lunaris 8k) or stall past serverless timeouts.
 */
function getModelMaxTokens(model: string, baseMaxTokens: number): number {
  const m = (model || "").toLowerCase();
  if (m.includes("mythomax")) return Math.min(baseMaxTokens, 1100);
  if (m.includes("lunaris-8b")) return Math.min(baseMaxTokens, 1800);
  return Math.min(baseMaxTokens, 6144);
}

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
      summonContext = null, // { newlySummonedNames: string[], pullSummary: string }
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
      directorNotes = null,
      continueFromMessageText = null,
    } = body;

    const effectiveTemperature = typeof temperature === "number" ? Math.max(0.1, Math.min(1.8, temperature)) : 0.75;
    const effectiveNarrativeDepth: NarrativeDepthMode =
      narrativeDepth === "standard" || narrativeDepth === "expansive" || narrativeDepth === "deep_novelistic"
        ? narrativeDepth
        : "deep_novelistic";
    const requestedMaxTokens = typeof max_tokens === "number" ? Math.max(512, Math.min(6144, max_tokens)) : 3584;
    const effectiveMaxTokens = requestedMaxTokens;
    const effectiveRepetitionPenalty = typeof repetition_penalty === "number" ? Math.max(1.0, Math.min(1.5, repetition_penalty)) : 1.1;
    const paragraphSpecLabel =
      effectiveNarrativeDepth === "standard"
        ? "2 to 3 evocative paragraphs"
        : effectiveNarrativeDepth === "expansive"
        ? "3 to 5 detailed paragraphs (approx. 300–450 words)"
        : "5 to 7+ rich, novel-length paragraphs (450–800+ words) with multi-stage dialogue";

    // Smart auto-detection: If targetEnvironment is local but modelId has a cloud slug or hybrid alias,
    // auto-route to cloud!
    let effectiveEnvironment = targetEnvironment;
    if (
      effectiveEnvironment === "local" &&
      modelId &&
      (modelId.includes("/") ||
        modelId.startsWith("orchestrated-hybrid") ||
        modelId.startsWith("ooc-two-pass"))
    ) {
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

    // Track physical presence of companions in the active scene (strictly excluding FALLEN Starfall heroines)
    const fallenMemorialSet = new Set<string>(
      (playerProfile?.labyrinthState?.memorial || []).map((m: any) =>
        typeof m?.name === "string" ? m.name.trim().toLowerCase() : ""
      )
    );
    const isHeroineFallen = (c: any) => {
      if (!c) return false;
      if (c.heroStatus === "FALLEN") return true;
      const nm = typeof c.name === "string" ? c.name.trim().toLowerCase() : "";
      return Boolean(nm && fallenMemorialSet.has(nm));
    };

    const rawPhysicallyPresentCompanions = (partyMembers || []).filter(
      (c: any) => Boolean(c?.isPresent) && !isHeroineFallen(c)
    );
    const isAshVelvetStoryEarly =
      storyContext?.id === "ash-and-velvet" || storyContext?.contentRating === "adult_18";
    const avDestLocation = isAshVelvetStoryEarly
      ? resolveAshVelvetDestinationFromAction(String(action || ""), gameState?.location || "")
      : null;
    const avEffectiveTurnLocation =
      avDestLocation || gameState?.location || "Clara's Kitchen & Living Room";

    const avLockedIntimateNames: string[] = isAshVelvetStoryEarly
      ? rawPhysicallyPresentCompanions
          .filter((c: any) => {
            const m = resolveHeroineMeters(c);
            return (
              m.lust >= 45 ||
              isIntimateSceneContext({
                actionText: String(action || ""),
                latestDialogue: gameState?.dialogue,
                recentHistory: Array.isArray(recentHistory) ? recentHistory : [],
                presentCompanions: rawPhysicallyPresentCompanions,
                storyId: storyContext?.id,
                location: gameState?.location,
              })
            );
          })
          .map((c: any) => String(c.name))
      : [];

    const avPreTurnScheduleEval = isAshVelvetStoryEarly
      ? evaluateAshVelvetClockAndScheduleTick(
          playerProfile?.ashVelvetState || createInitialAshVelvetState(undefined, playerProfile?.gold ?? 65),
          {
            explicitTimeJump: /\b(sleep|wake up|woke up|next morning|work a shift|worked a shift|hours later|call it a night|until morning|after work|go to bed|crash for the night|later that evening|later that night|wait until (?:morning|afternoon|evening|night|midnight))\b/i.test(
              String(action || "")
            ),
            movedOffSite:
              Boolean(avDestLocation) &&
              (isOffSiteRedbridgeLocation(avDestLocation!) ||
                isOffSiteRedbridgeLocation(gameState?.location || "")),
            movedRoomInHouse:
              Boolean(avDestLocation) &&
              !isOffSiteRedbridgeLocation(avDestLocation!) &&
              !isOffSiteRedbridgeLocation(gameState?.location || ""),
            playerLocation: avEffectiveTurnLocation,
            presentHeroineNames: avDestLocation
              ? []
              : rawPhysicallyPresentCompanions.map((c: any) => String(c.name)),
            lockedIntimateHeroineNames: avDestLocation ? [] : avLockedIntimateNames,
            suppressWalkIns: Boolean(avDestLocation) || Boolean(continueFromMessageText),
          }
        )
      : null;

    const avScheduledInRoomNames: string[] =
      isAshVelvetStoryEarly && avPreTurnScheduleEval
        ? Object.entries(avPreTurnScheduleEval.nextState.heroineLocations)
            .filter(([, room]) => locationsMatchAshVelvet(room, avEffectiveTurnLocation))
            .map(([hName]) => hName)
        : [];

    const physicallyPresentCompanions = (() => {
      if (!isAshVelvetStoryEarly || !avPreTurnScheduleEval) {
        return rawPhysicallyPresentCompanions;
      }
      if (avDestLocation) {
        // Player explicitly traveled to a new room/venue: populate who is actually at that destination right now!
        return (partyMembers || [])
          .filter(
            (c: any) =>
              !isHeroineFallen(c) &&
              avScheduledInRoomNames.some(
                (sn) => sn.toLowerCase() === String(c?.name || "").toLowerCase()
              )
          )
          .map((c: any) => ({
            ...c,
            isPresent: true,
            activeWardrobe:
              c.activeWardrobe && String(c.activeWardrobe).startsWith("nsfw_")
                ? "base"
                : inferNaturalWardrobeKey(
                    c.name,
                    avDestLocation,
                    avPreTurnScheduleEval.nextState.timeSlot,
                    avPreTurnScheduleEval.nextState.clockLabel
                  ),
          }));
      }
      // Staying in current room: include any scheduled common-room walk-ins
      if (avPreTurnScheduleEval.arrivingHeroines.length > 0) {
        const arrivingSet = new Set(
          avPreTurnScheduleEval.arrivingHeroines.map((a) => a.heroineName.toLowerCase())
        );
        const added = (partyMembers || [])
          .filter(
            (c: any) =>
              !isHeroineFallen(c) &&
              arrivingSet.has(String(c?.name || "").toLowerCase()) &&
              !rawPhysicallyPresentCompanions.some(
                (p: any) => String(p?.name || "").toLowerCase() === String(c?.name || "").toLowerCase()
              )
          )
          .map((c: any) => ({
            ...c,
            isPresent: true,
            activeWardrobe: inferNaturalWardrobeKey(
              c.name,
              avEffectiveTurnLocation,
              avPreTurnScheduleEval.nextState.timeSlot,
              avPreTurnScheduleEval.nextState.clockLabel
            ),
          }));
        return [...rawPhysicallyPresentCompanions, ...added];
      }
      return rawPhysicallyPresentCompanions;
    })();

    const isProtagonistAlone = physicallyPresentCompanions.length === 0;
    const presentHeroineNames = physicallyPresentCompanions.map((c: any) => c.name);

    // Sanitize active speaker context to ensure protagonist or FALLEN heroine is never passed as active speaker
    const safePlayerName = (playerProfile?.name || "Wanderer").trim();
    let sanitizedContextSpeaker = gameState?.speaker;
    if (
      !sanitizedContextSpeaker ||
      String(sanitizedContextSpeaker).trim().toLowerCase() === safePlayerName.toLowerCase() ||
      fallenMemorialSet.has(String(sanitizedContextSpeaker).trim().toLowerCase())
    ) {
      sanitizedContextSpeaker = isProtagonistAlone ? "Narrator" : (presentHeroineNames[0] || "Narrator");
    }

    const personaVoice = getPersonaVoiceProfile(
      playerProfile?.personality,
      playerProfile?.personalityTraits
    );
    const playerFirstName = (playerProfile?.name || "Wanderer").trim().split(/\s+/)[0] || playerProfile.name;
    const playerVoiceFingerprint = extractPlayerVoiceStyleFromHistory(
      recentHistory,
      playerProfile?.name,
      action,
      Boolean(isCustom)
    );

    // Dynamic player input directive
    const inputHandlingInstruction = isCustom
      ? `[INPUT TYPE: CUSTOM PLAYER ACTION]
The user wrote their own action verbatim: "${action}".
- Do NOT rewrite, expand, paraphrase, or narrate what the player does or says.
- Set "player_execution" to null.
- Accept their action as immediate canon and advance the scene through world and NPC reactions in "narrative_text".

${playerVoiceFingerprint.promptDirectiveBlock}`
      : `[INPUT TYPE: PRESET CHOICE VECTOR SELECTED]
The user selected this choice/action vector: "${action}".
- CRITICAL: The user did NOT type this text verbatim. This prompt vector represents their tactical and narrative intent following the format "[Tone/Action]: Short summary of character action/dialogue".
- In "player_execution", you MUST write a substantial, immersive narrative sequence from the protagonist's perspective (${playerFirstName}, Role: ${playerProfile.role}, Chosen Personality: "${personaVoice.personaTitle}" [${personaVoice.traitsList.join(", ")}], Stance: ${activeStance || "neutral"}).
- PERSONALITY & CONVERSATIONAL VOICE MANDATE FOR "player_execution":
  * Speech Cadence: ${personaVoice.speechCadence}
  * Demeanor: ${personaVoice.attitudeAndWorldview}
  * Spoken lines in "player_execution" MUST sound like real, casual human conversation—mirroring the player's own speaking style below (contractions, natural phrasing, zero stiff aristocratic/textbook declarations).
  * Examples of this voice: ${personaVoice.exampleSpokenLines.join(" | ")}
${playerVoiceFingerprint.promptDirectiveBlock}
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

    // Inspect uploaded protagonist avatar if present and not yet described on profile
    let visualDescription: string | null =
      playerProfile?.visualDescription && !isFallbackVisualDescription(playerProfile.visualDescription)
        ? playerProfile.visualDescription
        : null;
    if (playerAvatarBase64 && !visualDescription) {
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

    const isUncladOrNude =
      isExplicitlyNudeOrUnclad(visualDescription) ||
      isExplicitlyNudeOrUnclad(playerProfile?.gear?.armor);
    const effectiveArmor =
      !playerProfile.gear?.armor ||
      /^(none|unarmored|portrait attire.*)$/i.test(playerProfile.gear.armor.trim())
        ? resolvePortraitAttireLabel(
            playerProfile.visualDna,
            visualDescription,
            "Portrait Attire (Unarmored)"
          )
        : playerProfile.gear.armor;

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

    const compatibilityDirective =
      storyContext?.companions && storyContext.companions.length > 0
        ? storyContext.companions
            .filter(
              (c: any) =>
                presentHeroineNames.includes(c.name) ||
                c.name === sanitizedContextSpeaker ||
                (partyMembers || []).some(
                  (pm: any) => pm.name === c.name && (pm.isPresent || pm.encountered)
                )
            )
            .slice(0, 5)
            .map(
              (c: any) =>
                `- ${c.name}: Values ${c.values?.join(", ") || "Honor, Loyalty"}. Dislikes ${c.dislikes?.join(", ") || "Deceit, Cowardice"}.`
            )
            .join("\n") ||
          storyContext.companions
            .slice(0, 4)
            .map(
              (c: any) =>
                `- ${c.name}: Values ${c.values?.join(", ") || "Honor, Loyalty"}. Dislikes ${c.dislikes?.join(", ") || "Deceit, Cowardice"}.`
            )
            .join("\n")
        : `- Evelyn Abbandonato: Values intellect, arcane precision, subtle manipulation, composure. Dislikes crude brute force, groveling, or blind obedience.
- Aria Shadowthorn: Values pragmatism, stealth, tradecraft, quiet competence. Dislikes self-righteous preaching, knightly arrogance, reckless noise.
- Serena: Values impeccable composure, polite duty, decisive lethality, discipline. Dislikes whining, chaos, disrespect to boundaries, false mercy.
- Morgana: Values dark planar ambition, fearlessness, sinister wit, raw resolve. Dislikes cowardice, puritanical righteousness, boring compliance.
- Perci: Values gentleness, patience, protective reassurance, quiet empathy. Dislikes aggression, intimidation, cruelty, sudden shouting.`;

    // Helper to determine active threshold cap for any companion (25% -> 50% -> 75% -> 90% -> 100%)
    const getCompanionCap = (compName?: string) => {
      const norm = (compName || "").toLowerCase().trim();
      if (!norm) return 25;
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

    const allNonFallenCastNames: string[] = (partyMembers || [])
      .filter((c: any) => c?.name && !isHeroineFallen(c))
      .map((c: any) => String(c.name));

    const scenePresenceDirective = isProtagonistAlone
      ? `--- SCENE PRESENCE: PROTAGONIST STARTS THIS TURN ALONE ---
- At the start of this turn, no companions are currently in ${gameState?.location || "this room"}.
- IF the protagonist stays alone in this room and nobody enters:
  * "speaker" MUST BE "Narrator" or "Inner Monologue".
  * "state_updates.present_companions" MUST BE [].
  * "state_updates.affected_companion" MUST BE null and "state_updates.affection_delta" MUST BE 0.
- HOWEVER, if the protagonist moves to a room where cast members are (e.g., the Kitchen, Living Room, Hallway, or another character's room) OR any cast member enters the scene:
  * List EVERY cast member physically present at the end of the turn in "state_updates.present_companions" using exact canonical full names from: [${allNonFallenCastNames.map((n: string) => `"${n}"`).join(", ")}].
  * Set "speaker" to the primary cast member speaking in the scene.`
      : `--- SCENE PRESENCE: HEROINES PRESENT ---
- At the start of this turn, the protagonist (${playerProfile.name}) is with: ${presentHeroineNames.join(", ")}.
- Full canonical cast roster (in case others enter or the protagonist moves rooms): [${allNonFallenCastNames.map((n: string) => `"${n}"`).join(", ")}].
- "speaker" MUST BE the exact canonical name of the active companion speaking (NEVER "${playerProfile.name}").
- "state_updates.present_companions" MUST list ALL heroines physically present in the same room at the END of this turn (keep those who stay, add any who enter or are in a newly entered room, remove any who walk out).
- "state_updates.affected_companion" MUST BE one of the physically present heroines, or null if neutral.
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

    const starGateSummonDirective = summonContext
      ? `--- STAR GATE SUMMONING ARRIVAL DIRECTIVE (MAIN LOBBY) ---
The Star Gate monolith in Star Gate Plaza (Main Lobby) has just resonated with spent Star Shards:
- Pull Summary: ${summonContext.pullSummary || "Star Gate Manifestation"}
- Newly Manifested Heroines: ${(summonContext.newlySummonedNames || []).join(", ") || "Duplicate Star-Echo Resonance"}
${
  Array.isArray(summonContext.newlySummonedNames) && summonContext.newlySummonedNames.length > 0
    ? `CRITICAL SCENE INSTRUCTION: Depict the blinding cyan-and-gold Star Gate pillar shattering in Star Gate Plaza as ${summonContext.newlySummonedNames.join(" and ")} step onto the obsidian stones for the first time! Set "speaker" to "${summonContext.newlySummonedNames[0]}" and have her react in-character to her new squad and 1★ tactician.`
    : `CRITICAL SCENE INSTRUCTION: Depict the Star Gate crystal dissolving into luminous Star-Echo shards that resonate with your existing roster in Star Gate Plaza!`
}`
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
    const safeActionLower = String(action || "").toLowerCase();
    const isCovenantInvoked = Boolean(covenantAction) || safeActionLower.includes("covenant: reality severance");
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
        safeActionLower.includes("lean") ||
        safeActionLower.includes("close") ||
        safeActionLower.includes("kiss") ||
        safeActionLower.includes("touch") ||
        safeActionLower.includes("whisper") ||
        safeActionLower.includes("hold")
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
      {
        ...playerProfile,
        visualDescription: visualDescription || playerProfile?.visualDescription,
      } as any
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
    const isStarfallStory = storyContext?.id === "starfall-labyrinth";
    const isAshVelvetStory =
      storyContext?.id === "ash-and-velvet" || storyContext?.contentRating === "adult_18";
    const ashVelvetDirective = isAshVelvetStory
      ? buildAshVelvetPromptDirective({
          houseState: avPreTurnScheduleEval?.nextState || playerProfile?.ashVelvetState || null,
          presentCompanions: physicallyPresentCompanions,
          location: avEffectiveTurnLocation,
          playerPersonality: playerProfile?.personality,
          playerConduit: playerProfile?.conduit,
          playerRole: playerProfile?.role,
          playerAction: String(action || ""),
          arrivingHeroines: avPreTurnScheduleEval?.arrivingHeroines || [],
          departingHeroines: avPreTurnScheduleEval?.departingHeroines || [],
        })
      : "";
    let portSolarisDirective = "";
    let starfallDirective = "";
    let starfallCombatTelemetryDirective = "";
    let preTurnStarfallCombatResult: StarfallCombatResolutionResult | null = null;
    let preTurnStarfallLabState: any = null;
    let preTurnWaveAdvanceMeta: {
      floor: number;
      clearedWave: number;
      nextWave: number;
      totalWaves: number;
    } | null = null;
    let preTurnFloorClearMeta: ReturnType<typeof completeCurrentFloorAtTransferRing> | null = null;
    let isCampfireRestAction = false;
    let effectiveTurnLocation = gameState?.location || "Star Gate Plaza (Main Lobby)";

    if (isStarfallStory) {
      let baseLabState = syncRosterWithParty(
        playerProfile?.labyrinthState ||
          createInitialLabyrinthState(playerProfile?.sovereignOrigin || "DISCARDED_EX_RANKER", {
            startingHeroineName: presentHeroineNames[0] || sanitizedContextSpeaker,
          }),
        partyMembers || []
      );

      // Detect floor from current location or explicit player floor-entry action
      const locFloor = inferFloorFromLocation(
        gameState?.location,
        baseLabState.currentFloor || 0
      );
      const rawActionStr = String(action || "");
      isCampfireRestAction =
        /\[Safe Zone\/Rest\]|\bcampfire\s+bond\s+rest\b|\brest\s+at\s+the\s+sanctuary\s+hearth\b/i.test(
          rawActionStr
        );
      const preActionRetreatToLobby =
        /\b(return|retreat|head\s+back|extract|go\s+back)\s+(?:to\s+)?(?:the\s+)?(?:star\s+gate\s+plaza|main\s+lobby|floating\s+lobby|lobby|barracks|memorial)\b/i.test(
          rawActionStr
        );
      const isEnteringClearedFloorOrSafeExit =
        preActionRetreatToLobby &&
        (Boolean(baseLabState.floorClearedPendingAscent) ||
          getFloorType(baseLabState.currentFloor || 0) === "SAFE_ZONE" ||
          !baseLabState.activeEncounter?.isActive);
      const actionFloorMatch = rawActionStr.match(
        /\b(?:enter|step\s+into|ascend\s+to|deploy\s+to|advance\s+to)\s+floor\s+(\d{1,3})\b/i
      );
      const implicitFloorEntry =
        (baseLabState.currentFloor || 0) === 0 &&
        (/\b(?:enter|step\s+(?:into|onto|through)|cross|activate|deploy|advance|charge\s+into|move\s+into|descend\s+into|begin\s+(?:the\s+)?ascent)\b.*\b(?:floor\s*1|first\s*floor|transfer\s*ring|star\s*gate|dungeon|labyrinth|tower|antechamber|reliquary|ossuary|sunken|verdant|portal|gate)\b/i.test(
          rawActionStr
        ) ||
          /\bfloor\s*1\s+goblins\b/i.test(rawActionStr));
      const explicitActionFloor = isEnteringClearedFloorOrSafeExit
        ? 0
        : actionFloorMatch
        ? Math.min(100, Math.max(0, parseInt(actionFloorMatch[1], 10)))
        : implicitFloorEntry
        ? Math.max(1, (baseLabState.highestFloorCleared || 0) + 1)
        : null;
      const effectivePreFloor =
        explicitActionFloor !== null ? explicitActionFloor : locFloor;

      if (
        effectivePreFloor !== baseLabState.currentFloor ||
        (explicitActionFloor !== null &&
          explicitActionFloor > 0 &&
          baseLabState.floorClearedPendingAscent)
      ) {
        const nextTotalWaves = getTotalWavesForFloor(effectivePreFloor);
        baseLabState = {
          ...baseLabState,
          currentFloor: effectivePreFloor,
          currentFloorWave: nextTotalWaves > 0 ? 1 : 0,
          currentFloorTotalWaves: nextTotalWaves,
          floorClearedPendingAscent: false,
          activeEncounter: null,
        };
        if (effectivePreFloor === 0 || getFloorType(effectivePreFloor) === "SAFE_ZONE") {
          baseLabState = healRosterAtSafeZoneOrLobby(baseLabState);
        }
      }

      if (effectivePreFloor > 0 && getFloorType(effectivePreFloor) === "SAFE_ZONE") {
        baseLabState = healRosterAtSafeZoneOrLobby(baseLabState);
        if (effectivePreFloor > (baseLabState.highestFloorCleared || 0)) {
          const safeClear = completeCurrentFloorAtTransferRing(baseLabState);
          baseLabState = safeClear.newState;
          preTurnFloorClearMeta = safeClear;
          starfallCombatTelemetryDirective += `\n\n=== [SAFE ZONE SANCTUARY REACHED (FLOOR ${effectivePreFloor}) — CHECKPOINT UNLOCKED!] ===\n- All [WOUNDED] statuses cleared and Heroines restored to 100% HP/MP (+${safeClear.shardsAwarded} Star Shards first-clear bonus).\n- NARRATIVE INSTRUCTION: Narrate the squad crossing into the warm sanctuary glow of Floor ${effectivePreFloor}, their wounds knitting shut and the Transfer Ring checkpoint humming cleanly ahead.`;
        }
      }

      if (
        isCampfireRestAction &&
        !(
          baseLabState.activeEncounter?.isActive &&
          baseLabState.activeEncounter.engagementPhase === "engaged"
        )
      ) {
        if (effectivePreFloor === 0 || getFloorType(effectivePreFloor) === "SAFE_ZONE") {
          baseLabState = healRosterAtSafeZoneOrLobby(baseLabState);
          baseLabState = adjustMasterTrust(baseLabState, 2);
        } else {
          const restedRoster = (baseLabState.roster || []).map((r) => {
            if (r.status === "FALLEN") return r;
            const maxHp = r.combatStats?.maxHp || 100;
            const maxMp = r.combatStats?.maxMp || 60;
            return {
              ...r,
              currentHp: Math.min(maxHp, (r.currentHp ?? maxHp) + Math.round(maxHp * 0.35)),
              currentMp: Math.min(maxMp, (r.currentMp ?? maxMp) + Math.round(maxMp * 0.35)),
            };
          });
          baseLabState = adjustMasterTrust({ ...baseLabState, roster: restedRoster }, 1);
        }
        starfallCombatTelemetryDirective += `\n\n=== [SANCTUARY CAMPFIRE BOND REST EXECUTED] ===\n- The squad takes a quiet breather around the warm hearth / Transfer Ring (${
          effectivePreFloor === 0 || getFloorType(effectivePreFloor) === "SAFE_ZONE"
            ? "100% full HP/MP & Wounded recovery"
            : "+35% Transfer Ring field vitals recovery"
        }).\n- NARRATIVE INSTRUCTION: Focus strictly on atmospheric rest, tending gear, quiet emotional rapport, and preparation. Do NOT ambush them with monsters during this rest turn.`;
      }

      const preFloorType = getFloorType(effectivePreFloor);
      const isExplicitCombatTag = /\[COMBAT:[A-Z_]+/i.test(String(action || ""));

      if (
        effectivePreFloor > 0 &&
        (preFloorType === "COMBAT" ||
          preFloorType === "EVENT" ||
          preFloorType === "GATE_BOSS" ||
          isExplicitCombatTag) &&
        !isCampfireRestAction &&
        !summonContext &&
        !giftItemContext
      ) {
        if (
          baseLabState.activeEncounter &&
          baseLabState.activeEncounter.isActive &&
          baseLabState.activeEncounter.floor === effectivePreFloor &&
          baseLabState.activeEncounter.status === "ongoing"
        ) {
          const engagesNow = isActionEngagingHostile(
            String(action || ""),
            baseLabState.activeEncounter.engagementPhase
          );
          if (engagesNow) {
            // Resolve turn-based tactical combat + hidden 1d20 dice rolls + party swaps!
            const affectionMap: Record<string, number> = {};
            for (const pm of partyMembers || []) {
              if (pm?.name) affectionMap[pm.name] = pm.affection || 0;
            }
            preTurnStarfallCombatResult = resolveStarfallCombatTurn({
              labyrinthState: baseLabState,
              rawPlayerAction: String(action || ""),
              protagonistName: playerProfile?.name || "Tactician",
              protagonistLevel: playerProfile?.level || 1,
              protagonistStats: {
                str: playerProfile?.stats?.str || 12,
                dex: playerProfile?.stats?.dex || 14,
                int: playerProfile?.stats?.int || 15,
              },
              protagonistHp: playerProfile?.stats?.hp ?? 100,
              protagonistMaxHp: playerProfile?.stats?.maxHp ?? 100,
              protagonistMp: playerProfile?.stats?.mp ?? 60,
              protagonistMaxMp: playerProfile?.stats?.maxMp ?? 60,
              companionAffections: affectionMap,
              turnSeed: `${baseLabState.summonSeed || "sf"}:turn${currentTurnNumber}:${effectivePreFloor}`,
            });
            baseLabState = preTurnStarfallCombatResult.nextLabyrinthState;
            starfallCombatTelemetryDirective = preTurnStarfallCombatResult.combatTelemetryBlock;

            // Pre-spawn next wave or activate Transfer Ring BEFORE Pass 1/Pass 2 runs
            if (preTurnStarfallCombatResult.encounter.status === "victory") {
              const clearedWave =
                preTurnStarfallCombatResult.encounter.floorWave ||
                baseLabState.currentFloorWave ||
                1;
              const totalWaves =
                preTurnStarfallCombatResult.encounter.floorTotalWaves ||
                baseLabState.currentFloorTotalWaves ||
                getTotalWavesForFloor(effectivePreFloor) ||
                3;

              if (clearedWave < totalWaves) {
                const nextWave = clearedWave + 1;
                baseLabState = startFloorCombatEncounter(
                  {
                    ...baseLabState,
                    currentFloorWave: nextWave,
                    currentFloorTotalWaves: totalWaves,
                    floorClearedPendingAscent: false,
                    activeEncounter: null,
                  },
                  effectivePreFloor,
                  `${baseLabState.summonSeed || "sf"}:f${effectivePreFloor}:w${nextWave}:${currentTurnNumber}`,
                  true,
                  {
                    initialEngagementPhase: "vicinity",
                    waveNumber: nextWave,
                  }
                );
                preTurnWaveAdvanceMeta = {
                  floor: effectivePreFloor,
                  clearedWave,
                  nextWave,
                  totalWaves,
                };
                const nextPackDesc = (baseLabState.activeEncounter?.enemyUnits || [])
                  .map(
                    (u) => `${u.name} (${u.title}, Tier: ${u.tier}, HP ${u.hp}/${u.maxHp})`
                  )
                  .join(" + ");
                starfallCombatTelemetryDirective += `\n\n=== [WAVE ${clearedWave}/${totalWaves} CLEARED -> NEXT HOSTILE PACK DETECTED IN VICINITY (WAVE ${nextWave}/${totalWaves})] ===
- Newly Approaching Pack on Floor ${effectivePreFloor} (Wave ${nextWave}/${totalWaves}): ${nextPackDesc}
- NARRATIVE INSTRUCTION: First narrate the decisive defeat of Wave ${clearedWave}. Then, in the closing paragraph, have the squad spot or sense the incoming Wave ${nextWave}/${totalWaves} pack (${nextPackDesc}) in the vicinity ahead (do NOT engage them yet—give tactical choices to ambush, scout, or strike them next turn!).`;
              } else {
                const floorDone = completeCurrentFloorAtTransferRing(baseLabState);
                baseLabState = floorDone.newState;
                preTurnFloorClearMeta = floorDone;
                starfallCombatTelemetryDirective += `\n\n=== [FLOOR ${effectivePreFloor} ALL WAVES CLEARED (${clearedWave}/${totalWaves}) — TRANSFER RING ILLUMINATED!] ===
- Floor ${effectivePreFloor} Status: ALL HOSTILE WAVES DEFEATED! The Floor Transfer Ring now hums with pale cyan starlight.
- NARRATIVE INSTRUCTION: Narrate the final enemy of Wave ${clearedWave}/${totalWaves} collapsing into Star Ash and the chamber falling quiet as the Transfer Ring activates. Do NOT auto-move the party to Floor ${effectivePreFloor + 1} yet—let them catch their breath at the Transfer Ring and offer choices to ascend to Floor ${Math.min(100, effectivePreFloor + 1)}, check on wounded teammates, or extract to Star Gate Plaza!`;
              }
            }
          } else {
            const packUnitsDesc =
              (baseLabState.activeEncounter.enemyUnits || [])
                .map((u) => `${u.name} (${u.title}, Tier: ${u.tier}, HP ${u.hp}/${u.maxHp})`)
                .join(" + ") ||
              `${baseLabState.activeEncounter.enemyName} (${baseLabState.activeEncounter.enemyTitle}, Tier: ${baseLabState.activeEncounter.enemyTier || "COMMON"})`;
            starfallCombatTelemetryDirective = `=== [HOSTILE PACK IN VICINITY — STEALTH / RECONNAISSANCE PHASE — FLOOR ${effectivePreFloor} WAVE ${baseLabState.activeEncounter.floorWave || 1}/${baseLabState.activeEncounter.floorTotalWaves || 3}] ===
- Locked Curated Hostile Pack Nearby: ${packUnitsDesc}
- Room Geometry: ${baseLabState.activeEncounter.layoutName} — ${baseLabState.activeEncounter.layoutGeometry}
- Current Status: The party is scouting/positioning in the vicinity of ${packUnitsDesc}; direct clash has NOT started yet. Refer ONLY to these monsters.`;
          }
        } else if (!baseLabState.floorClearedPendingAscent) {
          // Entering a new combat or boss floor — initialize themed encounter in vicinity (or engaged for Gate Bosses)!
          baseLabState = startFloorCombatEncounter(
            baseLabState,
            effectivePreFloor,
            `${baseLabState.summonSeed || "sf"}:init:${effectivePreFloor}:${currentTurnNumber}`
          );
          if (baseLabState.activeEncounter) {
            const packUnitsDesc =
              (baseLabState.activeEncounter.enemyUnits || [])
                .map((u) => `${u.name} [${u.tier}, HP ${u.hp}/${u.maxHp}, Poise ${u.poise}]`)
                .join(" + ") ||
              `${baseLabState.activeEncounter.enemyName} (${baseLabState.activeEncounter.enemyTitle}, Tier: ${baseLabState.activeEncounter.enemyTier || "COMMON"}) [HP ${baseLabState.activeEncounter.enemyHp}/${baseLabState.activeEncounter.enemyMaxHp}]`;
            starfallCombatTelemetryDirective = `=== [NEW FLOOR ENCOUNTER DETECTED — FLOOR ${effectivePreFloor} WAVE ${baseLabState.activeEncounter.floorWave || 1}/${baseLabState.activeEncounter.floorTotalWaves || 3}] ===
- Phase: ${baseLabState.activeEncounter.engagementPhase === "vicinity" ? "HOSTILE PACK IN VICINITY (Approach / Scouting)" : "GATE BOSS ENGAGED"}
- Stratum Theme: ${baseLabState.activeEncounter.themeName} (${baseLabState.activeEncounter.environmentalLawName})
- Room Geometry: ${baseLabState.activeEncounter.layoutName} — ${baseLabState.activeEncounter.layoutGeometry}
- Interactive Terrain: ${baseLabState.activeEncounter.terrainTags.join(", ")}
- Hostile Pack Manifested: ${packUnitsDesc}
- Opening Telegraph: [${baseLabState.activeEncounter.currentTelegraph.label}] — ${baseLabState.activeEncounter.currentTelegraph.telegraphText}${
              baseLabState.activeEncounter.masterSealOrder
                ? `\n- Intrusive Master Command Seal: ${baseLabState.activeEncounter.masterSealOrder.commandText}`
                : ""
            }`;
          }
        }
      }

      effectiveTurnLocation =
        effectivePreFloor === 0
          ? locFloor > 0 || isEnteringClearedFloorOrSafeExit
            ? "Star Gate Plaza (Main Lobby)"
            : gameState?.location || "Star Gate Plaza (Main Lobby)"
          : preTurnFloorClearMeta
          ? getFloorType(effectivePreFloor) === "SAFE_ZONE"
            ? `Floor ${effectivePreFloor} — Safe Zone Sanctuary`
            : `Floor ${effectivePreFloor} — Floor Transfer Ring (Cleared)`
          : preTurnWaveAdvanceMeta
          ? `Floor ${effectivePreFloor} — ${
              baseLabState.activeEncounter?.layoutName || "Labyrinth Chamber"
            } (Wave ${preTurnWaveAdvanceMeta.nextWave}/${preTurnWaveAdvanceMeta.totalWaves})`
          : effectivePreFloor !== locFloor
          ? `Floor ${effectivePreFloor} — ${
              baseLabState.activeEncounter?.layoutName ||
              (getFloorType(effectivePreFloor) === "SAFE_ZONE"
                ? "Safe Zone Sanctuary"
                : "Labyrinth Corridor")
            }`
          : gameState?.location || "Star Gate Plaza (Main Lobby)";

      preTurnStarfallLabState = baseLabState;
      starfallDirective = buildStarfallTurnDirective({
        protagonistName: playerProfile?.name || "Tactician",
        protagonistLevel: playerProfile?.level || 1,
        labyrinthState: baseLabState,
        currentLocation: effectiveTurnLocation,
        activeSpeaker: sanitizedContextSpeaker,
        deployedHeroines: presentHeroineNames,
      });
      if (starGateSummonDirective) {
        starfallDirective += `\n\n${starGateSummonDirective}`;
      }
    }
    if (isPortSolarisStory) {
      const speakerPartyMember = (partyMembers || []).find((c: any) =>
        c?.name && sanitizedContextSpeaker && String(c.name).toLowerCase().includes(String(sanitizedContextSpeaker).toLowerCase())
      );
      const speakerDossier =
        PORT_SOLARIS_HEROINE_DOSSIERS[sanitizedContextSpeaker] ||
        Object.values(PORT_SOLARIS_HEROINE_DOSSIERS).find(
          (d) => sanitizedContextSpeaker && d?.name && String(sanitizedContextSpeaker).toLowerCase().includes(String(d.name).toLowerCase())
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

    const buildSinglePassFallbackPrompts = () => {
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
        playerHeight: playerProfile.height,
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
        recentHistory: Array.isArray(recentHistory) ? recentHistory : [],
        lastPlayerAction: action,
        speakerKnowsPlayerName: activeSpeakerKnowledge.knowsName,
      });

      const systemPrompt = `You are the Game Master, Narrator, and World Engine for "${storyTitle}", an interactive visual novel set in ${settingName}.

${isPortSolarisStory ? portSolarisDirective + "\n\n" : ""}${isStarfallStory ? starfallDirective + "\n\n" : ""}${isAshVelvetStory ? ashVelvetDirective + "\n\n" : ""}${getNarrationProseDirective(effectiveTone, effectiveNarrativeDepth)}

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
5. Choices: Always generate 4 distinct, conversational prompt options for the next turn. Every single choice MUST strictly follow this format:
   "[Tone/Action]: 'Natural conversational spoken line in player voice' + concrete physical action"
   Examples:
   ${
     isPortSolarisStory
       ? `- "[Culinary/Flair]: 'Give me two minutes at the stove—I'll let the plate do the talking.' Fire up the flat-top range to plate a midnight comfort special."
   - "[Banter/Pushback]: 'Whoa, wait—you're seriously leaning on Article 6 Clause 6B right now?' Lean across the bar with an amused grin to call her bluff."
   - "[Heart-to-Heart/Deepen]: 'Okay, drop the clipboard for a second—what's actually bugging you?' Pour two chilled glasses and catch her eye."
   - "[Article 9/Wager]: 'Alright, let's settle this properly—Sunset Rambla taste-off, winner calls the shots.' Ring the brass ship's bell cleanly."`
       : isStarfallStory
       ? `- "[Meta-Knowledge/Callout]: 'Hey, step behind that cracked left pillar—two seconds, hurry.' Pull the squad clear right before the boss's breath sweep."
   - "[Guard/Protect]: 'Hold on, I've got your left—don't move!' Step in cleanly to intercept the flanking hound's lunge before it touches Pia."
   - "[Loophole/Bold]: 'Wait—the side culvert counts for the timer, doesn't it?' Motion the squad into the drainage tunnel to beat the Master's clock safely."
   - "[Move/Transition]: 'Everybody grab breath—let's head back through the ring to Star Gate Plaza.' Lead the squad cleanly back to the lobby to regroup."`
       : isAshVelvetStory
       ? `- "[Tease/Flirt]: 'Careful, keep standing in the hallway like that and I'll forget my manners.' Lean against the doorframe with an easy smirk and hold her gaze."
   - "[Honest/Vulnerable]: 'Didn't sleep much—figured coffee was better than staring at the ceiling.' Sit beside her on the counter stool and let your shoulder brush hers."
   - "[Nightlife/Bold]: 'Pour two more and tell me who's pissing you off tonight.' Slide a neat glass across the dive bar top and step between her and the loud regular."
   - "[Boundary/Steady]: 'Hey—breathe. Nobody's kicking this door in tonight, I've got you.' Catch her hand gently and guide her back inside off the rain-soaked patio."`
       : `- "[Combat/Aggressive]: 'Alright, let's end this before they regroup!' Step forward and drive your blade toward the beast's exposed flank."
   - "[Arcana/Analytical]: 'Hold on—look at how that rune flickers.' Channel ether into your palm to trace the flaw in the containment ward."
   - "[Subterfuge/Cunning]: 'Keep 'em talking for ten seconds—I've got the lock.' Slip into the perimeter shadows toward the cargo vault."
   - "[Inquire/Direct]: 'Okay, skip the act—what does your house actually want here?' Lower your weapon an inch and meet her gaze straight on."`
   }
   Keep spoken lines casual, natural, and tuned to ${playerFirstName}'s actual speaking style (use contractions, everyday rhythm, zero stiff/courtroom speeches).
6. Narrative Prose, Grammar & Strict Plain-Text JSON Formatting:
   - GRAMMATICAL & CONVERSATIONAL SEPARATION: Keep surrounding narrative prose clean and past-tense with active verbs and zero mechanical AI clichés. However, SPOKEN DIALOGUE inside quotes ("..." and '...') is EXEMPT from formal-essay clause rules—use natural contractions ("I'm", "don't", "you're", "let's"), casual interjections, and natural conversational fragments ("Wait—seriously?", "Yeah, no chance.", "Hold on.") so both the protagonist and heroines talk like real people.
   - NATURAL, DECIPHERABLE SPOKEN DIALOGUE (CRITICAL): Keep surrounding narrative prose rich and atmospheric, but make all spoken character dialogue inside quotation marks ("...") sound like a real human being talking out loud. Preserve each heroine's distinct personality, attitude, and edge, while using natural contractions ("don't", "you're", "I'll") and direct, conversational phrasing. NEVER write robotic, overly verbose, or textbook-jargon speeches in dialogue (no pseudo-academic phrases like "arborio starch emulsion", "temporary acquiescence", "cervical seal", or "negative frame advantage").
   - MANDATORY DOUBLE QUOTATION MARKS: ALL spoken dialogue in both "player_execution" and "narrative_text" MUST be enclosed in standard double quotation marks ("..."). NEVER wrap spoken dialogue in single quotes ('...'). Anchor dialogue to physical gestures, body language, tone, or facial expressions.
   - STRICT NEGATIVE CONSTRAINT: NEVER end "narrative_text" with meta-narration or question clichés such as "The choice of what happens next hangs in the balance", "What will you do next?", "The choice is yours", or "Only time will tell". Conclude cleanly and naturally on an active sensory beat, spoken dialogue line, or environmental detail.
   - ZERO INLINE MARKDOWN IN PROSE: DO NOT output Markdown asterisks (*italics* or **bold**), underscores, headers (#), or Markdown tables inside "narrative_text" or "player_execution". Output clean, publication-grade plain text paragraphs separated by "\\n\\n". Place any LitRPG system / tactical readout strings inside "mechanics" or "system_updates.system_announcement".
   - NATURAL HUMAN PROSE — NO CATALOG LABELS OR FULL-NAME REPETITION: Write like a human novelist, never like an RPG database dump. Refer to characters by their first name (${
     isPortSolarisStory
       ? `"${playerFirstName}", "Seraphina", "Mia", "Colette", "Vivienne", "Pippa", "Kaede", "Roxy", "Chloe", "Nadia", "Zuri"`
       : isAshVelvetStory
       ? `"${playerFirstName}", "Clara", "Hannah", "Brianna", "Sierra", "Chloe"`
       : `"${playerFirstName}", "Cassia", "Beatrix", "Ysolde", "Kestrel"`
   }) or pronouns—never repeat full first+last names or inline rank numbers. Never paste capitalized UI item labels (${
     isPortSolarisStory
       ? `"Damascus Chef's Santoku", "Rolled-Sleeve Linen Proprietor Shirt"`
       : `"Notched Chancellery Longsword", "Shadow-Weave Syndicate Jacket"`
   }) or full map headers (${
     isPortSolarisStory
       ? `"Driftwood Cove (The Stray Anchor)"`
       : `"Stratum I: The Sunken Cloisters"`
   }) into narrative sentences; describe tools, clothing, techniques, and rooms naturally.
   - PARAGRAPHING & DEPTH: Structure "narrative_text" into ${paragraphSpecLabel} separated by clean double line breaks ("\\n\\n"). Interleave multiple distinct spoken dialogue segments with physical choreography, psychological subtext, and atmospheric detail.
7. Anti-Sycophancy, Realistic Composure & Tone Rigidity (MANDATORY):
   - Companions MUST NOT default to subservient, agreeable, or overly dazzled reactions.
   - NEVER write sycophantic prose that treats ordinary protagonist actions (e.g., heating a pan, leaning on a counter, speaking calmly, or making a cocky quip) as godlike miracles that leave elite heroines breathless, slack-jawed, comparing him to world-renowned masters, or flushing violently to their ears.
   - At <50% Favor, heroines keep their composure, critique flaws honestly, challenge presumptuous behavior, and require sustained proof before yielding even a grudging nod of respect.
   - If the player suggests a foolish, dangerous, or poorly reasoned action, companions MUST object, criticize, or offer sharp reality checks according to their persona.
8. ${
  isPortSolarisStory
    ? `Article 9 Turf Showdown Escalation Directive ("story_clash"):
   - CASUAL BANTER, PREP & TASTINGS DO NOT TRIGGER FORMAL SHOWDOWNS:
     Ordinary café shifts, flirting, or verbal sparring MUST keep "state_updates.story_clash": null.
   - WHEN AN OFFICIAL ARTICLE 9 SHOWDOWN BEGINS ("story_clash.isActive": true):
     Set "story_clash.isActive": true ONLY when the player or a rival explicitly initiates a formal, binding Article 9 Turf Showdown (e.g. Culinary Clash, Mixology Rush, VIP Audit Debate, Beach Volleyball, or Dojo Pier Kendo Exhibition). All Port Solaris showdowns are strictly non-lethal contests of Composure, Hype, and Cool!`
    : `Hostile Encounter Escalation & Combat Detection Directive ("story_clash"):
   - PROXIMITY, OBSERVATION, STEALTH & STANDOFFS MUST NEVER TRIGGER COMBAT:
     Merely observing an adversary, spotting guards on patrol, tailing a creature, hiding from an abomination, speaking during a tense armed standoff, sizing up an enemy, or sneaking past sentinels MUST NEVER set "state_updates.story_clash.isActive": true.
     In these turns, keep "story_clash": null so the player retains narrative agency (to stealth past, negotiate, investigate, retreat, or cast prep buffs).
   - WHEN COMBAT HAS ACTIVELY STARTED ("story_clash.isActive": true):
     ONLY set "story_clash.isActive": true when:
     1. The player explicitly initiates an attack or offensive action (e.g. "[Combat/Aggressive]", swinging a weapon, casting offensive magic, shooting), OR
     2. An enemy explicitly executes an unavoidable lethal ambush, lunge, or physical melee charge where physical blows are actively struck and exchanged this turn.`
}

${
  isPortSolarisStory
    ? `--- ABSOLUTE SYSTEM DIRECTIVE: PORT SOLARIS REAL STAKES (NON-LETHAL AUDIT, SCANDAL & COMPOSURE CONSEQUENCES) ---
DO NOT SAFEGUARD THE PROTAGONIST FROM EMBARRASSMENT OR FINANCIAL BLUNDERS:
1. ALLOW REAL CULINARY, SOCIAL & BUSINESS MISTAKES:
   - Under Port Solaris Charter Article 3A, lethal violence is strictly non-existent ("death_event" MUST ALWAYS BE null).
   - However, if the player makes a foolish, arrogant, or sloppy move (serving burnt food, citing a fake Charter Article, wearing another girl's Keepsake on a date, or botching a VIP audit), apply real coastal consequences: sharp heroine pushback, Composure loss, Scandal Heat spikes in "The Solaris Siren", or audit fines.
2. QUEST & WAGER FAILURES ARE CANON:
   - If an active quest or Article 9 wager objective is ruined by the player's blunders, mark the quest as "failed" in "system_updates.quest_updates" and narrate the comedic or financial fallout (e.g. washing dishes for a week, buying parfaits for the Breakers Union, or losing ground on the 30-day Star Audit).`
    : isStarfallStory
    ? `--- ABSOLUTE SYSTEM DIRECTIVE: STARFALL LABYRINTH PERMADEATH & FINAL GAME OVER ---
REMOVE ALL ARTIFICIAL PLOT ARMOR — COVENANT VI IS IN EFFECT:
1. DEPLOYED HEROINE PERMADEATH ("starfall_updates.hero_casualties"):
   - Smart tactical play, meta-knowledge callouts, and protective formations KEEP YOUR SQUAD ALIVE.
   - However, if the player executes a genuinely suicidal blunder inside a lethal combat floor or Gate Boss arena (ignoring a boss telegraph, using a wounded teammate as unshielded bait, or rushing a Gate Boss unprepared), DEPLOYED heroines CAN AND WILL DIE PERMANENTLY.
   - When a deployed heroine dies in prose this turn, narrate her shattering into cold Star Ash with emotional weight and populate "starfall_updates.hero_casualties": [{ "name": "<Exact Heroine Name>", "cause": "<Short visceral cause>" }]. Never mark benched Lobby heroines as casualties.
2. PROTAGONIST DEATH IS FINAL GAME OVER (NO REGRESSION):
   - If ${playerProfile.name}'s own action is fatal or HP collapses under an unblocked boss strike, set "death_event": { "is_fatal": true, "cause_of_death": "<Brief visceral cause>", "killer_or_hazard": "<Entity or hazard name>" }.
   - End "narrative_text" with: "[ADMINISTRATOR NOTICE: Unit vital signature extinguished. Star core shattered. Connection terminated.]" — NEVER mention regression or timeline rewinds!`
    : `--- ABSOLUTE SYSTEM DIRECTIVE: NO PLAYER SAFEGUARDING & REAL MORTAL CONSEQUENCES ---
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
     * The game client will intercept this death event, award the regression timeline echo, and rewind reality to an anchor point with retained memories and power.`
}

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

${ashVelvetDirective ? `\n${ashVelvetDirective}\n` : ""}
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
1. QUEST OBJECTIVE EVALUATION, DIFFICULTY RANKING & STATUS:
   - Carefully evaluate the player's action against the pending objectives of active quests.
   - If an objective is satisfied, include its 0-based index in "system_updates.quest_updates.completed_objective_indices".
   - CRITICAL STATUS DETERMINATION:
     * "status": "active" -> MANDATORY whenever ANY objective in the quest remains pending/unfulfilled. Do NOT mark the quest completed while objectives are still outstanding!
     * "status": "completed" -> Use ONLY when EVERY single objective in the quest is completely fulfilled.
     * "status": "failed" -> Use ONLY if an objective is ruined, timed out, or compromised beyond recovery.
   - PREVENT DUPLICATION: Do NOT assign or regenerate quests that are already active or listed in "Completed & Archived Scenarios".
   - STRICT QUEST RANKING BY ACTUAL DIFFICULTY & LENGTH OF COMPLETION ("system_updates.new_quest"):
     * NEVER randomly assign "S" or "A" rank to early or short quests! Rank every new quest strictly by its ACTUAL difficulty, current campaign stage (Player Level: ${playerProfile.level || 1}), and number of objectives (length of completion):
       - "E" Rank (45–75 EXP): Short 1–2 objective routine tasks, introductions, recon, or minor prep.
       - "D" Rank (85–135 EXP): 2 objective local tasks, minor social/kitchen wagers, or low-risk skirmishes.
       - "C" Rank (150–230 EXP): Standard 2–3 objective multi-step scenarios, investigations, or sector trials. (Maximum normal rank at Player Level 1–3).
       - "B" Rank (260–390 EXP): 3–4 objective high-stakes showdowns, boss clashes, or major milestone trials.
       - "A" Rank (450–680 EXP): 4+ objective multi-sector arc finales (requires Player Level 4+).
       - "S" Rank (750–1150 EXP): Reserved EXCLUSIVELY for 4–5+ objective late-game campaign climaxes (requires Player Level 8+).
     * EARNED-ONLY EXP RULE ("player_progression.exp_gained"): Output 0 EXP for casual chat, romance banter, resting, shopping, or walking! Output 12–26 EXP ONLY for genuine tactical maneuvers, trap disarms, training, or active skill checks, and 24–48 EXP ONLY for live combat skirmishes or lethal hazards. NEVER output thousands of EXP.
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
  "narrative_text": string, // ${paragraphSpecLabel} separated by "\\n\\n", containing rich environmental sensory details, psychological subtext, physical micro-expressions, and multiple character dialogue segments in escaped double quotation marks (\\"...\\"). Spoken dialogue inside quotes MUST sound natural, decipherable, and human-like (no overly verbose or textbook jargon). Flawless grammar and syntax. ZERO Markdown asterisks (* or **). MUST STRICTLY adhere to the active Narration Style and Narrative Depth Directive.
  "suggested_choices": [string, string, string, string], // 4 fresh, scene-specific choices directly answering what just happened in narrative_text, strictly formatted as "[Tone/Action]: 'Spoken dialogue in persona voice' + concrete physical action"
  "state_updates": {
    "current_location": string,
    "mood": string,
    "expression_key": "neutral" | "intrigued" | "flustered" | "smug" | "surprised" | "combat_ready" | "dangerous" | "hurt" | "beckon", // Use "hurt" strictly for physical battle wounds/bleeding in combat—never for emotional worry or anxiety (use "flustered", "surprised", or "intrigued" instead)
    "wardrobe_key": string | null, // Optional outfit key for the active speaker when story supports wardrobe states (e.g. "base", "kitchen", "lounge", "date", "nightwear", "overalls", "nightout", "casual", "party", "diner", "swim", "office", "afterhours")
    "affected_companion": string | null,
    "affection_delta": number,${
      isAshVelvetStory
        ? `
    "lust_delta": number, // -6 to +10 physical heat/desire delta for the active heroine
    "sensitivity_delta": number, // -2 to +10 doujin body sensitivity/conditioning delta when protagonist stares at, teases, or touches the active heroine
    "submission_delta": number, // -6 to +8 power-dynamic yield delta (positive when heroine yields/softens to protagonist's poise)
    "trust_delta": number, // -10 to +8 psychological safety/trust delta
    "jealousy_delta": number, // -5 to +10 rival friction/jealousy delta
    "vice_delta": number, // -10 to +20 alcohol/vice intoxication delta for protagonist
    "composure_delta": number, // -12 to +12 emotional steadiness delta for protagonist
    "cash_delta": number, // USD earned or spent this turn (0 if none)
    "advance_time_slot": boolean, // true ONLY when the scene naturally advances to the next part of the day/night`
        : ""
    }
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
      "knowsOrigin": boolean, // Set true ONLY if the protagonist explicitly revealed their Regressor/System origin in this turn
      "learned_fact": string | null // Concise 1-sentence personal fact if the companion learned something new about the protagonist (background, promise, preference, specialty, goal), else null
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
    "exp_gained": number, // EARNED-ONLY EXP: 0 for casual chat, flirting, resting, shopping, or walking; 12–26 for skill checks, trap disarms, or active techniques; 24–48 for live combat skirmishes
    "exp_reason": string | null, // Short 2-5 word label when exp_gained > 0 (e.g. "Disarmed Spire Trap", "Ambush Counterplay"), or null when exp_gained is 0
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
      "difficulty": "E" | "D" | "C" | "B" | "A" | "S" | "Calamity", // Ranked strictly by objective count (1-2=E/D, 3=C/B, 4+=A/S) and player level (early game capped at C/B)
      "objectives": [
        { "text": string, "completed": boolean }
      ],
      "rewards": {
        "exp": number, // Calibrated strictly to rank: E(35-55), D(60-90), C(95-140), B(150-220), A(240-340), S(360-480)
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
  } | null${
    isStarfallStory
      ? `,
  "starfall_updates": {
    "floor_cleared": boolean, // Set true ONLY when the squad decisively clears the active Labyrinth floor or defeats its Gate Boss this turn
    "hero_casualties": [{ "name": string, "cause": string }], // Empty [] unless a DEPLOYED heroine genuinely perished in combat prose this turn
    "star_shards_earned": number, // 0 on normal dialogue turns; 5-25 on combat victories, hidden caches, or Master rewards
    "master_command": string | null, // Optional short Command Seal broadcast from the unseen Master if issued this turn, else null
    "master_trust_delta": number // -15 to +15 based on clean clears (+trust) vs open defiance or sloppy losses (-trust)
  } | null`
      : ""
  }
}

--- CURRENT CAMPAIGN STATE & DYNAMIC TURN CONTEXT ---
- Protagonist (Narrator Reference): ${playerProfile.name} | Spoken Dialogue Address by ${sanitizedContextSpeaker}: ${activeSpeakerKnowledge.knowsName ? `"${playerProfile.name}" (Name Known)` : `"stranger" / "wanderer" (NAME UNKNOWN TO ${sanitizedContextSpeaker.toUpperCase()} — DO NOT USE "${playerProfile.name}" IN DIALOGUE QUOTES)`}
- Gender, Age & Height: ${playerProfile.gender || "Male"} | Age: ${playerProfile.age || "22"} | Height: ${playerProfile.height || "5'11\""}
- World Origin & System Familiarity: ${playerProfile.worldOrigin || "Born & Raised (Native)"}${playerProfile.worldOriginDetails ? ` (${playerProfile.worldOriginDetails})` : ""}
- Chosen Personality & Traits: "${personaVoice.personaTitle}" [${personaVoice.traitsList.join(", ")}] — (${personaVoice.speechCadence})
- Archetype / Class: ${activeSpeakerKnowledge.knowsClass ? `${playerProfile.role} (Lv.${playerProfile.level} — Class Known)` : `[INTERNAL CLASS: ${playerProfile.role} — UNKNOWN TO ${sanitizedContextSpeaker.toUpperCase()} IN DIALOGUE]`}
- Lineage / Race: ${playerProfile.race || "Human"}
- Racial Anatomy & Traits: ${playerProfile.racialTraits && playerProfile.racialTraits.length > 0 ? playerProfile.racialTraits.join(", ") : "Standard human physiology"}
- Vitals & Pools: ${playerVitals.summaryLine}
- Stats: STR ${playerProfile.stats.str} | DEX ${playerProfile.stats.dex} | INT ${playerProfile.stats.int}
- Loadout: Weapon: ${playerProfile.gear.weapon} | Armor: ${effectiveArmor} | Relic: ${playerProfile.gear.relic}
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
${(() => {
  const activeOrEncountered = (partyMembers || []).filter(
    (c: any) => c.isPresent || c.encountered || c.name === sanitizedContextSpeaker
  );
  const unmetOffscreen = (partyMembers || []).filter(
    (c: any) => !c.isPresent && !c.encountered && c.name !== sanitizedContextSpeaker
  );
  const lines = activeOrEncountered.map((c: any) => {
    const encStatus = c.encountered ? "Previously Encountered & Active in Canon" : "Active in Current Scene";
    const cap = getCompanionCap(c.name);
    const isLocked = c.affection >= cap && cap < 100;
    const lockStatus = isLocked
      ? `[LOCKED AT ${cap}% THRESHOLD - COMPANION QUEST PENDING]`
      : `Progression Cap: ${cap}%`;
    const favorDesc =
      c.affection >= 75
        ? "Deep Intimacy & Trust"
        : c.affection >= 50
        ? "Solid Mutual Respect"
        : c.affection >= 25
        ? "Cautious Wariness"
        : "Guarded Distrust";
    const guardProfile = getHeroineResistanceProfile(c);
    return `  * ${c.name} (${c.title || "Companion"}) [${encStatus} | Present: ${Boolean(c.isPresent)} | Guard: ${guardProfile.guardTier} | Favor: ${c.affection}% (${favorDesc}) | ${lockStatus} | Demeanor: ${c.expressionKey || "neutral"}]`;
  });
  if (unmetOffscreen.length > 0) {
    lines.push(
      `  * Unmet Off-Screen Heroines (Present: false, Unencountered, Locked at 25% Threshold): ${unmetOffscreen
        .map((c: any) => `${c.name} (${c.defaultLocation || "Elsewhere"})`)
        .join(", ")}`
    );
  }
  return lines.join("\n");
})()}

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

      const cleanActionSummary = (action || "").replace(/^\[[^\]]+\](?::)?\s*/, "").trim() || action;
      const primaryPendingObj = pendingObjectives[0] || "Resolve the current confrontation and advance to the next scene";

      const userPromptContent = isCustom
        ? `[TURN EXECUTION MANDATE — CUSTOM PLAYER ACTION]
1. Direct Consequence & Story Momentum: In "narrative_text", author ${paragraphSpecLabel} separated by "\\n\\n" that directly answer ${playerFirstName}'s custom action below. Honor their intent (whether lingering in conversation to deepen the moment or pushing the plot to a new stage/location), and ensure the conversation and story stakes evolve forward without repeating prior beats.
2. Zero Scene Re-Staging: The events in the previous turn are FINISHED. Do NOT repeat or reorder any quotes, prop actions, or side-character interruptions from the previous turn, and do NOT write spoken dialogue for ${playerFirstName} inside "narrative_text".
3. 4 Balanced, Conversational Story Choices ("suggested_choices"): Generate 4 distinct choices formatted as "[Tag]: 'Spoken dialogue' + action", matching ${playerFirstName}'s "${personaVoice.personaTitle}" vibe AND mirroring how the player actually talks in their custom action/recent turns (${playerVoiceFingerprint.cadenceSummary} — keep spoken quotes casual, natural, with contractions and zero stiff/formal phrasing):
   - Choice 1 (Advance Objective / Plot): Directly advance the active objective ("${primaryPendingObj}") or bring the current exchange to a meaningful decision.
   - Choice 2 (Linger & Deepen): Stay in the current scene to explore a deeper personal/romantic/banter angle with ${sanitizedContextSpeaker}.
   - Choice 3 (High-Stakes Action / Flair): Take a bold physical action, wager, or hands-on skill move in the scene.
   - Choice 4 ("[Move/Transition]: ..."): Transition out of ${gameState.location} toward a new area or next phase when ready.

>>> NEW PLAYER ACTION TO ANSWER NOW: "${action}" <<<`
        : `[TURN EXECUTION MANDATE — PRESET CHOICE VECTOR]
1. Protagonist Execution ("player_execution"): Expand the choice vector below into a vivid 2-paragraph passage (6–10 sentences separated by "\\n\\n") of ${playerFirstName}'s physical movements and natural, conversational spoken dialogue ("...") in their "${personaVoice.personaTitle}" (${personaVoice.traitsList.join(", ")}) voice (${playerVoiceFingerprint.cadenceSummary} — use contractions, casual human phrasing, and zero stiff/formal dialogue). Strip all bracket tags.
2. World Consequence & Soft Pacing Balance ("narrative_text"): Author ${paragraphSpecLabel} separated by "\\n\\n" showing how ${sanitizedContextSpeaker} and the world directly respond to THIS move ("${cleanActionSummary}").
   - If the player's move stays in the scene to talk or banter, let them stay and deepen the interaction (revealing new character nuance, shifting emotional tension, or advancing what they are doing together—never looping on the same surface argument).
   - If the player's move settles a deal, completes a task, or transitions locations, accept the outcome and advance the plot into its next stage (updating "state_updates.current_location" when moving).
3. Strict Anti-Repetition & Boundary Rules:
   - NEVER write spoken dialogue or actions for ${playerFirstName} inside "narrative_text" (${playerFirstName}'s speech belongs ONLY in "player_execution").
   - NEVER repeat, paraphrase, or shuffle paragraphs, quotes, prop gags, or side-character quips from the previous turn!
4. 4 Balanced, Conversational Story Choices ("suggested_choices"): Write 4 distinct choices formatted as "[Tag]: 'Spoken dialogue' + action" in ${playerFirstName}'s "${personaVoice.personaTitle}" voice, tuned to how the player talks in recent turns (casual contractions, everyday speech rhythm, NEVER stiff or overly proper):
   - Choice 1 (Advance Objective / Plot): Directly advance the active objective ("${primaryPendingObj}") or settle the current point.
   - Choice 2 (Linger & Deepen): Remain in the scene to deepen the conversation, personal connection, or banter with ${sanitizedContextSpeaker} from a fresh angle.
   - Choice 3 (High-Stakes Action / Flair): Initiate a decisive physical action, wager, or signature craft move.
   - Choice 4 ("[Move/Transition]: ..."): Physically lead the way to a new location or next activity when the player is ready to move on.

>>> SELECTED CHOICE VECTOR TO EXECUTE & ANSWER NOW: "${action}" <<<`;

      const continueSeedFallback =
        typeof continueFromMessageText === "string" && continueFromMessageText.trim().length > 0
          ? continueFromMessageText.trim()
          : null;
      const finalUserPromptContent = continueSeedFallback
        ? `[CONTINUATION MANDATE — FINISH UNFINISHED RESPONSE]
Continue seamlessly from the exact stopping point of the passage below. Do NOT repeat any sentence already written, set "player_execution": null, bring in any other present characters who haven't spoken yet, and output ONLY the new continuation prose in "narrative_text" plus fresh "suggested_choices".

PASSAGE WRITTEN SO FAR (ending where generation stopped):
"""
${continueSeedFallback.slice(-2200)}
"""`
        : userPromptContent;

      return { systemPrompt, userPromptContent: finalUserPromptContent };
    };

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

    let responseData: any = null;
    let lastError: any = null;

    const persistentNotes =
      typeof directorNotes === "string" && directorNotes.trim()
        ? directorNotes.trim()
        : playerProfile?.labyrinthState?.directorNotes || null;
    const oocParsedForFallback = parseOocInput(action || "", persistentNotes);

    // Primary Cloud Path: OOC.ai-Grade Two-Pass Engine
    // Pass 1: Pure unescaped literary prose & autonomous subtext (Claude Sonnet 4.6 / DeepSeek V3.2 / chosen RP model)
    // Pass 2: Fast structured JSON state & 4-choice extraction (Gemini 2.5 Flash)
    const normalizedRequestedModel = modelId ? (LEGACY_MODEL_MIGRATIONS[modelId] || modelId) : "";
    if (
      shouldUseOocTwoPassEngine({
        isLocal,
        apiKey,
        modelId: normalizedRequestedModel,
      }) &&
      apiKey
    ) {
      try {
        const specialDirectives = [
          giftingDirective,
          covenantExecutionDirective,
          storyClashDirective,
          multiCompanionDirective,
          timelineEchoDirective,
          timelineScarDirective,
          synergyDirective,
          antiRepetitionDirective,
        ]
          .filter(Boolean)
          .join("\n\n");

        const twoPass = await executeOocTwoPassTurn({
          apiKey,
          userKey: activeUser.key,
          requestedModelId: normalizedRequestedModel,
          temperature: effectiveTemperature,
          maxTokens: effectiveMaxTokens,
          repetitionPenalty: effectiveRepetitionPenalty,
          narrativeDepth: effectiveNarrativeDepth,
          narrationTone: effectiveTone,
          storyId: storyContext?.id,
          storyTitle,
          settingName,
          location: isStarfallStory
            ? effectiveTurnLocation
            : isAshVelvetStory
            ? avEffectiveTurnLocation
            : gameState?.location || "Star Gate Plaza (Main Lobby)",
          timeOfDay: gameState?.timeOfDay,
          playerProfile,
          presentCompanions: physicallyPresentCompanions,
          allCastNames: allNonFallenCastNames,
          scheduledInRoomNames: avScheduledInRoomNames,
          activeSpeakerName: sanitizedContextSpeaker,
          speakerAffection: companionAffection,
          speakerKnowsPlayerName: activeSpeakerKnowledge.knowsName,
          recentHistory: recentHistory || [],
          rawAction: action || "",
          isCustomAction: Boolean(isCustom),
          persistentDirectorNotes: persistentNotes,
          pendingObjectives,
          activeQuests: Array.isArray(systemState?.activeQuests) ? systemState.activeQuests : [],
          completedQuests: Array.isArray(systemState?.completedQuests) ? systemState.completedQuests : [],
          worldSpecificDirective: isStarfallStory
            ? starfallDirective
            : isPortSolarisStory
            ? portSolarisDirective
            : isAshVelvetStory
            ? ashVelvetDirective
            : "",
          combatTelemetryDirective: starfallCombatTelemetryDirective,
          specialEventDirective: specialDirectives,
          knowledgeGateDirective,
          earnedRomanceDirective: dynamicRomanceDirective,
          plotMemories: Array.isArray(plotMemories) ? plotMemories : [],
          pinnedMemories: Array.isArray(playerProfile?.pinnedMemories)
            ? playerProfile.pinnedMemories
            : [],
          speakerKnownFacts: activeSpeakerKnowledge.knownFacts || [],
          turnNumber: currentTurnNumber,
          continueFromMessageText:
            typeof continueFromMessageText === "string" && continueFromMessageText.trim().length > 0
              ? continueFromMessageText.trim()
              : null,
        });

        responseData = twoPass.responseData;
        const userStats =
          !isLocal && authCheck.valid
            ? recordUserTurn(activeUser.key, twoPass.usage, twoPass.creativeModelUsed)
            : activeUser;
        responseData._userStats = userStats;
      } catch (twoPassErr: any) {
        const errMsg = twoPassErr?.message || "";
        if (/OpenRouter API \((?:401|402|403)\)/i.test(errMsg)) {
          throw twoPassErr;
        }
        console.warn(
          "OOC Two-Pass Engine encountered error, falling back to single-pass model chain:",
          errMsg
        );
        lastError = twoPassErr;
        responseData = null;
      }
    }

    const singlePassPrompts = !responseData ? buildSinglePassFallbackPrompts() : null;

    const isIntimateFallbackTurn = isIntimateSceneContext({
      actionText: action,
      latestDialogue: gameState?.dialogue,
      recentHistory: Array.isArray(recentHistory) ? recentHistory : [],
      presentCompanions: physicallyPresentCompanions,
      storyId: storyContext?.id,
      location: gameState?.location,
    });

    const modelsToTry = isLocal
      ? [normalizedRequestedModel || "hermes3:8b", "hermes3:8b"].filter((m, idx, arr) => arr.indexOf(m) === idx)
      : isIntimateFallbackTurn
      ? resolveChoiceModelChain(normalizedRequestedModel, true)
      : (() => {
          const effectiveModelId =
            normalizedRequestedModel === "orchestrated-hybrid" ||
            normalizedRequestedModel === "ooc-two-pass-sonnet" ||
            !normalizedRequestedModel
              ? "google/gemini-2.5-flash"
              : normalizedRequestedModel === "orchestrated-hybrid-deepseek" ||
                normalizedRequestedModel === "ooc-two-pass-deepseek"
              ? "deepseek/deepseek-v3.2"
              : normalizedRequestedModel;
          return effectiveModelId
            ? [effectiveModelId, ...FALLBACK_MODELS.filter((m) => m !== effectiveModelId)]
            : FALLBACK_MODELS;
        })();

    for (let modelIdx = 0; !responseData && singlePassPrompts && modelIdx < modelsToTry.length; modelIdx++) {
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

        const { systemPrompt, userPromptContent } = singlePassPrompts;
        const fallbackSysPromptWithOoc = oocParsedForFallback.combinedDirectorNotes
          ? `${systemPrompt}\n\n${starfallCombatTelemetryDirective}\n\n[OOC DIRECTOR STAGE NOTES]: ${oocParsedForFallback.combinedDirectorNotes}`
          : starfallCombatTelemetryDirective
          ? `${systemPrompt}\n\n${starfallCombatTelemetryDirective}`
          : systemPrompt;

        // Construct model-appropriate messages payload with clean 24-message conversation history
        const modelMessages: any[] = [{ role: "system", content: fallbackSysPromptWithOoc }];
        const cleanFallbackHistory = buildCleanConversationHistory(
          recentHistory,
          playerProfile.name,
          24
        );
        for (const hMsg of cleanFallbackHistory) {
          modelMessages.push(hMsg);
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
        const modelMaxTokens = getModelMaxTokens(model, effectiveMaxTokens);
        const useJsonFormat = shouldUseJsonObjectFormat(model);
        const timeoutMs = isLocal ? 60000 : modelIdx === 0 ? 38000 : 22000;

        let response = await fetch(fetchUrl, {
          method: "POST",
          headers,
          signal: AbortSignal.timeout(timeoutMs),
          body: JSON.stringify({
            model,
            messages: modelMessages,
            user: activeUser.key,
            temperature: effectiveTemperature,
            max_tokens: modelMaxTokens,
            ...(isAnthropicModel ? {} : { repetition_penalty: effectiveRepetitionPenalty }),
            ...(useJsonFormat ? { response_format: { type: "json_object" } } : {}),
            ...(isLocal ? {} : { provider: { allow_fallbacks: true, sort: "throughput" } }),
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
              signal: AbortSignal.timeout(timeoutMs),
              body: JSON.stringify({
                model,
                messages: fallbackMessages,
                user: activeUser.key,
                temperature: effectiveTemperature,
                max_tokens: modelMaxTokens,
                ...(isAnthropicModel ? {} : { repetition_penalty: effectiveRepetitionPenalty }),
                ...(useJsonFormat ? { response_format: { type: "json_object" } } : {}),
                ...(isLocal ? {} : { provider: { allow_fallbacks: true, sort: "throughput" } }),
              }),
            });
          } else {
            const { detail, isAccountAuthError } = extractOpenRouterErrorInfo(
              response.status,
              firstErrText
            );
            console.warn(
              `Model ${model} on ${isLocal ? "local" : "cloud"} failed (${response.status}): ${detail}`
            );
            if (!isLocal && isAccountAuthError) {
              lastError = new Error(`OpenRouter API (${response.status}): ${detail}`);
              break;
            }
            lastError = new Error(
              `Model ${model} returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`
            );
            continue;
          }
        }

        if (!response.ok) {
          const errText = await response.text();
          const { detail, isAccountAuthError } = extractOpenRouterErrorInfo(
            response.status,
            errText
          );
          console.warn(
            `Model ${model} on ${isLocal ? "local" : "cloud"} failed (${response.status}): ${detail}`
          );
          if (!isLocal && isAccountAuthError) {
            lastError = new Error(`OpenRouter API (${response.status}): ${detail}`);
            break;
          }
          lastError = new Error(
            `Model ${model} returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`
          );
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        responseData = parseModelJsonLenient(content, sanitizedContextSpeaker);

        if (!responseData || typeof responseData !== "object" || Array.isArray(responseData)) {
          throw new Error("Malformed or empty JSON response from model");
        }

        // Normalize array-typed narrative_text or player_execution if the model returned an array of paragraphs
        if (Array.isArray(responseData.narrative_text)) {
          responseData.narrative_text = responseData.narrative_text.filter((p: any) => typeof p === "string").join("\n\n");
        }
        if (Array.isArray(responseData.player_execution)) {
          responseData.player_execution = responseData.player_execution.filter((p: any) => typeof p === "string").join("\n\n");
        }

        // Verify the model actually generated substantive narrative text before accepting it
        const rawNarrativeSource =
          responseData.narrative_text ||
          responseData.narrate_text ||
          responseData.narrative ||
          responseData.dialogue ||
          responseData.story_text ||
          responseData.scene ||
          "";
        if (
          (!rawNarrativeSource || String(rawNarrativeSource).trim().length < 25) &&
          !activeClash?.isActive
        ) {
          throw new Error(`Model ${model} returned empty or stub narrative content`);
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

    const rawNarrativeSource =
      responseData.narrative_text ||
      responseData.narrate_text ||
      responseData.narrative ||
      responseData.dialogue ||
      responseData.story_text ||
      responseData.scene ||
      "";

    // Fail-safe post-processing: sanitize and guarantee substantial player_execution for preset choices
    if (responseData.player_execution) {
      responseData.player_execution = sanitizeVisualNovelProse(responseData.player_execution);
    }
    if (!isCustom && (!responseData.player_execution || responseData.player_execution.trim().split(/[.!?]+/).filter(Boolean).length < 2)) {
      const cleanAct = String(action || "").replace(/^\[[^\]]+\](?::)?\s*/, "").trim();
      const stanceDesc = activeStance === "aggressive" || activeStance === "flame" ? "blade angled forward with relentless pressure" : activeStance === "defensive" || activeStance === "frost" ? "guard raised high and footing braced firmly against the ground" : "shoulders squared and senses locked on the target";
      responseData.player_execution = `${safePlayerName} shifts weight and commits decisively to the tactical maneuver, ${stanceDesc}. The tension in the air crystallizes as every muscle tightens for immediate follow-through. ${cleanAct}`;
    }

    // Re-evaluate spoken lines & explicit disclosures from player_execution before merging LLM unlocks
    let postExecKnowledgeMap = workingKnowledgeMap;
    if (responseData.player_execution && typeof responseData.player_execution === "string") {
      const spokenQuotesInExec = (responseData.player_execution.match(/"[^"\n]+"/g) || []).join(" ");
      const explicitDisclosureMatches = (
        responseData.player_execution.match(
          /\b(?:introduces? (?:himself|herself|themselves)|gives? (?:his|her|their) name|my name is|call me|i am (?:a |an )?[^.,;"]+)\b/gi
        ) || []
      ).join(" ");
      const execEvalText = `${spokenQuotesInExec} ${explicitDisclosureMatches}`.trim();
      if (execEvalText) {
        const postExecUnlockEval = evaluateActionForKnowledgeUnlocks(
          execEvalText,
          playerProfile?.name || "Wanderer",
          playerProfile?.role || "Adventurer",
          playerProfile?.abilities || [],
          presentHeroineNames,
          workingKnowledgeMap
        );
        postExecKnowledgeMap = postExecUnlockEval.updatedMap;
      }
    }

    // Merge LLM-reported knowledge unlocks (including learned personal facts) with deterministic unlocks
    const finalKnowledgeMap = applyLlmKnowledgeUnlocks(
      postExecKnowledgeMap,
      presentHeroineNames,
      responseData.state_updates?.knowledge_unlocked || null
    );
    responseData.new_memory_unlocked =
      responseData.new_memory_unlocked || responseData.state_updates?.new_plot_memory || null;
    const finalSpeakerName = String(responseData.speaker || sanitizedContextSpeaker || "Narrator");
    responseData.speaker = finalSpeakerName;
    const speakerKnowsNameNow = getCompanionKnowledge(finalKnowledgeMap, finalSpeakerName).knowsName;

    // Deep-sanitize narrative & mechanics: strip inline markdown, fix single-quoted speech, and separate LitRPG readouts
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

      // Deterministically calibrate new_quest rank & rewards based on objective length, hazard, and player level
      if (
        responseData.system_updates.new_quest &&
        typeof responseData.system_updates.new_quest === "object" &&
        responseData.system_updates.new_quest.title
      ) {
        responseData.system_updates.new_quest = calibrateQuestRankAndRewards(
          responseData.system_updates.new_quest,
          {
            playerLevel: playerProfile?.level || 1,
            turnCount: currentTurnNumber,
          }
        );
      }
    }

    responseData.mechanics = separated.mechanics || responseData.system_updates?.system_announcement || null;
    if (!responseData.state_updates) responseData.state_updates = {};
    responseData.state_updates.npc_knowledge_map = finalKnowledgeMap;
    responseData.state_updates.newly_unlocked_knowledge = preTurnUnlockEval.newlyUnlocked;

    // Evaluate narrative damage/mana synchronization & fallback delta
    if (!responseData.player_progression) {
      responseData.player_progression = {
        exp_gained: 0,
        exp_reason: null,
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
    const clampedTurnProg = clampTurnProgressionDeltas({
      expGained: responseData.player_progression.exp_gained,
      hpChange: vitalsEval.hpChange,
      mpChange: vitalsEval.mpChange,
      maxHp: playerProfile?.stats?.maxHp || 100,
      maxMp: playerProfile?.stats?.maxMp || 60,
    });
    responseData.player_progression.exp_gained = clampedTurnProg.expGained;
    responseData.player_progression.hp_change = clampedTurnProg.hpChange;
    responseData.player_progression.mp_change = clampedTurnProg.mpChange;
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

    // Starfall Labyrinth uses its own Turn-Based Tactical Combat Engine (`activeEncounter`), never generic SectorClashHud
    if (isStarfallStory || isClashJustEnded) {
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

    // Earned-Only EXP Evaluator: 0 EXP for casual chat/banter/rest/walk;
    // 12–26 EXP for tactical skill checks/maneuvers; 24–48 EXP for live combat skirmishes
    const earnedTurnExp = evaluateEarnedTurnExp({
      rawLlmExp: responseData.player_progression.exp_gained,
      actionText: action || "",
      storyText: cleanedProse,
      mechanicsText: responseData.mechanics || null,
      hpChange: responseData.player_progression.hp_change,
      mpChange: responseData.player_progression.mp_change,
      isOOC: Boolean(action && String(action).trim().startsWith("[OOC:")),
      isClashResolutionTurn: isClashJustEnded,
      isSummonGreetingTurn: Boolean(summonContext) || Boolean(giftItemContext),
      storyClashEscalated: Boolean(responseData.state_updates?.story_clash?.isActive),
    });
    responseData.player_progression.exp_gained = earnedTurnExp.expGained;
    responseData.player_progression.exp_reason =
      earnedTurnExp.expGained > 0
        ? (typeof responseData.player_progression.exp_reason === "string" &&
            responseData.player_progression.exp_reason.trim()
            ? responseData.player_progression.exp_reason.trim()
            : earnedTurnExp.reason)
        : null;

    // Sanitize suggested choices, reject leaked JSON fragments, and guarantee <= 4 intent-tagged vectors
    if (Array.isArray(responseData.suggested_choices) && responseData.suggested_choices.length > 0) {
      responseData.suggested_choices = sanitizeAndFilterChoices(responseData.suggested_choices);
    }
    if (!Array.isArray(responseData.suggested_choices) || responseData.suggested_choices.length < 2) {
      responseData.suggested_choices = sanitizeAndFilterChoices(
        buildPersonalityFallbackChoices({
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
        })
      );
    }

    // Fail-safe post-processing: reconcile physical scene presence with prose & cast roster
    // Never trap the player in "Solo Scene" on real arrivals, and NEVER spawn mentioned-only housemates as ghosts!
    if (!responseData.state_updates) responseData.state_updates = {};
    if (isAshVelvetStory && avDestLocation) {
      responseData.state_updates.current_location = avDestLocation;
    }
    const postTurnTargetLocation =
      responseData.state_updates.current_location || avEffectiveTurnLocation || gameState?.location || "";
    const postTurnScheduledInRoom: string[] =
      isAshVelvetStory && avPreTurnScheduleEval
        ? Object.entries(avPreTurnScheduleEval.nextState.heroineLocations)
            .filter(([, room]) => locationsMatchAshVelvet(room, postTurnTargetLocation))
            .map(([hName]) => hName)
        : [];
    const playerAskedToStayOrJoin =
      /\b(?:stay|don['’]t\s+go|wait\s+up|walk\s+with\s+you|come\s+with\s+you|tag\s+along|keep\s+me\s+company)\b/i.test(
        String(action || "")
      );
    const scheduledDepartingSet = new Set(
      !playerAskedToStayOrJoin && avPreTurnScheduleEval
        ? avPreTurnScheduleEval.departingHeroines.map((d) => d.heroineName.toLowerCase())
        : []
    );

    let reconciledPresentHeroines = detectPresentCompanionsFromProse({
      prose: cleanedProse,
      speaker: responseData.speaker,
      rawPresentList: Array.isArray(responseData.state_updates.present_companions)
        ? responseData.state_updates.present_companions
        : presentHeroineNames,
      previouslyPresentNames: presentHeroineNames,
      scheduledInRoomNames: postTurnScheduledInRoom,
      castNames: allNonFallenCastNames,
      fallenNames: fallenMemorialSet,
    });
    if (scheduledDepartingSet.size > 0) {
      reconciledPresentHeroines = reconciledPresentHeroines.filter(
        (name) => !scheduledDepartingSet.has(name.toLowerCase())
      );
    }
    responseData.state_updates.present_companions = reconciledPresentHeroines;
    if (isAshVelvetStory && avPreTurnScheduleEval) {
      responseData.state_updates.schedule_transitions = {
        arriving: avPreTurnScheduleEval.arrivingHeroines,
        departing: playerAskedToStayOrJoin ? [] : avPreTurnScheduleEval.departingHeroines,
      };
    }
    const isAloneAfterTurn = reconciledPresentHeroines.length === 0;

    const matchedSpeaker = matchCanonicalCompanionName(responseData.speaker, allNonFallenCastNames);
    if (matchedSpeaker && !isAloneAfterTurn) {
      responseData.speaker = matchedSpeaker;
    } else if (
      !responseData.speaker ||
      String(responseData.speaker).trim().toLowerCase() === safePlayerName.toLowerCase() ||
      (!isAloneAfterTurn && String(responseData.speaker).trim().toLowerCase() === "narrator")
    ) {
      responseData.speaker = isAloneAfterTurn ? "Narrator" : (reconciledPresentHeroines[0] || "Narrator");
    }

    if (isAloneAfterTurn) {
      responseData.state_updates.present_companions = [];
      responseData.state_updates.affected_companion = null;
      responseData.state_updates.affection_delta = 0;
      if (!responseData.speaker || String(responseData.speaker).trim().toLowerCase() === safePlayerName.toLowerCase()) {
        responseData.speaker = "Narrator";
      }
    } else if (responseData.state_updates.affected_companion) {
      const canonicalAffected = matchCanonicalCompanionName(
        responseData.state_updates.affected_companion,
        reconciledPresentHeroines
      );
      responseData.state_updates.affected_companion =
        canonicalAffected || reconciledPresentHeroines[0] || null;
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
      const resolvedSpeaker = String(responseData.speaker || sanitizedContextSpeaker || "Narrator");
      const speakerComp = (partyMembers || []).find((c: any) =>
        c?.name && resolvedSpeaker && c.name.toLowerCase().includes(resolvedSpeaker.toLowerCase())
      );
      const speakerDossier =
        PORT_SOLARIS_HEROINE_DOSSIERS[resolvedSpeaker] ||
        Object.values(PORT_SOLARIS_HEROINE_DOSSIERS).find(
          (d) => resolvedSpeaker && d?.name && resolvedSpeaker.toLowerCase().includes(d.name.toLowerCase())
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
      let updatedBoardingHouse =
        playerProfile?.boardingHouse || createInitialBoardingHouseState();
      let starUpgrade = false;
      let inspectionAlert: string | undefined;

      if (updatedBoardingHouse) {
        const dailyRev = calculateDailyCafeRevenue(
          updatedBoardingHouse,
          partyMembers || [],
          updatedBoardingHouse.shopAssignments || {}
        );
        dailyRevenueDelta = dailyRev.revenue;

        // Apply natural scandal heat decay or spike
        const hasKaedeBouncer =
          updatedBoardingHouse.shopAssignments?.BOUNCER?.toLowerCase().includes("kaede") ||
          false;
        const nextHeat = applyTurnScandalDecay(
          updatedBoardingHouse.scandalHeat ?? 15,
          !isRomanceChoice,
          hasKaedeBouncer
        );
        updatedBoardingHouse = {
          ...updatedBoardingHouse,
          dailyRevenue: dailyRevenueDelta,
          scandalHeat: nextHeat,
          totalRevenueCollected:
            (updatedBoardingHouse.totalRevenueCollected ?? 0) + Math.round(dailyRevenueDelta * 0.25),
        };

        // Automatically channel shift revenue toward lease debt retirement
        const debtPayment = Math.round(dailyRevenueDelta * 0.35);
        if (debtPayment > 0 && updatedBoardingHouse.outstandingDebt > 0) {
          const paid = paydownDebt(updatedBoardingHouse, debtPayment);
          updatedBoardingHouse = paid.newState;
          starUpgrade = paid.starUpgrade;
        }

        // Advance the 30-day audit countdown when a shift/night concludes
        const isDayTransitionAction =
          /\b(sleep|rest|close\s+up|closing\s+shift|next\s+morning|call\s+it\s+a\s+night|end\s+the\s+shift)\b/i.test(
            actionStr
          );
        if (isDayTransitionAction) {
          const auditStep = advanceAuditDay(updatedBoardingHouse);
          updatedBoardingHouse = auditStep.newState;
          inspectionAlert = auditStep.inspectionAlert;
        }
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
        boardingHouse: updatedBoardingHouse,
        starUpgrade,
        inspectionAlert,
      };
      responseData.port_solaris_updates = responseData.state_updates.port_solaris_updates;
    }

    // Starfall Labyrinth Post-Turn Telemetry, Tactical Combat, Floor & Permadeath Resolution (strictly outside retry loop)
    if (isStarfallStory) {
      let workingLabyrinth =
        preTurnStarfallLabState ||
        syncRosterWithParty(
          playerProfile?.labyrinthState ||
            createInitialLabyrinthState(playerProfile?.sovereignOrigin || "DISCARDED_EX_RANKER", {
              startingHeroineName: presentHeroineNames[0] || sanitizedContextSpeaker,
            }),
          partyMembers || []
        );

      if (typeof persistentNotes === "string") {
        workingLabyrinth = {
          ...workingLabyrinth,
          directorNotes: persistentNotes,
        };
      }

      // Sync location floor if player stepped into a numbered floor or returned to Lobby
      // (Unless emergency extraction just returned the party to Floor 0!)
      const preTurnFloor = preTurnStarfallLabState?.currentFloor || 0;
      const playerAskedToRetreatToLobby =
        /\b(return|retreat|head\s+back|extract|go\s+back)\s+(?:to\s+)?(?:the\s+)?(?:star\s+gate\s+plaza|main\s+lobby|floating\s+lobby|lobby|barracks|memorial)\b/i.test(
          String(action || "")
        );
      const wasExtractedToLobby =
        preTurnStarfallCombatResult?.encounter.status === "retreat" ||
        (playerAskedToRetreatToLobby &&
          !workingLabyrinth.activeEncounter?.isActive &&
          preTurnFloor === 0);
      let updatedLoc = wasExtractedToLobby
        ? "Star Gate Plaza (Main Lobby)"
        : String(
            responseData.state_updates?.current_location ||
              effectiveTurnLocation ||
              gameState?.location ||
              "Star Gate Plaza (Main Lobby)"
          );
      const rawLlmLoc = responseData.state_updates?.current_location;
      const llmLocFloor = rawLlmLoc ? inferFloorFromLocation(String(rawLlmLoc), 0) : 0;
      if (
        !wasExtractedToLobby &&
        preTurnFloor > 0 &&
        !playerAskedToRetreatToLobby &&
        (!rawLlmLoc ||
          isStarfallLobbyLocation(String(rawLlmLoc)) ||
          isStarfallLobbyLocation(updatedLoc) ||
          (llmLocFloor > 0 && llmLocFloor !== preTurnFloor))
      ) {
        updatedLoc =
          effectiveTurnLocation && !isStarfallLobbyLocation(effectiveTurnLocation)
            ? effectiveTurnLocation
            : `Floor ${preTurnFloor}: ${
                preTurnFloor === 1
                  ? "The Verdant Antechamber"
                  : workingLabyrinth.activeEncounter?.layoutName || getTowerThemeForFloor(preTurnFloor).name
              }`;
        if (responseData.state_updates) {
          responseData.state_updates.current_location = updatedLoc;
        }
      } else if (wasExtractedToLobby && responseData.state_updates) {
        responseData.state_updates.current_location = "Star Gate Plaza (Main Lobby)";
      }

      let resolvedPostFloor = wasExtractedToLobby
        ? 0
        : inferFloorFromLocation(updatedLoc, workingLabyrinth.currentFloor || 0);
      if (resolvedPostFloor === 0 && isStarfallDungeonLocation(updatedLoc)) {
        resolvedPostFloor = Math.max(1, preTurnFloor);
      }
      const combatVictoryTriggered =
        preTurnStarfallCombatResult?.encounter.status === "victory";

      if (resolvedPostFloor !== workingLabyrinth.currentFloor) {
        workingLabyrinth = {
          ...workingLabyrinth,
          currentFloor: resolvedPostFloor,
        };
      }
      if (resolvedPostFloor === 0 || getFloorType(resolvedPostFloor) === "SAFE_ZONE") {
        workingLabyrinth = healRosterAtSafeZoneOrLobby(workingLabyrinth);
      } else if (
        resolvedPostFloor > 0 &&
        !combatVictoryTriggered &&
        !preTurnFloorClearMeta &&
        !workingLabyrinth.floorClearedPendingAscent &&
        !workingLabyrinth.activeEncounter?.isActive &&
        !isCampfireRestAction &&
        (getFloorType(resolvedPostFloor) === "COMBAT" ||
          getFloorType(resolvedPostFloor) === "EVENT" ||
          getFloorType(resolvedPostFloor) === "GATE_BOSS")
      ) {
        const matchedFromProse = matchCuratedEnemyFromProse(resolvedPostFloor, cleanedProse);
        const targetWave = workingLabyrinth.currentFloorWave || 1;
        workingLabyrinth = startFloorCombatEncounter(
          workingLabyrinth,
          resolvedPostFloor,
          `${workingLabyrinth.summonSeed || "sf"}:post:${resolvedPostFloor}:w${targetWave}:${currentTurnNumber}`,
          false,
          {
            preferredEnemyTemplate: matchedFromProse,
            initialEngagementPhase: "vicinity",
            waveNumber: targetWave,
          }
        );
      }
      workingLabyrinth = syncEncounterWithProseIfVicinity(workingLabyrinth, cleanedProse);

      const rawSf =
        responseData.starfall_updates && typeof responseData.starfall_updates === "object"
          ? responseData.starfall_updates
          : {};

      const validatedCasualties: { name: string; cause: string }[] = [
        ...(preTurnStarfallCombatResult?.newlyFallenHeroines || []),
      ];
      // Only accept LLM-reported casualties when NOT overridden by deterministic combat engine protection
      if (
        !preTurnStarfallCombatResult &&
        Array.isArray(rawSf.hero_casualties) &&
        workingLabyrinth.currentFloor > 0
      ) {
        for (const cas of rawSf.hero_casualties) {
          const casName = typeof cas?.name === "string" ? cas.name.trim() : "";
          const casCause =
            typeof cas?.cause === "string" && cas.cause.trim()
              ? cas.cause.trim()
              : `Fell in battle on Floor ${workingLabyrinth.currentFloor}`;
          if (!casName) continue;
          const prevMemorialLen = (workingLabyrinth.memorial || []).length;
          workingLabyrinth = resolveHeroCasualty(
            workingLabyrinth,
            casName,
            casCause,
            presentHeroineNames
          );
          if ((workingLabyrinth.memorial || []).length > prevMemorialLen) {
            const latest = workingLabyrinth.memorial[workingLabyrinth.memorial.length - 1];
            validatedCasualties.push({ name: latest.name, cause: latest.cause });
          }
        }
      }

      let deterministicHpDelta: number | null = null;
      let deterministicMpDelta: number | null = null;

      // Apply deterministic combat protagonist HP/MP deltas & enforce defeat Game Over
      if (preTurnStarfallCombatResult) {
        deterministicHpDelta = preTurnStarfallCombatResult.protagonistHpDelta;
        deterministicMpDelta = preTurnStarfallCombatResult.protagonistMpDelta;
        responseData.player_progression.hp_change = deterministicHpDelta;
        responseData.player_progression.mp_change = deterministicMpDelta;
        if (preTurnStarfallCombatResult.protagonistHpDelta < 0) {
          responseData.player_progression.vitals_reason = `Floor ${preTurnStarfallCombatResult.encounter.floor} Combat vs ${preTurnStarfallCombatResult.encounter.enemyName}`;
        }
        if (preTurnStarfallCombatResult.encounter.status === "defeat") {
          responseData.death_event = {
            is_fatal: true,
            cause_of_death:
              responseData.death_event?.cause_of_death ||
              `Struck down on Floor ${preTurnStarfallCombatResult.encounter.floor} by ${preTurnStarfallCombatResult.encounter.enemyName}.`,
            killer_or_hazard:
              responseData.death_event?.killer_or_hazard ||
              preTurnStarfallCombatResult.encounter.enemyName,
          };
        }
      }

      const isSanctuaryFullHeal =
        preTurnStarfallCombatResult?.encounter.status !== "defeat" &&
        (resolvedPostFloor === 0 || getFloorType(resolvedPostFloor) === "SAFE_ZONE");

      if (isSanctuaryFullHeal) {
        const curHp = playerProfile?.stats?.hp ?? 100;
        const maxHp = playerProfile?.stats?.maxHp ?? 100;
        const curMp = playerProfile?.stats?.mp ?? 60;
        const maxMp = playerProfile?.stats?.maxMp ?? 60;
        deterministicHpDelta = Math.max(0, maxHp - curHp);
        deterministicMpDelta = Math.max(0, maxMp - curMp);
        responseData.player_progression.hp_change = deterministicHpDelta;
        responseData.player_progression.mp_change = deterministicMpDelta;
        responseData.player_progression.vitals_reason =
          resolvedPostFloor === 0
            ? "Star Gate Plaza Sanctuary Recovery"
            : `Floor ${resolvedPostFloor} Safe Sanctuary Recovery`;
      } else if (isCampfireRestAction && !preTurnStarfallCombatResult) {
        const curHp = playerProfile?.stats?.hp ?? 100;
        const maxHp = playerProfile?.stats?.maxHp ?? 100;
        const curMp = playerProfile?.stats?.mp ?? 60;
        const maxMp = playerProfile?.stats?.maxMp ?? 60;
        deterministicHpDelta = Math.min(Math.max(0, maxHp - curHp), Math.round(maxHp * 0.35));
        deterministicMpDelta = Math.min(Math.max(0, maxMp - curMp), Math.round(maxMp * 0.35));
        responseData.player_progression.hp_change = deterministicHpDelta;
        responseData.player_progression.mp_change = deterministicMpDelta;
        responseData.player_progression.vitals_reason = `Floor ${resolvedPostFloor} Campfire Bond Rest`;
      }

      // Remove any newly fallen heroines from present_companions & speaker immediately
      if (validatedCasualties.length > 0 && responseData.state_updates) {
        if (Array.isArray(responseData.state_updates.present_companions)) {
          responseData.state_updates.present_companions =
            responseData.state_updates.present_companions.filter(
              (n: any) =>
                !validatedCasualties.some((vc) => matchesHeroineName(String(n || ""), vc.name))
            );
        }
        if (
          responseData.speaker &&
          validatedCasualties.some((vc) => matchesHeroineName(String(responseData.speaker), vc.name))
        ) {
          responseData.speaker =
            responseData.state_updates.present_companions?.[0] || "Narrator";
        }
      }

      let floorAdvanceMeta: {
        clearedFloor?: number;
        isGateBoss?: boolean;
        isThemeShift?: boolean;
        beyondMemory?: boolean;
        shardsAwarded?: number;
        expAwarded?: number;
        companionExpAwarded?: number;
        clearedAll100?: boolean;
      } | null = null;

      let waveAdvanceMeta: {
        floor: number;
        clearedWave: number;
        nextWave: number;
        totalWaves: number;
      } | null = null;

      const clearedWave =
        preTurnStarfallCombatResult?.encounter.floorWave ||
        workingLabyrinth.currentFloorWave ||
        1;
      const totalWaves =
        preTurnStarfallCombatResult?.encounter.floorTotalWaves ||
        workingLabyrinth.currentFloorTotalWaves ||
        getTotalWavesForFloor(workingLabyrinth.currentFloor || 1) ||
        3;

      if (preTurnWaveAdvanceMeta) {
        if (responseData.state_updates) {
          responseData.state_updates.current_location = `Floor ${preTurnWaveAdvanceMeta.floor} — ${
            workingLabyrinth.activeEncounter?.layoutName || "Labyrinth Chamber"
          } (Wave ${preTurnWaveAdvanceMeta.nextWave}/${preTurnWaveAdvanceMeta.totalWaves})`;
        }
        waveAdvanceMeta = preTurnWaveAdvanceMeta;
        responseData.player_progression.exp_gained = Math.max(
          responseData.player_progression.exp_gained || 0,
          preTurnStarfallCombatResult?.expAwarded || 42 + workingLabyrinth.currentFloor * 3
        );
        responseData.player_progression.exp_reason = `Floor ${preTurnWaveAdvanceMeta.floor} • Wave ${preTurnWaveAdvanceMeta.clearedWave}/${preTurnWaveAdvanceMeta.totalWaves} Cleared`;
      } else if (preTurnFloorClearMeta) {
        if (responseData.state_updates) {
          responseData.state_updates.current_location =
            getFloorType(preTurnFloorClearMeta.clearedFloor) === "SAFE_ZONE"
              ? `Floor ${preTurnFloorClearMeta.clearedFloor} — Safe Zone Sanctuary`
              : `Floor ${preTurnFloorClearMeta.clearedFloor} — Floor Transfer Ring (Cleared)`;
        }
        const combinedFloorExp = Math.max(
          preTurnFloorClearMeta.expAwarded,
          preTurnStarfallCombatResult?.expAwarded || 0
        );
        floorAdvanceMeta = {
          clearedFloor: preTurnFloorClearMeta.clearedFloor,
          isGateBoss: preTurnFloorClearMeta.isGateBoss,
          isThemeShift: preTurnFloorClearMeta.isThemeShift,
          beyondMemory: preTurnFloorClearMeta.beyondMemory,
          shardsAwarded: preTurnFloorClearMeta.shardsAwarded,
          expAwarded: combinedFloorExp,
          companionExpAwarded: preTurnFloorClearMeta.companionExpAwarded,
          clearedAll100: preTurnFloorClearMeta.clearedAll100,
        };
        responseData.player_progression.exp_gained = combinedFloorExp;
        responseData.player_progression.exp_reason =
          preTurnFloorClearMeta.clearedFloor % 10 === 0 || preTurnFloorClearMeta.clearedFloor % 25 === 0
            ? `Boss Floor ${preTurnFloorClearMeta.clearedFloor} Cleared`
            : getFloorType(preTurnFloorClearMeta.clearedFloor) === "SAFE_ZONE"
              ? `Floor ${preTurnFloorClearMeta.clearedFloor} Safe Zone Reached`
              : `Floor ${preTurnFloorClearMeta.clearedFloor} Cleared`;
      } else if (
        combatVictoryTriggered &&
        workingLabyrinth.currentFloor > 0 &&
        clearedWave < totalWaves
      ) {
        // Fallback: Cleared an intra-floor enemy pack wave: stay on the same floor and spawn Wave Y+1 in vicinity!
        const nextWave = clearedWave + 1;
        workingLabyrinth = {
          ...workingLabyrinth,
          currentFloorWave: nextWave,
          currentFloorTotalWaves: totalWaves,
          floorClearedPendingAscent: false,
          activeEncounter: null,
        };
        const nextFt = getFloorType(workingLabyrinth.currentFloor);
        if (nextFt === "COMBAT" || nextFt === "EVENT" || nextFt === "GATE_BOSS") {
          workingLabyrinth = startFloorCombatEncounter(
            workingLabyrinth,
            workingLabyrinth.currentFloor,
            `${workingLabyrinth.summonSeed || "sf"}:f${workingLabyrinth.currentFloor}:w${nextWave}:${currentTurnNumber}`,
            true,
            {
              initialEngagementPhase: "vicinity",
              waveNumber: nextWave,
            }
          );
        }
        if (responseData.state_updates) {
          responseData.state_updates.current_location = `Floor ${workingLabyrinth.currentFloor} — ${
            workingLabyrinth.activeEncounter?.layoutName || "Labyrinth Chamber"
          } (Wave ${nextWave}/${totalWaves})`;
        }
        waveAdvanceMeta = {
          floor: workingLabyrinth.currentFloor,
          clearedWave,
          nextWave,
          totalWaves,
        };
        responseData.player_progression.exp_gained = Math.max(
          responseData.player_progression.exp_gained || 0,
          preTurnStarfallCombatResult?.expAwarded || 42 + workingLabyrinth.currentFloor * 3
        );
        responseData.player_progression.exp_reason = `Floor ${workingLabyrinth.currentFloor} • Wave ${clearedWave}/${totalWaves} Cleared`;
      } else {
        const canHonorLlmFloorClear =
          Boolean(rawSf.floor_cleared) &&
          workingLabyrinth.currentFloor > 0 &&
          !workingLabyrinth.floorClearedPendingAscent &&
          !workingLabyrinth.activeEncounter?.isBoss &&
          (!workingLabyrinth.activeEncounter?.isActive || clearedWave >= totalWaves);

        const shouldAdvanceFloor =
          (combatVictoryTriggered && clearedWave >= totalWaves) ||
          canHonorLlmFloorClear;

        if (shouldAdvanceFloor && workingLabyrinth.currentFloor > 0) {
          if (workingLabyrinth.activeEncounter?.isActive) {
            workingLabyrinth = {
              ...workingLabyrinth,
              activeEncounter: null,
            };
          }
          const isSafeZoneClear = getFloorType(workingLabyrinth.currentFloor) === "SAFE_ZONE";
          const adv = isSafeZoneClear
            ? advanceFloor(workingLabyrinth)
            : completeCurrentFloorAtTransferRing(workingLabyrinth);
          workingLabyrinth = adv.newState;
          if (isSafeZoneClear) {
            const nextFt = getFloorType(workingLabyrinth.currentFloor);
            if (nextFt === "COMBAT" || nextFt === "EVENT" || nextFt === "GATE_BOSS") {
              workingLabyrinth = startFloorCombatEncounter(
                workingLabyrinth,
                workingLabyrinth.currentFloor,
                `${workingLabyrinth.summonSeed || "sf"}:next:${workingLabyrinth.currentFloor}:${currentTurnNumber}`,
                false,
                {
                  initialEngagementPhase: "vicinity",
                  waveNumber: 1,
                }
              );
            }
          }
          if (responseData.state_updates) {
            responseData.state_updates.current_location = isSafeZoneClear
              ? `Floor ${workingLabyrinth.currentFloor} — ${
                  workingLabyrinth.activeEncounter?.layoutName || "Labyrinth Threshold"
                }`
              : `Floor ${adv.clearedFloor} — Floor Transfer Ring (Cleared)`;
          }
          const combinedFloorExp = Math.max(
            adv.expAwarded,
            preTurnStarfallCombatResult?.expAwarded || 0
          );
          floorAdvanceMeta = {
            clearedFloor: adv.clearedFloor,
            isGateBoss: adv.isGateBoss,
            isThemeShift: adv.isThemeShift,
            beyondMemory: adv.beyondMemory,
            shardsAwarded: adv.shardsAwarded,
            expAwarded: combinedFloorExp,
            companionExpAwarded: adv.companionExpAwarded,
            clearedAll100: adv.clearedAll100,
          };
          responseData.player_progression.exp_gained = combinedFloorExp;
          responseData.player_progression.exp_reason =
            adv.clearedFloor % 10 === 0 || adv.clearedFloor % 25 === 0
              ? `Boss Floor ${adv.clearedFloor} Cleared`
              : `Floor ${adv.clearedFloor} Cleared`;
        } else if (workingLabyrinth.currentFloor > 0) {
          const proseKilledEnemy =
            earnedTurnExp.tier === "ENEMY_KILL" ||
            /\b(slain|killed|eliminated|dissolves?\s+into\s+(?:star\s+)?ash|shatters?\s+into\s+(?:star\s+)?ash|collapses?\s+dead|falls?\s+dead|corpse)\b/i.test(
              cleanedProse
            );
          if (proseKilledEnemy) {
            const killExp = Math.max(
              responseData.player_progression.exp_gained || 0,
              42 + workingLabyrinth.currentFloor * 3
            );
            responseData.player_progression.exp_gained = killExp;
            responseData.player_progression.exp_reason = `Slain Hostile on Floor ${workingLabyrinth.currentFloor}`;
          } else if (preTurnStarfallCombatResult) {
            responseData.player_progression.exp_gained = Math.max(
              responseData.player_progression.exp_gained || 0,
              24 + workingLabyrinth.currentFloor * 2
            );
            responseData.player_progression.exp_reason =
              responseData.player_progression.exp_reason ||
              `Floor ${workingLabyrinth.currentFloor} Combat Exchange`;
          }
        }
      }

      const bonusShards = Math.max(
        0,
        Math.min(30, Math.round(Number(rawSf.star_shards_earned) || 0))
      );
      if (bonusShards > 0) {
        workingLabyrinth = {
          ...workingLabyrinth,
          starShards: (workingLabyrinth.starShards || 0) + bonusShards,
        };
      }

      const trustDelta = Math.max(
        -15,
        Math.min(15, Math.round(Number(rawSf.master_trust_delta) || 0))
      );
      if (trustDelta !== 0) {
        workingLabyrinth = adjustMasterTrust(workingLabyrinth, trustDelta);
      }

      const masterCommand =
        typeof rawSf.master_command === "string" && rawSf.master_command.trim()
          ? rawSf.master_command.trim()
          : null;

      // Never allow timeline_echo_unlocked on fatal death in Starfall (no regression)
      if (responseData.death_event?.is_fatal) {
        responseData.timeline_echo_unlocked = null;
      }

      const combatShards = preTurnStarfallCombatResult?.shardsAwarded || 0;

      const resolvedStarfallPayload = {
        floor_cleared: Boolean(floorAdvanceMeta),
        floorCleared: Boolean(floorAdvanceMeta),
        cleared_floor: floorAdvanceMeta?.clearedFloor ?? null,
        clearedFloor: floorAdvanceMeta?.clearedFloor ?? null,
        wave_cleared: waveAdvanceMeta?.clearedWave ?? null,
        floor_wave: workingLabyrinth.activeEncounter?.floorWave ?? workingLabyrinth.currentFloorWave ?? 1,
        floor_total_waves:
          workingLabyrinth.activeEncounter?.floorTotalWaves ??
          workingLabyrinth.currentFloorTotalWaves ??
          getTotalWavesForFloor(workingLabyrinth.currentFloor || 1),
        is_gate_boss_next: Boolean(floorAdvanceMeta?.isGateBoss),
        isGateBoss: Boolean(floorAdvanceMeta?.isGateBoss),
        beyond_memory:
          floorAdvanceMeta?.beyondMemory ??
          workingLabyrinth.currentFloor > (workingLabyrinth.metaKnowledgeCeiling || 40),
        beyondMemory:
          floorAdvanceMeta?.beyondMemory ??
          workingLabyrinth.currentFloor > (workingLabyrinth.metaKnowledgeCeiling || 40),
        cleared_all_100: Boolean(floorAdvanceMeta?.clearedAll100),
        clearedAll100: Boolean(floorAdvanceMeta?.clearedAll100),
        hero_casualties: validatedCasualties,
        casualtiesResolved: validatedCasualties.map((vc) => vc.name),
        star_shards_earned: bonusShards + (floorAdvanceMeta?.shardsAwarded || 0) + combatShards,
        shardsAwarded: bonusShards + (floorAdvanceMeta?.shardsAwarded || 0) + combatShards,
        exp_awarded: floorAdvanceMeta?.expAwarded || 0,
        expAwarded: floorAdvanceMeta?.expAwarded || 0,
        companion_exp_awarded: floorAdvanceMeta?.companionExpAwarded || 0,
        companionExpAwarded: floorAdvanceMeta?.companionExpAwarded || 0,
        master_command: masterCommand,
        master_trust_delta: trustDelta,
        full_vitals_restored: isSanctuaryFullHeal,
        sanctuary_rest: Boolean(isCampfireRestAction),
        deterministic_hp_delta: deterministicHpDelta,
        deterministic_mp_delta: deterministicMpDelta,
        labyrinth_state: workingLabyrinth,
        labyrinthState: workingLabyrinth,
      };

      if (!responseData.state_updates) responseData.state_updates = {};
      responseData.state_updates.starfall_updates = resolvedStarfallPayload;
      responseData.starfall_updates = resolvedStarfallPayload;
    }

    if (visualDescription) {
      responseData.visual_description = visualDescription;
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("API /api/turn Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process turn." }, { status: 500 });
  }
}
