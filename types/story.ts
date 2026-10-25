import {
  SystemQuest,
  TimelineScar,
  CausalCovenantState,
  CompanionFrictionState,
  ActiveStoryClashState,
  EnemyCombatIntent,
} from "./system";

export type {
  TimelineScar,
  CausalCovenantState,
  CompanionFrictionState,
  ActiveStoryClashState,
  EnemyCombatIntent,
};

export type CompanionExpressionKey =
  | "neutral"
  | "intrigued"
  | "flustered"
  | "smug"
  | "surprised"
  | "combat_ready"
  | "dangerous"
  | "hurt"
  | "beckon";

export type RomancePath = "harem" | "mono" | "platonic" | "rival" | "uncommitted";

export type CompanionAffectionTier = "Stranger" | "Acquaintance" | "Confidant" | "Beloved" | "Sworn Partner";

export interface CompanionResonanceAbilities {
  confidantPassive: {
    name: string;
    description: string;
    triggerCondition: "interval" | "crisis_hp" | "turn_start";
    value: number; // e.g. 25 HP heal or 30 damage shield
    type: "shield" | "heal" | "mana";
  };
  belovedUltimate: {
    name: string; // e.g. "Umbral Eclipse Stun", "Dawnfire Cataclysm"
    description: string;
    mpCost: number;
    multiplier: number; // e.g. 3.2x damage multiplier
    inflictsStun: boolean;
    voiceLine: string;
    animationKey?: string;
  };
}

export interface ActiveTrialCompanion {
  id: string;
  name: string;
  role: string;
  affection: number;
  tier: CompanionAffectionTier;
  color: string;
  avatarUrl?: string;
  resonance: CompanionResonanceAbilities;
}

export interface StoryCompanion {
  id: string;
  name: string;
  title: string;
  role: string;
  gender?: "female" | "male" | "non-binary";
  color: "rose" | "sky" | "amber" | "purple" | "emerald" | "zinc" | string;
  personality: string;
  values: string[];
  dislikes: string[];
  highCompatibility: string[];
  baseAffection: number;
  affection: number;
  affectionLevel: number; // 0-100 numerical affection level (core romance metric)
  romancePath: RomancePath; // "harem" | "mono" | "platonic" | "rival" | "uncommitted"
  expressionKey: CompanionExpressionKey;
  isPresent: boolean;
  encountered: boolean;
  
  // Romance & Milestone Progression
  relationshipStage?: "stranger" | "acquaintance" | "confidant" | "beloved" | "sworn_partner";
  affectionTier?: CompanionAffectionTier;
  intimacyUnlocked?: boolean;
  milestonesReached?: number[]; // [25, 50, 75, 100]
  bespokeRomanceCgUrl?: string; // High-stakes milestone CG from Nano Banana 2.1
  
  // Pillar 1 & 5 Additions: Resonance in Trials & Camp Gifting
  resonanceAbilities?: CompanionResonanceAbilities;
  giftHistory?: string[]; // IDs of items gifted by protagonist
  interpersonalDynamics?: {
    rivalIds?: string[];
    allyIds?: string[];
    jealousyThreshold?: number; // affection gap that sparks banter
  };

  // Visual AI & Consistency Pipeline Fields (ControlNet & IPAdapter)
  seed: number;
  baseImageUrl: string;
  visualPrompt: string;
  expressions: Record<string, string>;
}

export interface RelicSynergy {
  id: string;
  setName: string; // e.g. "Voidstrider", "Solarion", "Abyssal Weaver"
  pieceCount: number;
  requiredCount: number;
  isActive: boolean;
  bonusName: string;
  bonusDescription: string;
  unlockedExclusiveChoicePrefix: string; // e.g. "[Voidstrider Resonance]"
}

export interface AbilityDetail {
  name: string;
  description: string;
  type?: "Active" | "Passive" | "Stance" | "Ultimate" | string;
  cost?: string; // e.g. "12 MP", "Passive", "None"
  cooldown?: string; // e.g. "Instant", "2 Turns", "1 Battle", "None"
  tier?: "Novice" | "Adept" | "Master" | "Unique" | string;
}

// Cursed Relic Modifiers (High Risk / High Reward for Penalty Scenarios)
export interface CursedRelicModifier {
  positiveBuff: string; // e.g. "+50% Critical Strike Damage"
  cursePenalty: string; // e.g. "Take 15% recoil damage each combat turn"
  critMultiplierBonus?: number;
  recoilDamagePercent?: number;
  mpDrainPerTurn?: number;
  plausibilityDrainPerTurn?: number;
}

