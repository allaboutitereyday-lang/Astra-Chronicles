/**
 * Integrated Infiltration & Story Clashes Engine (Pitch C + Universal 6-Stance Matrix)
 * for Astra Chronicles
 * 
 * Seamlessly integrates turn-based tactical combat directly inside the
 * Visual Novel gameplay interface without page redirects. Powers the
 * in-scene Tactical Arsenal Dock, Universal 6-Stance Matrix, dual telemetry,
 * and narrative combat choreography.
 */

import { ActiveStoryClashState } from "@/types/system";
import { getClassArsenal, ClassArsenal, ClassTacticalAction } from "./trialsClassArsenals";
import { StoryCompanion, CombatStanceType } from "@/types/story";
import { COMBAT_STANCES } from "./progressionMechanics";

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
  stanceTag?: string;
}

/**
 * Formats the 4 player Class Arsenal choices for the active Story Clash,
 * dynamically infused with the active Universal Stance and strictly conforming to [Tone/Action]: Short summary.
 */
export function getStoryClashChoices(
  playerRole: string = "Voidstrider",
  companion?: { name: string } | StoryCompanion | null,
  currentMp: number = 60,
  activeStance: CombatStanceType = "neutral"
): FormattedClashChoice[] {
  const arsenal: ClassArsenal = getClassArsenal(playerRole);
  const compName = companion?.name || "Companion";
  const stanceCfg = COMBAT_STANCES[activeStance] || COMBAT_STANCES.neutral;

  const actions = arsenal.actions;

  const stanceFlavorMap: Record<CombatStanceType, { tag: string; bonusHint: string }> = {
    neutral: { tag: "Balanced Flow", bonusHint: "Standard damage, +5 MP" },
    flame: { tag: "Flame Infusion", bonusHint: "+25% Burn & Direct DMG" },
    frost: { tag: "Frost Infusion", bonusHint: "+35% Stagger, -15% Enemy DMG" },
    phase: { tag: "Phase Shift", bonusHint: "+20% Evasion, Armor Bypass" },
    shadow: { tag: "Shadowstalker", bonusHint: "+30% Critical Hit Rate" },
    graviton: { tag: "Graviton Collapse", bonusHint: "+40% Stagger Poise Break" },
  };

  const stanceMeta = stanceFlavorMap[activeStance] || stanceFlavorMap.neutral;

  return [
    // 1. Strike (Infused with Active Stance)
    {
      actionType: "strike",
      actionName: `${actions.strike.name} (${stanceMeta.tag})`,
      label: `[Strike/${stanceMeta.tag}]: Execute ${actions.strike.name} in ${stanceCfg.name} (${stanceMeta.bonusHint}, 0 MP).`,
      mpCost: 0,
      description: `${actions.strike.description} • Active Stance: ${stanceCfg.modifierLabel}`,
      disabled: false,
      stanceTag: stanceMeta.tag,
    },
    // 2. Class Signature Burst
    {
      actionType: "burst",
      actionName: actions.burst.name,
      label: `[Class Burst/${stanceMeta.tag}]: Unleash ${actions.burst.name} amplified by ${stanceCfg.name} (-${actions.burst.costMp} MP).`,
      mpCost: actions.burst.costMp,
      description: `${actions.burst.description} • Amplified by ${stanceCfg.name}`,
      disabled: currentMp < actions.burst.costMp,
      reasonDisabled: currentMp < actions.burst.costMp ? `Insufficient MP (${currentMp}/${actions.burst.costMp})` : undefined,
      stanceTag: stanceMeta.tag,
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
      stanceTag: "Co-Op Resonance",
    },
    // 4. Defensive Stance / Parry
    {
      actionType: "defense",
      actionName: actions.defense.name,
      label: `[Parry/Defensive]: Adopt ${actions.defense.name} to absorb incoming blows (-70% incoming DMG, +15 MP).`,
      mpCost: 0,
      description: actions.defense.description,
      disabled: false,
      stanceTag: "Guard",
    },
  ];
}

