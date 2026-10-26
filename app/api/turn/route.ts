import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";
import { evaluateRelicSynergies, buildSynergyPromptDirective } from "@/lib/relicSynergies";
import { getNarrationProseDirective } from "@/lib/narrationStyles";
import { describeProtagonistAvatar } from "@/lib/visionEncoder";
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
import { detectContextualEquipmentAcquisition } from "@/lib/progressionMechanics";

export const runtime = "nodejs";
export const maxDuration = 60;

const FALLBACK_MODELS = [
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
      npcKnowledgeMap = null,
    } = body;

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

    const companionDossiers = buildPersonaPromptDossier(
      storyContext?.companions || [],
      sanitizedContextSpeaker
    );

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
- In "player_execution", you MUST write a substantial, immersive narrative sequence from the protagonist's perspective (${playerProfile.name}, Role: ${playerProfile.role}, Stance: ${activeStance || "neutral"}).
- LENGTH & SUBSTANCE REQUIREMENT: Must be MORE than just a couple of sentences! Write a full, vivid passage of at least 3 to 6 sentences across 1 to 2 rich paragraphs.
- CONTENT REQUIREMENTS FOR "player_execution":
  1. Spoken Dialogue: Include ${playerProfile.name}'s actual spoken dialogue in quotation marks ("...") addressing the companion, enemies, or situation.
  2. Physical Action & Gestures: Describe ${playerProfile.name}'s physical movements, weapon/gear handling, posture, footsteps, and spatial maneuvering matching their role (${playerProfile.role}).
  3. Tactical & Sensory Presence: Depict their sensory observations (breathing, cold air, blade weight, tension) and inner focus as they commit to the move.
  4. STRICT NEGATIVE CONSTRAINTS:
     - NEVER output only 1 or 2 brief sentences.
     - NEVER include bracket tags like "[Combat/Aggressive]:", "[Arcana/Analytical]:", "[Subterfuge/Cunning]:" in "player_execution". Strip all tag markers.
     - NEVER summarize with meta commentary like "The player chooses to...". Write directly as immersive narrative prose and dialogue.
- Follow up in "narrative_text" with how the world and companion respond to this execution.`;

    const isFirstEncounter = !recentHistory || recentHistory.length <= 1;

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
        console.warn("[Turn API] Failed to encode avatar with vision:", vErr?.message);
      }
    }

    const visualInspectionInstruction = visualDescription
      ? `--- PROTAGONIST VISUAL APPEARANCE (DERIVED FROM AVATAR VIA VISION ENGINE) ---
Detailed visual appearance of ${playerProfile.name}:
"${visualDescription}"
${isFirstEncounter ? `CRITICAL FIRST ENCOUNTER DIRECTIVE: The active speaker (${sanitizedContextSpeaker}) MUST naturally observe and comment on ${playerProfile.name}'s specific visual features (attire, physical build, hair/eyes, visible weapons, or demeanor) in their dialogue or narrative prose.` : "You may reference these specific visual traits when describing physical gestures, combat actions, close proximity, or emotional moments."}`
      : (playerAvatarBase64 && isFirstEncounter)
      ? `--- FIRST ENCOUNTER APPEARANCE DIRECTIVE ---
