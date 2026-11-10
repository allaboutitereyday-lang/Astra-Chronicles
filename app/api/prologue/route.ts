import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";
import { getNarrationProseDirective, NarrativeDepthMode } from "@/lib/narrationStyles";
import { describeProtagonistAvatar, isFallbackVisualDescription } from "@/lib/visionEncoder";
import { sanitizeVisualNovelProse, sanitizeSpokenDialogue, ensureChoiceIntentTag, sanitizeNarrativeAndMechanics, humanizeGearForProse, humanizeLocationForProse } from "@/lib/proseSanitizer";
import { HEROINE_INTRODUCTION_DOSSIERS, HeroineIntroductionDossier } from "@/lib/heroineDossiers";
import {
  createDefaultNpcKnowledgeMap,
  buildKnowledgeGateDirective,
  getCompanionKnowledge,
  enforceSpokenDialogueMasking,
} from "@/lib/knowledgeGating";
import {
  buildDynamicChoiceDirective,
  buildPersonalityFallbackChoices,
  getPersonaVoiceProfile,
  buildProtagonistOriginAndIdentityDirective,
} from "@/lib/personalityArchitect";
import { SOVEREIGN_HEROINE_DOSSIERS, SOVEREIGN_ORIGIN_PRESETS } from "@/types/sovereign_spire";
import { PORT_SOLARIS_HEROINE_DOSSIERS, PORT_SOLARIS_ORIGIN_PRESETS } from "@/types/port_solaris";
import { parseModelJsonLenient } from "@/lib/jsonSalvage";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROLOGUE_MODELS = [
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

function shouldUseJsonObjectFormat(model: string): boolean {
  const m = (model || "").toLowerCase();
  return m.startsWith("google/") || m.includes("gemini") || m.startsWith("openai/");
}

function getModelMaxTokens(model: string, baseMaxTokens: number): number {
  const m = (model || "").toLowerCase();
  if (m.includes("mythomax")) return Math.min(baseMaxTokens, 900);
  if (m.includes("lunaris-8b")) return Math.min(baseMaxTokens, 1500);
  if (m.includes("cydonia") || m.includes("euryale") || m.includes("magnum")) {
    return Math.min(baseMaxTokens, 2000);
  }
  return Math.min(baseMaxTokens, 2400);
}

export async function POST(req: Request) {
  try {
    const headerKey = req.headers.get("x-user-key");
    const body = await req.json();

    const {
      playerProfile,
      playerAvatarBase64,
      startingHeroine: rawStartingHeroine,
      startingLocation: rawStartingLocation,
      selectedPrologue,
      selectedPrologueNode,
      narrationStyle,
      userAccessKey,
      storyContext,
      targetEnvironment = "cloud",
      modelId,
      temperature,
      max_tokens,
      repetition_penalty,
      narrativeDepth,
      npcKnowledgeMap,
    } = body;

    const startingHeroine: string =
      rawStartingHeroine ||
      selectedPrologue?.speaker ||
      storyContext?.startingNodes?.[0]?.speaker ||
      storyContext?.companions?.[0]?.name ||
      "Evelyn Abbandonato";
    const startingLocation: string =
      rawStartingLocation ||
      selectedPrologue?.location ||
      storyContext?.startingNodes?.[0]?.location ||
      storyContext?.worldContext?.locations?.[0]?.name ||
      "Imperial Capital Imperium";

    const initialPresentHeroines: string[] =
      Array.isArray(selectedPrologueNode?.presentCompanions) &&
      selectedPrologueNode.presentCompanions.length > 0
        ? selectedPrologueNode.presentCompanions
        : Array.isArray(selectedPrologue?.presentCompanions) &&
          selectedPrologue.presentCompanions.length > 0
        ? selectedPrologue.presentCompanions
        : [startingHeroine || "Evelyn Abbandonato"];

    const initialKnowledgeMap = {
      ...createDefaultNpcKnowledgeMap(storyContext?.companions),
      ...(npcKnowledgeMap || {}),
    };
    const startingHeroineKnowledge = getCompanionKnowledge(initialKnowledgeMap, startingHeroine);
    const knowledgeGatePrompt = buildKnowledgeGateDirective(
      initialKnowledgeMap,
      initialPresentHeroines,
      playerProfile
    );

    const effectiveTemperature = typeof temperature === "number" ? Math.max(0.1, Math.min(1.8, temperature)) : 0.75;
    const effectiveMaxTokens = typeof max_tokens === "number" ? Math.max(1024, Math.min(4096, max_tokens)) : 3584;
    const effectiveRepetitionPenalty = typeof repetition_penalty === "number" ? Math.max(1.0, Math.min(1.5, repetition_penalty)) : 1.1;
    const effectiveNarrativeDepth: NarrativeDepthMode =
      narrativeDepth === "standard" || narrativeDepth === "expansive" || narrativeDepth === "deep_novelistic"
        ? narrativeDepth
        : "deep_novelistic";
    const sceneSetupParagraphSpec =
      effectiveNarrativeDepth === "standard"
        ? "1-2 plain-text paragraphs"
        : effectiveNarrativeDepth === "expansive"
        ? "2-3 rich plain-text paragraphs"
        : "3-4 rich, novel-length plain-text paragraphs (separated by \\n\\n)";
    const dialogueParagraphSpec =
      effectiveNarrativeDepth === "standard"
        ? "1-2 paragraphs of spoken lines"
        : "2-3 rich paragraphs weaving multi-part spoken lines in double quotation marks (\"...\") with physical gestures, micro-expressions, and spatial movement";

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
        console.warn("[Prologue API] Failed to encode avatar with vision:", vErr?.message);
      }
    }

    const storyTitle = storyContext?.title || "Astra Chronicles";
    const settingName = storyContext?.worldContext?.settingName || "the Astra Continent";
    const effectiveTone = narrationStyle || storyContext?.narrationStyle || "Grimdark & Atmospheric";

    // Match starting heroine to her bespoke canonical introduction dossier (or synthesize from storyContext for Sovereign Spire / other worlds)
    const matchedDossierKey = Object.keys(HEROINE_INTRODUCTION_DOSSIERS).find(
      (k) =>
        k.toLowerCase().includes((startingHeroine || "").toLowerCase()) ||
        (startingHeroine || "").toLowerCase().includes(k.toLowerCase())
    );
    const matchingNode =
      selectedPrologueNode ||
      selectedPrologue ||
      storyContext?.startingNodes?.find(
        (n: any) =>
          n.speaker &&
          (n.speaker.toLowerCase().includes(startingHeroine.toLowerCase()) ||
            startingHeroine.toLowerCase().includes(n.speaker.toLowerCase()))
      );
    const matchingComp = storyContext?.companions?.find(
      (c: any) =>
        c.name &&
        (c.name.toLowerCase().includes(startingHeroine.toLowerCase()) ||
          startingHeroine.toLowerCase().includes(c.name.toLowerCase()))
    );

    const heroineDossier: HeroineIntroductionDossier = matchedDossierKey
      ? HEROINE_INTRODUCTION_DOSSIERS[matchedDossierKey]
      : {
          name: matchingComp?.name || startingHeroine,
          title: matchingComp?.title || matchingComp?.role || "Key Figure",
          defaultLocation: matchingNode?.location || startingLocation,
          environment: matchingNode?.sceneSetup || `Atmospheric threshold within ${startingLocation}.`,
          appearanceSensoryCues: matchingComp?.visualPrompt || `Distinctive bearing and attire of ${startingHeroine}.`,
          psychologicalProfile: matchingComp?.personality || "Guarded, observant, and calculating.",
          canonicalEncounter: matchingNode?.sceneSetup || `${startingHeroine} confronts the newcomer in ${startingLocation}.`,
          dialogueCadence: "Sharp, in-character diction matching her role and faction.",
          signatureOpeningDialogue: matchingNode?.dialogue || "State your business before I lose my patience.",
          defaultExpression: (matchingNode?.expressionKey || matchingComp?.expressionKey || "neutral") as HeroineIntroductionDossier["defaultExpression"],
          initialMood: "Guarded & Evaluating",
          baselineChoices:
            Array.isArray(matchingNode?.choices) && matchingNode.choices.length >= 4
              ? [
                  matchingNode.choices[0],
                  matchingNode.choices[1],
                  matchingNode.choices[2],
                  matchingNode.choices[3],
                ]
              : [
                  "[Stoic/Composed]: Meet her gaze unflinchingly and state your purpose.",
                  "[Analytical/Observant]: Scan the immediate perimeter before answering.",
                  "[Audacious/Bold]: Step forward and turn her challenge back on her.",
                  "[Tactical/Ready]: Shift into a balanced guard and test her resolve.",
                ],
          initialQuest:
            storyContext?.id === "port-solaris" || storyTitle.toLowerCase().includes("solaris")
              ? {
                  id: "scenario_01_solaris",
                  title: `Act I: Save The Stray Anchor (${matchingNode?.location || startingLocation})`,
                  description: `Survive your opening encounter with ${matchingComp?.name || startingHeroine}, recruit your first boarding-house shift partner, and begin climbing the Solaris Star Ledger before the 30-day audit expires.`,
                  type: "scenario",
                  difficulty: "E",
                  objectives: [
                    { text: `Hold your composure and respond to ${matchingComp?.name || startingHeroine}`, completed: false },
                    { text: `Secure your footing at ${matchingNode?.location || startingLocation} under Island Charter Article 9`, completed: false },
                  ],
                  rewards: { exp: 95, gold: 120, title: "Anchor Proprietor" },
                  status: "active",
                }
              : {
                  id: "scenario_01",
                  title: `Scenario 1: Matriculation at ${matchingNode?.location || startingLocation}`,
                  description: `Establish your standing with ${matchingComp?.name || startingHeroine} and survive your opening test in ${storyTitle}.`,
                  type: "scenario",
                  difficulty: "E",
                  objectives: [
                    { text: `Respond to ${matchingComp?.name || startingHeroine}'s challenge`, completed: false },
                    { text: `Demonstrate your capability in ${matchingNode?.location || startingLocation}`, completed: false },
                  ],
                  rewards: { exp: 95, gold: 50, title: "Sovereign Initiate" },
                  status: "active",
                },
        };

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

    const personaVoice = getPersonaVoiceProfile(
      playerProfile.personality,
      playerProfile.personalityTraits
    );

    const originAndIdentityDirective = buildProtagonistOriginAndIdentityDirective(playerProfile);

    const isSovereignSpire = storyContext?.id === "sovereign-spire";
    const isPortSolaris = storyContext?.id === "port-solaris";
    const sovereignOriginPreset = isSovereignSpire
      ? SOVEREIGN_ORIGIN_PRESETS.find(
          (o) =>
            o.id === playerProfile?.sovereignOrigin ||
            (playerProfile?.worldOrigin &&
              playerProfile.worldOrigin.toLowerCase().includes(o.shortLabel.toLowerCase()))
        ) || SOVEREIGN_ORIGIN_PRESETS[0]
      : null;
    const sovereignHeroineMeta = isSovereignSpire
      ? SOVEREIGN_HEROINE_DOSSIERS[startingHeroine]
      : null;

    const portSolarisOriginPreset = isPortSolaris
      ? PORT_SOLARIS_ORIGIN_PRESETS.find(
          (o) =>
            o.id === playerProfile?.sovereignOrigin ||
            (playerProfile?.worldOrigin &&
              playerProfile.worldOrigin.toLowerCase().includes(o.shortLabel.toLowerCase()))
        ) || PORT_SOLARIS_ORIGIN_PRESETS[0]
      : null;
    const portSolarisHeroineMeta = isPortSolaris
      ? PORT_SOLARIS_HEROINE_DOSSIERS[startingHeroine]
      : null;

    const multiHeroineEnsembleDirective =
      initialPresentHeroines.length > 1
        ? `\n- ENSEMBLE CONVOCATION SCENE (${initialPresentHeroines.length} KEY HEROINES PRESENT): ${initialPresentHeroines.map((h) => h.split(" ")[0]).join(", ")} are ALL physically present in this scene. While ${startingHeroine.split(" ")[0]} delivers the primary challenge, weave brief sensory reactions, glances, or interjections from the other present heroines (${initialPresentHeroines.filter((h) => h !== startingHeroine).map((h) => h.split(" ")[0]).join(", ")}) using their first names after initial introduction so the player feels the full tension of the convocation!`
        : "";

    const sovereignSpireActOneDirective = isSovereignSpire
      ? `
--- THE SOVEREIGN SPIRE: ACT I MATRICULATION & CONDUIT DIRECTIVE ---
- Protagonist Matriculation Origin: ${sovereignOriginPreset?.name || playerProfile?.worldOrigin} (Starting Ladder Rank: #${playerProfile?.matriculationRank || sovereignOriginPreset?.startingRank || 488} | Semester Quota: ${playerProfile?.semesterDebtQuota || sovereignOriginPreset?.semesterDebtQuota || 400} Aether Cores)
- Origin Act I Stakes: ${sovereignOriginPreset?.actOneStakes || playerProfile?.worldOriginDetails}
- Dual-Conduit Pathway: ${playerProfile?.conduit || "SOMATIC"} (${playerProfile?.conduit === "AETHERIAL" ? "Aetherial projection — sigil arrays and spatial flux" : playerProfile?.conduit === "HYBRID" ? "Hybrid conduit — blending heightened reflexes with arcane hexes or artificer tools" : "Somatic tempering — rhythmic pulse-breathing and kinetic blade control"})
- Patron Wing Alignment: ${(playerProfile?.patronWing || "IRON_CHANCELLERY").replace(/_/g, " ")}
${sovereignHeroineMeta ? `- Primary Speaker Dossier (${sovereignHeroineMeta.name.split(" ")[0]} — "${sovereignHeroineMeta.epithet}"): Wing: ${sovereignHeroineMeta.wing.replace(/_/g, " ")} | Act I Conflict: ${sovereignHeroineMeta.actOneConflict}` : ""}${multiHeroineEnsembleDirective}
- Selected Act I Scenario Seed: "${matchingNode?.title || heroineDossier.title}"
  Scene Baseline: ${matchingNode?.sceneSetup || heroineDossier.environment}
  Dialogue Baseline: "${matchingNode?.dialogue || heroineDossier.signatureOpeningDialogue}"
- MANDATORY ACT I SHAPING (WRITE IN NATURAL HUMAN PROSE):
  1. Tailor ${startingHeroine.split(" ")[0]}'s opening assessment and the scene atmosphere to the protagonist's Matriculation Origin (whether a debt-bound commoner in the bottom ranks, a disgraced highborn hostage, or an unregistered anomaly whose presence quiets the vault's static).
  2. Weave the immediate Act I pressure naturally into the scene without sounding like a glossary readout—let the characters speak and react like living people rather than reciting capitalized mechanic terms or item labels.
  3. Shape the 4 "opening_choices" into distinct, natural Act I vectors using first names only (${initialPresentHeroines.map((h) => h.split(" ")[0]).join(", ")}) and natural weapon/environment descriptions:
     - Choice 1: [${playerProfile?.conduit || "Somatic"}/Technique] Channeling their physical or arcane discipline in a concrete physical move.
     - Choice 2: [${sovereignOriginPreset?.shortLabel || "Origin Leverage"}] Leveraging their background and matriculation standing in dialogue.
     - Choice 3: [Insight / Connection] Reading ${startingHeroine.split(" ")[0]}'s subtle physical tell or addressing one of the other present heroines (${initialPresentHeroines.map((h) => h.split(" ")[0]).join(", ")}).
     - Choice 4: [Audacious Wager] Turning the tables on the immediate challenge with bold composure.`
      : isPortSolaris
      ? `
--- PORT SOLARIS: ACT I LEASE AUDIT, ROM-COM & FLAIR DIRECTIVE ---
- Proprietor Background: ${portSolarisOriginPreset?.name || playerProfile?.worldOrigin} (Starting Star Rating: 0★ Probation | 30-Day Audit Countdown | Outstanding Lease Debt: ${playerProfile?.semesterDebtQuota || portSolarisOriginPreset?.outstandingDebt || 5000} Solar Crowns)
- Act I Stakes at The Stray Anchor: ${portSolarisOriginPreset?.actOneStakes || playerProfile?.worldOriginDetails}
- Flair Conduit Style: ${playerProfile?.conduit || "PHYSICAL_TEMPO"} (${playerProfile?.conduit === "SOCIAL_PANACHE" ? "Social Panache — silver-tongued table-turn counters, VIP sommelier charm, and audit wit" : playerProfile?.conduit === "HYBRID" ? "Hybrid Flair — blending craft mixology, arcade reflexes, and effortless boardwalk charisma" : "Physical Tempo — sizzling culinary craft, beach volleyball athleticism, and high-hype momentum"})
- Island Faction Alignment: ${(playerProfile?.patronWing || "BOARDWALK_GUILD").replace(/_/g, " ")}
${portSolarisHeroineMeta ? `- Primary Speaker Dossier (${portSolarisHeroineMeta.name.split(" ")[0]} — "${portSolarisHeroineMeta.epithet}"): Faction: ${portSolarisHeroineMeta.faction.replace(/_/g, " ")} | Rom-Com Hook: ${portSolarisHeroineMeta.actOneConflict}` : ""}${multiHeroineEnsembleDirective}
- Selected Act I Scenario Seed: "${matchingNode?.title || heroineDossier.title}"
  Scene Baseline: ${matchingNode?.sceneSetup || heroineDossier.environment}
  Dialogue Baseline: "${matchingNode?.dialogue || heroineDossier.signatureOpeningDialogue}"
- MANDATORY ACT I SHAPING (SUN-DRENCHED SLICE-OF-LIFE ROM-COM PROSE):
  1. Tailor ${startingHeroine.split(" ")[0]}'s opening reaction and the sunlit Mediterranean atmosphere to the protagonist's Proprietor Background (whether an overworked culinary prodigy, a cut-off yacht-club heir, or a returning childhood local).
  2. Capture the sparkling rom-com banter, sensory food/beach details, and boarding-house proximity tension naturally without sounding like a system manual—use first names only (${initialPresentHeroines.map((h) => h.split(" ")[0]).join(", ")}) after initial introduction.
  3. Shape the 4 "opening_choices" into distinct, natural Act I vectors using first names only:
     - Choice 1: [Physical Tempo / Craft] Demonstrating hands-on culinary, mixology, or athletic skill right in front of ${startingHeroine.split(" ")[0]}.
     - Choice 2: [Social Panache / Tease] Turning the tables with smooth banter that pushes ${startingHeroine.split(" ")[0]}'s heart-rate into the Blush Zone.
     - Choice 3: [${portSolarisOriginPreset?.shortLabel || "Proprietor Leverage"}] Using your background and landlord authority at The Stray Anchor.
     - Choice 4: [Article 9 Wager] Proposing a bold, high-stakes public or boarding-house wager.`
      : "";

    const openingChoiceDirective = buildDynamicChoiceDirective({
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
      abilities: playerProfile.abilities,
      location: startingLocation,
      activeSpeaker: startingHeroine,
      latestDialogue: `Opening encounter with ${initialPresentHeroines.join(", ")}`,
      mood: "Introductory Encounter",
      isProtagonistAlone: false,
      presentHeroineNames: initialPresentHeroines,
    });

    const visibleWeaponText = playerProfile.gear?.weapon && !playerProfile.gear.weapon.includes("Pending")
      ? humanizeGearForProse(playerProfile.gear.weapon, "unarmed hands")
      : "unarmed hands";

    const visibleArmorText = playerProfile.gear?.armor && !playerProfile.gear.armor.includes("Pending")
      ? humanizeGearForProse(playerProfile.gear.armor, "basic attire")
      : (isUncladOrNude ? "completely unclad / no clothing or armor" : "unarmored basic attire");

    const playerFirstName = (playerProfile?.name || "the newcomer").trim().split(/\s+/)[0] || "the newcomer";
    const heroineFirstName = (startingHeroine || "the heroine").trim().split(/\s+/)[0] || startingHeroine;
    const naturalStartingLocation = humanizeLocationForProse(startingLocation);

    const systemPrompt = `You are the Game Master and Director for "${storyTitle}", an interactive visual novel set on ${settingName}.

${getNarrationProseDirective(effectiveTone, effectiveNarrativeDepth)}

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
2. In her opening reaction, ${heroineFirstName} MUST explicitly observe and remark on the newcomer's visible physical appearance, build, visible gear (${visibleWeaponText} / ${visibleArmorText}), and bearing—while strictly obeying the Diegetic Knowledge Gate below (she does NOT yet know the newcomer's name or internal LitRPG class title!).
   - NATURAL HUMAN PROSE MANDATE: Write like a human novelist. After introducing ${startingHeroine} once, refer to her simply as "${heroineFirstName}" (never repeat her full name in every paragraph or choice). Describe weapons, clothing, and locations naturally (e.g., "your curved blade", "that dark coat", "down in the pit")—NEVER paste capitalized UI equipment labels or map banners into narrative sentences or dialogue!
   ${isUncladOrNude || visibleArmorText.toLowerCase().includes("unclad") || visibleArmorText.toLowerCase().includes("none")
     ? `- MANDATORY NUDITY / UNARMORED DIRECTIVE: The newcomer is completely unclad, nude, or lacking armor/gear. ${heroineFirstName} MUST prominently and in-character acknowledge and react to this blatant lack of clothing (e.g. reacting with disdain, raised eyebrows, sarcasm, extreme fluster, or predatory amusement according to her persona).`
     : ""}

${knowledgeGatePrompt}
3. OPENING CHOICES PERSONALITY ALIGNMENT (CRITICAL): The 4 generated options in "opening_choices" MUST be written in the exact voice, attitude, and vocabulary of ${playerFirstName}'s chosen Character Creation personality:
   - Chosen Personality: "${personaVoice.personaTitle}"
   - Core Traits: [${personaVoice.traitsList.join(", ")}]
   - Speech Cadence: ${personaVoice.speechCadence}
   - Format: "[Tone/Action]: 'Spoken dialogue in ${personaVoice.personaTitle} voice' + concrete physical action"
   - Every single option in "opening_choices" MUST reflect how a "${personaVoice.personaTitle}" (${personaVoice.traitsList.join(", ")}) reacts to ${heroineFirstName} in ${naturalStartingLocation}. Use first names only ("${heroineFirstName}") and natural weapon/room descriptions in choices!

--- COMPATIBILITY & BASE AFFECTION RULES ---
- Base affection must start LOW overall (range: 5 to 25). Heroines in this world are guarded and cynical.
- High Compatibility (class, vibe, and visual presentation strongly match her values): 18 - 25.
- Neutral / Average Compatibility: 12 - 17.
- Low / Suspicious Compatibility (clashes with her nature or poses an overt annoyance): 5 - 11.

--- PROTAGONIST LINEAGE & ANATOMICAL PHYSIOLOGY ---
- Race / Lineage: ${playerProfile?.race || "Human"}
- Biological Traits & Anatomy: ${playerProfile?.racialTraits && playerProfile.racialTraits.length > 0 ? playerProfile.racialTraits.join(", ") : "Standard human physiology"}
- PROLOGUE SPECIES MANDATE: ${startingHeroine} and the surrounding world MUST naturally perceive and react to ${playerProfile?.name || "The protagonist"}'s lineage (${playerProfile?.race || "Human"}). If they possess non-human traits (e.g. lupine/canine fur, fangs, wolf ears, tail, claws, horns, wings, or scales), describe these physical traits naturally in the prose and sensory details (scent, ear movements, predatory tension, body heat, or bristling fur), reflecting ${startingHeroine}'s authentic cultural and emotional reaction to encountering such an entity.

${originAndIdentityDirective}
${sovereignSpireActOneDirective}

--- VISUAL INSPECTION DIRECTIVE ---
${visualDescription
  ? `Detailed visual appearance of ${playerProfile.name} (derived from uploaded avatar):
"${visualDescription}"
CRITICAL OPENING DIRECTIVE: ${startingHeroine} MUST explicitly observe and remark on ${playerProfile.name}'s specific appearance, attire (or complete lack of clothing/nudity if unclad), physical build, and bearing in her opening dialogue or internal impressions. If ${playerProfile.name} is unclad or nude, ${startingHeroine} MUST directly address this shocking or shameless state!`
  : playerAvatarBase64
  ? `If a character avatar image is provided, ${startingHeroine} MUST explicitly and naturally observe their appearance in her initial reaction:
- Take note of their physical features (hair, eyes, build, stance), armor/clothing (or lack thereof), visible weapons, and overall aura.
- Weave these direct observations naturally into her dialogue or internal impression.`
  : `Portray the protagonist with the presence and demeanor befitting a ${playerProfile.role}.`}

