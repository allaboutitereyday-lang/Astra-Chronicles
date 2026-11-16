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
  height?: string;
  worldOrigin?: string;
  worldOriginDetails?: string;
  role?: string;
  race?: string;
}): string {
  const name = playerProfile?.name || "The Protagonist";
  const rawGender = (playerProfile?.gender || "Male").trim();
  const rawAge = (playerProfile?.age || "22").trim();
  const rawHeight = (playerProfile?.height || "5'11\"").trim();
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
- Age, Height & Physical Bearing: Age: ${rawAge} | Height: ${rawHeight} (Reflect ${name}'s ${rawHeight} stature, eye-level relative to companions, and physical presence naturally in descriptions, spatial choreography, and how NPCs perceive ${name}).
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

export type PlayerSpeechRegister =
  | "casual-conversational"
  | "playful-teasing"
  | "blunt-direct"
  | "warm-expressive"
  | "measured-natural";

export interface PlayerSpeakingStyleFingerprint {
  hasCustomSamples: boolean;
  sampleCount: number;
  recentPlayerQuotes: string[];
  recentPlayerActions: string[];
  cadenceSummary: string;
  register: PlayerSpeechRegister;
  usesContractions: boolean;
  usesColloquialisms: boolean;
  avgWordsPerQuote: number;
  promptDirectiveBlock: string;
}

const CONTRACTION_REGEX =
  /\b(?:i'm|i'll|i'd|i've|you're|you'll|you'd|you've|we're|we'll|we'd|we've|they're|they'll|it's|that's|what's|who's|there's|here's|don't|doesn't|didn't|won't|wouldn't|couldn't|shouldn't|can't|isn't|aren't|wasn't|weren't|haven't|hasn't|ain't|let's|gonna|wanna|gotta)\b/i;

const COLLOQUIAL_REGEX =
  /\b(?:yeah|nah|yep|nope|wait|hold on|hold up|hang on|seriously|okay|ok|alright|hey|look|listen|come on|c'mon|gonna|wanna|gotta|gotcha|deal|relax|chill|fair enough|no way|bet|man|dude|kinda|sorta|pretty sure|honestly|meanwhile|guess|huh|wow|man|oh|well|so)\b/i;

const PLAYFUL_TEASING_REGEX =
  /\b(?:haha|heh|smirk|wink|tease|teasing|flirt|cute|adorable|kidding|joking|bet|wager|trouble|miss me|impress|blush|smooth)\b|[!~]{1,}|;\)/i;

const BLUNT_DIRECT_REGEX =
  /\b(?:cut the|skip|straight|bottom line|spare me|shut|move|now|done|quit|enough|point|real quick)\b/i;

const WARM_EXPRESSIVE_REGEX =
  /\b(?:sorry|careful|promise|trust|worried|glad|thanks|thank|hey|are you okay|you good|hang in there|mean it|really|together)\b/i;

/**
 * Extracts and fingerprints the player's actual speaking style from recent conversation turns
 * and any current custom input so generated choices and protagonist dialogue mirror how the user talks.
 */
export function extractPlayerVoiceStyleFromHistory(
  recentHistory?: { speaker: string; text: string }[] | null,
  playerName?: string,
  currentAction?: string,
  isCustomAction?: boolean
): PlayerSpeakingStyleFingerprint {
  const cleanPlayerFull = (playerName || "Wanderer").trim().toLowerCase();
  const cleanPlayerFirst = cleanPlayerFull.split(/\s+/)[0] || cleanPlayerFull;

  const isPlayerSpeaker = (speaker?: string): boolean => {
    const s = (speaker || "").trim().toLowerCase();
    if (!s) return false;
    return (
      s === cleanPlayerFull ||
      s === cleanPlayerFirst ||
      s === "you" ||
      s === "player" ||
      s === "protagonist"
    );
  };

  const rawPlayerTexts: string[] = [];

  if (isCustomAction && typeof currentAction === "string" && currentAction.trim()) {
    const cleanedCurrent = currentAction
      .replace(/\(\s*OOC\s*:[^)]+\)/gi, "")
      .replace(/\[\s*OOC\s*:[^\]]+\]/gi, "")
      .trim();
    if (cleanedCurrent && !/^\[Continue the current scene/i.test(cleanedCurrent)) {
      rawPlayerTexts.push(cleanedCurrent);
    }
  }

  if (Array.isArray(recentHistory) && recentHistory.length > 0) {
    const playerTurns = recentHistory
      .filter((t) => t && isPlayerSpeaker(t.speaker) && typeof t.text === "string" && t.text.trim().length > 0)
      .slice(-6)
      .reverse();

    for (const turn of playerTurns) {
      const cleaned = turn.text
        .replace(/\(\s*OOC\s*:[^)]+\)/gi, "")
        .replace(/\[\s*OOC\s*:[^\]]+\]/gi, "")
        .replace(/^\[[^\]]+\](?::)?\s*/, "")
        .trim();
      if (cleaned && !cleaned.startsWith("[SYSTEM")) {
        rawPlayerTexts.push(cleaned);
      }
    }
  }

  const recentPlayerQuotes: string[] = [];
  const recentPlayerActions: string[] = [];

  for (const txt of rawPlayerTexts) {
    // Extract double-quoted speech first
    const doubleQuotes = Array.from(txt.matchAll(/"([^"\n]{3,200})"/g)).map((m) => m[1].trim());
    // Extract sentence-like single-quoted speech without mistaking apostrophes
    const singleQuotes = Array.from(
      txt.matchAll(/(?:^|[\s:(])'([^'\n]{4,180})'(?=$|[\s.,!?—-])/g)
    ).map((m) => m[1].trim());

    const foundQuotes = [...doubleQuotes, ...singleQuotes];
    for (const q of foundQuotes) {
      if (q && !recentPlayerQuotes.includes(q) && recentPlayerQuotes.length < 5) {
        recentPlayerQuotes.push(q);
      }
    }

    // If user typed raw conversational text without quotation marks (common in custom input)
    if (foundQuotes.length === 0) {
      const concise = txt.replace(/\s+/g, " ").trim();
      const firstSentence = concise.split(/(?<=[.!?])\s+/)[0] || concise;
      const clipped = firstSentence.length > 160 ? `${firstSentence.slice(0, 157)}...` : firstSentence;
      if (clipped && !recentPlayerActions.includes(clipped) && recentPlayerActions.length < 4) {
        recentPlayerActions.push(clipped);
      }
    } else {
      const conciseAction = txt.replace(/\s+/g, " ").trim();
      const clippedAction =
        conciseAction.length > 140 ? `${conciseAction.slice(0, 137)}...` : conciseAction;
      if (clippedAction && !recentPlayerActions.includes(clippedAction) && recentPlayerActions.length < 4) {
        recentPlayerActions.push(clippedAction);
      }
    }
  }

  const speechSamples = recentPlayerQuotes.length > 0 ? recentPlayerQuotes : recentPlayerActions;
  const sampleCount = speechSamples.length;
  const hasCustomSamples = Boolean(
    isCustomAction ||
      (Array.isArray(recentHistory) &&
        recentHistory.some(
          (t) =>
            isPlayerSpeaker(t?.speaker) &&
            typeof t?.text === "string" &&
            t.text.trim().length > 0
        ))
  );

  const combinedText = speechSamples.join(" ");
  const usesContractions = sampleCount === 0 ? true : CONTRACTION_REGEX.test(combinedText);
  const usesColloquialisms = sampleCount === 0 ? true : COLLOQUIAL_REGEX.test(combinedText);

  const wordCounts = speechSamples.map((s) => s.split(/\s+/).filter(Boolean).length);
  const avgWordsPerQuote =
    wordCounts.length > 0
      ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
      : 10;

  let register: PlayerSpeechRegister = "casual-conversational";
  if (sampleCount > 0) {
    if (PLAYFUL_TEASING_REGEX.test(combinedText)) {
      register = "playful-teasing";
    } else if (BLUNT_DIRECT_REGEX.test(combinedText) || avgWordsPerQuote <= 8) {
      register = "blunt-direct";
    } else if (WARM_EXPRESSIVE_REGEX.test(combinedText)) {
      register = "warm-expressive";
    } else if (usesContractions || usesColloquialisms) {
      register = "casual-conversational";
    } else {
      register = "measured-natural";
    }
  }

  const registerDescriptions: Record<PlayerSpeechRegister, string> = {
    "casual-conversational":
      "relaxed, everyday conversational rhythm with natural contractions, casual hooks ('Wait—', 'Look,', 'Alright,'), and zero stiffness",
    "playful-teasing":
      "quick, teasing, conversational banter with easy warmth, playful rhythm, and relaxed contractions",
    "blunt-direct":
      "short, punchy, straight-to-the-point spoken lines with plain everyday words and zero fluff",
    "warm-expressive":
      "sincere, approachable, human warmth that talks to people like a real person rather than giving speeches",
    "measured-natural":
      "calm and articulate yet genuinely conversational—using contractions and plain spoken syntax instead of stiff formality",
  };

  const cadenceSummary =
    sampleCount > 0
      ? `Observed ${sampleCount} recent protagonist utterance(s): ~${avgWordsPerQuote} words per beat, register "${register}" (${registerDescriptions[register]}), contractions=${usesContractions ? "yes" : "light"}, casual markers=${usesColloquialisms ? "yes" : "light"}.`
      : `Turn 1 baseline: ${registerDescriptions[register]} (5–14 words per spoken quote, contractions mandatory, zero Victorian/courtroom phrasing).`;

  const promptDirectiveBlock =
    sampleCount > 0
      ? `=== LIVE PLAYER SPEAKING STYLE & CONVERSATIONAL MIRRORING (MANDATORY) ===
- Detected Live Voice Profile: ${cadenceSummary}
- Verbatim Recent Protagonist Speech / Input Samples (MIRROR THIS EXACT VOICE):
${speechSamples
  .slice(0, 4)
  .map((s, idx) => `  ${idx + 1}. "${s}"`)
  .join("\n")}
- CONVERSATIONAL ADAPTATION RULES:
  1. Match how the player actually talks above—mirror their sentence length (~${Math.max(5, Math.min(18, avgWordsPerQuote))} words), casualness, contractions ("I'm", "don't", "you're", "let's"), humor, and level of bluntness or warmth.
  2. NEVER "upgrade" or sanitize casual player speech into stiff, proper, formal, or theatrical RPG prose. If the player talks chill, teasing, blunt, or colloquial, the generated choices and expanded dialogue MUST keep that exact vibe.
  3. Natural spoken fragments ("Wait—seriously?", "Yeah, no chance.", "Hold on.", "Fair enough.") are ENCOURAGED inside spoken quotes.`
      : `=== CONVERSATIONAL HUMAN VOICE BASELINE (MANDATORY — ANTI-PROPERNESS RULE) ===
- No custom player speech samples yet—use a genuinely natural, modern conversational cadence suited to "${personaNameFallbackLabel(playerName)}".
- SPOKEN DIALOGUE MUST SOUND LIKE REAL EVERYDAY TALK:
  1. Always use natural spoken contractions ("I'm", "you're", "don't", "didn't", "won't", "let's", "that's", "what's").
  2. Use natural conversational openers and rhythms ("Wait—", "Look,", "Alright,", "Hey,", "Come on,", "Fair enough,", "Seriously?") and natural spoken fragments. Keep spoken lines punchy (5–15 words).
  3. STRICTLY FORBIDDEN STIFF PHRASING: NEVER make the protagonist talk like a Victorian butler, courtroom lawyer, or textbook narrator (e.g., NEVER write "State your terms plainly", "I shall comply", "Allow me to inquire", "Put your terms on the table", "We handle this on my terms—watch the perimeter", or "Let us proceed").`;

  return {
    hasCustomSamples,
    sampleCount,
    recentPlayerQuotes,
    recentPlayerActions,
    cadenceSummary,
    register,
    usesContractions,
    usesColloquialisms,
    avgWordsPerQuote,
    promptDirectiveBlock,
  };
}

