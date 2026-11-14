import type {
  TacticalWeaknessTag,
  TowerThemeId,
  EnemyTelegraphIntent,
} from "@/lib/starfallTowerThemes";

export type StarRank = 1 | 2 | 3 | 4 | 5;

export type StarfallRole = "TACTICIAN" | "VANGUARD" | "STRIKER" | "ARCANIST";

export type StarfallOrigin =
  | "DISCARDED_EX_RANKER"
  | "WHALES_SPARE"
  | "GLITCHED_SUMMON";

export type StarfallFaction =
  | "NAMELESS_ROSTER"
  | "APEX_CONCORD"
  | "LANTERN_BROKERS"
  | "ADMINISTRATOR_ARBITERS";

export type HeroStatus = "DEPLOYED" | "BENCHED" | "WOUNDED" | "FALLEN";

export type FormationSlot = "FRONTLINE" | "RESERVE";

export type FloorType =
  | "LOBBY"
  | "COMBAT"
  | "SAFE_ZONE"
  | "GATE_BOSS"
  | "EVENT";

export interface HeroCombatStats {
  maxHp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  critRate: number; // e.g. 12 = 12%
  evasion: number; // e.g. 10 = 10%
}

export interface HeroSkillMove {
  id: string;
  name: string;
  mpCost: number;
  cooldownTurns: number;
  powerMultiplier: number;
  poiseBreak: number;
  weaknessTag?: TacticalWeaknessTag;
  isHeal?: boolean;
  isShield?: boolean;
  appliesHexSeal?: boolean;
  triggersNegativeSwitch?: boolean;
  spawnsPhantom?: boolean;
  description: string;
}

export interface HeroSkillKit {
  basicAttack: HeroSkillMove;
  activeSkill: HeroSkillMove;
  tagAssistSkill: HeroSkillMove;
  bondSpecial: HeroSkillMove; // Unlocked at 50%+ Affection or 2+ Awakenings
}

export type DiceCheckOutcome =
  | "CRITICAL_BREACH"
  | "CLEAN_HIT"
  | "GRAZE"
  | "DEFLECTED";

export type StarfallConditionType =
  | "BLEED"
  | "POISON"
  | "STUN"
  | "MANA_DRAIN"
  | "TIME_REWIND"
  | "HEX_WEAKEN";

export interface ActiveCombatCondition {
  type: StarfallConditionType;
  turnsRemaining: number;
  target: string; // "PROTAGONIST" | "PARTY" | heroineName
}

export interface StarfallDiceRollRecord {
  actorName: string;
  checkLabel: string;
  naturalD20: number;
  statModifier: number;
  totalRoll: number;
  difficultyClass: number;
  outcome: DiceCheckOutcome;
  summaryText: string;
}

export interface StarfallMasterSealOrder {
  id: string;
  commandText: string;
  complianceHint: string;
  loopholeHint: string;
  trustGainOnComply: number;
  trustLossOnDefy: number;
  resolved?: boolean;
}

export type StarfallEnemyTier = "COMMON" | "ELITE" | "BOSS";

export interface StarfallCombatState {
  isActive: boolean;
  encounterId: string;
  floor: number;
  turnNumber: number;
  status: "ongoing" | "victory" | "retreat" | "defeat";
  engagementPhase?: "vicinity" | "engaged";
  enemyTier?: StarfallEnemyTier;
  themeId: TowerThemeId;
  themeName: string;
  environmentalLawName: string;
  environmentalLawEffect: string;
  layoutId: string;
  layoutName: string;
  layoutGeometry: string;
  layoutTacticalHint: string;
  terrainTags: string[];
  enemyId: string;
  enemyName: string;
  enemyTitle: string;
  isBoss: boolean;
  isThresholdGuardian: boolean;
  enemyHp: number;
  enemyMaxHp: number;
  enemyAtk: number;
  enemyDef: number;
  enemySpd: number;
  enemyPoise: number;
  enemyMaxPoise: number;
  isEnemyBroken: boolean;
  brokenTurnsRemaining: number;
  enemyWeaknesses: TacticalWeaknessTag[];
  enemyResistances?: TacticalWeaknessTag[];
  activeConditions?: ActiveCombatCondition[];
  hexSealsOnEnemy: number; // Detonated by Godiva / Shadow Hex combos
  phantomEchoesActive: number; // Trinity Valoren's Seeing Double afterimages
  activeShieldPool: number; // Dame Odette's Wall of Aesthul / Lotte's Sweet Dream glamour
  currentTelegraph: EnemyTelegraphIntent;
  masterSealOrder?: StarfallMasterSealOrder | null;
  frontlineHeroines: string[]; // Up to 2 active Heroines alongside Protagonist
  reserveHeroines: string[]; // Up to 2 Rearguard Heroines (ready for Tag-Swap)
  lastDiceRolls: StarfallDiceRollRecord[];
  combatTelemetrySummary: string;
  combatLog: string[];
}

export interface HeroRosterEntry {
  heroineId?: string;
  heroineName: string;
  starRank: StarRank;
  baseStarRank: StarRank;
  level: number;
  exp: number;
  maxExp?: number;
  status: HeroStatus;
  formationSlot?: FormationSlot; // FRONTLINE (max 2) or RESERVE (max 2) when DEPLOYED
  combatStats?: HeroCombatStats;
  currentHp?: number;
  currentMp?: number;
  swapCooldown?: number;
  skillCooldowns?: Record<string, number>;
  activeConditions?: StarfallConditionType[];
  negativeSwitchActive?: boolean;
  awakenings: number; // 0-4, tied to affection milestones (25, 50, 75, 90)
  duplicateCount?: number;
  fallenOnFloor?: number;
  fallenCause?: string;
}

export interface MemorialRecord {
  name: string;
  starRank?: StarRank;
  level?: number;
  floor: number;
  cause: string;
  recordedAtTurn?: number;
}

export interface LabyrinthState {
  currentFloor: number; // 0 = Star Gate Plaza (Main Lobby), 1-100 = Labyrinth Floors
  highestFloorCleared: number;
  starShards: number; // Summon currency (30 per pull, 300 per 10x pull)
  pityCounter: number; // Guaranteed 5★ at 90 pulls
  totalPulls: number;
  masterTrust: number; // 0-100 (Command Seal compliance & survival results)
  protagonistStarRank: StarRank;
  isHiddenRarity?: boolean; // True for Glitched Summon (?★ visual badge until awakened)
  metaKnowledgeCeiling: number; // Last floor the protagonist remembers from Celestia Summons
  roster: HeroRosterEntry[];
  memorial: MemorialRecord[];
  summonSeed: string;
  activeEncounter?: StarfallCombatState | null;
  directorNotes?: string;
}

export interface StarfallOriginPreset {
  id: StarfallOrigin;
  name: string;
  shortLabel: string;
  icon: string;
  startingStarRank: StarRank;
  isHiddenRarity?: boolean;
  startingStarShards: number;
  startingMasterTrust: number;
  metaKnowledgeCeiling: number;
  // Unified UI compatibility fields for Character Creation cards
  startingRank: number;
  rankTierLabel: string;
  semesterDebtQuota: number;
  startingCrowns: number;
  defaultDetails: string;
  actOneStakes: string;
  highResonanceHeroines: string[];
}

export const STARFALL_ORIGIN_PRESETS: StarfallOriginPreset[] = [
  {
    id: "DISCARDED_EX_RANKER",
    name: "Discarded Ex-Ranker (Former #1 Player Pulled In as 1★ Fodder)",
    shortLabel: "Discarded Ex-Ranker",
    icon: "♟️",
    startingStarRank: 1,
    startingStarShards: 90,
    startingMasterTrust: 35,
    metaKnowledgeCeiling: 40,
    startingRank: 1,
    rankTierLabel: "1★ Fodder • Memory to Floor 40",
    semesterDebtQuota: 100,
    startingCrowns: 90,
    defaultDetails:
      "Yesterday you were the #1 global tactician in 'Celestia Summons'—the only free-to-play commander to clear Floor 40 with zero casualties before the server patch went dark. Today you woke up on the cold obsidian floor of Star Gate Plaza inside someone else's rookie account as a nameless 1★ Lv.1 unit slated for synthesis fodder. Your unseen Master barely glances at the screen, and death down here is permanent.",
    actOneStakes:
      "Full boss-telegraph and hidden-cache memory up to Floor 40—beyond Floor 40 you are completely blind. You must prove your tactical worth on Floor 1 before your careless Master sacrifices you and 1★ cleric Pia Hollis as bait.",
    highResonanceHeroines: [
      "Pia Hollis",
      "Sable Ashgrove",
      "Aurelle, the Seraph Lance",
      "Dame Odette Varr",
    ],
  },
  {
    id: "WHALES_SPARE",
    name: "Whale's Spare (Filler Pull in a High-Spending Master's Roster)",
    shortLabel: "Whale's Spare",
    icon: "💎",
    startingStarRank: 1,
    startingStarShards: 300,
    startingMasterTrust: 12,
    metaKnowledgeCeiling: 30,
    startingRank: 1,
    rankTierLabel: "1★ Filler • 300 Shards / 12% Trust",
    semesterDebtQuota: 100,
    startingCrowns: 300,
    defaultDetails:
      "Summoned as unwanted 1★ ten-pull chaff inside an impulsive 'whale' Master's account overflowing with unspent Star Shards and high-rarity banners. Your Master treats low-star units like disposable trap-checkers and issues reckless auto-battle Command Seals, leaving a mountain of Star Shards at the Star Gate if you can manipulate them into pulling the right allies.",
    actOneStakes:
      "Start with 300 Star Shards (enough for an immediate 10x Summon in Star Gate Plaza!) and meta-knowledge up to Floor 30, but dangerously low Master Trust (12%)—defying suicidal Command Seals risks punitive lockout.",
    highResonanceHeroines: [
      "Lyra Nocturne",
      "Dame Odette Varr",
      "Godiva",
      "Aurelle, the Seraph Lance",
    ],
  },
  {
    id: "GLITCHED_SUMMON",
    name: "Glitched Summon (Corrupted ?★ Unit Watched by the Administrator)",
    shortLabel: "Glitched Summon",
    icon: "⚡",
    startingStarRank: 1,
    isHiddenRarity: true,
    startingStarShards: 120,
    startingMasterTrust: 25,
    metaKnowledgeCeiling: 25,
    startingRank: 0,
    rankTierLabel: "?★ Corrupted • Anomaly Watched",
    semesterDebtQuota: 100,
    startingCrowns: 120,
    defaultDetails:
      "Your Star Gate summoning crystal fractured mid-manifestation, registering your rarity as '?★ [UNINDEXED]' in the Master's console. While capped like a 1★ unit until you awaken your dormant star nodes through combat bonds, you retain fragmented speedrunner memories up to Floor 25—and The Administrator's system eyes are quietly tracking every anomaly you cause.",
    actOneStakes:
      "Corrupted '?★' signature lets you read hidden Safe Zone glitches and Administrator seals, with 120 starting Star Shards and memory to Floor 25, while veteran survivors and anomalies like Sable, Onyxia Cryss, and Godiva immediately sense you aren't normal.",
    highResonanceHeroines: [
      "Onyxia Cryss",
      "Lotte Klein",
      "Abraxia",
      "Godiva",
    ],
  },
];

