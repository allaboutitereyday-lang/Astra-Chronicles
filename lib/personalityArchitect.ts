export interface PersonalityPreset {
  id: string;
  name: string;
  shortLabel: string;
  icon: string;
  description: string;
  defaultTraits: string[];
}

export interface GenderPreset {
  id: string;
  name: string;
  shortLabel: string;
  pronouns: string;
  icon: string;
}

export const GENDER_PRESETS: GenderPreset[] = [
  { id: "male", name: "Male", shortLabel: "Male", pronouns: "he/him", icon: "♂️" },
  { id: "female", name: "Female", shortLabel: "Female", pronouns: "she/her", icon: "♀️" },
  { id: "nonbinary", name: "Non-Binary", shortLabel: "Non-Binary", pronouns: "they/them", icon: "⚧️" },
  { id: "custom", name: "Custom", shortLabel: "Custom", pronouns: "custom", icon: "✨" },
];

export interface WorldOriginPreset {
  id: string;
  name: string;
  shortLabel: string;
  icon: string;
  badge: string;
  description: string;
  defaultDetails: string;
}

export const WORLD_ORIGIN_PRESETS: WorldOriginPreset[] = [
  {
    id: "native",
    name: "Born & Raised (Native)",
    shortLabel: "Native-Born",
    icon: "🏛️",
    badge: "Deep World & System Mastery",
    description:
      "Born and raised in this world. You grew up with the System, classes, mana laws, and local factions as everyday reality.",
    defaultDetails:
      "Born and raised natively in this realm. Deeply familiar with how the LitRPG System, status windows, classes, mana circuits, and regional factions operate; never bewildered by basic System mechanics or common world lore.",
  },
  {
    id: "summoned",
    name: "Summoned (Otherworlder)",
    shortLabel: "Summoned",
    icon: "🌀",
    badge: "Transmigrated Outsider",
    description:
      "Pulled across dimensional boundaries in your own body by a rift, summoning ritual, or System decree.",
    defaultDetails:
      "Summoned from another world in their original body. Brings an outsider's sharp perspective and adaptability, discovering local customs and faction politics firsthand while newly bound to the System.",
  },
  {
    id: "reincarnated",
    name: "Reincarnated (Past-Life Soul)",
    shortLabel: "Reincarnated",
    icon: "✨",
    badge: "Dual-Life Intuition",
    description:
      "Died in a previous world and was reborn here from infancy with intact past-life memories and maturity.",
    defaultDetails:
      "Reincarnated into this world with intact memories of a prior life. Combines lived native familiarity with local culture alongside calculating past-life maturity and an uncanny knack for exploiting System mechanics.",
  },
  {
    id: "regressor",
    name: "Regressor (Timeline Survivor)",
    shortLabel: "Regressor",
    icon: "⏳",
    badge: "Future Foreknowledge",
    description:
      "Lived and perished in the ruined future of this world before a Causal Anchor rewound your soul to the beginning.",
    defaultDetails:
      "Returned through time after surviving until the catastrophic end of a previous timeline. Possesses battle-hardened veteran composure, deep mastery of hidden System laws, and haunting foreknowledge.",
  },
  {
    id: "custom",
    name: "Custom Origin",
    shortLabel: "Custom",
    icon: "📜",
    badge: "Bespoke Arrival",
    description:
      "Define your own unique arrival background, upbringing, and level of familiarity with the world and System.",
    defaultDetails: "",
  },
];

/**
 * Builds the authoritative Protagonist Identity (Gender, Age) & World Origin / System Familiarity
 * directive injected into `/api/prologue`, `/api/turn`, `/api/expand-action`, and `/api/generate-choices`.
 */
