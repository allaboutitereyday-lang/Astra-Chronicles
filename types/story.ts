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
  expressionKey: CompanionExpressionKey;
  isPresent: boolean;
  encountered: boolean;
  
  // Visual AI & Consistency Pipeline Fields (ControlNet & IPAdapter)
  seed: number;
  baseImageUrl: string;
  visualPrompt: string;
  expressions: Record<string, string>;
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
  createdAt: string;
  author?: string;
  isPreset?: boolean;
}