export interface StarfallRolePreset {
  id: string;
  conduit: StarfallRole;
  wing: StarfallFaction;
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
    relicSlot: string;
    setId: string;
    whisperFlaw: string;
  };
}

export const STARFALL_ROLE_PRESETS: StarfallRolePreset[] = [
  {
    id: "starfall_tactician",
    conduit: "TACTICIAN",
    wing: "NAMELESS_ROSTER",
    wingLabel: "Vanguard Command & Field Relay",
    roleTitle: "1★ Field Tactician & Shot-Caller",
    shortLabel: "Field Tactician",
    icon: "🧭",
    statSpread: { str: 11, dex: 14, int: 16 },
    description:
      "Ex-ranker shot-caller who turns low-star misfits into a zero-casualty unit. Calls boss telegraphs two seconds before they land, rotates frontline/rearguard swaps, and exploits hidden floor terrain.",
    startingAbilities: [
      {
        name: "Frame-Perfect Callout",
        description:
          "Read monster aggro lines and boss wind-ups from memory, redirecting a deployed heroine out of lethal AoE damage while opening a counter-window.",
        type: "Active",
        cost: "15 MP",
        cooldown: "1 Turn",
        tier: "Signature",
      },
      {
        name: "Command Seal Loophole",
        description:
          "Satisfy the literal wording of a reckless Master Command Seal through clever positioning so your party survives without tanking Master Trust.",
        type: "Active",
        cost: "20 MP",
        cooldown: "2 Turns",
        tier: "Adept",
      },
      {
        name: "Ranker's Floor Ledger",
        description:
          "Up to your Meta-Knowledge Ceiling, automatically sense hidden Safe Zone caches, mimic traps, and Gate Boss phase transitions.",
        type: "Passive",
        cost: "0 MP",
        cooldown: "Passive",
        tier: "Unique",
      },
    ],
    canonLoadout: {
      weapon: "Chipped Iron Shortblade & Signal Flare Whistle",
      armor: "Frayed 1★ Recruit Trenchcoat & Leather Bracers",
      relic: "Cracked #1 Ranker's Bronze Dog-Tag",
      relicSlot: "EMBLEM",
      setId: "Zero-Casualty Oath",
      whisperFlaw:
        "Survivor's Arithmetic: Grants +20% party evasion callouts, but forces you into the line of fire first whenever a deployed ally drops below 25% HP.",
    },
  },
  {
    id: "starfall_vanguard",
    conduit: "VANGUARD",
    wing: "APEX_CONCORD",
    wingLabel: "Iron Bulwark & Aggro Anchor",
    roleTitle: "1★ Shield-Breaker Vanguard",
    shortLabel: "Shield Vanguard",
    icon: "🛡️",
    statSpread: { str: 16, dex: 12, int: 13 },
    description:
      "Frontline anchor who compensates for 1★ base stats with brutal shield-parry angles, choke-point control, and unbreakable aggro discipline so fragile healers and mages never take a clean hit.",
    startingAbilities: [
      {
        name: "Deflection Parry (Angle Zero)",
        description:
          "Tilt a battered buckler at the exact 17-degree boss-frame angle to glancing-parry crushing blows that would normally shatter a 1★ guard.",
        type: "Active",
        cost: "15 MP",
        cooldown: "1 Turn",
        tier: "Initiate",
      },
      {
        name: "Interpose Oath",
        description:
          "Vault between a lethal monster lunge and a targeted companion, absorbing 65% of incoming impact and boosting party morale.",
        type: "Active",
        cost: "20 MP",
        cooldown: "2 Turns",
        tier: "Adept",
      },
      {
        name: "Scrap-Iron Grit",
        description:
          "Refuse to drop to 0 HP once per floor clear when defending a party member, clinging to 1 HP through sheer stubbornness.",
        type: "Passive",
        cost: "0 MP",
        cooldown: "1 Floor",
        tier: "Initiate",
      },
    ],
    canonLoadout: {
      weapon: "Heavy Discard-Pile Broadsword & Notched Buckler",
      armor: "Salvaged Steel Pauldron & Strapped Gambeson",
      relic: "Shattered Gatekeeper's Buckle",
      relicSlot: "AEGIS",
      setId: "Last Line of Floor 1",
      whisperFlaw:
        "Lead Shield: Draws +35% monster aggro away from backline heroines, increasing personal HP attrition in uncoordinated fights.",
    },
  },
  {
    id: "starfall_striker",
    conduit: "STRIKER",
    wing: "LANTERN_BROKERS",
    wingLabel: "Weak-Point Execution & Scout Tempo",
    roleTitle: "1★ Weak-Spot Striker & Trap Runner",
    shortLabel: "Labyrinth Striker",
    icon: "🗡️",
    statSpread: { str: 14, dex: 17, int: 10 },
    description:
      "Hyper-mobile skirmisher who turns dungeon geometry, monster blind-spots, and boss core exposures into surgical kills—hitting far above a 1★ stat ceiling.",
    startingAbilities: [
      {
        name: "Mana-Core Seam Sever",
        description:
          "Slip inside a monster's turn radius and drive steel directly into its exposed mana-core seam, dealing critical stagger damage regardless of star gap.",
        type: "Active",
        cost: "18 MP",
        cooldown: "1 Turn",
        tier: "Signature",
      },
      {
        name: "Wire-Step Disengage",
        description:
          "Kick off a labyrinth pillar or monster carapace to break encirclement and drag a wounded teammate back to safe range.",
        type: "Active",
        cost: "14 MP",
        cooldown: "1 Turn",
        tier: "Initiate",
      },
      {
        name: "Dead-Zone Footwork",
        description:
          "Years of memorizing hitbox geometry grant +15% critical precision and immunity to standard corridor pressure traps.",
        type: "Passive",
        cost: "0 MP",
        cooldown: "Passive",
        tier: "Initiate",
      },
    ],
    canonLoadout: {
      weapon: "Twin Salvaged Misericorde Daggers & Grapnel Cord",
      armor: "Dark Scout Mantle & Reinforced Shin-Guards",
      relic: "Hollow-Fang Crit Talisman",
      relicSlot: "TALISMAN",
      setId: "Dead-Zone Runner",
      whisperFlaw:
        "Razor Margin: Deals +25% weak-spot damage against higher-tier Gate Bosses, but taking a direct heavy cleave inflicts bonus stamina bleed.",
    },
  },
  {
    id: "starfall_arcanist",
    conduit: "ARCANIST",
    wing: "ADMINISTRATOR_ARBITERS",
    wingLabel: "Rune-Hacking & Astral Disruption",
    roleTitle: "1★ Rune-Breaker Arcanist",
    shortLabel: "Rune Arcanist",
    icon: "✨",
    statSpread: { str: 10, dex: 13, int: 18 },
    description:
      "Low-mana specialist who rewrites floor runes, hijacks ambient labyrinth starlight, and short-circuits boss cast bars using speedrunner spell-cancels instead of brute-force mana pools.",
    startingAbilities: [
      {
        name: "Micro-Cast Interrupt",
        description:
          "Fire a compressed 3-mana astral needle into an enemy's throat sigil mid-chant, shattering lethal AoE spells before they finish casting.",
        type: "Active",
        cost: "12 MP",
        cooldown: "1 Turn",
        tier: "Signature",
      },
      {
        name: "Leyline Siphon Ward",
        description:
          "Tap cracked labyrinth floor runes to erect a temporary starlight barrier around your party and restore minor MP.",
        type: "Active",
        cost: "20 MP",
        cooldown: "2 Turns",
        tier: "Adept",
      },
      {
        name: "Overclocked Star-Circuit",
        description:
          "Compress 1★ mana channels to cast interruption and debuff spells 30% faster than standard chanting.",
        type: "Passive",
        cost: "0 MP",
        cooldown: "Passive",
        tier: "Initiate",
      },
    ],
    canonLoadout: {
      weapon: "Splintered Starlight Tuning Rod & Chalk Carvers",
      armor: "Ashen Apprentice Coat & Runed Finger-Wraps",
      relic: "Fractured Star-Gate Prism Shard",
      relicSlot: "PRISM",
      setId: "Unindexed Conduit",
      whisperFlaw:
        "Mana Nosebleed: Overclocking 4★-tier rune interrupts through a 1★ body strains your channels if MP drops below 15%.",
    },
  },
];

export interface StarfallCovenantRule {
  ruleNumber: number;
  title: string;
  clauseCode: string;
  canonSummary: string;
  gameplayEffect: string;
}

export const STARFALL_COVENANT_RULES: StarfallCovenantRule[] = [
  {
    ruleNumber: 1,
    title: "The Star Gate & 14-Hero Summon Pool (1★–5★)",
    clauseCode: "Covenant I",
    canonSummary:
      "Each Master's Main Lobby (Star Gate Plaza) sits atop its own large floating sky-island drifting in an astral sea of starlit clouds around the central 100-Floor Starfall Labyrinth Spire. All fourteen summonable heroes manifest through the island's towering Star Gate monolith at rarities from 1★ to 5★; summoning is strictly locked to the Floating Lobby Island and cannot be performed inside Labyrinth floors.",
    gameplayEffect:
      "Player-driven gacha costs 30 Star Shards per pull (300 for 10x) with 90-pull 5★ pity, accessible only while in Star Gate Plaza (Main Lobby).",
  },
  {
    ruleNumber: 2,
    title: "Hard Star Level Caps & Concrete Stat Multipliers",
    clauseCode: "Covenant II",
    canonSummary:
      "A hero's current Star Rank enforces both their combat stat multiplier (1.0x at 1★ up to 1.9x at 5★) and their absolute biological level ceiling: 1★ caps at Lv.20, 2★ at Lv.30, 3★ at Lv.40, 4★ at Lv.50, and 5★ at Lv.60.",
    gameplayEffect:
      "Level gains clamp strictly at STAR_LEVEL_CAPS[starRank]; Star Ascension immediately boosts HP/MP/ATK/DEF/SPD/CRIT.",
  },
  {
    ruleNumber: 3,
    title: "Resonance Awakening (+1★ Promotion)",
    clauseCode: "Covenant III",
    canonSummary:
      "Even a discarded 1★ hero like Pia Hollis or Lotte Klein can ascend to 5★ through Resonance Awakening—forged by surviving life-or-death floor trials alongside a trusted commander or absorbing duplicate Star-Echoes.",
    gameplayEffect:
      "Reaching affection milestones (25%, 50%, 75%, 90%) or pulling duplicate echoes awakens a heroine by +1★ (up to 5★), raising her stats and Level Cap by +10.",
  },
  {
    ruleNumber: 4,
    title: "Vanguard & Rearguard Party Swapping",
    clauseCode: "Covenant IV",
    canonSummary:
      "A Labyrinth deployment squad holds up to four deployed heroines alongside the Protagonist: two in the Active Frontline and two in the Rearguard Reserve, enabling split-second Defensive Intercept Swaps and Offensive Chain Swaps.",
    gameplayEffect:
      "Rearguard allies recover +8% MP per turn and can tag-swap into the Frontline to parry telegraphs or chain-strike Broken enemies.",
  },
  {
    ruleNumber: 5,
    title: "25-Floor Shifting Strata, Safe Zones & Threshold Bosses",
    clauseCode: "Covenant V",
    canonSummary:
      "Every 25 floors (1–25 Sunken Reliquary, 26–50 Chronos Foundry, 51–75 Eclipse Sanctum, 76–100 Astral Singularity), the Spire's architecture, environmental laws, and bestiary transform completely. Floors ending in 5 host Safe Zones; every 10th floor and 25th stratum threshold is sealed by a Guardian.",
    gameplayEffect:
      "Tower Theme shifts every 25 floors, reshaping room layouts, terrain stunt tags, enemy weaknesses, and bosses.",
  },
  {
    ruleNumber: 6,
    title: "Wounded Threshold & Irreversible Permadeath",
    clauseCode: "Covenant VI",
    canonSummary:
      "Dropping to 0 HP for the first time triggers an Ally Rescue check that leaves a heroine critically WOUNDED (-30% stats until Safe Zone rest). Taking a second unmitigated lethal blow while already WOUNDED shatters her into Star Ash forever on the Memorial Wall.",
    gameplayEffect:
      "Two-stage fair permadeath: 0 HP -> WOUNDED (rescueable via Rearguard Swap); lethal hit while WOUNDED -> permanent FALLEN.",
  },
  {
    ruleNumber: 7,
    title: "The Unseen Master & Command Seals",
    clauseCode: "Covenant VII",
    canonSummary:
      "Beyond the glass sky sits an unseen Master treating the roster like mobile-game units. Masters broadcast glowing Command Seals mid-battle; outright defiance burns Master Trust, while clever tactical loopholes preserve both survival and trust.",
    gameplayEffect:
      "Master Trust (0–100%) tracks the unseen player's patience; high trust unlocks shard stipends, while low trust triggers reckless forced orders.",
  },
  {
    ruleNumber: 8,
    title: "Floor 100: The Starfall Summit & Logout",
    clauseCode: "Covenant VIII",
    canonSummary:
      "Clearing Floor 100 shatters the Administrator's Crown, liberates every surviving hero in the roster into true flesh-and-blood autonomy, and unlocks the Protagonist's return portal.",
    gameplayEffect:
      "Ultimate campaign victory condition across Floors 1–100.",
  },
];

