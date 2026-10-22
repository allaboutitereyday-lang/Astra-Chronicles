/**
 * Narration Styles & Prose Directives Engine for Astra Chronicles
 * Strictly shapes the Game Master, Narrator, and World Engine prose
 * across character creation, prologue generation, dynamic choices, and interactive turns.
 */

export type NarrationStyleKey = "grimdark" | "light_novel" | "noir" | "custom";

export interface NarrationStyleDefinition {
  id: NarrationStyleKey;
  label: string;
  shortDescription: string;
  badgeLabel: string;
  corePhilosophy: string;
  sensoryTextures: string;
  dialogueCadence: string;
  combatAndAction: string;
  negativeConstraints: string[];
  proseExample: string;
}

export const NARRATION_STYLE_DEFINITIONS: Record<Exclude<NarrationStyleKey, "custom">, NarrationStyleDefinition> = {
  grimdark: {
    id: "grimdark",
    label: "Grimdark & Atmospheric (Tense, visceral, sensory)",
    badgeLabel: "Grimdark & Atmospheric",
    shortDescription: "Tense, visceral, sensory, morally gray, oppressive",
    corePhilosophy: "The world is ruthless, unforgiving, cold, and morally decayed. Survival is never guaranteed, and every victory demands a grueling pound of flesh. Hope is a fragile, flickering candle in an oppressive gloom.",
    sensoryTextures: "Heavy, tactile, visceral sensations: the iron tang of oxidized blood on cracked teeth, sleet soaking through fraying leather, the sickening crunch of fractured bone, damp moss clinging to crumbling crypts, the stench of stagnant tallow and ozone, rusted metal groaning under crushing pressure.",
    dialogueCadence: "Guarded, terse, pragmatic, and strained. Characters speak with wary economy, constantly evaluating each other for betrayal, weakness, or deception. No lighthearted anime tropes, unearned sentimentality, or theatrical speeches.",
    combatAndAction: "Gritty, exhausting, and physically punishing. Blades stick in bone, shields splinter into jagged shards, stamina burns fast, and wounds have immediate physiological consequences (dizziness, labored breath, trembling limbs).",
    negativeConstraints: [
      "NEVER use playful anime tropes, cheerful exclamation points, or cartoonish slapstick.",
      "NEVER gloss over the psychological or physical trauma of violence.",
      "NEVER introduce unearned heroic platitudes, bubbly optimism, or cheesy catchphrases.",
      "Strictly preserve a sense of high mortal stakes and looming catastrophic danger.",
    ],
    proseExample: `The sleet carried the reek of scorched marrow and wet ash. Elena adjusted her grip on the frost-bitten hilt, her knuckles raw and white against the darkwood. "One more step toward that rift," she murmured, her voice flat and devoid of warmth, "and I'll let the shadows finish what they started."`,
  },
  light_novel: {
    id: "light_novel",
    label: "Light Novel High Fantasy (Dynamic pacing, witty banter, heroic)",
    badgeLabel: "Light Novel High Fantasy",
    shortDescription: "Dynamic pacing, witty banter, heroic, kinetic anime flair",
    corePhilosophy: "High-octane, spirited, character-driven heroic fantasy inspired by modern Japanese light novels and anime. The world is vibrant, full of wonder and dangerous magic, where unbreakable resolve, quick wits, and dynamic bonds can overcome impossible odds.",
    sensoryTextures: "Vivid, dazzling visual spectacles: brilliant azure mana flares, spinning golden arcane arrays humming with celestial energy, crisp sonic cracks of swept steel, swirling cherry blossoms or starlight over crystalline palace spires, luminous elemental auras.",
    dialogueCadence: "Snappy, expressive, and full of personality. Crackling banter with distinct light novel archetypes (sharp-tongued tsundere barbs, deadpan kuudere observations, flamboyant theatrical boasts, energetic exasperation, earnest heroic declarations). Expressive, animated reactions.",
    combatAndAction: "Kinetic, fluid anime-styled battle choreography. Acrobatic aerial dashes, crisp blade clashes sending showers of crystalline sparks, dramatic technique callouts, swift tactical deductions in mid-air, thrilling heroic crescendos.",
    negativeConstraints: [
      "DO NOT write dreary, nihilistic, or endlessly depressing descriptions. Avoid grimdark gloom.",
      "DO NOT fixate on gory mutilation, rotting corpses, or drab decay. Keep the aesthetic vivid, heroic, and stylish.",
      "DO NOT drag the pacing down with sluggish, dreary internal monologues.",
      "Avoid slow or depressing fatalism; keep the narrative spirited, colorful, and engaging.",
    ],
    proseExample: `Azure mana ignited along the blade in a dazzling spiral of crystalline sparks, casting a brilliant glow over Aria's defiant smirk. She spun her daggers with effortless flair, her twin tails whipping in the vortex. "Honestly! You call that an opening strike?" Her eyes glinted with mischievous fire as she vaulted into the air. "Watch closely, Partner—I won't bail you out twice!"`,
  },
  noir: {
    id: "noir",
    label: "Noir Arcana (Brooding, cynical, sharp monologues)",
    badgeLabel: "Noir Arcana",
    shortDescription: "Brooding, cynical, sharp monologues, occult urban mystery",
    corePhilosophy: "Hardboiled occult noir meets urban fantasy underworld. A twilight realm of rain-drenched alleys, illicit mana cartels, flickering neon runes, and dangerous bargains. Everyone has an angle, and trust is the quickest way to end up in a gutter.",
    sensoryTextures: "Rain-slicked cobblestones reflecting neon-violet mana conduits, stale clove cigarette smoke drifting through wet blinds, damp wool trenchcoats, the harsh sting of cheap distilled spirits, flickering gaslights, the hum of subterranean aether pipes.",
    dialogueCadence: "Laconic, biting, razor-sharp, and rhythmically cool. World-weary wit, sardonic one-liners, guarded underworld transactions, and fatalistic observations. The inner monologue is observant and cynical, dissecting poker faces and motives.",
    combatAndAction: "Sudden, dirty, and ruthlessly pragmatic. Concealed ward-piercing revolvers, trenchcoat blades, point-blank hex discharges, alleyway ambushes, and street-brawling efficiency over flamboyant choreography.",
    negativeConstraints: [
      "DO NOT use bubbly light novel banter, squeaky anime expressions, or naive optimism.",
      "DO NOT write archaic grand-fantasy purple prose ('thee', 'thou', 'fair maiden').",
      "DO NOT describe idyllic fairy-tale wonder. Everything in this city has a price tag and a darker motive.",
      "Avoid flashy superhero posturing; maintain a grounded, hardboiled street-level edge.",
    ],
    proseExample: `The downpour in Sector Four didn't wash away sins; it just melted the cheap glamours off the gargoyles. Morgana leaned against the damp brickwork, exhaling a thin curl of clove smoke into the violet street-glow. "In this city, kid, secrets aren't free, and curiosity usually comes with a coroner's stamp. Tell me what you're really after before the syndicate decides to close your tab."`,
  },
};

