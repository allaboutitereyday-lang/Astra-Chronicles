// Core Progression Mechanics & System Protocols for Astra Chronicles
// Handles Companion Resonance, Skill Evolution, Combat Stances, Cursed Relics, Camp Gifting, and Death Regressions

import { 
  CompanionAffectionTier, 
  CompanionResonanceAbilities, 
  ActiveTrialCompanion, 
  CombatStanceType, 
  CombatStanceConfig, 
  AbilityEvolutionPath, 
  StoryRelicItem, 
  GiftItemRecord, 
  TimelineEcho, 
  PlayerProfile,
  StoryCompanion
} from "@/types/story";

export type { ActiveTrialCompanion, CombatStanceType, CombatStanceConfig, GiftItemRecord };
export { 
  PREDEFINED_TRIAL_MODIFIERS, 
  getSectorModifierById, 
  getRandomSectorModifier, 
  getSectorModifiersForRun, 
  getDiscoveredCompanions 
} from "./trialModifiers";
import { DeathRegressionRecord, PenaltyScenarioState } from "@/types/system";

// ============================================================================
// 1. COMPANION AFFECTION TIERS & TRIALS RESONANCE
// ============================================================================

export function getCompanionAffectionTier(affection: number): CompanionAffectionTier {
  if (affection >= 90) return "Sworn Partner";
  if (affection >= 75) return "Beloved";
  if (affection >= 25) return "Confidant";
  if (affection >= 10) return "Acquaintance";
  return "Stranger";
}

export const KNOWN_COMPANION_RESONANCE: Record<string, CompanionResonanceAbilities> = {
  aria: {
    confidantPassive: {
      name: "Aegis of the Dawn",
      description: "Every 3 turns or when protagonist HP drops below 40%, Aria weaves a radiant barrier absorbing 35 damage and cleansing debuffs.",
      triggerCondition: "crisis_hp",
      value: 35,
      type: "shield",
    },
    belovedUltimate: {
      name: "Dawnfire Cataclysm: Solar Severance",
      description: "Aria unsheathes her sacred blade in synchronization with the protagonist, detonating a concentrated solar pillar that burns the enemy for 3.4x damage and inflicts a 1-turn Solar Stun.",
      mpCost: 28,
      multiplier: 3.4,
      inflictsStun: true,
      voiceLine: "Together through the ash—Dawnfire, incinerate their reality!",
      animationKey: "aria_dawnfire",
    },
  },
  morgana: {
    confidantPassive: {
      name: "Umbral Veil Siphon",
      description: "When the protagonist strikes, Morgana siphons ambient void energy, restoring 20 HP and 10 MP every 2 turns.",
      triggerCondition: "interval",
      value: 20,
      type: "heal",
    },
    belovedUltimate: {
      name: "Umbral Eclipse Stun: Void Nova",
      description: "Morgana collapses planar light around the target, dealing 3.6x void damage and stunning the enemy for 1 turn while opening an anti-matter vulnerability.",
      mpCost: 32,
      multiplier: 3.6,
      inflictsStun: true,
      voiceLine: "Let the dark embrace you... Sleep beneath the shattered stars.",
      animationKey: "morgana_eclipse",
    },
  },
  lyra: {
    confidantPassive: {
      name: "Starlight Ward: Prismatic Sync",
      description: "At the start of each sector battle or when critically wounded, Lyra weaves starlight wards granting a 40 HP temporary shield.",
      triggerCondition: "crisis_hp",
      value: 40,
      type: "shield",
    },
    belovedUltimate: {
      name: "Celestial Supernova Convergence",
      description: "Lyra harnesses planetary ley-lines to unleash a blinding cosmic beam dealing 3.5x radiant damage with guaranteed stagger.",
      mpCost: 30,
      multiplier: 3.5,
      inflictsStun: true,
      voiceLine: "The stars align for us! Behold the celestial horizon!",
      animationKey: "lyra_supernova",
    },
  },
};

