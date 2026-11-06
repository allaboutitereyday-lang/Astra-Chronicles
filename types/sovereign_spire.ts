export type PatronWing =
  | "IRON_CHANCELLERY"
  | "OBSIDIAN_CHOIR"
  | "GILDED_LOOM"
  | "WHISPERING_VEIL";

export type ConduitType = "SOMATIC" | "AETHERIAL" | "HYBRID";

export type RelicSlot = "CROWN" | "HEART" | "SPINE" | "HANDS" | "ARMAMENT";

export type SovereignOrigin =
  | "DISGRACED_HEIR"
  | "BLOOD_LEGER_DEBTOR"
  | "UNREGISTERED_ANOMALY";

export interface RelicItem {
  id: string;
  name: string;
  slot: RelicSlot;
  setId: string;
  statModifiers: {
    maxHp?: number;
    attackPower?: number;
    pulseGeneration?: number;
    fluxEfficiency?: number;
    strainResistance?: number;
  };
  whisperFlaw?: {
    description: string;
    willpowerCost: number;
    narrativeLock?: "FORCE_AGGRESSIVE" | "BLOCK_MERCY";
  };
}

export interface HeroineProfile {
  id: string;
  name: string;
  epithet: string;
  wing: PatronWing;
  conduit: ConduitType;
  bondRank: 0 | 1 | 2 | 3 | 4 | 5; // 5 = Sovereign Covenant
  affectionPoints: number;
  dyadPassiveName: string;
  dyadPassiveDescription: string;
  memoryBleedFlags: string[];
}

export interface PlayerState {
  name: string;
  origin: SovereignOrigin;
  conduit: ConduitType;
  matriculationRank: number; // #500 down to #1
  crowns: number;
  semesterDebtQuota: number;
  resonanceStrain: number; // 0 to 100 (50-85 = The Brink, 100 = Calcification Lock)
  kineticPulse: number; // 0 to 100 (Somatic resource)
  aetherFlux: number; // 100 to 0 (Aetherial resource)
  wingStanding: Record<PatronWing, number>;
  equippedRelics: Partial<Record<RelicSlot, RelicItem>>;
  activeDyadPartnerId: string | null;
}

export interface SovereignOriginPreset {
  id: SovereignOrigin;
  name: string;
  shortLabel: string;
  icon: string;
  startingRank: number;
  rankTierLabel: string;
  startingCrowns: number;
  semesterDebtQuota: number;
  defaultDetails: string;
  actOneStakes: string;
  highResonanceHeroines: string[];
}

