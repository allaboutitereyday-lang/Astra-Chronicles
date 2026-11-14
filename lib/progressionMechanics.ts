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
  StoryCompanion,
  HeroineGuardTier,
  CompanionCoreMemory
} from "@/types/story";

export type { ActiveTrialCompanion, CombatStanceType, CombatStanceConfig, GiftItemRecord };
export { 
  PREDEFINED_TRIAL_MODIFIERS, 
  getSectorModifierById, 
  getRandomSectorModifier, 
  getSectorModifiersForRun, 
  getDiscoveredCompanions 
} from "./trialModifiers";
import { DeathRegressionRecord, PenaltyScenarioState, QuestDifficulty, QuestType, SystemQuest } from "@/types/system";

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
  return ["neutral", "flame", "frost", "phase", "shadow", "graviton"];
}

export interface ClassStanceDisplayInfo {
  id: CombatStanceType;
  label: string;
  bonusText: string;
  bonusHint: string;
  tag: string;
  description: string;
  activeClass: string;
}

export function getClassStanceConfig(roleString?: string): Record<CombatStanceType, ClassStanceDisplayInfo> {
  const r = (roleString || "").toLowerCase().trim();

  // 1. Reaver / Blood Knight / Berserker / Slayer
  if (r.includes("reaver") || r.includes("blood") || r.includes("slayer") || r.includes("sanguine") || r.includes("carnage") || r.includes("gore") || r.includes("rend")) {
    return {
      neutral: {
        id: "neutral",
        label: "Reaver's Flow",
        bonusText: "+8% Balanced Output",
        bonusHint: "Balanced damage & vitality, +5 MP",
        tag: "Reaver's Flow",
        description: "Centered combat balance, channeling blood flow into measured momentum.",
        activeClass: "bg-zinc-800 border-zinc-400 text-white shadow-[0_0_12px_rgba(161,161,170,0.3)]",
      },
      flame: {
        id: "flame",
        label: "Blood Rage",
        bonusText: "+30% ATK • Bleed DoT",
        bonusHint: "+30% Attack, Bleed damage over time",
        tag: "Blood Rage",
        description: "Ignites crimson berserk frenzy, trading restraint for savage arterial damage.",
        activeClass: "bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_14px_rgba(239,68,68,0.4)]",
      },
      frost: {
        id: "frost",
        label: "Iron Flesh",
        bonusText: "-40% DMG Taken • Fortify",
        bonusHint: "-40% Damage taken, +35% poise resistance",
        tag: "Iron Flesh",
        description: "Hardens vascular fibers and muscular sinew into an impenetrable physical barrier.",
        activeClass: "bg-stone-900/90 border-stone-400 text-stone-200 shadow-[0_0_14px_rgba(168,162,158,0.4)]",
      },
      phase: {
        id: "phase",
        label: "Slaughter Step",
        bonusText: "35% Evade Counter",
        bonusHint: "35% Evasion counter, unhindered flanking",
        tag: "Slaughter Step",
        description: "Low predatory footwork that slips through weapon swings for lethal counter-strikes.",
        activeClass: "bg-rose-950/90 border-rose-400 text-rose-200 shadow-[0_0_14px_rgba(244,63,94,0.4)]",
      },
      shadow: {
        id: "shadow",
        label: "Executioner",
        bonusText: "45% Crit (1.6x DMG)",
        bonusHint: "+45% Critical Strike chance, 1.6x damage",
        tag: "Executioner",
        description: "Fixates purely on vital nerve clusters and exposed arteries for decapitating trauma.",
        activeClass: "bg-purple-950/90 border-purple-400 text-purple-200 shadow-[0_0_14px_rgba(168,85,247,0.4)]",
      },
      graviton: {
        id: "graviton",
        label: "Bonecrusher",
        bonusText: "+20% DMG • 35% Stagger",
        bonusHint: "+20% Direct damage, +35% stagger buildup",
        tag: "Bonecrusher",
        description: "Pours full kinetic body mass into each blow to fracture bones and shatter posture.",
        activeClass: "bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.4)]",
      },
    };
  }

  // 2. Warrior / Juggernaut / Knight
  if (r.includes("warrior") || r.includes("berserk") || r.includes("juggernaut") || r.includes("colossus") || r.includes("fighter") || r.includes("knight")) {
    return {
      neutral: {
        id: "neutral",
        label: "Colossus Guard",
        bonusText: "+8% Balanced Output",
        bonusHint: "Solid martial stance, +5 MP",
        tag: "Colossus Guard",
        description: "Disciplined heavy posture resisting momentum.",
        activeClass: "bg-zinc-800 border-zinc-400 text-white shadow-[0_0_12px_rgba(161,161,170,0.3)]",
      },
      flame: {
        id: "flame",
        label: "War Frenzy",
        bonusText: "+30% ATK • Cleave",
        bonusHint: "+30% Attack power, wide cleaving strikes",
        tag: "War Frenzy",
        description: "Unbridled battlefield bloodlust amplifying kinetic cleave.",
        activeClass: "bg-orange-950/90 border-orange-500 text-orange-200 shadow-[0_0_14px_rgba(249,115,22,0.4)]",
      },
      frost: {
        id: "frost",
        label: "Iron Bulwark",
        bonusText: "-40% DMG Taken • Ward",
        bonusHint: "-40% Damage taken, impenetrable shield",
        tag: "Iron Bulwark",
        description: "Bracing behind armor plates to absorb catastrophic impact.",
        activeClass: "bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.4)]",
      },
      phase: {
        id: "phase",
        label: "Intercept",
        bonusText: "35% Evade Counter",
        bonusHint: "35% Intercept counter, poise defense",
        tag: "Intercept",
        description: "Quick tactical sidestep to parry and drive forward.",
        activeClass: "bg-violet-950/90 border-violet-400 text-violet-200 shadow-[0_0_14px_rgba(167,139,250,0.4)]",
      },
      shadow: {
        id: "shadow",
        label: "Overpower",
        bonusText: "45% Crit (1.6x DMG)",
        bonusHint: "+45% Critical Strike chance, heavy stun",
        tag: "Overpower",
        description: "Crushing momentum targeting armor joint vulnerabilities.",
        activeClass: "bg-rose-950/90 border-rose-400 text-rose-200 shadow-[0_0_14px_rgba(244,63,94,0.4)]",
      },
      graviton: {
        id: "graviton",
        label: "Earthshaker",
        bonusText: "+20% DMG • 35% Stagger",
        bonusHint: "+20% Damage, +35% stagger poise break",
        tag: "Earthshaker",
        description: "Cataclysmic ground-slamming impact that staggers adversaries.",
        activeClass: "bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.4)]",
      },
    };
  }

  // 3. Rogue / Assassin / Shadow
  if (r.includes("rogue") || r.includes("assassin") || r.includes("shadow") || r.includes("saboteur") || r.includes("thief") || r.includes("scout")) {
    return {
      neutral: {
        id: "neutral",
        label: "Shadow Stride",
        bonusText: "+8% Balanced Output",
        bonusHint: "Fluid stealth momentum, +5 MP",
        tag: "Shadow Stride",
        description: "Silent predatory posture masking breath and presence.",
        activeClass: "bg-zinc-800 border-zinc-400 text-white shadow-[0_0_12px_rgba(161,161,170,0.3)]",
      },
      flame: {
        id: "flame",
        label: "Venom Blade",
        bonusText: "+30% ATK • Poison DoT",
        bonusHint: "+30% Poison and bleeding damage",
        tag: "Venom Blade",
        description: "Coats weapon edges in flesh-rotting neurotoxic ichor.",
        activeClass: "bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.4)]",
      },
      frost: {
        id: "frost",
        label: "Smoke Screen",
        bonusText: "-40% DMG Taken • Cloak",
        bonusHint: "-40% Damage taken, miss chance",
        tag: "Smoke Screen",
        description: "Diffuses an obscuring smoke cloud to misdirect incoming blades.",
        activeClass: "bg-zinc-900 border-zinc-400 text-zinc-200 shadow-[0_0_14px_rgba(161,161,170,0.4)]",
      },
      phase: {
        id: "phase",
        label: "Shadow Step",
        bonusText: "35% Evade Counter",
        bonusHint: "35% Evasion counter, flank ambush",
        tag: "Shadow Step",
        description: "Melts through blind spots to reappear instantly behind the foe.",
        activeClass: "bg-violet-950/90 border-violet-400 text-violet-200 shadow-[0_0_14px_rgba(167,139,250,0.4)]",
      },
      shadow: {
        id: "shadow",
        label: "Lethal Edge",
        bonusText: "45% Crit (1.6x DMG)",
        bonusHint: "+45% Critical Strike chance, assassinate",
        tag: "Lethal Edge",
        description: "Hones every motion toward an instantaneous fatal strike.",
        activeClass: "bg-rose-950/90 border-rose-400 text-rose-200 shadow-[0_0_14px_rgba(244,63,94,0.4)]",
      },
      graviton: {
        id: "graviton",
        label: "Pressure Point",
        bonusText: "+20% DMG • 35% Stagger",
        bonusHint: "+20% Damage, +35% nerve stagger",
        tag: "Pressure Point",
        description: "Targets critical somatic nodes to collapse enemy motor function.",
        activeClass: "bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.4)]",
      },
    };
  }

  // 4. Paladin / Holy / Templar / Cleric
  if (r.includes("paladin") || r.includes("solar") || r.includes("holy") || r.includes("templar") || r.includes("cleric") || r.includes("light") || r.includes("crusader")) {
    return {
      neutral: {
        id: "neutral",
        label: "Righteous Stance",
        bonusText: "+8% Balanced Output",
        bonusHint: "Conscrated balance, +5 MP",
        tag: "Righteous Stance",
        description: "Vigilant guardian stance wreathed in sacred aether.",
        activeClass: "bg-zinc-800 border-zinc-400 text-white shadow-[0_0_12px_rgba(161,161,170,0.3)]",
      },
      flame: {
        id: "flame",
        label: "Solar Radiance",
        bonusText: "+30% ATK • Holy Burn",
        bonusHint: "+30% Smite damage, holy burn over time",
        tag: "Solar Radiance",
        description: "Ignites divine sunlight to sear unholy flesh and armor.",
        activeClass: "bg-yellow-950/90 border-yellow-400 text-yellow-200 shadow-[0_0_14px_rgba(250,204,21,0.4)]",
      },
      frost: {
        id: "frost",
        label: "Divine Sanctuary",
        bonusText: "-40% DMG Taken • Ward",
        bonusHint: "-40% Damage taken, consecrated shield",
        tag: "Divine Sanctuary",
        description: "Projects a holy aegis that defused demonic and chaotic trauma.",
        activeClass: "bg-sky-950/90 border-sky-400 text-sky-200 shadow-[0_0_14px_rgba(56,189,248,0.4)]",
      },
      phase: {
        id: "phase",
        label: "Angelic Shift",
        bonusText: "35% Evade Counter",
        bonusHint: "35% Evasion counter, radiant flash",
        tag: "Angelic Shift",
        description: "Blinding flash of celestial wings allowing effortless repositioning.",
        activeClass: "bg-amber-950/90 border-amber-300 text-amber-100 shadow-[0_0_14px_rgba(252,211,77,0.4)]",
      },
      shadow: {
        id: "shadow",
        label: "Judgement",
        bonusText: "45% Crit (1.6x DMG)",
        bonusHint: "+45% Critical Strike chance, divine smite",
        tag: "Judgement",
        description: "Channels heavenly condemnation to strike directly at corrupted cores.",
        activeClass: "bg-yellow-900/90 border-yellow-300 text-white shadow-[0_0_14px_rgba(234,179,8,0.4)]",
      },
      graviton: {
        id: "graviton",
        label: "Smite Crusher",
        bonusText: "+20% DMG • 35% Stagger",
        bonusHint: "+20% Damage, +35% holy stagger",
        tag: "Smite Crusher",
        description: "Delivers a concussive hammer strike that shatters unholy poise.",
        activeClass: "bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.4)]",
      },
    };
  }

  // 5. Default Universal Matrix (Voidstrider / Cosmic / Unspecified)
  return {
    neutral: {
      id: "neutral",
      label: "Adaptive",
      bonusText: "+8% Balanced Output",
      bonusHint: "Standard damage output, +5 MP",
      tag: "Adaptive Flow",
      description: "Centered combat balance, versatile offensive and defensive cadence.",
      activeClass: "bg-zinc-800 border-zinc-400 text-white shadow-[0_0_12px_rgba(161,161,170,0.3)]",
    },
    flame: {
      id: "flame",
      label: "Solaris",
      bonusText: "+30% ATK • Burn DoT",
      bonusHint: "+30% Attack power, Burn damage over time",
      tag: "Solaris Surge",
      description: "Overclocks kinetic output for blistering heat and armor scorch.",
      activeClass: "bg-orange-950/90 border-orange-400 text-orange-200 shadow-[0_0_14px_rgba(249,115,22,0.4)]",
    },
    frost: {
      id: "frost",
      label: "Cryo-Ward",
      bonusText: "-40% DMG Taken • Ward",
      bonusHint: "-40% Damage taken, high barrier stability",
      tag: "Cryo-Ward",
      description: "Encases the chassis in crystallizing aether to diffuse kinetic force.",
      activeClass: "bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.4)]",
    },
    phase: {
      id: "phase",
      label: "Blink",
      bonusText: "35% Evade Counter",
      bonusHint: "35% Evasion counter, phase slip",
      tag: "Blink Shift",
      description: "Sub-dimensional flicker that slips through solid projectiles and blades.",
      activeClass: "bg-violet-950/90 border-violet-400 text-violet-200 shadow-[0_0_14px_rgba(167,139,250,0.4)]",
    },
    shadow: {
      id: "shadow",
      label: "Lethality",
      bonusText: "45% Crit (1.6x DMG)",
      bonusHint: "+45% Critical Strike chance, 1.6x damage",
      tag: "Lethality",
      description: "Nanosecond timing targeting fractured weak points for catastrophic crits.",
      activeClass: "bg-rose-950/90 border-rose-400 text-rose-200 shadow-[0_0_14px_rgba(244,63,94,0.4)]",
    },
    graviton: {
      id: "graviton",
      label: "Crusher",
      bonusText: "+20% DMG • 35% Stagger",
      bonusHint: "+20% Damage, +35% poise stagger",
      tag: "Crusher",
      description: "Condenses localized gravitational mass to stagger heavy constructs.",
      activeClass: "bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.4)]",
    },
  };
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
  // Port Solaris Coastal Gift Catalog
  {
    itemId: "sun_kissed_gelato",
    name: "Sun-Kissed Citrus Gelato",
    description: "Artisanal blood-orange and sea-salt gelato freshly churned along the Sunset Rambla.",
    rarity: "uncommon",
    preferredCompanionIds: ["seraphina", "mia", "zuri", "vivienne", "comp_seraphina", "comp_mia", "comp_zuri", "comp_vivienne"],
    baseAffectionGain: 6,
    reactionPrompt: "Take a delicate bite with an unexpected gasp, face warming with an adorable blush as the rich citrus cream melts on her tongue.",
    bpmModifier: 12,
    statBonus: { stat: "hp", amount: 15 },
  },
  {
    itemId: "driftwood_music_box",
    name: "Driftwood Music Box",
    description: "A hand-carved music box salvaged from the Old Pier, playing a nostalgic sea-breeze waltz.",
    rarity: "rare",
    preferredCompanionIds: ["chloe", "kaede", "colette", "comp_chloe", "comp_kaede", "comp_colette"],
    baseAffectionGain: 7,
    reactionPrompt: "Trace the polished timber in reverent silence, resting her cheek against the wood as her eyes soften with deep emotion.",
    bpmModifier: -15,
    statBonus: { stat: "mp", amount: 20 },
  },
  {
    itemId: "sea_glass_wind_chime",
    name: "Sea-Glass Wind Chime",
    description: "Polished emerald and sapphire sea-glass strung on hemp rope, singing gently in the coastal breeze.",
    rarity: "uncommon",
    preferredCompanionIds: ["kaede", "nadia", "pippa", "comp_kaede", "comp_nadia", "comp_pippa"],
    baseAffectionGain: 6,
    reactionPrompt: "Hang the chime by the window with a soft, genuine smile, listening intently as the crystal chimes harmonize with the surf.",
    bpmModifier: -10,
    statBonus: { stat: "dex", amount: 2 },
  },
  {
    itemId: "vintage_solaris_sparkler",
    name: "Vintage Solaris Sparkler",
    description: "A chilled 1998 reserve bottle from the Platinum Cliffs sun-terraces, bursting with golden effervescence.",
    rarity: "rare",
    preferredCompanionIds: ["colette", "nadia", "vivienne", "seraphina", "comp_colette", "comp_nadia", "comp_vivienne", "comp_seraphina"],
    baseAffectionGain: 8,
    reactionPrompt: "Inspect the cork and vintage label with a connoisseur's sparkle in her eye, swirling the flute and blushing warmly over the shared toast.",
    bpmModifier: 15,
    statBonus: { stat: "int", amount: 3 },
  },
  {
    itemId: "black_sand_pearl_necklace",
    name: "Black Sand Pearl Necklace",
    description: "An exquisite pendant featuring an iridescent black pearl harvested from the secret Breakers Cove.",
    rarity: "relic",
    preferredCompanionIds: ["seraphina", "vivienne", "nadia", "roxy", "comp_seraphina", "comp_vivienne", "comp_nadia", "comp_roxy"],
    baseAffectionGain: 10,
    reactionPrompt: "Touch the cool iridescent pearl against her collarbone, breathless and visibly flustered by such an intimate and lavish keepsake.",
    bpmModifier: 20,
    statBonus: { stat: "str", amount: 3 },
  },
  {
    itemId: "artisan_matcha_whisk",
    name: "Artisan Bamboo Matcha Whisk",
    description: "A 100-prong golden bamboo chasen crafted by master woodturners for botanical and culinary infusions.",
    rarity: "rare",
    preferredCompanionIds: ["zuri", "mia", "chloe", "kaede", "comp_zuri", "comp_mia", "comp_chloe", "comp_kaede"],
    baseAffectionGain: 7,
    reactionPrompt: "Grasp the balanced bamboo whisk with immediate professional glee, eyes shining as she eagerly plans a new dessert infusion with you.",
    bpmModifier: 8,
    statBonus: { stat: "dex", amount: 3 },
  },
];

