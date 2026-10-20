export type QuestDifficulty = "E" | "D" | "C" | "B" | "A" | "S" | "Calamity";

export type QuestType = "scenario" | "sub" | "urgent" | "hidden" | "penalty";

export interface QuestObjective {
  text: string;
  completed: boolean;
}

export interface QuestRewards {
  exp: number;
  gold?: number;
  items?: string[];
  title?: string;
  statPoints?: number;
}

export interface SystemQuest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  objectives: QuestObjective[];
  rewards: QuestRewards;
  status: "active" | "completed" | "failed";
  progressNote?: string;
  failureConsequence?: string; // Severe narrative or stat penalty when failed
}

export type PlausibilityTier = "Stable" | "Strained" | "Volatile" | "Critical";

// High-Stakes Penalty Scenario triggered when Causal Plausibility falls below Critical (<25%)
export interface PenaltyScenarioState {
  isActive: boolean;
  scenarioId: string;
  scenarioTitle: string; // e.g. "DIMENSIONAL VOID RIFT SURVIVAL"
  survivalTurnsRequired: number; // e.g. 3 turns
  currentSurvivalTurn: number;
  hazardEffectDescription: string;
  riskPenalty: string; // e.g. "Causal oblivion / severe stat drain if depleted"
  resolutionRewardRelicId: string; // e.g. "relic_cursed_void_heart"
  beganAtPlausibility: number;
}

// Regression & Death Record (Permadeath / Regression Protocol)
export interface DeathRegressionRecord {
  id: string;
  deathNumber: number;
  causeOfDeath: string;
  location: string;
  killerOrHazard: string;
  timestamp: string;
  systemVerdict: "Sanctioned Regression" | "Plausibility Burn" | "Causal Collapse";
  retainedKnowledgeSummary: string;
  retainedExpPercent: number; // e.g. 100% (or 75% if penalized by SYSTEM)
  retainedAbilities: string[];
  loopResetNodeId?: string;
}

export interface SystemState {
  plausibility: number; // 0 - 100
  plausibilityTier: PlausibilityTier;
  activeQuests: SystemQuest[];
  completedQuests: SystemQuest[];
  failedQuests?: SystemQuest[];
  systemDirectives: string[]; // Administrative event logs
  
  // High-Stakes Expansion
  penaltyScenario?: PenaltyScenarioState | null;
  deathCount?: number;
  regressionCount?: number;
  regressionHistory?: DeathRegressionRecord[];
  isProtagonistDead?: boolean;
  pendingRegression?: DeathRegressionRecord | null;
}

export type SystemToastType = 
  | "quest_assigned" 
  | "quest_completed" 
  | "quest_updated" 
  | "quest_failed" 
  | "system_alert" 
  | "penalty_quest" 
  | "regression_trigger";

export interface SystemToastNotification {
  id: string;
  type: SystemToastType;
  title: string;
  subtitle: string;
  difficulty?: QuestDifficulty;
  timestamp: string;
}