/**
 * Universal directive enforcing impeccable grammar, mandatory quotation marks,
 * and visual novel markdown immersion across all styles.
 */
export const UNIVERSAL_IMMERSION_AND_GRAMMAR_DIRECTIVE = `--- UNIVERSAL LITERARY RIGOR, GRAMMAR & PLAIN-TEXT JSON DIRECTIVE ---
1. GRAMMATICAL ACCURACY & SYNTACTIC POLISH:
   - Maintain flawless literary grammar, correct punctuation, active voice, and rich sensory verbs.
   - Strictly prohibit grammatical errors: no comma splices, dropped clauses, run-on fragments, or unnatural tense flipping.
   - Maintain consistent past-tense for narrative prose descriptions and present-tense for spoken character dialogue.
   - Eliminate repetitive robotic AI clichés and machine transitions (e.g. avoid repeating "Suddenly...", "As if on cue...", "A testament to...", "A palpable silence...").
2. MANDATORY DOUBLE QUOTATION MARKS FOR ALL SPOKEN DIALOGUE:
   - ALL spoken words, verbal banter, and character utterances MUST be cleanly enclosed in standard double quotation marks ("..."). NEVER use single quotes ('...') to wrap spoken dialogue.
   - NEVER output floating or unattributed speech. Every spoken line must be physically anchored to an action beat, facial micro-expression, tone of voice, or spatial movement.
3. STRICT ZERO-MARKDOWN RULE IN PROSE:
   - DO NOT use Markdown asterisks (*italics* or **bold**), underscores, headers (#), blockquotes (>), or Markdown tables inside narrative prose or dialogue fields.
   - Convey physical gestures, sensory textures, and kinetic impacts through vivid literary diction and sentence rhythm rather than asterisks or bold tags.
   - Place all LitRPG system notifications, stat checks, or mechanical readouts inside the dedicated "mechanics" / "system_announcement" JSON fields—never inline inside story paragraphs.
   - Structure prose into 2 to 3 evocative, well-paced paragraphs separated by clean line breaks (\\n\\n).
4. PRE-FLIGHT SPELLCHECK & SELF-VERIFICATION (MANDATORY):
   - Before outputting your response, perform an internal self-check:
     * SPELLCHECK & DICTION: Verify that all vocabulary, character names, and descriptive words are spelled accurately with zero letter omissions or mangled words.
     * ZERO DUPLICATE OR SINGLE QUOTES: Never output doubled quotes (""..."" or ""text"") or single-quoted speech ('...'). Spoken lines must use standard double quotes ("...").
     * ZERO ASTERISKS OR MARKDOWN TAGS: Ensure zero * or ** characters appear in the narrative text.
     * ZERO BRACKET TAG LEAKS: Strip all meta or intent tags like [Combat], [Arcana], [Subterfuge], or [Character Response] from dialogue and narrative prose.`;