export const PORT_SOLARIS_COASTAL_GIFTS: GiftItemRecord[] = CAMP_GIFT_CATALOG.slice(4);

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

// ============================================================================
// 8. EARNED ROMANCE PROGRESSION, HEROINE RESISTANCE & DYNAMIC MEMORY ENGINE
// ============================================================================

export interface HeroineResistanceProfile {
  guardTier: HeroineGuardTier;
  badgeLabel: string;
  lowTierMaxGain: number;
  trustStepPerResonance: number; // How much trustProgress (0..1) a standard positive beat adds below threshold
  guardedThreshold: number; // Affection level below which her initial guard is active
  whatEarnsAffection: string;
  armorCrackTell: string;
  initialSentiment: string;
  canonicalMemoryTriggers: Array<{
    memoryId: string;
    unlockAffection: number;
    keywords: RegExp;
  }>;
}

const HEROINE_RESISTANCE_CATALOG: Record<string, HeroineResistanceProfile> = {
  "seraphina vane": {
    guardTier: "IRONCLAD",
    badgeLabel: "Ironclad Guard • High-Society Ojou",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.5,
    guardedThreshold: 40,
    whatEarnsAffection:
      "Demonstrating effortless competence under pressure, upholding Five-Star hospitality standards, calling her bluff with calm charisma, or shielding her from her father's impossible expectations.",
    armorCrackTell:
      "She clutches her gold-plated clipboard tighter to hide a sudden blush, steals a lingering glance at his lips or shoulders when she thinks he isn't looking, and privately scolds her racing pulse while insisting to herself that her interest is 'strictly professional.'",
    initialSentiment:
      "Strictly Professional Scrutiny — She keeps her gold-plated clipboard raised like a shield, convinced you are a reckless proprietor, even if your unbothered poise already unsettles her rhythm.",
    canonicalMemoryTriggers: [
      {
        memoryId: "midnight_ramen_addiction",
        unlockAffection: 50,
        keywords: /\b(ramen|instant\s+noodle|midnight\s+snack|comfort\s+food|late[- ]night\s+kitchen|broth)\b/i,
      },
      {
        memoryId: "father_resort_ultimatum",
        unlockAffection: 75,
        keywords: /\b(father|ultimatum|vane\s+holdings|corporate\s+heir|foreclosure\s+decree|family\s+pressure)\b/i,
      },
    ],
  },
  "vivienne laurent": {
    guardTier: "IRONCLAD",
    badgeLabel: "Ironclad Guard • Sovereign Heiress",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.5,
    guardedThreshold: 42,
    whatEarnsAffection:
      "Refusing to be bought or intimidated by her net worth, matching her boardroom poise with magnetic self-assurance, and treating her as a woman rather than a gilded trophy.",
    armorCrackTell:
      "Her cool champagne-flute composure slips for a heartbeat—her fingers brush yours a fraction too long, her gaze lingers on your eyes from behind her designer sunglasses, and her inner thoughts betray a thrill at finally meeting a man she cannot easily price or control.",
    initialSentiment:
      "Velvet Boardroom Distance — She appraises you from behind a billion-crown wall of amused detachment, waiting to see if you fold like every other suitor on the island.",
    canonicalMemoryTriggers: [
      {
        memoryId: "fake_fiance_clause_7",
        unlockAffection: 35,
        keywords: /\b(clause\s*7|fake\s+fianc[eé]|courtship\s+pact|arranged\s+marriage|cassian|betrothal|boyfriend\s+protocol)\b/i,
      },
      {
        memoryId: "first_street_crepe",
        unlockAffection: 55,
        keywords: /\b(crepe|cotton\s+candy|spun\s+sugar|street\s+food|boardwalk\s+snack|gloves|thunder|storm)\b/i,
      },
    ],
  },
  "kaede tachibana": {
    guardTier: "IRONCLAD",
    badgeLabel: "Ironclad Guard • Stoic Bushido",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.5,
    guardedThreshold: 40,
    whatEarnsAffection:
      "Unwavering physical discipline, honorable action without excuses, steady physical presence during danger, and sincere respect for her martial code.",
    armorCrackTell:
      "Her stoic posture stiffens as a crimson flush creeps up her neck; her fingers accidentally graze your wrist during a stance check, and in her private thoughts she wonders why a single confident look from you leaves her more breathless than a hundred dawn katas.",
    initialSentiment:
      "Measured Martial Vigilance — She observes your footwork and resolve in quiet silence, respecting strength of character far more than easy words.",
    canonicalMemoryTriggers: [
      {
        memoryId: "rooftop_feng_shui_excuse",
        unlockAffection: 35,
        keywords: /\b(feng\s+shui|sunrise|dawn\s+kata|shinai|pier\s+training|morning\s+practice|rooftop\s+meditation)\b/i,
      },
      {
        memoryId: "first_heartbeat_realization",
        unlockAffection: 60,
        keywords: /\b(heartbeat|pulse|cardio|plushie|claw\s+machine|kittens|stray\s+cat|pork\s+bun)\b/i,
      },
    ],
  },
  "nadia saint-clair": {
    guardTier: "IRONCLAD",
    badgeLabel: "Ironclad Guard • Perfectionist Appraiser",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.5,
    guardedThreshold: 38,
    whatEarnsAffection:
      "Attention to fine craftsmanship, keeping your word down to the smallest detail, and seeing past her sharp perfectionism to her genuine passion.",
    armorCrackTell:
      "She adjusts her spectacles to hide the sudden warmth in her cheeks, catches herself staring a beat too long as you lean in, and privately admits that your voice has a dangerously distracting resonance.",
    initialSentiment:
      "Exacting Appraisal — She evaluates every choice you make with a jeweler's loupe, skeptical of shortcuts but secretly attentive whenever you show real conviction.",
    canonicalMemoryTriggers: [
      {
        memoryId: "charcoal_terrace_sketchbook",
        unlockAffection: 35,
        keywords: /\b(sketchbook|charcoal|portrait|drawing|terrace\s+sketch|graphite|notebook)\b/i,
      },
      {
        memoryId: "fogged_glasses_tasting",
        unlockAffection: 60,
        keywords: /\b(fogged|glasses|spectacles|risotto|saffron|tasting|pan|cultural\s+merit|clause\s*4b)\b/i,
      },
    ],
  },
  "colette moreau": {
    guardTier: "SELECTIVE",
    badgeLabel: "Selective Guard • Teasing Sommelier",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.65,
    guardedThreshold: 30,
    whatEarnsAffection:
      "Trading unbothered witty banter, turning her own teasing back on her with smooth confidence, and appreciating the quiet artistry behind her lounge persona.",
    armorCrackTell:
      "Her sultry, all-knowing smirk falters for a split second when you step into her space without blinking; her fingers linger against yours on the crystal glass, and she privately marvels that you just turned the tables on her.",
    initialSentiment:
      "Amused Connoisseur — She swirls her glass with a knowing smirk, enjoying the game of trying to fluster you while keeping her own heart safely behind the bar.",
    canonicalMemoryTriggers: [
      {
        memoryId: "grand_resort_blacklisting",
        unlockAffection: 35,
        keywords: /\b(blacklist|marcel\s+vance|counterfeit\s+vintage|l'etoile|drain|sommelier|cellar)\b/i,
      },
      {
        memoryId: "custom_midnight_vintage",
        unlockAffection: 60,
        keywords: /\b(midnight\s+vintage|cocktail|100[- ]proof|private\s+blend|shaker|bellini|after[- ]hours)\b/i,
      },
    ],
  },
  "chloe lin": {
    guardTier: "SELECTIVE",
    badgeLabel: "Selective Guard • Deadpan Prodigy",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.65,
    guardedThreshold: 28,
    whatEarnsAffection:
      "Respecting her quiet personal space, matching her dry humor, noticing her subtle non-verbal cues, and sharing comfortable low-pressure company.",
    armorCrackTell:
      "She tugs her headphones down around her neck, her gaze darting away a millisecond too late after watching you, while her internal monologue calculates why her heart rate spikes every time your shoulder brushes hers.",
    initialSentiment:
      "Low-Battery Curiosity — She watches you from behind her headphones with deadpan calm, conserving her social energy until you prove you're worth unmuting for.",
    canonicalMemoryTriggers: [
      {
        memoryId: "old_pier_arcade_crown",
        unlockAffection: 35,
        keywords: /\b(arcade|99[- ]win|high\s+score|token|frame[- ]perfect|cabinet|fight[- ]stick|clause\s*9b)\b/i,
      },
      {
        memoryId: "shoulder_nap_dependency",
        unlockAffection: 60,
        keywords: /\b(shoulder\s+nap|piggyback|sleepy|hoodie|low\s+battery|3\s*a\.?m\.?|audit\s+ledger)\b/i,
      },
    ],
  },
  "roxy vance": {
    guardTier: "SELECTIVE",
    badgeLabel: "Selective Guard • Thrill-Seeking Rebel",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.65,
    guardedThreshold: 28,
    whatEarnsAffection:
      "Boldness, refusing to flinch at her provocations, backing her up in high-heat moments, and seeing the loyal heart underneath her tabloid bravado.",
    armorCrackTell:
      "Her cocky grin stutters into a genuine, wide-eyed flush when you hold her gaze without backing down; she nudges your arm to play it off, privately admitting you hit way harder than she expected.",
    initialSentiment:
      "Provocative Sizing-Up — She pokes at your composure with a sharp grin to see if you're all talk or if you have the nerve to keep up with her.",
    canonicalMemoryTriggers: [
      {
        memoryId: "deleted_scandal_negatives",
        unlockAffection: 35,
        keywords: /\b(negative|film\s+canister|deleted\s+photo|shredded\s+headline|scoop|solaris\s+siren|tabloid)\b/i,
      },
      {
        memoryId: "glass_cannon_confession",
        unlockAffection: 60,
        keywords: /\b(telephoto|camera|glass\s+cannon|press\s+pass|darkroom|exclusive\s+date)\b/i,
      },
    ],
  },
  "mia bellini": {
    guardTier: "WARM_RIVAL",
    badgeLabel: "Warm Rival • Fiery Childhood Friend",
    lowTierMaxGain: 2,
    trustStepPerResonance: 1.0,
    guardedThreshold: 20,
    whatEarnsAffection:
      "Rolling up your sleeves in the kitchen, praising her culinary craft with genuine warmth, and reminding her she comes first even when glamorous outsiders arrive.",
    armorCrackTell:
      "She huffs and dusts flour off her apron to hide her glowing cheeks, her eyes softening with unmistakable fondness the moment your hand steadies hers.",
    initialSentiment:
      "Affectionate Exasperation — She hides her Ride-or-Die devotion behind bossy kitchen banter, fiercely protective of both the Stray Anchor and you.",
    canonicalMemoryTriggers: [
      {
        memoryId: "shared_cove_promise",
        unlockAffection: 35,
        keywords: /\b(cove\s+promise|childhood\s+promise|seashell|three\s+years|brioche|nonna|croissant)\b/i,
      },
      {
        memoryId: "secret_wedding_recipe_book",
        unlockAffection: 60,
        keywords: /\b(recipe\s+book|recipe\s+binder|red\s+ribbon|wedding\s+cake|apron|dante\s+moretti)\b/i,
      },
    ],
  },
  "pippa reyes": {
    guardTier: "WARM_RIVAL",
    badgeLabel: "Warm Rival • Sun-Kissed Sparkplug",
    lowTierMaxGain: 2,
    trustStepPerResonance: 1.0,
    guardedThreshold: 20,
    whatEarnsAffection:
      "Matching her upbeat energy, celebrating her promotional wins, and noticing when her bright smile is masking exhaustion.",
    armorCrackTell:
      "She freezes mid-bounce with a rosy blush across the bridge of her nose, suddenly shy as her fingers tangle with yours.",
    initialSentiment:
      "Sunlit Enthusiasm — She's immediately energized by your presence, eager to team up and see if your leadership lives up to the boardwalk hype.",
    canonicalMemoryTriggers: [
      {
        memoryId: "sprained_ankle_piggyback",
        unlockAffection: 35,
        keywords: /\b(ankle|piggyback|volleyball|spike|south\s+beach|whistle|lifeguard|rex\s+vance)\b/i,
      },
      {
        memoryId: "not_just_your_kid_sister",
        unlockAffection: 60,
        keywords: /\b(kid\s+sister|k[oō]hai|grown\s+woman|sunset\s+pier|fireworks|tan[- ]line)\b/i,
      },
    ],
  },
  "zuri delacroix": {
    guardTier: "WARM_RIVAL",
    badgeLabel: "Warm Rival • Botanical Alchemist",
    lowTierMaxGain: 2,
    trustStepPerResonance: 1.0,
    guardedThreshold: 22,
    whatEarnsAffection:
      "Curiosity about her botanical infusions, gentle attentiveness, and patient warmth during quiet greenhouse or kitchen moments.",
    armorCrackTell:
      "A soft gasp escapes her as she inhales sharply, her pulse fluttering visibly at her throat while she leans a fraction closer to your warmth.",
    initialSentiment:
      "Warm Botanical Curiosity — She studies your aura with gentle, perceptive eyes, intrigued by the steady calm you bring into the room.",
    canonicalMemoryTriggers: [
      {
        memoryId: "midnight_matcha_gelato_test",
        unlockAffection: 35,
        keywords: /\b(matcha|pistachio|gelato|parfait|affogato|botanical|clinical\s+trial|infusion)\b/i,
      },
      {
        memoryId: "braid_curtain_blush",
        unlockAffection: 60,
        keywords: /\b(braids|twin\s+braids|sweet\s+cream|greenhouse|orchid|herbal|laurent)\b/i,
      },
    ],
  },
  // STARFALL LABYRINTH 15-HERO ROSTER
  "pia hollis": {
    guardTier: "WARM_RIVAL",
    badgeLabel: "Open Trust • Fae Cleric",
    lowTierMaxGain: 2,
    trustStepPerResonance: 1.0,
    guardedThreshold: 20,
    whatEarnsAffection:
      "Protecting low-star allies from being sacrificed as fodder, calming her trembling nerves during floor clears, and standing beside her against the Synthesis Furnace.",
    armorCrackTell:
      "Her snow-white hair and antler bead chains sway as she grips her sanctuary sleeves, blinking back tears of disbelief that someone actually chose to protect a 1★ novice.",
    initialSentiment:
      "Fragile Hope — She watches your bronze 1★ mark with anxious gratitude, half-afraid to believe you won't leave her on the synthesis tiles.",
    canonicalMemoryTriggers: [
      {
        memoryId: "pia_mem_1",
        unlockAffection: 35,
        keywords: /\b(synthesis|furnace|fodder|bait|one[- ]star|antler|sanctuary)\b/i,
      },
      {
        memoryId: "pia_mem_2",
        unlockAffection: 65,
        keywords: /\b(saint'?s\s+mercy|five[- ]star|purify|blessing|healing\s+light)\b/i,
      },
    ],
  },
  "lotte klein": {
    guardTier: "WARM_RIVAL",
    badgeLabel: "Dream Anchor • Dual-State Medium",
    lowTierMaxGain: 2,
    trustStepPerResonance: 1.0,
    guardedThreshold: 22,
    whatEarnsAffection:
      "Standing watch while she rests, keeping calm around her grinning nightmare spirit, and calling her safely back when Lucidua takes over.",
    armorCrackTell:
      "Her sleepy golden eyes blink awake in soft surprise as she tugs at her sleeve cuff, quietly resting her weight closer against your shoulder.",
    initialSentiment:
      "Drowsy Caution — She yawns apologetically behind her dark braids, worried her slumbering Lucidua half might frighten or endanger a new commander.",
    canonicalMemoryTriggers: [
      {
        memoryId: "lotte_mem_1",
        unlockAffection: 35,
        keywords: /\b(nap|blanket|brazier|lullaby|chamomile|sleepy|nightmare\s+spirit)\b/i,
      },
      {
        memoryId: "lotte_mem_2",
        unlockAffection: 65,
        keywords: /\b(lucidua|trance|wake\s+up|voice|collar\s+scar|shadow\s+hatchet)\b/i,
      },
    ],
  },
  "sable ashgrove": {
    guardTier: "IRONCLAD",
    badgeLabel: "Ironclad Guard • Scarred Survivor",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.5,
    guardedThreshold: 40,
    whatEarnsAffection:
      "Checking trap seams before charging, calling clean disengage routes, and proving through surviving multiple bosses that you won't become another name on the Memorial Wall.",
    armorCrackTell:
      "Her dry, sardonic stare drops for a fraction of a second as one of her abyssal tentacles instinctively coils behind your heel to steady your footing.",
    initialSentiment:
      "Cynical Distance — She expects you to get chewed up like the last three squads she outlived, refusing even to learn your name until you survive a real ambush.",
    canonicalMemoryTriggers: [
      {
        memoryId: "sable_mem_1",
        unlockAffection: 35,
        keywords: /\b(apron\s+pocket|dog[- ]?tag|fallen\s+squad|memorial\s+wall|survivor|name)\b/i,
      },
      {
        memoryId: "sable_mem_2",
        unlockAffection: 65,
        keywords: /\b(tentacle|tendril|mimic|escape\s+route|espresso|trap\s+seam)\b/i,
      },
    ],
  },
  "onyxia cryss": {
    guardTier: "SELECTIVE",
    badgeLabel: "Selective Guard • Geode Construct",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.65,
    guardedThreshold: 30,
    whatEarnsAffection:
      "Treating her as a living person rather than disposable dungeon hardware, caring for her mineral core between battles, and valuing the small keepsakes she gathers.",
    armorCrackTell:
      "The amethyst gem centered on her blindfold brightens by two measured lumens while her chained brass Oculus slows into a quiet, attentive orbit.",
    initialSentiment:
      "Measured Observation — She reports oculus telemetry in calm, literal cadences, uncertain whether you see her as a tool or a comrade.",
    canonicalMemoryTriggers: [
      {
        memoryId: "onyxia_mem_1",
        unlockAffection: 35,
        keywords: /\b(pebble|stone|geode|amethyst|keepsake|polish|crystal)\b/i,
      },
      {
        memoryId: "onyxia_mem_2",
        unlockAffection: 65,
        keywords: /\b(shackle|manacle|oculus|third[- ]eye|blindfold|mineral\s+core)\b/i,
      },
    ],
  },
  vaelkor: {
    guardTier: "WARM_RIVAL",
    badgeLabel: "Draconic Trust • pragmatic Spellsword",
    lowTierMaxGain: 2,
    trustStepPerResonance: 1.0,
    guardedThreshold: 22,
    whatEarnsAffection:
      "Calling crisp flank timings, judging squad members by battlefield execution rather than banner rarity, and backing him up on the frontline without hesitation.",
    armorCrackTell:
      "A low rumble vibrates across his scaled throat as violet static softens around his gauntlet—offering you a brief, genuine nod of clutch-kin respect.",
    initialSentiment:
      "Pragmatic Appraisal — He sizes up your 1★ frame with dry draconic humor, waiting to see if your tactical calls hit harder than your rarity suggests.",
    canonicalMemoryTriggers: [
      {
        memoryId: "vaelkor_mem_1",
        unlockAffection: 35,
        keywords: /\b(flank|sky[- ]bastion|choke[- ]point|greatsword|scales|clutch[- ]kin)\b/i,
      },
      {
        memoryId: "vaelkor_mem_2",
        unlockAffection: 65,
        keywords: /\b(night\s+watch|storm[- ]gland|violet\s+lightning|wyvern|dragonborn)\b/i,
      },
    ],
  },
  "dame odette varr": {
    guardTier: "SELECTIVE",
    badgeLabel: "Selective Guard • Gorgon Knight",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.65,
    guardedThreshold: 32,
    whatEarnsAffection:
      "Honoring her knightly resolve while finding clever tactical loopholes around reckless Master Command Seals, and never flinching from her white crown-serpents.",
    armorCrackTell:
      "Her composed marble expression stiffens as a faint blush touches her cheeks—while the white vipers in her crown curl timidly toward your hand, betraying her fluster.",
    initialSentiment:
      "Formal Knightly Reserve — She holds strict vanguard posture beside your rank, bound by sacred oath even while quietly baffled by your unorthodox loopholes.",
    canonicalMemoryTriggers: [
      {
        memoryId: "odette_mem_1",
        unlockAffection: 35,
        keywords: /\b(serpent|viper|snake|gorgon|crown|petrify|fluster)\b/i,
      },
      {
        memoryId: "odette_mem_2",
        unlockAffection: 65,
        keywords: /\b(command\s+seal|loophole|chivalry|oath|stone[- ]ward|aesthul)\b/i,
      },
    ],
  },
  "trinity valoren": {
    guardTier: "SELECTIVE",
    badgeLabel: "Selective Guard • Oni Duelist",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.65,
    guardedThreshold: 30,
    whatEarnsAffection:
      "Matching her split-second combat tempo, reading boss tells without stalling, and earning her respect through fearless sparring and sharp intuition.",
    armorCrackTell:
      "The violet afterimages behind her flicker as she pauses mid-step, tilting her horned silhouette with an intrigued, playful smirk.",
    initialSentiment:
      "Rhythmic Intrigue — She measures every breath and footstep through her horns, teasingly testing whether a 1★ tactician can keep pace with an oni prodigy.",
    canonicalMemoryTriggers: [
      {
        memoryId: "trinity_mem_1",
        unlockAffection: 35,
        keywords: /\b(spar|tempo|horn|vibration|mirage|seeing\s+double|footwork)\b/i,
      },
      {
        memoryId: "trinity_mem_2",
        unlockAffection: 65,
        keywords: /\b(wheel[- ]crest|oni\s+clan|sword\s+school|wisteria|wakizashi)\b/i,
      },
    ],
  },
  abraxia: {
    guardTier: "IRONCLAD",
    badgeLabel: "Ironclad Guard • Silent Executioner",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.5,
    guardedThreshold: 38,
    whatEarnsAffection:
      "Trusting her wordless protection, refusing to issue dishonorable sacrificial orders, and noticing the quiet care she shows behind her scarred silence.",
    armorCrackTell:
      "Her gloved fingers pause halfway through wrapping her runeblade grip as her crimson eyes soften by a fraction of a degree, quietly shifting half a pace closer to your flank.",
    initialSentiment:
      "Watchful Silence — She speaks only when blades are drawn, gauging whether you are another shallow Master or a commander worth guarding without words.",
    canonicalMemoryTriggers: [
      {
        memoryId: "abraxia_mem_1",
        unlockAffection: 35,
        keywords: /\b(scar|throat|whetstone|watch|broth|guard|silent)\b/i,
      },
      {
        memoryId: "abraxia_mem_2",
        unlockAffection: 65,
        keywords: /\b(damascus\s+chain|needle|neurotoxin|runeblade|kopis)\b/i,
      },
    ],
  },
  "garrick ironbrow": {
    guardTier: "WARM_RIVAL",
    badgeLabel: "Veteran Grit • Old-Guard Bulwark",
    lowTierMaxGain: 2,
    trustStepPerResonance: 1.0,
    guardedThreshold: 22,
    whatEarnsAffection:
      "Keeping young teammates alive on tough floors, holding steady shield discipline instead of chasing flashy tier lists, and respecting hard-won soldier wisdom.",
    armorCrackTell:
      "He huffs into his white beard to hide a flicker of pride, resting his notched great-axe on his shoulder with unmistakable fatherly approval.",
    initialSentiment:
      "Gruff Fatherly Vigilance — He keeps his boots planted between danger and the rookies, already silently rooting for a smart 1★ kid to beat the odds.",
    canonicalMemoryTriggers: [
      {
        memoryId: "garrick_mem_1",
        unlockAffection: 35,
        keywords: /\b(apprentice|floor\s+35|malt|pipe|rookie|barracks\s+fire)\b/i,
      },
      {
        memoryId: "garrick_mem_2",
        unlockAffection: 65,
        keywords: /\b(old\s+iron|battleaxe|threshold\s+boss|choke[- ]point|bastion)\b/i,
      },
    ],
  },
  "lyra nocturne": {
    guardTier: "SELECTIVE",
    badgeLabel: "Selective Guard • Banner Prodigy",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.65,
    guardedThreshold: 32,
    whatEarnsAffection:
      "Calling flawless stagger windows for her spells, saving her from mana-backlash with pre-cast foresight, and reassuring her she will never be benched.",
    armorCrackTell:
      "Her sharp, aristocratic composure stammers into a crimson blush as she snaps her astrolabe staff upright, fiercely insisting she didn't need your callout.",
    initialSentiment:
      "Indignant Perfectionism — She resents taking orders from a 1★ unit, yet watches your every boss prediction with startled, grudging fascination.",
    canonicalMemoryTriggers: [
      {
        memoryId: "lyra_mem_1",
        unlockAffection: 35,
        keywords: /\b(backlash|miscast|stagger\s+window|astrolabe|cast\s+bar|emerald\s+halo)\b/i,
      },
      {
        memoryId: "lyra_mem_2",
        unlockAffection: 65,
        keywords: /\b(bench|replace|four[- ]star|star[- ]berry|constellation|nocturne)\b/i,
      },
    ],
  },
  "mei zhou": {
    guardTier: "WARM_RIVAL",
    badgeLabel: "Big-Sister Spark • Cursed Brawler",
    lowTierMaxGain: 2,
    trustStepPerResonance: 1.0,
    guardedThreshold: 20,
    whatEarnsAffection:
      "Sharing hot rations after a brutal climb, refusing to let her shoulder lethal blows alone, and standing beside her during quiet nights at the Memorial Wall.",
    armorCrackTell:
      "Her fearless grin pauses as her scarlet eyes trace your face—slowly exhaling the tension around her cursed crimson claw-arm.",
    initialSentiment:
      "Fierce Warmth — She claps you on the shoulder with loud confidence, determined to keep morale bright so nobody else has to end up on a stone slab.",
    canonicalMemoryTriggers: [
      {
        memoryId: "mei_mem_1",
        unlockAffection: 35,
        keywords: /\b(memorial\s+wall|hotpot|chili|rations|midnight|former\s+guild)\b/i,
      },
      {
        memoryId: "mei_mem_2",
        unlockAffection: 65,
        keywords: /\b(blood[- ]curse|floor\s+20|crimson\s+claw|eye[- ]sigil|tattoo)\b/i,
      },
    ],
  },
  godiva: {
    guardTier: "SELECTIVE",
    badgeLabel: "Selective Guard • Void-Walker",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.65,
    guardedThreshold: 30,
    whatEarnsAffection:
      "Meeting her cryptic banter without blinking, trusting her dimensional blinks in combat, and never prying clumsily into the tear-scar beneath her eye.",
    armorCrackTell:
      "The floating Void Star over her fingers stills for a silent beat as her smoky gaze narrows in genuine intrigue—her velvet teasing turning unexpectedly candid.",
    initialSentiment:
      "Cryptic Amusement — She circles just beyond reach through tiny spatial rifts, weighing whether a 1★ Anomaly actually understands the dark.",
    canonicalMemoryTriggers: [
      {
        memoryId: "godiva_mem_1",
        unlockAffection: 35,
        keywords: /\b(mask|tear[- ]?scar|rift\s+scar|void\s+hex|nightshade|grimoire)\b/i,
      },
      {
        memoryId: "godiva_mem_2",
        unlockAffection: 65,
        keywords: /\b(triple\s+arcane\s+blink|void\s+star|dimensional\s+rift|horizon)\b/i,
      },
    ],
  },
  "sir roland vance": {
    guardTier: "SELECTIVE",
    badgeLabel: "Selective Guard • Exiled Paladin",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.65,
    guardedThreshold: 34,
    whatEarnsAffection:
      "Delivering crisp, accountable battlefield callouts with zero casualties, leading from the front, and honoring truth over gilded guild politics.",
    armorCrackTell:
      "He slowly unfolds his plated arms and dips his chin by half an inch—no trace of aristocratic skepticism left in his cool blue eyes.",
    initialSentiment:
      "Skeptical Scrutiny — He evaluates every tactical call like an inspection drill, demanding proof before yielding an inch of cathedral steel to a 1★ captain.",
    canonicalMemoryTriggers: [
      {
        memoryId: "roland_mem_1",
        unlockAffection: 35,
        keywords: /\b(apex\s+concord|exile|casualty\s+ledger|guild\s+politics|cathedral)\b/i,
      },
      {
        memoryId: "roland_mem_2",
        unlockAffection: 65,
        keywords: /\b(riposte|crimson\s+cloak|silver\s+plate|parry|sovereign\s+judgment)\b/i,
      },
    ],
  },
  "aurelle, the seraph lance": {
    guardTier: "IRONCLAD",
    badgeLabel: "Ironclad Guard • 5★ Lonely Legend",
    lowTierMaxGain: 1,
    trustStepPerResonance: 0.5,
    guardedThreshold: 42,
    whatEarnsAffection:
      "Refusing to treat her as an invincible SSR trophy carry, stepping beside her into danger despite the star gap, and insisting she live as a comrade rather than a weapon.",
    armorCrackTell:
      "Her ice-blue eyes widen for a silent heartbeat as her golden seraph wings lower slightly—unable to process a 1★ commander willingly bleeding to shield a five-star.",
    initialSentiment:
      "Frozen Detachment — Traded through too many dead accounts, she expects you to hide behind her lance until you prove you value her life as much as the squad's.",
    canonicalMemoryTriggers: [
      {
        memoryId: "aurelle_mem_1",
        unlockAffection: 40,
        keywords: /\b(trophy|solo\s+carry|shield\s+her|stand\s+beside|five[- ]star|isolation)\b/i,
      },
      {
        memoryId: "aurelle_mem_2",
        unlockAffection: 70,
        keywords: /\b(seraph\s+wing|longinus|island\s+edge|star\s+gate\s+plaza|freedom)\b/i,
      },
    ],
  },
};

export function getHeroineResistanceProfile(
  companionOrName?: Partial<StoryCompanion> | string | null
): HeroineResistanceProfile {
  const rawName =
    typeof companionOrName === "string"
      ? companionOrName
      : companionOrName?.name || "";
  const norm = rawName.toLowerCase().trim();

  for (const [key, profile] of Object.entries(HEROINE_RESISTANCE_CATALOG)) {
    if (norm.includes(key) || key.includes(norm) && norm.length >= 3) {
      return profile;
    }
  }

  // Check Sovereign Spire / Dark Fantasy or custom heroines by name/personality
  const personality =
    typeof companionOrName === "object" && companionOrName
      ? `${companionOrName.personality || ""} ${companionOrName.title || ""} ${companionOrName.role || ""}`.toLowerCase()
      : norm;

  if (
    /beatrix|cassia|serena|aria\s+shadowthorn|cold|stoic|haughty|ice|arrogant|strict|guarded|inquisitor|noble|ojou/i.test(
      `${norm} ${personality}`
    )
  ) {
    return {
      guardTier: "IRONCLAD",
      badgeLabel: "Ironclad Guard • Composed & Exacting",
      lowTierMaxGain: 1,
      trustStepPerResonance: 0.5,
      guardedThreshold: 40,
      whatEarnsAffection:
        "Proving your competence through decisive action, respecting her code of honor, and holding your ground with unshakable charisma.",
      armorCrackTell:
        "Her disciplined composure fractures for a fleeting second—an involuntary flush, a stolen glance when she thinks you aren't looking, and unspoken inner thoughts acknowledging the magnetic pull she refuses to voice aloud.",
      initialSentiment:
        "Guarded & Exacting — She keeps a disciplined perimeter around her emotions, watching closely to see if your actions match your audacity.",
      canonicalMemoryTriggers: [],
    };
  }

  if (
    /ysolde|vespera|evelyn|morgana|cunning|teasing|sly|mysterious|calculating|schol|alchem/i.test(
      `${norm} ${personality}`
    )
  ) {
    return {
      guardTier: "SELECTIVE",
      badgeLabel: "Selective Guard • Witty & Discerning",
      lowTierMaxGain: 1,
      trustStepPerResonance: 0.65,
      guardedThreshold: 30,
      whatEarnsAffection:
        "Sharp intellectual parity, unbothered banter, and seeing beneath her calculated exterior.",
      armorCrackTell:
        "Her knowing smile wavers into genuine surprise as her gaze lingers on yours a beat too long, privately intrigued by how effortlessly you read her.",
      initialSentiment:
        "Intrigued & Selective — She weighs you with a perceptive smile, immune to textbook flattery but genuinely drawn to sharp wit and poise.",
      canonicalMemoryTriggers: [],
    };
  }

  return {
    guardTier: "WARM_RIVAL",
    badgeLabel: "Warm Rival • Expressive & Loyal",
    lowTierMaxGain: 2,
    trustStepPerResonance: 1.0,
    guardedThreshold: 22,
    whatEarnsAffection:
      "Sincere emotional honesty, shared effort side by side, and protective loyalty.",
    armorCrackTell:
      "Her cheeks warm immediately and her eyes brighten, unable to hide how much your attention means to her.",
    initialSentiment:
      "Warm & Attentive — She responds openly to your presence, appreciative of honest teamwork and genuine camaraderie.",
    canonicalMemoryTriggers: [],
  };
}

const SURFACE_FLATTERY_REGEX =
  /\b(pickup\s+line|catcall|grope|grab\s+her\s+waist|force\s+a\s+kiss|kiss\s+her\s+lips|you're\s+so\s+hot|sexy\s+babe|be\s+my\s+girl)\b/i;

const GENUINE_CHARISMA_REGEX =
  /\b(hold\s+her\s+gaze|meet\s+her\s+(?:eyes|gaze)|call\s+her\s+bluff|step\s+closer|lean\s+in|brush\s+her|shield\s+her|protect\s+her|whisper|sincere\s+promise|defend\s+her|raise\s+the\s+stakes)\b/i;

export function evaluateCharismaAndArmorCrack(params: {
  actionText: string;
  companion?: Partial<StoryCompanion> | null;
  rawDelta: number;
}): {
  isSurfaceAdvance: boolean;
  isGenuineCharisma: boolean;
  triggersArmorCrack: boolean;
  bpmBonus: number;
} {
  const action = (params.actionText || "").trim();
  const aff = params.companion?.affection ?? 20;
  const profile = getHeroineResistanceProfile(params.companion);

  const hasSurfacePattern = SURFACE_FLATTERY_REGEX.test(action);
  const hasCharismaPattern = GENUINE_CHARISMA_REGEX.test(action);

  // Surface advance triggers if affection is low (<35%) and it looks like a cheap/presumptuous line
  const isSurfaceAdvance =
    aff < 35 &&
    profile.guardTier !== "WARM_RIVAL" &&
    hasSurfacePattern &&
    params.rawDelta <= 1;

  // Genuine charisma requires a positive earned delta AND either a deliberate high-charisma play or a strong (+2) resonance beat
  const isGenuineCharisma =
    !isSurfaceAdvance &&
    params.rawDelta > 0 &&
    (hasCharismaPattern || params.rawDelta >= 2);

  // Armor cracks on IRONCLAD/SELECTIVE heroines require genuine charisma and cannot spam at very low affection (<20%) unless rawDelta >= 2
  const triggersArmorCrack =
    isGenuineCharisma &&
    (profile.guardTier === "IRONCLAD" || profile.guardTier === "SELECTIVE") &&
    (aff >= 20 || params.rawDelta >= 2) &&
    aff < 65;

  const bpmBonus = triggersArmorCrack
    ? profile.guardTier === "IRONCLAD"
      ? 3
      : 4
    : isGenuineCharisma
    ? 2
    : 0;

  return {
    isSurfaceAdvance,
    isGenuineCharisma,
    triggersArmorCrack,
    bpmBonus,
  };
}

export function calculateEarnedAffectionDelta(params: {
  companion: StoryCompanion;
  rawDelta: number;
  actionText: string;
  activeCap: number;
  isGiftInteraction?: boolean;
  isMilestoneBreakthrough?: boolean;
}): {
  appliedDelta: number;
  newAffection: number;
  updatedTrustProgress: number;
  updatedArmorCrackCount: number;
  isArmorCracked: boolean;
  resistanceNote: string | null;
  bpmSpikeBonus: number;
  crossedMilestone: number | null;
} {
  const { companion, rawDelta, actionText, activeCap, isGiftInteraction, isMilestoneBreakthrough } = params;
  const currentAff = typeof companion.affection === "number" ? companion.affection : 0;
  const profile = getHeroineResistanceProfile(companion);
  let trustProgress = typeof companion.trustProgress === "number" ? companion.trustProgress : 0;
  let armorCrackCount = typeof companion.armorCrackCount === "number" ? companion.armorCrackCount : 0;

  const charismaEval = evaluateCharismaAndArmorCrack({
    actionText,
    companion,
    rawDelta,
  });

  // 1. Handle negative deltas (friction/dislikes always apply immediately)
  if (rawDelta < 0) {
    const appliedNegative = Math.max(-5, rawDelta);
    const newAffection = Math.max(0, Math.min(100, currentAff + appliedNegative));
    return {
      appliedDelta: newAffection - currentAff,
      newAffection,
      updatedTrustProgress: Math.max(0, trustProgress - 0.25),
      updatedArmorCrackCount: armorCrackCount,
      isArmorCracked: false,
      resistanceNote: `${companion.name}'s guard hardened (${appliedNegative}% Affection).`,
      bpmSpikeBonus: 0,
      crossedMilestone: null,
    };
  }

  // 2. Handle surface-level/presumptuous flattery on guarded heroines at low affection
  if (charismaEval.isSurfaceAdvance) {
    const backfireDelta = profile.guardTier === "IRONCLAD" && currentAff < 25 ? -1 : 0;
    const newAffection = Math.max(0, currentAff + backfireDelta);
    return {
      appliedDelta: newAffection - currentAff,
      newAffection,
      updatedTrustProgress: trustProgress,
      updatedArmorCrackCount: armorCrackCount,
      isArmorCracked: false,
      resistanceNote: `${companion.name} deflected the surface-level advance—she requires genuine charisma or proven action.`,
      bpmSpikeBonus: 0,
      crossedMilestone: null,
    };
  }

  // 3. Handle Gift or Milestone Breakthrough (bypass fractional resistance, respect cap)
  if (isGiftInteraction || isMilestoneBreakthrough) {
    const maxGiftGain = isMilestoneBreakthrough ? 5 : Math.min(4, Math.max(1, rawDelta));
    const unclamped = currentAff + maxGiftGain;
    const newAffection = Math.max(0, Math.min(activeCap, unclamped));
    const crossed =
      [25, 50, 75, 90].find((m) => currentAff < m && newAffection >= m) || null;
    if (charismaEval.triggersArmorCrack) {
      armorCrackCount += 1;
    }
    return {
      appliedDelta: newAffection - currentAff,
      newAffection,
      updatedTrustProgress: trustProgress,
      updatedArmorCrackCount: armorCrackCount,
      isArmorCracked: charismaEval.triggersArmorCrack,
      resistanceNote: null,
      bpmSpikeBonus: charismaEval.bpmBonus,
      crossedMilestone: crossed,
    };
  }

  // 4. Standard Turn Progression with Heroine Guard Resistance & Armor Cracks
  let appliedDelta = 0;
  let resistanceNote: string | null = null;
  let isArmorCracked = false;

  if (rawDelta > 0) {
    if (currentAff < profile.guardedThreshold && profile.guardTier !== "WARM_RIVAL") {
      // Guarded phase: accumulate trustProgress via proven competence & value alignment
      const step =
        rawDelta >= 2 && charismaEval.isGenuineCharisma
          ? Math.min(1.0, profile.trustStepPerResonance * 1.4)
          : profile.trustStepPerResonance;
      trustProgress = Number((trustProgress + step).toFixed(2));

      if (trustProgress >= 1.0) {
        appliedDelta = 1;
        trustProgress = Number((trustProgress - 1.0).toFixed(2));
        isArmorCracked = true;
        armorCrackCount += 1;
        resistanceNote = `Crack in ${companion.name}'s armor! Your consistency broke through her guarded scrutiny (+1% Earned Affection).`;
      } else {
        appliedDelta = 0;
        if (charismaEval.triggersArmorCrack) {
          isArmorCracked = true;
          armorCrackCount += 1;
          resistanceNote = `Subtle crack in ${companion.name}'s guard (${Math.round(trustProgress * 100)}% toward next trust point)—she noted your move with grudging respect.`;
        } else {
          resistanceNote = `${companion.name} observed your move closely (${Math.round(trustProgress * 100)}% toward next trust point), though her outward guard remains firm.`;
        }
      }
    } else {
      // Past initial guard threshold or WARM_RIVAL heroine
      const maxAllowed = currentAff < 50 ? profile.lowTierMaxGain : 2;
      appliedDelta = Math.min(maxAllowed, rawDelta);
      if (charismaEval.triggersArmorCrack) {
        isArmorCracked = true;
        armorCrackCount += 1;
      }
    }
  }

  // Clamp against active milestone cap (25, 50, 75, 90, 100)
  const targetAffection = Math.max(0, Math.min(activeCap, currentAff + appliedDelta));
  const finalDelta = targetAffection - currentAff;
  const crossedMilestone =
    [25, 50, 75, 90].find((m) => currentAff < m && targetAffection >= m) || null;

  return {
    appliedDelta: finalDelta,
    newAffection: targetAffection,
    updatedTrustProgress: trustProgress,
    updatedArmorCrackCount: armorCrackCount,
    isArmorCracked,
    resistanceNote,
    bpmSpikeBonus: charismaEval.bpmBonus,
    crossedMilestone,
  };
}

export function synthesizeDynamicCompanionSentiment(params: {
  companion: Partial<StoryCompanion>;
  llmSentiment?: string | null;
  actionText?: string;
  appliedDelta?: number;
  isArmorCracked?: boolean;
  activeCap?: number;
}): string {
  const { companion, llmSentiment, actionText, appliedDelta = 0, isArmorCracked = false } = params;
  const aff = companion.affection ?? 20;
  const profile = getHeroineResistanceProfile(companion);

  const tierPrefix =
    aff < 25
      ? "Guarded & Observant"
      : aff < 45
      ? "Warming Rivalry"
      : aff < 70
      ? "Flustered Complicity"
      : aff < 90
      ? "Deep Romantic Tension"
      : "Devoted Dyad Harmony";

  // If LLM generated a fresh choice-driven sentiment on this turn, pair it with the canonical tier prefix
  if (llmSentiment && llmSentiment.trim().length > 12) {
    const cleaned = llmSentiment.trim().replace(/^["']|["']$/g, "");
    if (cleaned.includes(tierPrefix)) {
      return cleaned;
    }
    return `${tierPrefix} — ${cleaned}`;
  }

  // If an action occurred this turn without an explicit LLM sentiment field, synthesize a dynamic update
  const isMale =
    companion.gender?.toLowerCase() === "male" ||
    /\b(vaelkor|garrick|roland)\b/i.test(companion.name || "");
  const subj = isMale ? "he" : "she";
  const poss = isMale ? "his" : "her";
  if (actionText && actionText.trim().length > 0) {
    const cleanAction = actionText
      .replace(/^\[[^\]]+\]:\s*/, "")
      .trim()
      .slice(0, 90);

    if (appliedDelta < 0) {
      return `${tierPrefix} — Bristling after your recent choice ("${cleanAction}"); ${poss} defenses have tightened and ${subj} expects you to prove your competence and sincerity.`;
    }
    if (aff < 25) {
      return `${tierPrefix} — Scrutinizing your move ("${cleanAction}") with critical standards; ${subj} acknowledges basic competence where due, but remains skeptical and far from convinced.`;
    }
    if (isArmorCracked && aff < 50) {
      return `${tierPrefix} — Outwardly maintaining ${poss} composed standards after your move ("${cleanAction}"), though a brief flicker of grudging respect and intrigue slipped past ${poss} guard.`;
    }
    if (appliedDelta > 0) {
      return `${tierPrefix} — Impressed by how you handled things ("${cleanAction}"); ${poss} respect for your judgment is steadily building.`;
    }
  }

  // If companion already has a stored currentSentiment from a previous turn, preserve it
  if (companion.currentSentiment && companion.currentSentiment.trim().length > 0) {
    if (companion.currentSentiment.includes(tierPrefix)) {
      return companion.currentSentiment;
    }
    return `${tierPrefix} — ${companion.currentSentiment}`;
  }

  // Heroine-specific initial baseline sentiment
  return `${tierPrefix} — ${profile.initialSentiment}`;
}

export function evaluateDynamicCoreMemoryUnlock(params: {
  companion: StoryCompanion;
  llmCoreMemory?: { id?: string; title?: string; summary?: string } | null;
  legacyMemoryText?: string | null;
  actionText?: string;
  narrativeText?: string;
  oldAffection: number;
  newAffection: number;
  turnNumber: number;
  location: string;
  isArmorCracked?: boolean;
}): {
  updatedCatalogIds: string[];
  updatedDynamicMemories: CompanionCoreMemory[];
  newlyUnlockedTitles: string[];
} {
  const {
    companion,
    llmCoreMemory,
    legacyMemoryText,
    actionText = "",
    narrativeText = "",
    oldAffection,
    newAffection,
    turnNumber,
    location,
    isArmorCracked = false,
  } = params;

  const profile = getHeroineResistanceProfile(companion);
  const existingCatalogIds = Array.isArray(companion.unlockedCoreMemories)
    ? [...companion.unlockedCoreMemories]
    : [];
  const existingDynamic = Array.isArray(companion.dynamicCoreMemories)
    ? [...companion.dynamicCoreMemories]
    : [];
  const newlyUnlockedTitles: string[] = [];

  const combinedText = `${actionText} ${narrativeText}`;

  // 1. Check canonical catalog memory triggers (by affection threshold OR story keywords!)
  for (const trigger of profile.canonicalMemoryTriggers) {
    if (!existingCatalogIds.includes(trigger.memoryId)) {
      const reachedAffection = newAffection >= trigger.unlockAffection;
      const matchedStoryBeat =
        newAffection >= 25 && trigger.keywords.test(combinedText);
      if (reachedAffection || matchedStoryBeat) {
        existingCatalogIds.push(trigger.memoryId);
        newlyUnlockedTitles.push(trigger.memoryId);
      }
    }
  }

  // 2. Check structured LLM core_memory_unlocked
  if (
    llmCoreMemory &&
    typeof llmCoreMemory.title === "string" &&
    llmCoreMemory.title.trim().length > 0 &&
    typeof llmCoreMemory.summary === "string" &&
    llmCoreMemory.summary.trim().length > 0
  ) {
    const memId =
      llmCoreMemory.id ||
      `mem_${companion.id}_${turnNumber}_${llmCoreMemory.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .slice(0, 24)}`;
    const isDuplicate = existingDynamic.some(
      (m) =>
        m.id === memId ||
        m.title.toLowerCase() === llmCoreMemory.title!.trim().toLowerCase()
    );
    if (!isDuplicate) {
      existingDynamic.unshift({
        id: memId,
        title: llmCoreMemory.title.trim(),
        hint: llmCoreMemory.summary.trim(),
        turnUnlocked: turnNumber,
        location,
        affectionAtUnlock: newAffection,
        category: "choice",
      });
      newlyUnlockedTitles.push(llmCoreMemory.title.trim());
    }
  } else if (
    legacyMemoryText &&
    typeof legacyMemoryText === "string" &&
    legacyMemoryText.trim().length > 10 &&
    legacyMemoryText.toLowerCase().includes((companion.name.split(" ")[0] || "").toLowerCase())
  ) {
    // 3. Fallback: If legacy new_memory_unlocked specifically mentions this heroine and no structured core memory was emitted
    const cleanSummary = legacyMemoryText.trim();
    const isDuplicate = existingDynamic.some((m) => m.hint === cleanSummary);
    if (!isDuplicate) {
      const shortTitle = `Shared Moment at ${location || "Port Solaris"}`;
      existingDynamic.unshift({
        id: `mem_${companion.id}_turn_${turnNumber}`,
        title: shortTitle,
        hint: cleanSummary,
        turnUnlocked: turnNumber,
        location,
        affectionAtUnlock: newAffection,
        category: "choice",
      });
      newlyUnlockedTitles.push(shortTitle);
    }
  }

  // 4. Automatic Milestone Breakthrough Core Memory (25%, 50%, 75%, 90%)
  const milestones = [
    {
      threshold: 25,
      title: `First Earned Trust (${companion.name.split(" ")[0]})`,
      summary: `Broke through ${companion.name}'s initial perimeter at ${location}, proving your resolve through action rather than empty words.`,
    },
    {
      threshold: 50,
      title: `Behind the Mask (${companion.name.split(" ")[0]})`,
      summary: `Earned access to ${companion.name}'s guarded inner world at ${location}, turning rivalry into unspoken complicity.`,
    },
    {
      threshold: 75,
      title: `Unanimous Heartbeat (${companion.name.split(" ")[0]})`,
      summary: `Crossed into deep romantic devotion with ${companion.name} at ${location} after standing by her side when it mattered most.`,
    },
    {
      threshold: 90,
      title: `Sworn Dyad Covenant (${companion.name.split(" ")[0]})`,
      summary: `Forged an unbreakable soulbound partnership with ${companion.name}—her heart and trust belong wholly to you.`,
    },
  ];

  for (const m of milestones) {
    if (oldAffection < m.threshold && newAffection >= m.threshold) {
      const memId = `milestone_${companion.id}_${m.threshold}`;
      if (!existingDynamic.some((em) => em.id === memId)) {
        existingDynamic.unshift({
          id: memId,
          title: m.title,
          hint: m.summary,
          turnUnlocked: turnNumber,
          location,
          affectionAtUnlock: newAffection,
          category: "milestone",
        });
        newlyUnlockedTitles.push(m.title);
      }
    }
  }

  // 5. First "Crack in the Armor" Memory for IRONCLAD/SELECTIVE heroines
  if (
    isArmorCracked &&
    (profile.guardTier === "IRONCLAD" || profile.guardTier === "SELECTIVE") &&
    existingDynamic.filter((m) => m.category === "charisma_breakthrough").length === 0 &&
    actionText.trim().length > 0
  ) {
    const cleanAct = actionText.replace(/^\[[^\]]+\]:\s*/, "").trim();
    const memId = `armor_crack_${companion.id}_first`;
    const title = `First Crack in ${companion.name.split(" ")[0]}'s Armor`;
    const summary = `At ${location}, your genuine charisma ("${cleanAct.slice(0, 80)}") slipped past ${companion.name}'s composed facade—drawing an involuntary blush and a lingering glance she refused to admit aloud.`;
    existingDynamic.unshift({
      id: memId,
      title,
      hint: summary,
      turnUnlocked: turnNumber,
      location,
      affectionAtUnlock: newAffection,
      category: "charisma_breakthrough",
    });
    newlyUnlockedTitles.push(title);
  }

  return {
    updatedCatalogIds: existingCatalogIds,
    updatedDynamicMemories: existingDynamic.slice(0, 12),
    newlyUnlockedTitles,
  };
}

export function buildEarnedRomancePacingDirective(params: {
  companion?: StoryCompanion | null;
  actionText: string;
  activeCap: number;
  protagonistName: string;
}): string {
  const { companion, actionText, activeCap, protagonistName } = params;
  if (!companion) return "";

  const aff = companion.affection ?? 20;
  const profile = getHeroineResistanceProfile(companion);
  const charismaEval = evaluateCharismaAndArmorCrack({
    actionText,
    companion,
    rawDelta: 1,
  });

  const stageLabel =
    aff < 25
      ? "STAGE 1: SKEPTICAL SCRUTINY & TESTING STANDARDS (0–24%)"
      : aff < 50
      ? "STAGE 2: WARMING RIVALRY & EARNED RESPECT (25–49%)"
      : aff < 75
      ? "STAGE 3: FLUSTERED COMPLICITY & SHARED SECRETS (50–74%)"
      : aff < 90
      ? "STAGE 4: DEEP ROMANTIC TENSION & DEVOTION (75–89%)"
      : "STAGE 5: SWORN DYAD HARMONY (90–100%)";

  const antiSycophancyRule = `--- ANTI-SYCOPHANCY & GROUNDED STANDARDS PROTOCOL (MANDATORY) ---
- NO HYPERBOLIC WORSHIP OF ROUTINE ACTIONS: ${companion.name} is an intelligent, proud individual with high standards—NOT a sycophant waiting to be dazzled by basic competence. Do NOT write purple prose comparing ${protagonistName}'s basic actions (heating a pan, leaning on a counter, making a cocky remark, or setting down utensils) to world-class legends, and do NOT make her feel his glance "like a blow to her sternum" or flush violently to her ears over ordinary moves.
- REALISTIC PUSHBACK & AGENCY: ${companion.name} has her own agenda, critiques flaws honestly, calls out arrogance, and makes ${protagonistName} work hard for a single nod of approval.
${
  aff < 25
    ? `- LOW FAVOR COMPOSURE LOCK (${aff}% < 25%): At this early stage, ${companion.name} is skeptical and observant. Even if ${protagonistName} executes a move well, her maximum reaction is a measured, grudging reassessment ("All right, at least he knows the basics—though one decent move won't save him"). FORBIDDEN AT <25% FAVOR: Violent blushing, stammering, racing heartbeat, or breathless inner monologues about how magnetic/predatory/irresistible he is.`
    : aff < 50
    ? `- MID-EARLY FAVOR PACING (${aff}% — 25–49%): ${companion.name} respects ${protagonistName}'s competence and engages in sharp, competitive banter. Only if ${protagonistName} makes a genuinely bold, witty, or protective play may a subtle, fleeting micro-tell appear (${profile.armorCrackTell}), which she immediately covers up with a sharp remark.`
    : `- EARNED ROMANTIC TENSION (${aff}% >= 50%): ${protagonistName} has genuinely earned her trust. Visible fluster, lingering physical awareness, and deeper emotional vulnerability (${profile.armorCrackTell}) are now natural when he presses his advantage.`
}`;

  const armorCrackInstruction =
    profile.guardTier === "IRONCLAD" || profile.guardTier === "SELECTIVE"
      ? `--- COURTSHIP DIFFICULTY: ${profile.badgeLabel.toUpperCase()} ---
- WHAT EARNS HER AFFECTION: ${profile.whatEarnsAffection}
- SURFACE FLATTERY GUARD: ${companion.name} is NOT won over by generic pickup lines or unearned presumptuous advances. ${
          charismaEval.isSurfaceAdvance
            ? `WARNING: The player's current action looks like a premature surface-level advance at ${aff}% affection—have ${companion.name} coolly deflect or shut it down with sharp composure (set affection_delta to 0 or -1).`
            : ""
        }`
      : `--- COURTSHIP PROFILE: ${profile.badgeLabel.toUpperCase()} ---
- WHAT EARNS HER AFFECTION: ${profile.whatEarnsAffection}
- ${companion.name} is expressive and personable when treated with sincerity, though her romantic milestones (25%, 50%, 75%, 90%) still require genuine shared action and trust.`;

  return `--- EARNED ROMANCE PROGRESSION & PACING DIRECTIVE (${companion.name.toUpperCase()} — AFFECTION: ${aff}%, CAP: ${activeCap}%) ---
- Current Relationship Stage: ${stageLabel}
${antiSycophancyRule}
${armorCrackInstruction}
- DYNAMIC SENTIMENT & CORE MEMORY OUTPUT RULES:
  * Always populate "state_updates.companion_sentiment" with 1–2 grounded sentences describing ${companion.name}'s honest assessment of ${protagonistName} after his latest choice. At <25% Favor, keep this analytical, skeptical, or grudgingly observant—NEVER breathless or infatuated.
  * Populate "state_updates.core_memory_unlocked" ({ "id", "title", "summary" }) ONLY when this turn's choice completes a major story beat, keeps a meaningful promise, or wins an actual wager/showdown.`;
}

// ============================================================================
// 8. DETERMINISTIC QUEST DIFFICULTY, LENGTH & REWARD CALIBRATION ENGINE
// ============================================================================

const QUEST_DIFFICULTY_ORDER: QuestDifficulty[] = ["E", "D", "C", "B", "A", "S", "Calamity"];

export const BASE_LEVEL_ONE_MAX_EXP = 120;
export const EXP_CURVE_GROWTH_RATE = 1.35;
export const COMPANION_SHARED_EXP_RATIO = 0.85;

/**
 * Slower, steeper RPG experience curve (~1.35x per level, rounded to clean multiples of 10).
 * Lv.1->2 = 120, Lv.2->3 = 160, Lv.3->4 = 220, Lv.4->5 = 300, Lv.5->6 = 400, Lv.9->10 = 1330, etc.
 */
export function getRequiredExpForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level || 1));
  if (safeLevel <= 1) return BASE_LEVEL_ONE_MAX_EXP;
  const raw = BASE_LEVEL_ONE_MAX_EXP * Math.pow(EXP_CURVE_GROWTH_RATE, safeLevel - 1);
  return Math.max(BASE_LEVEL_ONE_MAX_EXP, Math.round(raw / 10) * 10);
}

