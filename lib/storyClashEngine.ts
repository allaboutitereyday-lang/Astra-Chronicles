/**
 * Integrated Infiltration & Story Clashes Engine (Pitch C)
 * for Astra Chronicles
 * 
 * Seamlessly integrates turn-based tactical combat directly inside the
 * Visual Novel gameplay interface without page redirects. Powers the
 * in-scene Tactical Arsenal Dock, dual telemetry, and narrative combat choreography.
 */

import { ActiveStoryClashState } from "@/types/system";
import { getClassArsenal, ClassArsenal, ClassTacticalAction } from "./trialsClassArsenals";
import { StoryCompanion } from "@/types/story";

/**
 * Initializes a new in-scene Story Clash.
 */
export function initiateStoryClash(params: {
  enemyName: string;
  enemyHp: number;
  enemyDesc?: string;
  tacticalObjective: string;
  companionAssistingName?: string;
  enemyAttackPower?: number;
}): ActiveStoryClashState {
  const hp = Math.max(30, params.enemyHp);
  return {
    isActive: true,
    enemyName: params.enemyName || "Anomaly Sovereign",
    enemyHp: hp,
    enemyMaxHp: hp,
    enemyDesc: params.enemyDesc || "A formidable adversary standing between you and the objective.",
    enemyAttackPower: params.enemyAttackPower || 18,
    clashTurn: 1,
    maxClashTurns: 6,
    tacticalObjective: params.tacticalObjective || "Neutralize the threat before causal collapse.",
    status: "ongoing",
    companionAssistingName: params.companionAssistingName,
    log: [
      `[CLASH INITIALIZED]: ${params.enemyName} (HP: ${hp}/${hp}) enters combat engagement! Objective: ${params.tacticalObjective}`,
    ],
  };
}

export interface FormattedClashChoice {
  actionType: "strike" | "burst" | "synergy" | "defense";
  label: string; // Formatted as [Tone/Action]: Short summary
  actionName: string;
  mpCost: number;
  description: string;
  disabled: boolean;
  reasonDisabled?: string;
}

/**
 * Formats the 4 player Class Arsenal choices for the active Story Clash,
 * strictly conforming to [Tone/Action]: Short summary.
 */
export function getStoryClashChoices(
  playerRole: string = "Voidstrider",
  companion?: { name: string } | StoryCompanion | null,
  currentMp: number = 60
): FormattedClashChoice[] {
  const arsenal: ClassArsenal = getClassArsenal(playerRole);
  const compName = companion?.name || "Companion";

  const actions = arsenal.actions;

  return [
    // 1. Strike
    {
      actionType: "strike",
      actionName: actions.strike.name,
      label: `[Strike/Tactical]: Execute ${actions.strike.name} against enemy perimeter (0 MP, restores 5 MP).`,
      mpCost: 0,
      description: actions.strike.description,
      disabled: false,
    },
    // 2. Class Signature Burst
    {
      actionType: "burst",
      actionName: actions.burst.name,
      label: `[Class Burst/Devastating]: Unleash ${actions.burst.name} to breach armor core (-${actions.burst.costMp} MP).`,
      mpCost: actions.burst.costMp,
      description: actions.burst.description,
      disabled: currentMp < actions.burst.costMp,
      reasonDisabled: currentMp < actions.burst.costMp ? `Insufficient MP (${currentMp}/${actions.burst.costMp})` : undefined,
    },
    // 3. Companion Tactical Synergy
    {
      actionType: "synergy",
      actionName: actions.synergy.name,
      label: `[Tactical Synergy/Coordinated]: Coordinate with ${compName} for a synchronized combo (-${actions.synergy.costMp} MP, heals 25 HP).`,
      mpCost: actions.synergy.costMp,
      description: `Synchronizes strikes with ${compName}, staggering the target and restoring party health.`,
      disabled: currentMp < actions.synergy.costMp,
      reasonDisabled: currentMp < actions.synergy.costMp ? `Insufficient MP (${currentMp}/${actions.synergy.costMp})` : undefined,
    },
    // 4. Defensive Stance / Parry
    {
      actionType: "defense",
      actionName: actions.defense.name,
      label: `[Parry/Defensive]: Adopt ${actions.defense.name} to absorb incoming blows (-70% incoming DMG, +15 MP).`,
      mpCost: 0,
      description: actions.defense.description,
      disabled: false,
    },
  ];
}