export const SOVEREIGN_ORIGIN_PRESETS: SovereignOriginPreset[] = [
  {
    id: "BLOOD_LEGER_DEBTOR",
    name: "Blood-Ledger Debtor (Commoner / Syndicate Underdog)",
    shortLabel: "Blood-Ledger Debtor",
    icon: "🩸",
    startingRank: 488,
    rankTierLabel: "The Dross (#488)",
    startingCrowns: 45,
    semesterDebtQuota: 400,
    defaultDetails:
      "Enrolled in the Sovereign Spire under a predatory Blood-Ledger Contract underwritten by a shadow syndicate and audited by Proctor Malakor Sallow. Starting at Rank #488 in 'The Dross', you owe 400 Aether Cores before the midterm audit—or your biological nervous system and Relics are legally foreclosed upon for the Second Stratum reclamation mines.",
    actOneStakes:
      "Immediate foreclosure threat from Proctor Sallow; targeted by Corwin Baines's Rank #184 Lift-Gate toll blockade; natural underworld solidarity with Miri Thorne and Kestrel Hollow.",
    highResonanceHeroines: ["Miri Thorne", "Kestrel Hollow", "Cassia Valen"],
  },
  {
    id: "DISGRACED_HEIR",
    name: "Disgraced Highborn Heir (Political Hostage Collateral)",
    shortLabel: "Disgraced Heir",
    icon: "👑",
    startingRank: 412,
    rankTierLabel: "Lower Body (#412)",
    startingCrowns: 180,
    semesterDebtQuota: 300,
    defaultDetails:
      "Sent to the Sovereign Spire as mandatory highborn political collateral after your noble house fell into disgrace. Though fluent in Sky-Crown etiquette and Imperial steel geometry, your family estate's debt is held by Gilded Loom upperclassman Julian Thorne-Vex (Rank #42), and only a top-10% Sovereign Charter can restore your bloodline's autonomy.",
    actOneStakes:
      "Recognized by Beatrix Valorian and Cassia Valen; targeted for political extortion by Julian Thorne-Vex (#42) and Valeria Noctis's Whispering Veil brokers.",
    highResonanceHeroines: ["Cassia Valen", "Beatrix Valorian", "Valeria Noctis"],
  },
  {
    id: "UNREGISTERED_ANOMALY",
    name: "Unregistered Breach Anomaly (First-Seal Survivor)",
    shortLabel: "Breach Anomaly",
    icon: "👁️",
    startingRank: 500,
    rankTierLabel: "Unindexed (#500)",
    startingCrowns: 60,
    semesterDebtQuota: 450,
    defaultDetails:
      "Pulled from the decompressed fault-lines just above the First Seal with no Imperial birth registry and an anomalous 'white-noise' Astra core. Headmaster Caelen Vane personally signed your provisional matriculation at Rank #500 to observe you—because your skin-to-skin Soul-Grounding silences Noelle Vesper's abyssal static and halts Ysolde Kaelen's terminal crystal calcification.",
    actOneStakes:
      "Covertly watched by High Sovereign Caelen Vane and Magistra Evelyne Cross; uniquely capable of stabilizing Ysolde's crystal hands, quieting Noelle's Fourth-Stratum static, and drawing Aurelia's obsessive devotion.",
    highResonanceHeroines: ["Noelle Vesper", "Ysolde Kaelen", "Aurelia Solis"],
  },
];

export interface SovereignConduitPreset {
  id: string;
  conduit: ConduitType;
  wing: PatronWing;
  wingLabel: string;
  roleTitle: string;
  shortLabel: string;
  icon: string;
  statSpread: { str: number; dex: number; int: number };
  description: string;
  startingAbilities: {
    name: string;
    description: string;
    type: "Active" | "Passive" | "Ultimate";
    cost: string;
    cooldown: string;
    tier: string;
  }[];
  canonLoadout: {
    weapon: string;
    armor: string;
    relic: string;
    relicSlot: RelicSlot;
    setId: string;
    whisperFlaw: string;
  };
}

