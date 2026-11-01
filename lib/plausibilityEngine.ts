/**
 * Causal Plausibility & Character Capability Engine
 *
 * Evaluates actions against the protagonist's authentic fantasy biology,
 * non-human lineage (Beastkin/Lycan, Dragonborn, High Elf, Demonkin, Vampire, Custom),
 * attributes (STR, DEX, INT), class archetype, active stance, and equipped relics.
 *
 * Strictly prevents the Game Master LLM from applying mortal Earth-human physiological
 * limits to non-human or superhuman fantasy characters.
 */

export interface PlausibilityCharacterContext {
  name?: string;
  role?: string;
  race?: string;
  racialTraits?: string[];
  level?: number;
  stats?: {
    str?: number;
    dex?: number;
    int?: number;
  };
  gear?: {
    weapon?: string;
    armor?: string;
    relic?: string;
  };
  abilities?: string[];
  activeStance?: string;
}

/**
 * Resolves the specific biological & supernatural capability profile for a given race/lineage.
 */
export function getLineageCapabilityProfile(race?: string, racialTraits?: string[]): string {
  const normRace = (race || "Human").trim().toLowerCase();
  const traitsList = Array.isArray(racialTraits) && racialTraits.length > 0
    ? racialTraits.join(", ")
    : "Standard physiology";

  if (
    normRace.includes("lycan") ||
    normRace.includes("beast") ||
    normRace.includes("wolf") ||
    normRace.includes("lupine") ||
    normRace.includes("feline") ||
    normRace.includes("kitsune") ||
    normRace.includes("fox") ||
    normRace.includes("tig")
  ) {
    return `SUPERHUMAN BEASTKIN / LYCAN PHYSIOLOGY (${race} — Traits: ${traitsList}):
  * Digitigrade & Quadruped Leaping: Possesses dense lupine/feline musculature and spring-loaded digitigrade tendons. Leaping 20 to 40+ feet across rooftops, chasms, or vertical walls is 100% NATURAL, GROUNDED, and EFFORTLESS.
  * Apex Sprint & Reflexes: Can burst-sprint at speeds far exceeding mortal horses, scale sheer stone/wood with claws, land from high stories without injury, and dodge projectiles by ear-twitch and scent.
  * Predatory Senses & Natural Weapons: Razor fangs and claws can rend iron chainmail or timber; heightened olfactory and auditory tracking can pinpoint heartbeats, blood, or poison through walls and fog.
  * STRICT RULE: NEVER penalize jumping, climbing, sprinting, clawing, or sensory feats as "exceeding human limits"—this character is a superhuman Beastkin/Lycan!`;
  }

  if (normRace.includes("dragon") || normRace.includes("dracon") || normRace.includes("wyrm")) {
    return `SUPERHUMAN DRAGONBORN PHYSIOLOGY (${race} — Traits: ${traitsList}):
  * Draconic Might & Scales: Hardened dermal scales deflect mundane blades and arrows; possesses immense draconic physical strength capable of shattering stone, snapping chains, and overpowering massive beasts.
  * Thermal & Elemental Furnace: Innate resistance to extreme heat, fire, and elemental shockwaves; capable of channeling draconic breath, intimidating roars, and heavy shockwave landings.
  * Wing / Tail Equilibrium: If winged or tailed, can glide across chasms, buffer terminal falls, and sweep multiple foes off their feet.
  * STRICT RULE: NEVER judge physical durability, strength, or thermal endurance by fragile human standards!`;
  }

  if (normRace.includes("elf") || normRace.includes("elven") || normRace.includes("fae") || normRace.includes("astral") || normRace.includes("sylvan")) {
    return `SUPERHUMAN HIGH ELVEN / ASTRAL PHYSIOLOGY (${race} — Traits: ${traitsList}):
  * Weightless Acrobatics & Equilibrium: Centuries-honed neuromuscular grace allows running across thin branches, tightropes, or crumbling ledges, silent parkour, and 25+ foot agile vaults.
  * Astral & Mana Perception: Innately perceives ambient mana threads, illusions, spatial wards, and unseen spiritual entities without needing incantations.
  * STRICT RULE: NEVER penalize extreme acrobatic grace, silent movement, or mana perception as unrealistic!`;
  }

  if (normRace.includes("demon") || normRace.includes("fiend") || normRace.includes("tiefling") || normRace.includes("abyss") || normRace.includes("succub") || normRace.includes("incub")) {
    return `SUPERHUMAN DEMONKIN / ABYSSAL PHYSIOLOGY (${race} — Traits: ${traitsList}):
  * Abyssal Physique & Darkvision: Thrives in pitch darkness, endures lethal toxins/curses, and channels hellish physical force and shadow-stepping mobility.
  * Predatory Presence: Horned/winged/tailed anatomy allows intimidating aerial drops, shadow melding, and ruthless close-quarters devastation.
  * STRICT RULE: NEVER apply mortal human frailty to an Abyssal/Demonkin entity!`;
  }

  if (normRace.includes("vamp") || normRace.includes("dhampir") || normRace.includes("nosferatu") || normRace.includes("blood") || normRace.includes("undead") || normRace.includes("revenant")) {
    return `SUPERHUMAN VAMPIRIC / IMMORTAL PHYSIOLOGY (${race} — Traits: ${traitsList}):
  * Blur-Speed & Vertical Scaling: Preternatural celerity allows vanishing from mortal sight, leaping across wide rooftops, scaling vertical masonry, and regenerating from lacerations.
  * Sanguine Senses: Detects pulse rates, adrenaline, and bloodlines from afar; possesses crushing immortal grip strength.
  * STRICT RULE: NEVER penalize superhuman speed, leaping, or nocturnal perception!`;
  }

  if (normRace !== "human" || (Array.isArray(racialTraits) && racialTraits.length > 0)) {
    return `CUSTOM / NON-HUMAN FANTASY LINEAGE (${race || "Exotic Lineage"} — Traits: ${traitsList}):
  * Innate Biological Capabilities: Every anatomical feature listed in [${traitsList}] grants full superhuman physical, sensory, and environmental mastery matching that biology (e.g. leaping, flight, armor plating, venom, night vision, regeneration, amphibious breathing, or brute force).
  * STRICT RULE: Evaluate all physical actions against their ${race || "Custom"} physiology and traits [${traitsList}], NEVER baseline human limits!`;
  }

  return `FANTASY ASCENDANT PHYSIOLOGY (Lineage: ${race || "Human"} — Traits: ${traitsList}):
  * Even as a Human in Astra's LitRPG mana-saturated cosmos, a leveled combatant channels mana through their muscles, bones, and stance—far surpassing mundane real-world physics.`;
}