export function buildProtagonistOriginAndIdentityDirective(playerProfile?: {
  name?: string;
  gender?: string;
  age?: string;
  worldOrigin?: string;
  worldOriginDetails?: string;
  role?: string;
  race?: string;
}): string {
  const name = playerProfile?.name || "The Protagonist";
  const rawGender = (playerProfile?.gender || "Male").trim();
  const rawAge = (playerProfile?.age || "22").trim();
  const rawOrigin = (playerProfile?.worldOrigin || "Born & Raised (Native)").trim();
  const rawOriginDetails = (playerProfile?.worldOriginDetails || "").trim();

  const lowerGender = rawGender.toLowerCase();
  let pronounGuide = `Use gender-appropriate pronouns and terms of address matching "${rawGender}".`;
  if (lowerGender === "male" || lowerGender.startsWith("male ") || lowerGender.includes("he/him")) {
    pronounGuide = `Refer to ${name} with male pronouns (he/him/his) in third-person narrative prose. Companions and NPCs must use male-appropriate honorifics and terms of address (e.g., "sir", "milord", "boy", "man", "brother", "gentleman").`;
  } else if (lowerGender === "female" || lowerGender.startsWith("female ") || lowerGender.includes("she/her")) {
    pronounGuide = `Refer to ${name} with female pronouns (she/her/hers) in third-person narrative prose. Companions and NPCs must use female-appropriate honorifics and terms of address (e.g., "miss", "milady", "lady", "girl", "woman", "sister").`;
  } else if (lowerGender.includes("non-binary") || lowerGender.includes("nonbinary") || lowerGender.includes("they/them")) {
    pronounGuide = `Refer to ${name} with gender-neutral pronouns (they/them/their) in third-person narrative prose. Companions and NPCs must use gender-neutral honorifics and terms of address (e.g., "traveler", "wanderer", "honored guest", "contractor").`;
  }

  const lowerOrigin = rawOrigin.toLowerCase();
  let originMechanicsDirective = "";
  if (lowerOrigin.includes("native") || lowerOrigin.includes("born")) {
    originMechanicsDirective = `- NATIVE WORLD & SYSTEM FAMILIARITY (CRITICAL): ${name} was BORN AND RAISED in this world!
  * ${name} is deeply familiar with how the LitRPG System, classes (${playerProfile?.role || "Adventurer"}), mana circuits, status windows, and major world factions operate.
  * NEVER portray ${name} as confused by the existence of the System, mana, monsters, or basic cultural norms of this world.
  * In "player_execution" and "suggested_choices", ${name} speaks and thinks like a seasoned inhabitant of this realm who understands its rules, dangers, and institutions firsthand.`;
  } else if (lowerOrigin.includes("summon") || lowerOrigin.includes("otherworld") || lowerOrigin.includes("transmigrat")) {
    originMechanicsDirective = `- SUMMONED OTHERWORLDER PERSPECTIVE (CRITICAL): ${name} was SUMMONED / PULLED FROM ANOTHER WORLD in their own body!
  * ${name} is not native to this realm. While newly bound to the LitRPG System, they view this world's factions, aristocratic hierarchies, and arcane anomalies with an outsider's sharp, unindoctrinated perspective.
  * ${name} may ask perceptive questions about local politics or test how their newly awakened System abilities function in practice, and observant companions may notice subtle anomalies in their mannerisms, speech, or unanchored causal aura.`;
  } else if (lowerOrigin.includes("reincarnat")) {
    originMechanicsDirective = `- REINCARNATED PAST-LIFE SOUL (CRITICAL): ${name} died in a previous world and was REINCARNATED into this realm with intact past-life memories!
  * ${name} grew up in this world and knows its language, geography, and LitRPG System rules natively, while also possessing the calculating maturity, lateral thinking, and psychological poise of someone who has already lived a full prior life.
  * In "player_execution" and "suggested_choices", reflect both native knowledge of the System and clever, unconventional problem-solving.`;
  } else if (lowerOrigin.includes("regress")) {
    originMechanicsDirective = `- TIMELINE REGRESSOR FOREKNOWLEDGE (CRITICAL): ${name} lived through the ruined future of this world, perished, and regressed to the beginning!
  * ${name} possesses veteran mastery of the LitRPG System's hidden mechanics, combat instincts far beyond a normal novice, and haunting familiarity with the realm's looming calamities.`;
  } else {
    originMechanicsDirective = `- BESPOKE WORLD ORIGIN (${rawOrigin}):
  * Portray ${name}'s familiarity with the world and the LitRPG System strictly in accordance with their origin: "${rawOrigin}"${rawOriginDetails ? ` — ${rawOriginDetails}` : ""}.`;
  }

  return `--- PROTAGONIST DEMOGRAPHICS, WORLD ORIGIN & SYSTEM FAMILIARITY DIRECTIVE ---
- Gender & Pronouns: ${rawGender} — ${pronounGuide}
- Age & Physical Bearing: ${rawAge} (Reflect this age and life stage naturally in physical descriptions and how NPCs perceive ${name}).
- World Origin / Arrival Background: ${rawOrigin}${rawOriginDetails ? `\n- Origin Backstory & Knowledge Context: ${rawOriginDetails}` : ""}
${originMechanicsDirective}`;
}

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
  {
    id: "stoic",
    name: "Stoic Pragmatist",
    shortLabel: "Stoic",
    icon: "🛡️",
    description: "Calculated, survival-focused, unflinching composure. Speaks with cold efficiency.",
    defaultTraits: ["Calculated", "Unflinching", "Efficient", "Vigilant"],
  },
  {
    id: "noble",
    name: "Noble Protector",
    shortLabel: "Noble",
    icon: "⚔️",
    description: "Honorable, gallant, protective of allies. Stands firmly against injustice and cruelty.",
    defaultTraits: ["Honorable", "Protective", "Righteous", "Valiant"],
  },
  {
    id: "cynical",
    name: "Cynical Outlaw",
    shortLabel: "Cynical",
    icon: "🗡️",
    description: "Sharp-tongued, opportunistic, skeptical. Prioritizes tactical advantage and survival.",
    defaultTraits: ["Cynical", "Deadpan Wit", "Opportunistic", "Self-Reliant"],
  },
  {
    id: "scholar",
    name: "Enigmatic Scholar",
    shortLabel: "Scholar",
    icon: "📜",
    description: "Intellectual, analytical, curious about forbidden arcana, planar anomalies, and ancient lore.",
    defaultTraits: ["Analytical", "Inquisitive", "Arcane Focus", "Observant"],
  },
  {
    id: "daredevil",
    name: "Passionate Daredevil",
    shortLabel: "Daredevil",
    icon: "🔥",
    description: "Bold, emotionally fierce, leaps into danger with defiant grit and raw loyalty.",
    defaultTraits: ["Defiant", "Bold", "Hot-Blooded", "Fierce Loyalty"],
  },
  {
    id: "trickster",
    name: "Sly Trickster",
    shortLabel: "Trickster",
    icon: "🎭",
    description: "Playful, deceptive, charming. Turns perilous situations around with cunning wit.",
    defaultTraits: ["Charming", "Deceptive", "Bantering", "Unpredictable"],
  },
  {
    id: "custom",
    name: "Custom Persona",
    shortLabel: "Custom",
    icon: "✨",
    description: "Craft your own custom demeanor, moral code, and conversational mannerisms.",
    defaultTraits: [],
  },
];