export const SOVEREIGN_CONDUIT_PRESETS: SovereignConduitPreset[] = [
  {
    id: "iron_chancellery_somatic",
    conduit: "SOMATIC",
    wing: "IRON_CHANCELLERY",
    wingLabel: "The Iron Chancellery",
    roleTitle: "Somatic Vanguard (Iron Chancellery)",
    shortLabel: "Somatic Vanguard",
    icon: "⚔️",
    statSpread: { str: 16, dex: 14, int: 11 },
    description:
      "Path A: Somatic Tempering. Channels Pulse-Breathing into bone marrow and steel geometry—binding blades, shattering carapace with Edge-Resonance, and dilating reflexes via Nerve-Accel.",
    startingAbilities: [
      {
        name: "Edge-Resonance Cleave",
        description:
          "Extend your nervous system into your weapon's tang using Kinetic Pulse, vibrating the steel to shear straight through Arcane barriers and construct carapace.",
        type: "Active",
        cost: "20 Kinetic Pulse",
        cooldown: "1 Turn",
        tier: "Initiate",
      },
      {
        name: "Nerve-Accel (2.5s Dilation)",
        description:
          "Flood your optic nerve and motor cortex with Somatic Astra, dilating time perception for 2–3 seconds to read enemy telegraphs and slip inside a caster's guard.",
        type: "Active",
        cost: "25 Kinetic Pulse",
        cooldown: "2 Turns",
        tier: "Adept",
      },
      {
        name: "Micro-Burst Reinforcement",
        description:
          "Trigger millisecond cellular density at the exact point of impact, dead-stopping heavy charges or turning a pommel strike into an armor-cracking hammer.",
        type: "Passive",
        cost: "0 MP",
        cooldown: "Passive",
        tier: "Initiate",
      },
    ],
    canonLoadout: {
      weapon: "Notched Chancellery Longsword (Edge-Resonance Tang)",
      armor: "Iron-Grey Initiate Greatcoat & Brigandine",
      relic: "Fractured Ashen Legion Spine-Node",
      relicSlot: "SPINE",
      setId: "The Ashen Legion",
      whisperFlaw: "Phantom Cadence: The Spine-Node hums with dead legionnaires' march-tempo, urging aggressive parries over retreat.",
    },
  },
  {
    id: "obsidian_choir_aetherial",
    conduit: "AETHERIAL",
    wing: "OBSIDIAN_CHOIR",
    wingLabel: "The Obsidian Choir",
    roleTitle: "Aetherial Spatial Weaver (Obsidian Choir)",
    shortLabel: "Aetherial Weaver",
    icon: "🔮",
    statSpread: { str: 11, dex: 13, int: 17 },
    description:
      "Path B: Aetherial Projection. Treats the body as a hollow lens to weave external Sigil-Matrices, localized gravity shears, and blood-crystal calcification wards.",
    startingAbilities: [
      {
        name: "Sigil-Matrix: Gravity Shear",
        description:
          "Weave a geometric violet Sigil-Matrix that warps local gravity, crushing enemy posture and pinning charging bruisers to the flagstones.",
        type: "Active",
        cost: "22 Aether Flux",
        cooldown: "2 Turns",
        tier: "Adept",
      },
      {
        name: "Crystallized Blood-Lance",
        description:
          "Convert ambient Astra-Miasma and a drop of vitality into razor-sharp amethyst shards that pierce armor and build Brink empowerment.",
        type: "Active",
        cost: "18 Aether Flux",
        cooldown: "1 Turn",
        tier: "Initiate",
      },
      {
        name: "Hollow Lens Attunement",
        description:
          "Filter raw Under-Vault miasma through external matrices before it touches your bloodstream, increasing Calcification Resistance and Willpower.",
        type: "Passive",
        cost: "0 MP",
        cooldown: "Passive",
        tier: "Initiate",
      },
    ],
    canonLoadout: {
      weapon: "Rite-Etched Aetherial Catalyst Blade",
      armor: "High-Collared Obsidian Choir Vestments",
      relic: "Choir of Thorns Heart-Crystal",
      relicSlot: "HEART",
      setId: "The Choir of Thorns",
      whisperFlaw: "Glass Pulse: Converts 15% of self-strain into spell potency, but turns your veins faintly violet when Resonance Strain exceeds 50%.",
    },
  },
  {
    id: "gilded_loom_hybrid",
    conduit: "HYBRID",
    wing: "GILDED_LOOM",
    wingLabel: "The Gilded Loom",
    roleTitle: "Relic Artificer & Appraiser (Gilded Loom)",
    shortLabel: "Relic Artificer",
    icon: "⚙️",
    statSpread: { str: 12, dex: 14, int: 15 },
    description:
      "Hybrid Conduit. Combines Nerve-Accel reflexes with modular Relic overcharging, alchemical flash-calcification snares, and micro-thread construct control.",
    startingAbilities: [
      {
        name: "Overcharge Relic Socket",
        description:
          "Temporarily bypass a socketed Relic's limiter to unleash +30% Brink-tier damage and expose the enemy's structural weak points.",
        type: "Active",
        cost: "18 Flux / Pulse",
        cooldown: "2 Turns",
        tier: "Adept",
      },
      {
        name: "Flash-Calcification Snare",
        description:
          "Deploy a braided alchemical wire-trap that detonates into brittle crystal bindings, halving target movement speed.",
        type: "Active",
        cost: "15 Aether Flux",
        cooldown: "1 Turn",
        tier: "Initiate",
      },
      {
        name: "Crown-Lens Appraisal",
        description:
          "Instantly read the Whisper Flaws, hidden debt clauses, and structural fractures of any Relic, construct, or rival duelist.",
        type: "Passive",
        cost: "0 MP",
        cooldown: "Passive",
        tier: "Initiate",
      },
    ],
    canonLoadout: {
      weapon: "Quick-Swap Artificer Estoc & Wire Snares",
      armor: "Vial-Lined Tailor Vest & Brass Lenses",
      relic: "Appraiser's Overcharged Crown-Lens",
      relicSlot: "CROWN",
      setId: "The Gilded Sovereign",
      whisperFlaw: "Avarice Ledger: Whispers the exact Aether Core liquidation value of every person and construct you look at.",
    },
  },
  {
    id: "whispering_veil_hybrid",
    conduit: "HYBRID",
    wing: "WHISPERING_VEIL",
    wingLabel: "The Whispering Veil",
    roleTitle: "Mist-Saber & Nerve Executioner (Whispering Veil)",
    shortLabel: "Veil Executioner",
    icon: "🗡️",
    statSpread: { str: 13, dex: 16, int: 12 },
    description:
      "Hybrid Conduit. Blends sensory-deprivation hexes and violet mist-mirages with vicious close-quarters nerve strikes, standing grapples, and concealed steel.",
    startingAbilities: [
      {
        name: "Black-Bell Sensory Hex",
        description:
          "Snuff out sound and peripheral light around your target for 3 seconds, blinding their telegraph reads while you slip inside their reach.",
        type: "Active",
        cost: "18 Flux / Pulse",
        cooldown: "2 Turns",
        tier: "Adept",
      },
      {
        name: "Mist-Mirage Tendon Sever",
        description:
          "Leave an Aetherial afterimage in the violet smoke while executing a Nerve-Accel reverse-grip slash at the opponent's guard-wrist.",
        type: "Active",
        cost: "20 Kinetic Pulse",
        cooldown: "1 Turn",
        tier: "Initiate",
      },
      {
        name: "Tribunal Pit Instinct",
        description:
          "Honed in the sunken blood-pit beneath the Velvet Spill; parries and counter-grapples build bonus Crowd Favor and Kinetic Pulse.",
        type: "Passive",
        cost: "0 MP",
        cooldown: "Passive",
        tier: "Initiate",
      },
    ],
    canonLoadout: {
      weapon: "Concealed Punch-Dagger & Curved Mist-Saber",
      armor: "Shadow-Weave Syndicate Jacket",
      relic: "Black-Bell Sensory Dampener Ring",
      relicSlot: "HANDS",
      setId: "The Silent Tribunal",
      whisperFlaw: "Merciless Clause: Boosts critical nerve-strike precision by +25%, but grows ice-cold whenever you consider sparing a treacherous rival.",
    },
  },
];