export function getCompanionResonance(companion: StoryCompanion | any): CompanionResonanceAbilities {
  if (!companion) {
    return {
      confidantPassive: {
        name: "Allied Bulwark",
        description: "Grants a periodic 20 HP shield when under attack.",
        triggerCondition: "interval",
        value: 20,
        type: "shield",
      },
      belovedUltimate: {
        name: "Synchronized Strike",
        description: "Deals 2.8x damage with an allied tag-team burst.",
        mpCost: 25,
        multiplier: 2.8,
        inflictsStun: false,
        voiceLine: "Strike now, with all your might!",
      },
    };
  }

  const nameKey = companion.name?.toLowerCase().trim() || "";
  for (const [key, resonance] of Object.entries(KNOWN_COMPANION_RESONANCE)) {
    if (nameKey.includes(key)) return resonance;
  }

  // Procedural resonance for custom companions
  return {
    confidantPassive: {
      name: `${companion.name}'s Guardian Oath`,
      description: `Whenever HP falls below 40%, ${companion.name} deploys protective resonance, absorbing 25 damage.`,
      triggerCondition: "crisis_hp",
      value: 25,
      type: "shield",
    },
    belovedUltimate: {
      name: `${companion.name}'s Awakened Duo Resonance`,
      description: `Channel full emotional resonance with ${companion.name} to deal 3.2x critical damage and interrupt the target.`,
      mpCost: 28,
      multiplier: 3.2,
      inflictsStun: true,
      voiceLine: `By our bond, this ends here!`,
      animationKey: "custom_resonance",
    },
  };
}

export function buildActiveTrialCompanion(companion: StoryCompanion | any): ActiveTrialCompanion {
  const aff = typeof companion.affection === "number" ? companion.affection : 0;
  const tier = getCompanionAffectionTier(aff);
  const resonance = companion.resonanceAbilities || getCompanionResonance(companion);

  return {
    id: companion.id || companion.name,
    name: companion.name,
    role: companion.role || "Companion",
    affection: aff,
    tier,
    color: companion.color || "purple",
    avatarUrl: companion.baseImageUrl || companion.expressions?.neutral,
    resonance,
  };
}

// ============================================================================
// 2. COMBAT STANCES & MODE TOGGLES (Pillar 2)
// ============================================================================

export const COMBAT_STANCES: Record<CombatStanceType, CombatStanceConfig> = {
  neutral: {
    id: "neutral",
    name: "Balanced Flow",
    element: "Physical",
    modifierLabel: "Standard damage output, balanced resource expenditure",
    bonusStaggerRate: 0,
    bonusDotDamage: 0,
    damageMultiplier: 1.0,
    icon: "Shield",
  },
  frost: {
    id: "frost",
    name: "Frost Infusion",
    element: "Frost",
    modifierLabel: "+35% Stagger Rate • Reduces enemy lethality by 15%",
    bonusStaggerRate: 0.35,
    bonusDotDamage: 0,
    damageMultiplier: 0.95,
    icon: "Zap",
  },
  flame: {
    id: "flame",
    name: "Flame Infusion",
    element: "Flame",
    modifierLabel: "+25% Burn Damage over time • +15% Direct Damage",
    bonusStaggerRate: 0.05,
    bonusDotDamage: 0.25,
    damageMultiplier: 1.15,
    icon: "Flame",
  },
  phase: {
    id: "phase",
    name: "Phase Shift Stance",
    element: "Void",
    modifierLabel: "+20% Evasion / Counter Chance • Void attacks bypass 20% armor",
    bonusStaggerRate: 0.15,
    bonusDotDamage: 0.1,
    damageMultiplier: 1.1,
    icon: "Sparkles",
  },
  graviton: {
    id: "graviton",
    name: "Graviton Collapse",
    element: "Void",
    modifierLabel: "+40% Stagger Burst • High impact critical vulnerability",
    bonusStaggerRate: 0.4,
    bonusDotDamage: 0.05,
    damageMultiplier: 1.2,
    icon: "Target",
  },
  shadow: {
    id: "shadow",
    name: "Shadowstalker Cloak",
    element: "Shadow",
    modifierLabel: "+30% Critical Hit Chance • -10% Armor Defense",
    bonusStaggerRate: 0.2,
    bonusDotDamage: 0.15,
    damageMultiplier: 1.25,
    icon: "Crosshair",
  },
};