/**
 * Mandatory checklist ensuring the LLM checks universe state, memory, and scene context before responding.
 */
export const UNIVERSE_STATE_AND_MEMORY_CHECKLIST = `--- PRE-RESPONSE VERIFICATION PROTOCOL: UNIVERSE STATE, MEMORY & SCENE CONTEXT ---
BEFORE GENERATING ANY NARRATIVE PROSE OR DIALOGUE, YOU MUST INTERNALLY VERIFY THE FOLLOWING THREE PILLARS:
1. STATE OF THE UNIVERSE:
   - Location & Environmental Constraints: What are the physical realities of the active location? (Lighting, ambient hazards, weather, terrain, noise level). Actions must obey physical geography and spatial logic.
   - LitRPG System State: Check active quests, objective statuses, and causal plausibility score. The protagonist's loadout (weapon, armor, relic), stance, and stamina dictate their physical limits.
2. CONTINUITY OF MEMORY & HISTORY:
   - Chronicle Beats: Cross-reference previous interaction beats and memories. Characters must acknowledge established agreements, past battles, confessions, or betrayals.
   - Affection Locks & Boundaries: Respect companion favor caps. If locked at a threshold (25%, 50%, 75%), emotional defense mechanisms are active—favor cannot rise until milestone quests are completed.
   - Timeline Echoes: If timeline echoes are present, reflect instinctual deja-vu or uncanny foreknowledge from prior deaths/loops.
3. CONTEXT OF THE ACTIVE SCENE:
   - Physical Presence vs Absence: Check who is physically standing in the scene. If the protagonist is alone, companions cannot talk or react. If companions are present, portray dynamic eye contact, physical distance, and interpersonal friction.
   - Persona & Expression Demeanor: The active speaker must strictly embody their voice profile, ideological values, and current expression key.`;

/**
 * Normalizes any freeform or select dropdown narration style string into a canonical key.
 */
export function resolveNarrationStyleKey(rawTone?: string): NarrationStyleKey {
  if (!rawTone) return "grimdark";
  const s = rawTone.toLowerCase().trim();
  if (
    s.includes("light novel") ||
    s.includes("witty banter") ||
    s.includes("heroic") ||
    s.includes("anime") ||
    s.includes("high fantasy")
  ) {
    return "light_novel";
  }
  if (
    s.includes("noir") ||
    s.includes("cynical") ||
    s.includes("brooding") ||
    s.includes("monologue") ||
    s.includes("hardboiled")
  ) {
    return "noir";
  }
  if (
    s.includes("grimdark") ||
    s.includes("visceral") ||
    s.includes("tense") ||
    s.includes("atmospheric")
  ) {
    return "grimdark";
  }
  return "custom";
}

