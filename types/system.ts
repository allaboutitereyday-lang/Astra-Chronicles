export type QuestDifficulty = "E" | "D" | "C" | "B" | "A" | "S" | "Calamity";

export type QuestType = "scenario" | "sub" | "urgent" | "hidden";

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
}

export type PlausibilityTier = "Stable" | "Strained" | "Volatile" | "Critical";

export interface SystemState {
  plausibility: number; // 0 - 100
  plausibilityTier: PlausibilityTier;
  activeQuests: SystemQuest[];
  completedQuests: SystemQuest[];
  systemDirectives: string[]; // Administrative event logs
}

export interface SystemToastNotification {
  id: string;
  type: "quest_assigned" | "quest_completed" | "quest_updated" | "system_alert";
  title: string;
  subtitle: string;
  difficulty?: QuestDifficulty;
  timestamp: string;
}