/**
 * Total cumulative EXP required to reach `targetLevel` starting from Level 1 (0 EXP).
 */
export function getTotalCumulativeExpForLevel(targetLevel: number): number {
  const safeTarget = Math.max(1, Math.floor(targetLevel || 1));
  let total = 0;
  for (let lvl = 1; lvl < safeTarget; lvl++) {
    total += getRequiredExpForLevel(lvl);
  }
  return total;
}

/**
 * Unified protagonist EXP & Level-Up progression resolver used across Narrative Turns,
 * Tactical Story Clashes, Labyrinth Floor Clears, System Quest Claims, and Save Normalization.
 */
export function resolveProtagonistExpGain(params: {
  level: number;
  exp: number;
  maxExp?: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  str: number;
  dex: number;
  int: number;
  unspentStatPoints?: number;
  expGained: number;
  maxLevelCap?: number;
  restoreVitalsOnLevelUp?: boolean;
}): {
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  str: number;
  dex: number;
  int: number;
  unspentStatPoints: number;
  levelsGained: number;
  hitLevelCap: boolean;
} {
  const cap =
    typeof params.maxLevelCap === "number" && params.maxLevelCap >= 1
      ? Math.floor(params.maxLevelCap)
      : 60;

  let workingLevel = Math.max(1, Math.min(cap, Math.floor(params.level || 1)));
  let workingMaxExp = getRequiredExpForLevel(workingLevel);
  let workingMaxHp = Math.max(1, Math.round(params.maxHp || 100));
  let workingMaxMp = Math.max(1, Math.round(params.maxMp || 60));
  let workingHp = Math.max(0, Math.min(workingMaxHp, Math.round(params.hp ?? workingMaxHp)));
  let workingMp = Math.max(0, Math.min(workingMaxMp, Math.round(params.mp ?? workingMaxMp)));
  let workingStr = Math.round(params.str || 10);
  let workingDex = Math.round(params.dex || 10);
  let workingInt = Math.round(params.int || 10);
  let workingUnspent = Math.max(0, Math.round(params.unspentStatPoints || 0));

  const deltaExp = Math.max(0, Math.round(params.expGained || 0));

  if (workingLevel >= cap) {
    return {
      level: cap,
      exp: 0,
      maxExp: getRequiredExpForLevel(cap),
      hp: workingHp,
      maxHp: workingMaxHp,
      mp: workingMp,
      maxMp: workingMaxMp,
      str: workingStr,
      dex: workingDex,
      int: workingInt,
      unspentStatPoints: workingUnspent,
      levelsGained: 0,
      hitLevelCap: true,
    };
  }

  let workingExp = Math.max(0, Math.round(params.exp || 0)) + deltaExp;
  let levelsGained = 0;

  while (workingExp >= workingMaxExp && workingLevel < cap) {
    workingExp -= workingMaxExp;
    workingLevel += 1;
    levelsGained += 1;
    workingMaxExp = getRequiredExpForLevel(workingLevel);
    workingMaxHp += 20;
    workingMaxMp += 10;
    workingStr += 2;
    workingDex += 2;
    workingInt += 2;
    workingUnspent += 2;

    if (params.restoreVitalsOnLevelUp !== false) {
      workingHp = workingMaxHp;
      workingMp = workingMaxMp;
    }
  }

  let hitLevelCap = false;
  if (workingLevel >= cap) {
    workingLevel = cap;
    workingExp = 0;
    workingMaxExp = getRequiredExpForLevel(cap);
    hitLevelCap = true;
  }

  return {
    level: workingLevel,
    exp: workingExp,
    maxExp: workingMaxExp,
    hp: workingHp,
    maxHp: workingMaxHp,
    mp: workingMp,
    maxMp: workingMaxMp,
    str: workingStr,
    dex: workingDex,
    int: workingInt,
    unspentStatPoints: workingUnspent,
    levelsGained,
    hitLevelCap,
  };
}