function personaNameFallbackLabel(playerName?: string): string {
  const first = (playerName || "the protagonist").trim().split(/\s+/)[0];
  return first || "the protagonist";
}

function applyTraitsToPresetProfile(
  base: PersonaVoiceProfile,
  traits: string[],
  presetDefaults: string[]
): PersonaVoiceProfile {
  const defaultLower = new Set(presetDefaults.map((t) => t.toLowerCase()));
  const customTraits = traits.filter((t) => !defaultLower.has(t.toLowerCase()));
  const traitClause = ` Active Roleplay Traits: [${traits.join(", ")}]${
    customTraits.length > 0 ? ` (Emphasize custom trait focus: ${customTraits.join(", ")})` : ""
  }.`;

  const nextTags: [string, string, string, string] = [...base.preferredTagPrefixes];
  if (customTraits.length > 0) {
    const cleanFirst = customTraits[0].replace(/[^a-zA-Z0-9\s-]/g, "").trim().split(/\s+/).slice(0, 2).join(" ");
    if (cleanFirst) {
      nextTags[0] = `${cleanFirst}/Voice`;
    }
  }

  return {
    ...base,
    traitsList: traits,
    speechCadence: `${base.speechCadence}${traitClause}`,
    attitudeAndWorldview: `${base.attitudeAndWorldview}${traitClause}`,
    preferredTagPrefixes: nextTags,
  };
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
    return applyTraitsToPresetProfile(
      {
        personaTitle: rawName,
        traitsList: traits,
        speechCadence:
          "Warm, steady, grounded, and protective without sounding like a medieval herald. Uses natural contractions, plain earnest words, and firm everyday conviction.",
        attitudeAndWorldview:
          "Looks out for the people beside them, keeps their promises, and steps in front of trouble naturally without preachy speeches.",
        preferredTagPrefixes: ["Noble/Protective", "Valiant/Resolve", "Honorable/Direct", "Righteous/Stand"],
        exampleSpokenLines: [
          "'Hey, stay close to me. If this goes sideways, I'm taking the front.'",
          "'Hold on—nobody's throwing anyone under the bus while I'm here. Give me a second to fix this.'",
          "'I'm not leaving people behind just to make things easier. We handle it together.'",
        ],
      },
      traits,
      ["Honorable", "Protective", "Righteous", "Valiant"]
    );
  }

  if (lower.includes("cynic") || lower.includes("outlaw") || lower.includes("mercenary") || lower.includes("rogue")) {
    return applyTraitsToPresetProfile(
      {
        personaTitle: rawName,
        traitsList: traits,
        speechCadence:
          "Dry, street-smart, skeptical, and effortlessly casual. Uses deadpan humor, short conversational pushbacks, and natural contractions—never melodramatic.",
        attitudeAndWorldview:
          "Looks for the hidden catch, the exit route, and real leverage in every conversation. Cuts through spin with grounded realism.",
        preferredTagPrefixes: ["Cynical/Deadpan", "Outlaw/Leverage", "Skeptical/Sharp", "Pragmatic/Cutthroat"],
        exampleSpokenLines: [
          "'Yeah, that sounds great on paper—now tell me what the actual catch is.'",
          "'Relax, I'm not here for a lecture. Just tell me what this job pays and who's in our way.'",
          "'Funny how every time someone says \"trust me,\" there's a mess waiting on the other side.'",
        ],
      },
      traits,
      ["Cynical", "Deadpan Wit", "Opportunistic", "Self-Reliant"]
    );
  }

  if (lower.includes("scholar") || lower.includes("enigmatic") || lower.includes("intellectual") || lower.includes("arcane")) {
    return applyTraitsToPresetProfile(
      {
        personaTitle: rawName,
        traitsList: traits,
        speechCadence:
          "Sharp, observant, and quietly curious—talks like a clever detective or strategist having a real conversation, not reciting a textbook.",
        attitudeAndWorldview:
          "Spots what doesn't add up, asks pointed everyday questions, and connects hidden motives cleanly without sounding pedantic.",
        preferredTagPrefixes: ["Scholar/Analytical", "Inquisitive/Lore", "Observant/Deduction", "Arcane/Calculated"],
        exampleSpokenLines: [
          "'Wait a second—that reaction wasn't an accident. What aren't you telling me?'",
          "'Hold on, look at the pattern here. Somebody set this up way before we walked in.'",
          "'Yeah, charging in blind isn't gonna work. Give me ten seconds to figure out how this thing ticks.'",
        ],
      },
      traits,
      ["Analytical", "Inquisitive", "Arcane Focus", "Observant"]
    );
  }

  if (lower.includes("daredevil") || lower.includes("passionate") || lower.includes("hot-blooded") || lower.includes("reckless") || lower.includes("fierce")) {
    return applyTraitsToPresetProfile(
      {
        personaTitle: rawName,
        traitsList: traits,
        speechCadence:
          "Energetic, bold, grinning, and spontaneous. Talks fast with genuine hype, contractions, and punchy, natural momentum.",
        attitudeAndWorldview:
          "Dives straight into high-stakes moments with a fearless grin, backing up allies on instinct instead of overthinking.",
        preferredTagPrefixes: ["Daredevil/Bold", "Defiant/Charge", "Fierce/Grit", "Fearless/Escalation"],
        exampleSpokenLines: [
          "'Oh, come on—where's the fun in playing it safe? Let's see what you've actually got!'",
          "'Alright, I'm in! Back me up on three and let's make this count.'",
          "'Wait, seriously? Only three of 'em? Grab my hand—we're making this jump!'",
        ],
      },
      traits,
      ["Defiant", "Bold", "Hot-Blooded", "Fierce Loyalty"]
    );
  }

  if (lower.includes("trickster") || lower.includes("sly") || lower.includes("charming") || lower.includes("playful") || lower.includes("flirt")) {
    return applyTraitsToPresetProfile(
      {
        personaTitle: rawName,
        traitsList: traits,
        speechCadence:
          "Playful, teasing, quick-witted, and conversational. Uses easy banter, contractions, raised-eyebrow questions, and light confidence without sounding archaic.",
        attitudeAndWorldview:
          "Turns tense standoffs into a game of wit, keeping people off-balance with a crooked grin and casual misdirection.",
        preferredTagPrefixes: ["Trickster/Banter", "Charming/Audacious", "Deceptive/Feint", "Cunning/Playful"],
        exampleSpokenLines: [
          "'You're really gonna look me in the eye and pretend you didn't plan this whole thing?'",
          "'Tell you what—let's make this interesting. Loser buys the next round.'",
          "'Relax, I've got it covered. Just smile and look natural while I handle the lock.'",
        ],
      },
      traits,
      ["Charming", "Deceptive", "Bantering", "Unpredictable"]
    );
  }

  if (lower.includes("stoic") || lower.includes("pragmatist")) {
    return applyTraitsToPresetProfile(
      {
        personaTitle: rawName,
        traitsList: traits,
        speechCadence:
          "Calm, cool-headed, understated, and naturally direct—speaks like a grounded real person who doesn't waste words, using normal contractions and relaxed syntax rather than stiff robotic commands.",
        attitudeAndWorldview:
          "Reads the room calmly, focuses on what actually works, and stays unflappable without putting on stiff formal airs.",
        preferredTagPrefixes: ["Stoic/Calculated", "Pragmatic/Direct", "Vigilant/Tactical", "Unflinching/Cold"],
        exampleSpokenLines: [
          "'Alright, cut the spin—what do we actually need to do to get through this?'",
          "'I hear you, but let's stick to what works. You ready?'",
          "'Hold up. Two patrols ahead—let's wait for them to pass before we move.'",
        ],
      },
      traits,
      ["Calculated", "Unflinching", "Efficient", "Vigilant"]
    );
  }

  // Custom Persona synthesis
  const t1 = traits[0] || "Expressive";
  const t2 = traits[1] || "Focused";
  const t3 = traits[2] || "Decisive";
  const t4 = traits[3] || "Resolute";

  return {
    personaTitle: rawName,
    traitsList: traits,
    speechCadence: `Embodies a "${rawName}" persona (${traits.join(", ")}) while still sounding like a real, conversational human being talking naturally—using contractions, plain phrasing, and zero stiff textbook diction.`,
    attitudeAndWorldview: `Approaches conflicts, banter, and choices naturally through a "${rawName}" (${traits.join(", ")}) mindset.`,
    preferredTagPrefixes: [
      `${t1}/Action`,
      `${t2}/Tactical`,
      `${t3}/Dialogue`,
      `${t4}/Feat`,
    ],
    exampleSpokenLines: [
      `'Alright, let's get straight to it—what's the real play here?' (${t1.toLowerCase()}, natural human cadence)`,
      `'Look, we can overthink this all day, or we can actually make a move.' (${t3.toLowerCase()}, conversational contractions)`,
      `'Fair enough—your call, then. Let's see how this plays out.' (grounded ${rawName} response)`,
    ],
  };
}

