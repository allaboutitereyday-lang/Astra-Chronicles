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
}

/**
 * Builds the authoritative Dynamic Choice Authoring Directive for LLM prompts.
 * Guarantees that all 4 generated dialogue/action options sound unmistakably like the player's chosen personality.
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

  const companionClause = ctx.isProtagonistAlone
    ? `The protagonist is PHYSICALLY ALONE in ${cleanLocation}. Never address or converse with absent companions.`
    : `Accompanied by: ${ctx.presentHeroineNames.join(", ")}. Choices should include spoken dialogue in single quotes ('...') addressed to ${speakerFirstName} (use her first name "${speakerFirstName}" only—never repeat her full name) that sounds unmistakably like a "${personaName}".`;

  const [tag1, tag2, tag3, tag4] = voiceProfile.preferredTagPrefixes;
  const originLabel = ctx.worldOrigin || "Born & Raised (Native)";

  return `--- DYNAMIC 4-CHOICE PERSONALITY & VOICE ALIGNMENT DIRECTIVE (MANDATORY) ---
The player explicitly designed ${ctx.playerName}'s personality and world origin in Character Creation. ALL 4 dialogue & action choices MUST be written in ${ctx.playerName}'s chosen persona voice and reflect their world origin:
- Protagonist Demographics: Gender: ${ctx.playerGender || "Male"} | Age: ${ctx.playerAge || "22"}
- World Origin & System Familiarity: ${originLabel}${ctx.worldOriginDetails ? ` (${ctx.worldOriginDetails})` : ""}
- Chosen Personality Archetype: "${personaName}"
- Core Personality Traits: [${traits}]
- Speech Cadence & Vocal Tone: ${voiceProfile.speechCadence}
- Worldview & Demeanor: ${voiceProfile.attitudeAndWorldview}
${dominantTendency ? `- Emergent Behavioral Alignment: [${dominantTendency} TENDENCY]\n` : ""}- Class & Lineage: ${cleanRole} | ${ctx.playerRace || "Human"} (${raceAnatomy})
- Active Stance & Arts: [${(ctx.activeStance || "Neutral").toUpperCase()} Stance | ${abilitiesSnippet}]
- Scene Context: ${companionClause}

CRITICAL PERSONALITY & SCENE ALIGNMENT RULES FOR ALL 4 CHOICES:
1. DO NOT generate generic, personality-neutral RPG options, and NEVER use out-of-place military/dungeon commands ("primary threat ahead", "cover the exposed flank", "advance through the next threshold") in non-combat social, romantic, or culinary scenes!
2. DIRECT SCENE REACTION: Every single choice MUST directly respond to what ${speakerFirstName} just said or did right now in ${cleanLocation}, written in the exact voice of a "${personaName}" with traits [${traits}].
3. INCLUDE SPOKEN DIALOGUE IN SINGLE QUOTES ('...'): Whenever ${ctx.playerName} speaks in a choice, write their actual spoken line in single quotes ('...') using the vocabulary, attitude, and emotional temperature of "${personaName}" (${traits}). Do NOT escape apostrophes with a backslash (\') inside JSON strings; write normal apostrophes ('Don't', 'We're').
4. USE FIRST NAMES & NATURAL PROSE ONLY: Refer to ${ctx.activeSpeaker} simply as "${speakerFirstName}" and refer to ${ctx.location} naturally as "${cleanLocation}". Never paste full character names or parenthetical UI location/class labels into choices!

   - CHOICE 1 [${tag1}] (Signature "${personaName}" Dialogue & Decisive Scene Progression):
     Lead with a signature "${personaName}" spoken line ('...') and concrete physical move that directly advances the current moment with ${speakerFirstName} in ${cleanLocation}.
   - CHOICE 2 [${tag2}] (Persona-Filtered Hands-On / Environmental Action):
     Engage the immediate props, craft, surroundings, or tension in ${cleanLocation} in the distinct style of a "${personaName}" (${traits[0] || "Focused"}).
   - CHOICE 3 [${tag3}] (Persona-Driven Interpersonal Escalation with ${ctx.isProtagonistAlone ? "the Environment" : speakerFirstName}):
     ${ctx.isProtagonistAlone ? `Reflect ${ctx.playerName}'s "${personaName}" inner drive while investigating a critical clue or detail.` : `Respond directly to ${speakerFirstName}'s reaction, unspoken tension, or words using ${ctx.playerName}'s "${personaName}" interpersonal style, pushing the dynamic between them to a decisive turn.`}
   - CHOICE 4 [${ctx.playerRace && ctx.playerRace !== "Human" ? `${ctx.playerRace.split("/")[0].trim()}/Feat` : tag4}] (Signature Craft / Ability with "${personaName}" Flair):
     Demonstrate ${ctx.playerName}'s ${cleanRole} mastery (${abilitiesSnippet}) or physical presence while maintaining their "${personaName}" attitude.

FORMAT REQUIREMENTS:
- Every choice MUST strictly follow: "[Tone/Action]: 'Spoken dialogue in persona voice' + concrete physical action" (or pure physical action + inner thought if silent/alone).
- Keep bracket tags concise (2-3 words max, e.g. "[${tag1}]:").
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

  if (isPortSolarisOrSocial && !params.isProtagonistAlone) {
    if (isCulinaryScene) {
      return [
        `[${traitTag}/Challenge]: 'Go ahead and taste it before you reach for that pen—unless you're afraid it'll ruin your verdict.' Slide the warm plate across the counter toward ${speaker} and hold her gaze.`,
        `[Charisma/Tease]: 'Your clipboard says audit, ${speaker}, but the way you've been watching the pan says otherwise.' Lean calmly against the prep island and give her a slow, knowing half-smile.`,
        `[Observant/Close]: 'You haven't taken a real breath since the butter hit the steel. Sit down for two minutes and eat while it's hot.' Set a fork beside ${speaker}'s hand in ${loc}.`,
        `[${roleTag}/Flair]: Finish plating with effortless ${rolePhrase} precision, letting the aroma fill ${loc} while waiting for ${speaker}'s honest reaction.`,
      ];
    }
    return [
      `[${traitTag}/Direct]: 'If you're going to judge how I run this place, ${speaker}, at least step closer and see it firsthand.' Hold ${speaker}'s gaze with unhurried confidence in ${loc}.`,
      `[Charisma/Banter]: 'Careful, ${speaker}—keep looking at me like that and people might think we're actually getting along.' Offer a teasing smirk while closing the distance by half a step.`,
      `[Perceptive/Read]: 'Drop the rehearsed speech for a second and tell me what's really on your mind.' Study the subtle shift in ${speaker}'s expression in ${loc}.`,
      `[${roleTag}/Panache]: Turn the moment in ${loc} to your advantage with smooth ${rolePhrase} poise alongside ${speaker}.`,
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
      `[Trickster/Banter]: 'You always know how to keep things interesting, ${speaker}.' Flash her a knowing smirk in ${loc}.`,
      `[Charming/Gambit]: 'Care to make a little wager on how this plays out?' Step closer to ${speaker} with playful confidence.`,
      `[Observant/Tease]: 'Don't look away now—you were just about to admit I had a point.' Catch ${speaker}'s eye.`,
      `[${roleTag}/Flair]: Show off your ${rolePhrase} finesse in ${loc} to draw a reaction from ${speaker}.`,
    ];
  }

  if (lower.includes("noble") || lower.includes("protector")) {
    return [
      `[Noble/Protective]: 'Stay with me, ${speaker}—we handle whatever comes next together.' Step closer to her side in ${loc}.`,
      `[Honorable/Earnest]: 'You have my word I won't let this fall apart. Tell me what matters most to you here.' Meet ${speaker}'s gaze steadily.`,
      `[Valiant/Resolve]: 'Let's settle this properly.' Take the lead alongside ${speaker} in ${loc}.`,
      `[${roleTag}/Steadfast]: Use your ${rolePhrase} poise to back ${speaker} up without hesitation.`,
    ];
  }

  if (lower.includes("cynic") || lower.includes("outlaw")) {
    return [
      `[Cynical/Deadpan]: 'Let me guess, ${speaker}—that was supposed to intimidate me?' Shoot her a dry look in ${loc}.`,
      `[Outlaw/Leverage]: 'Cut the script and tell me what's actually on the line for you here.' Press ${speaker} for the real story.`,
      `[Pragmatic/Direct]: 'We both know posturing won't settle this. Let's get straight to the point.' Hold your ground before ${speaker}.`,
      `[${roleTag}/Edge]: Use your ${rolePhrase} instincts to flip the dynamic in ${loc}.`,
    ];
  }

  if (lower.includes("scholar")) {
    return [
      `[Scholar/Analytical]: 'Your reaction just gave away more than your words did, ${speaker}.' Share your observation with quiet composure.`,
      `[Inquisitive/Probe]: 'There's a detail you're holding back. Walk me through what you're really testing here.' Watch ${speaker} closely.`,
      `[Perceptive/Calm]: 'If we look past the surface tension, the real answer in ${loc} is obvious.' Meet ${speaker}'s eyes.`,
      `[${roleTag}/Precision]: Demonstrate your ${rolePhrase} mastery right in front of ${speaker}.`,
    ];
  }

  if (lower.includes("daredevil")) {
    return [
      `[Daredevil/Bold]: 'Now things are finally getting interesting! Ready to see what I can really do, ${speaker}?' Grin and step forward.`,
      `[Defiant/Spark]: 'If you think I'm backing down from a challenge in ${loc}, you don't know me at all!' Hold ${speaker}'s gaze with fiery confidence.`,
      `[Passionate/Direct]: 'No holding back between us, ${speaker}—give me your honest verdict right now!' Lean in with electric intensity.`,
      `[${roleTag}/Overdrive]: Unleash your ${rolePhrase} flair at full throttle to leave ${speaker} speechless.`,
    ];
  }

  // Default: Stoic Pragmatist / Custom Persona
  return [
    `[${traitTag}/Direct]: 'Actions speak louder than threats, ${speaker}. Judge the result for yourself.' Hold ${speaker}'s gaze with calm authority in ${loc}.`,
    `[Composed/Challenge]: 'You didn't come into ${loc} just to recite a script. Tell me what you're really looking for.' Lean back slightly and study ${speaker}'s reaction.`,
    `[Perceptive/Close]: Notice the subtle crack in ${speaker}'s composed guard and step half a pace closer without breaking eye contact.`,
    `[${roleTag}/Mastery]: Let your effortless ${rolePhrase} execution in ${loc} speak for itself in front of ${speaker}.`,
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
