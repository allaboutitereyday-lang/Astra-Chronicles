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
      : "Martial prowess";

  const companionClause = ctx.isProtagonistAlone
    ? `The protagonist is PHYSICALLY ALONE in ${ctx.location}. Never address or converse with absent companions.`
    : `Accompanied by: ${ctx.presentHeroineNames.join(", ")}. Choices should include spoken dialogue in single quotes ('...') addressed to ${ctx.activeSpeaker} that sounds unmistakably like a "${personaName}".`;

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
- Example Persona Voice Reference:
  * ${voiceProfile.exampleSpokenLines[0]}
  * ${voiceProfile.exampleSpokenLines[1]}
${dominantTendency ? `- Emergent Behavioral Alignment: [${dominantTendency} TENDENCY]\n` : ""}- Class & Lineage: ${ctx.playerRole} | ${ctx.playerRace || "Human"} (${raceAnatomy})
- Active Stance & Arts: [${(ctx.activeStance || "Neutral").toUpperCase()} Stance | ${abilitiesSnippet}]
- Scene Context: ${companionClause}

CRITICAL PERSONALITY ALIGNMENT RULES FOR ALL 4 CHOICES:
1. DO NOT generate generic, personality-neutral RPG options! Every single choice MUST sound like it was spoken and performed by a "${personaName}" with traits [${traits}].
2. INCLUDE SPOKEN DIALOGUE IN SINGLE QUOTES ('...'): Whenever ${ctx.playerName} speaks in a choice, write their actual spoken line in single quotes ('...') using the vocabulary, attitude, and emotional temperature of "${personaName}" (${traits})—never generic filler!
3. ADVANCE THE SCENE: Every choice must both express ${ctx.playerName}'s "${personaName}" personality AND push the plot/physical action forward in ${ctx.location}:

   - CHOICE 1 [${tag1}] (Signature "${personaName}" Dialogue & Decisive Progression):
     Lead with a signature "${personaName}" spoken line ('...') and physical move that advances the scene or shifts the confrontation in ${ctx.location}.
   - CHOICE 2 [${tag2}] (Persona-Filtered Tactical / Environmental Action):
     Engage the immediate threat, obstacle, or surroundings in ${ctx.location} in the distinct style of a "${personaName}" (${traits[0] || "Focused"}).
   - CHOICE 3 [${tag3}] (Persona-Driven Interpersonal Escalation with ${ctx.isProtagonistAlone ? "the Environment" : ctx.activeSpeaker}):
     ${ctx.isProtagonistAlone ? `Reflect ${ctx.playerName}'s "${personaName}" inner drive while investigating a critical clue or threshold.` : `Respond directly to ${ctx.activeSpeaker}'s words/mood using ${ctx.playerName}'s "${personaName}" interpersonal style (e.g., ${voiceProfile.speechCadence.split(".")[0]}), pushing the conversation to a decisive turn.`}
   - CHOICE 4 [${ctx.playerRace && ctx.playerRace !== "Human" ? `${ctx.playerRace.split("/")[0].trim()}/Feat` : tag4}] (Lineage Anatomy / Class Ability with "${personaName}" Flair):
     Unleash ${ctx.playerName}'s ${raceAnatomy} or ${ctx.playerRole} abilities (${abilitiesSnippet}) while maintaining their "${personaName}" attitude.