export interface StarfallFloorEntry {
  floorRange: string;
  minFloor: number;
  maxFloor: number;
  stratumName: string;
  floorTypeHighlight: string;
  canonHazardsAndBoss: string;
  withinDefaultMemory: boolean;
}

export const STARFALL_FLOOR_CANON: StarfallFloorEntry[] = [
  {
    floorRange: "Lobby (Floor 0)",
    minFloor: 0,
    maxFloor: 0,
    stratumName: "Star Gate Plaza & The Iron Barracks (Floating Lobby Island)",
    floorTypeHighlight: "Floating Sky-Island Hub, Summoning Monolith, Squad Barracks & Cliffside Memorial",
    canonHazardsAndBoss:
      "Each Master's account occupies its own large floating sky-island suspended in an astral sea of starlit clouds and waterfalls orbiting the colossal central 100-Floor Starfall Labyrinth Spire (neighboring Masters' gilded or crumbling floating islands are visible across the sky). Houses Star Gate Plaza, The Iron Barracks, the cliffside Memorial Wall, and the Floor Transfer Ring.",
    withinDefaultMemory: true,
  },
  {
    floorRange: "Floors 1–25 (Tier I)",
    minFloor: 1,
    maxFloor: 25,
    stratumName: "Stratum I: The Sunken Reliquary & Verdant Ossuary",
    floorTypeHighlight: "F10 Aldric • F20 Charybdis • F25 Threshold: Bell-Keeper Ossian",
    canonHazardsAndBoss:
      "Flooded gothic basilicas, bone-vine colonnades, and tidal sluiceways. Field Law: Drowned Undertow (+20% Stagger/Purge near flooded masonry). Patrolled by Moss-Jaw Hound Packs, Salt-Crusted Shield Goblins, Carrion Mimics, and Siren Choir-Eels.",
    withinDefaultMemory: true,
  },
  {
    floorRange: "Floors 26–50 (Tier II)",
    minFloor: 26,
    maxFloor: 50,
    stratumName: "Stratum II: The Chronos Foundry & Brass Clocktower",
    floorTypeHighlight: "F30 Orpheon • F40 Ignis-Zero (Memory Ceiling) • F50 Threshold: Chronos-Prime",
    canonHazardsAndBoss:
      "Colossal interlocking brass gear-bridges, molten mirror galleries, and temporal pendulum chasms. Field Law: Escapement Rewind Protocol (enemies mend 8% HP unless Poise-Broken or Core-Interrupted). Floor 40 marks the end of Ex-Ranker pre-isekai memory!",
    withinDefaultMemory: true,
  },
  {
    floorRange: "Floors 51–75 (Tier III)",
    minFloor: 51,
    maxFloor: 75,
    stratumName: "Stratum III: The Eclipse Sanctum & Blood-Moon Courts",
    floorTypeHighlight: "F60 Malakor • F70 Vesper's Crimson Trial • F75 Threshold: Caelum Noctis",
    canonHazardsAndBoss:
      "Uncharted territory beyond memory: non-euclidean black-mirror cloisters, undying ember cathedrals, and blood-moon viaducts. Field Law: Uncharted Eclipse Veil (+25% damage from Holy Purge & Negative Mana). Guarded by Undying Ember Revenants and Eclipse Dopple-Blades.",
    withinDefaultMemory: false,
  },
  {
    floorRange: "Floors 76–100 (Tier IV)",
    minFloor: 76,
    maxFloor: 100,
    stratumName: "Stratum IV: The Astral Singularity & Administrator's Crown",
    floorTypeHighlight: "F80 Kaiser's Vanguard • F90 Seraphiel • F100 Final Boss: The Administrator",
    canonHazardsAndBoss:
      "Zero-gravity shattered Star Gate prisms, celestial command-code bridges, and the cracked Fourth Wall beneath the Master's screen. Field Law: Administrator Audit Field (+35% Tag-Swap & Bond Special potency vs System Wardens).",
    withinDefaultMemory: false,
  },
];

export interface StarfallHeroineProfile {
  id: string;
  name: string;
  gender: "female" | "male";
  spriteSlug: string;
  epithet: string;
  baseStarRank: StarRank;
  combatRole: string;
  roleArchetype: "HEALER" | "ROGUE" | "TANK" | "MAGE" | "BRAWLER" | "LANCER" | "DUELIST" | "GUNNER";
  archetype: string;
  personality: string;
  values: string[];
  dislikes: string[];
  signatureMemories: { id: string; title: string; hint: string }[];
  summonQuote: string;
  actOneConflict: string;
  traumaAndSecret: string;
  dyadPassiveName: string;
  dyadPassiveDescription: string;
  speechVoiceBrief: string;
  ocSourceTitle?: string;
  ocSourceUrl?: string;
  skillKit: HeroSkillKit;
}