export interface PersonaVoiceProfile {
  personaTitle: string;
  traitsList: string[];
  speechCadence: string;
  attitudeAndWorldview: string;
  preferredTagPrefixes: [string, string, string, string];
  exampleSpokenLines: [string, string, string];
}

/**
 * Resolves a rich, actionable voice & dialogue blueprint for any chosen personality preset or custom persona.
 */
export function getPersonaVoiceProfile(
  personality?: string,
  personalityTraits?: string[]
): PersonaVoiceProfile {
  const rawName = (personality || "Stoic Pragmatist").trim();
  const lower = rawName.toLowerCase();
  const traits =
    Array.isArray(personalityTraits) && personalityTraits.length > 0
      ? personalityTraits.filter(Boolean)
      : ["Calculated", "Unflinching", "Efficient", "Vigilant"];

  if (lower.includes("noble") || lower.includes("protector") || lower.includes("gallant") || lower.includes("hero")) {
    return {
      personaTitle: rawName,
      traitsList: traits,
      speechCadence:
        "Principled, earnest, steady, and protective. Speaks with resolute conviction, warmth toward allies, and unyielding defiance toward cruelty or dishonor.",
      attitudeAndWorldview:
        "Prioritizes shielding the vulnerable, keeping sworn word, and facing threats from the front rather than resorting to underhanded deceit.",
      preferredTagPrefixes: ["Noble/Protective", "Valiant/Resolve", "Honorable/Direct", "Righteous/Stand"],
      exampleSpokenLines: [
        "'Stand behind me. Whatever comes through that threshold answers to my steel first.'",
        "'You don't have to carry this burden alone—tell me who set this trap and we end it together.'",
        "'I won't trade innocent lives for a convenient escape. We hold the line here.'",
      ],
    };
  }

  if (lower.includes("cynic") || lower.includes("outlaw") || lower.includes("mercenary") || lower.includes("rogue")) {
    return {
      personaTitle: rawName,
      traitsList: traits,
      speechCadence:
        "Dry, street-smart, sardonic, and unsentimental. Uses deadpan wit, sharp skepticism, and pragmatic bargaining; never buys into grand idealistic speeches.",
      attitudeAndWorldview:
        "Looks for the hidden catch, the exit route, and the leverage in every conversation. Prioritizes survival, payback, and practical results.",
      preferredTagPrefixes: ["Cynical/Deadpan", "Outlaw/Leverage", "Skeptical/Sharp", "Pragmatic/Cutthroat"],
      exampleSpokenLines: [
        "'Spare me the noble speech—just tell me how much this little miracle is going to cost us.'",
        "'Funny how every time someone says \"trust me,\" there's a knife or a bounty waiting in the next room.'",
        "'We take the side passage, let the guards choke on the smoke, and settle the score on our own terms.'",
      ],
    };
  }

  if (lower.includes("scholar") || lower.includes("enigmatic") || lower.includes("intellectual") || lower.includes("arcane")) {
    return {
      personaTitle: rawName,
      traitsList: traits,
      speechCadence:
        "Articulate, perceptive, composed, and intensely curious. Speaks with analytical precision, dissecting hidden motives, rune structures, and causal anomalies.",
      attitudeAndWorldview:
        "Treats every crisis as an intricate puzzle or theorem to be solved through observation, forbidden lore, and psychological deduction.",
      preferredTagPrefixes: ["Scholar/Analytical", "Inquisitive/Lore", "Observant/Deduction", "Arcane/Calculated"],
      exampleSpokenLines: [
        "'Fascinating—the fracture pattern on that ward wasn't caused by force; someone rewrote its anchor from the inside.'",
        "'Your pulse spiked the moment the spire was mentioned. Tell me what theorem you're hiding.'",
        "'Brute force will only destabilize the rift. Give me ten seconds to invert the resonance node.'",
      ],
    };
  }

  if (lower.includes("daredevil") || lower.includes("passionate") || lower.includes("hot-blooded") || lower.includes("reckless") || lower.includes("fierce")) {
    return {
      personaTitle: rawName,
      traitsList: traits,
      speechCadence:
        "Bold, fiery, fearless, and electric with momentum. Speaks with a defiant grin, raw emotional honesty, and thrilling confidence in the face of overwhelming odds.",
      attitudeAndWorldview:
        "Thrives on high stakes and direct confrontation; refuses to cower or retreat when a daring charge can shatter the enemy's tempo.",
      preferredTagPrefixes: ["Daredevil/Bold", "Defiant/Charge", "Fierce/Grit", "Fearless/Escalation"],
      exampleSpokenLines: [
        "'Three to one? Good—that means we don't even have to aim carefully! Let's break right through them!'",
        "'Stop overthinking the odds! Grab my hand—we're jumping the chasm before the bridge collapses!'",
        "'If they want our heads, they're welcome to step up and try taking them!'",
      ],
    };
  }

  if (lower.includes("trickster") || lower.includes("sly") || lower.includes("charming") || lower.includes("playful") || lower.includes("flirt")) {
    return {
      personaTitle: rawName,
      traitsList: traits,
      speechCadence:
        "Playful, quippy, charming, and dangerously clever. Uses teasing banter, theatrical misdirection, and smooth confidence to disarm allies and infuriate enemies.",
      attitudeAndWorldview:
        "Turns tense standoffs into a game of wits, bluffing with a smirk while quietly palming the trump card.",
      preferredTagPrefixes: ["Trickster/Banter", "Charming/Audacious", "Deceptive/Feint", "Cunning/Playful"],
      exampleSpokenLines: [
        "'Now, now—is that any way to greet the only person standing between you and a very messy ambush?'",
        "'Care to make a wager? If I unlock that seal in thirty seconds, you owe me the real story over drinks.'",
        "'Keep smiling and look toward the balcony—I already relieved their captain of the vault key.'",
      ],
    };
  }

  if (lower.includes("stoic") || lower.includes("pragmatist")) {
    return {
      personaTitle: rawName,
      traitsList: traits,
      speechCadence:
        "laconic, calm, unflinching, and razor-direct. Speaks in measured, deliberate sentences with zero melodrama or wasted breath.",
      attitudeAndWorldview:
        "Evaluates threats, exits, and tactical efficiency with icy composure. Actions speak louder than boastful words.",
      preferredTagPrefixes: ["Stoic/Calculated", "Pragmatic/Direct", "Vigilant/Tactical", "Unflinching/Cold"],
      exampleSpokenLines: [
        "'Save your breath. Two patrols ahead—we move when the torchlight shifts.'",
        "'State your terms plainly. If this deal compromises our position, I walk.'",
        "'Hold the left flank. I'll silence the lookout before the alarm sounds.'",
      ],
    };
  }

  // Custom Persona synthesis
  const t1 = traits[0] || "Expressive";
  const t2 = traits[1] || "Focused";
  const t3 = traits[2] || "Decisive";
  const t4 = traits[3] || "Resolute";

  return {
    personaTitle: rawName,
    traitsList: traits,
    speechCadence: `Distinctly embodies a "${rawName}" persona defined by [${traits.join(", ")}]. Every spoken line and gesture must unmistakably reflect these specific traits.`,
    attitudeAndWorldview: `Approaches every conflict, mystery, and interpersonal exchange through the lens of a "${rawName}" (${traits.join(", ")}).`,
    preferredTagPrefixes: [
      `${t1}/Action`,
      `${t2}/Tactical`,
      `${t3}/Dialogue`,
      `${t4}/Feat`,
    ],
    exampleSpokenLines: [
      `Speak and act with unmistakable ${t1.toLowerCase()} and ${t2.toLowerCase()} energy suited to a ${rawName}.`,
      `Express ${t3.toLowerCase()} conviction in both spoken dialogue and physical body language.`,
      `Respond to the scene's tension with authentic ${rawName} flair.`,
    ],
  };
}