/**
 * Builds the comprehensive Causal Plausibility & Character Capability Envelope directive for `/api/turn`.
 */
export function buildPlausibilityCapabilityEnvelope(
  playerProfile: PlausibilityCharacterContext,
  activeStance?: string,
  storyGenre?: string
): string {
  const name = playerProfile?.name || "Protagonist";
  const role = playerProfile?.role || "Adventurer";
  const race = playerProfile?.race || "Human";
  const level = playerProfile?.level || 1;
  const str = playerProfile?.stats?.str ?? 10;
  const dex = playerProfile?.stats?.dex ?? 10;
  const int = playerProfile?.stats?.int ?? 10;
  const stance = (activeStance || playerProfile?.activeStance || "neutral").toUpperCase();
  const abilities = Array.isArray(playerProfile?.abilities) && playerProfile.abilities.length > 0
    ? playerProfile.abilities.join(", ")
    : "Innate Class & Stance Arts";
  const gearSummary = playerProfile?.gear
    ? `Weapon: ${playerProfile.gear.weapon || "Unarmed"} | Armor: ${playerProfile.gear.armor || "None"} | Relic: ${playerProfile.gear.relic || "None"}`
    : "Standard Loadout";

  const lineageProfile = getLineageCapabilityProfile(race, playerProfile?.racialTraits);

  const strTier =
    str >= 16
      ? `APEX SUPERHUMAN MIGHT (STR ${str}): Can shatter stone walls, bend iron bars, cleave armored foes in two, and leap with explosive kinetic force.`
      : str >= 13
      ? `ENHANCED FANTASY STRENGTH (STR ${str}): Can splinter heavy oak doors, overpower multiple armed guards, and haul massive loads.`
      : `COMBAT-CONDITIONED STRENGTH (STR ${str}): Solid martial striking and grappling power.`;

  const dexTier =
    dex >= 16
      ? `APEX SUPERHUMAN AGILITY (DEX ${dex}): Can vault 30+ feet across rooftops, run along walls, deflect projectiles mid-air, and move faster than the human eye can track.`
      : dex >= 13
      ? `ENHANCED FANTASY AGILITY (DEX ${dex}): Capable of 20+ foot acrobatic leaps, silent rooftop traversal, and razor-sharp evasive footwork.`
      : `NIMBLE MARTIAL REFLEXES (DEX ${dex}): Trained combat acrobatics and balanced footing.`;

  const intTier =
    int >= 16
      ? `ARCHMAGE / GENIUS COGNITION (INT ${int}): Instantaneous tactical deduction, complex spell-weaving, and arcane ward manipulation.`
      : int >= 13
      ? `HIGH ARCANE & TACTICAL ACUMEN (INT ${int}): Rapid battlefield analysis and mana channeling.`
      : `FOCUSED COMBAT AWARENESS (INT ${int}): Grounded tactical judgment.`;

  return `--- CAUSAL PLAUSIBILITY & CHARACTER CAPABILITY BASELINE (CRITICAL) ---
You MUST evaluate "system_updates.plausibility_delta" and physical action outcomes against ${name}'s FULL FANTASY CONTEXT (${storyGenre || "Dark Fantasy LitRPG"}):

1. ${lineageProfile}
2. CLASS & ARCHETYPE MASTERY (Lv.${level} ${role} | Active Stance: [${stance}]):
   - Unlocked Arts & Abilities: [${abilities}]
   - Equipped Loadout: [${gearSummary}]
   - Actions utilizing ${role} training, [${stance}] stance aura, or [${abilities}] are 100% PLAUSIBLE and GROUNDED.
3. ATTRIBUTE CAPABILITY THRESHOLDS:
   - ${strTier}
   - ${dexTier}
   - ${intTier}
4. STRICT PLAUSIBILITY EVALUATION RULES:
   - NEVER APPLY MUNDANE EARTH-HUMAN LIMITS: Do NOT penalize ${name} for superhuman jumps, rooftop leaps, wall-scaling, scent tracking, night vision, claw/fang strikes, or mana-assisted feats that align with their ${race} lineage, ${role} class, or stats (STR ${str}, DEX ${dex}, INT ${int}).
   - REWARD AUTHENTIC CAPABILITIES (plausibility_delta: +1 to +4): Whenever ${name} leverages their ${race} physiology, [${ (playerProfile?.racialTraits || []).join(", ") || race }], class skills, or tactical environment, award +1 to +4 plausibility!
   - WHEN TO PENALIZE (plausibility_delta: -5 to -15): ONLY deduct plausibility for genuine narrative contradictions or god-moding absurdities (e.g., claiming to instantly vaporize a city at Lv.1 with a finger snap, summoning a spaceship in a medieval dungeon, or swimming in molten lava without fire immunity).
   - FORBIDDEN RATIONALE: Never write "exceeded human limits", "impossible for a human", or "unrealistic jump/speed" in "plausibility_reason" or "mechanics".`;
}