// Predefined LitRPG Trial Active Modifiers (Phase 1)
export interface TrialModifierEffects {
  playerDamageMultiplier?: number;       // e.g. 1.20 (+20% damage)
  critDamageMultiplier?: number;         // e.g. 1.35 (+35% crit damage)
  critRateBonus?: number;                // e.g. 0.20 (+20% crit chance)
  enemyLethalityMultiplier?: number;     // e.g. 1.15 (+15% enemy counter damage)
  mpCostMultiplier?: number;             // e.g. 0.75 (-25% MP cost) or 1.25 (+25% MP cost)
  staggerMultiplier?: number;            // e.g. 1.40 (+40% stagger buildup)
  lifestealPercent?: number;             // e.g. 0.15 (15% lifesteal on hit)
  plausibilityDrainMultiplier?: number;  // e.g. 1.50 (+50% plausibility loss)
  shieldBonus?: number;
}

export interface TrialModifier {
  id: string;
  name: string;
  description: string;
  iconName: "Flame" | "Zap" | "Moon" | "CloudFog" | "Skull" | "Infinity" | "Compass" | "Shield" | "Sparkles";
  colorTheme: "amber" | "rose" | "purple" | "cyan" | "emerald";
  effects: TrialModifierEffects;
  statEffectLabel: string;
}

export type RelicUnsealingConditionType =
  | "clash_victory"
  | "low_hp_survival"
  | "covenant_invoked"
  | "high_affection"
  | "turns_survived";

export interface RelicUnsealingCondition {
  id: string;
  type: RelicUnsealingConditionType;
  label: string;
  description: string;
  targetValue: number;
  currentValue: number;
  isMet: boolean;
}

export interface RelicAwakenedForm {
  awakenedName: string;
  awakenedDescription: string;
  awakenedEffect: string;
  visualPrompt: string;
  signatureSkill: AbilityDetail;
  statBonuses: {
    str?: number;
    dex?: number;
    int?: number;
    maxHp?: number;
    maxMp?: number;
  };
}

export interface StoryRelicItem {
  id: string;
  name: string;
  setName?: string; // set synergy identifier (e.g. "Voidstrider")
  type: "weapon" | "armor" | "relic" | "consumable" | "material";
  rarity: "common" | "uncommon" | "rare" | "relic" | "cursed";
  description: string;
  effect?: string;
  imageUrl?: string;
  isEquipped?: boolean;
  cursedEffect?: CursedRelicModifier;
  isGiftable?: boolean;
  // Relic Awakening & Purification System
  isAwakened?: boolean;
  unsealingCondition?: RelicUnsealingCondition;
  awakenedForm?: RelicAwakenedForm;
}

export type InventoryItem = StoryRelicItem;

// Combat Stances & Mode Toggles (Pillar 2)
export type CombatStanceType = "neutral" | "frost" | "flame" | "phase" | "graviton" | "shadow";

export interface CombatStanceConfig {
  id: CombatStanceType;
  name: string;
  element: "Frost" | "Flame" | "Void" | "Physical" | "Starlight" | "Shadow";
  modifierLabel: string;
  bonusStaggerRate: number;
  bonusDotDamage: number;
  damageMultiplier: number;
  icon?: string;
}

// Class Ability Awakening & Skill Evolution (Pillar 2)
export type AbilityEvolutionTier = "Novice" | "Adept" | "Master" | "Unique";

export interface AbilityEvolutionStage {
  requiredLevel: number;
  tier: AbilityEvolutionTier;
  name: string;
  description: string;
  damageMultiplier: number;
  cost: string;
  cooldown?: string;
}

export interface AbilityEvolutionPath {
  baseAbilityName: string;
  adept: AbilityEvolutionStage;
  master: AbilityEvolutionStage;
}

// Camp Gifting Item Schema (Pillar 5)
export interface GiftItemRecord {
  itemId: string;
  name: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "relic" | "cursed";
  preferredCompanionIds: string[]; // Companions who have high affinity for this gift
  baseAffectionGain: number; // Default +3 to +8
  reactionPrompt: string; // LLM prompt injection for companion dialogue
  statBonus?: {
    stat: "hp" | "mp" | "str" | "dex" | "int";
    amount: number;
  };
}

// Timeline Echoes & Butterfly Paradoxes (Pillar 4 - Cross-Rewind Persistence)
export interface TimelineEcho {
  id: string;
  sourceNodeKey: string;
  sourceNodeTitle: string;
  choiceTaken: string;
  consequenceSummary: string;
  loopIteration: number;
  recordedAt: string;
  foreshadowKey?: string; // Special flag e.g. "knows_traitor_identity", "discovered_void_rune"
  isGlitchParadox?: boolean;
  isDeathEcho?: boolean; // If protagonist died in this timeline
  deathCause?: string;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  maxExp: number;
  str: number;
  dex: number;
  int: number;
}

export interface CharacterVisualDNA {
  gender: "male" | "female" | "androgynous";
  ageAppearance?: string;
  build?: string;
  hair: {
    color: string;
    style: string;
    length?: string;
  };
  eyes: {
    color: string;
    shape?: string;
  };
  complexion?: string;
  facialFeatures?: string[];
  primaryAttire?: {
    upper?: string;
    lower?: string;
    palette?: string[];
  };
  signatureAccessories?: string[];
  fullPromptAnchor: string; // Compact compiled prompt snippet for image models
}