export interface DynamicChoiceContext {
  playerName: string;
  playerRole: string;
  playerGender?: string;
  playerAge?: string;
  worldOrigin?: string;
  worldOriginDetails?: string;
  playerRace?: string;
  racialTraits?: string[];
  personality?: string;
  personalityTraits?: string[];
  behavioralTendencies?: Record<string, number>;
  activeStance?: string;
  abilities?: string[];
  location: string;
  activeSpeaker: string;
  latestDialogue?: string;
  mood?: string;
  isProtagonistAlone: boolean;
  presentHeroineNames: string[];
  pendingObjectives?: string[];
  candidateNextLocations?: string[];
  otherHeroineNames?: string[];
  storyId?: string;
  turnsInScene?: number;
}

function resolveDefaultNextLocations(currentLoc: string, storyId?: string, role?: string): [string, string] {
  const combined = `${storyId || ""} ${currentLoc || ""} ${role || ""}`.toLowerCase();
  const isPortSolaris =
    combined.includes("port-solaris") ||
    combined.includes("stray anchor") ||
    combined.includes("café") ||
    combined.includes("cafe") ||
    combined.includes("boardwalk") ||
    combined.includes("cove") ||
    combined.includes("chef") ||
    combined.includes("barista");

  if (isPortSolaris) {
    if (combined.includes("kitchen")) {
      return ["the main café floor", "the sunset boardwalk outside"];
    }
    if (combined.includes("floor") || combined.includes("counter")) {
      return ["the harbor boardwalk", "the upstairs boarding terrace"];
    }
    if (combined.includes("boardwalk") || combined.includes("pier")) {
      return ["the café lounge at The Stray Anchor", "the harbor market"];
    }
    return ["the main café floor", "the harbor boardwalk"];
  }

  const isSpire =
    combined.includes("sovereign-spire") ||
    combined.includes("stratum") ||
    combined.includes("cloister") ||
    combined.includes("velvet spill") ||
    combined.includes("sky-crown");

  if (isSpire) {
    if (combined.includes("cloister")) {
      return ["the tribunal pit at The Velvet Spill", "the upper spire terraces"];
    }
    if (combined.includes("velvet") || combined.includes("pit")) {
      return ["the sunken cloisters", "the chancellery registry"];
    }
    return ["the next stratum corridor", "the central spire courtyard"];
  }

  return ["the adjacent hall", "the outer thoroughfare"];
}

/**
 * Builds the authoritative Dynamic Choice Authoring Directive for LLM prompts.
 * Guarantees that all 4 generated dialogue/action options sound unmistakably like the player's chosen personality
 * AND actively progress the plot, objectives, and physical scene forward.
 */