export interface DynamicChoiceContext {
  playerName: string;
  playerRole: string;
  playerGender?: string;
  playerAge?: string;
  playerHeight?: string;
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
  recentHistory?: { speaker: string; text: string }[];
  lastPlayerAction?: string;
}

function resolveDefaultNextLocations(currentLoc: string, storyId?: string, role?: string): [string, string] {
  const combined = `${storyId || ""} ${currentLoc || ""} ${role || ""}`.toLowerCase();
  const isStarfall =
    combined.includes("starfall") ||
    combined.includes("star gate") ||
    combined.includes("iron barracks") ||
    combined.includes("memorial wall") ||
    combined.includes("hollow king");

  if (isStarfall) {
    if (combined.includes("star gate") || combined.includes("main lobby")) {
      return ["Floor 1: The Verdant Antechamber", "The Iron Barracks (Lobby Quarters)"];
    }
    if (combined.includes("barracks") || combined.includes("memorial")) {
      return ["Star Gate Plaza (Main Lobby)", "Floor 1: The Verdant Antechamber"];
    }
    if (combined.includes("floor 1")) {
      return ["Floor 5: Safe Zone Lantern Bazaar", "Star Gate Plaza (Main Lobby)"];
    }
    return ["Star Gate Plaza (Main Lobby)", "the next Labyrinth floor"];
  }

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
  const voiceFingerprint = extractPlayerVoiceStyleFromHistory(
    ctx.recentHistory,
    ctx.playerName,
    ctx.lastPlayerAction
  );
  const personaName = voiceProfile.personaTitle;
  const traits = voiceProfile.traitsList.join(", ");

  // Identify dominant emergent tendencies if tracked
  const hasBehavioralTendencies = Boolean(
    ctx.behavioralTendencies &&
      Object.values(ctx.behavioralTendencies).some((count) => Number(count) > 0)
  );
  const dominantTendencyLabel = hasBehavioralTendencies
    ? getDominantTendencyLabel(ctx.behavioralTendencies)
    : "";

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
The player explicitly designed ${ctx.playerName}'s personality and world origin in Character Creation. ALL 4 choices MUST be written in ${ctx.playerName}'s chosen persona voice, ADAPT TO THE PLAYER'S OWN CONVERSATIONAL SPEAKING STYLE, and ACTIVELY PROGRESS THE PLOT FORWARD:
- Protagonist Demographics: Gender: ${ctx.playerGender || "Male"} | Age: ${ctx.playerAge || "22"} | Height: ${ctx.playerHeight || "5'11\""}
- World Origin & System Familiarity: ${originLabel}${ctx.worldOriginDetails ? ` (${ctx.worldOriginDetails})` : ""}
- Chosen Personality Archetype: "${personaName}"
- Core Personality Traits: [${traits}]
- Speech Cadence & Vocal Tone: ${voiceProfile.speechCadence}
- Conversational Style Examples: ${voiceProfile.exampleSpokenLines.join(" | ")}
- Worldview & Demeanor: ${voiceProfile.attitudeAndWorldview}
${dominantTendencyLabel ? `- Emergent Behavioral Alignment (Top Playstyle from Prior Choices): [${dominantTendencyLabel}] — Weight the tone, problem-solving angle, and risk profile of the 4 choices toward BOTH "${personaName}" ([${traits}]) AND this proven ${dominantTendencyLabel} playstyle.\n` : ""}- Class & Lineage: ${cleanRole} | ${ctx.playerRace || "Human"} (${raceAnatomy})
- Active Stance & Arts: [${(ctx.activeStance || "Neutral").toUpperCase()} Stance | ${abilitiesSnippet}]
- Scene Context: ${companionClause}
${primaryObjective ? `- ACTIVE QUEST OBJECTIVE TO DRIVE NOW: "${primaryObjective}"${secondaryObjective ? ` | Next: "${secondaryObjective}"` : ""}` : ""}

${voiceFingerprint.promptDirectiveBlock}

ANTI-PROPERNESS & NATURAL CONVERSATIONAL DIALOGUE RULES (CRITICAL):
- Spoken lines inside '...' MUST sound like genuine human conversation—casual, natural, and in-character. Use everyday contractions ('I'm', 'you're', 'don't', 'let's', 'what's'), conversational openers ('Wait—', 'Look,', 'Alright,', 'Come on,', 'Hey,', 'So,'), and natural sentence rhythm.
- NEVER make ${ctx.playerName} talk like a Victorian aristocrat, courtroom lawyer, or textbook narrator! Strictly BANNED: stiff, overly formal lines like 'State your terms plainly', 'I shall comply', 'Allow me to inquire', 'Let us proceed to the next sector', or 'Put your terms on the table'.
- When ${voiceFingerprint.hasCustomSamples ? "the player has spoken in prior turns above, MATCH THEIR EXACT VIBE (length, slang/casualness, humor, bluntness)" : "no custom player lines exist yet, default to crisp, casual, everyday human speech rather than stiff RPG declarations"}.

CRITICAL PACING & STORY PROGRESSION RULES FOR ALL 4 CHOICES:
1. BALANCE PLAYER AGENCY (LINGER & DEEPEN vs. PUSH THE STORY FORWARD):
   - Give the player genuine control over scene pacing! Never trap them in 4 repetitive banter options on the same exhausted point, AND never force them out of a scene if they want to stay and talk a bit longer.
   - Structure the 4 choices so they offer both **meaningful forward story progression** AND **an evolving way to linger and deepen the current interaction**:
   - CHOICE 1 [${tag1}] (Advance Active Objective / Move the Plot Beat Forward):
     ${primaryObjective ? `Directly advance or fulfill the active quest objective ("${primaryObjective}")` : `Push the current exchange with ${speakerFirstName} to a decisive outcome or agreement`} with a natural, conversational "${personaName}" spoken line ('...') and concrete action.
   - CHOICE 2 [${tag2}] (Linger & Deepen Conversation / Evolve Interpersonal Chemistry):
     Remain in ${cleanLocation} with ${speakerFirstName} to explore a new conversational angle, personal truth, or closer romantic/banter beat—moving past surface-level small talk into deeper territory in ${ctx.playerName}'s "${personaName}" conversational voice.
   - CHOICE 3 [${tag3}] (High-Stakes Action / Wager / Hands-On ${cleanRole} Flair):
     Take a bold physical action, wager, or hands-on ${cleanRole} move right here in ${cleanLocation} (${abilitiesSnippet}) that visibly shifts the stakes or dynamic.
   - CHOICE 4 [Move/Transition] (Step Out to Next Location / Advance to Next Scene Phase):
     Offer a clear, natural transition out of ${cleanLocation} toward ${nextLoc1} or ${nextLoc2}${otherHeroineFirst ? ` (or to check on ${otherHeroineFirst})` : ""} whenever the player is ready to move the story to its next setting.
2. INCLUDE SPOKEN DIALOGUE IN SINGLE QUOTES ('...'): Whenever ${ctx.playerName} speaks in a choice, write their actual spoken line in single quotes ('...'). Do NOT escape apostrophes with a backslash (\') inside JSON strings; write normal apostrophes ('Don't', 'We're').
3. USE FIRST NAMES & NATURAL PROSE ONLY: Refer to ${ctx.activeSpeaker} simply as "${speakerFirstName}" and refer to locations naturally ("${cleanLocation}", "${nextLoc1}"). Never paste full character names or parenthetical UI labels into choices!

FORMAT REQUIREMENTS:
- Every choice MUST strictly follow: "[Tone/Action]: 'Spoken dialogue in player's conversational voice' + concrete physical action"
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

  const isStarfallLabyrinth =
    combinedContext.includes("starfall-labyrinth") ||
    combinedContext.includes("star gate plaza") ||
    combinedContext.includes("hollow king") ||
    combinedContext.includes("gacha-tower");

  if (isStarfallLabyrinth && !params.isProtagonistAlone) {
    return [
      `[Meta-Knowledge / Callout]: 'Hey, tighten the spacing—wait on my three-second mark and nobody gets clipped.' Map out the safest formation in ${loc}.`,
      `[${traitTag}/Trust]: 'Hey, take a breath, ${speaker}. You're not bait while I'm running this squad.' Check her gear straps and meet her eyes steadily.`,
      `[${roleTag}/Tactics]: 'Alright, let's flip the Master's reckless clock in our favor right now.' Step forward with crisp ${rolePhrase} timing.`,
      `[Move/Deployment]: 'Ready when you are—let's head into ${nextLoc1} and stick together.' Motion for ${speaker} to move out from ${loc}.`,
    ];
  }

  if (isPortSolarisOrSocial && !params.isProtagonistAlone) {
    if (isCulinaryScene) {
      return [
        `[${traitTag}/Resolve]: 'Go on, ${speaker}, take a real bite—let's see if the kitchen passes.' Slide the warm plate directly in front of ${speaker}.`,
        `[Charisma/Deepen]: 'Set the clipboard down for two minutes, ${speaker}—when did you last eat something that wasn't off a tasting menu?' Pull up a stool across the counter and study her expression.`,
        `[${roleTag}/Wager]: 'Tell you what—finish that plate and you hold the notice until you see how we actually run things.' Tap the counter beside ${speaker}'s hand.`,
        `[Move/Transition]: 'Now that you've tried it, come check out ${nextLoc1} with me.' Motion for ${speaker} to follow you out of ${loc}.`,
      ];
    }
    return [
      `[${traitTag}/Resolve]: 'Alright, ${speaker}, let's hear the real story—what's actually going on here?' Step up to ${speaker} for a straight answer.`,
      `[Charisma/Deepen]: 'Okay, drop the rehearsed speech for a second, ${speaker}—why'd you really take this gig?' Lean against the railing in ${loc} and catch her eye.`,
      `[${roleTag}/Wager]: 'Wait, seriously? Put your money where your mouth is—let's settle it with an Article 9 wager.' Grin and challenge ${speaker} cleanly.`,
      `[Move/Transition]: 'Come on—walk over to ${nextLoc1} with me and see it for yourself.' Gesture for ${speaker} to join you as you head out of ${loc}.`,
    ];
  }

  if (params.isProtagonistAlone) {
    if (lower.includes("trickster") || lower.includes("sly")) {
      return [
        `[Trickster/Audacious]: 'Well, nobody rolled out the red carpet.' Slip across ${loc} with an easy grin.`,
        `[Cunning/Recon]: 'Alright, what did everyone else miss?' Check the layout for a useful angle or detail left behind.`,
        `[Observant/Playful]: 'Let's see what's hiding over here.' Check out the most intriguing corner of ${loc}.`,
        `[${roleTag}/Feat]: Rely on your ${rolePhrase} instincts to take the best spot in ${loc}.`,
      ];
    }
    if (lower.includes("noble") || lower.includes("protector")) {
      return [
        `[Noble/Vigilant]: 'Okay, whatever's waiting in ${loc}, I'm ready for it.' Step forward steadily.`,
        `[Protective/Survey]: Take a quick look around ${loc} to see if anyone nearby needs a hand.`,
        `[Honorable/Resolve]: 'No backing down now.' Square your shoulders and stay alert in ${loc}.`,
        `[${roleTag}/Feat]: Keep your ${rolePhrase} instincts ready as you move through ${loc}.`,
      ];
    }
    if (lower.includes("cynic") || lower.includes("outlaw")) {
      return [
        `[Cynical/Streetwise]: 'Quiet places like ${loc} never stay quiet for free.' Scan the room before making a move.`,
        `[Outlaw/Tactical]: 'Always check the exits first.' Read the room before touching a thing.`,
        `[Skeptical/Probe]: Check the nearest counter or doorway in ${loc} to see what's really going on.`,
        `[${roleTag}/Feat]: Use your ${rolePhrase} instincts to size up ${loc}.`,
      ];
    }
    if (lower.includes("scholar")) {
      return [
        `[Scholar/Analytical]: 'Wait—none of this happened by accident.' Trace the little details back to their source.`,
        `[Inquisitive/Detail]: Check the immediate surroundings in ${loc} for anything that feels off.`,
        `[Observant/Methodical]: Take a second to read the vibe and clues inside ${loc}.`,
        `[${roleTag}/Feat]: Put your ${rolePhrase} focus to work piecing together ${loc}.`,
      ];
    }
    if (lower.includes("daredevil")) {
      return [
        `[Daredevil/Bold]: 'No point standing around!' Head straight into the middle of ${loc} and see what moves first.`,
        `[Fierce/Momentum]: Keep your pace brisk through ${loc} and push the scene forward.`,
        `[Defiant/Spark]: 'Alright, let's see what happens.' Test the waters in ${loc} with bold energy.`,
        `[${roleTag}/Feat]: Trust your ${rolePhrase} drive to set the tempo in ${loc}.`,
      ];
    }
    return [
      `[${traitTag}/Composed]: 'Alright, let's see what we're working with.' Step into ${loc} and take stock of the room.`,
      `[Observant/Survey]: Scan ${loc} quickly for anything that stands out.`,
      `[Pragmatic/Focus]: 'Keep it simple.' Find a solid spot in ${loc} and get ready for the next move.`,
      `[${roleTag}/Execution]: Put your ${rolePhrase} experience to work in ${loc}.`,
    ];
  }

  // When accompanied by a companion / heroine
  if (lower.includes("trickster") || lower.includes("sly")) {
    return [
      `[Trickster/Resolve]: 'Look, banter's fun and all, ${speaker}, but let's settle this already.' Toss out a cheeky wager to wrap up the point.`,
      `[Move/Transition]: 'Come on, ${speaker}—something better is waiting over in ${nextLoc1}.' Flash a smirk and lead the way out of ${loc}.`,
      `[Charming/Escalation]: 'You look like you've been waiting all day to test me, ${speaker}. Go ahead—show me what you've got.' Step in with playful confidence.`,
      `[${roleTag}/Pivot]: Use your ${rolePhrase} touch to wrap things up in ${loc} and head toward ${nextLoc2}.`,
    ];
  }

  if (lower.includes("noble") || lower.includes("protector")) {
    return [
      `[Noble/Resolve]: 'You've got my word, ${speaker}—we figure this out together right now.' Meet her eyes and hold out a hand.`,
      `[Move/Transition]: 'We've hung around ${loc} long enough. Walk with me to ${nextLoc1}?' Motion toward the exit for ${speaker} to join you.`,
      `[Valiant/Escalation]: 'Forget talking circles—let's handle this head-on right now.' Step up and take point.`,
      `[${roleTag}/Pivot]: Put your ${rolePhrase} instincts to work to clear what's ahead and open the path to ${nextLoc2}.`,
    ];
  }

  if (lower.includes("cynic") || lower.includes("outlaw")) {
    return [
      `[Cynical/Resolve]: 'Alright, skip the pitch, ${speaker}—give me the real number so we can move.' Press her for a straight deal.`,
      `[Move/Transition]: 'Standing around in ${loc} isn't paying the bills. Let's check ${nextLoc1}.' Head toward the door and jerk your chin toward ${speaker}.`,
      `[Outlaw/Escalation]: 'Talk's cheap, ${speaker}. Put something real on the line right now.' Raise the stakes in ${loc}.`,
      `[${roleTag}/Pivot]: Grab what you need in ${loc} and shift over toward ${nextLoc2}.`,
    ];
  }

  if (lower.includes("scholar")) {
    return [
      `[Scholar/Resolve]: 'Wait, it's obvious when you look at it, ${speaker}—here's how we solve it.' Lay out the clean fix to settle the argument.`,
      `[Move/Transition]: 'Our real lead isn't in ${loc}. Come over to ${nextLoc1} with me so we can check it out.' Head toward the exit with ${speaker}.`,
      `[Analytical/Escalation]: 'Let's not guess—let's test your theory right here.' Run a quick hands-on check in ${loc}.`,
      `[${roleTag}/Pivot]: Use your ${rolePhrase} know-how to finish the check and head for ${nextLoc2}.`,
    ];
  }

  if (lower.includes("daredevil")) {
    return [
      `[Daredevil/Resolve]: 'Alright, enough talking, ${speaker}—let's settle this right now!' Step in with a grin to force an answer.`,
      `[Move/Transition]: 'What are we waiting for? Let's take this over to ${nextLoc1}!' Grin and stride toward the doorway with ${speaker}.`,
      `[Defiant/Escalation]: 'Double or nothing, ${speaker}—think you can actually keep up?' Kick off a direct showdown right here.`,
      `[${roleTag}/Pivot]: Ride that ${rolePhrase} momentum to finish things in ${loc} and push toward ${nextLoc2}.`,
    ];
  }

  // Default: Stoic Pragmatist / Custom Persona
  return [
    `[${traitTag}/Resolve]: 'Alright, ${speaker}—what's your actual answer so we can move on this?' Look her straight in the eye and wait.`,
    `[Move/Transition]: 'Nothing else for us here in ${loc}. Come with me to ${nextLoc1}.' Turn toward the doorway and lead ${speaker} along.`,
    `[Composed/Escalation]: 'Still skeptical? Fair enough—let's test it right here and see.' Put real stakes on the table in ${loc}.`,
    `[${roleTag}/Pivot]: Wrap up your ${rolePhrase} business in ${loc} and head over toward ${nextLoc2}.`,
  ];
}

const CHOICE_VECTOR_RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: "combat",
    keywords: [
      "combat",
      "aggressive",
      "strike",
      "lunge",
      "blade",
      "fierce",
      "attack",
      "charge",
      "clash",
      "slay",
      "ambush",
    ],
  },
  {
    category: "subterfuge",
    keywords: [
      "cynic",
      "outlaw",
      "rogue",
      "stealth",
      "subterfuge",
      "trickster",
      "deceptive",
      "feint",
      "bluff",
      "loophole",
      "shadow",
      "steal",
      "lock",
    ],
  },
  {
    category: "analytical",
    keywords: [
      "arcana",
      "scholar",
      "analytic",
      "survey",
      "inquisitive",
      "observant",
      "meta-knowledge",
      "callout",
      "deduce",
      "inspect",
      "lore",
      "pattern",
      "tactical",
    ],
  },
  {
    category: "empathetic",
    keywords: [
      "empath",
      "gentle",
      "protect",
      "noble",
      "valiant",
      "honorable",
      "heart-to-heart",
      "deepen",
      "trust",
      "guard",
      "comfort",
      "reassure",
      "check on",
      "shield",
    ],
  },
  {
    category: "diplomatic",
    keywords: [
      "diplomat",
      "inquire",
      "pact",
      "bargain",
      "charm",
      "banter",
      "social",
      "panache",
      "flirt",
      "tease",
      "persuade",
      "negotiate",
    ],
  },
  {
    category: "defiant",
    keywords: [
      "defiant",
      "bold",
      "dare",
      "challenge",
      "taunt",
      "wager",
      "audacious",
      "pushback",
      "rebel",
      "defy",
      "table-turn",
      "escalat",
    ],
  },
  {
    category: "instinctive",
    keywords: [
      "lupine",
      "beast",
      "scent",
      "fang",
      "instinct",
      "culinary",
      "flair",
      "sensory",
      "reflex",
    ],
  },
];

/**
 * Analyzes a choice text vector and returns the primary category tag to increment behavioral metrics.
 */
export function analyzeChoiceVector(choiceText: string): string {
  if (!choiceText || typeof choiceText !== "string") return "pragmatic";
  const lower = choiceText.toLowerCase();

  const tagMatch = lower.match(/^\[([^\]]+)\]/);
  const tagText = tagMatch ? tagMatch[1] : "";
  const combinedSearch = `${tagText} ${lower}`;

  // Prioritize matches in the bracket tag before checking full choice body keywords
  for (const source of [tagText, combinedSearch]) {
    if (!source) continue;
    for (const rule of CHOICE_VECTOR_RULES) {
      if (rule.keywords.some((kw) => source.includes(kw))) {
        return rule.category;
      }
    }
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
