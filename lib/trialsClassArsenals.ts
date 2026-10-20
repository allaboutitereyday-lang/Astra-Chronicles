export interface ClassTacticalAction {
  id: string;
  name: string;
  type: "strike" | "burst" | "synergy" | "defense";
  category: "Basic Attack" | "Class Burst" | "Tactical Synergy" | "Defensive Stance";
  costMp: number;
  description: string;
  effectLabel: string;
  iconType: "sword" | "zap" | "sparkles" | "shield" | "flame" | "skull" | "wand" | "target" | "dagger";
  scalingStat: "str" | "dex" | "int" | "hybrid";
  baseDamage?: number;
  baseHeal?: number;
  coherenceDelta?: number;
  badgeText: string;
}

export interface ClassArsenal {
  classKey: string;
  className: string;
  classTagline: string;
  primaryStat: "STR" | "DEX" | "INT" | "HYBRID";
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  actions: {
    strike: ClassTacticalAction;
    burst: ClassTacticalAction;
    synergy: ClassTacticalAction;
    defense: ClassTacticalAction;
  };
}

export const CLASS_ARSENALS: Record<string, ClassArsenal> = {
  voidstrider: {
    classKey: "voidstrider",
    className: "Voidstrider",
    classTagline: "Master of Dimensional Rifts & Gravitational Singularity",
    primaryStat: "HYBRID",
    accentColor: "text-cyan-400",
    badgeBg: "bg-cyan-950/40",
    badgeBorder: "border-cyan-500/40",
    actions: {
      strike: {
        id: "void_cleave",
        name: "Void Cleave",
        type: "strike",
        category: "Basic Attack",
        costMp: 0,
        description: "Shears across local spacetime with gravitational force, bypassing enemy kinetic armor.",
        effectLabel: "0 MP • Hybrid STR/DEX • +2% Coherence",
        iconType: "sword",
        scalingStat: "hybrid",
        baseDamage: 28,
        coherenceDelta: 2,
        badgeText: "High Coherence",
      },
      burst: {
        id: "singularity_collapse",
        name: "Singularity Collapse",
        type: "burst",
        category: "Class Burst",
        costMp: 25,
        description: "Compresses a localized micro-singularity directly inside the construct's core.",
        effectLabel: "25 MP • Massive Gravitational Burst",
        iconType: "zap",
        scalingStat: "hybrid",
        baseDamage: 65,
        badgeText: "Singularity Burst",
      },
      synergy: {
        id: "dimensional_tether",
        name: "Dimensional Tether",
        type: "synergy",
        category: "Tactical Synergy",
        costMp: 20,
        description: "Links spatial coordinates with allied resonance, inflicting rift damage and restoring vitality.",
        effectLabel: "20 MP • 35 DMG + 25 HP Heal",
        iconType: "sparkles",
        scalingStat: "int",
        baseDamage: 35,
        baseHeal: 25,
        coherenceDelta: 4,
        badgeText: "Duo Resonance",
      },
      defense: {
        id: "phase_shift",
        name: "Phase Shift Stance",
        type: "defense",
        category: "Defensive Stance",
        costMp: 0,
        description: "Phases your physical body into sub-dimensional space to purge bleed and fortify life force.",
        effectLabel: "0 MP • Restore +35 HP • +6% Coherence",
        iconType: "shield",
        scalingStat: "int",
        baseHeal: 35,
        coherenceDelta: 6,
        badgeText: "Phase Anchor",
      },
    },
  },

  spellblade: {
    classKey: "spellblade",
    className: "Spellblade",
    classTagline: "Weaver of Arcane Sorcery & High-Frequency Blade Arts",
    primaryStat: "HYBRID",
    accentColor: "text-blue-400",
    badgeBg: "bg-blue-950/40",
    badgeBorder: "border-blue-500/40",
    actions: {
      strike: {
        id: "aether_blade",
        name: "Aether Blade",
        type: "strike",
        category: "Basic Attack",
        costMp: 0,
        description: "Channels planar aether along the blade edge, slicing through physical and runic barriers.",
        effectLabel: "0 MP • STR + INT Scaled Slash",
        iconType: "sword",
        scalingStat: "hybrid",
        baseDamage: 27,
        coherenceDelta: 1,
        badgeText: "Aether Slash",
      },
      burst: {
        id: "elemental_tempest",
        name: "Elemental Tempest",
        type: "burst",
        category: "Class Burst",
        costMp: 25,
        description: "Unleashes a rapid three-fold elemental burst that fractures enemy energy shielding.",
        effectLabel: "25 MP • Overclocked Triple Cleave",
        iconType: "zap",
        scalingStat: "hybrid",
        baseDamage: 62,
        badgeText: "Elemental Burst",
      },
      synergy: {
        id: "harmonic_conduit",
        name: "Harmonic Conduit",
        type: "synergy",
        category: "Tactical Synergy",
        costMp: 18,
        description: "Synchronizes martial momentum with allied mana networks, inflicting aether burn and restoring MP & HP.",
        effectLabel: "18 MP • 32 DMG + 20 HP / +10 MP",
        iconType: "sparkles",
        scalingStat: "int",
        baseDamage: 32,
        baseHeal: 20,
        coherenceDelta: 3,
        badgeText: "Aether Link",
      },
      defense: {
        id: "runic_parry",
        name: "Runic Parry Stance",
        type: "defense",
        category: "Defensive Stance",
        costMp: 0,
        description: "Erects a counter-hex ward with your weapon, deflecting kinetic impact and recovering posture.",
        effectLabel: "0 MP • Restore +35 HP • Counter Reduction",
        iconType: "shield",
        scalingStat: "int",
        baseHeal: 35,
        coherenceDelta: 5,
        badgeText: "Runic Ward",
      },
    },
  },

  mage: {
    classKey: "mage",
    className: "Mage",
    classTagline: "Grand Conduit of Planar Cataclysm & High Arcana",
    primaryStat: "INT",
    accentColor: "text-purple-400",
    badgeBg: "bg-purple-950/40",
    badgeBorder: "border-purple-500/40",
    actions: {
      strike: {
        id: "mana_lance",
        name: "Mana Lance",
        type: "strike",
        category: "Basic Attack",
        costMp: 0,
        description: "Projects a high-velocity beam of compressed starlight from fingertips, piercing enemy armor.",
        effectLabel: "0 MP • Pure INT Scaling • Ranged Beam",
        iconType: "wand",
        scalingStat: "int",
        baseDamage: 26,
        coherenceDelta: 1,
        badgeText: "Mana Beam",
      },
      burst: {
        id: "cataclysmic_flare",
        name: "Cataclysmic Flare",
        type: "burst",
        category: "Class Burst",
        costMp: 25,
        description: "Conjures a superheated arcane star that detonates across the construct, melting physical matter.",
        effectLabel: "25 MP • Colossal Arcane Cataclysm",
        iconType: "zap",
        scalingStat: "int",
        baseDamage: 72,
        badgeText: "Cataclysm",
      },
      synergy: {
        id: "arcane_siphon",
        name: "Arcane Siphon & Ward",
        type: "synergy",
        category: "Tactical Synergy",
        costMp: 15,
        description: "Draws ambient aether from the chamber and allied conduits, dealing shockwave damage and recovering MP.",
        effectLabel: "15 MP • 30 DMG + 25 HP / +15 MP",
        iconType: "sparkles",
        scalingStat: "int",
        baseDamage: 30,
        baseHeal: 25,
        coherenceDelta: 4,
        badgeText: "Mana Siphon",
      },
      defense: {
        id: "chrono_rewind",
        name: "Chrono Rewind Stance",
        type: "defense",
        category: "Defensive Stance",
        costMp: 0,
        description: "Rolls personal timeline back several seconds to undo tissue trauma and restore magical reserves.",
        effectLabel: "0 MP • Restore +40 HP • +5% Coherence",
        iconType: "shield",
        scalingStat: "int",
        baseHeal: 40,
        coherenceDelta: 5,
        badgeText: "Time Reversal",
      },
    },
  },

  rogue: {
    classKey: "rogue",
    className: "Shadow Assassin",
    classTagline: "Ghost of the Underworld • Precision Lethality & Evasion",
    primaryStat: "DEX",
    accentColor: "text-emerald-400",
    badgeBg: "bg-emerald-950/40",
    badgeBorder: "border-emerald-500/40",
    actions: {
      strike: {
        id: "shadow_fang",
        name: "Shadow Fang",
        type: "strike",
        category: "Basic Attack",
        costMp: 0,
        description: "A lightning-swift twin dagger puncture targeted at structural weak points and energy seals.",
        effectLabel: "0 MP • DEX Scaled • High Critical Chance",
        iconType: "dagger",
        scalingStat: "dex",
        baseDamage: 29,
        coherenceDelta: 1,
        badgeText: "Puncture",
      },
      burst: {
        id: "assassinate",
        name: "Assassinate: Vitals Rupture",
        type: "burst",
        category: "Class Burst",
        costMp: 22,
        description: "Vanishes into reality blind-spots, executing a lethal decapitation maneuver with astronomical crit damage.",
        effectLabel: "22 MP • Critical Strike Execution",
        iconType: "target",
        scalingStat: "dex",
        baseDamage: 68,
        badgeText: "Execution",
      },
      synergy: {
        id: "phantom_flank",
        name: "Phantom Flank & Flash",
        type: "synergy",
        category: "Tactical Synergy",
        costMp: 16,
        description: "Coordinates a dual pincer ambush with allied presence, blinding the foe and mitigating counter-damage.",
        effectLabel: "16 MP • 36 DMG + Negate Counter",
        iconType: "sparkles",
        scalingStat: "dex",
        baseDamage: 36,
        baseHeal: 18,
        coherenceDelta: 3,
        badgeText: "Pincer Flank",
      },
      defense: {
        id: "smoke_vanish",
        name: "Smoke Vanish Stance",
        type: "defense",
        category: "Defensive Stance",
        costMp: 0,
        description: "Deploys a dense cloud of alchemical shadow-mist to evade detection, dress wounds, and reset posture.",
        effectLabel: "0 MP • Restore +35 HP • Evasion Stance",
        iconType: "shield",
        scalingStat: "dex",
        baseHeal: 35,
        coherenceDelta: 5,
        badgeText: "Shadow Cloak",
      },
    },
  },

  warrior: {
    classKey: "warrior",
    className: "Juggernaut",
    classTagline: "Indomitable Colossus • Unchecked Kinetic Devastation",
    primaryStat: "STR",
    accentColor: "text-amber-400",
    badgeBg: "bg-amber-950/40",
    badgeBorder: "border-amber-500/40",
    actions: {
      strike: {
        id: "heavy_cleave",
        name: "Heavy Cleave",
        type: "strike",
        category: "Basic Attack",
        costMp: 0,
        description: "Drives weight of heavy arms into the enemy shell, rupturing shields with sheer physical inertia.",
        effectLabel: "0 MP • Pure STR Scaling • Shield Breaker",
        iconType: "sword",
        scalingStat: "str",
        baseDamage: 30,
        coherenceDelta: 1,
        badgeText: "Armor Crush",
      },
      burst: {
        id: "earthshaker_slam",
        name: "Earthshaker Slam",
        type: "burst",
        category: "Class Burst",
        costMp: 20,
        description: "Leaps skyward and smashes into the chamber floor, generating a cataclysmic kinetic shockwave.",
        effectLabel: "20 MP • Colossal Stagger & Poise Crush",
        iconType: "flame",
        scalingStat: "str",
        baseDamage: 66,
        badgeText: "Earthshaker",
      },
      synergy: {
        id: "unyielding_warcry",
        name: "Unyielding Warcry",
        type: "synergy",
        category: "Tactical Synergy",
        costMp: 15,
        description: "Roars a war-cry that shakes the dimensional boundary, empowering partner strikes and crushing enemy poise.",
        effectLabel: "15 MP • 34 DMG + 20 HP Regen",
        iconType: "sparkles",
        scalingStat: "str",
        baseDamage: 34,
        baseHeal: 20,
        coherenceDelta: 3,
        badgeText: "Warcry",
      },
      defense: {
        id: "iron_juggernaut",
        name: "Iron Juggernaut Stance",
        type: "defense",
        category: "Defensive Stance",
        costMp: 0,
        description: "Hardens bone and muscular sinew against planar decay, shrugging off lethal trauma and restoring health.",
        effectLabel: "0 MP • Restore +45 HP • +5% Coherence",
        iconType: "shield",
        scalingStat: "str",
        baseHeal: 45,
        coherenceDelta: 5,
        badgeText: "Titan Poise",
      },
    },
  },

  paladin: {
    classKey: "paladin",
    className: "Solarion Templar",
    classTagline: "Vessel of Dawn & Inviolable Celestial Radiance",
    primaryStat: "STR",
    accentColor: "text-yellow-400",
    badgeBg: "bg-yellow-950/40",
    badgeBorder: "border-yellow-500/40",
    actions: {
      strike: {
        id: "radiant_strike",
        name: "Radiant Strike",
        type: "strike",
        category: "Basic Attack",
        costMp: 0,
        description: "Channels consecrated golden sunlight into the weapon, burning demonic corruption from the construct.",
        effectLabel: "0 MP • STR + INT Holy Smite",
        iconType: "sword",
        scalingStat: "hybrid",
        baseDamage: 27,
        coherenceDelta: 2,
        badgeText: "Holy Smite",
      },
      burst: {
        id: "judgment_of_dawn",
        name: "Judgment of Dawn",
        type: "burst",
        category: "Class Burst",
        costMp: 24,
        description: "Calls down a celestial pillar of thermonuclear dawn, incinerating void matter and planar anomalies.",
        effectLabel: "24 MP • Searing Holy Wrath",
        iconType: "flame",
        scalingStat: "hybrid",
        baseDamage: 64,
        badgeText: "Dawn Pillar",
      },
      synergy: {
        id: "sanctuary_sun",
        name: "Sanctuary of the Sun",
        type: "synergy",
        category: "Tactical Synergy",
        costMp: 20,
        description: "Forms a radiant solar barrier around you and your partner, punishing attackers and imparting immense healing.",
        effectLabel: "20 MP • 30 DMG + 35 HP Healing",
        iconType: "sparkles",
        scalingStat: "int",
        baseDamage: 30,
        baseHeal: 35,
        coherenceDelta: 5,
        badgeText: "Divine Ward",
      },
      defense: {
        id: "aegis_immortal",
        name: "Aegis of the Immortal",
        type: "defense",
        category: "Defensive Stance",
        costMp: 0,
        description: "Raises a towering celestial aegis that absorbs kinetic shock and cleanses timeline instability.",
        effectLabel: "0 MP • Restore +42 HP • +6% Coherence",
        iconType: "shield",
        scalingStat: "int",
        baseHeal: 42,
        coherenceDelta: 6,
        badgeText: "Divine Aegis",
      },
    },
  },

  necromancer: {
    classKey: "necromancer",
    className: "Deathweaver",
    classTagline: "Sovereign of Spectral Leech & Soul Manipulation",
    primaryStat: "INT",
    accentColor: "text-rose-400",
    badgeBg: "bg-rose-950/40",
    badgeBorder: "border-rose-500/40",
    actions: {
      strike: {
        id: "soul_syphon",
        name: "Soul Syphon",
        type: "strike",
        category: "Basic Attack",
        costMp: 0,
        description: "Tears at the enemy's life-matrix with spectral tendrils, leeching essence directly into your own body.",
        effectLabel: "0 MP • INT Scaled • Life Siphon",
        iconType: "skull",
        scalingStat: "int",
        baseDamage: 26,
        baseHeal: 8,
        coherenceDelta: 1,
        badgeText: "Life Leech",
      },
      burst: {
        id: "grave_cataclysm",
        name: "Grave Cataclysm",
        type: "burst",
        category: "Class Burst",
        costMp: 24,
        description: "Summons hands of the planar dead from spatial fissures, crushing the construct in dark necrotic frost.",
        effectLabel: "24 MP • Severe Necrotic Burst",
        iconType: "zap",
        scalingStat: "int",
        baseDamage: 67,
        badgeText: "Necrotic Frost",
      },
      synergy: {
        id: "soul_feast",
        name: "Soul Feast",
        type: "synergy",
        category: "Tactical Synergy",
        costMp: 18,
        description: "Ruptures construct cores, siphoning spilled life-energy into a shared regeneration nexus for you and allies.",
        effectLabel: "18 MP • 32 DMG + 30 HP Leech",
        iconType: "sparkles",
        scalingStat: "int",
        baseDamage: 32,
        baseHeal: 30,
        coherenceDelta: 3,
        badgeText: "Vampiric Link",
      },
      defense: {
        id: "bone_carapace",
        name: "Bone Carapace Stance",
        type: "defense",
        category: "Defensive Stance",
        costMp: 0,
        description: "Encases your frame in hardened spectral bone armor, absorbing blunt shock and purifying mortal wounds.",
        effectLabel: "0 MP • Restore +38 HP • +5% Coherence",
        iconType: "shield",
        scalingStat: "int",
        baseHeal: 38,
        coherenceDelta: 5,
        badgeText: "Bone Shield",
      },
    },
  },

  default: {
    classKey: "wanderer",
    className: "Dimensional Wanderer",
    classTagline: "Versatile Planar Combatant • Adaptive Reality Arts",
    primaryStat: "HYBRID",
    accentColor: "text-blue-400",
    badgeBg: "bg-blue-950/40",
    badgeBorder: "border-blue-500/40",
    actions: {
      strike: {
        id: "kinetic_strike",
        name: "Kinetic Strike",
        type: "strike",
        category: "Basic Attack",
        costMp: 0,
        description: "Calculated martial strike delivering concentrated kinetic shock through the enemy's defenses.",
        effectLabel: "0 MP • Balanced STR/DEX • +2% Coherence",
        iconType: "sword",
        scalingStat: "hybrid",
        baseDamage: 26,
        coherenceDelta: 2,
        badgeText: "Kinetic Strike",
      },
      burst: {
        id: "relic_burst",
        name: "Relic Overdrive",
        type: "burst",
        category: "Class Burst",
        costMp: 25,
        description: "Overclocks equipped relic matrices to discharge high-yield plasma directly into the enemy.",
        effectLabel: "25 MP • Massive Overclocked Burst",
        iconType: "zap",
        scalingStat: "hybrid",
        baseDamage: 62,
        badgeText: "Relic Burst",
      },
      synergy: {
        id: "duo_synergy",
        name: "Duo Synergy: Radiant Convergence",
        type: "synergy",
        category: "Tactical Synergy",
        costMp: 20,
        description: "Aligns your tactical momentum with party resonance to deliver combined crossfire and restorative waves.",
        effectLabel: "20 MP • 32 DMG + 25 HP Heal",
        iconType: "sparkles",
        scalingStat: "int",
        baseDamage: 32,
        baseHeal: 25,
        coherenceDelta: 4,
        badgeText: "Duo Synergy",
      },
      defense: {
        id: "anchor_reality",
        name: "Anchor Reality",
        type: "defense",
        category: "Defensive Stance",
        costMp: 0,
        description: "Drives your causal anchor into the sector floor, purifying dimensional bleed and stabilizing life force.",
        effectLabel: "0 MP • Restore +35 HP • +6% Coherence",
        iconType: "shield",
        scalingStat: "int",
        baseHeal: 35,
        coherenceDelta: 6,
        badgeText: "Anchor Reality",
      },
    },
  },
};