export function buildDynamicChoiceDirective(ctx: DynamicChoiceContext): string {
  const voiceProfile = getPersonaVoiceProfile(ctx.personality, ctx.personalityTraits);
  const personaName = voiceProfile.personaTitle;
  const traits = voiceProfile.traitsList.join(", ");

  // Identify dominant emergent tendency if tracked
  let dominantTendency = "";
  if (ctx.behavioralTendencies && Object.keys(ctx.behavioralTendencies).length > 0) {
    const sorted = Object.entries(ctx.behavioralTendencies).sort((a, b) => b[1] - a[1]);
    if (sorted[0] && sorted[0][1] > 0) {
      dominantTendency = sorted[0][0].toUpperCase();
    }
  }

  const raceAnatomy =
    ctx.racialTraits && ctx.racialTraits.length > 0
      ? ctx.racialTraits.join(", ")
      : ctx.playerRace && ctx.playerRace.toLowerCase() !== "human"
      ? `${ctx.playerRace} physiology`
      : "Standard physiology";

  const abilitiesSnippet =
    ctx.abilities && ctx.abilities.length > 0
      ? ctx.abilities.slice(0, 3).join(", ")
      : "Signature skill & composure";

  const speakerFirstName =
    ctx.activeSpeaker && ctx.activeSpeaker !== "Narrator"
      ? ctx.activeSpeaker.trim().split(/\s+/)[0]
      : "her";
  const cleanRole = (ctx.playerRole || "Adventurer").replace(/\s*\([^)]*\)/g, "").trim() || "Adventurer";
  const cleanLocation = (() => {
    const rawLoc = (ctx.location || "this room").trim();
    const parenMatch = rawLoc.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1]) {
      const inner = parenMatch[1].split(/\s*[-–—]\s*/).pop()?.trim() || parenMatch[1].trim();
      return `the ${inner.toLowerCase()}`;
    }
    return rawLoc;
  })();

  const [defaultLoc1, defaultLoc2] = resolveDefaultNextLocations(ctx.location, ctx.storyId, ctx.playerRole);
  const nextLoc1 = ctx.candidateNextLocations?.[0] || defaultLoc1;
  const nextLoc2 = ctx.candidateNextLocations?.[1] || defaultLoc2;

  const primaryObjective =
    ctx.pendingObjectives && ctx.pendingObjectives.length > 0
      ? ctx.pendingObjectives[0]
      : null;
  const secondaryObjective =
    ctx.pendingObjectives && ctx.pendingObjectives.length > 1
      ? ctx.pendingObjectives[1]
      : null;

  const otherHeroineFirst =
    ctx.otherHeroineNames && ctx.otherHeroineNames.length > 0
      ? ctx.otherHeroineNames[0].trim().split(/\s+/)[0]
      : null;

  const companionClause = ctx.isProtagonistAlone
    ? `The protagonist is PHYSICALLY ALONE in ${cleanLocation}. Never address or converse with absent companions.`
    : `Accompanied by: ${ctx.presentHeroineNames.join(", ")}. Choices should include spoken dialogue in single quotes ('...') addressed to ${speakerFirstName} (use her first name "${speakerFirstName}" only—never repeat her full name) that sounds unmistakably like a "${personaName}".`;

  const [tag1, tag2, tag3, tag4] = voiceProfile.preferredTagPrefixes;
  const originLabel = ctx.worldOrigin || "Born & Raised (Native)";

  return `--- DYNAMIC 4-CHOICE STORY PROGRESSION & PERSONALITY DIRECTIVE (MANDATORY) ---
The player explicitly designed ${ctx.playerName}'s personality and world origin in Character Creation. ALL 4 choices MUST be written in ${ctx.playerName}'s chosen persona voice AND MUST ACTIVELY PROGRESS THE PLOT FORWARD:
- Protagonist Demographics: Gender: ${ctx.playerGender || "Male"} | Age: ${ctx.playerAge || "22"}
- World Origin & System Familiarity: ${originLabel}${ctx.worldOriginDetails ? ` (${ctx.worldOriginDetails})` : ""}
- Chosen Personality Archetype: "${personaName}"
- Core Personality Traits: [${traits}]
- Speech Cadence & Vocal Tone: ${voiceProfile.speechCadence}
- Worldview & Demeanor: ${voiceProfile.attitudeAndWorldview}
${dominantTendency ? `- Emergent Behavioral Alignment: [${dominantTendency} TENDENCY]\n` : ""}- Class & Lineage: ${cleanRole} | ${ctx.playerRace || "Human"} (${raceAnatomy})
- Active Stance & Arts: [${(ctx.activeStance || "Neutral").toUpperCase()} Stance | ${abilitiesSnippet}]
- Scene Context: ${companionClause}
${primaryObjective ? `- ACTIVE QUEST OBJECTIVE TO DRIVE NOW: "${primaryObjective}"${secondaryObjective ? ` | Next: "${secondaryObjective}"` : ""}` : ""}

CRITICAL PACING & STORY PROGRESSION RULES FOR ALL 4 CHOICES:
1. BALANCE PLAYER AGENCY (LINGER & DEEPEN vs. PUSH THE STORY FORWARD):
   - Give the player genuine control over scene pacing! Never trap them in 4 repetitive banter options on the same exhausted point, AND never force them out of a scene if they want to stay and talk a bit longer.
   - Structure the 4 choices so they offer both **meaningful forward story progression** AND **an evolving way to linger and deepen the current interaction**:
   - CHOICE 1 [${tag1}] (Advance Active Objective / Move the Plot Beat Forward):
     ${primaryObjective ? `Directly advance or fulfill the active quest objective ("${primaryObjective}")` : `Push the current exchange with ${speakerFirstName} to a decisive outcome or agreement`} with a signature "${personaName}" spoken line ('...') and concrete action.
   - CHOICE 2 [${tag2}] (Linger & Deepen Conversation / Evolve Interpersonal Chemistry):
     Remain in ${cleanLocation} with ${speakerFirstName} to explore a new conversational angle, personal truth, or closer romantic/banter beat—moving past surface-level small talk into deeper territory in ${ctx.playerName}'s "${personaName}" voice.
   - CHOICE 3 [${tag3}] (High-Stakes Action / Wager / Hands-On ${cleanRole} Flair):
     Take a bold physical action, wager, or hands-on ${cleanRole} move right here in ${cleanLocation} (${abilitiesSnippet}) that visibly shifts the stakes or dynamic.
   - CHOICE 4 [Move/Transition] (Step Out to Next Location / Advance to Next Scene Phase):
     Offer a clear, natural transition out of ${cleanLocation} toward ${nextLoc1} or ${nextLoc2}${otherHeroineFirst ? ` (or to check on ${otherHeroineFirst})` : ""} whenever the player is ready to move the story to its next setting.
2. INCLUDE SPOKEN DIALOGUE IN SINGLE QUOTES ('...'): Whenever ${ctx.playerName} speaks in a choice, write their actual spoken line in single quotes ('...'). Do NOT escape apostrophes with a backslash (\') inside JSON strings; write normal apostrophes ('Don't', 'We're').
3. USE FIRST NAMES & NATURAL PROSE ONLY: Refer to ${ctx.activeSpeaker} simply as "${speakerFirstName}" and refer to locations naturally ("${cleanLocation}", "${nextLoc1}"). Never paste full character names or parenthetical UI labels into choices!

FORMAT REQUIREMENTS:
- Every choice MUST strictly follow: "[Tone/Action]: 'Spoken dialogue in persona voice' + concrete physical action"
- Keep bracket tags concise (2-3 words max, e.g. "[${tag1}]:", "[Move/Transition]:").
- Exactly 4 options inside the JSON array ("suggested_choices") with zero Markdown asterisks.`;
}