export const SOVEREIGN_HEROINE_DOSSIERS: Record<
  string,
  HeroineProfile & {
    archetype: string;
    combatDoctrine: string;
    actOneConflict: string;
    rivalBossTieIn: string;
  }
> = {
  "Cassia Valen": {
    id: "comp_cassia",
    name: "Cassia Valen",
    epithet: "The Tarnished Blade",
    wing: "IRON_CHANCELLERY",
    conduit: "SOMATIC",
    bondRank: 1,
    affectionPoints: 20,
    dyadPassiveName: "Edge-Resonance Vanguard",
    dyadPassiveDescription: "+20% Armor-Break & Guard-Shatter on synchronized Somatic binds.",
    memoryBleedFlags: ["thorne_vex_assassination_clause", "fallen_frontier_crest"],
    archetype: "Stoic Knight / Desperate Assassin",
    combatDoctrine: "Somatic Vanguard / Armor-Breaker (Longsword Binds & Pommel Kinetic Bursts)",
    actOneConflict: "Must pass the Stratum I delve quota while Julian Thorne-Vex (#42) blackmails her with her family's rigged mortgage.",
    rivalBossTieIn: "Julian Thorne-Vex (Rank #42 • The Porcelain Viper)",
  },
  "Beatrix Valorian": {
    id: "comp_beatrix",
    name: "Beatrix Valorian",
    epithet: "The Crimson Sovereign",
    wing: "IRON_CHANCELLERY",
    conduit: "SOMATIC",
    bondRank: 1,
    affectionPoints: 15,
    dyadPassiveName: "Solar Halberd Dominion",
    dyadPassiveDescription: "+25% Kinetic Pulse generation and Solar Astra cleave damage at The Brink.",
    memoryBleedFlags: ["arranged_marriage_ultimatum", "hidden_glass_figurines"],
    archetype: "Fiery Tsundere Ojou-sama / Elitist Rival",
    combatDoctrine: "Somatic Mid-Range Polearm / Solar Kinetic Striker",
    actOneConflict: "Must claim the #1 Sovereign Seat from Aldric Drakon or be pulled from the military into a forced political marriage.",
    rivalBossTieIn: "Aldric Drakon (Rank #1 • The First Sword)",
  },
  "Ysolde Kaelen": {
    id: "comp_ysolde",
    name: "Ysolde Kaelen",
    epithet: "The Glass Heretic",
    wing: "OBSIDIAN_CHOIR",
    conduit: "AETHERIAL",
    bondRank: 1,
    affectionPoints: 18,
    dyadPassiveName: "Amethyst Gravity Shear",
    dyadPassiveDescription: "Converts Resonance Strain into spatial distortion barriers and blood-crystal lances.",
    memoryBleedFlags: ["crystallized_hands_taboo", "fourth_stratum_living_relic"],
    archetype: "Tragic Ice Queen / Dying Heretic",
    combatDoctrine: "Aetherial High-Risk Blood & Spatial Mage",
    actOneConflict: "Hiding terminal Vault-crystal calcification beneath her black leather gloves before rival Lukas Castell (#9) exposes her to Proctor Sallow.",
    rivalBossTieIn: "Lukas Castell (Rank #9 • The Choir's Scalpel)",
  },
  "Aurelia Solis": {
    id: "comp_aurelia",
    name: "Aurelia Solis",
    epithet: "The Porcelain Saint",
    wing: "OBSIDIAN_CHOIR",
    conduit: "AETHERIAL",
    bondRank: 1,
    affectionPoints: 35,
    dyadPassiveName: "Martyr's Golden Tether",
    dyadPassiveDescription: "Absorbs partner trauma and purges Resonance Strain while granting +30% tethered attack power.",
    memoryBleedFlags: ["cathedral_vessel_upbringing", "sabotaged_ward_seals"],
    archetype: "Pampering Healer / Closet Yandere",
    combatDoctrine: "Aetherial Vitality Weaver / Martyr Support",
    actOneConflict: "Binds your pain receptors to her own pulse after the placement trial—while subtly loosening your defensive wards so you always crawl back to her.",
    rivalBossTieIn: "Magistra Evelyne Cross & Lukas Castell (#9)",
  },
  "Miri Thorne": {
    id: "comp_miri",
    name: "Miri Thorne",
    epithet: "The Smiling Usurer",
    wing: "GILDED_LOOM",
    conduit: "HYBRID",
    bondRank: 1,
    affectionPoints: 25,
    dyadPassiveName: "Overcharged Salvage Clause",
    dyadPassiveDescription: "+30% Aether Core yield in Stratum I and mid-combat modular Relic hot-swapping.",
    memoryBleedFlags: ["brother_stratum_three_default", "underground_aqueduct_railroad"],
    archetype: "Scheming Fixer / Secret Abolitionist",
    combatDoctrine: "Hybrid Tactical Artificer / Razor-Wire & Flash-Calcification Control",
    actOneConflict: "Funnels extortionate noble interest into an underground railroad smuggling defaulted freshmen past Proctor Sallow's reclamation squads.",
    rivalBossTieIn: "Proctor Malakor Sallow & Corwin Baines (#184)",
  },
  "Noelle Vesper": {
    id: "comp_noelle",
    name: "Noelle Vesper",
    epithet: "The Sleepless Savant",
    wing: "GILDED_LOOM",
    conduit: "AETHERIAL",
    bondRank: 1,
    affectionPoints: 28,
    dyadPassiveName: "White-Noise Puppet Matrix",
    dyadPassiveDescription: "Deploys three porcelain Vault-automata in combat and halves passive Resonance Strain buildup.",
    memoryBleedFlags: ["fourth_stratum_static_signal", "sleepless_eighty_hours"],
    archetype: "Deadpan Kuudere Shut-In / Mad Genius",
    combatDoctrine: "Aetherial Puppeteer / Necro-Artificer",
    actOneConflict: "Plagued 24/7 by the psychic static of the Fourth Stratum—until she touches your hand and discovers your aura acts as soothing white noise.",
    rivalBossTieIn: "The Fourth-Stratum Entity & Corwin Baines (#184)",
  },
  "Kestrel Hollow": {
    id: "comp_kestrel",
    name: "Kestrel Hollow",
    epithet: "The Velvet Hound (Rank #142)",
    wing: "WHISPERING_VEIL",
    conduit: "SOMATIC",
    bondRank: 1,
    affectionPoints: 22,
    dyadPassiveName: "Tether-Bound",
    dyadPassiveDescription:
      "Gains massive Kinetic Pulse when dodging or parrying within 5m of her Dyad partner; Deafening Veil blinds/deafens foes for 3s.",
    memoryBleedFlags: [
      "silas_krowe_contract_brand",
      "veil_shadow_director_leash",
      "clansmen_cheek_stripes",
    ],
    archetype: "Unarmored Somatic Brawler / Blind-Fight Duelist",
    combatDoctrine:
      "Veil CQC (Physique S, Speed A, Resilience A, Stealth S) — Somatic Overdrive micro-bursts, Deafening Veil mist, and Leash-Break Frenzy (+35% Strain)",
    actOneConflict:
      "Active Rank #142 (up from #189). Collared enforcer bound by a burning contract-brand to Silas Krowe (#19) and the Veil's Shadow Director; tests your reflexes as 'kid' before trusting you as 'Partner' to sever her leash.",
    rivalBossTieIn: "Silas Krowe (Rank #19 • The Houndmaster & Veil Shadow Director)",
  },
  "Valeria Noctis": {
    id: "comp_valeria",
    name: "Valeria Noctis",
    epithet: "The Perpetual Senior",
    wing: "WHISPERING_VEIL",
    conduit: "HYBRID",
    bondRank: 1,
    affectionPoints: 20,
    dyadPassiveName: "Violet Mist Mirage",
    dyadPassiveDescription: "Generates illusion afterimages on dodge and unlocks pre-fight Midnight Tribunal sabotage.",
    memoryBleedFlags: ["third_stratum_squad_execution", "deliberate_ethics_failure"],
    archetype: "Teasing Onee-san / Vengeance Hunter",
    combatDoctrine: "Hybrid Dual-Blade Illusionist / Executioner",
    actOneConflict: "Intentionally fails her final ethics exam every spring to hunt down Aldric Drakon (#1) and the conspirators who executed her original Dyad squad.",
    rivalBossTieIn: "Aldric Drakon (Rank #1 • The First Sword)",
  },
};