/**
 * Unified companion / squadmate EXP progression resolver using the same 1.35x curve
 * and respecting hard Star / Campaign level caps.
 */
export function resolveCompanionExpGain(params: {
  level?: number;
  exp?: number;
  expGained: number;
  maxLevelCap?: number;
  isFocalOrSynergy?: boolean;
  shareRatio?: number;
}): {
  level: number;
  exp: number;
  maxExp: number;
  sharedExp: number;
  levelsGained: number;
  hitLevelCap: boolean;
} {
  const cap =
    typeof params.maxLevelCap === "number" && params.maxLevelCap >= 1
      ? Math.floor(params.maxLevelCap)
      : 60;
  let curLevel = Math.max(1, Math.min(cap, Math.floor(params.level || 1)));
  let curMaxExp = getRequiredExpForLevel(curLevel);

  const rawGain = Math.max(0, Math.round(params.expGained || 0));
  const ratio = params.isFocalOrSynergy
    ? 1.0
    : typeof params.shareRatio === "number"
    ? params.shareRatio
    : COMPANION_SHARED_EXP_RATIO;
  const sharedExp = rawGain > 0 ? Math.max(1, Math.round(rawGain * ratio)) : 0;

  if (curLevel >= cap || sharedExp <= 0) {
    return {
      level: curLevel,
      exp: curLevel >= cap ? 0 : Math.min(curMaxExp - 1, Math.max(0, Math.round(params.exp || 0))),
      maxExp: curMaxExp,
      sharedExp: curLevel >= cap ? 0 : sharedExp,
      levelsGained: 0,
      hitLevelCap: curLevel >= cap,
    };
  }

  let curExp = Math.max(0, Math.round(params.exp || 0)) + sharedExp;
  let levelsGained = 0;

  while (curExp >= curMaxExp && curLevel < cap) {
    curExp -= curMaxExp;
    curLevel += 1;
    levelsGained += 1;
    curMaxExp = getRequiredExpForLevel(curLevel);
  }

  let hitLevelCap = false;
  if (curLevel >= cap) {
    curLevel = cap;
    curExp = 0;
    curMaxExp = getRequiredExpForLevel(cap);
    hitLevelCap = true;
  }

  return {
    level: curLevel,
    exp: curExp,
    maxExp: curMaxExp,
    sharedExp,
    levelsGained,
    hitLevelCap,
  };
}