export function getAvailableStancesForRole(role?: string): CombatStanceType[] {
  // Universal Combat Stances: All classes have access to the complete 6-stance matrix.
  // Order prioritizes class affinity while guaranteeing universal tactical access.
  const r = (role || "").toLowerCase();
  if (r.includes("spell") || r.includes("blade") || r.includes("mage")) {
    return ["neutral", "flame", "frost", "phase", "shadow", "graviton"];
  }
  if (r.includes("void") || r.includes("singularity") || r.includes("chrono")) {
    return ["neutral", "phase", "graviton", "flame", "frost", "shadow"];
  }
  if (r.includes("rogue") || r.includes("assassin") || r.includes("shadow")) {
    return ["neutral", "shadow", "phase", "flame", "frost", "graviton"];
  }
  return ["neutral", "flame", "frost", "phase", "shadow", "graviton"];
}

// ============================================================================
// 3. CLASS ABILITY AWAKENING & SKILL EVOLUTION (Pillar 2)
// ============================================================================

export const CLASS_ABILITY_EVOLUTIONS: Record<string, AbilityEvolutionPath[]> = {
  voidstrider: [
    {
      baseAbilityName: "Void Cleave",
      adept: {
        requiredLevel: 5,
        tier: "Adept",
        name: "Spatial Rift Slash",
        description: "Cleaves through dimensional strata, dealing 1.45x void damage and shearing planar defense.",
        damageMultiplier: 1.45,
        cost: "14 MP",
      },
      master: {
        requiredLevel: 10,
        tier: "Master",
        name: "Event Horizon Cleave",
        description: "Collapses a black hole singularity upon impact, dealing 2.3x catastrophic void damage with guaranteed stagger.",
        damageMultiplier: 2.3,
        cost: "22 MP",
      },
    },
    {
      baseAbilityName: "Phase Shift",
      adept: {
        requiredLevel: 5,
        tier: "Adept",
        name: "Quantum Phase Slip",
        description: "Displaces body into the sub-void, completely dodging incoming fatal blow and restoring 25 MP.",
        damageMultiplier: 0,
        cost: "12 MP",
      },
      master: {
        requiredLevel: 10,
        tier: "Master",
        name: "Dimensional Singularity Step",
        description: "Vanishes into void vacuum, emerging behind enemy for an automatic counter-crit dealing 1.8x damage.",
        damageMultiplier: 1.8,
        cost: "18 MP",
      },
    },
  ],
  spellblade: [
    {
      baseAbilityName: "Aether Edge",
      adept: {
        requiredLevel: 5,
        tier: "Adept",
        name: "Prismatic Runeblade",
        description: "Infuses weapon with multi-elemental aether, dealing 1.5x damage across frost and flame spectrums.",
        damageMultiplier: 1.5,
        cost: "15 MP",
      },
      master: {
        requiredLevel: 10,
        tier: "Master",
        name: "Calamity Spellforge Tempest",
        description: "Overclocks runic circuits to unleash a devastating elemental storm for 2.4x damage, shredding enemy shields.",
        damageMultiplier: 2.4,
        cost: "24 MP",
      },
    },
  ],
  celestial: [
    {
      baseAbilityName: "Starlight Pulse",
      adept: {
        requiredLevel: 5,
        tier: "Adept",
        name: "Supernova Ray",
        description: "Focuses stellar energy into a searing laser beam, dealing 1.6x radiant damage.",
        damageMultiplier: 1.6,
        cost: "16 MP",
      },
      master: {
        requiredLevel: 10,
        tier: "Master",
        name: "Cosmic Genesis Cataclysm",
        description: "Summons a constellation burst that blankets the battlefield for 2.5x arcane radiant damage.",
        damageMultiplier: 2.5,
        cost: "26 MP",
      },
    },
  ],
  shadow: [
    {
      baseAbilityName: "Shadow Puncture",
      adept: {
        requiredLevel: 5,
        tier: "Adept",
        name: "Umbral Heartseeker",
        description: "Strikes from the blind spot with lethal precision, dealing 1.65x critical puncture damage.",
        damageMultiplier: 1.65,
        cost: "14 MP",
      },
      master: {
        requiredLevel: 10,
        tier: "Master",
        name: "Void Execution Flurry",
        description: "Delivers seven micro-strikes from within shadows for 2.6x fatal assassination damage.",
        damageMultiplier: 2.6,
        cost: "22 MP",
      },
    },
  ],
};

