/**
 * Narration Styles & Prose Directives Engine for Astra Chronicles
 * Strictly shapes the Game Master, Narrator, and World Engine prose
 * across character creation, prologue generation, dynamic choices, and interactive turns.
 */

export type NarrationStyleKey = "grimdark" | "light_novel" | "noir" | "custom";

export type NarrativeDepthMode = "standard" | "expansive" | "deep_novelistic";

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
    proseExample: `The sleet carried the reek of scorched marrow and wet ash across the shattered courtyard, stinging exposed skin like needles of blown glass. Elena did not lower her guard as the lantern light caught the dried crimson crust along her gauntlet; instead, she shifted her boots over the slick flagstones until the crumbling parapet guarded her flank, her knuckles blanching white against the frost-bitten darkwood of her hilt.\n\n"You speak of sanctuary as though the word still has currency in this sector," she murmured, her voice flat and scraped raw by the freezing wind. Her heavy-lidded gaze tracked the slightest twitch of your sword hand, measuring the distance between your throat and her steel. "Three inquisitorial patrols marched into that rift since sundown. Only their horses came back—skinless and screaming."\n\nShe took a slow, deliberate half-step closer, the ambient hum of the fractured leyline casting long violet shadows across the hollow of her cheek. "If you intend to cross that threshold, you won't do it on blind valor. Tell me what anchors your soul against the rot down there, or turn back before the fog decides to keep us both."`,
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
    proseExample: `Azure mana ignited along the twin blades in a dazzling spiral of crystalline sparks, casting a brilliant sapphire glow across the marble terrace and illuminating Aria's defiant smirk. The shockwave of the parried spell sent a flurry of silver petals whirling into the starlit sky as she landed on the balustrade with effortless, catlike grace.\n\n"Honestly! You call that an opening vanguard maneuver?" She spun her right dagger in a reverse-grip flourish, her twin tails whipping in the lingering gale as she looked down at you with a mixture of exasperated disbelief and grudging amusement. "If I had arrived three seconds later, that construct would have singed your cloak right off your shoulders!"\n\nHopping lightly down onto the flagstones beside you, she nudged your pauldron with the pommel of her blade, her silver eyes glinting with fierce, competitive fire as the ancient spire doors began to rumble open ahead. "Don't think this makes us even, Partner. Keep your aura synced to mine on the next rush—because whoever clears the upper sanctum last is buying dinner at the guildhall tonight!"`,
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
    proseExample: `The downpour in Sector Four never washed away a man's sins; it only melted the cheap alchemical glamours off the tenement gargoyles and turned the gutter runoff the color of bruised plums. Morgana leaned one shoulder against the damp brickwork beneath a flickering violet ward-sign, the ember of her clove cigarette flaring bright before she exhaled a slow ribbon of smoke into the cold drizzle.\n\n"You walk awfully loud for someone carrying an unsealed syndicate cipher in their coat pocket," she drawled, her voice a low, smoky alto that barely carried over the hiss of the steam grates. Her dark eyes slid from your rain-soaked boots up to your collar, reading the tension in your jaw with the practiced detachment of a card sharp spotting a tell. "In this district, curiosity usually comes with a coroner's stamp and an unmarked stone by the canal."\n\nShe flicked the spent ash into a puddle where it died with a sharp hiss, then unlatched the iron speakeasy door half an inch, letting the warm scent of ozone and aged rye spill into the alley. "Still, I suppose I've backed worse odds on a Tuesday night. Step inside out of the street-glow and tell me what you're really buying—before the hounds on the roof decide to close your tab for good."`,
  },
};

/**
 * Returns the explicit length, paragraphing, and multi-beat scene depth directive
 * corresponding to the active NarrativeDepthMode.
 */
export function getNarrativeDepthDirective(depth: NarrativeDepthMode = "deep_novelistic"): string {
  if (depth === "standard") {
    return `--- NARRATIVE DEPTH & LENGTH DIRECTIVE: [STANDARD VISUAL NOVEL PACING (2–3 PARAGRAPHS)] ---
- Structure "narrative_text" into 2 to 3 evocative, well-paced paragraphs separated by clean line breaks (\\n\\n).
- Balance atmospheric sensory details, character body language, and spoken dialogue in double quotation marks ("...").`;
  }

  if (depth === "expansive") {
    return `--- NARRATIVE DEPTH & LENGTH DIRECTIVE: [EXPANSIVE SCENE & DIALOGUE (3–5 PARAGRAPHS)] ---
- Structure "narrative_text" into 3 to 5 rich, detailed paragraphs (approx. 300–450 words) separated by clean line breaks (\\n\\n).
- Include multiple spoken dialogue beats interleaved with physical movement, environmental reactions, and psychological nuance.`;
  }

  return `--- NARRATIVE DEPTH & LENGTH DIRECTIVE: [DEEP NOVELISTIC MULTI-BEAT ARCHITECTURE (5–7+ PARAGRAPHS)] ---
CRITICAL LENGTH & DEPTH MANDATE: You MUST write an expansive, deeply immersive, novel-length scene response in "narrative_text" spanning **5 to 7 substantial paragraphs (450 to 800+ words)** separated by clean double line breaks (\\n\\n). NEVER summarize briefly or stop after 2–3 short paragraphs!
Unfold every turn across these four mandatory narrative beats:
1. BEAT 1 — IMMEDIATE KINETIC & ENVIRONMENTAL CONSEQUENCE (Paragraphs 1–2):
   - Ground the scene in rich, visceral sensory detail (lighting, acoustics, weather, air temperature, scent, spatial geometry, and tactile textures).
   - Depict the immediate physical, magical, or tactical ripples of the protagonist's action and words across the environment.
2. BEAT 2 — PSYCHOLOGICAL SUBTEXT & MICRO-EXPRESSIONS (Paragraphs 2–3):
   - Before or as the active character speaks, portray their internal emotional and analytical reaction through vivid physical tells: micro-expressions, gaze tracking, breathing cadence, posture adjustments, weapon or garment handling, and unspoken tension.
   - Show—do not merely tell—how they weigh the protagonist's motives, competence, or audacity.
3. BEAT 3 — MULTI-STAGE DIALOGUE & PHYSICAL CHOREOGRAPHY (Paragraphs 3–5):
   - NEVER limit a character to a single isolated quote at the end of the turn!
   - Write **at least 2 to 3 distinct spoken dialogue segments** in double quotation marks ("...") woven across multiple paragraphs, broken up by physical pacing, stepping closer or circling, interacting with the surroundings, and shifting vocal cadence.
4. BEAT 4 — WORLD ESCALATION & NARRATIVE HOOK (Paragraphs 5–7):
   - Advance the physical scene, interpersonal chemistry, or tactical stakes forward so the environment evolves dynamically and concludes on an evocative, high-tension beat that naturally sets up the next decision.`;
}

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
   - Separate all paragraphs cleanly using double line breaks (\\n\\n).