export const QUEST_REWARD_BRACKETS: Record<
  QuestDifficulty,
  { minExp: number; maxExp: number; baseExp: number; expPerObjective: number; minGold: number; maxGold: number; baseGold: number }
> = {
  E: { minExp: 45, maxExp: 75, baseExp: 45, expPerObjective: 10, minGold: 25, maxGold: 60, baseGold: 30 },
  D: { minExp: 85, maxExp: 135, baseExp: 80, expPerObjective: 16, minGold: 60, maxGold: 120, baseGold: 75 },
  C: { minExp: 150, maxExp: 230, baseExp: 135, expPerObjective: 24, minGold: 120, maxGold: 220, baseGold: 140 },
  B: { minExp: 260, maxExp: 390, baseExp: 230, expPerObjective: 35, minGold: 250, maxGold: 400, baseGold: 280 },
  A: { minExp: 450, maxExp: 680, baseExp: 400, expPerObjective: 55, minGold: 450, maxGold: 700, baseGold: 500 },
  S: { minExp: 750, maxExp: 1150, baseExp: 680, expPerObjective: 85, minGold: 750, maxGold: 1200, baseGold: 850 },
  Calamity: { minExp: 1200, maxExp: 1800, baseExp: 1150, expPerObjective: 110, minGold: 1000, maxGold: 1500, baseGold: 1200 },
};

