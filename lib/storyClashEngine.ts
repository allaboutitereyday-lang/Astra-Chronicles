/**
 * Integrated Infiltration, Random Encounters & Story Clashes Engine (Pitch C + Universal 6-Stance Matrix)
 * for Astra Chronicles
 * 
 * Seamlessly integrates turn-based tactical combat directly inside the
 * Visual Novel gameplay interface without page redirects. Powers the
 * in-scene Tactical Arsenal Dock, Universal 6-Stance Matrix, dual telemetry,
 * enemy portrait synthesis, and narrative combat choreography.
 */

import { ActiveStoryClashState, QuestDifficulty } from "@/types/system";
import { getClassArsenal, ClassArsenal, ClassTacticalAction } from "./trialsClassArsenals";
import { StoryCompanion, CombatStanceType, AbilityDetail } from "@/types/story";
import { COMBAT_STANCES, getClassStanceConfig } from "./progressionMechanics";
import { generateProceduralMonsterSvg } from "./proceduralArt";
import { generateEnemyIntent } from "./vitalsAndEncounters";

/**
 * Initializes a new in-scene Story Clash / Hostile Encounter.
 */
export function initiateStoryClash(params: {
  enemyName: string;
  enemyHp: number;
  enemyDesc?: string;
  tacticalObjective: string;
  companionAssistingName?: string;
  enemyAttackPower?: number;
  enemyImageUrl?: string;
  enemyVisualPrompt?: string;
  threatRank?: QuestDifficulty;
  enemyArchetype?: string;
  isRandomEncounter?: boolean;
  genre?: string;
}): ActiveStoryClashState {
  const hp = Math.max(30, params.enemyHp);
  const atk = params.enemyAttackPower || 18;
  const rank: QuestDifficulty =
    params.threatRank || (hp >= 130 ? "A" : hp >= 95 ? "B" : "C");
  const archetype = params.enemyArchetype || "Hostile Adversary";
  const desc =
    params.enemyDesc ||
    "A formidable adversary standing between you and the objective.";

  const fallbackSvg =
    params.enemyImageUrl ||
    generateProceduralMonsterSvg({
      name: params.enemyName || "Anomaly Sovereign",
      rank,
      genre: params.genre || "Dark Fantasy LitRPG",
      modifier: archetype,
    });

  return {
    isActive: true,
    enemyName: params.enemyName || "Anomaly Sovereign",
    enemyHp: hp,
    enemyMaxHp: hp,
    enemyDesc: desc,
    enemyAttackPower: atk,
    enemyImageUrl: fallbackSvg,
    enemyVisualPrompt:
      params.enemyVisualPrompt ||
      `Epic anime visual novel boss monster portrait: "${params.enemyName || "Anomaly Sovereign"}". ${desc}. Menacing combat stance, dark glowing runes, volumetric lighting, masterpiece asset.`,
    threatRank: rank,
    enemyArchetype: archetype,
    enemyIntent: generateEnemyIntent(params.enemyName || "Anomaly Sovereign", atk, 1, rank),
    isRandomEncounter: params.isRandomEncounter ?? true,
    clashTurn: 1,
    maxClashTurns: 6,
    tacticalObjective:
      params.tacticalObjective || "Neutralize the threat before causal collapse.",
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
  companion?: { name: string; role?: string } | StoryCompanion | null,
  currentMp: number = 60,
  activeStance: CombatStanceType = "neutral",
  playerAbilities?: string[],
  abilityDetails?: Record<string, AbilityDetail>
): FormattedClashChoice[] {
  const arsenal: ClassArsenal = getClassArsenal(playerRole);
  const compName = companion?.name || "Companion";
  const stanceCatalog = getClassStanceConfig(playerRole);
  const activeStanceInfo = stanceCatalog[activeStance] || stanceCatalog.neutral;

  let strikeAction = arsenal.actions.strike;
  let burstAction = arsenal.actions.burst;
  let synergyAction = arsenal.actions.synergy;
  let defenseAction = arsenal.actions.defense;

  // Contextual companion synergy branding
  let synergyActionName = synergyAction.name;
  if (compName.toLowerCase().includes("perci")) {
    synergyActionName = "Perci's Foxfire Crossfire";
  } else if (compName.toLowerCase().includes("morgana")) {
    synergyActionName = "Morgana's Abyssal Entanglement";
  } else if (compName.toLowerCase().includes("evelyn")) {
    synergyActionName = "Evelyn's Celestial Aegis Burst";
  } else if (compName.toLowerCase().includes("aria")) {
    synergyActionName = "Aria's Runic Singularity";
  } else if (compName.toLowerCase().includes("serena")) {
    synergyActionName = "Serena's Crimson Edge Flurry";
  } else if (compName.toLowerCase().includes("lyra")) {
    synergyActionName = "Lyra's Cryo-Stasis Pin";
  } else if (compName && compName !== "Companion") {
    synergyActionName = `${compName}'s Tactical Resonance`;
  }

  // Prioritize player's unlocked abilities if available in character sheet
  if (abilityDetails && Object.keys(abilityDetails).length > 0) {
    const details = Object.values(abilityDetails);
    const customBurst = details.find(
      (a) => a.type === "Ultimate" || a.type === "Burst" || (a.cost && a.cost.includes("MP") && parseInt(a.cost) >= 15)
    );
    const customStrike = details.find(
      (a) => (a.type === "Active" || a.type === "Basic" || a.type === "Strike") && a.name !== customBurst?.name
    );
    const customDefense = details.find(
      (a) => (a.type === "Stance" || a.type === "Defensive" || a.type === "Passive") && a.name !== customBurst?.name && a.name !== customStrike?.name
    );

    if (customStrike) {
      strikeAction = {
        ...strikeAction,
        name: customStrike.name,
        description: customStrike.description || strikeAction.description,
      };
    }
    if (customBurst) {
      const parsedCost = customBurst.cost ? parseInt(customBurst.cost) || burstAction.costMp : burstAction.costMp;
      burstAction = {
        ...burstAction,
        name: customBurst.name,
        description: customBurst.description || burstAction.description,
        costMp: parsedCost,
      };
    }
    if (customDefense) {
      defenseAction = {
        ...defenseAction,
        name: customDefense.name,
        description: customDefense.description || defenseAction.description,
      };
    }
  }

  return [
    // 1. Strike (Infused with Active Stance)
    {
      actionType: "strike",
      actionName: `${strikeAction.name} (${activeStanceInfo.label})`,
      label: `[Strike/${activeStanceInfo.label}]: Execute ${strikeAction.name} in ${activeStanceInfo.label} (${activeStanceInfo.bonusHint}, 0 MP).`,
      mpCost: 0,
      description: `${strikeAction.description} • Active Stance: ${activeStanceInfo.bonusText}`,
      disabled: false,
      stanceTag: activeStanceInfo.label,
    },
    // 2. Class Signature Burst
    {
      actionType: "burst",
      actionName: burstAction.name,
      label: `[Class Burst/${activeStanceInfo.label}]: Unleash ${burstAction.name} amplified by ${activeStanceInfo.label} (-${burstAction.costMp} MP).`,
      mpCost: burstAction.costMp,
      description: `${burstAction.description} • Amplified by ${activeStanceInfo.label}`,
      disabled: currentMp < burstAction.costMp,
      reasonDisabled: currentMp < burstAction.costMp ? `Insufficient MP (${currentMp}/${burstAction.costMp})` : undefined,
      stanceTag: activeStanceInfo.label,
    },
    // 3. Companion Tactical Synergy
    {
      actionType: "synergy",
      actionName: synergyActionName,
      label: `[Tactical Synergy/Coordinated]: Coordinate with ${compName} for a synchronized combo (-${synergyAction.costMp} MP, heals 25 HP).`,
      mpCost: synergyAction.costMp,
      description: `Synchronizes strikes with ${compName}, staggering the target and restoring party health.`,
      disabled: currentMp < synergyAction.costMp,
      reasonDisabled: currentMp < synergyAction.costMp ? `Insufficient MP (${currentMp}/${synergyAction.costMp})` : undefined,
      stanceTag: "Co-Op Resonance",
    },
    // 4. Defensive Stance / Parry
    {
      actionType: "defense",
      actionName: defenseAction.name,
      label: `[Parry/Defensive]: Adopt ${defenseAction.name} to absorb incoming blows (-70% incoming DMG, +15 MP).`,
      mpCost: 0,
      description: defenseAction.description,
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
  isRetreat: boolean;
  isCrit: boolean;
  isStaggered: boolean;
  isEvaded: boolean;
  activeStance: CombatStanceType;
  narrativePromptAction: string;
}

/**
 * Resolves a single tactical turn in an active Story Clash, applying the full
 * Universal 6-Stance Matrix mechanics (Crit, Stagger, Evasion, Burn, Lethality Reduction)
 * as well as tactical disengagement ("flee").
 */
export function resolveClashTurn(
  clashState: ActiveStoryClashState,
  actionType: "strike" | "burst" | "synergy" | "defense" | "flee",
  playerRole: string = "Voidstrider",
  companion?: { name: string } | StoryCompanion | null,
  playerStats?: { hp: number; maxHp: number; mp: number; maxMp: number },
  activeStance: CombatStanceType = "neutral"
): ClashTurnResolution {
  const arsenal: ClassArsenal = getClassArsenal(playerRole);
  const compName = companion?.name || "Companion";
  const stanceCfg = COMBAT_STANCES[activeStance] || COMBAT_STANCES.neutral;
  const stanceCatalog = getClassStanceConfig(playerRole);
  const activeStanceInfo = stanceCatalog[activeStance] || { label: stanceCfg.name, bonusText: stanceCfg.modifierLabel };

  // Handle Tactical Disengagement / Flee
  if (actionType === "flee") {
    const canSpendMp = (playerStats?.mp ?? 0) >= 10;
    const mpCost = canSpendMp ? 10 : 0;
    const partingGraze = canSpendMp || activeStance === "phase" ? 0 : 6;
    const updatedClashState: ActiveStoryClashState = {
      ...clashState,
      status: "retreat",
      isActive: false,
      log: [
        ...clashState.log,
        `[Turn ${clashState.clashTurn}] [Tactical Disengage]: Broke combat engagement against ${clashState.enemyName}${partingGraze > 0 ? ` (took ${partingGraze} grazing DMG)` : " cleanly"}.`,
      ].slice(-10),
    };

    return {
      updatedClashState,
      damageDealt: 0,
      mpCost,
      hpHealed: 0,
      enemyDamageTaken: partingGraze,
      isVictory: false,
      isDefeat: false,
      isRetreat: true,
      isCrit: false,
      isStaggered: false,
      isEvaded: partingGraze === 0,
      activeStance,
      narrativePromptAction: `[Subterfuge/Disengage]: Deploy a burst of ${stanceCfg.name} footwork alongside ${compName} to break engagement and tactical distance from ${clashState.enemyName}, retreating to cover.`,
    };
  }

  const action: ClassTacticalAction = arsenal.actions[actionType] || arsenal.actions.strike;

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

  // 4. Enemy Counter-Attack Resolution (respecting telegraphed enemyIntent, Phase Evasion, Frost Ward & Stagger Stun)
  let enemyDamageTaken = 0;
  let isEvaded = false;

  if (!isVictory) {
    if (isStaggered) {
      enemyDamageTaken = 0;
    } else if (activeStance === "phase" && Math.random() < 0.35) {
      isEvaded = true;
      enemyDamageTaken = 0;
    } else {
      const telegraphedDmg =
        clashState.enemyIntent?.estimatedDamage || clashState.enemyAttackPower || 16;
      const frostReduction = activeStance === "frost" ? 0.6 : 1.0; // -40% DMG Taken in Cryo-Ward
      enemyDamageTaken = Math.max(
        2,
        Math.round(telegraphedDmg * incomingDamageMultiplier * frostReduction * (0.9 + Math.random() * 0.2))
      );
    }
  }

  const isDefeat = (playerStats?.hp ?? 100) + hpHealed - enemyDamageTaken <= 0;

  const tagBadges = [
    `[${activeStanceInfo.label}]`,
    isCrit ? "[CRIT!]" : "",
    isStaggered ? "[STAGGER!]" : "",
    isEvaded ? "[EVADED!]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const nextTurnNumber = clashState.clashTurn + 1;
  const nextIntent = !isVictory
    ? generateEnemyIntent(
        clashState.enemyName,
        clashState.enemyAttackPower || 16,
        nextTurnNumber,
        clashState.threatRank || "C"
      )
    : undefined;

  const nextLog = [
    ...clashState.log,
    `[Turn ${clashState.clashTurn}] ${tagBadges}: Deployed ${action.name} dealing ${damageDealt} DMG.${hpHealed > 0 ? ` Healed +${hpHealed} HP.` : ""} ${
      isVictory
        ? `VICTORY! ${clashState.enemyName} neutralized.`
        : isStaggered
        ? `${clashState.enemyName} was STAGGERED and could not counter-attack!`
        : isEvaded
        ? `Phased through ${clashState.enemyName}'s ${clashState.enemyIntent?.label || "counter-attack"} (0 DMG)!`
        : `${clashState.enemyName} executed ${clashState.enemyIntent?.label || "Counter-Strike"} for ${enemyDamageTaken} DMG.`
    }`,
  ];

  const updatedClashState: ActiveStoryClashState = {
    ...clashState,
    enemyHp: nextEnemyHp,
    clashTurn: nextTurnNumber,
    enemyIntent: nextIntent,
    status: isVictory ? "victory" : isDefeat ? "retreat" : "ongoing",
    isActive: !isVictory && !isDefeat,
    log: nextLog.slice(-10),
  };

  // Formatted prompt to send to LLM with Stance & Tactical Tags
  const stanceProseNote = `in ${activeStanceInfo.label} stance (${activeStanceInfo.bonusText}${isCrit ? ", landing a devastating critical strike" : ""}${isStaggered ? ", shattering enemy poise into a stagger" : ""}${isEvaded ? ", and phasing cleanly through the counter-attack" : ""})`;

  const narrativePromptAction = isVictory
    ? `[Combat Victory/${activeStanceInfo.label}]: Execute the finishing blow with ${action.name} ${stanceProseNote}, shattering ${clashState.enemyName}'s defenses and achieving total tactical victory.`
    : actionType === "synergy"
    ? `[Tactical Synergy/${activeStanceInfo.label}]: Coordinate seamlessly with ${compName}, striking in synchronized cadence with ${action.name} ${stanceProseNote} while shielding each other from incoming fire.`
    : actionType === "burst"
    ? `[Class Burst/${activeStanceInfo.label}]: Channel your full ${playerRole} energy into ${action.name} ${stanceProseNote}, blasting through ${clashState.enemyName}'s armor with explosive force.`
    : actionType === "defense"
    ? `[Parry/${activeStanceInfo.label}]: Raise ${action.name} in ${activeStanceInfo.label}, absorbing ${clashState.enemyName}'s counter-strike with grounded poise and preparing the counter-offensive.`
    : `[Strike/${activeStanceInfo.label}]: Lunge forward with ${action.name} ${stanceProseNote}, pressuring ${clashState.enemyName}'s perimeter and creating a lethal opening.`;

  return {
    updatedClashState,
    damageDealt,
    mpCost,
    hpHealed,
    enemyDamageTaken,
    isVictory,
    isDefeat,
    isRetreat: false,
    isCrit,
    isStaggered,
    isEvaded,
    activeStance,
    narrativePromptAction,
  };
}