/**
 * Resolves a player's class role string into the appropriate ClassArsenal.
 * Handles fuzzy matches (e.g. "Aether Blade Inquisitor" -> spellblade, "Voidstrider Captain" -> voidstrider).
 */
export function getClassArsenal(roleString?: string): ClassArsenal {
  const r = (roleString || "").toLowerCase().trim();

  if (!r) return CLASS_ARSENALS.default;

  if (r.includes("void") || r.includes("singularity") || r.includes("gravit") || r.includes("space")) {
    return CLASS_ARSENALS.voidstrider;
  }
  if (r.includes("spell") || r.includes("blade") || r.includes("inquisitor") || r.includes("enchant") || r.includes("rune")) {
    return CLASS_ARSENALS.spellblade;
  }
  if (r.includes("mage") || r.includes("wizard") || r.includes("sorcerer") || r.includes("arcan") || r.includes("elemental")) {
    return CLASS_ARSENALS.mage;
  }
  if (r.includes("rogue") || r.includes("assassin") || r.includes("shadow") || r.includes("saboteur") || r.includes("thief") || r.includes("scout")) {
    return CLASS_ARSENALS.rogue;
  }
  if (r.includes("warrior") || r.includes("berserk") || r.includes("juggernaut") || r.includes("colossus") || r.includes("fighter")) {
    return CLASS_ARSENALS.warrior;
  }
  if (r.includes("paladin") || r.includes("solar") || r.includes("holy") || r.includes("templar") || r.includes("cleric") || r.includes("light")) {
    return CLASS_ARSENALS.paladin;
  }
  if (r.includes("necro") || r.includes("death") || r.includes("soul") || r.includes("grim") || r.includes("lich")) {
    return CLASS_ARSENALS.necromancer;
  }

  return CLASS_ARSENALS.default;
}