/**
 * Evaluates a quest's actual difficulty and completion length (objective count, stakes,
 * quest type, and current player level) so the LLM cannot randomly hand out early S-rank
 * quests or hallucinate 20,000+ EXP rewards that jump 20+ levels at once.
 */
export function calibrateQuestRankAndRewards(
  rawQuest: Partial<SystemQuest> & { title?: string; description?: string; objectives?: any[]; rewards?: any },
  options: {
    playerLevel?: number;
    turnCount?: number;
  } = {}
): SystemQuest {
  const playerLevel = Math.max(1, options.playerLevel ?? 1);
  const title = (rawQuest.title || "Unforeseen Scenario").trim();
  const description = (rawQuest.description || "System protocol initiated.").trim();
  const qType: QuestType =
    rawQuest.type && ["scenario", "sub", "urgent", "hidden", "penalty"].includes(rawQuest.type)
      ? rawQuest.type
      : "scenario";

  // 1. Normalize objectives list and measure completion length
  const rawObjs = Array.isArray(rawQuest.objectives) && rawQuest.objectives.length > 0
    ? rawQuest.objectives
    : [{ text: "Fulfill the scenario objective", completed: false }];

  const objectives = rawObjs.map((o: any) => ({
    text: typeof o === "string" ? o.trim() : (o?.text || "Investigate current surroundings").trim(),
    completed: Boolean(o?.completed),
  }));
  const objCount = objectives.length;

  // 2. Analyze actual narrative hazard / stakes from title, description, and objectives
  const combinedCorpus = `${title} ${description} ${objectives.map((o) => o.text).join(" ")}`.toLowerCase();

  const isPenaltyOrCataclysm =
    qType === "penalty" ||
    /\b(void rift|penalty scenario|causal collapse|calamity|100% milestone|sworn dyad|final boss|archon cataclysm)\b/i.test(
      combinedCorpus
    );

  const isHighStakesBossOrShowdown =
    /\b(boss|showdown|article 9|tournament|inquisitor|executioner|archon|covenant|abyssal|sovereign trial|duel|climax|90%|75%|syndicate|foreclosure)\b/i.test(
      combinedCorpus
    );

  const isModerateHazardOrMultiStep =
    /\b(ambush|infiltrat|confront|defend|investigat|wager|inspection|debt|sabotage|escort|25%|50%|clash|patrol|rival)\b/i.test(
      combinedCorpus
    );

  const isLowRiskSocialOrIntro =
    /\b(introduce|greet|talk to|speak with|survey|observe|recon|explore|taste|prep|clean|settle in|orientation|first shift|check in)\b/i.test(
      combinedCorpus
    );

  // 3. Determine intrinsic rank from Completion Length (objCount) + Actual Difficulty
  let computedRankIndex = 1; // Default D

  if (isPenaltyOrCataclysm) {
    computedRankIndex = objCount >= 4 && playerLevel >= 8 ? 6 : 4; // Calamity (late) or A
  } else if (objCount <= 1) {
    // 1-step short task: E or D (max C if urgent boss/showdown)
    if (isHighStakesBossOrShowdown) computedRankIndex = 2; // C
    else if (isModerateHazardOrMultiStep && !isLowRiskSocialOrIntro) computedRankIndex = 1; // D
    else computedRankIndex = 0; // E
  } else if (objCount === 2) {
    // 2-step short-to-medium task: E, D, or C
    if (isHighStakesBossOrShowdown) computedRankIndex = 2; // C
    else if (isLowRiskSocialOrIntro && !isModerateHazardOrMultiStep) computedRankIndex = 0; // E
    else computedRankIndex = 1; // D
  } else if (objCount === 3) {
    // 3-step full scenario: D, C, or B
    if (isHighStakesBossOrShowdown) computedRankIndex = 3; // B
    else if (isModerateHazardOrMultiStep) computedRankIndex = 2; // C
    else computedRankIndex = 1; // D
  } else {
    // 4+ objectives (long multi-stage arc): C, B, A, or S
    if (isHighStakesBossOrShowdown && objCount >= 5 && playerLevel >= 8) {
      computedRankIndex = 5; // S
    } else if (isHighStakesBossOrShowdown && objCount >= 4) {
      computedRankIndex = 4; // A
    } else if (isModerateHazardOrMultiStep) {
      computedRankIndex = 3; // B
    } else {
      computedRankIndex = 2; // C
    }
  }

  // 4. Blend with LLM's requested rank ONLY within +/- 1 tier of intrinsic length/difficulty,
  // and enforce strict Length & Player Level Ceilings so early S-ranks are impossible.
  const rawDifficulty = (rawQuest.difficulty || "C") as QuestDifficulty;
  const llmRankIndex = QUEST_DIFFICULTY_ORDER.indexOf(rawDifficulty);

  if (llmRankIndex !== -1 && !isPenaltyOrCataclysm) {
    if (llmRankIndex > computedRankIndex) {
      // Allow LLM to bump rank by at most +1 tier if not a 1-step trivial task
      if (objCount >= 2 && !isLowRiskSocialOrIntro) {
        computedRankIndex = Math.min(computedRankIndex + 1, llmRankIndex);
      }
    } else if (llmRankIndex < computedRankIndex) {
      computedRankIndex = Math.max(computedRankIndex - 1, llmRankIndex);
    }
  }

  // Hard Length-of-Completion Ceiling:
  // - 1 objective can NEVER exceed C-Rank
  // - 2 objectives can NEVER exceed C-Rank (or B-Rank if urgent boss showdown)
  // - 3 objectives can NEVER exceed B-Rank (or A-Rank at Lv.6+)
  // - S-Rank strictly requires 4+ objectives!
  if (!isPenaltyOrCataclysm) {
    if (objCount <= 1) {
      computedRankIndex = Math.min(computedRankIndex, 2); // Max C
    } else if (objCount === 2) {
      computedRankIndex = Math.min(computedRankIndex, isHighStakesBossOrShowdown ? 3 : 2); // Max C (or B for boss)
    } else if (objCount === 3) {
      computedRankIndex = Math.min(computedRankIndex, playerLevel >= 6 && isHighStakesBossOrShowdown ? 4 : 3); // Max B (or A at Lv.6+)
    }

    // Hard Campaign Stage / Player Level Ceiling (prevents random early S/A ranks):
    if (playerLevel <= 3) {
      // Early game (Lv.1-3): Max C for normal quests, Max B for 3+ step major showdowns
      const earlyMax = objCount >= 3 && isHighStakesBossOrShowdown ? 3 : 2;
      computedRankIndex = Math.min(computedRankIndex, earlyMax);
    } else if (playerLevel <= 6) {
      // Mid game (Lv.4-6): Max B for normal quests, Max A for 4+ step major arcs
      const midMax = objCount >= 4 && isHighStakesBossOrShowdown ? 4 : 3;
      computedRankIndex = Math.min(computedRankIndex, midMax);
    } else if (playerLevel < 8) {
      // Upper-mid game (Lv.7): Max A
      computedRankIndex = Math.min(computedRankIndex, 4);
    }
  }

  const calibratedDifficulty: QuestDifficulty =
    QUEST_DIFFICULTY_ORDER[Math.max(0, Math.min(QUEST_DIFFICULTY_ORDER.length - 1, computedRankIndex))];

  // 5. Deterministically calibrate EXP and Gold rewards to match the calibrated Rank & Objective Count
  const bracket = QUEST_REWARD_BRACKETS[calibratedDifficulty];
  const targetExp = Math.min(
    bracket.maxExp,
    Math.max(bracket.minExp, bracket.baseExp + Math.min(5, objCount) * bracket.expPerObjective)
  );

  const rawExp = Number(rawQuest.rewards?.exp);
  // If rawExp is within the valid bracket for this rank, preserve it; otherwise use deterministic targetExp
  const calibratedExp =
    !isNaN(rawExp) && rawExp >= bracket.minExp && rawExp <= bracket.maxExp
      ? Math.round(rawExp)
      : targetExp;

  const rawGold = Number(rawQuest.rewards?.gold);
  const calibratedGold =
    !isNaN(rawGold) && rawGold > 0
      ? Math.min(bracket.maxGold, Math.max(bracket.minGold, Math.round(rawGold)))
      : rawGold === 0
      ? 0
      : bracket.baseGold;

  const calibratedStatPoints =
    calibratedDifficulty === "S" || calibratedDifficulty === "Calamity"
      ? 2
      : calibratedDifficulty === "A" || calibratedDifficulty === "B"
      ? 1
      : undefined;

  return {
    id: rawQuest.id || `quest_${Date.now()}`,
    title,
    description,
    type: qType,
    difficulty: calibratedDifficulty,
    objectives,
    rewards: {
      ...(rawQuest.rewards || {}),
      exp: calibratedExp,
      ...(calibratedGold > 0 ? { gold: calibratedGold } : {}),
      ...(Array.isArray(rawQuest.rewards?.items) ? { items: rawQuest.rewards.items.slice(0, 3) } : {}),
      ...(rawQuest.rewards?.title ? { title: rawQuest.rewards.title } : {}),
      ...(calibratedStatPoints ? { statPoints: calibratedStatPoints } : {}),
    },
    status: rawQuest.status || "active",
    ...(rawQuest.progressNote ? { progressNote: rawQuest.progressNote } : {}),
    ...(rawQuest.failureConsequence ? { failureConsequence: rawQuest.failureConsequence } : {}),
    ...(typeof rawQuest.isClaimed === "boolean" ? { isClaimed: rawQuest.isClaimed } : {}),
    ...(rawQuest.claimedAt ? { claimedAt: rawQuest.claimedAt } : {}),
  };
}