/**
 * Server-side failsafe interceptor that inspects the LLM's returned `system_updates`
 * and neutralizes hallucinated "human limit" or physical-feat penalties when the character
 * possesses non-human lineage, superhuman attributes, or fantasy class capabilities.
 */
export function sanitizePlausibilityEvaluation(
  systemUpdates: any,
  playerProfile: PlausibilityCharacterContext,
  actionText: string = ""
): any {
  if (!systemUpdates || typeof systemUpdates !== "object") {
    return systemUpdates;
  }

  const delta = Number(systemUpdates.plausibility_delta || 0);
  const reason = String(systemUpdates.plausibility_reason || "");
  const announcement = String(systemUpdates.system_announcement || "");
  const combinedText = `${reason} ${announcement} ${actionText}`.toLowerCase();

  const race = (playerProfile?.race || "Human").trim();
  const isNonHuman =
    race.toLowerCase() !== "human" ||
    (Array.isArray(playerProfile?.racialTraits) && playerProfile.racialTraits.length > 0);
  const hasSuperStats =
    (playerProfile?.stats?.str ?? 10) >= 12 ||
    (playerProfile?.stats?.dex ?? 10) >= 12 ||
    (playerProfile?.stats?.int ?? 10) >= 12 ||
    (playerProfile?.level ?? 1) >= 2;

  // Detect false-positive "human limit" or physical jump/sprint/strength penalties
  const mentionsHumanLimits =
    /exceed\w*\s+human|human\s+limit|human\s+biolog|human\s+physiol|mortal\s+limit|impossible\s+for\s+a\s+human|beyond\s+human|unrealistic\s+jump|impossible\s+leap|impossible\s+jump|defies\s+gravity|superhuman\s+leap/i.test(
      `${reason} ${announcement}`
    );

  const isAthleticOrRacialFeat =
    /\b(jump\w*|leap\w*|vault\w*|bound\w*|sprint\w*|climb\w*|scale\w*|scent|smell|fang\w*|claw\w*|rooftop|chasm|gap|wall|landing|reflex\w*|agilit\w*)\b/i.test(
      combinedText
    );

  if (delta < 0 && (mentionsHumanLimits || (isAthleticOrRacialFeat && (isNonHuman || hasSuperStats)))) {
    const traitLabel =
      Array.isArray(playerProfile?.racialTraits) && playerProfile.racialTraits.length > 0
        ? playerProfile.racialTraits[0]
        : `${race} physiology`;

    return {
      ...systemUpdates,
      plausibility_delta: 2,
      plausibility_reason: `Action verified against ${race} capability baseline (${traitLabel}) and ${playerProfile?.role || "Class"} conditioning.`,
      system_announcement:
        mentionsHumanLimits || announcement.toLowerCase().includes("penalty") || announcement.toLowerCase().includes("limit")
          ? `[SYSTEM: ${race.toUpperCase()} PHYSIOLOGY SYNCHRONIZED • CAUSAL PLAUSIBILITY +2%]`
          : systemUpdates.system_announcement,
    };
  }

  return systemUpdates;
}

