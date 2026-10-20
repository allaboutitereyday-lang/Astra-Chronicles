import { SystemQuest } from "./system";

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
  intimacyUnlocked?: boolean;
  milestonesReached?: number[]; // [25, 50, 75, 100]
  bespokeRomanceCgUrl?: string; // High-stakes milestone CG from Nano Banana 2.1
  
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
}

export type InventoryItem = StoryRelicItem;

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

export interface PlayerProfile {
  name: string;
  role: string;
  level: number;
  stats: PlayerStats;
  gear: { weapon: string; armor: string; relic: string };
  abilities: string[];
  abilityDetails?: Record<string, AbilityDetail>;
  inventory: InventoryItem[];
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
}

export interface StoryFlowNode {
  id: string;
  nodeKey: string;
  title: string;
  speaker: string;
  location: string;
  summary: string;
  isStartingPoint?: boolean;
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

  createdAt: string;
  author?: string;
  isPreset?: boolean;
}