export type EarnedExpTier =
  | "IDLE_OR_SOCIAL"
  | "TACTICAL_CHECK"
  | "COMBAT_SKIRMISH"
  | "ENEMY_KILL"
  | "CLASH_VICTORY"
  | "FLOOR_CLEAR"
  | "DELEGATED";

/**
 * Earned-Only EXP Evaluator for narrative turns.
 * - Returns 0 EXP for casual chat, flirting, resting, shopping, lobby summons, or walking between rooms.
 * - Awards 12–26 EXP for genuine tactical risks, skill checks, trap disarms, training, or active spell/flair exertion.
 * - Awards 24–48 EXP for live combat skirmishes, ambushes, or lethal hazard counterplay in prose.
 * - Awards 35–120 EXP when a hostile enemy or pack is deterministically slain in prose/mechanics.
 */
export function evaluateEarnedTurnExp(params: {
  rawLlmExp?: number;
  actionText?: string | null;
  storyText?: string | null;
  mechanicsText?: string | null;
  hpChange?: number;
  mpChange?: number;
  isOOC?: boolean;
  isClashResolutionTurn?: boolean;
  isSummonGreetingTurn?: boolean;
  storyClashEscalated?: boolean;
  floorCleared?: boolean;
}): {
  expGained: number;
  tier: EarnedExpTier;
  reason: string | null;
} {
  const action = (params.actionText || "").trim();
  const story = (params.storyText || "").trim();
  const mechanics = (params.mechanicsText || "").trim();
  const hpDelta = Number(params.hpChange || 0);
  const mpDelta = Number(params.mpChange || 0);

  // Delegated or OOC turns: EXP is already handled by Clash Victory / Floor Clear or must be 0
  if (
    params.isOOC ||
    action.startsWith("[OOC:") ||
    params.isClashResolutionTurn ||
    params.isSummonGreetingTurn ||
    params.floorCleared
  ) {
    return { expGained: 0, tier: "DELEGATED", reason: null };
  }

  const actionLower = action.toLowerCase();
  const combinedLower = `${actionLower} ${story.toLowerCase()}`;
  const storyAndMechanicsLower = `${story.toLowerCase()} ${mechanics.toLowerCase()}`;

  const hasEnemyKillInStory =
    /\b(slain|killed|eliminated|neutralized|defeated|finishing\s+blow|dissolves?\s+into\s+(?:star\s+)?ash|shatters?\s+into\s+(?:star\s+)?ash|crumbles?\s+into\s+(?:star\s+)?ash|collapses?\s+(?:dead|lifeless|motionless|in\s+a\s+heap|to\s+the\s+stone)|falls?\s+(?:dead|lifeless|limp)|corpse\s+(?:hits|slumps|thuds|topples)|skull\s+(?:cracks|shatters|caves|splits)|throat\s+(?:slit|severed|pierced|torn)|pack\s+is\s+wiped|hostile\s+down|target\s+eliminated|enemy\s+felled|drops?\s+dead|breathes?\s+its\s+last)\b/i.test(
      storyAndMechanicsLower
    );

  // 1. Check for active Combat / Lethal Hazard Skirmish / Enemy Kill in narrative
  const hasActionCombatIntent =
    /\b(attack|strike|slash|stab|parry|block|ambush|lunge|cleave|shoot|fire at|cast .* at|execute|grapple|intercept|sever|shatter|shield bash|engage|defend against|counterattack|counter-attack|focus fire|kill|slay|finish|flank|assault|charge|blitz|crush|impale|decapitate|pierce|snipe|blast|smite|drop|take down|eliminate|neutralize|unleash|detonate)\b/i.test(
      actionLower
    ) || /\[(combat|tactics|arcana)\b/i.test(actionLower);

  // Explicit idle / casual social / rest / lobby patterns when no hazard or check occurred
  const isExplicitlyIdleOrRest =
    /\b(sleep|take a nap|rest at|sit down and chat|order a drink|sip coffee|sip espresso|check the menu|browse the stalls|go to bed|call it a night|greet the newly materialized|casual chat|small talk|relax on)\b/i.test(
      actionLower
    ) &&
    hpDelta >= 0 &&
    mpDelta >= 0 &&
    !params.storyClashEscalated &&
    !hasEnemyKillInStory &&
    !hasActionCombatIntent;

  if (isExplicitlyIdleOrRest) {
    return { expGained: 0, tier: "IDLE_OR_SOCIAL", reason: null };
  }

  if (hasEnemyKillInStory) {
    const raw = Number(params.rawLlmExp);
    const killExp =
      !isNaN(raw) && raw >= 35 && raw <= 120 ? Math.round(raw) : 45;
    return {
      expGained: killExp,
      tier: "ENEMY_KILL",
      reason: "Hostile Slain in Combat",
    };
  }

  const hasLethalStoryExchange =
    /\b(blade\s+bites|claws\s+rake|fangs\s+sink|blood\s+sprays|parries\s+the\s+blow|dodges\s+the\s+cleave|mana-core\s+shatters|monster\s+roars|ambush\s+springs|crossbow\s+bolt|arcane\s+blast|lunges\s+for|weapon\s+clashes|steel\s+rings|goblin|shaman|mimic|revenant|hound|construct|spear\s+thrust|shield\s+bash|poise\s+break|staggered|critical\s+hit|vital\s+strike|black\s+ichor|star\s+ash)\b/i.test(
      combinedLower
    );

  if (
    params.storyClashEscalated ||
    hpDelta <= -8 ||
    (hasActionCombatIntent && (hasLethalStoryExchange || hpDelta < 0 || mpDelta <= -8))
  ) {
    const raw = Number(params.rawLlmExp);
    const baseSkirmish =
      !isNaN(raw) && raw >= 24 && raw <= 48
        ? Math.round(raw)
        : hpDelta <= -15 || params.storyClashEscalated
        ? 38
        : 28;
    return {
      expGained: baseSkirmish,
      tier: "COMBAT_SKIRMISH",
      reason: params.storyClashEscalated ? "Hostile Ambush Engaged" : "Combat Skirmish",
    };
  }

  // 2. Check for Tactical Maneuver, Skill Check, Trap Disarm, Training, or Active Wager Round
  const hasMechanicsCheck =
    /\b(dc\s*\d+|roll|skill check|check passed|check succeeded|tactical advantage|weak[- ]spot|telegraph|disarm|stealth check|persuasion check|perception check)\b/i.test(
      mechanics
    );
  const hasTacticalAction =
    /\b(disarm|lockpick|scout|infiltrate|sneak|track|decipher|interrogate|negotiate terms|wager|showdown|spar|train|drill|rig a trap|analyze telegraph|anchor .* rune|channel|purify|stabilize|bandage|triage|fortify)\b/i.test(
      actionLower
    );

  if (hasMechanicsCheck || hasTacticalAction || mpDelta <= -6 || (hpDelta < 0 && hpDelta > -8)) {
    const raw = Number(params.rawLlmExp);
    const baseTactical =
      !isNaN(raw) && raw >= 12 && raw <= 26
        ? Math.round(raw)
        : hasMechanicsCheck && mpDelta < 0
        ? 22
        : 16;
    const reason = hasMechanicsCheck
      ? "Skill Check Breakthrough"
      : mpDelta <= -6
      ? "Arcane / Flair Technique"
      : "Tactical Maneuver";
    return {
      expGained: baseTactical,
      tier: "TACTICAL_CHECK",
      reason,
    };
  }

  // 3. Default: Pure conversation, romance banter, exploration stroll, or observation = 0 EXP
  return {
    expGained: 0,
    tier: "IDLE_OR_SOCIAL",
    reason: null,
  };
}

/**
 * Calculates deterministic EXP earned from winning an active Story Clash encounter,
 * scaled by enemy Threat Rank, Enemy Max HP, and relative Player Level (anti-overfarming).
 */
export function calculateClashVictoryExp(params: {
  threatRank?: QuestDifficulty | string | null;
  enemyMaxHp?: number;
  playerLevel?: number;
  enemyName?: string;
}): {
  expGained: number;
  reason: string;
} {
  const rank = (params.threatRank || "C") as QuestDifficulty;
  const baseByRank: Record<string, { exp: number; expectedLevel: number }> = {
    E: { exp: 50, expectedLevel: 1 },
    D: { exp: 85, expectedLevel: 3 },
    C: { exp: 135, expectedLevel: 5 },
    B: { exp: 215, expectedLevel: 9 },
    A: { exp: 330, expectedLevel: 14 },
    S: { exp: 500, expectedLevel: 20 },
    Calamity: { exp: 750, expectedLevel: 28 },
  };

  const entry = baseByRank[rank] || baseByRank.C;
  const maxHpBonus = Math.min(45, Math.max(0, Math.round(((params.enemyMaxHp || 100) - 80) * 0.2)));
  const pLevel = Math.max(1, params.playerLevel || 1);
  const levelDiff = entry.expectedLevel - pLevel;

  // Underdog bonus up to 1.25x against higher-tier threats; diminishing returns down to 0.35x when overleveled
  const levelScale =
    levelDiff >= 0
      ? Math.min(1.25, 1 + levelDiff * 0.05)
      : Math.max(0.35, 1 + levelDiff * 0.08);

  const expGained = Math.max(15, Math.round((entry.exp + maxHpBonus) * levelScale));
  const cleanName = (params.enemyName || "Adversary").trim();
  return {
    expGained,
    reason: `Defeated ${cleanName} (Rank ${rank})`,
  };
}

/**
 * Strictly clamps per-turn EXP, HP, and MP deltas so LLM hallucinations
 * (e.g., outputting 30,000 HP or 25,000 EXP on a single narrative turn)
 * can never corrupt player vitals, UI badges, or level progression.
 * Allows 0 EXP on casual/non-combat turns!
 */
export function clampTurnProgressionDeltas(params: {
  expGained?: number;
  hpChange?: number;
  mpChange?: number;
  maxHp?: number;
  maxMp?: number;
  maxExpCap?: number;
}): {
  expGained: number;
  hpChange: number;
  mpChange: number;
} {
  const maxCap =
    typeof params.maxExpCap === "number" && params.maxExpCap >= 60
      ? Math.round(params.maxExpCap)
      : 120;
  const rawExp = Number(params.expGained);
  const expGained =
    !isNaN(rawExp) && rawExp >= 0
      ? Math.max(0, Math.min(maxCap, Math.round(rawExp)))
      : 0;

  const maxAllowedHpDelta = Math.min(50, Math.max(35, Math.round((params.maxHp ?? 100) * 0.45)));
  const rawHp = Number(params.hpChange || 0);
  const hpChange = !isNaN(rawHp)
    ? Math.max(-maxAllowedHpDelta, Math.min(maxAllowedHpDelta, Math.round(rawHp)))
    : 0;

  const maxAllowedMpDelta = Math.min(40, Math.max(25, Math.round((params.maxMp ?? 60) * 0.5)));
  const rawMp = Number(params.mpChange || 0);
  const mpChange = !isNaN(rawMp)
    ? Math.max(-maxAllowedMpDelta, Math.min(maxAllowedMpDelta, Math.round(rawMp)))
    : 0;

  return { expGained, hpChange, mpChange };
}