export interface ClashTurnResolution {
  updatedClashState: ActiveStoryClashState;
  damageDealt: number;
  mpCost: number;
  hpHealed: number;
  enemyDamageTaken: number;
  isVictory: boolean;
  isDefeat: boolean;
  isCrit: boolean;
  isStaggered: boolean;
  isEvaded: boolean;
  activeStance: CombatStanceType;
  narrativePromptAction: string;
}

/**
 * Resolves a single tactical turn in an active Story Clash, applying the full
 * Universal 6-Stance Matrix mechanics (Crit, Stagger, Evasion, Burn, Lethality Reduction).
 */
export function resolveClashTurn(
  clashState: ActiveStoryClashState,
  actionType: "strike" | "burst" | "synergy" | "defense",
  playerRole: string = "Voidstrider",
  companion?: { name: string } | StoryCompanion | null,
  playerStats?: { hp: number; maxHp: number; mp: number; maxMp: number },
  activeStance: CombatStanceType = "neutral"
): ClashTurnResolution {
  const arsenal: ClassArsenal = getClassArsenal(playerRole);
  const action: ClassTacticalAction = arsenal.actions[actionType] || arsenal.actions.strike;
  const compName = companion?.name || "Companion";
  const stanceCfg = COMBAT_STANCES[activeStance] || COMBAT_STANCES.neutral;

  let damageDealt = 0;
  const mpCost = action.costMp || 0;
  let hpHealed = 0;
  let incomingDamageMultiplier = 1.0;

  switch (actionType) {
    case "strike":
      damageDealt = Math.round((action.baseDamage || 25) * (0.95 + Math.random() * 0.25));
      break;
    case "burst":
      damageDealt = Math.round((action.baseDamage || 55) * (1.1 + Math.random() * 0.35));
      break;
    case "synergy":
      damageDealt = Math.round((action.baseDamage || 38) * (1.05 + Math.random() * 0.25));
      hpHealed = 25;
      break;
    case "defense":
      damageDealt = Math.round(12 + Math.random() * 6);
      incomingDamageMultiplier = 0.3; // 70% damage reduction
      break;
  }

  // 1. Apply Universal Stance Damage Multipliers
  let stanceDmgMult = stanceCfg.damageMultiplier || 1.0;
  if (activeStance === "flame") {
    stanceDmgMult = 1.25; // +25% Burn & Direct DMG
  } else if (activeStance === "phase") {
    stanceDmgMult = 1.15; // Armor Penetration
  }
  damageDealt = Math.round(damageDealt * stanceDmgMult);

  // 2. Critical Strike Check (Shadowstalker grants +30% Crit Rate)
  let isCrit = false;
  if (damageDealt > 0 && actionType !== "defense") {
    const baseCritRate = 0.12;
    const stanceCritBonus = activeStance === "shadow" ? 0.30 : 0;
    if (Math.random() < baseCritRate + stanceCritBonus) {
      isCrit = true;
      damageDealt = Math.round(damageDealt * 1.5);
    }
  }

  // 3. Stagger / Poise Break Check (Graviton +40%, Frost +35%)
  let isStaggered = false;
  if (damageDealt > 0 && actionType !== "defense") {
    const baseStaggerChance = actionType === "burst" || actionType === "synergy" ? 0.18 : 0.08;
    const stanceStaggerBonus =
      activeStance === "graviton" ? 0.40 : activeStance === "frost" ? 0.35 : (stanceCfg.bonusStaggerRate || 0);
    if (Math.random() < Math.min(0.65, baseStaggerChance + stanceStaggerBonus)) {
      isStaggered = true;
    }
  }

  const nextEnemyHp = Math.max(0, clashState.enemyHp - damageDealt);
  const isVictory = nextEnemyHp === 0;

  // 4. Enemy Counter-Attack Resolution (with Phase Evasion, Frost Lethality Reduction & Stagger Stun)
  let enemyDamageTaken = 0;
  let isEvaded = false;

  if (!isVictory) {
    if (isStaggered) {
      enemyDamageTaken = 0;
    } else if (activeStance === "phase" && Math.random() < 0.22) {
      isEvaded = true;
      enemyDamageTaken = 0;
    } else {
      const baseEnemyDmg = clashState.enemyAttackPower || 16;
      const frostReduction = activeStance === "frost" ? 0.85 : 1.0;
      enemyDamageTaken = Math.max(
        2,
        Math.round(baseEnemyDmg * incomingDamageMultiplier * frostReduction * (0.85 + Math.random() * 0.3))
      );
    }
  }

  const isDefeat = (playerStats?.hp ?? 100) + hpHealed - enemyDamageTaken <= 0;

  const tagBadges = [
    `[${stanceCfg.name}]`,
    isCrit ? "[CRIT!]" : "",
    isStaggered ? "[STAGGER!]" : "",
    isEvaded ? "[EVADED!]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const nextLog = [
    ...clashState.log,
    `[Turn ${clashState.clashTurn}] ${tagBadges}: Deployed ${action.name} dealing ${damageDealt} DMG.${hpHealed > 0 ? ` Healed +${hpHealed} HP.` : ""} ${
      isVictory
        ? `VICTORY! ${clashState.enemyName} neutralized.`
        : isStaggered
        ? `${clashState.enemyName} was STAGGERED and could not counter-attack!`
        : isEvaded
        ? `Phased through ${clashState.enemyName}'s counter-attack (0 DMG)!`
        : `${clashState.enemyName} struck back for ${enemyDamageTaken} DMG.`
    }`,
  ];

  const updatedClashState: ActiveStoryClashState = {
    ...clashState,
    enemyHp: nextEnemyHp,
    clashTurn: clashState.clashTurn + 1,
    status: isVictory ? "victory" : isDefeat ? "retreat" : "ongoing",
    isActive: !isVictory && !isDefeat,
    log: nextLog.slice(-10),
  };

  // Formatted prompt to send to LLM with Stance & Tactical Tags
  const stanceProseNote = `using ${stanceCfg.name} (${stanceCfg.element} affinity${isCrit ? ", landing a devastating critical strike" : ""}${isStaggered ? ", shattering enemy poise into a stagger" : ""}${isEvaded ? ", and phasing cleanly through the counter-attack" : ""})`;

  const narrativePromptAction = isVictory
    ? `[Combat Victory/${stanceCfg.name}]: Execute the finishing blow with ${action.name} ${stanceProseNote}, shattering ${clashState.enemyName}'s defenses and achieving total tactical victory.`
    : actionType === "synergy"
    ? `[Tactical Synergy/${stanceCfg.name}]: Coordinate seamlessly with ${compName}, striking in synchronized cadence with ${action.name} ${stanceProseNote} while shielding each other from incoming fire.`
    : actionType === "burst"
    ? `[Class Burst/${stanceCfg.name}]: Channel your full ${playerRole} energy into ${action.name} ${stanceProseNote}, blasting through ${clashState.enemyName}'s armor with explosive force.`
    : actionType === "defense"
    ? `[Parry/${stanceCfg.name}]: Raise ${action.name} in ${stanceCfg.name}, absorbing ${clashState.enemyName}'s counter-strike with grounded poise and preparing the counter-offensive.`
    : `[Strike/${stanceCfg.name}]: Lunge forward with ${action.name} ${stanceProseNote}, pressuring ${clashState.enemyName}'s perimeter and creating a lethal opening.`;

  return {
    updatedClashState,
    damageDealt,
    mpCost,
    hpHealed,
    enemyDamageTaken,
    isVictory,
    isDefeat,
    isCrit,
    isStaggered,
    isEvaded,
    activeStance,
    narrativePromptAction,
  };
}
