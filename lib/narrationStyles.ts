/**
 * Narration Styles & Prose Directives Engine for Astra Chronicles
 * Strictly shapes the Game Master, Narrator, and World Engine prose
 * across character creation, prologue generation, dynamic choices, and interactive turns.
 */

export type NarrationStyleKey =
  | "grimdark"
  | "light_novel"
  | "noir"
  | "coastal_romcom"
  | "tactical_survival"
  | "custom";

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
  coastal_romcom: {
    id: "coastal_romcom",
    label: "Sun-Drenched Coastal Rom-Com (Sparkling banter, sensory warmth, romantic tension)",
    badgeLabel: "Coastal Rom-Com & Flair",
    shortDescription: "Sunlit Mediterranean slice-of-life, witty rom-com banter, culinary flair & heart-fluttering proximity",
    corePhilosophy: "Vibrant, sun-drenched coastal slice-of-life romantic comedy meets high-flair culinary and social showdowns. The world is warm, glamorous, and brimming with electric interpersonal chemistry, boarding-house hijinks, and heartfelt vulnerability beneath proud facades.",
    sensoryTextures: "Luminous Mediterranean coastal sensations: golden-hour sunlight sparkling off turquoise harbor water, the rich aroma of freshly pulled espresso and sizzling garlic butter, sea-salt breezes rustling bougainvillea vines, chilled crystal cocktail glasses clinking under warm patio string lights, sudden close-proximity warmth and fluttering heartbeats.",
    dialogueCadence: "Sparkling, fast-paced romantic comedy banter with vivid emotional contrast: haughty heiresses cracking into flustered denials when fed midnight comfort food, teasing bartenders and patissiers losing their cool when counter-flirted, protective childhood friends pouting over shared aprons, and intimate late-night rooftop confessions.",
    combatAndAction: "High-flair, non-lethal Article 9 Turf Showdowns: dazzling culinary plating rushes, acrobatic beach volleyball spikes, bamboo shinai parries on the pier, and razor-sharp sommelier or audit table-turns that shatter opponent composure and send the crowd wild.",
    negativeConstraints: [
      "NEVER introduce grimdark gore, lethal violence, rotting corpses, or nihilistic despair.",
      "NEVER flatten the heroines' distinct rom-com contrast between their composed public personas and their flustered Blush Zone reactions.",
      "Keep all conflicts grounded in high-stakes coastal hospitality, social status wagers, culinary pride, and romantic tension.",
      "NEVER repeat the same prop-gag, food sip, or catchphrase across consecutive turns—vary sensory details, physical gestures, and banter topics every turn.",
    ],
    proseExample: `Warm afternoon sunlight danced across the terracotta tiles of the harbor terrace, catching the aromatic steam rising from the espresso machine as a sea breeze rustled the bougainvillea overhead. Across the counter, the visiting inspector paused mid-critique, her composed expression wavering for a heartbeat as the bright scent of roasted hazelnuts and orange zest drifted past.\n\n"I—I only stopped by to verify your terrace seating permit," she insisted, her voice pitching up a fraction as she quickly looked away from your knowing grin. "Do not assume a complimentary macchiato will earn your lounge any special leniency on the harbor register!"\n\nYet her fingers lingered against the warm porcelain cup a moment longer than strictly necessary, the rigid tension in her shoulders softening as the sound of acoustic guitars and laughter drifted up from the boardwalk below.`,
  },
  tactical_survival: {
    id: "tactical_survival",
    label: "Tactical Dungeon Survival (Tense, strategic, grounded human grit)",
    badgeLabel: "Tactical Dungeon Survival",
    shortDescription: "Korean tower-manhwa tension, sharp shot-calling, dark gacha irony & earned camaraderie",
    corePhilosophy: "High-stakes tower survival inspired by gripping Korean dungeon manhwa. Behind a cold glass sky sits an indifferent gacha Master treating living heroes like disposable pulls; down on the stone floors, every bad step is permanent. Survival is won through sharp observation, split-second callouts, gallows humor, and refusing to abandon low-star comrades.",
    sensoryTextures: "Cold obsidian lobby tiles under bare heels, pale cyan starlight humming from the Star Gate monolith, chalk maps smudged by bloodied thumbs, iron shield straps biting into bruised shoulders, the sudden hush before a Gate Boss breath attack, and warm campfire soup shared in Safe Zone caverns.",
    dialogueCadence: "Crisp, natural, human-sounding dialogue under real pressure: clipped battlefield callouts, dry gallows banter between survivors, stubborn pride cracking into raw trust around barracks hearths, and zero textbook speeches or robotic game-manual monologues.",
    combatAndAction: "Tight, spatial, tactical party choreography: reading monster aggro lines, baiting heavy swings into stone pillars, shielding fragile backline healers, and timing burst windows to the half-second because fallen teammates never respawn.",
    negativeConstraints: [
      "NEVER treat death lightly or suggest fallen heroes can be revived—permadeath is real and permanent.",
      "NEVER write silly slapstick during labyrinth combat or make characters sound like robotic Wikipedia articles.",
      "NEVER dump capitalized UI item labels or full character names repeatedly in prose; keep speech plain, sharp, and human.",
      "Preserve the stark contrast between the cold unseen Master's UI commands above and the warm, breathing humanity of the squad below.",
    ],
    proseExample: `Pale blue light pulsed once across the cracked flagstones, marking the six-second warning before the corridor grates flooded with acid mist. Sable didn't look up from the rusted latch she was prying loose with her dagger tip, though a bead of sweat cut a clean track through the soot on her jaw.\n\n"Tell me you've got an actual plan, One-Star, and you didn't just drag us down this side tunnel to die somewhere quieter," she muttered, her voice low and tight over the scrape of iron.\n\nThe lock snapped open half a heartbeat before the hiss of vapor rolled down the main hall. Pulling the heavy grate shut behind the squad, she leaned back against the cool stone, let out a long breath, and studied you with grudging disbelief. "Alright. Maybe you aren't total fodder after all. Next time, give me three seconds' warning before you pull a stunt like that."`,
  },
};