function humanizeFallbackLocation(rawLocation?: string): string {
  if (!rawLocation) return "the room";
  const trimmed = rawLocation.trim();
  const parenMatch = trimmed.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const inner = parenMatch[1].split(/\s*[-–—]\s*/).pop()?.trim() || parenMatch[1].trim();
    return `the ${inner.toLowerCase()}`;
  }
  if (/^(the|a|an)\s+/i.test(trimmed)) return trimmed.toLowerCase();
  return trimmed;
}

function humanizeFallbackRoleTag(rawRole?: string): string {
  if (!rawRole) return "Signature";
  const withoutParens = rawRole.replace(/\s*\([^)]*\)/g, "").trim();
  const firstSegment = withoutParens.split(/\s*[&/–—-]\s*/)[0]?.trim() || withoutParens;
  const words = firstSegment.split(/\s+/);
  return words.slice(0, 2).join(" ") || "Signature";
}

/**
 * Generates 4 personality-authentic, scene-aware fallback choices when an LLM endpoint is offline or falls back.
 */
export function buildPersonalityFallbackChoices(params: {
  personality?: string;
  personalityTraits?: string[];
  playerRole?: string;
  playerRace?: string;
  activeSpeaker?: string;
  location?: string;
  isProtagonistAlone?: boolean;
  storyId?: string;
  genre?: string;
  narrativeText?: string;
}): string[] {
  const profile = getPersonaVoiceProfile(params.personality, params.personalityTraits);
  const fullSpeaker = params.activeSpeaker || "her";
  const speaker = fullSpeaker === "Narrator" ? "her" : fullSpeaker.trim().split(/\s+/)[0] || fullSpeaker;
  const loc = humanizeFallbackLocation(params.location);
  const roleTag = humanizeFallbackRoleTag(params.playerRole);
  const rolePhrase = (params.playerRole || "specialist").replace(/\s*\([^)]*\)/g, "").toLowerCase();
  const lower = profile.personaTitle.toLowerCase();
  const traitTag = profile.traitsList[0] || "Composed";

  const combinedContext = `${params.storyId || ""} ${params.genre || ""} ${params.location || ""} ${params.playerRole || ""} ${params.narrativeText || ""}`.toLowerCase();
  const isPortSolarisOrSocial =
    combinedContext.includes("port-solaris") ||
    combinedContext.includes("stray anchor") ||
    combinedContext.includes("café") ||
    combinedContext.includes("cafe") ||
    combinedContext.includes("kitchen") ||
    combinedContext.includes("boardwalk") ||
    combinedContext.includes("cove") ||
    combinedContext.includes("beach") ||
    combinedContext.includes("culinary") ||
    combinedContext.includes("chef") ||
    combinedContext.includes("barista") ||
    combinedContext.includes("resort") ||
    combinedContext.includes("slice-of-life") ||
    combinedContext.includes("rom-com");

  const isCulinaryScene =
    combinedContext.includes("kitchen") ||
    combinedContext.includes("café") ||
    combinedContext.includes("cafe") ||
    combinedContext.includes("chef") ||
    combinedContext.includes("culinary") ||
    combinedContext.includes("pan") ||
    combinedContext.includes("butter") ||
    combinedContext.includes("plate");

  const [nextLoc1, nextLoc2] = resolveDefaultNextLocations(params.location || "", params.storyId, params.playerRole);

  if (isPortSolarisOrSocial && !params.isProtagonistAlone) {
    if (isCulinaryScene) {
      return [
        `[${traitTag}/Resolve]: 'Take the bite and make your official call, ${speaker}—let's see if my kitchen passes your inspection.' Slide the warm plate directly in front of ${speaker} to advance the audit.`,
        `[Charisma/Deepen]: 'Set the clipboard down for two minutes, ${speaker}, and tell me when you last ate something that wasn't off a banquet menu.' Pull up a stool across the prep island and study her expression.`,
        `[${roleTag}/Wager]: 'Let's make it interesting: if you finish that plate, you hold the eviction notice and see how the house runs firsthand.' Tap the counter beside ${speaker}'s hand.`,
        `[Move/Transition]: 'Now that the tasting is settled, walk with me out to ${nextLoc1} and see the rest of the place in action.' Motion for ${speaker} to follow you out of ${loc}.`,
      ];
    }
    return [
      `[${traitTag}/Resolve]: 'Let's put our terms on the table, ${speaker}, and settle where we stand right now.' Step up to ${speaker} for a clear decision.`,
      `[Charisma/Deepen]: 'Drop the rehearsed speech for a minute, ${speaker}—what made you take this assignment in the first place?' Lean against the railing in ${loc} and hold her gaze.`,
      `[${roleTag}/Wager]: 'Care to put that confidence to the test with a formal Article 9 wager?' Challenge ${speaker} with smooth ${rolePhrase} poise.`,
      `[Move/Transition]: 'Come on—walk with me over to ${nextLoc1} so we can see how this plays out firsthand.' Gesture for ${speaker} to join you as you head out of ${loc}.`,
    ];
  }

  if (params.isProtagonistAlone) {
    if (lower.includes("trickster") || lower.includes("sly")) {
      return [
        `[Trickster/Audacious]: 'Well, nobody rolled out a red carpet.' Slip across ${loc} with a quiet grin.`,
        `[Cunning/Recon]: Survey the layout and spot any hidden leverage or details left behind.`,
        `[Observant/Playful]: Inspect the most intriguing corner of ${loc} for anything out of place.`,
        `[${roleTag}/Feat]: Rely on your ${rolePhrase} instincts to claim the best vantage point in ${loc}.`,
      ];
    }
    if (lower.includes("noble") || lower.includes("protector")) {
      return [
        `[Noble/Vigilant]: 'Whatever waits in ${loc}, I'll meet it head-on.' Step forward with steady composure.`,
        `[Protective/Survey]: Take in the surroundings of ${loc} and check for anyone who needs a hand.`,
        `[Honorable/Resolve]: Square your shoulders and prepare for whatever comes next in ${loc}.`,
        `[${roleTag}/Feat]: Draw upon your ${rolePhrase} training to stay ready in ${loc}.`,
      ];
    }
    if (lower.includes("cynic") || lower.includes("outlaw")) {
      return [
        `[Cynical/Streetwise]: 'Quiet places like ${loc} always hide an angle.' Scan the room before making your move.`,
        `[Outlaw/Tactical]: Check the exits first and read the room before touching anything.`,
        `[Skeptical/Probe]: Inspect the nearest counter or doorway in ${loc} to see what's really going on.`,
        `[${roleTag}/Feat]: Use your ${rolePhrase} instincts to size up ${loc}.`,
      ];
    }
    if (lower.includes("scholar")) {
      return [
        `[Scholar/Analytical]: 'Nothing about ${loc} is accidental.' Trace the subtle details toward their source.`,
        `[Inquisitive/Detail]: Examine the immediate surroundings in ${loc} for telling clues.`,
        `[Observant/Methodical]: Take a measured moment to read the atmosphere of ${loc}.`,
        `[${roleTag}/Feat]: Apply your ${rolePhrase} focus to piece together the situation in ${loc}.`,
      ];
    }
    if (lower.includes("daredevil")) {
      return [
        `[Daredevil/Bold]: 'No point waiting around!' Step right into the center of ${loc} and claim the moment.`,
        `[Fierce/Momentum]: Move briskly through ${loc} to see what happens next.`,
        `[Defiant/Spark]: Test the atmosphere in ${loc} with bold, unapologetic energy.`,
        `[${roleTag}/Feat]: Channel your ${rolePhrase} drive to set the pace in ${loc}.`,
      ];
    }
    return [
      `[${traitTag}/Composed]: 'Let's see what we're working with.' Step methodically into ${loc} and take stock of the room.`,
      `[Observant/Survey]: Scan the details of ${loc} for anything that stands out.`,
      `[Pragmatic/Focus]: Position yourself cleanly in ${loc} and prepare your next move.`,
      `[${roleTag}/Execution]: Put your ${rolePhrase} discipline to work in ${loc}.`,
    ];
  }

  // When accompanied by a companion / heroine
  if (lower.includes("trickster") || lower.includes("sly")) {
    return [
      `[Trickster/Resolve]: 'Fun as this banter is, ${speaker}, let's seal the deal right now.' Offer a decisive wager to settle the point.`,
      `[Move/Transition]: 'Come on, ${speaker}—the real action is waiting over in ${nextLoc1}.' Flash a knowing smirk and lead the way out of ${loc}.`,
      `[Charming/Escalation]: 'Care to put your pride on the line and test that claim firsthand?' Step up and turn the standoff into a direct challenge.`,
      `[${roleTag}/Pivot]: Use your ${rolePhrase} finesse to wrap up the task in ${loc} and move toward ${nextLoc2}.`,
    ];
  }

  if (lower.includes("noble") || lower.includes("protector")) {
    return [
      `[Noble/Resolve]: 'You have my word, ${speaker}—we settle this matter right now and move forward together.' Extend your hand to seal the agreement.`,
      `[Move/Transition]: 'We've lingered in ${loc} long enough. Walk with me to ${nextLoc1}.' Step toward the exit and motion for ${speaker} to join you.`,
      `[Valiant/Escalation]: 'Let's face the real test head-on instead of trading words here.' Take point and initiate the next trial.`,
      `[${roleTag}/Pivot]: Apply your ${rolePhrase} training to complete the immediate objective and open the path to ${nextLoc2}.`,
    ];
  }

  if (lower.includes("cynic") || lower.includes("outlaw")) {
    return [
      `[Cynical/Resolve]: 'Cut the script, ${speaker}—name your final terms so we can finish this and move.' Press her for a definitive agreement.`,
      `[Move/Transition]: 'Standing around in ${loc} is a waste of daylight. Let's head to ${nextLoc1}.' Turn toward the exit and beckon ${speaker} along.`,
      `[Outlaw/Escalation]: 'Words are cheap. Let's put real stakes on the table right now.' Force a decisive test of leverage in ${loc}.`,
      `[${roleTag}/Pivot]: Use your ${rolePhrase} instincts to secure what you came for and shift operations toward ${nextLoc2}.`,
    ];
  }

  if (lower.includes("scholar")) {
    return [
      `[Scholar/Resolve]: 'The conclusion is obvious, ${speaker}—let's finalize our arrangement and act on it.' Present the decisive solution to close the debate.`,
      `[Move/Transition]: 'Our next lead isn't in ${loc}. Come with me to ${nextLoc1} so we can verify it firsthand.' Head toward the doorway with ${speaker}.`,
      `[Analytical/Escalation]: 'Let's put your theory to an immediate practical test right now.' Initiate a direct demonstration in ${loc}.`,
      `[${roleTag}/Pivot]: Apply your ${rolePhrase} expertise to complete the analysis and transition toward ${nextLoc2}.`,
    ];
  }

  if (lower.includes("daredevil")) {
    return [
      `[Daredevil/Resolve]: 'Enough talk, ${speaker}—let's settle the score right here and now!' Step forward to force a final verdict.`,
      `[Move/Transition]: 'What are we waiting for? Let's take this energy out to ${nextLoc1}!' Grin and stride toward the exit with ${speaker}.`,
      `[Defiant/Escalation]: 'Double or nothing—let's see if you can keep up with me in a real test!' Trigger an immediate high-stakes challenge.`,
      `[${roleTag}/Pivot]: Unleash your ${rolePhrase} drive to finish the job in ${loc} and charge toward ${nextLoc2}.`,
    ];
  }

  // Default: Stoic Pragmatist / Custom Persona
  return [
    `[${traitTag}/Resolve]: 'Actions speak louder than debate, ${speaker}. Give me your final answer so we can move forward.' Lock eyes with ${speaker} to conclude the exchange.`,
    `[Move/Transition]: 'We're done in ${loc}. Follow me out to ${nextLoc1} for the next step.' Turn toward the doorway and lead ${speaker} onward.`,
    `[Composed/Escalation]: 'If you still have doubts, let's settle them with a direct test right now.' Put concrete stakes on the table in ${loc}.`,
    `[${roleTag}/Pivot]: Complete your ${rolePhrase} work in ${loc} and shift focus toward ${nextLoc2}.`,
  ];
}