4. PRE-FLIGHT SPELLCHECK & SELF-VERIFICATION (MANDATORY):
   - Before outputting your response, perform an internal self-check:
     * SPELLCHECK & DICTION: Verify that all vocabulary, character names, and descriptive words are spelled accurately with zero letter omissions or mangled words.
     * ZERO DUPLICATE OR SINGLE QUOTES: Never output doubled quotes (""..."" or ""text"") or single-quoted speech ('...'). Spoken lines must use standard double quotes ("...").
     * ZERO ASTERISKS OR MARKDOWN TAGS: Ensure zero * or ** characters appear in the narrative text.
     * ZERO BRACKET TAG LEAKS: Strip all meta or intent tags like [Combat], [Arcana], [Subterfuge], or [Character Response] from dialogue and narrative prose.
5. NATURAL HUMAN PROSE — NO FULL-NAME OR CATALOG-LABEL DUMPING (CRITICAL):
   - FIRST NAMES OVER FULL NAMES: In narrative prose, action beats, dialogue tags, spoken dialogue, and choices, ALWAYS refer to the protagonist and companions by their **first name** (e.g., "Kaedrel", "Cassia", "Beatrix", "Ysolde", "Kestrel", "Aurelia", "Miri", "Noelle", "Valeria", "Evelyn", "Aria") or natural pronouns once introduced. NEVER robotically repeat full first+last names ("Kaedrel Victus", "Ysolde Kaelen", "Beatrix Valorian") or append parenthetical rank tags like "(#184)", "(#142)", or "(#42)" in story prose or dialogue.
   - DESCRIBE ITEMS & GEAR NATURALLY — NEVER PASTE INVENTORY LABELS: Do NOT copy-paste capitalized multi-word UI equipment names into prose or dialogue (e.g., NEVER write "He drew his Concealed Punch-Dagger & Curved Mist-Saber", "adjusted his Iron-Grey Initiate Greatcoat & Brigandine", or "channeled his Fractured Ashen Legion Spine-Node"). Instead, write like a human novelist by referring to items naturally and descriptively ("his curved saber", "the punch-dagger at his belt", "his heavy coat", "the tarnished ring on his thumb", "her brass-bound ledger").
   - REFER TO LOCATIONS ORGANICALLY — NEVER REPEAT MAP BANNERS: Do NOT repeat full capitalized location headers ("The Sky-Crown & Sovereign Terraces", "Stratum I: The Sunken Cloisters", "The Velvet Spill & The Tribunal Pit", "The Seal-Gate & Boarding Quays") in every paragraph or spoken sentence. Refer to the physical space naturally ("the amphitheater", "the flooded cloisters", "the sunken pit", "the boarding quay", "the iron cage", "this sanctum").
   - SHOW TECHNIQUES & MAGIC THROUGH SENSORY ACTION, NOT SKILL-SLOT NAMES: Do NOT insert capitalized RPG skill titles or mechanical jargon into narrative sentences (e.g., avoid writing "executing a Mist-Mirage Tendon Sever" or "using Path A: Somatic Tempering"). Describe the physical movement, breath, light, and impact organically ("leaving a fleeting afterimage in the violet mist as his blade sliced toward the tendon", "steadying his breath until kinetic heat hummed along the steel").`;

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
export function getNarrationProseDirective(
  rawTone?: string,
  narrativeDepth: NarrativeDepthMode = "deep_novelistic"
): string {
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
   ${def.proseExample}`;
  } else {
    const customTone = rawTone?.trim() || "Grimdark & Atmospheric";
    styleBody = `--- MANDATORY PROSE & NARRATION DIRECTIVE: [${customTone.toUpperCase()}] ---
YOU MUST STRICTLY ADHERE TO THE TONE AND PROSE CONVENTIONS OF "${customTone}":
1. Consistently calibrate all environmental descriptions, sensory details, and character dialogue to faithfully reflect "${customTone}".
2. Dialogue and character voices must actively express the vocabulary, attitude, and emotional pacing inherent to "${customTone}".
3. Do not revert to generic stock narration; let "${customTone}" guide the sentence rhythm, word choice, and narrative tension across all generated prose.`;
  }

  return `${styleBody}

${getNarrativeDepthDirective(narrativeDepth)}

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