/**
 * Resolves a single tactical turn in an active Story Clash.
 */
export function resolveClashTurn(
  clashState: ActiveStoryClashState,
  actionType: "strike" | "burst" | "synergy" | "defense",
  playerRole: string = "Voidstrider",
  companion?: { name: string } | StoryCompanion | null,
  playerStats?: { hp: number; maxHp: number; mp: number; maxMp: number }
): {
  updatedClashState: ActiveStoryClashState;
  damageDealt: number;
  mpCost: number;
  hpHealed: number;
  enemyDamageTaken: number;
  isVictory: boolean;
  isDefeat: boolean;
  narrativePromptAction: string;
} {
  const arsenal: ClassArsenal = getClassArsenal(playerRole);
  const action: ClassTacticalAction = arsenal.actions[actionType] || arsenal.actions.strike;
  const compName = companion?.name || "Companion";

  let damageDealt = 0;
  let mpCost = action.costMp || 0;
  let hpHealed = 0;
  let incomingDamageMultiplier = 1.0;

  switch (actionType) {
    case "strike":
      damageDealt = Math.round((action.baseDamage || 25) * (0.9 + Math.random() * 0.25));
      break;
    case "burst":
      damageDealt = Math.round((action.baseDamage || 55) * (1.1 + Math.random() * 0.35));
      break;
    case "synergy":
      damageDealt = Math.round((action.baseDamage || 35) * (1.0 + Math.random() * 0.25));
      hpHealed = 25;
      break;
    case "defense":
      damageDealt = Math.round(10 + Math.random() * 5);
      incomingDamageMultiplier = 0.3; // 70% damage reduction
      break;
  }

  const nextEnemyHp = Math.max(0, clashState.enemyHp - damageDealt);
  const isVictory = nextEnemyHp === 0;

  // Enemy counter-attack if still alive
  let enemyDamageTaken = 0;
  if (!isVictory) {
    const baseEnemyDmg = clashState.enemyAttackPower || 16;
    enemyDamageTaken = Math.max(2, Math.round(baseEnemyDmg * incomingDamageMultiplier * (0.85 + Math.random() * 0.3)));
  }

  const isDefeat = (playerStats?.hp ?? 100) - enemyDamageTaken <= 0;

  const nextLog = [
    ...clashState.log,
    `[Turn ${clashState.clashTurn}]: Player deployed ${action.name} dealing ${damageDealt} DMG. ${hpHealed > 0 ? `Healed +${hpHealed} HP.` : ""} ${isVictory ? `VICTORY! ${clashState.enemyName} defeated.` : `${clashState.enemyName} struck back for ${enemyDamageTaken} DMG.`}`,
  ];

  const updatedClashState: ActiveStoryClashState = {
    ...clashState,
    enemyHp: nextEnemyHp,
    clashTurn: clashState.clashTurn + 1,
    status: isVictory ? "victory" : isDefeat ? "retreat" : "ongoing",
    isActive: !isVictory && !isDefeat,
    log: nextLog.slice(-10),
  };

  // Formatted prompt to send to LLM
  const narrativePromptAction = isVictory
    ? `[Combat Victory/Climactic]: Execute the final blow with ${action.name}, shattering ${clashState.enemyName}'s defenses and achieving total tactical victory.`
    : actionType === "synergy"
    ? `[Tactical Synergy/Coordinated]: Coordinate seamlessly with ${compName}, striking in synchronized cadence with ${action.name} while shielding each other from incoming fire.`
    : actionType === "burst"
    ? `[Class Burst/Devastating]: Channel your full ${playerRole} energy into ${action.name}, blasting through ${clashState.enemyName}'s armor with explosive kinetic force.`
    : actionType === "defense"
    ? `[Parry/Defensive]: Raise ${action.name}, absorbing ${clashState.enemyName}'s counter-strike with grounded poise and preparing the counter-offensive.`
    : `[Strike/Tactical]: Lunge forward with ${action.name}, testing ${clashState.enemyName}'s perimeter and creating an opening for the next strike.`;

  return {
    updatedClashState,
    damageDealt,
    mpCost,
    hpHealed,
    enemyDamageTaken,
    isVictory,
    isDefeat,
    narrativePromptAction,
  };
}