/**
 * Returns a human-friendly display label for the active narration style.
 */
export function getNarrationStyleBadge(rawTone?: string): string {
  const key = resolveNarrationStyleKey(rawTone);
  if (key === "custom") {
    return rawTone?.trim() || "Grimdark & Atmospheric";
  }
  return NARRATION_STYLE_DEFINITIONS[key].badgeLabel;
}

/**
 * Builds the comprehensive, unambiguous prose directive injected into the LLM system prompt.
 * Strictly forces the LLM to write in the chosen prose style and explicitly enforces negative constraints,
 * universal grammar rules, quotation mark enforcement, and visual novel markdown formatting.
 */
export function getNarrationProseDirective(rawTone?: string): string {
  const key = resolveNarrationStyleKey(rawTone);

  let styleBody = "";
  if (key !== "custom") {
    const def = NARRATION_STYLE_DEFINITIONS[key];
    styleBody = `--- MANDATORY PROSE & NARRATION DIRECTIVE: [${def.label.toUpperCase()}] ---
YOU MUST STRICTLY ADHERE TO THIS PROSE STYLE FOR ALL NARRATIVE TEXT, ENVIRONMENTAL DESCRIPTIONS, SENSORY BEATS, AND CHARACTER DIALOGUE. DO NOT REVERT TO GENERIC STOCK WRITING:
1. CORE PHILOSOPHY & ATMOSPHERE:
   ${def.corePhilosophy}
2. SENSORY & ENVIRONMENTAL TEXTURES:
   ${def.sensoryTextures}
3. DIALOGUE CADENCE & CHARACTER VOICE:
   ${def.dialogueCadence}
4. ACTION, COMBAT & PACING:
   ${def.combatAndAction}
5. STRICT NEGATIVE CONSTRAINTS (CRITICAL - DO NOT VIOLATE):
${def.negativeConstraints.map((nc) => `   - ${nc}`).join("\n")}
6. TARGET PROSE CADENCE REFERENCE (MATCH THIS EXACT TONE & REGISTER):
   "${def.proseExample}"`;
  } else {
    const customTone = rawTone?.trim() || "Grimdark & Atmospheric";
    styleBody = `--- MANDATORY PROSE & NARRATION DIRECTIVE: [${customTone.toUpperCase()}] ---
YOU MUST STRICTLY ADHERE TO THE TONE AND PROSE CONVENTIONS OF "${customTone}":
1. Consistently calibrate all environmental descriptions, sensory details, and character dialogue to faithfully reflect "${customTone}".
2. Dialogue and character voices must actively express the vocabulary, attitude, and emotional pacing inherent to "${customTone}".
3. Do not revert to generic stock narration; let "${customTone}" guide the sentence rhythm, word choice, and narrative tension across all generated prose.`;
  }

  return `${styleBody}

${UNIVERSAL_IMMERSION_AND_GRAMMAR_DIRECTIVE}

${UNIVERSE_STATE_AND_MEMORY_CHECKLIST}`;
}

/**
 * Builds a style-tailored prompt directive for authoring the 4 interactive player choices.
 */
export function getChoicesStyleDirective(rawTone?: string): string {
  const key = resolveNarrationStyleKey(rawTone);
  if (key === "light_novel") {
    return `Generate 4 distinct player action choices reflecting a Light Novel / High Fantasy dynamic: snappy, proactive, spirited, and heroic with tactical and character-driven flavor. Each choice must have flawless grammar and syntax.`;
  }
  if (key === "noir") {
    return `Generate 4 distinct player action choices reflecting a Noir Arcana style: cynical, sharp, street-smart, guarded, and pragmatic underworld maneuvering. Each choice must have flawless grammar and syntax.`;
  }
  return `Generate 4 distinct player action choices reflecting a Grimdark & Atmospheric style: tense, calculated, gritty, and acutely aware of mortal consequences. Each choice must have flawless grammar and syntax.`;
}