--- SYSTEM ADMINISTRATOR DIRECTIVE ---
You also operate the transcendent LitRPG/Manhwa 'SYSTEM' that tracks and guides the protagonist.
Initialize the starting scenario quest and starting causal plausibility (default 80%).
Voice: Detached, cold, authoritative administrator ([SYSTEM: ...]).

${openingChoiceDirective}

--- OUTPUT FORMAT ---
Respond strictly in valid JSON matching this schema:
{
  "speaker": "${startingHeroine}",
  "location": "${startingLocation}",
  "scene_setup": string, // ${sceneSetupParagraphSpec} detailing the location, weather, acoustics, ambient hazards, and how the player arrives/stands before the heroine, with flawless grammar and ZERO Markdown asterisks (* or **)
  "dialogue": string, // ${dialogueParagraphSpec} addressing the protagonist. Start with a brief physical gesture or expression beat before opening spoken quotes, and escape all internal double quotes (\"...\") properly inside the JSON string so the string is NEVER truncated after the first spoken clause!
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

    const promptText = `Protagonist (Narrator Reference Only — Unknown to ${startingHeroine} in dialogue unless unlocked): ${startingHeroineKnowledge.knowsName ? playerProfile.name : `[UNKNOWN TO ${(startingHeroine || "COMPANION").toUpperCase()} — Refer to as "stranger" or "initiate" in spoken dialogue]`}
Gender & Age: ${playerProfile?.gender || "Male"} | Age: ${playerProfile?.age || "22"}
World Origin & System Familiarity: ${playerProfile?.worldOrigin || "Born & Raised (Native)"}${playerProfile?.worldOriginDetails ? ` (${playerProfile.worldOriginDetails})` : ""}
Internal Class (Unknown to ${startingHeroine} in dialogue unless unlocked): ${startingHeroineKnowledge.knowsClass ? playerProfile?.role : `[UNKNOWN TO ${(startingHeroine || "COMPANION").toUpperCase()} — Judge only visible gear]`}
Chosen Personality Archetype: "${personaVoice.personaTitle}" (Traits: ${personaVoice.traitsList.join(", ")})
Attributes: STR ${playerProfile?.stats?.str ?? 10} | DEX ${playerProfile?.stats?.dex ?? 10} | INT ${playerProfile?.stats?.int ?? 10}
Visible Gear: ${playerProfile?.gear?.weapon || "Bare Hands"} / ${playerProfile?.gear?.armor || "Wanderer Attire"}
Starting Abilities: ${abilitiesDesc}
Starting Location: ${startingLocation}
Starting Heroine: ${startingHeroine}

Generate the dynamic opening prologue according to the instructions. Ensure all 4 "opening_choices" unmistakably express ${playerProfile?.name || "the protagonist"}'s "${personaVoice.personaTitle}" (${personaVoice.traitsList.join(", ")}) personality and speech cadence.`;

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

    let responseData = null;
    let lastError = null;

    // Smart Hybrid routes structured prologue orchestration to Gemini 2.5 Flash (default) or DeepSeek V3.2
    const normalizedRequestedModel = modelId ? (LEGACY_MODEL_MIGRATIONS[modelId] || modelId) : "";
    const effectiveModelId =
      normalizedRequestedModel === "orchestrated-hybrid" || !normalizedRequestedModel
        ? "google/gemini-2.5-flash"
        : normalizedRequestedModel === "orchestrated-hybrid-deepseek"
        ? "deepseek/deepseek-v3.2"
        : normalizedRequestedModel;
    const modelsToTry = isLocal
      ? [effectiveModelId || "hermes3:8b"]
      : (effectiveModelId ? [effectiveModelId, ...PROLOGUE_MODELS.filter((m) => m !== effectiveModelId)] : PROLOGUE_MODELS);

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

        const isAnthropicModel = model.toLowerCase().includes("claude") || model.toLowerCase().startsWith("anthropic/");
        const modelMaxTokens = getModelMaxTokens(model, effectiveMaxTokens);
        const useJsonFormat = shouldUseJsonObjectFormat(model);
        const timeoutMs = isLocal ? 60000 : modelIdx === 0 ? 35000 : 20000;

        let response = await fetch(fetchUrl, {
          method: "POST",
          headers,
          signal: AbortSignal.timeout(timeoutMs),
          body: JSON.stringify({
            model,
            messages,
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
        const content = data.choices?.[0]?.message?.content || "";
        responseData = parseModelJsonLenient(content, startingHeroine);
        if (
          !responseData ||
          typeof responseData !== "object" ||
          Array.isArray(responseData) ||
          (!responseData.scene_setup && !responseData.dialogue && !responseData.narrative_text)
        ) {
          throw new Error("Malformed or empty JSON response from prologue model");
        }
        const userStats = !isLocal && authCheck.valid
          ? recordUserTurn(activeUser.key, data.usage, model)
          : activeUser;
        responseData._userStats = userStats;
        break;
      } catch (err: any) {
        console.warn(`Error generating prologue with model ${model}:`, err.message);
        responseData = null;
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
        opening_choices: buildPersonalityFallbackChoices({
          personality: playerProfile?.personality,
          personalityTraits: playerProfile?.personalityTraits,
          playerRole: playerProfile?.role,
          playerRace: playerProfile?.race,
          activeSpeaker: heroineDossier.name,
          location: heroineDossier.defaultLocation || startingLocation,
          isProtagonistAlone: false,
          storyId: storyContext?.id,
          genre: storyContext?.genre,
        }),
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
      const trimmedDiag = String(responseData.dialogue).trim();
      // Guard against JSON grammar truncation after the first spoken clause (e.g. '"Five hundred initiates on the ledger,"')
      const looksTruncated =
        trimmedDiag.endsWith(',"') ||
        trimmedDiag.endsWith(",") ||
        trimmedDiag.endsWith("—") ||
        (trimmedDiag.length < 75 && (heroineDossier.signatureOpeningDialogue?.length || 0) > 90);
      const effectiveDialogue = looksTruncated
        ? heroineDossier.signatureOpeningDialogue
        : trimmedDiag;

      responseData.dialogue = enforceSpokenDialogueMasking(
        sanitizeSpokenDialogue(effectiveDialogue),
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
    responseData.present_companions = initialPresentHeroines;
    if (!Array.isArray(responseData.opening_choices) || responseData.opening_choices.length === 0) {
      responseData.opening_choices = buildPersonalityFallbackChoices({
        personality: playerProfile?.personality,
        personalityTraits: playerProfile?.personalityTraits,
        playerRole: playerProfile?.role,
        playerRace: playerProfile?.race,
        activeSpeaker: startingHeroine,
        location: startingLocation,
        isProtagonistAlone: false,
        storyId: storyContext?.id,
        genre: storyContext?.genre,
        narrativeText: responseData.narrative,
      });
    }
    responseData.opening_choices = responseData.opening_choices.map((c: string) =>
      ensureChoiceIntentTag(sanitizeVisualNovelProse(c))
    );

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