export function resolveEvolvedAbilityName(baseName: string, level: number, role?: string): { name: string; tier: string; description?: string } {
  const roleKey = (role || "").toLowerCase();
  let matchedGroup: AbilityEvolutionPath[] | null = null;

  for (const [key, paths] of Object.entries(CLASS_ABILITY_EVOLUTIONS)) {
    if (roleKey.includes(key)) {
      matchedGroup = paths;
      break;
    }
  }

  // Fallback to voidstrider or spellblade if no direct match
  if (!matchedGroup) {
    matchedGroup = CLASS_ABILITY_EVOLUTIONS.voidstrider;
  }

  const path = matchedGroup.find((p) => p.baseAbilityName.toLowerCase() === baseName.toLowerCase());
  if (!path) {
    return { name: baseName, tier: "Novice" };
  }

  if (level >= path.master.requiredLevel) {
    return { name: path.master.name, tier: path.master.tier, description: path.master.description };
  }
  if (level >= path.adept.requiredLevel) {
    return { name: path.adept.name, tier: path.adept.tier, description: path.adept.description };
  }

  return { name: baseName, tier: "Novice" };
}

// ============================================================================
// 4. CURSED RELICS & PENALTY SCENARIO REWARDS (Pillar 3)
// ============================================================================

export const CURSED_RELIC_TABLE: StoryRelicItem[] = [
  {
    id: "relic_cursed_void_heart",
    name: "Heart of the Nether Void",
    type: "relic",
    rarity: "cursed",
    description: "A pulsating obsidian orb salvaged from the collapsed Dimensional Void Rift. Radiates immense anti-matter resonance.",
    effect: "+50% Critical Damage • [Curse] 15% recoil damage each combat turn",
    cursedEffect: {
      positiveBuff: "+50% Critical Damage bonus",
      cursePenalty: "Take 15% recoil damage of damage dealt each turn",
      critMultiplierBonus: 0.5,
      recoilDamagePercent: 0.15,
    },
    isGiftable: false,
  },
  {
    id: "relic_cursed_chronos_hourglass",
    name: "Chronos' Fractured Hourglass",
    type: "relic",
    rarity: "cursed",
    description: "An ancient artifact leaking golden temporal dust. Bends localized entropy at the cost of the wielder's vitality.",
    effect: "+30% Skill Damage & Instant Cooldowns • [Curse] -5 MP drain per turn",
    cursedEffect: {
      positiveBuff: "+30% Skill Damage with reduced cooldowns",
      cursePenalty: "Drains 5 MP every combat turn",
      critMultiplierBonus: 0.3,
      mpDrainPerTurn: 5,
    },
    isGiftable: false,
  },
  {
    id: "relic_cursed_blood_sigil",
    name: "Sigil of Causal Sacrilege",
    type: "relic",
    rarity: "cursed",
    description: "Forged in the heart of a failed timeline regression. Infuses weapons with lethal vampire thirst.",
    effect: "+25% Lifesteal on all strikes • [Curse] -1 Causal Plausibility drain per sector combat",
    cursedEffect: {
      positiveBuff: "+25% Lifesteal on critical strikes",
      cursePenalty: "Strains causal reality (-1 Plausibility per turn)",
      plausibilityDrainPerTurn: 1,
    },
    isGiftable: false,
  },
];

// ============================================================================
// 5. CAMP GIFTING CATALOG (Pillar 5)
// ============================================================================