This is the initial meeting with the protagonist (${playerProfile.name}).
- Portray the character with the physical bearing, attire, and combat readiness of their role (${playerProfile.role}).
- The active speaker (${sanitizedContextSpeaker}) should naturally observe and comment on the protagonist's initial appearance in their dialogue or narrative prose.`
      : `--- APPEARANCE DIRECTIVE ---
Do NOT repeatedly comment on or re-describe the player's general physical appearance unless a dramatic physical change occurs. Focus on action, dialogue, and advancing the scene.`;

    const compatibilityDirective = storyContext?.companions && storyContext.companions.length > 0
      ? storyContext.companions.map((c: any) => `- ${c.name}: Values ${c.values?.join(", ") || "Honor, Loyalty"}. Dislikes ${c.dislikes?.join(", ") || "Deceit, Cowardice"}.`).join("\n")
      : `- Evelyn Abbandonato: Values intellect, arcane precision, subtle manipulation, composure. Dislikes crude brute force, groveling, or blind obedience.
- Aria Shadowthorn: Values pragmatism, stealth, tradecraft, quiet competence. Dislikes self-righteous preaching, knightly arrogance, reckless noise.
- Serena: Values impeccable composure, polite duty, decisive lethality, discipline. Dislikes whining, chaos, disrespect to boundaries, false mercy.
- Morgana: Values dark planar ambition, fearlessness, sinister wit, raw resolve. Dislikes cowardice, puritanical righteousness, boring compliance.
- Perci: Values gentleness, patience, protective reassurance, quiet empathy. Dislikes aggression, intimidation, cruelty, sudden shouting.`;

    // Helper to determine active threshold cap for any companion
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

    // Dynamic Romance & Intimacy Calibration Directive
    const activeCompanionData = (partyMembers || []).find((c: any) => c.name === sanitizedContextSpeaker) || (partyMembers || [])[0];
    const companionAffection = activeCompanionData?.affection || 0;
    const isRomanceTensionElevated = companionAffection >= 40 ||
      action.toLowerCase().includes("lean") ||
      action.toLowerCase().includes("close") ||
      action.toLowerCase().includes("kiss") ||
      action.toLowerCase().includes("touch") ||
      action.toLowerCase().includes("whisper") ||
      action.toLowerCase().includes("hold");

    const dynamicRomanceDirective = isRomanceTensionElevated
      ? `--- DYNAMIC ROMANCE & INTIMACY CALIBRATION (AFFECTION: ${companionAffection}%) ---
The interaction between ${playerProfile.name} and ${sanitizedContextSpeaker} has reached an emotionally charged, high-intimacy threshold:
- SENSORY PHYSICALITY: Describe physical proximity with visceral nuance: heat of breath stirring skin or hair, heartbeat racing in chest or pulse fluttering at the throat, dilated pupils, subtle shivers, the friction of fabric and touch.
- UNRESTRICTED CHEMISTRY: Allow authentic psychological vulnerability, uninhibited desire, playful/tsundere push-pull, or passionate escalation. Do NOT sanitize emotional tension or shy away from intense romantic beats.
- ANCHOR TO PERSONA: Ensure the intimacy reflects ${sanitizedContextSpeaker}'s distinct personality.`
      : "";

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
      playerProfile?.name || "Wanderer"
    );

    const systemPrompt = `You are the Game Master, Narrator, and World Engine for "${storyTitle}", an interactive visual novel set in ${settingName}.

${getNarrationProseDirective(effectiveTone)}

${dynamicRomanceDirective}

--- HEROINE DOSSIERS & VOICE PROFILES ---
${companionDossiers}

--- MECHANICAL RULES ---
1. Speaker Attribution: "speaker" MUST NEVER BE the protagonist. If accompanied, set "speaker" to the canonical name of the talking heroine (${presentHeroineNames.join(", ") || "Heroine"}). If alone, set to "Narrator", "Inner Monologue", or "System".
2. Protagonist Action Depth ("player_execution"): When a preset choice is selected, "player_execution" MUST be an expansive, multi-sentence passage (minimum 3-6 sentences across 1-2 paragraphs) featuring ${playerProfile.name}'s physical movements, tactical posture, and spoken dialogue in quotation marks "...". It must NEVER be a single sentence or copy bracket tags. If the input is custom, set "player_execution" to null.
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
   - PARAGRAPHING: Structure "narrative_text" into 2 to 3 evocative paragraphs separated by clean line breaks. Avoid monolithic walls of text.
7. Anti-Sycophancy & Tone Rigidity:
   - Companions MUST NOT default to subservient, agreeable, or overly eager personalities.
   - If the player suggests a foolish, dangerous, or poorly reasoned action, companions MUST object, criticize, or offer cynical reality checks according to their persona.
   - Affection cannot be forced in a single turn. Retain guarded boundaries and respect their defined personality constraints.
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
2. CAUSAL PLAUSIBILITY:
   - Grounded, tactical choices: plausibility_delta: 0 to +4.
   - Reckless, reality-defying, or suicidal bluffs: plausibility_delta: -5 to -15.
   - Volatile Plausibility (<40%) or Critical (<25%): Severe danger. Issue an [URGENT PENALTY QUEST] to restore causal order.
3. SYSTEM ANNOUNCEMENTS:
   - ALWAYS output an authoritative LitRPG notification in "system_updates.system_announcement".

--- OUTPUT FORMAT ---
Respond strictly in valid JSON matching this schema:
{
  "speaker": string,
  "player_execution": string | null, // When preset choice is selected: a substantial, immersive plain-text passage (at least 3-6 sentences across 1-2 paragraphs) with flawless grammar and ZERO Markdown asterisks, detailing ${playerProfile.name}'s physical actions, tactical stance, and spoken dialogue in double quotation marks "...". Null only for custom player inputs.
  "narrative_text": string, // 2-3 immersive plain-text paragraphs containing environmental details, character dialogue in double quotation marks ("..."), and action beats. Flawless grammar and syntax. ZERO Markdown asterisks (* or **). MUST STRICTLY adhere to the prose cadence, tone, vocabulary, and negative constraints of the active Narration Style.
  "mechanics": string | null, // Concise LitRPG system or tactical mechanics readout for this turn (e.g. "[SYSTEM: Stance Resonance Active • Causal Plausibility Stable]"), or null if none.
  "death_event": {
    "is_fatal": boolean,
    "cause_of_death": string | null,
    "killer_or_hazard": string | null
  } | null,
  "timeline_echo_unlocked": {
    "title": string,
    "summary": string,
    "foreshadow_key": string
  } | null,
  "state_updates": {
    "current_location": string,
    "mood": string,
    "expression_key": "neutral" | "intrigued" | "flustered" | "smug" | "surprised" | "combat_ready" | "dangerous" | "hurt" | "beckon",
    "affected_companion": string | null,
    "affection_delta": number,
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
  "suggested_choices": [string, string, string, string]
}

--- CURRENT CAMPAIGN STATE & DYNAMIC TURN CONTEXT ---
- Protagonist (Narrator Reference): ${playerProfile.name} | Spoken Dialogue Address by ${sanitizedContextSpeaker}: ${activeSpeakerKnowledge.knowsName ? `"${playerProfile.name}" (Name Known)` : `"stranger" / "wanderer" (NAME UNKNOWN TO ${sanitizedContextSpeaker.toUpperCase()} — DO NOT USE "${playerProfile.name}" IN DIALOGUE QUOTES)`}
- Archetype / Class: ${activeSpeakerKnowledge.knowsClass ? `${playerProfile.role} (Lv.${playerProfile.level} — Class Known)` : `[INTERNAL CLASS: ${playerProfile.role} — UNKNOWN TO ${sanitizedContextSpeaker.toUpperCase()} IN DIALOGUE]`}
- Vitals & Pools: ${playerVitals.summaryLine}
- Stats: STR ${playerProfile.stats.str} | DEX ${playerProfile.stats.dex} | INT ${playerProfile.stats.int}
- Loadout: Weapon: ${playerProfile.gear.weapon} | Armor: ${playerProfile.gear.armor} | Relic: ${playerProfile.gear.relic}
- Active Stance: [${activeStance.toUpperCase()}]
- Abilities: ${Array.isArray(playerProfile.abilities) && playerProfile.abilities.length > 0 ? playerProfile.abilities.join(", ") : "None unlocked"}
- Active Location: ${gameState.location}
- Active Speaker Context: ${sanitizedContextSpeaker}
- Scene Presence: ${isProtagonistAlone ? "Protagonist is PHYSICALLY ALONE (No companions present)" : `Accompanied by: ${presentHeroineNames.join(", ")}`}

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
  return `  * ${c.name} (${c.title || "Companion"}) [${encStatus} | Present: ${c.isPresent} | Favor: ${c.affection}% (${favorDesc}) | ${lockStatus} | Demeanor: ${c.expressionKey || "neutral"}]`;
}).join("\n")}

--- CHRONOLOGICAL RECORD OF PREVIOUS INTERACTIONS & MEMORIES ---
${
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
    : "  * None currently active. (Assign a new scenario if narratively appropriate)."
}
- Completed & Archived Scenarios (ALREADY FINISHED - DO NOT RE-ASSIGN):
${
  systemState?.completedQuests && systemState.completedQuests.length > 0
    ? systemState.completedQuests.slice(0, 6).map((q: any) => `  * [CLEARED & ARCHIVED]: "${q.title}"`).join("\n")
    : "  * None completed yet."
}

${inputHandlingInstruction}

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
        m.includes("claude-3") ||
        m.includes("pixtral")
      );
    }

    const userPromptContent = isCustom
      ? `Player Action: ${action}`
      : `Selected Choice Vector: ${action}\n[CRITICAL DIRECTIVE: In "player_execution", generate a substantial 3-6 sentence narrative passage of ${playerProfile.name}'s physical movements, tactical stance, and spoken dialogue in quotation marks "...". Do NOT output bracket tags like [Combat/Aggressive]: in "player_execution". Advance companion/world response in "narrative_text".]`;

    let responseData = null;
    let lastError = null;

    // Smart Hybrid routes structured Game Master turns and LitRPG state orchestration
    // to DeepSeek V3 for elite coherence, 0.3s latency, flawless choices & player execution
    const effectiveModelId = modelId === "orchestrated-hybrid" ? "deepseek/deepseek-chat" : (modelId || "deepseek/deepseek-chat");

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
          recentHistory.forEach((turn: { speaker: string; text: string }) => {
            modelMessages.push({
              role: turn.speaker === playerProfile.name ? "user" : "assistant",
              content: `${turn.speaker}: ${turn.text}`,
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
          const textNote = visualDescription
            ? `\n[Protagonist Appearance Context: "${visualDescription}"]`
            : (playerAvatarBase64 && isFirstEncounter)
            ? `\n[Protagonist Archetype: ${playerProfile.name}, Role: ${playerProfile.role}, Stance: ${activeStance || "neutral"}. Note to Game Master: A custom portrait was provided; reflect these warrior traits in character observations.]`
            : "";
          modelMessages.push({
            role: "user",
            content: `${userPromptContent}${textNote}`,
          });
        }

        let response = await fetch(fetchUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages: modelMessages,
            user: activeUser.key,
            temperature: effectiveTemperature,
            max_tokens: effectiveMaxTokens,
            repetition_penalty: effectiveRepetitionPenalty,
            response_format: { type: "json_object" },
            ...(isLocal ? {} : { provider: { allow_fallbacks: true } }),
          }),
        });

        // Fail-safe retry: If OpenRouter rejects because of image input, retry immediately as text-only
        if (!response.ok) {
          const firstErrText = await response.text();
          if (firstErrText.includes("image input") || firstErrText.includes("Image Support") || firstErrText.includes("Filter by Image")) {
            console.warn(`Model ${model} does not accept vision payload. Retrying with pure text...`);
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
                max_tokens: effectiveMaxTokens,
                repetition_penalty: effectiveRepetitionPenalty,
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
        let content = data.choices?.[0]?.message?.content || "";
        content = content.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim();

        responseData = JSON.parse(content);

        // Fail-safe post-processing: sanitize and guarantee substantial player_execution for preset choices
        if (responseData.player_execution) {
          responseData.player_execution = sanitizeVisualNovelProse(responseData.player_execution);
        }
        if (!isCustom && (!responseData.player_execution || responseData.player_execution.trim().split(/[.!?]+/).filter(Boolean).length < 2)) {
          const cleanAct = action.replace(/^\[[^\]]+\](?::)?\s*/, "").trim();
          const stanceDesc = activeStance === "aggressive" ? "blade angled forward with relentless pressure" : activeStance === "defensive" ? "guard raised high and footing braced firmly against the ground" : "shoulders squared and senses locked on the target";
          responseData.player_execution = `${playerProfile.name} shifts weight and commits decisively to the tactical maneuver, ${stanceDesc}. The cold tension in the air crystallizes as every muscle tightens for immediate follow-through. "${cleanAct}"`;
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
        const rawNarrativeSource = responseData.narrative_text || responseData.narrative || "";
        const rawMechanicsSource =
          responseData.mechanics ||
          responseData.system_updates?.system_announcement ||
          null;
        const separated = sanitizeNarrativeAndMechanics(rawNarrativeSource, rawMechanicsSource);
        const cleanedProse = enforceSpokenDialogueMasking(
          sanitizeVisualNovelProse(separated.narrative),
          playerProfile?.name,
          speakerKnowsNameNow
        );
        responseData.narrative_text = cleanedProse;
        responseData.narrative = cleanedProse;
        responseData.mechanics = separated.mechanics || null;
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

        // Sanitize suggested choices and guarantee intent tags
        if (Array.isArray(responseData.suggested_choices)) {
          responseData.suggested_choices = responseData.suggested_choices.map((c: string) =>
            ensureChoiceIntentTag(sanitizeVisualNovelProse(c))
          );
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