export const STARFALL_HEROINE_DOSSIERS: Record<string, StarfallHeroineProfile> = {
  "Pia Hollis": {
    id: "comp_pia",
    name: "Pia Hollis",
    gender: "female",
    spriteSlug: "pia_hollis",
    epithet: "1★ Antlered Fae Sanctuary Cleric",
    baseStarRank: 1,
    combatRole: "Emergency Fae Healer & Purification Support",
    roleArchetype: "HEALER",
    archetype: "Earnest Self-Doubting Fae Cleric / Fierce Underdog Heart",
    personality:
      "Earnest, soft-spoken 1★ fae sanctuary cleric whose trembling self-doubt vanishes the instant a teammate is bleeding.",
    values: [
      "Zero-Casualty Runs",
      "Pressed Sanctuary Herbs",
      "Warm Campfire Tea",
      "Keeping Low-Star Allies Alive",
    ],
    dislikes: [
      "The Synthesis Furnace",
      "Sacrificial Bait Orders",
      "Wasting Bandages",
      "Being Treated as XP Fodder",
    ],
    signatureMemories: [
      {
        id: "pia_mem_1",
        title: "Spared from the Synthesis Furnace",
        hint: "Step between Pia Hollis and a reckless synthesis or sacrificial order on the early floors.",
      },
      {
        id: "pia_mem_2",
        title: "Saint's Mercy Unsealed",
        hint: "Help Pia awaken her dormant 5★ healing light during a life-or-death crisis.",
      },
    ],
    summonQuote:
      "H-huh? You didn't send me to the Synthesis Furnace...? Thank goodness! I-I'm Pia Hollis—my hands shake a little, but I swear I won't let anyone bleed out!",
    actOneConflict:
      "A gentle white-antlered fae cleric flagged by the Master for 'XP fodder synthesis' alongside you in Star Gate Plaza because her hands shake when casting—yet she possesses a dormant 5★ 'Saint's Mercy' cleansing trait nobody ever leveled her high enough to see.",
    traumaAndSecret:
      "Watched three other 1★ novices get fed into the Synthesis Furnace on her first morning and secretly weaves spare healing charms at night so she won't be thrown away.",
    dyadPassiveName: "Fae-Dew Sanctuary",
    dyadPassiveDescription:
      "Restores +18% bonus HP to low-star teammates and cleanses bleed/neurotoxin stacks when standing beside her.",
    speechVoiceBrief:
      "Warm, slightly breathless, earnest everyday speech with small nervous hesitations that turn surprisingly stubborn when someone is hurt ('H-hey, hold still! I don't care if I'm one-star—nobody's dying on my watch, okay?').",
    skillKit: {
      basicAttack: {
        id: "pia_basic",
        name: "Sanctuary Star-Bead Pulse",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 0.85,
        poiseBreak: 14,
        weaknessTag: "HOLY_PURGE",
        description: "Channels a warm cyan-and-gold fae pulse from her palms to scorch corrupt essence and chip enemy Poise.",
      },
      activeSkill: {
        id: "pia_active",
        name: "Mending Prayer & Purge",
        mpCost: 14,
        cooldownTurns: 2,
        powerMultiplier: 1.2,
        poiseBreak: 10,
        weaknessTag: "HOLY_PURGE",
        isHeal: true,
        description: "Restores frontline HP and purges poison/hex debuffs with warm sanctuary light.",
      },
      tagAssistSkill: {
        id: "pia_assist",
        name: "Angel's Hand Triage",
        mpCost: 8,
        cooldownTurns: 2,
        powerMultiplier: 1.0,
        poiseBreak: 12,
        weaknessTag: "HOLY_PURGE",
        isHeal: true,
        description: "Vaults in with a burst of sanctuary light that mends wounds and cushions incoming trauma.",
      },
      bondSpecial: {
        id: "pia_bond",
        name: "Dormant 5★: Saint's Mercy",
        mpCost: 26,
        cooldownTurns: 4,
        powerMultiplier: 1.65,
        poiseBreak: 35,
        weaknessTag: "HOLY_PURGE",
        isHeal: true,
        isShield: true,
        description: "Unseals her hidden 5★ miracle—healing the entire squad and scorching undead/eclipse foes.",
      },
    },
  },

  "Lotte Klein": {
    id: "comp_lotte",
    name: "Lotte Klein",
    gender: "female",
    spriteSlug: "lotte_klein",
    epithet: "1★ Stitched-Collar Dream-Medium ('Lucidua')",
    baseStarRank: 1,
    combatRole: "Dual-State Glamour Warder & Nightmare Spirit Channeler",
    roleArchetype: "BRAWLER",
    archetype: "Drowsy Uncanny Dream-Medium / Razor-Cold Lucid Nightmare",
    personality:
      "Drowsy, apologetic 1★ dream-medium who slips into razor-cold 'Lucidua' nightmare precision whenever her squad is threatened.",
    values: [
      "Quiet Safe-Zone Naps",
      "Soft Wool Blankets",
      "A Trusted Voice Calling Her Back",
      "Chamomile & Lavender Incense",
    ],
    dislikes: [
      "Sudden Loud Alarms",
      "Losing Control in Lucidua Trance",
      "Cold Iron Collar Restraints",
      "Cruel Wake-Up Shocks",
    ],
    signatureMemories: [
      {
        id: "lotte_mem_1",
        title: "Lullaby at the Safe-Zone Brazier",
        hint: "Stand watch so Lotte can sleep peacefully without fearing her nightmare spirit.",
      },
      {
        id: "lotte_mem_2",
        title: "Waking Voice in the Nightmare",
        hint: "Anchor Lotte back from a deep Lucidua trance using only your voice.",
      },
    ],
    summonQuote:
      "*Yawn*... Oh, sorry, is it morning already? I'm Lotte... Don't mind the grinning shadow behind my shoulder—keep me near the back if I'm awake, okay? If I slip into Nightmare trance... try not to stand in front of us.",
    actOneConflict:
      "Dismissed by Masters as a creepy 1★ narcoleptic with glowing yellow eyes, twin dark braids, a stitched collar scar, and a grinning shadow-spirit lurking over her shoulder—until lethal danger triggers her 'Sleeping Duality', unleashing 'Lucidua' with terrifying shadow-cleave precision.",
    traumaAndSecret:
      "Terrified of her grinning nightmare spirit hurting teammates while she sleepwalks; relies on a trusted commander's voice to anchor her back to waking warmth.",
    dyadPassiveName: "Sleeping Duality",
    dyadPassiveDescription:
      "Alternates between 'Sweet Dream' (+15% glamour barrier & lullaby calm) while healthy and 'Nightmare' (+35% Crit & Shadow Hex cleave) below 60% HP.",
    speechVoiceBrief:
      "Soft, sleepy, apologetic murmurs when awake ('Mmh... five more minutes, Commander...') that drop into eerie, crystalline whisper-calm when her eyes close in Lucidua trance ('Hush now. The nightmare will carve a path through them.').",
    ocSourceTitle: "Lotte Klein (Lucidua)",
    ocSourceUrl: "https://docs.google.com/document/d/1gcy7i_5jPdPCSrdv4duZXHqsQoAnjbJ4nfc83KxIwYQ/edit?usp=drivesdk",
    skillKit: {
      basicAttack: {
        id: "lotte_basic",
        name: "Drowsy Ribbon & Hatchet Flick",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 0.95,
        poiseBreak: 18,
        weaknessTag: "SHADOW_HEX",
        description: "Half-asleep swing of her concealed shadow-iron hatchet that catches foes off-rhythm.",
      },
      activeSkill: {
        id: "lotte_active",
        name: "Sweet Dream Glamour Veil",
        mpCost: 15,
        cooldownTurns: 2,
        powerMultiplier: 1.15,
        poiseBreak: 15,
        weaknessTag: "ASTRAL_ARCANE",
        isShield: true,
        isHeal: true,
        description: "Weaves pastel dream-mist around the frontline, granting a cushioned barrier and light soothe.",
      },
      tagAssistSkill: {
        id: "lotte_assist",
        name: "Somnambulist Counter-Cleave",
        mpCost: 10,
        cooldownTurns: 2,
        powerMultiplier: 1.35,
        poiseBreak: 26,
        weaknessTag: "SHADOW_HEX",
        description: "Eyes fluttering shut, Lotte slips past the incoming blow and rakes the enemy's blind spot.",
      },
      bondSpecial: {
        id: "lotte_bond",
        name: "Lucidua: Waking Nightmare Guillotine",
        mpCost: 26,
        cooldownTurns: 4,
        powerMultiplier: 2.15,
        poiseBreak: 48,
        weaknessTag: "SHADOW_HEX",
        appliesHexSeal: true,
        description: "Full Lucidua trance—splits reality between pastel dream-ward and a devastating shadow-hatchet execution.",
      },
    },
  },

  "Sable Ashgrove": {
    id: "comp_sable",
    name: "Sable Ashgrove",
    gender: "female",
    spriteSlug: "sable_ashgrove",
    epithet: "2★ Abyssal Maid Survivor Scout",
    baseStarRank: 2,
    combatRole: "Abyssal Tendril Recon, Trap Disarmer & Weak-Spot Rogue",
    roleArchetype: "ROGUE",
    archetype: "Dry-Witted Cynical Abyssal Maid / Reluctant Survivor Partner",
    personality:
      "Dry-witted, cynical 2★ abyssal battle-maid who hides fierce survivor loyalty behind gallows humor and pre-checked escape routes.",
    values: [
      "Pre-Checked Escape Routes",
      "Disarmed Mimic Chests",
      "Dark Roast Espresso",
      "Commanders Who Count Every Trap",
    ],
    dislikes: [
      "Blind Auto-Battle Charges",
      "Heroic Suicide Speeches",
      "Rookie Overconfidence",
      "Adding Names to the Memorial Wall",
    ],
    signatureMemories: [
      {
        id: "sable_mem_1",
        title: "The Tags in Her Apron Pocket",
        hint: "Prove your zero-casualty discipline until Sable finally learns your name and shows you her fallen squad's tags.",
      },
      {
        id: "sable_mem_2",
        title: "Abyssal Tendril Lifeline",
        hint: "Pull off a synchronized trap or boss-core takedown alongside Sable.",
      },
    ],
    summonQuote:
      "Two stars, still breathing, and allergic to suicide charges. Mind the tentacles and don't bother memorizing my name unless you plan on surviving past Floor 5, Boss.",
    actOneConflict:
      "An emerald-haired, dark-horned abyssal battle-maid who outlived three reckless rookie squads wiped out by auto-battle Masters on Floors 3–9. Refuses to learn newcomers' names at first because she assumes you'll be ash on the Memorial Wall by tomorrow.",
    traumaAndSecret:
      "Keeps the cracked tags of her first party hidden inside her ruffled apron pocket and quietly uses her shadow-tendrils to check your footing after every fight once you prove you know how to keep people alive.",
    dyadPassiveName: "Three-Wipe Abyssal Instinct",
    dyadPassiveDescription:
      "Her abyssal tendrils sense floor vibrations, mimic chests, and boss core seams early, granting +20% evasion and bonus Pierce poise break.",
    speechVoiceBrief:
      "Clipped, dry, street-smart gallows humor with contractions and zero tolerance for heroic speeches ('Save the speech, One-Star. Step on that third flagstone and we're both confetti.').",
    skillKit: {
      basicAttack: {
        id: "sable_basic",
        name: "Clawed Tendon-Seam Slash",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 1.0,
        poiseBreak: 20,
        weaknessTag: "PIERCE_VITALS",
        description: "Low-profile obsidian dagger and clawed-glove slice aimed straight at ankle tendons or armor joints.",
      },
      activeSkill: {
        id: "sable_active",
        name: "Abyssal Tendril Core-Pin",
        mpCost: 14,
        cooldownTurns: 2,
        powerMultiplier: 1.45,
        poiseBreak: 32,
        weaknessTag: "CORE_INTERRUPT",
        description: "Lashes her dark abyssal tentacles into a monster's cast-throat or clockwork gear to stall its wind-up.",
      },
      tagAssistSkill: {
        id: "sable_assist",
        name: "Shadow-Tendril Yank",
        mpCost: 9,
        cooldownTurns: 2,
        powerMultiplier: 1.25,
        poiseBreak: 22,
        weaknessTag: "PIERCE_VITALS",
        description: "Yanks a teammate clear of danger with a coiled abyssal tentacle while nicking the foe's vitals.",
      },
      bondSpecial: {
        id: "sable_bond",
        name: "Zero-Casualty Abyssal Execution",
        mpCost: 26,
        cooldownTurns: 4,
        powerMultiplier: 2.1,
        poiseBreak: 46,
        weaknessTag: "PIERCE_VITALS",
        description: "Pins every limb with abyssal tendrils before severing an enemy's mana-core in one surgical pass.",
      },
    },
  },

  "Onyxia Cryss": {
    id: "comp_onyxia",
    name: "Onyxia Cryss",
    gender: "female",
    spriteSlug: "onyxia_cryss",
    epithet: "2★ Blindfolded Geode Oculus Construct",
    baseStarRank: 2,
    combatRole: "Mid-Range Oculus Shard Artillery & Refracting Prism Support",
    roleArchetype: "GUNNER",
    archetype: "Deadpan Blindfolded Oculus Mystic / Quietly Devoted Construct",
    personality:
      "Deadpan, softly literal 2★ blindfolded geode-construct who quietly treasures every small proof that she is more than an expendable relic.",
    values: [
      "Polished Floor Pebbles",
      "Clean Acoustic Resonance",
      "Gentle Crystal Maintenance",
      "Being Spoken to as a Person",
    ],
    dislikes: [
      "Vault Confinement Shackles",
      "Rough Handling of Her Oculus Orb",
      "Deafening Sonic Echoes",
      "Being Called a Soulless Construct",
    ],
    signatureMemories: [
      {
        id: "onyxia_mem_1",
        title: "A Pebble from the Cleared Floor",
        hint: "Gift or help Onyxia collect a polished stone keepsake after a floor clear.",
      },
      {
        id: "onyxia_mem_2",
        title: "Unshackled Third-Eye Glow",
        hint: "Protect Onyxia's mineral core through a heavy boss phase and tend the fractures yourself.",
      },
    ],
    summonQuote:
      "Unit designation: Onyxia Cryss. Oculus core integrity at ninety-eight percent. Please do not be alarmed by the shackles or the gem on my blindfold, Commander—it only dims if my core is breaking.",
    actOneConflict:
      "A platinum-haired, blindfolded geode-born oracle construct whose chained wrists cradle a brass-and-amethyst Oculus sphere—ranked 2★ because standard healers cannot mend her mineral core, leaving only careful positioning to keep her blindfold's third-eye gem glowing.",
    traumaAndSecret:
      "Shackled as an expendable relic-vault custodian with no legal soul; secretly collects tiny polished pebbles from every cleared floor as proof she actually lived.",
    dyadPassiveName: "Third-Eye Blindfold & Oculus Refraction",
    dyadPassiveDescription:
      "Fires regenerating amethyst shard volleys from her chained brass Oculus orb and refracts astral beams into +15% frontline DEF.",
    speechVoiceBrief:
      "Calm, literal, softly measured cadence beneath her gemmed blindfold with subtle dry observations and unexpected warmth ('Oculus trajectory locked. Piercing that mimic's hinge is optimal right now.').",
    ocSourceTitle: "Onyxia Cryss",
    ocSourceUrl: "https://docs.google.com/document/d/1mWXCAh4p1HFbs0jvI5nWm_-XduxLMA5Pu4s5dtoA4WA/edit?usp=drivesdk",
    skillKit: {
      basicAttack: {
        id: "onyxia_basic",
        name: "Oculus Amethyst Shard Volley",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 1.02,
        poiseBreak: 19,
        weaknessTag: "PIERCE_VITALS",
        description: "Fires twin high-velocity amethyst crystal needles from her levitating brass Oculus core.",
      },
      activeSkill: {
        id: "onyxia_active",
        name: "Prism Geode Refraction",
        mpCost: 15,
        cooldownTurns: 2,
        powerMultiplier: 1.38,
        poiseBreak: 28,
        weaknessTag: "ASTRAL_ARCANE",
        isShield: true,
        description: "Projects floating amethyst prism rings from her chained Oculus that ricochet beams and shield allies.",
      },
      tagAssistSkill: {
        id: "onyxia_assist",
        name: "Third-Eye Shard Curtain",
        mpCost: 10,
        cooldownTurns: 2,
        powerMultiplier: 1.3,
        poiseBreak: 25,
        weaknessTag: "CORE_INTERRUPT",
        description: "Steps into the lane with statuesque poise, peppering enemy cast-sigils with razor amethyst shards.",
      },
      bondSpecial: {
        id: "onyxia_bond",
        name: "Fragments of Pieces: Unshackled Geode Nova",
        mpCost: 28,
        cooldownTurns: 4,
        powerMultiplier: 2.2,
        poiseBreak: 50,
        weaknessTag: "ASTRAL_ARCANE",
        isShield: true,
        description: "Overclocks both her blindfold third-eye gem and brass Oculus core, detonating homing crystal lances across the arena.",
      },
    },
  },

  "Dame Odette Varr": {
    id: "comp_odette",
    name: "Dame Odette Varr",
    gender: "female",
    spriteSlug: "odette_varr",
    epithet: "3★ Oathbound Gorgon Warden",
    baseStarRank: 3,
    combatRole: "Petrifying Stone-Ward Tank & Frontline Aegis",
    roleArchetype: "TANK",
    archetype: "Regal Straight-Laced Gorgon Noblewoman / Flustered Serpent-Crowned Protector",
    personality:
      "Regal, straight-laced 3★ Gorgon noblewoman whose white crown-serpents betray every flustered feeling she tries to hide behind knightly decorum.",
    values: [
      "Chivalric Vows Kept in Full",
      "Sun-Warmed Marble Courtyards",
      "Sincere Praise for Her Crown-Serpents",
      "Disciplined Shield Formations",
    ],
    dislikes: [
      "Dishonorable Backstabbing",
      "People Recoiling from Her Gorgon Gaze",
      "Teasing Her Flustered Snakes",
      "Reckless Oath-Breaking",
    ],
    signatureMemories: [
      {
        id: "odette_mem_1",
        title: "The Crown-Serpents' Secret Tell",
        hint: "Reassure Dame Odette without flinching from her white vipers until they curl happily toward you.",
      },
      {
        id: "odette_mem_2",
        title: "Loophole of True Chivalry",
        hint: "Help Odette bend a suicidal Master Command Seal without breaking her knightly honor.",
      },
    ],
    summonQuote:
      "Dame Odette Varr answers your summon! Mind my crown-serpents and stand behind my stone-wards—none shall harm this squad while my oath holds!",
    actOneConflict:
      "An aristocratic alabaster-skinned Gorgon warden crowned with white vipers who treats every glowing Command Seal from the unseen Master as sacred scripture—forcing you to bend her rigid honor to save her life while her crown-serpents betray every flustered emotion she tries to hide.",
    traumaAndSecret:
      "Feared by previous rosters for her petrifying Gorgon lineage and terrified that questioning the Master invalidates her knightly vow; her white crown-serpents curl shyly whenever she receives sincere warmth.",
    dyadPassiveName: "Alabaster Gorgon Aegis",
    dyadPassiveDescription:
      "Reduces incoming Gate Boss cleave damage by 25% with petrified stone-wards and stiffens enemy joints on contact.",
    speechVoiceBrief:
      "Crisp, dignified, noble cadence—clear and direct without archaic fluff—cracking into stiff, flustered throat-clearing when her crown-serpents give her away ('My serpents are NOT happy to see you—that is merely a threat display! Eyes forward!').",
    skillKit: {
      basicAttack: {
        id: "odette_basic",
        name: "Petrifying Gorgon Glare-Pulse",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 0.98,
        poiseBreak: 24,
        weaknessTag: "BLUNT_STAGGER",
        description: "Lashes a calcifying alabaster shockwave that stiffens enemy limbs and rattles Poise.",
      },
      activeSkill: {
        id: "odette_active",
        name: "Wall of Aesthul",
        mpCost: 16,
        cooldownTurns: 2,
        powerMultiplier: 1.15,
        poiseBreak: 26,
        weaknessTag: "BLUNT_STAGGER",
        isShield: true,
        description: "Raises an unyielding obsidian-and-alabaster Gorgon monolith barrier absorbing heavy frontline damage.",
      },
      tagAssistSkill: {
        id: "odette_assist",
        name: "Serpent-Crown Stone Intercept",
        mpCost: 10,
        cooldownTurns: 2,
        powerMultiplier: 1.2,
        poiseBreak: 30,
        weaknessTag: "BLUNT_STAGGER",
        isShield: true,
        description: "Steps squarely into a boss telegraph, hardening the air into marble armor and staggering the attacker.",
      },
      bondSpecial: {
        id: "odette_bond",
        name: "Sovereign Medusa: Alabaster Bastion Decree",
        mpCost: 28,
        cooldownTurns: 4,
        powerMultiplier: 2.05,
        poiseBreak: 58,
        weaknessTag: "HOLY_PURGE",
        isShield: true,
        description: "Unleashes her full white-viper Gorgon gaze, encasing boss armor in brittle stone before shattering its Poise and warding allies.",
      },
    },
  },

  "Trinity Valoren": {
    id: "comp_trinity",
    name: "Trinity Valoren",
    gender: "female",
    spriteSlug: "trinity_valoren",
    epithet: "3★ Violet Oni Mirage Duelist",
    baseStarRank: 3,
    combatRole: "High-Speed Oni Evasion Duelist & Phantom Striker",
    roleArchetype: "DUELIST",
    archetype: "Alluring Horned Oni Sword-Prodigy / Competitive Sparring Rival",
    personality:
      "Alluring, rhythm-obsessed 3★ violet oni sword-prodigy who tests your tactical tempo through high-speed sparring and teasing banter.",
    values: [
      "Frame-Perfect Sparring Bouts",
      "Wisteria-Infused Sake",
      "Razor-Honed Wakizashi Balance",
      "Commanders Who Match Her Tempo",
    ],
    dislikes: [
      "Sloppy Off-Beat Footwork",
      "Clumsy Brute-Force Swings",
      "Disrespecting Her Clan Crest",
      "Stale Predictable Tactics",
    ],
    signatureMemories: [
      {
        id: "trinity_mem_1",
        title: "Three Heartbeats Ahead",
        hint: "Match Trinity's horn-vibration tempo in a midnight spar or boss counter-parry.",
      },
      {
        id: "trinity_mem_2",
        title: "Last Heir of the Wheel-Crest",
        hint: "Earn Trinity's trust to hear the truth of her wiped oni sword school.",
      },
    ],
    summonQuote:
      "You feel that hum in the stone? Three heartbeats ahead, two traps on the left. Trinity Valoren—keep up with these horns and my tempo, and I'll carve your path to the top.",
    actOneConflict:
      "A purple-haired, twin-horned oni sword-prodigy in an off-shoulder royal-violet kimono who reads air-pressure vibrations through her horns faster than sight—testing whether a 1★ commander can keep pace with her split-second mirage footwork.",
    traumaAndSecret:
      "Wears her clan's golden wheel-crest between her oni horns as the last heir of a wiped sword school; deeply respects anyone who calls angles by pure intuition rather than raw stat numbers.",
    dyadPassiveName: "Oni Horn Resonance & Seeing Double",
    dyadPassiveDescription:
      "Sonokinetic vibration sense through her twin horns pierces stealth illusions and leaves a 'Seeing Double' violet phantom afterimage (+22% Evasion).",
    speechVoiceBrief:
      "Crisp, confident, rhythm-conscious duelist voice with teasing allure—observant and dryly playful when impressed ('Your footwork lagged by half a beat—lucky for you, my phantom caught the parry.').",
    ocSourceTitle: "Trinity Valoren",
    ocSourceUrl: "https://docs.google.com/document/d/1GugWu4-G1nccVfYy0szdi7HOJ-RfwuQyLT-moARuKkY/edit?usp=drivesdk",
    skillKit: {
      basicAttack: {
        id: "trinity_basic",
        name: "Wisteria Mirage Draw-Cut",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 1.08,
        poiseBreak: 21,
        weaknessTag: "PIERCE_VITALS",
        description: "Lightning-fast violet wakizashi draw slash that hums cleanly through armor seams.",
      },
      activeSkill: {
        id: "trinity_active",
        name: "Flash Wave & Seeing Double",
        mpCost: 16,
        cooldownTurns: 2,
        powerMultiplier: 1.5,
        poiseBreak: 30,
        weaknessTag: "ASTRAL_ARCANE",
        spawnsPhantom: true,
        description: "Unleashes a crescent violet sonic wave while leaving a refractive oni phantom decoy on the frontline.",
      },
      tagAssistSkill: {
        id: "trinity_assist",
        name: "Mirage Slip-Parry",
        mpCost: 10,
        cooldownTurns: 2,
        powerMultiplier: 1.38,
        poiseBreak: 28,
        weaknessTag: "CORE_INTERRUPT",
        spawnsPhantom: true,
        description: "Swaps in via violet afterimage, deflecting the strike and slicing the foe's cast stance.",
      },
      bondSpecial: {
        id: "trinity_bond",
        name: "Sword With Many Names: Oni Octave Sever",
        mpCost: 30,
        cooldownTurns: 4,
        powerMultiplier: 2.35,
        poiseBreak: 52,
        weaknessTag: "PIERCE_VITALS",
        spawnsPhantom: true,
        description: "Twin violet oni phantoms converge in an eight-fold resonance slash that bypasses heavy plating.",
      },
    },
  },

  "Abraxia": {
    id: "comp_abraxia",
    name: "Abraxia",
    gender: "female",
    spriteSlug: "abraxia",
    epithet: "3★ Crimson Gothic Executioner",
    baseStarRank: 3,
    combatRole: "Crimson Runeblade Executioner & Chain-Hook Interceptor",
    roleArchetype: "ROGUE",
    archetype: "Stoic Scarred Action-First Protector / Devoted Silent Blade",
    personality:
      "Stoic, scarred 3★ crimson executioner of few words who expresses deep devotion through silent vigilance and lethal precision.",
    values: [
      "Quiet Whetstone Maintenance",
      "Unspoken Battlefield Trust",
      "Warm Broth for Her Scarred Throat",
      "Protecting Retreating Teammates",
    ],
    dislikes: [
      "Vain Glory-Hound Masters",
      "Orders to Execute Allies",
      "Noisy Crowded Taverns",
      "Empty Flattery",
    ],
    signatureMemories: [
      {
        id: "abraxia_mem_1",
        title: "Guard Outside Your Door",
        hint: "Notice Abraxia's quiet acts of care and tend the old scar across her throat.",
      },
      {
        id: "abraxia_mem_2",
        title: "Crimson Chain Never Lets Go",
        hint: "Trust Abraxia's Damascus chain-hook in a lethal boss execution.",
      },
    ],
    summonQuote:
      "...Abraxia. My throat doesn't carry idle chatter well. Point to the target that threatens your pulse—my crimson blade and needles will handle the rest.",
    actOneConflict:
      "A scarred crimson-armored executioner discarded by vain whale Masters who disliked her quiet, intimidating crimson gaze and raspy scarred voice—making her fiercely, silently protective of the first commander who values her precision.",
    traumaAndSecret:
      "Her throat scar came from refusing an order to execute retreating allies; she communicates care through quiet actions—sharpening your blade, standing guard outside your door, or tucking rations beside you.",
    dyadPassiveName: "Presynaptic Neurotoxin & Damascus Chain",
    dyadPassiveDescription:
      "Throws paralytic needles that dull enemy ATK/SPD by 15% and uses her damascus waist-chain to yank allies out of AoEs.",
    speechVoiceBrief:
      "Low, hushed, raspy-soft brevity—speaks in short, deliberate, deeply observant sentences weighted with physical action ('Behind me. Two heartbeats—then strike the left knee.').",
    ocSourceTitle: "Abraxia & Deianira",
    ocSourceUrl: "https://docs.google.com/document/d/1125mgPjnOA1seaGV0HuxJtR7x1BUZLZs9G2W18bD8q8/edit?usp=drivesdk",
    skillKit: {
      basicAttack: {
        id: "abraxia_basic",
        name: "Crimson Runeblade Cleave",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 1.12,
        poiseBreak: 22,
        weaknessTag: "PIERCE_VITALS",
        description: "Sweeping crimson-and-black runic greatsword draw that shears behind enemy shields into exposed vitals.",
      },
      activeSkill: {
        id: "abraxia_active",
        name: "Presynaptic Neurotoxin Needles",
        mpCost: 15,
        cooldownTurns: 2,
        powerMultiplier: 1.48,
        poiseBreak: 34,
        weaknessTag: "CORE_INTERRUPT",
        appliesHexSeal: true,
        description: "Fans three silver neurotoxin needles into nerve clusters, interrupting wind-ups and numbing enemy blows.",
      },
      tagAssistSkill: {
        id: "abraxia_assist",
        name: "Damascus Waist-Chain Snare",
        mpCost: 10,
        cooldownTurns: 2,
        powerMultiplier: 1.4,
        poiseBreak: 30,
        weaknessTag: "BLUNT_STAGGER",
        description: "Whips her damascus waist-chain around the enemy's weapon arm while pulling her ally clear.",
      },
      bondSpecial: {
        id: "abraxia_bond",
        name: "Silent Fang: Crimson Nerve Severance",
        mpCost: 28,
        cooldownTurns: 4,
        powerMultiplier: 2.4,
        poiseBreak: 54,
        weaknessTag: "PIERCE_VITALS",
        description: "Vanishes into low shadow and delivers a lethal kopis-and-chain execution straight through the heart-core.",
      },
    },
  },

  "Lyra Nocturne": {
    id: "comp_lyra",
    name: "Lyra Nocturne",
    gender: "female",
    spriteSlug: "lyra_nocturne",
    epithet: "4★ Astral Banner Prodigy",
    baseStarRank: 4,
    combatRole: "High-Burst AoE Arcanist & Barrier Breaker",
    roleArchetype: "MAGE",
    archetype: "Haughty Rate-Up Genius / Praise-Starved Tsundere",
    personality:
      "Haughty, sharp-tongued 4★ astral banner prodigy whose aristocratic pride masks a praise-starved perfectionist terrified of being benched.",
    values: [
      "Flawless Stagger-Window Callouts",
      "Rare Celestial Astrolabe Charts",
      "Spiced Star-Berry Tarts",
      "Being Acknowledged as Essential",
    ],
    dislikes: [
      "Being Outshined by 5★ Pulls",
      "Mana-Backlash Humiliation",
      "Having Her Calculations Ignored",
      "Being Treated as Replaceable",
    ],
    signatureMemories: [
      {
        id: "lyra_mem_1",
        title: "Two Seconds Before Mana-Backlash",
        hint: "Save Lyra from a fatal miscast with an impossible pre-cast boss callout.",
      },
      {
        id: "lyra_mem_2",
        title: "More Than a Four-Star Banner",
        hint: "Reassure Lyra in a quiet moment that she will never be benched or replaced.",
      },
    ],
    summonQuote:
      "Four stars of House Nocturne's finest astral lineage—wait. Why is a *one-star* holding the command baton?! Ugh, fine! Just call the stagger window properly and watch me erase them!",
    actOneConflict:
      "Summoned off a glittering 4★ rate-up banner and outraged that she has to take tactical callouts from a 1★ fodder leader—until your impossible pre-cast boss predictions save her from fatal mana-backlash.",
    traumaAndSecret:
      "Her immaculate aristocratic pride hides crippling imposter dread that if she ever fails to carry DPS, the Master will bench or fodder her for a 5★ pull.",
    dyadPassiveName: "Constellation Overcast",
    dyadPassiveDescription:
      "Amplifies elemental and astral burst damage by +30% whenever a Tactician calls an enemy's stagger window.",
    speechVoiceBrief:
      "Sharp, articulate, haughty rich-girl bite that slips into flustered defensiveness whenever outsmarted or sincerely praised ('I wasn't worried about you, idiot—if my vanguard dies, who's supposed to hold aggro while I finish casting?!').",
    skillKit: {
      basicAttack: {
        id: "lyra_basic",
        name: "Astrolabe Emerald Star-Ray",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 1.14,
        poiseBreak: 20,
        weaknessTag: "ASTRAL_ARCANE",
        description: "Channels a lance of compressed emerald-teal starlight through her ornate brass astrolabe staff.",
      },
      activeSkill: {
        id: "lyra_active",
        name: "Constellation Meteor Convergence",
        mpCost: 20,
        cooldownTurns: 2,
        powerMultiplier: 1.72,
        poiseBreak: 36,
        weaknessTag: "ASTRAL_ARCANE",
        description: "Drops a triangulated barrage of astral shards that devastates Broken or rune-shielded foes.",
      },
      tagAssistSkill: {
        id: "lyra_assist",
        name: "Refractive Star-Ward Counter",
        mpCost: 12,
        cooldownTurns: 2,
        powerMultiplier: 1.45,
        poiseBreak: 28,
        weaknessTag: "ASTRAL_ARCANE",
        isShield: true,
        description: "Blinks onto stage inside a crystalline star-ring, blasting the attacker back.",
      },
      bondSpecial: {
        id: "lyra_bond",
        name: "Nocturne Grand Planetarium Collapse",
        mpCost: 34,
        cooldownTurns: 4,
        powerMultiplier: 2.65,
        poiseBreak: 60,
        weaknessTag: "ASTRAL_ARCANE",
        description: "Inscribes a full celestial dome overhead before collapsing twelve falling stars onto the boss.",
      },
    },
  },

  "Mei Zhou": {
    id: "comp_mei",
    name: "Mei Zhou",
    gender: "female",
    spriteSlug: "mei_zhou",
    epithet: "4★ Crimson Curse-Claw Brawler",
    baseStarRank: 4,
    combatRole: "Close-Quarters Curse-Claw Stagger Striker & Morale Spark",
    roleArchetype: "BRAWLER",
    archetype: "Loud Fearless Big-Sister Brawler / Cursed Survivor's Grief",
    personality:
      "Loud, fearless 4★ big-sister brawler who cooks spicy rations to keep morale high while hiding the cursed scars of her wiped former guild.",
    values: [
      "Blazing Szechuan Chili Hotpot",
      "Rowdy Post-Clear Feasts",
      "Brawling on the Frontline",
      "Everyone Walking Back Through the Gate Alive",
    ],
    dislikes: [
      "Bland Ration Biscuits",
      "Brooding Alone in the Dark",
      "Cowards Who Hide Behind Healers",
      "Quiet Midnight Visits to the Memorial Wall",
    ],
    signatureMemories: [
      {
        id: "mei_mem_1",
        title: "Midnight at the Memorial Wall",
        hint: "Find Mei Zhou sitting alone by the cliffside Memorial Wall after a rowdy barracks dinner.",
      },
      {
        id: "mei_mem_2",
        title: "Crimson Curse-Claw Oath",
        hint: "Help Mei quell the burning blood-curse in her left arm without letting her take the hit alone.",
      },
    ],
    summonQuote:
      "Aha! Fresh air and real steel! Name's Mei Zhou—mind the red claws on my left arm; point me at the biggest ugly bastard on the floor and I'll tear its guard wide open for ya!",
    actOneConflict:
      "Charges headfirst into monster packs in her crimson-and-black kimono with a fearless grin, letting her glowing crimson eye-sigil curse-claws absorb every lethal hit because she watched her previous guild roster get wiped out on Floor 20.",
    traumaAndSecret:
      "Bore the blood-curse of Floor 20 into her own left arm and chest tattoos to save a rookie who still didn't make it; cooks spicy rations in the Iron Barracks to keep everyone smiling, then sits alone by the Memorial Wall past midnight.",
    dyadPassiveName: "Crimson Eye-Sigil Claws",
    dyadPassiveDescription:
      "Builds +35% bonus boss stagger on close-range cursed claw combos and rallies wounded allies out of panic.",
    speechVoiceBrief:
      "Punchy, warm, energetic casual speech—easy laughs, direct slang, and sudden raw honesty in quiet moments ('Ha! Look at that ugly lizard—dibs on shredding its jaw! ...Hey, promise me you're walking back through that gate in one piece, yeah?').",
    skillKit: {
      basicAttack: {
        id: "mei_basic",
        name: "Crimson Demon-Claw Rend",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 1.15,
        poiseBreak: 28,
        weaknessTag: "BLUNT_STAGGER",
        description: "Savagely rakes her monstrous crimson-and-obsidian left claws straight through heavy bone and brass.",
      },
      activeSkill: {
        id: "mei_active",
        name: "Hundred-Eye Curse Rupture",
        mpCost: 18,
        cooldownTurns: 2,
        powerMultiplier: 1.65,
        poiseBreak: 46,
        weaknessTag: "BLUNT_STAGGER",
        description: "Ignites the glowing crimson eye-tattoos across her chest and claws to crater enemy Poise.",
      },
      tagAssistSkill: {
        id: "mei_assist",
        name: "Crimson Kimono Blitz-Check",
        mpCost: 11,
        cooldownTurns: 2,
        powerMultiplier: 1.45,
        poiseBreak: 38,
        weaknessTag: "BLUNT_STAGGER",
        description: "Vaults into the vanguard with a roaring cursed-claw slam that interrupts enemy momentum.",
      },
      bondSpecial: {
        id: "mei_bond",
        name: "Unbound Vermilion Fiend-Claw",
        mpCost: 32,
        cooldownTurns: 4,
        powerMultiplier: 2.55,
        poiseBreak: 70,
        weaknessTag: "BLUNT_STAGGER",
        description: "Unleashes a blazing flurry of twelve cursed crimson claw-rends that guarantees massive Poise Break.",
      },
    },
  },

  "Godiva": {
    id: "comp_godiva",
    name: "Godiva",
    gender: "female",
    spriteSlug: "godiva",
    epithet: "4★ Dark-Star Void-Walker Hexblade",
    baseStarRank: 4,
    combatRole: "Blink-Step Hex Detonator & Void-Star Skirmisher",
    roleArchetype: "MAGE",
    archetype: "Enigmatic Teasing Void-Walker / Guarded Occult Confidante",
    personality:
      "Enigmatic, velvet-voiced 4★ void-walker who uses cryptic teasing and dimensional blinks to test whether anyone dares stand close to her rift scars.",
    values: [
      "Forbidden Occult Grimoires",
      "Black Fig & Nightshade Wine",
      "Commanders Who Don't Flinch at Void Blinks",
      "Clever Double-Layered Banter",
    ],
    dislikes: [
      "Rigid Dogmatic Inquisitors",
      "Prying Into Her Rift-Scar Uninvited",
      "Clumsy Predictable Traps",
      "Boring Small Talk",
    ],
    signatureMemories: [
      {
        id: "godiva_mem_1",
        title: "Beneath the Void-Tear Scar",
        hint: "Let Godiva plant a Void Hex inches from your heart without flinching, earning a glimpse behind her mask.",
      },
      {
        id: "godiva_mem_2",
        title: "Across the Dimensional Horizon",
        hint: "Synchronize a Triple Arcane Blink combo with Godiva against an Eclipse or Singularity guardian.",
      },
    ],
    summonQuote:
      "Mmm, an unindexed tactician pulling strings from the bottom rung? Intriguing. Call me Godiva—mind the black star-seals in the air; they bite much harder when I snap my fingers.",
    actOneConflict:
      "Spins a floating black four-pointed Void Star above her fingertips while dimensional whispers stain the tear-mark beneath her left eye—testing whether you trust her uncanny Void Blinks enough to let her plant twin Hex Seals inches from your blade.",
    traumaAndSecret:
      "The dark tear-mark beneath her eye is a permanent dimensional rift scar hiding raw empathy beneath her velvet-voiced teasing.",
    dyadPassiveName: "Twin Hex Seals & Triple Arcane Blink",
    dyadPassiveDescription:
      "Plants stacking Void Hex Seals on enemies; detonating 2+ seals deals bonus true damage and strips boss Poise.",
    speechVoiceBrief:
      "Velvet-smooth, playfully cryptic, observant banter with quiet intensity when the mask slips ('Careful, Commander—blink once and I'm behind your shoulder, blink twice and their armor is already hexed.').",
    ocSourceTitle: "Godiva (Void Walker)",
    ocSourceUrl: "https://docs.google.com/document/d/1EgoAwDpBubqh1-7bXeSFrS2Lcd9_uIF9HDTI53YO-gI/edit?usp=drivesdk",
    skillKit: {
      basicAttack: {
        id: "godiva_basic",
        name: "Rift-Step Hex Brand",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 1.12,
        poiseBreak: 22,
        weaknessTag: "SHADOW_HEX",
        appliesHexSeal: true,
        description: "Slashes through a micro-portal, branding a glowing violet Hex Seal onto the target.",
      },
      activeSkill: {
        id: "godiva_active",
        name: "Twin Hex Seal Detonation",
        mpCost: 19,
        cooldownTurns: 2,
        powerMultiplier: 1.7,
        poiseBreak: 38,
        weaknessTag: "SHADOW_HEX",
        appliesHexSeal: true,
        description: "Implodes primed Hex Seals on the enemy for massive void rupture and cast-bar stagger.",
      },
      tagAssistSkill: {
        id: "godiva_assist",
        name: "Triple Arcane Blink Warp",
        mpCost: 12,
        cooldownTurns: 2,
        powerMultiplier: 1.42,
        poiseBreak: 30,
        weaknessTag: "CORE_INTERRUPT",
        appliesHexSeal: true,
        description: "Teleports an endangered frontline ally through the void while branding the enemy's blind spot.",
      },
      bondSpecial: {
        id: "godiva_bond",
        name: "Unmasked Abyssal Horizon Collapse",
        mpCost: 34,
        cooldownTurns: 4,
        powerMultiplier: 2.7,
        poiseBreak: 62,
        weaknessTag: "SHADOW_HEX",
        appliesHexSeal: true,
        description: "Lifts her porcelain void-mask and collapses three dimensional rifts simultaneously onto the target.",
      },
    },
  },

  "Aurelle, the Seraph Lance": {
    id: "comp_aurelle",
    name: "Aurelle, the Seraph Lance",
    gender: "female",
    spriteSlug: "aurelle_seraph",
    epithet: "5★ Mythic Valkyrie Sovereign",
    baseStarRank: 5,
    combatRole: "Apex Boss-Slayer & Celestial Lancer",
    roleArchetype: "LANCER",
    archetype: "Cold Untouchable 5★ Legend / Betrayed Lonely Weapon",
    personality:
      "Cold, untouchable 5★ mythic Valkyrie who has been used as a lonely trophy weapon across dead accounts and slowly thaws when protected as a person.",
    values: [
      "Starlit High-Altitude Silence",
      "Being Protected Instead of Used",
      "Feather-Light Silver Polish",
      "A Commander Who Fights Beside Her",
    ],
    dislikes: [
      "Trophy-Collector Whale Masters",
      "Solo-Carry Suicide Orders",
      "Gilded Cages",
      "Watching Teammates Die Around Her",
    ],
    signatureMemories: [
      {
        id: "aurelle_mem_1",
        title: "Not a Trophy Weapon",
        hint: "Step in front of a lethal strike aimed at Aurelle despite the star-rank gap.",
      },
      {
        id: "aurelle_mem_2",
        title: "Wings Folded in Star Gate Plaza",
        hint: "Share a quiet moment on the floating island edge where Aurelle lowers her Seraphim guard.",
      },
    ],
    summonQuote:
      "Five falling stars, another Master's gilded cage... Wait. You're standing in front of me with a one-star blade? ...Very well. Tell me where you want the lance, and stay alive until it lands.",
    actOneConflict:
      "The rarest 0.5%-rate 5★ unit in Celestia Summons—traded across two dead accounts where greedy Masters used her as a solo carry while letting every teammate around her die. Coldly warns you not to get attached.",
    traumaAndSecret:
      "Has never once been treated as a person rather than a trophy SSR weapon; seeing a 1★ leader bleed to keep everyone—including her—alive slowly thaws the ice around her heart.",
    dyadPassiveName: "Seraphim Star-Pierce",
    dyadPassiveDescription:
      "Ignores 40% of Gate Boss armor and manifests spectral wings that steady the entire deployment squad.",
    speechVoiceBrief:
      "Quiet, spare, calm and unhurried—every sentence clean and deliberate, softening subtly as trust grows ('Don't stand behind me expecting a miracle. Tell me where you want the lance, and stay alive until it lands.').",
    skillKit: {
      basicAttack: {
        id: "aurelle_basic",
        name: "Astral Silver Lance Thrust",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 1.25,
        poiseBreak: 26,
        weaknessTag: "PIERCE_VITALS",
        description: "Armor-piercing celestial lance thrust that ignores 40% of enemy plating.",
      },
      activeSkill: {
        id: "aurelle_active",
        name: "Blade of Holy Light Sweep",
        mpCost: 22,
        cooldownTurns: 2,
        powerMultiplier: 1.88,
        poiseBreak: 44,
        weaknessTag: "HOLY_PURGE",
        description: "Unfurls spectral wings of golden light and cleaves through eclipse, undead, and boss barriers.",
      },
      tagAssistSkill: {
        id: "aurelle_assist",
        name: "Valkyrie Sky-Drop Intercept",
        mpCost: 14,
        cooldownTurns: 2,
        powerMultiplier: 1.62,
        poiseBreak: 38,
        weaknessTag: "HOLY_PURGE",
        isShield: true,
        description: "Descends in a pillar of sovereign starlight to parry the blow and drive the boss backward.",
      },
      bondSpecial: {
        id: "aurelle_bond",
        name: "Fifth Star Sovereign: Longinus Ascendant",
        mpCost: 38,
        cooldownTurns: 4,
        powerMultiplier: 3.05,
        poiseBreak: 75,
        weaknessTag: "HOLY_PURGE",
        description: "Full six-wing Seraphim ascension—hurls a star-piercing javelin of pure light that obliterates boss cores.",
      },
    },
  },

  "Vaelkor": {
    id: "comp_vaelkor",
    name: "Vaelkor",
    gender: "male",
    spriteSlug: "vaelkor",
    epithet: "2★ Dragonborn Storm-Brand Spellsword",
    baseStarRank: 2,
    combatRole: "Arcane Lightning Interruptor & Greatsword Skirmisher",
    roleArchetype: "MAGE",
    archetype: "Pragmatic Scaled Spellsword / Dry-Humored Draconic Brother-in-Arms",
    personality:
      "Pragmatic, gravelly 2★ dragonborn spellsword with dry mercenary wit who guards his squad like clutch-kin once earned.",
    values: [
      "Well-Oiled Greatsword Steel",
      "High-Altitude Storm Air",
      "Charred Wyvern-Cut Rations",
      "Clean Frontline Flanking Callouts",
    ],
    dislikes: [
      "Flashy Banner Posers",
      "Damp Flooded Crypts",
      "Panic-Button Master Seals",
      "Leaving Wounded Rookies Behind",
    ],
    signatureMemories: [
      {
        id: "vaelkor_mem_1",
        title: "Oath of the Last Sky-Bastion",
        hint: "Hold a crumbling frontline choke-point shoulder-to-shoulder with Vaelkor.",
      },
      {
        id: "vaelkor_mem_2",
        title: "Night Watch by the Storm-Gland",
        hint: "Share a quiet night watch with Vaelkor as he speaks of his fallen draconic bastion.",
      },
    ],
    summonQuote:
      "Hmph. Scales intact, storm-gland charged, greatsword still strapped to my spine. Name's Vaelkor. Keep the Master's panic-buttons off my back and I'll fry anything that tries to flank your vanguard.",
    actOneConflict:
      "Passed over by shallow Masters who only level flashy human rate-up banners—despite his rare ability to braid violet storm-lightning directly into heavy greatsword cleaves to short-circuit clockwork and boss cores.",
    traumaAndSecret:
      "Last survivor of a shattered draconic sky-bastion; treats his squad like clutch-kin once you earn his respect, quietly standing watch over wounded rookies through the night.",
    dyadPassiveName: "Violet Storm-Conduit Scales",
    dyadPassiveDescription:
      "Arcs crackling purple lightning across grouped enemies, interrupting cast bars and stripping +25% extra Poise from armored constructs.",
    speechVoiceBrief:
      "Low, gravelly, unhurried draconic bass with dry deadpan wit and grounded mercenary pragmatism ('That bronze golem's core is leaking charge. Buy me two seconds and I'll turn its own chestplate into a lightning rod.').",
    skillKit: {
      basicAttack: {
        id: "vaelkor_basic",
        name: "Fulminating Claw & Greatsword Sweep",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 1.05,
        poiseBreak: 22,
        weaknessTag: "ASTRAL_ARCANE",
        description: "Draws his back-slung greatsword through a crackling arc of violet claw-lightning.",
      },
      activeSkill: {
        id: "vaelkor_active",
        name: "Tempest Core Short-Circuit",
        mpCost: 15,
        cooldownTurns: 2,
        powerMultiplier: 1.5,
        poiseBreak: 35,
        weaknessTag: "CORE_INTERRUPT",
        description: "Hurls a chained bolt of purple storm-mana into an enemy's mana-core, snapping lethal wind-ups.",
      },
      tagAssistSkill: {
        id: "vaelkor_assist",
        name: "Bronze Pauldron Thunder-Check",
        mpCost: 10,
        cooldownTurns: 2,
        powerMultiplier: 1.32,
        poiseBreak: 28,
        weaknessTag: "CORE_INTERRUPT",
        description: "Crashes onto the frontline shoulder-first in a burst of static, jolting the attacker off-balance.",
      },
      bondSpecial: {
        id: "vaelkor_bond",
        name: "Draconic Sovereign: Astral Fulmination Cleave",
        mpCost: 28,
        cooldownTurns: 4,
        powerMultiplier: 2.25,
        poiseBreak: 52,
        weaknessTag: "ASTRAL_ARCANE",
        description: "Overcharges his greatsword with roaring purple sky-lightning and splits the floor in a blinding storm arc.",
      },
    },
  },

  "Garrick Ironbrow": {
    id: "comp_garrick",
    name: "Garrick Ironbrow",
    gender: "male",
    spriteSlug: "garrick_ironbrow",
    epithet: "3★ Scarred Veteran Axe-Bulwark",
    baseStarRank: 3,
    combatRole: "Heavy Choke-Point Anchor & Armor-Cracking Vanguard",
    roleArchetype: "TANK",
    archetype: "Grizzled Old-Guard Survivor / Gruff Fatherly Shield-Wall",
    personality:
      "Grizzled, white-bearded 3★ veteran axe-bulwark who hides deep survivor grief behind gruff fatherly protection of younger teammates.",
    values: [
      "Dwarven Malt & Pipe-Leaf",
      "Thick-Forged Iron Plate",
      "Young Rookies Making It Home",
      "Steady Boots in the Vanguard",
    ],
    dislikes: [
      "Meta-Chasing Tier Snobs",
      "Masters Who Discard Veterans",
      "Flimsy Ornamental Armor",
      "Watching Kids Die on His Watch",
    ],
    signatureMemories: [
      {
        id: "garrick_mem_1",
        title: "The Apprentice on Floor 35",
        hint: "Share a drink with Garrick by the barracks fire as he honors the rookie he couldn't save.",
      },
      {
        id: "garrick_mem_2",
        title: "Old Iron Holds the Gate",
        hint: "Stand beside Garrick to shatter a Threshold Boss's guard without a single casualty.",
      },
    ],
    summonQuote:
      "Bah—knees still work, steel's still thick, and this axe has split uglier things than whatever's behind Floor 1's gate. Name's Garrick Ironbrow. Keep the kids behind my shoulders, Commander.",
    actOneConflict:
      "A scarred, white-bearded veteran warrior dumped by meta-chasing Masters for being 'too slow and old-fashioned'—yet his iron nerve in lethal boss phases keeps panicking low-star squads from breaking.",
    traumaAndSecret:
      "Lost his apprentice vanguard on Floor 35 in a dead account; refuses to let another young rookie get chewed up by a careless Master's auto-battle order while he still draws breath.",
    dyadPassiveName: "Old Iron Never Breaks",
    dyadPassiveDescription:
      "Reduces party-wide AoE impact by 20% while holding the frontline and deals massive blunt stagger against armored Gate Bosses.",
    speechVoiceBrief:
      "Gruff, gravelly, steady veteran cadence—plain soldier talk, zero pretension, protective gruffness ('Easy there, kid. Breathe from your gut, keep your boots wide, and let the old man take the first swing.').",
    skillKit: {
      basicAttack: {
        id: "garrick_basic",
        name: "Notched Great-Axe Hew",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 1.14,
        poiseBreak: 28,
        weaknessTag: "BLUNT_STAGGER",
        description: "Two-handed iron battleaxe chop that rattles enemy shields and cracks stone footing.",
      },
      activeSkill: {
        id: "garrick_active",
        name: "Ironbrow Bastion Brace & Sundering Hook",
        mpCost: 16,
        cooldownTurns: 2,
        powerMultiplier: 1.48,
        poiseBreak: 42,
        weaknessTag: "BLUNT_STAGGER",
        isShield: true,
        description: "Hooks the enemy's guard open with his axe beard while fortifying frontline defense.",
      },
      tagAssistSkill: {
        id: "garrick_assist",
        name: "Greybeard's Interpose Slam",
        mpCost: 11,
        cooldownTurns: 2,
        powerMultiplier: 1.35,
        poiseBreak: 36,
        weaknessTag: "BLUNT_STAGGER",
        isShield: true,
        description: "Steps squarely in front of an endangered comrade, catching the blow on scarred steel plate and slamming back.",
      },
      bondSpecial: {
        id: "garrick_bond",
        name: "Last Stand of the Old Guard: Earthshaker Cleave",
        mpCost: 30,
        cooldownTurns: 4,
        powerMultiplier: 2.45,
        poiseBreak: 68,
        weaknessTag: "BLUNT_STAGGER",
        isShield: true,
        description: "Roars a veteran's war-cry, planting an unbreakable bastion ward before bringing his battleaxe down like a falling tower.",
      },
    },
  },

  "Sir Roland Vance": {
    id: "comp_roland",
    name: "Sir Roland Vance",
    gender: "male",
    spriteSlug: "roland_vance",
    epithet: "4★ Crimson-Cloak Silver Paladin",
    baseStarRank: 4,
    combatRole: "Aristocratic Counter-Vanguard & Radiant Aegis Tactician",
    roleArchetype: "TANK",
    archetype: "Stoic Perfectionist Noble Paladin /Earned Sworn Equal",
    personality:
      "Stoic, perfectionist 4★ cathedral paladin whose initial aristocratic skepticism gives way to unbreakable sworn brotherhood once you prove your command.",
    values: [
      "Unforged Casualty Ledgers",
      "Immaculate Silver Plate Discipline",
      "Crisp Tactical Briefings",
      "Commanders Who Lead from the Front",
    ],
    dislikes: [
      "Corrupt Guild Politics",
      "Falsified Battle Reports",
      "Sloppy Uncoordinated Flanking",
      "Sacrificing Vanguard Troops for Speedruns",
    ],
    signatureMemories: [
      {
        id: "roland_mem_1",
        title: "Why He Left the Apex Concord",
        hint: "Earn Sir Roland's respect through flawless callouts until he reveals why he exiled himself.",
      },
      {
        id: "roland_mem_2",
        title: "Sworn Shield of the One-Star Commander",
        hint: "Execute a frame-perfect counter-riposte alongside Roland against a Gate Boss.",
      },
    ],
    summonQuote:
      "Sir Roland Vance of the Cathedral Vanguard. ...A one-star holding field command? Bold—or suicidal. Prove your callouts aren't guesswork, and my silver plate is yours to command.",
    actOneConflict:
      "An immaculate 4★ cathedral paladin in silver plate and crimson mantle who initially views a 1★ tactician with cool aristocratic skepticism—until your surgical boss-frame callouts outperform every high-tier commander he ever served.",
    traumaAndSecret:
      "Exiled himself from the elite Apex Concord after exposing a guild commander who falsified casualty reports; beneath his folded-arms stoicism lies an unbending code of honor.",
    dyadPassiveName: "Crimson Mantle & Silver Counter-Riposte",
    dyadPassiveDescription:
      "Turns clean parries and Defensive Swaps into radiant counter-thrusts while granting +20% DEF against boss cleaves.",
    speechVoiceBrief:
      "Measured, crisp, aristocratic baritone—coolly skeptical at first, razor-disciplined in combat, and deeply loyal once convinced ('Your timing was half a beat tight—yet the flank held. Call the next window, Tactician. I am listening.').",
    skillKit: {
      basicAttack: {
        id: "roland_basic",
        name: "Cathedral Longsword Riposte",
        mpCost: 0,
        cooldownTurns: 0,
        powerMultiplier: 1.16,
        poiseBreak: 24,
        weaknessTag: "PIERCE_VITALS",
        description: "Crisp silver-steel thrust straight through the gap of an enemy's overextended swing.",
      },
      activeSkill: {
        id: "roland_active",
        name: "Sanctified Silver Bulwark",
        mpCost: 18,
        cooldownTurns: 2,
        powerMultiplier: 1.62,
        poiseBreak: 38,
        weaknessTag: "HOLY_PURGE",
        isShield: true,
        description: "Sweeps his crimson cloak back and raises a consecrated silver aegis that purges corrupt strikes.",
      },
      tagAssistSkill: {
        id: "roland_assist",
        name: "Vanguard Commander's Intercept",
        mpCost: 12,
        cooldownTurns: 2,
        powerMultiplier: 1.48,
        poiseBreak: 34,
        weaknessTag: "CORE_INTERRUPT",
        isShield: true,
        description: "Intercepts an incoming lethal strike with millimeter precision, staggering the attacker mid-swing.",
      },
      bondSpecial: {
        id: "roland_bond",
        name: "Oath of the Crimson Cathedral: Sovereign Judgment",
        mpCost: 34,
        cooldownTurns: 4,
        powerMultiplier: 2.68,
        poiseBreak: 64,
        weaknessTag: "HOLY_PURGE",
        isShield: true,
        description: "Consecrates the entire frontline in silver cathedral light before driving a radiant lance-blade through the boss's core.",
      },
    },
  },
};