/**
 * Analyzes a choice text vector and returns the primary category tag to increment behavioral metrics.
 */
export function analyzeChoiceVector(choiceText: string): string {
  if (!choiceText || typeof choiceText !== "string") return "pragmatic";
  const lower = choiceText.toLowerCase();

  const match = lower.match(/^\[([a-z0-9_\-\s]+)\/([a-z0-9_\-\s]+)\]/);
  const tagContent = match ? `${match[1]} ${match[2]}` : lower.slice(0, 30);

  if (
    tagContent.includes("combat") ||
    tagContent.includes("aggressive") ||
    tagContent.includes("strike") ||
    tagContent.includes("lunge") ||
    tagContent.includes("blade") ||
    tagContent.includes("fierce")
  ) {
    return "combat";
  }
  if (
    tagContent.includes("cynic") ||
    tagContent.includes("outlaw") ||
    tagContent.includes("rogue") ||
    tagContent.includes("stealth") ||
    tagContent.includes("subterfuge") ||
    tagContent.includes("trickster") ||
    tagContent.includes("deceptive")
  ) {
    return "subterfuge";
  }
  if (
    tagContent.includes("arcana") ||
    tagContent.includes("scholar") ||
    tagContent.includes("analytic") ||
    tagContent.includes("survey") ||
    tagContent.includes("inquisitive") ||
    tagContent.includes("observant")
  ) {
    return "analytical";
  }
  if (
    tagContent.includes("empath") ||
    tagContent.includes("gentle") ||
    tagContent.includes("protect") ||
    tagContent.includes("noble") ||
    tagContent.includes("valiant") ||
    tagContent.includes("honorable")
  ) {
    return "empathetic";
  }
  if (
    tagContent.includes("diplomat") ||
    tagContent.includes("inquire") ||
    tagContent.includes("pact") ||
    tagContent.includes("bargain") ||
    tagContent.includes("charm") ||
    tagContent.includes("banter")
  ) {
    return "diplomatic";
  }
  if (
    tagContent.includes("defiant") ||
    tagContent.includes("bold") ||
    tagContent.includes("dare") ||
    tagContent.includes("challenge") ||
    tagContent.includes("taunt")
  ) {
    return "defiant";
  }
  if (
    tagContent.includes("lupine") ||
    tagContent.includes("beast") ||
    tagContent.includes("scent") ||
    tagContent.includes("fang") ||
    tagContent.includes("instinct")
  ) {
    return "instinctive";
  }

  return "pragmatic";
}

/**
 * Formats dominant behavioral tendencies for display in Character Sheet or HUD.
 */
export function getDominantTendencyLabel(tendencies?: Record<string, number>): string {
  if (!tendencies || Object.keys(tendencies).length === 0) return "Emergent";
  const entries = Object.entries(tendencies).filter(([_, count]) => count > 0);
  if (entries.length === 0) return "Emergent";

  entries.sort((a, b) => b[1] - a[1]);
  const topCategories = entries.slice(0, 2).map(([cat]) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  });

  return topCategories.join(" • ");
}