export const CAMP_GIFT_CATALOG: GiftItemRecord[] = [
  {
    itemId: "gift_solar_crystal",
    name: "Prismatic Solar Crystal",
    description: "A brilliant faceted gemstone that captures and holds pure dawnlight. Prized by holy knights and radiant arcanists.",
    rarity: "rare",
    preferredCompanionIds: ["aria"],
    baseAffectionGain: 6,
    reactionPrompt: "Express deep gratitude and slight blushing, marveling at how warm the sunlight feels against her palm.",
    statBonus: { stat: "str", amount: 2 },
  },
  {
    itemId: "gift_void_grimoire_page",
    name: "Forbidden Voidstrider Inscription",
    description: "An ancient parchment inscribed with equations of sub-planar gravity and spatial folds.",
    rarity: "rare",
    preferredCompanionIds: ["morgana"],
    baseAffectionGain: 7,
    reactionPrompt: "Show intense intellectual fascination and quiet intrigue, leaning in close to whisper their shared knowledge.",
    statBonus: { stat: "int", amount: 3 },
  },
  {
    itemId: "gift_celestial_music_box",
    name: "Starlight Melody Sphere",
    description: "A delicate clockwork sphere that chimes with harmonies recorded from interstellar cosmic winds.",
    rarity: "rare",
    preferredCompanionIds: ["lyra"],
    baseAffectionGain: 6,
    reactionPrompt: "Be utterly enchanted by the melody, smiling warmly with fond nostalgia.",
    statBonus: { stat: "mp", amount: 15 },
  },
  {
    itemId: "gift_elixir_of_vitality",
    name: "Royal Ambrosia Vintage",
    description: "A rare draught steeped in high-altitude herbs and nectar. Universally appreciated by companions at camp.",
    rarity: "uncommon",
    preferredCompanionIds: ["aria", "morgana", "lyra"],
    baseAffectionGain: 4,
    reactionPrompt: "Appreciate the thoughtful downtime refreshment and offer to share the cup with the protagonist.",
    statBonus: { stat: "hp", amount: 20 },
  },
];

// ============================================================================
// 6. NO-SAFEGUARD: DEATH & REGRESSION EVALUATOR
// ============================================================================

export function evaluateDeathAndRegression(params: {
  player: PlayerProfile;
  causeOfDeath: string;
  location: string;
  killerOrHazard: string;
  currentPlausibility: number;
  regressionCount: number;
  anchorNodeId?: string;
}): {
  deathRecord: DeathRegressionRecord;
  timelineEcho: TimelineEcho;
  restoredPlausibility: number;
  systemVerdictNote: string;
} {
  const deathNumber = (params.player.deathCount || 0) + 1;
  const regNumber = params.regressionCount + 1;

  // The SYSTEM judges if the regression is fully sanctioned or penalizes the protagonist
  const isHighPlausibility = params.currentPlausibility >= 30;
  const systemVerdict = isHighPlausibility ? "Sanctioned Regression" : "Causal Collapse";
  const retainedExp = isHighPlausibility ? 1.0 : 0.75; // 25% exp burn if died in critical causal collapse

  const recordId = `death_reg_${Date.now()}`;
  const deathRecord: DeathRegressionRecord = {
    id: recordId,
    deathNumber,
    causeOfDeath: params.causeOfDeath,
    location: params.location,
    killerOrHazard: params.killerOrHazard,
    timestamp: new Date().toISOString(),
    systemVerdict,
    retainedKnowledgeSummary: `Perished at ${params.location} by ${params.killerOrHazard} (${params.causeOfDeath}). Knowledge and instincts retained into loop iteration #${regNumber}.`,
    retainedExpPercent: retainedExp,
    retainedAbilities: params.player.abilities || [],
    loopResetNodeId: params.anchorNodeId,
  };

  const timelineEcho: TimelineEcho = {
    id: `echo_death_${Date.now()}`,
    sourceNodeKey: params.anchorNodeId || "fatal_collapse",
    sourceNodeTitle: `Regression Point: ${params.location}`,
    choiceTaken: `[FATAL REGRESSION] Perished to ${params.killerOrHazard}`,
    consequenceSummary: params.causeOfDeath,
    loopIteration: regNumber,
    recordedAt: new Date().toISOString(),
    isDeathEcho: true,
    deathCause: params.causeOfDeath,
    foreshadowKey: `death_memory_${params.killerOrHazard.toLowerCase().replace(/\s+/g, "_")}`,
  };

  const restoredPlausibility = Math.max(50, Math.min(85, params.currentPlausibility + 40));
  const systemVerdictNote = isHighPlausibility
    ? `[SYSTEM: Protagonist core perished. Activating Sanctioned Regression Protocol. Timeline rewound to anchor point with 100% memory and ability retention.]`
    : `[SYSTEM ALERT: Causal boundary fractured upon death. Emergency Plausibility Burn engaged. Retained 75% progression; rewinding to stable anchor.]`;

  return {
    deathRecord,
    timelineEcho,
    restoredPlausibility,
    systemVerdictNote,
  };
}

