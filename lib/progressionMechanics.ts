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
        memoryId: "secret_charity_patron",
        unlockAffection: 50,
        keywords: /\b(anonymous\s+patron|scholarship|grant|harbor\s+trust|secret\s+donation|charity)\b/i,
      },
      {
        memoryId: "fear_of_thunderstorms",
        unlockAffection: 75,
        keywords: /\b(thunder|lightning|storm|squall|blackout|monsoon)\b/i,
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
        memoryId: "sunrise_pier_kata",
        unlockAffection: 50,
        keywords: /\b(sunrise|dawn\s+kata|shinai|pier\s+training|morning\s+practice|bamboo\s+sword)\b/i,
      },
      {
        memoryId: "plushie_claw_machine_master",
        unlockAffection: 75,
        keywords: /\b(plushie|claw\s+machine|stuffed\s+seal|arcade\s+prize|cute)\b/i,
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
        memoryId: "flea_market_treasure_hunter",
        unlockAffection: 50,
        keywords: /\b(flea\s+market|bargain|antique|watchmaker|vintage\s+stall|appraisal)\b/i,
      },
      {
        memoryId: "handwritten_love_letters",
        unlockAffection: 75,
        keywords: /\b(letter|fountain\s+pen|wax\s+seal|calligraphy|correspondence|unsent)\b/i,
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
        memoryId: "secret_romance_sketchbook",
        unlockAffection: 50,
        keywords: /\b(sketchbook|drawing|charcoal|portrait|illustrat|art)\b/i,
      },
      {
        memoryId: "vineyard_inheritance_dispute",
        unlockAffection: 75,
        keywords: /\b(vineyard|cellar|moreau\s+estate|sommelier|vintage\s+reserve|inheritance)\b/i,
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
        memoryId: "undefeated_rhythm_queen",
        unlockAffection: 50,
        keywords: /\b(arcade|rhythm\s+game|high\s+score|neon\s+token|frame[- ]perfect|cabinet)\b/i,
      },
      {
        memoryId: "sleepless_ledger_guardian",
        unlockAffection: 75,
        keywords: /\b(ledger|accounting|3\s*a\.?m\.?|spreadsheets|late\s+night\s+books|audit\s+math)\b/i,
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
        memoryId: "anonymous_stray_rescuer",
        unlockAffection: 50,
        keywords: /\b(stray|kittens|alley\s+cats|dockside\s+shelter|feeding|rescue)\b/i,
      },
      {
        memoryId: "deleted_scoop_sacrifice",
        unlockAffection: 75,
        keywords: /\b(camera|deleted\s+photo|tabloid|front[- ]page\s+scoop|memory\s+card|press)\b/i,
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
        memoryId: "childhood_promise_recipe",
        unlockAffection: 50,
        keywords: /\b(recipe\s+notebook|childhood\s+promise|brioche|nonna|kitchen\s+vow|pastry)\b/i,
      },
      {
        memoryId: "jealous_apron_vigil",
        unlockAffection: 75,
        keywords: /\b(apron|patio\s+window|jealous|other\s+girls|closing\s+shift|taste[- ]test)\b/i,
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
        memoryId: "sunset_lighthouse_confession",
        unlockAffection: 50,
        keywords: /\b(lighthouse|boardwalk\s+sunset|megaphone|mascot|beacon|lantern)\b/i,
      },
      {
        memoryId: "festival_fireworks_wish",
        unlockAffection: 75,
        keywords: /\b(fireworks|regatta|summer\s+festival|lantern\s+launch|wish)\b/i,
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
        memoryId: "moonlight_greenhouse_bloom",
        unlockAffection: 50,
        keywords: /\b(greenhouse|night[- ]blooming|orchid|botanical|tea\s+blend|herbal)\b/i,
      },
      {
        memoryId: "grandmother_apothecary_journal",
        unlockAffection: 75,
        keywords: /\b(apothecary|grandmother|delacroix\s+journal|elixir|heirloom\s+seeds)\b/i,
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
  if (actionText && actionText.trim().length > 0) {
    const cleanAction = actionText
      .replace(/^\[[^\]]+\]:\s*/, "")
      .trim()
      .slice(0, 90);

    if (appliedDelta < 0) {
      return `${tierPrefix} — Bristling after your recent choice ("${cleanAction}"); her defenses have tightened and she expects you to prove your competence and sincerity.`;
    }
    if (aff < 25) {
      return `${tierPrefix} — Scrutinizing your move ("${cleanAction}") with critical standards; she acknowledges basic competence where due, but remains skeptical and far from convinced.`;
    }
    if (isArmorCracked && aff < 50) {
      return `${tierPrefix} — Outwardly maintaining her composed standards after your move ("${cleanAction}"), though a brief flicker of grudging respect and intrigue slipped past her guard.`;
    }
    if (appliedDelta > 0) {
      return `${tierPrefix} — Impressed by how you handled things ("${cleanAction}"); her respect for your judgment is steadily building.`;
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

export const QUEST_REWARD_BRACKETS: Record<
  QuestDifficulty,
  { minExp: number; maxExp: number; baseExp: number; expPerObjective: number; minGold: number; maxGold: number; baseGold: number }
> = {
  E: { minExp: 35, maxExp: 55, baseExp: 35, expPerObjective: 8, minGold: 25, maxGold: 60, baseGold: 30 },
  D: { minExp: 60, maxExp: 90, baseExp: 55, expPerObjective: 12, minGold: 60, maxGold: 120, baseGold: 75 },
  C: { minExp: 95, maxExp: 140, baseExp: 85, expPerObjective: 16, minGold: 120, maxGold: 220, baseGold: 140 },
  B: { minExp: 150, maxExp: 220, baseExp: 135, expPerObjective: 22, minGold: 250, maxGold: 400, baseGold: 280 },
  A: { minExp: 240, maxExp: 340, baseExp: 210, expPerObjective: 30, minGold: 450, maxGold: 700, baseGold: 500 },
  S: { minExp: 360, maxExp: 480, baseExp: 320, expPerObjective: 38, minGold: 750, maxGold: 1200, baseGold: 850 },
  Calamity: { minExp: 450, maxExp: 550, baseExp: 450, expPerObjective: 25, minGold: 1000, maxGold: 1500, baseGold: 1200 },
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

/**
 * Strictly clamps per-turn EXP, HP, and MP deltas so LLM hallucinations
 * (e.g., outputting 30,000 HP or 25,000 EXP on a single narrative turn)
 * can never corrupt player vitals, UI badges, or level progression.
 */
export function clampTurnProgressionDeltas(params: {
  expGained?: number;
  hpChange?: number;
  mpChange?: number;
  maxHp?: number;
  maxMp?: number;
}): {
  expGained: number;
  hpChange: number;
  mpChange: number;
} {
  const rawExp = Number(params.expGained);
  const expGained =
    !isNaN(rawExp) && rawExp > 0
      ? Math.max(5, Math.min(45, Math.round(rawExp)))
      : 20;

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


