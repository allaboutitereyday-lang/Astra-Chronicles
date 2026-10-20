// Predefined Trial Modifiers & State-Filtered Companion Access for Astra Chronicles
// LitRPG Trials Upgrade Pillar 1 & Pillar 2

import { TrialModifier, StoryCompanion } from "@/types/story";

export const PREDEFINED_TRIAL_MODIFIERS: TrialModifier[] = [
  {
    id: "entropy_cascade",
    name: "Entropy Cascade",
    description: "Causal boundaries fluctuate wildly. Kinetic impacts pierce dimensional barriers.",
    iconName: "Zap",
    colorTheme: "amber",
    effects: {
      critDamageMultiplier: 1.35,
      enemyLethalityMultiplier: 1.15,
    },
    statEffectLabel: "+35% Critical Damage, +15% Enemy Lethality",
  },
  {
    id: "sanguine_moon",
    name: "Sanguine Moon",
    description: "A crimson atmospheric haze quickens blood flow and enhances vampiric resonance.",
    iconName: "Moon",
    colorTheme: "rose",
    effects: {
      lifestealPercent: 0.18,
      enemyLethalityMultiplier: 1.20,
    },
    statEffectLabel: "+18% Physical Lifesteal, +20% Enemy Ferocity",
  },
  {
    id: "lethargic_fog",
    name: "Lethargic Fog",
    description: "A heavy dampening mist settles over the sector, impeding arcane reflexes.",
    iconName: "CloudFog",
    colorTheme: "purple",
    effects: {
      mpCostMultiplier: 1.25,
      enemyLethalityMultiplier: 0.80,
    },
    statEffectLabel: "+25% Skill MP Costs, -20% Enemy Lethality",
  },
  {
    id: "quantum_bleed",
    name: "Quantum Bleed",
    description: "Spatial fissures leak concentrated aether, supercharging spells at the cost of endurance.",
    iconName: "Sparkles",
    colorTheme: "cyan",
    effects: {
      playerDamageMultiplier: 1.20,
      plausibilityDrainMultiplier: 1.15,
    },
    statEffectLabel: "+20% Arcane Resonance, +15% Plausibility Drain",
  },
  {
    id: "voidstrider_interference",
    name: "Voidstrider Interference",
    description: "The void strata echoes through the chamber, enhancing phase mechanics and poise breaks.",
    iconName: "Infinity",
    colorTheme: "purple",
    effects: {
      staggerMultiplier: 1.40,
      plausibilityDrainMultiplier: 1.10,
    },
    statEffectLabel: "+40% Stagger Damage, +10% Plausibility Strain",
  },
  {
    id: "aether_storm",
    name: "Aether Storm",
    description: "Overcharged atmospheric mana accelerates skill circulation while energizing planar entities.",
    iconName: "Flame",
    colorTheme: "amber",
    effects: {
      mpCostMultiplier: 0.70,
      enemyLethalityMultiplier: 1.15,
    },
    statEffectLabel: "-30% Skill MP Costs, +15% Enemy Lethality",
  },
  {
    id: "chrono_dilation",
    name: "Chrono Dilation",
    description: "Planar conduits warp the local flow of time, heightening precision and stagger windows.",
    iconName: "Compass",
    colorTheme: "cyan",
    effects: {
      staggerMultiplier: 1.30,
      critRateBonus: 0.15,
    },
    statEffectLabel: "+30% Stagger Rate, +15% Critical Chance",
  },
  {
    id: "singularity_horizon",
    name: "Singularity Horizon",
    description: "The Administrator's final trial crucible. Maximum causal pressure with sovereign lethality.",
    iconName: "Skull",
    colorTheme: "rose",
    effects: {
      critRateBonus: 0.20,
      critDamageMultiplier: 1.50,
      enemyLethalityMultiplier: 1.30,
    },
    statEffectLabel: "+20% Crit Rate, +50% Crit DMG, High Lethality",
  },
];

/**
 * Retrieves a modifier by its unique ID, falling back to Entropy Cascade if not found.
 */
export function getSectorModifierById(id: string): TrialModifier {
  return (
    PREDEFINED_TRIAL_MODIFIERS.find((m) => m.id === id) ||
    PREDEFINED_TRIAL_MODIFIERS[0]
  );
}

/**
 * Returns a randomized modifier that has not already been used in the active sector run.
 */
export function getRandomSectorModifier(
  sectorIdx: number,
  excludedIds: string[] = []
): TrialModifier {
  const available = PREDEFINED_TRIAL_MODIFIERS.filter(
    (m) => !excludedIds.includes(m.id)
  );

  if (available.length === 0) {
    // If all modifiers are exhausted, fallback to any modifier indexed by sector
    return PREDEFINED_TRIAL_MODIFIERS[sectorIdx % PREDEFINED_TRIAL_MODIFIERS.length];
  }

  // Pick pseudo-random or index-offset
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

/**
 * Pre-computes 5 unique predefined modifiers for a 5-sector trial run.
 * Can be deterministically seeded using the daily date string or randomized.
 */
export function getSectorModifiersForRun(
  count: number = 5,
  seedString?: string
): TrialModifier[] {
  const pool = [...PREDEFINED_TRIAL_MODIFIERS];

  // Seeded deterministic shuffle if seed provided
  if (seedString) {
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      hash = (hash << 5) - hash + seedString.charCodeAt(i);
      hash |= 0;
    }

    // Seeded Fisher-Yates
    for (let i = pool.length - 1; i > 0; i--) {
      const pseudoRand = Math.abs((hash ^ (i * 31)) % (i + 1));
      [pool[i], pool[pseudoRand]] = [pool[pseudoRand], pool[i]];
    }
  } else {
    // Standard shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  // Ensure Singularity Horizon is preferred or guaranteed on the final Sector 5
  const result: TrialModifier[] = [];
  const singularityMod = pool.find((m) => m.id === "singularity_horizon") || PREDEFINED_TRIAL_MODIFIERS[7];
  const regularPool = pool.filter((m) => m.id !== "singularity_horizon");

  for (let s = 0; s < count; s++) {
    if (s === count - 1) {
      // Sector 5 Capstone
      result.push(singularityMod);
    } else {
      result.push(regularPool[s % regularPool.length]);
    }
  }

  return result;
}

/**
 * State-Filtered Companion Access:
 * Filters the party to companions the protagonist has explicitly encountered in the story
 * or unlocked through narrative progression. Prevents late-game spoilers.
 */
export function getDiscoveredCompanions(
  party: any[] = [],
  unlockedIds: string[] = []
): StoryCompanion[] {
  if (!Array.isArray(party) || party.length === 0) return [];

  const unlockedSet = new Set(unlockedIds.map((id) => id.toLowerCase().trim()));

  return party.filter((comp) => {
    if (!comp) return false;
    // Explicit encountered flag
    if (comp.encountered === true) return true;
    // Currently present in active party
    if (comp.isPresent === true) return true;
    // Checked in unlocked list
    if (comp.id && unlockedSet.has(comp.id.toLowerCase().trim())) return true;
    if (comp.name && unlockedSet.has(comp.name.toLowerCase().trim())) return true;
    return false;
  });
}