// ============================================================================
// 7. CONTEXTUAL EQUIPMENT & WEAPON ACQUISITION DETECTOR
// ============================================================================

export interface ContextualDetectedEquipment {
  id: string;
  name: string;
  type: "weapon" | "armor" | "relic";
  rarity: "common" | "uncommon" | "rare" | "relic" | "cursed";
  description: string;
  effect: string;
  slot: "weapon" | "armor" | "relic";
}

const WEAPON_KEYWORDS = [
  "broadsword", "greatsword", "longsword", "shortsword", "claymore", "katana",
  "scimitar", "falchion", "saber", "rapier", "estoc", "blade", "sword",
  "dagger", "knife", "stiletto", "dirk",
  "halberd", "glaive", "spear", "lance", "pike", "trident",
  "battleaxe", "waraxe", "hatchet", "axe",
  "warhammer", "hammer", "mace", "morningstar", "flail", "club",
  "crossbow", "longbow", "shortbow", "bow",
  "staff", "wand", "scepter", "scythe", "grimoire"
];

const ARMOR_KEYWORDS = [
  "breastplate", "cuirass", "plate", "chainmail", "mail", "armor", "armour",
  "shield", "buckler", "aegis", "pavise",
  "helmet", "helm", "cowl", "hood",
  "gauntlets", "gloves", "bracers", "vambraces",
  "greaves", "boots", "tasset",
  "cloak", "robe", "tunic", "vest", "gambeson"
];

const RELIC_KEYWORDS = [
  "amulet", "ring", "talisman", "pendant", "necklace", "locket", "orb",
  "chalice", "crown", "circlet", "phylactery", "signet", "relic"
];

const ACQUISITION_VERBS_REGEX =
  /(?:pick(?:ing|s|ed)?\s+up|take(?:s|n|ing)?|took|retrieve(?:s|d|ing)?|scavenge(?:s|d|ing)?|loot(?:s|ed|ing)?|grab(?:s|bed|bing)?|equip(?:s|ped|ping)?|wield(?:s|ed|ing)?|claim(?:s|ed|ing)?|draw(?:s|ing)?|drew|unsheathe(?:s|d|ing)?|pry(?:ing|s|ied)?|lift(?:s|ed|ing)?|don(?:s|ned|ning)?|find(?:s|ing)?|found|hand(?:s|ed|ing)?\s+(?:you|him|her|them)|give(?:s|n|ing)?\s+(?:you|him|her|them)|gave\s+(?:you|him|her|them)|receive(?:s|d|ing)?)/i;