/**
 * Returns the explicit length, paragraphing, and multi-beat scene depth directive
 * corresponding to the active NarrativeDepthMode.
 */
export function getNarrativeDepthDirective(depth: NarrativeDepthMode = "deep_novelistic"): string {
  if (depth === "standard") {
    return `--- NARRATIVE DEPTH & RHYTHM: [SNAPPY OOC BANTER & TIGHT SCENE PACING (2–3 PARAGRAPHS)] ---
- Match the natural energy and pace of the player's action in 2 to 3 crisp, vivid paragraphs separated by clean line breaks (\\n\\n).
- Prioritize immediate physical action, unforced human dialogue in double quotes ("..."), and concrete scene momentum over lengthy environmental recap.`;
  }

  if (depth === "expansive") {
    return `--- NARRATIVE DEPTH & RHYTHM: [DYNAMIC SCENE & DIALOGUE CADENCE (3–4 PARAGRAPHS)] ---
- Unfold the turn naturally across 3 to 4 organic paragraphs (approx. 240–420 words) separated by clean line breaks (\\n\\n).
- Weave spoken dialogue ("...") directly into physical business, subtle micro-expressions, and live environmental interaction—never stop the scene dead for static internal essays.`;
  }

  return `--- NARRATIVE DEPTH & RHYTHM: [ELASTIC OOC.AI NOVELISTIC PERFORMANCE (DYNAMIC PACING)] ---
1. ELASTIC SCENE RHYTHM — NEVER PAD WITH FORMULAIC ESSAY FILLER:
   - Adapt paragraph count and pacing organically to the moment (typically **3 to 5 rich, tight paragraphs**, expanding to 6 only for major boss climaxes, arrivals, or emotional turning points; tightening to 2–3 punchy paragraphs during rapid-fire banter or split-second combat callouts).
   - NEVER follow a robotic 4-step school-essay template ("Paragraph 1 weather recap -> Paragraph 2 micro-expression checklist -> Paragraph 3 speech -> Paragraph 4 summary hook"). Jump straight into the live friction, physical consequence, or spoken reaction that feels most immediate and human!
2. SHOW SUBTEXT THROUGH PHYSICAL BUSINESS, NOT EXPLANATION:
   - Real characters do things with their hands and bodies while talking—tightening a shield strap, checking a doorway, rationing water, nursing a bruised knuckle, or refusing eye contact. Let subtext breathe without explaining the joke or spelling out their psychology to the reader.
3. AUTONOMOUS CHARACTER AGENCY & ANTI-ECHO RULE:
   - NEVER repeat or paraphrase the player's own dialogue/action back to them before reacting.
   - Characters have their own immediate agendas, doubts, humor, and boundaries—they interrupt, tease, push back, ask unexpected questions, or change the subject when something matters to them.
4. NATURAL ENDING MOMENTUM:
   - End on an organic beat—an unspoken gesture, an interrupted silence, a sharp question, or an imminent threat—rather than a repetitive "What will you do next?" narrator summary.`;
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
   - FIRST NAMES OVER FULL NAMES: In narrative prose, action beats, dialogue tags, spoken dialogue, and choices, ALWAYS refer to the protagonist and companions by their **first name** (e.g., "Kaedrel", "Cassia", "Beatrix", "Ysolde", "Kestrel", "Aurelia", "Miri", "Noelle", "Valeria", "Seraphina", "Vivienne", "Mia", "Colette", "Pippa", "Kaede", "Roxy", "Chloe", "Nadia", "Zuri", "Evelyn", "Aria") or natural pronouns once introduced. NEVER robotically repeat full first+last names ("Kaedrel Victus", "Ysolde Kaelen", "Seraphina Vane", "Nadia Saint-Clair") or append parenthetical rank tags like "(#184)", "(#142)", or "(#42)" in story prose or dialogue.
   - DESCRIBE ITEMS & GEAR NATURALLY — NEVER PASTE INVENTORY LABELS: Do NOT copy-paste capitalized multi-word UI equipment names into prose or dialogue (e.g., NEVER write "He drew his Concealed Punch-Dagger & Curved Mist-Saber", "adjusted his Iron-Grey Initiate Greatcoat & Brigandine", or "channeled his Fractured Ashen Legion Spine-Node"). Instead, write like a human novelist by referring to items naturally and descriptively ("his curved saber", "the punch-dagger at his belt", "his heavy coat", "the tarnished ring on his thumb", "her brass-bound ledger").
   - REFER TO LOCATIONS ORGANICALLY — NEVER REPEAT MAP BANNERS: Do NOT repeat full capitalized location headers ("The Sky-Crown & Sovereign Terraces", "Stratum I: The Sunken Cloisters", "The Velvet Spill & The Tribunal Pit", "The Seal-Gate & Boarding Quays") in every paragraph or spoken sentence. Refer to the physical space naturally ("the amphitheater", "the flooded cloisters", "the sunken pit", "the boarding quay", "the iron cage", "this sanctum").
   - SHOW TECHNIQUES & MAGIC THROUGH SENSORY ACTION, NOT SKILL-SLOT NAMES: Do NOT insert capitalized RPG skill titles or mechanical jargon into narrative sentences (e.g., avoid writing "executing a Mist-Mirage Tendon Sever" or "using Path A: Somatic Tempering"). Describe the physical movement, breath, light, and impact organically ("leaving a fleeting afterimage in the violet mist as his blade sliced toward the tendon", "steadying his breath until kinetic heat hummed along the steel").
6. SPOKEN DIALOGUE REALISM, CLARITY & HUMAN CADENCE (CRITICAL):
   - CONTRAST LITERARY PROSE WITH NATURAL SPOKEN SPEECH: While narrative prose should be atmospheric and vivid, all spoken dialogue inside quotation marks ("...") MUST sound like a real human being talking aloud in the moment—clear, decipherable, conversational, and grounded.
   - NO TEXTBOOK JARGON OR THESAURUS MONOLOGUES: Characters must NEVER speak in multi-clause academic essays, dictionary definitions, or clinical jargon dumps (e.g., NEVER write stiff lines like "The arborio starch emulsion is unexpectedly intimate", "provided you do not confuse my temporary acquiescence with subservience", "drive a half-sword thrust through its cervical seal", or "negative seventeen frame advantage on block").
   - NATURAL CONTRACTIONS & HUMAN RHYTHM: Unless a character is speaking a formal oath, use natural spoken contractions ("don't", "you're", "I'll", "it's", "can't") and concise, punchy sentences. Let a character's pride, intelligence, coldness, or shyness shine through their attitude, subtext, and timing—not by stuffing their mouth with ten-dollar words.
   - SHOW EXPERTISE THROUGH CONFIDENCE, NOT BUZZWORDS: A noblewoman, sommelier, knight, or scholar shows her status through sharp observation and effortless poise, speaking in plain, cutting, or warm human sentences that anyone can immediately understand.`;

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
    s.includes("tactical") ||
    s.includes("dungeon survival") ||
    s.includes("starfall") ||
    s.includes("gacha") ||
    s.includes("labyrinth")
  ) {
    return "tactical_survival";
  }
  if (
    s.includes("coastal") ||
    s.includes("rom-com") ||
    s.includes("romcom") ||
    s.includes("sparkling") ||
    s.includes("slice-of-life") ||
    s.includes("port solaris")
  ) {
    return "coastal_romcom";
  }
  if (
    s.includes("light_novel") ||
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
6. TARGET PROSE CADENCE REFERENCE (STYLE & RHYTHM DEMONSTRATION ONLY — NEVER COPY PHRASES, PROPS, OR DIALOGUE FROM THIS SAMPLE INTO LIVE TURNS):
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
  if (key === "tactical_survival") {
    return `Generate 4 distinct, plot-advancing player action choices reflecting Tactical Dungeon Survival: (1) calling a sharp tactical/meta-knowledge play to clear the immediate floor or objective, (2) checking in on or protecting a squadmate to build real trust, (3) taking a bold combat or Command Seal loophole risk, and (4) advancing to the next floor/zone or returning to Star Gate Plaza (Main Lobby).`;
  }
  if (key === "coastal_romcom") {
    return `Generate 4 distinct, plot-advancing player action choices reflecting a Sun-Drenched Coastal Rom-Com & Flair Showdown dynamic: (1) completing the active quest objective or sealing a deal/wager, (2) physically moving to a new island/café location, (3) triggering a hands-on culinary/social showdown or decisive action, and (4) shifting the scene dynamic or bringing in a new activity/character. Never offer 4 stationary banter-only options.`;
  }
  if (key === "light_novel") {
    return `Generate 4 distinct, plot-advancing player action choices reflecting a Light Novel / High Fantasy dynamic: proactive, kinetic, and story-driving—advancing quest objectives, transitioning locations, escalating stakes, and initiating decisive action rather than stalling in small talk.`;
  }
  if (key === "noir") {
    return `Generate 4 distinct, plot-advancing player action choices reflecting a Noir Arcana style: sharp, street-smart underworld maneuvers that close deals, move to new sectors, press critical leads, or escalate the investigation.`;
  }
  return `Generate 4 distinct, plot-advancing player action choices reflecting a Grimdark & Atmospheric style: decisive, calculated actions that advance active objectives, move across sectors, confront hazards, and drive the story forward.`;
}