export interface PlayerProfile {
  name: string;
  role: string;
  level: number;
  stats: PlayerStats;
  gear: { weapon: string; armor: string; relic: string };
  gearImages?: Record<string, string>; // Cached image URLs or base64 indexed by item name or ID
  abilities: string[];
  abilityDetails?: Record<string, AbilityDetail>;
  inventory: InventoryItem[];
  gold?: number;

  // Tactical & Progression Expansions
  unlockedStances?: CombatStanceType[];
  activeStance?: CombatStanceType;
  abilityEvolutions?: Record<string, string>; // Maps base ability name -> current evolved name
  deathCount?: number;
  regressionCount?: number;
  narrationStyle?: string; // Active narration prose directive / atmosphere tone
  visualDescription?: string; // Persisted vision-encoded physical appearance description
  visualDna?: CharacterVisualDNA; // Structured character visual DNA for consistent image synthesis
}

export interface VisitedStoryNode {
  id: string;
  nodeKey: string;
  title: string;
  speaker: string;
  location: string;
  visitedAt: string;
  choiceTaken?: string;
  affectionSnapshot?: Record<string, number>;
  gameStateSnapshot?: any;
  isAnchor?: boolean;
  anchorLabel?: string;
  isStartingPoint?: boolean;
  isGlitchNode?: boolean;
}

export interface StoryFlowNode {
  id: string;
  nodeKey: string;
  title: string;
  speaker: string;
  location: string;
  summary: string;
  isStartingPoint?: boolean;
  isGlitchNode?: boolean; // Rendered only when causal plausibility is critical (<40%)
  glitchRequirement?: {
    maxPlausibility: number;
    paradoxSecret: string;
  };
  unlockRequirement?: {
    companionName?: string;
    minAffection?: number;
    requiredRelicSet?: string;
    previousNodeId?: string;
    hintSilhouette?: string;
  };
  connectedTo: string[]; // next node ids
}

export interface StoryLocation {
  name: string;
  zone: string;
  danger: string;
  description: string;
  bgImage: string;
}

export interface StoryStartingNode {
  id: string;
  title: string;
  speaker: string;
  location: string;
  sceneSetup: string;
  dialogue: string;
  expressionKey: CompanionExpressionKey;
  choices: [string, string, string, string] | string[];
  initialQuest?: SystemQuest;
  initialAffection?: number;
  bgImage?: string;
}

export interface StoryRPGRules {
  systemName: string; // e.g. "LitRPG System Administrator", "Neural Sync Core", "Celestial Matrix"
  currencyName: string; // e.g. "Gold", "Credits", "Aether Shards"
  causalAnchorName: string; // e.g. "Causal Plausibility", "Sanity Anchor", "Timeline Coherence"
  defaultPlausibility: number;
  statDefinitions: {
    str: string;
    dex: string;
    int: string;
  };
  startingLevel: number;
  baseStats: {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    exp: number;
    maxExp: number;
    str: number;
    dex: number;
    int: number;
  };
  startingGearOptions?: {
    id: string;
    label: string;
    gear: {
      weapon: string;
      armor: string;
      relic: string;
    };
  }[];
}

export interface StoryWorldContext {
  settingName: string;
  eraOrPeriod?: string;
  loreSummary: string;
  locations: StoryLocation[];
  factions?: {
    name: string;
    description: string;
    influence?: string;
  }[];
}

export interface StoryContext {
  id: string;
  title: string;
  tagline: string;
  description: string;
  coverImage: string;
  genre: string;
  themes: string[];
  narrationStyle: string; // e.g. "Grimdark & Atmospheric", "Cyberpunk Noir", "High Fantasy Intrigue"
  worldContext: StoryWorldContext;
  rpgRules: StoryRPGRules;
  startingNodes: StoryStartingNode[];
  companions: StoryCompanion[];
  
  // Core Romance & Flowchart & Relic Architecture Expansion
  romancePath?: RomancePath; // overarching story romance mode: "harem" | "mono" | "uncommitted"
  relicInventory?: StoryRelicItem[]; // account or story-level relic drops and inventory
  activeSynergies?: RelicSynergy[]; // active relic set bonuses and exclusive intentions
  visitedNodes?: VisitedStoryNode[]; // chronological visited anchor nodes for flowchart tracking
  flowchartTree?: StoryFlowNode[]; // full interactive branching graph definition
  timelineEchoes?: TimelineEcho[]; // persistent cross-rewind memories

  // System Evolution Architecture Expansion (Pillars A, B, C)
  timelineScars?: TimelineScar[];
  covenantState?: CausalCovenantState;
  frictionState?: CompanionFrictionState;
  activeClash?: ActiveStoryClashState | null;
  npcKnowledgeMap?: NpcKnowledgeMap;

  createdAt: string;
  author?: string;
  isPreset?: boolean;
}

export interface CompanionKnowledgeState {
  knowsName: boolean;
  knowsClass: boolean;
  knowsOrigin: boolean;
}

export type NpcKnowledgeMap = Record<string, CompanionKnowledgeState>;
