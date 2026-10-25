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
  isClaimed?: boolean;
  claimedAt?: number;
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

  // System Evolution Architecture Expansion (Pillars A, B, C)
  covenantState?: CausalCovenantState;
  frictionState?: CompanionFrictionState;
  activeClash?: ActiveStoryClashState | null;
}

// --- PITCH A: THE CAUSAL COVENANT ---
export interface TimelineScar {
  id: string;
  title: string;
  description: string;
  scarType: "amnesia" | "blight" | "chronal_shadow" | "severance";
  affectedCompanionName?: string;
  affectedLocationName?: string;
  plausibilityCapReduction: number; // e.g. 15
  createdAtTurn: number;
  createdAtTime: string;
}

export interface CausalCovenantState {
  covenantsInvoked: number;
  maxPlausibilityCap: number; // starts at 100, drops by 15 per invocation (e.g. 85, 70)
  timelineScars: TimelineScar[];
  activeAnomalies: string[];
}

// --- PITCH B: INTERPERSONAL FRICTION & ROMANTIC ALLEGIANCES ---
export interface CompanionRivalryRecord {
  pairKey: string; // e.g. "evelyn_aria"
  companion1Name: string;
  companion2Name: string;
  frictionScore: number; // 0 (harmony) to 100 (lethal animosity)
  ideologicalAxis: string; // e.g. "Aristocratic Order vs Underworld Anarchy"
  lastCrossTalkTurn?: number;
  activeUltimatumPrompt?: string | null;
}

export interface CompanionFrictionState {
  rivalries: Record<string, CompanionRivalryRecord>;
  activeJealousyEvents: string[];
  swornPartnerId?: string | null;
  pendingUltimatum?: {
    companionName: string;
    rivalName: string;
    triggerMilestone: number;
    prompt: string;
    choices: [string, string, string, string];
  } | null;
}

// --- PITCH C: INTEGRATED INFILTRATION, RANDOM ENCOUNTERS & SECTOR CLASHES ---
export interface EnemyCombatIntent {
  label: string;
  estimatedDamage: number;
  type: "strike" | "heavy" | "arcane" | "debuff";
  counterStanceHint: string;
}

export interface ActiveStoryClashState {
  isActive: boolean;
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyDesc?: string;
  enemyAttackPower?: number; // e.g. 15
  enemyImageUrl?: string; // Generated or procedural portrait of the enemy
  enemyVisualPrompt?: string; // Visual description for Nano Banana 2.1 monster synthesis
  threatRank?: QuestDifficulty; // E, D, C, B, A, S
  enemyArchetype?: string; // e.g. "Inquisition Hound-Pack", "Abyssal Construct"
  enemyIntent?: EnemyCombatIntent;
  isRandomEncounter?: boolean;
  clashTurn: number;
  maxClashTurns?: number; // e.g. 6
  tacticalObjective: string;
  status: "ongoing" | "victory" | "retreat" | "intervention";
  companionAssistingName?: string;
  log: string[];
}

export type SystemToastType = 
  | "quest_assigned" 
  | "quest_completed" 
  | "quest_updated" 
  | "quest_failed" 
  | "system_alert" 
  | "penalty_quest" 
  | "regression_trigger"
  | "covenant_severance"
  | "story_clash"
  | "companion_friction";

export interface SystemToastNotification {
  id: string;
  type: SystemToastType;
  title: string;
  subtitle: string;
  difficulty?: QuestDifficulty;
  timestamp: string;
}