FORMAT REQUIREMENTS:
- Every choice MUST strictly follow: "[Tone/Action]: 'Spoken dialogue in persona voice' + concrete physical action" (or pure physical action + inner thought if silent/alone).
- Exactly 4 options inside the JSON array ("suggested_choices" or "opening_choices" or "choices") with zero Markdown asterisks.`;
}

/**
 * Generates 4 personality-authentic fallback choices when an LLM endpoint is offline or falls back.
 */
export function buildPersonalityFallbackChoices(params: {
  personality?: string;
  personalityTraits?: string[];
  playerRole?: string;
  playerRace?: string;
  activeSpeaker?: string;
  location?: string;
  isProtagonistAlone?: boolean;
}): string[] {
  const profile = getPersonaVoiceProfile(params.personality, params.personalityTraits);
  const speaker = params.activeSpeaker || "them";
  const loc = params.location || "this sector";
  const role = params.playerRole || "Adventurer";
  const lower = profile.personaTitle.toLowerCase();

  if (params.isProtagonistAlone) {
    if (lower.includes("trickster") || lower.includes("sly")) {
      return [
        `[Trickster/Audacious]: 'Well, nobody rolled out a red carpet.' Slip past the perimeter of ${loc} with a silent grin.`,
        `[Cunning/Recon]: Test the shadows and disarm any hidden tripwires left along the approach.`,
        `[Observant/Playful]: Inspect the most suspicious threshold in ${loc} for concealed loot or leverage.`,
        `[${role}/Feat]: Channel your ${role} instincts to vault onto a higher vantage point.`,
      ];
    }
    if (lower.includes("noble") || lower.includes("protector")) {
      return [
        `[Noble/Vigilant]: 'If danger lurks in ${loc}, I'll meet it head-on.' Advance steadily down the main passage.`,
        `[Protective/Survey]: Search the surroundings for any survivors or signs of a recent struggle.`,
        `[Honorable/Resolve]: Ready your weapon openly and secure the forward threshold.`,
        `[${role}/Feat]: Call upon your ${role} training to fortify your stance against unseen threats.`,
      ];
    }
    if (lower.includes("cynic") || lower.includes("outlaw")) {
      return [
        `[Cynical/Streetwise]: 'Quiet places like ${loc} always hide a payday or an ambush.' Stick to cover and advance.`,
        `[Outlaw/Tactical]: Check the exits first and mark an escape route before touching anything.`,
        `[Skeptical/Probe]: Pry open the nearest sealed access point to see what the locals are hiding.`,
        `[${role}/Feat]: Use your ${role} skills to sweep ${loc} from the blind spots.`,
      ];
    }
    if (lower.includes("scholar")) {
      return [
        `[Scholar/Analytical]: 'The structural resonance in ${loc} is deliberate.' Trace the anomaly toward its source.`,
        `[Inquisitive/Lore]: Examine the inscriptions and ambient residue for clues to this sector's history.`,
        `[Observant/Methodical]: Test the environmental stability before stepping across the threshold.`,
        `[${role}/Feat]: Attune your ${role} senses to decode the hidden patterns in ${loc}.`,
      ];
    }
    if (lower.includes("daredevil")) {
      return [
        `[Daredevil/Bold]: 'No point waiting around in the dark!' Kick open the forward path in ${loc} and press ahead.`,
        `[Fierce/Momentum]: Sprint up to the highest vantage in ${loc} to draw out whatever is hiding.`,
        `[Defiant/Challenge]: Strike your weapon against the stone to test the echoes and claim the ground.`,
        `[${role}/Feat]: Unleash a burst of ${role} power to clear the obstacle ahead.`,
      ];
    }
    return [
      `[Stoic/Calculated]: 'Clear the sector first.' Advance methodically toward the next threshold in ${loc}.`,
      `[Vigilant/Recon]: Sweep the blind corners of ${loc} for traps, wards, or ambush vectors.`,
      `[Pragmatic/Tactical]: Secure high ground and assess the fastest route forward.`,
      `[${role}/Feat]: Engage your ${role} capabilities to bypass the obstruction in ${loc}.`,
    ];
  }

  // When accompanied by a companion / heroine
  if (lower.includes("trickster") || lower.includes("sly")) {
    return [
      `[Trickster/Banter]: 'You always know how to pick the liveliest spots, don't you?' Flash ${speaker} a knowing smirk and motion toward the forward path.`,
      `[Charming/Gambit]: 'Care to make a wager on what's waiting past that door?' Step alongside ${speaker} and ready a clever feint.`,
      `[Deceptive/Cunning]: 'Keep their eyes on you for three seconds—I've got an angle.' Slip toward the flank in ${loc}.`,
      `[${role}/Flair]: Show off your ${role} finesse to turn the situation in ${loc} to your advantage.`,
    ];
  }

  if (lower.includes("noble") || lower.includes("protector")) {
    return [
      `[Noble/Protective]: 'Stay close to me—we face whatever lies ahead in ${loc} together.' Step slightly in front of ${speaker} to take point.`,
      `[Honorable/Earnest]: 'You have my word I won't let this fall apart. Tell me what you need most right now.' Meet ${speaker}'s gaze steadily.`,
      `[Valiant/Advance]: 'We cannot leave this unresolved.' Lead the way toward the heart of the disturbance in ${loc}.`,
      `[${role}/Guardian]: Channel your ${role} strength to shield ${speaker} and secure the path forward.`,
    ];
  }

  if (lower.includes("cynic") || lower.includes("outlaw")) {
    return [
      `[Cynical/Deadpan]: 'Let me guess—that was the easy part?' Shoot ${speaker} a dry look and check the exit out of ${loc}.`,
      `[Outlaw/Leverage]: 'Before we go any further, tell me what's actually in this for us.' Press ${speaker} for the real stakes.`,
      `[Pragmatic/Cutthroat]: 'Talking won't clear this sector. Let's hit them before they organize.' Move toward the vantage point.`,
      `[${role}/Opportunist]: Use your ${role} edge to seize control of the situation in ${loc}.`,
    ];
  }

  if (lower.includes("scholar")) {
    return [
      `[Scholar/Analytical]: 'Notice the pattern here—nothing about this setup in ${loc} is accidental.' Share your deduction with ${speaker}.`,
      `[Inquisitive/Probe]: 'There's a crucial detail you haven't mentioned yet. Walk me through the exact sequence.' Observe ${speaker} closely.`,
      `[Methodical/Strategy]: 'If we time our move with the ambient shift, we bypass their defense entirely.' Point out the route ahead.`,
      `[${role}/Precision]: Apply your ${role} expertise to unravel the obstacle standing before you and ${speaker}.`,
    ];
  }

  if (lower.includes("daredevil")) {
    return [
      `[Daredevil/Bold]: 'Now things are finally getting interesting! Ready to break through, ${speaker}?' Grin and surge toward the front.`,
      `[Defiant/Fierce]: 'Let them come—we'll carve our own way out of ${loc}!' Draw your weapon and challenge the threat head-on.`,
      `[Passionate/Direct]: 'No holding back between us! Tell me where to strike and consider it done!' Catch ${speaker}'s eyes with fiery intensity.`,
      `[${role}/Overdrive]: Unleash your ${role} power at full throttle to blitz the path ahead.`,
    ];
  }

  // Default: Stoic Pragmatist / Custom Persona
  const traitTag = profile.traitsList[0] || "Stoic";
  return [
    `[${traitTag}/Direct]: 'We're losing time. Follow my lead through the next threshold.' Motion for ${speaker} to advance through ${loc}.`,
    `[Pragmatic/Tactical]: 'Give me the short version—what's our primary threat ahead?' Keep your eyes scanning ${loc} while addressing ${speaker}.`,
    `[Vigilant/Position]: Shift to cover the exposed flank in ${loc} and prepare a decisive counter-move.`,
    `[${role}/Execution]: Deploy your ${role} discipline to secure the objective alongside ${speaker}.`,
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