export interface StarfallAntagonistProfile {
  name: string;
  role: string;
  description: string;
}

export const STARFALL_ANTAGONIST_DOSSIERS: StarfallAntagonistProfile[] = [
  {
    name: "Kaiser Valdane",
    role: "Rival Top-100 Whale Master (Guild 'Crimson Ledger')",
    description:
      "A ruthless leaderboard speedrunner encountered via Safe Zone cross-server relays and PvP Floor Races. Burns dozens of 1★–3★ heroes as sacrificial bait every week to shave minutes off his clear times, mocking your zero-casualty doctrine.",
  },
  {
    name: "Vesper, the Crimson Lancer",
    role: "5★ Champion of Kaiser Valdane's Roster",
    description:
      "Aurelle's dark mirror—a deadly 5★ spearwoman conditioned by Kaiser's ruthless Command Seals to believe weak heroes exist only to buy five-stars an opening. Clashes with your squad at Safe Zones and Floor 70's Crimson Trial.",
  },
  {
    name: "The Administrator",
    role: "Faceless Arbiter of the Starfall Labyrinth",
    description:
      "Manifests only through cold silver system broadcasts, distorted Safe Zone obelisks, and Floor 100's final throne. Enforces the eight Covenant laws without mercy while quietly auditing your impossible meta-knowledge.",
  },
];