function toTitleCase(str: string): string {
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Inspects player action and narrative prose to contextually extract newly acquired weapons, armor, or relics.
 * Guarantees that actions like "Pick up the sword off the ground" immediately register in inventory and auto-equip.
 */
export function detectContextualEquipmentAcquisition(params: {
  action?: string;
  storyText?: string;
  currentGear?: { weapon?: string; armor?: string; relic?: string };
}): ContextualDetectedEquipment | null {
  const combinedText = `${params.action || ""} \n ${params.storyText || ""}`.trim();
  if (!combinedText) return null;

  // 1. Check if any acquisition verb is present
  const verbMatch = combinedText.match(ACQUISITION_VERBS_REGEX);
  if (!verbMatch) return null;

  const allKeywords = [
    ...WEAPON_KEYWORDS.map((k) => ({ keyword: k, slot: "weapon" as const })),
    ...ARMOR_KEYWORDS.map((k) => ({ keyword: k, slot: "armor" as const })),
    ...RELIC_KEYWORDS.map((k) => ({ keyword: k, slot: "relic" as const })),
  ];

  // Search for the closest equipment noun following or preceding the acquisition verb
  for (const { keyword, slot } of allKeywords) {
    // Matches patterns like:
    // "pick up the rusted broadsword"
    // "takes the fallen guard's steel blade"
    // "retrieve a cracked leather cuirass"
    const pattern = new RegExp(
      `(?:pick(?:ing|s|ed)?\\s+up|take(?:s|n|ing)?|took|retrieve(?:s|d|ing)?|scavenge(?:s|d|ing)?|loot(?:s|ed|ing)?|grab(?:s|bed|bing)?|equip(?:s|ped|ping)?|wield(?:s|ed|ing)?|claim(?:s|ed|ing)?|draw(?:s|ing)?|drew|unsheathe(?:s|d|ing)?|pry(?:ing|s|ied)?|lift(?:s|ed|ing)?|don(?:s|ned|ning)?|find(?:s|ing)?|found|hand(?:s|ed|ing)?\\s+(?:you|him|her|them)|give(?:s|n|ing)?\\s+(?:you|him|her|them)|gave\\s+(?:you|him|her|them)|receive(?:s|d|ing)?)\\s+(?:the|a|an|his|her|their|some|one)?\\s*([a-zA-Z'’\\-\\s]{0,24}\\b${keyword}\\b)`,
      "i"
    );

    const match = combinedText.match(pattern);
    if (match && match[1]) {
      let rawName = match[1].trim();

      // Clean up leading filler words
      rawName = rawName
        .replace(/^(the|a|an|his|her|their|some|one|from|off|of)\s+/i, "")
        .replace(/\s+(off|from|lying|on|in|near|beside|at)\b.*$/i, "")
        .trim();

      if (!rawName || rawName.length < 3) {
        rawName = keyword;
      }

      // If name is just the bare keyword (e.g. "sword"), give it an atmospheric descriptor based on text
      let cleanedTitle = toTitleCase(rawName);
      if (cleanedTitle.toLowerCase() === keyword) {
        if (/iron|rusted|weathered|ground|floor|flagstone|dirt/i.test(combinedText)) {
          cleanedTitle = `Iron ${toTitleCase(keyword)}`;
        } else if (/steel|guard|soldier|patrol/i.test(combinedText)) {
          cleanedTitle = `Steel ${toTitleCase(keyword)}`;
        } else if (/shadow|dark|abyssal|void/i.test(combinedText)) {
          cleanedTitle = `Shadow ${toTitleCase(keyword)}`;
        } else if (/rune|arcane|magic|ether/i.test(combinedText)) {
          cleanedTitle = `Arcane ${toTitleCase(keyword)}`;
        }
      }

      // Check if player already has this exact item equipped to prevent endless re-detection loops
      const currentEquipped = params.currentGear?.[slot]?.toLowerCase().trim();
      if (currentEquipped && currentEquipped === cleanedTitle.toLowerCase()) {
        continue;
      }

      // Infer rarity
      let rarity: "common" | "uncommon" | "rare" | "relic" | "cursed" = "common";
      const lowerTitle = cleanedTitle.toLowerCase();
      if (/abyssal|cursed|forbidden|blood/i.test(lowerTitle)) {
        rarity = "cursed";
      } else if (/celestial|mythic|ancient|astral|divine|draconic/i.test(lowerTitle)) {
        rarity = "rare";
      } else if (/steel|silver|tempered|enchanted|imperial|shadow|rune|arcane/i.test(lowerTitle)) {
        rarity = "uncommon";
      }

      const effect =
        slot === "weapon"
          ? `+${rarity === "rare" ? 18 : rarity === "uncommon" ? 10 : 5} ATK • Contextual Equipment`
          : slot === "armor"
          ? `+${rarity === "rare" ? 15 : rarity === "uncommon" ? 8 : 4} DEF • Contextual Equipment`
          : `+${rarity === "rare" ? 25 : rarity === "uncommon" ? 15 : 8} MP • Contextual Relic`;

      const description = `Equipment contextually acquired during the chronicle. Forged for active combat in ${slot.toUpperCase()} slot.`;

      const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      return {
        id,
        name: cleanedTitle,
        type: slot,
        rarity,
        description,
        effect,
        slot,
      };
    }
  }

  return null;
}
