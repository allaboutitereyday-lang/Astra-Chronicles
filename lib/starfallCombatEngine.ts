/**
 * Starfall Labyrinth — Turn-Based, Text-Driven Tactical Combat Engine
 * Exclusive to `starfall-labyrinth`.
 *
 * Features:
 * 1. Hidden Tabletop `1d20` Dice Checks (Attack/Skill, Tactical Stunt, Seal Loophole, Evasion/Parry, Ally Rescue)
 * 2. Frontline (2) & Rearguard Reserve (2) Party Hot-Swapping:
 *    - Defensive `INTERCEPT_SWAP` (-40% incoming damage + immediate Tag-Assist skill)
 *    - Offensive `CHAIN_SWAP` (burst Tag-Assist combo on Poise-Broken or staggered targets)
 *    - Rearguard MP/stamina recovery (+8% Max MP & +4% Max HP per turn)
 * 3. Enemy Poise / Break Gauge, Elemental/Tactical Weaknesses & Telegraph Interruption
 * 4. Unique Heroine Dyad Mechanics & Conditions:
 *    - Godiva / Abraxia / Sable `Hex Seal` stacking & detonation
 *    - Trinity Valoren's `Seeing Double` phantom dodge echoes
 *    - Dame Odette's `Wall of Aesthul` & Lotte's `Sweet Dream` barrier pool
 *    - Aurelle armor pierce, Vaelkor core stagger, Lyra assist amp, Garrick AoE ward, Roland riposte
 * 5. Persistent Floor HP, Status Conditions, Cooldowns & Fair Two-Stage Permadeath (`DEPLOYED -> WOUNDED -> FALLEN`)
 */

import {
  ActiveCombatCondition,
  DiceCheckOutcome,
  HeroRosterEntry,
  HeroSkillMove,
  LabyrinthState,
  StarfallCombatState,
  StarfallConditionType,
  StarfallDiceRollRecord,
  StarfallMasterSealOrder,
  StarRank,
} from "@/types/starfall_labyrinth";
import {
  EnemyIntentTemplate,
  generateScaledFloorEnemy,
  getTowerThemeForFloor,
  matchCuratedEnemyFromProse,
  TacticalWeaknessTag,
  TowerEnemyTemplate,
} from "@/lib/starfallTowerThemes";
import {
  getFloorType,
  getHeroineDossier,
  hydrateRosterEntryStats,
  matchesHeroineName,
  normalizeSquadFormations,
  resolveHeroCasualty,
  seededRandomFloat,
} from "@/lib/starfallEngine";

export type StarfallCombatActionType =
  | "BASIC_ATTACK"
  | "ROLE_SKILL"
  | "HEROINE_SKILL"
  | "INTERCEPT_SWAP"
  | "CHAIN_SWAP"
  | "BOND_SPECIAL"
  | "TERRAIN_STUNT"
  | "SEAL_COMPLY"
  | "SEAL_LOOPHOLE"
  | "SEAL_DEFY"
  | "CUSTOM_STUNT"
  | "RETREAT_TO_LOBBY";

export interface ParsedStarfallCombatCommand {
  actionType: StarfallCombatActionType;
  actorHeroineName?: string;
  swapInHeroineName?: string;
  swapOutHeroineName?: string;
  terrainTagUsed?: string;
  rawPlayerText: string;
}

export interface StarfallCombatResolutionResult {
  nextLabyrinthState: LabyrinthState;
  encounter: StarfallCombatState;
  protagonistHpDelta: number;
  protagonistMpDelta: number;
  expAwarded: number;
  shardsAwarded: number;
  trustDelta: number;
  newlyWoundedHeroines: string[];
  newlyFallenHeroines: { name: string; cause: string }[];
  diceRolls: StarfallDiceRollRecord[];
  combatTelemetryBlock: string;
}

/**
 * Rolls a deterministic/seeded 1d20 tabletop check and classifies outcome vs Difficulty Class (DC).
 */
export function rollHiddenD20Check(params: {
  seed: string;
  actorName: string;
  checkLabel: string;
  statModifier: number;
  difficultyClass: number;
}): StarfallDiceRollRecord {
  const r = seededRandomFloat(params.seed);
  const naturalD20 = Math.max(1, Math.min(20, Math.floor(r * 20) + 1));
  const totalRoll = naturalD20 + Math.round(params.statModifier);
  const dc = Math.max(6, Math.round(params.difficultyClass));

  let outcome: DiceCheckOutcome;
  if (naturalD20 === 20 || totalRoll >= dc + 6) {
    outcome = "CRITICAL_BREACH";
  } else if (naturalD20 !== 1 && totalRoll >= dc) {
    outcome = "CLEAN_HIT";
  } else if (naturalD20 !== 1 && totalRoll >= dc - 4) {
    outcome = "GRAZE";
  } else {
    outcome = "DEFLECTED";
  }

  const modSign = params.statModifier >= 0 ? `+${Math.round(params.statModifier)}` : `${Math.round(params.statModifier)}`;
  const summaryText = `${params.actorName} [${params.checkLabel}]: 1d20(${naturalD20}) ${modSign} = ${totalRoll} vs DC ${dc} -> ${outcome.replace(/_/g, " ")}`;

  return {
    actorName: params.actorName,
    checkLabel: params.checkLabel,
    naturalD20,
    statModifier: Math.round(params.statModifier),
    totalRoll,
    difficultyClass: dc,
    outcome,
    summaryText,
  };
}

function buildMasterSealForEncounter(
  floor: number,
  isBoss: boolean,
  masterTrust: number,
  enemyName: string,
  seed: string
): StarfallMasterSealOrder | null {
  // Unseen Master issues intrusive Command Seals when trust is low (<45%) or on Gate Boss floors
  const shouldTrigger =
    isBoss ||
    (masterTrust < 45 && seededRandomFloat(`${seed}:seal:${floor}`) < 0.55);

  if (!shouldTrigger) return null;

  if (isBoss) {
    return {
      id: `seal_boss_f${floor}`,
      commandText: `[COMMAND SEAL // AUTO-RUSH]: "Ignore defense! Burn everything to strike ${enemyName}'s core this turn—acceptable casualty threshold: 50%!"`,
      complianceHint: "Comply blindly (+6% Master Trust, +35% Party ATK, -35% Party DEF this turn).",
      loopholeHint: "Tactical Loophole (INT/Tactician Check: strike the core's exposed conduit via terrain or decoy to satisfy the seal safely).",
      trustGainOnComply: 6,
      trustLossOnDefy: -8,
      resolved: false,
    };
  }

  return {
    id: `seal_rush_f${floor}`,
    commandText: `[COMMAND SEAL // SPEED-CLEAR]: "Stop stalling behind shields! Push your lowest-star unit forward as bait to draw ${enemyName}'s swing!"`,
    complianceHint: "Comply (+4% Master Trust, frontline takes +30% aggro damage).",
    loopholeHint: "Tactical Loophole (Use a Phantom Echo, Shield Wall, or Intercept Swap so the bait strike hits stone instead of flesh).",
    trustGainOnComply: 4,
    trustLossOnDefy: -6,
    resolved: false,
  };
}

/**
 * Starts a fresh turn-based floor combat encounter when entering a COMBAT or GATE_BOSS floor.
 */
export function startFloorCombatEncounter(
  state: LabyrinthState,
  floor: number,
  seed?: string,
  forceStart: boolean = false,
  options?: {
    preferredEnemyTemplate?: TowerEnemyTemplate | null;
    initialEngagementPhase?: "vicinity" | "engaged";
  }
): LabyrinthState {
  const clampedFloor = Math.max(0, Math.min(100, Math.floor(floor || 0)));
  if (clampedFloor <= 0) {
    return { ...state, activeEncounter: null };
  }

  const floorType = getFloorType(clampedFloor);
  if (!forceStart && floorType !== "COMBAT" && floorType !== "GATE_BOSS") {
    return { ...state, activeEncounter: null };
  }

  const effectiveSeed = seed || `${state.summonSeed || "starfall"}:f${clampedFloor}`;
  const normalizedRoster = normalizeSquadFormations(state.roster || []);
  const activeSquad = normalizedRoster.filter(
    (r) => r.status === "DEPLOYED" || r.status === "WOUNDED"
  );

  const frontlineHeroines = activeSquad
    .filter((r) => (r.formationSlot || "FRONTLINE") === "FRONTLINE")
    .slice(0, 2)
    .map((r) => r.heroineName);

  const reserveHeroines = activeSquad
    .filter((r) => r.formationSlot === "RESERVE")
    .slice(0, 2)
    .map((r) => r.heroineName);

  const generated = generateScaledFloorEnemy(
    clampedFloor,
    effectiveSeed,
    options?.preferredEnemyTemplate
  );
  const firstIntent: EnemyIntentTemplate =
    generated.enemy.intents[0] || {
      id: "default_cleave",
      label: "Labyrinth Cleave",
      telegraphText: `${generated.enemy.name} raises its weapon for a heavy frontline strike.`,
      targetMode: "SINGLE_FRONTLINE",
      damageMultiplier: 1.0,
    };

  const masterSealOrder = buildMasterSealForEncounter(
    clampedFloor,
    Boolean(generated.enemy.isBoss),
    state.masterTrust ?? 35,
    generated.enemy.name,
    effectiveSeed
  );

  const engagementPhase: "vicinity" | "engaged" =
    options?.initialEngagementPhase ?? (generated.enemy.isBoss ? "engaged" : "vicinity");

  const encounter: StarfallCombatState = {
    isActive: true,
    encounterId: `enc_f${clampedFloor}_${Math.abs(effectiveSeed.length * 37 + clampedFloor)}`,
    floor: clampedFloor,
    turnNumber: 1,
    status: "ongoing",
    engagementPhase,
    enemyTier: generated.enemyTier,
    themeId: generated.theme.id,
    themeName: generated.theme.name,
    environmentalLawName: generated.theme.environmentalLawName,
    environmentalLawEffect: generated.theme.environmentalLawEffect,
    layoutId: generated.layout.id,
    layoutName: generated.layout.name,
    layoutGeometry: generated.layout.geometrySummary,
    layoutTacticalHint: generated.layout.tacticalHint,
    terrainTags: [...generated.layout.terrainTags],
    enemyId: generated.enemy.id,
    enemyName: generated.enemy.name,
    enemyTitle: generated.enemy.title,
    isBoss: Boolean(generated.enemy.isBoss),
    isThresholdGuardian: Boolean(generated.enemy.isThresholdGuardian || generated.isThresholdFloor),
    enemyHp: generated.scaledStats.maxHp,
    enemyMaxHp: generated.scaledStats.maxHp,
    enemyAtk: generated.scaledStats.atk,
    enemyDef: generated.scaledStats.def,
    enemySpd: generated.scaledStats.spd,
    enemyPoise: generated.scaledStats.maxPoise,
    enemyMaxPoise: generated.scaledStats.maxPoise,
    isEnemyBroken: false,
    brokenTurnsRemaining: 0,
    enemyWeaknesses: [...generated.enemy.weaknesses],
    enemyResistances: [...(generated.enemy.resistances || [])],
    activeConditions: [],
    hexSealsOnEnemy: 0,
    phantomEchoesActive: 0,
    activeShieldPool: 0,
    currentTelegraph: firstIntent,
    masterSealOrder,
    frontlineHeroines,
    reserveHeroines,
    lastDiceRolls: [],
    combatTelemetrySummary:
      engagementPhase === "vicinity"
        ? `Floor ${clampedFloor} Hostile Detected in Vicinity (${generated.layout.name}, ${generated.theme.name}): ${generated.enemy.name} (${generated.enemy.title}). Ready to ambush, scout, or Begin Encounter.`
        : `Floor ${clampedFloor} Tactical Encounter engaged in ${generated.layout.name} (${generated.theme.name}) against ${generated.enemy.name} (${generated.enemy.title}). Telegraph: ${firstIntent.telegraphText}`,
    combatLog: [
      `[FLOOR ${clampedFloor} — ${generated.theme.name.toUpperCase()}] Entered ${generated.layout.name}. ${
        engagementPhase === "vicinity" ? "Hostile sensed in vicinity" : "Hostile engaged"
      }: ${generated.enemy.name} [${generated.enemyTier}] (HP ${generated.scaledStats.maxHp}, Poise ${generated.scaledStats.maxPoise}).`,
    ],
  };

  return {
    ...state,
    currentFloor: clampedFloor,
    roster: normalizedRoster,
    activeEncounter: encounter,
  };
}

/**
 * If an encounter is in vicinity/Turn-1 state and the narrative prose explicitly names another curated
 * monster from the stratum bestiary (e.g., "Verdant Stalker"), synchronize the encounter template cleanly.
 */
export function syncEncounterWithProseIfVicinity(
  state: LabyrinthState,
  proseText: string | null | undefined
): LabyrinthState {
  const enc = state.activeEncounter;
  if (!enc || !enc.isActive || enc.status !== "ongoing" || enc.isBoss) {
    return state;
  }
  if (enc.engagementPhase !== "vicinity" && enc.turnNumber > 1) {
    return state;
  }
  const cleanProse = typeof proseText === "string" ? proseText : "";
  if (!cleanProse.trim()) return state;

  // Already consistent with prose
  if (cleanProse.toLowerCase().includes(enc.enemyName.toLowerCase())) {
    return state;
  }

  const matched = matchCuratedEnemyFromProse(enc.floor, cleanProse);
  if (!matched || matched.id === enc.enemyId || matched.isBoss) {
    return state;
  }

  const regenerated = generateScaledFloorEnemy(enc.floor, enc.encounterId, matched);
  const firstIntent =
    regenerated.enemy.intents[0] || enc.currentTelegraph;

  return {
    ...state,
    activeEncounter: {
      ...enc,
      enemyId: regenerated.enemy.id,
      enemyName: regenerated.enemy.name,
      enemyTitle: regenerated.enemy.title,
      enemyTier: regenerated.enemyTier,
      enemyHp: regenerated.scaledStats.maxHp,
      enemyMaxHp: regenerated.scaledStats.maxHp,
      enemyAtk: regenerated.scaledStats.atk,
      enemyDef: regenerated.scaledStats.def,
      enemySpd: regenerated.scaledStats.spd,
      enemyPoise: regenerated.scaledStats.maxPoise,
      enemyMaxPoise: regenerated.scaledStats.maxPoise,
      isEnemyBroken: false,
      brokenTurnsRemaining: 0,
      enemyWeaknesses: [...regenerated.enemy.weaknesses],
      enemyResistances: [...(regenerated.enemy.resistances || [])],
      currentTelegraph: firstIntent,
      combatTelemetrySummary: `Floor ${enc.floor} Hostile Sensed in Vicinity (${enc.layoutName}): ${regenerated.enemy.name} (${regenerated.enemy.title}).`,
      combatLog: [
        ...enc.combatLog.slice(-6),
        `[BESTIARY SYNC] Visual confirmation in ${enc.layoutName}: ${regenerated.enemy.name} [${regenerated.enemyTier}] (HP ${regenerated.scaledStats.maxHp}, Poise ${regenerated.scaledStats.maxPoise}).`,
      ],
    },
  };
}

/**
 * Determines whether a player's RP text or choice vector initiates/continues direct combat
 * vs pure scouting/dialogue while an enemy is in the vicinity.
 */
export function isActionEngagingHostile(
  actionText: string,
  engagementPhase?: "vicinity" | "engaged"
): boolean {
  if (engagementPhase === "engaged") return true;
  const clean = String(actionText || "").trim();
  if (!clean) return false;
  if (/\[COMBAT:[A-Z_]+/i.test(clean)) return true;

  // Explicit tactical choice prefixes that engage combat
  if (
    /^\[(?:Combat|Tactics|Ambush|Strike|Role Technique|Meta-Knowledge\/Strike|Guard|Assault|Vanguard|Arcana|Offense|Counter|Push|Engage)[^\]]*\]/i.test(
      clean
    )
  ) {
    return true;
  }

  // Natural-language combat engagement verbs
  return /\b(attack|ambush|strike|slash|stab|thrust|shoot|snipe|cast|charge|rush|pounce|lunge|engage|fight|battle|confront|intercept|parry|deflect|pin|bind|restrain|entangle|shatter|ignite|detonate|smash|bash|cleave|swing|draw\s+(?:my|the)\s+(?:blade|sword|weapon|bow|staff)|spring\s+the|trigger\s+the\s+trap|close\s+the\s+distance|open\s+fire)\b/i.test(
    clean
  );
}

/**
 * Parses either structured HUD combat tags (`[COMBAT:...]`) OR natural-language player prose
 * into a concrete tactical combat command.
 */
export function parseStarfallCombatIntentFromAction(
  rawAction: string,
  encounter: StarfallCombatState,
  state: LabyrinthState
): ParsedStarfallCombatCommand {
  const clean = String(rawAction || "").trim();
  const lower = clean.toLowerCase();

  // 1. Check explicit structured HUD command prefix: [COMBAT:MODE:TARGET:SECONDARY]
  const tagMatch = clean.match(/\[COMBAT:([A-Z_]+)(?::([^\]:]+))?(?::([^\]]+))?\]/i);
  if (tagMatch) {
    const mode = tagMatch[1].toUpperCase() as StarfallCombatActionType;
    const arg1 = tagMatch[2]?.trim();
    const arg2 = tagMatch[3]?.trim();
    return {
      actionType: mode,
      actorHeroineName: arg1,
      swapInHeroineName:
        mode === "INTERCEPT_SWAP" || mode === "CHAIN_SWAP" ? arg1 : undefined,
      swapOutHeroineName:
        mode === "INTERCEPT_SWAP" || mode === "CHAIN_SWAP" ? arg2 : undefined,
      terrainTagUsed: mode === "TERRAIN_STUNT" ? arg1 : undefined,
      rawPlayerText: clean.replace(/\[COMBAT:[^\]]+\]\s*/gi, "").trim() || clean,
    };
  }

  // 2. Natural-language detection for freeform player input!
  if (
    /\b(retreat to lobby|abort floor|emergency recall|extract to star gate|flee the floor)\b/i.test(
      lower
    )
  ) {
    return { actionType: "RETREAT_TO_LOBBY", rawPlayerText: clean };
  }

  if (encounter.masterSealOrder && !encounter.masterSealOrder.resolved) {
    if (/\b(loophole|twist the seal|satisfy the wording|decoy bait)\b/i.test(lower)) {
      return { actionType: "SEAL_LOOPHOLE", rawPlayerText: clean };
    }
    if (/\b(defy the seal|reject the master|refuse the command|shatter the seal)\b/i.test(lower)) {
      return { actionType: "SEAL_DEFY", rawPlayerText: clean };
    }
    if (/\b(obey the seal|comply with the seal|follow the master's order)\b/i.test(lower)) {
      return { actionType: "SEAL_COMPLY", rawPlayerText: clean };
    }
  }

  // Check if player mentions swapping in a Reserve heroine
  for (const reserveName of encounter.reserveHeroines) {
    const firstToken = reserveName.split(/[\s,']+/)[0].toLowerCase();
    if (
      firstToken.length >= 3 &&
      lower.includes(firstToken) &&
      /\b(swap|tag|rotate|switch|intercept|step in|cover|relieve|bring in)\b/i.test(lower)
    ) {
      return {
        actionType: encounter.isEnemyBroken ? "CHAIN_SWAP" : "INTERCEPT_SWAP",
        swapInHeroineName: reserveName,
        swapOutHeroineName: encounter.frontlineHeroines[0],
        rawPlayerText: clean,
      };
    }
  }

  // Check if player calls for a Bond Special / Ultimate / Signature OC Awakening move
  for (const frontName of encounter.frontlineHeroines) {
    const dossier = getHeroineDossier(frontName);
    const firstToken = frontName.split(/[\s,']+/)[0].toLowerCase();
    if (!dossier) continue;
    const bondNameLower = dossier.skillKit.bondSpecial.name.toLowerCase();
    const activeNameLower = dossier.skillKit.activeSkill.name.toLowerCase();

    if (
      lower.includes(bondNameLower) ||
      (lower.includes(firstToken) &&
        /\b(negative switch|bond special|ultimate|detonate|hex detonation|final lance|blade of holy light)\b/i.test(
          lower
        ))
    ) {
      return {
        actionType: "BOND_SPECIAL",
        actorHeroineName: frontName,
        rawPlayerText: clean,
      };
    }

    if (
      lower.includes(activeNameLower) ||
      (lower.includes(firstToken) &&
        /\b(cast|heal|shield|wall of aesthul|seeing double|neurotoxin|hex seal|sweet dream|snipe|volley)\b/i.test(
          lower
        ))
    ) {
      return {
        actionType: "HEROINE_SKILL",
        actorHeroineName: frontName,
        rawPlayerText: clean,
      };
    }
  }

  // Check if player exploits one of the room's architectural terrain tags
  for (const tag of encounter.terrainTags) {
    const words = tag
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 4);
    if (words.some((w) => lower.includes(w))) {
      return {
        actionType: "TERRAIN_STUNT",
        terrainTagUsed: tag,
        rawPlayerText: clean,
      };
    }
  }

  // Check protagonist class/role skill keywords
  if (
    /\b(callout|command|analyze|overchannel|vanguard bash|flank|backstab|arcane|spell|tactical)\b/i.test(
      lower
    )
  ) {
    return { actionType: "ROLE_SKILL", rawPlayerText: clean };
  }

  // If lengthy custom prose (>35 chars), reward it as a graded CUSTOM_STUNT!
  if (clean.length > 35) {
    return { actionType: "CUSTOM_STUNT", rawPlayerText: clean };
  }

  return { actionType: "BASIC_ATTACK", rawPlayerText: clean };
}

function outcomeDamageFactor(outcome: DiceCheckOutcome): number {
  switch (outcome) {
    case "CRITICAL_BREACH":
      return 1.45;
    case "CLEAN_HIT":
      return 1.0;
    case "GRAZE":
      return 0.62;
    case "DEFLECTED":
      return 0.28;
  }
}

function outcomePoiseFactor(outcome: DiceCheckOutcome): number {
  switch (outcome) {
    case "CRITICAL_BREACH":
      return 1.5;
    case "CLEAN_HIT":
      return 1.0;
    case "GRAZE":
      return 0.55;
    case "DEFLECTED":
      return 0.2;
  }
}

function pickNextEnemyTelegraph(
  floor: number,
  turnNumber: number,
  enemyHpRatio: number,
  seed: string,
  enemyId?: string
): EnemyIntentTemplate {
  const theme = getTowerThemeForFloor(floor);
  const directTemplate =
    (enemyId &&
      (theme.bossByFloor[floor]?.id === enemyId
        ? theme.bossByFloor[floor]
        : theme.regularEnemies.find((e) => e.id === enemyId))) ||
    null;
  const generated = generateScaledFloorEnemy(floor, seed, directTemplate);
  const intents = generated.enemy.intents;
  if (!intents || intents.length === 0) {
    return {
      id: "fallback_strike",
      label: "Crushing Blow",
      telegraphText: `${generated.enemy.name} readies a heavy strike against the frontline.`,
      targetMode: "SINGLE_FRONTLINE",
      damageMultiplier: 1.0,
    };
  }
  // Below 50% HP on bosses, favor high-multiplier / ultimate telegraphs every other turn
  if (generated.enemy.isBoss && enemyHpRatio <= 0.55 && intents.length >= 2) {
    const heavyIdx = intents.length - 1;
    if (turnNumber % 2 === 0) return intents[heavyIdx];
  }
  const idx = Math.abs(turnNumber) % intents.length;
  return intents[idx];
}

/**
 * Resolves one full Turn-Based Tactical Combat exchange in Starfall Labyrinth.
 */
export function resolveStarfallCombatTurn(params: {
  labyrinthState: LabyrinthState;
  rawPlayerAction: string;
  protagonistName: string;
  protagonistLevel: number;
  protagonistStats: { str: number; dex: number; int: number };
  protagonistHp: number;
  protagonistMaxHp: number;
  protagonistMp: number;
  protagonistMaxMp: number;
  companionAffections?: Record<string, number>;
  turnSeed?: string;
}): StarfallCombatResolutionResult {
  const baseState = params.labyrinthState;
  const activeFloor = Math.max(
    1,
    baseState.activeEncounter?.isActive
      ? baseState.activeEncounter.floor
      : baseState.currentFloor || 1
  );
  const seed =
    params.turnSeed ||
    `${baseState.summonSeed || "starfall"}:f${activeFloor}:t${
      baseState.activeEncounter?.turnNumber || 1
    }:${params.rawPlayerAction.slice(0, 24)}`;

  // Ensure an active encounter exists
  const stateWithEnc =
    baseState.activeEncounter &&
    baseState.activeEncounter.isActive &&
    baseState.activeEncounter.floor === activeFloor &&
    baseState.activeEncounter.status === "ongoing"
      ? baseState
      : startFloorCombatEncounter(baseState, activeFloor, seed, true);

  const enc: StarfallCombatState = {
    ...(stateWithEnc.activeEncounter as StarfallCombatState),
    engagementPhase: "engaged",
    terrainTags: [...(stateWithEnc.activeEncounter?.terrainTags || [])],
    enemyWeaknesses: [...(stateWithEnc.activeEncounter?.enemyWeaknesses || [])],
    enemyResistances: [...(stateWithEnc.activeEncounter?.enemyResistances || [])],
    activeConditions: (stateWithEnc.activeEncounter?.activeConditions || []).map((c) => ({ ...c })),
    frontlineHeroines: [...(stateWithEnc.activeEncounter?.frontlineHeroines || [])],
    reserveHeroines: [...(stateWithEnc.activeEncounter?.reserveHeroines || [])],
    combatLog: [...(stateWithEnc.activeEncounter?.combatLog || [])],
  };

  let workingRoster: HeroRosterEntry[] = normalizeSquadFormations(
    (stateWithEnc.roster || []).map((r) => {
      const nextCooldowns: Record<string, number> = {};
      if (r.skillCooldowns) {
        for (const [skillId, turns] of Object.entries(r.skillCooldowns)) {
          if (turns > 1) {
            nextCooldowns[skillId] = turns - 1;
          }
        }
      }
      return {
        ...r,
        swapCooldown: Math.max(0, (r.swapCooldown || 0) - 1),
        skillCooldowns: nextCooldowns,
      };
    })
  );

  // Sync frontline/reserve lists from live living roster
  const refreshSquadLists = () => {
    enc.frontlineHeroines = workingRoster
      .filter(
        (r) =>
          (r.status === "DEPLOYED" || r.status === "WOUNDED") &&
          (r.formationSlot || "FRONTLINE") === "FRONTLINE"
      )
      .slice(0, 2)
      .map((r) => r.heroineName);
    enc.reserveHeroines = workingRoster
      .filter(
        (r) =>
          (r.status === "DEPLOYED" || r.status === "WOUNDED") &&
          r.formationSlot === "RESERVE"
      )
      .slice(0, 2)
      .map((r) => r.heroineName);
  };
  refreshSquadLists();

  const command = parseStarfallCombatIntentFromAction(
    params.rawPlayerAction,
    enc,
    stateWithEnc
  );

  const diceRolls: StarfallDiceRollRecord[] = [];
  const turnEvents: string[] = [];
  const newlyWoundedHeroines: string[] = [];
  const newlyFallenHeroines: { name: string; cause: string }[] = [];
  let protagonistHpDelta = 0;
  let protagonistMpDelta = 0;
  let trustDelta = 0;
  let interceptMitigationFactor = 1.0;
  let sealPartyAtkBonus = 1.0;
  let sealPartyDefPenalty = 1.0;

  // Snapshot active STUN / HEX_WEAKEN penalties for this turn & tick BLEED / POISON DoTs
  const activeCondList = enc.activeConditions || [];
  const hasConditionFor = (actor: string, condType: StarfallConditionType): boolean =>
    activeCondList.some(
      (c) =>
        c.type === condType &&
        (c.target === "PARTY" ||
          c.target === actor ||
          (actor !== "PROTAGONIST" && matchesHeroineName(c.target, actor)))
    );

  const conditionModPenalty = (actor: string): number =>
    (hasConditionFor(actor, "STUN") ? -3 : 0) +
    (hasConditionFor(actor, "HEX_WEAKEN") ? -2 : 0);

  const remainingConditions: ActiveCombatCondition[] = [];
  for (const cond of activeCondList) {
    if (cond.type === "BLEED" || cond.type === "POISON") {
      const tickDmg =
        cond.type === "BLEED"
          ? Math.max(4, Math.round(enc.enemyAtk * 0.22))
          : Math.max(3, Math.round(enc.enemyAtk * 0.18));
      if (cond.target === "PROTAGONIST" || cond.target === "PARTY") {
        const nextP = Math.max(1, params.protagonistHp + protagonistHpDelta - tickDmg);
        const appliedP = Math.max(0, params.protagonistHp + protagonistHpDelta - nextP);
        if (appliedP > 0) protagonistHpDelta -= appliedP;
      }
      workingRoster = workingRoster.map((r) => {
        if (
          (r.status === "DEPLOYED" || r.status === "WOUNDED") &&
          (r.formationSlot || "FRONTLINE") === "FRONTLINE" &&
          (cond.target === "PARTY" || matchesHeroineName(r.heroineName, cond.target))
        ) {
          const curHp = r.currentHp ?? r.combatStats?.maxHp ?? 100;
          return { ...r, currentHp: Math.max(1, curHp - tickDmg) };
        }
        return r;
      });
      turnEvents.push(
        `[${cond.type}] ${cond.target === "PARTY" ? "Frontline Squad" : cond.target} suffered ${tickDmg} ${cond.type.toLowerCase()} damage.`
      );
    }
    if (cond.turnsRemaining > 1) {
      remainingConditions.push({ ...cond, turnsRemaining: cond.turnsRemaining - 1 });
    }
  }
  enc.activeConditions = remainingConditions;

  const syncRosterConditions = () => {
    const conds = enc.activeConditions || [];
    workingRoster = workingRoster.map((r) => ({
      ...r,
      activeConditions: conds
        .filter((c) => c.target === "PARTY" || matchesHeroineName(r.heroineName, c.target))
        .map((c) => c.type),
    }));
  };
  syncRosterConditions();

  const protagStar = baseState.protagonistStarRank || 1;
  const hasMetaAdvantage = activeFloor <= (baseState.metaKnowledgeCeiling || 25);
  const metaBonusMod = hasMetaAdvantage ? 2 : 0;
  const chronosOddTurn = enc.themeId === "CHRONOS_FOUNDRY" && enc.turnNumber % 2 === 1;
  const chronosModBonus = chronosOddTurn ? 2 : 0;
  const bestProtagStat = Math.max(
    params.protagonistStats.str || 10,
    params.protagonistStats.dex || 10,
    params.protagonistStats.int || 10
  );
  const protagStatMod =
    Math.floor((bestProtagStat - 10) / 2) +
    protagStar +
    metaBonusMod +
    chronosModBonus +
    conditionModPenalty("PROTAGONIST");

  const baseEnemyDc = Math.max(9, Math.min(21, 9 + Math.floor(enc.enemyDef / 6)));

  // =========================================================================
  // 0. HANDLE RETREAT TO LOBBY
  // =========================================================================
  if (command.actionType === "RETREAT_TO_LOBBY") {
    const escapeRoll = rollHiddenD20Check({
      seed: `${seed}:retreat`,
      actorName: params.protagonistName,
      checkLabel: "Emergency Extraction",
      statModifier:
        Math.floor(((params.protagonistStats.dex || 10) - 10) / 2) +
        metaBonusMod +
        2,
      difficultyClass: enc.isBoss ? 14 : 11,
    });
    diceRolls.push(escapeRoll);

    if (escapeRoll.outcome === "DEFLECTED") {
      const glancing = Math.max(8, Math.round(enc.enemyAtk * 0.35));
      protagonistHpDelta -= glancing;
      turnEvents.push(
        `Emergency Retreat partially clipped during extraction (${glancing} glancing damage), but the squad successfully recalled to Star Gate Plaza!`
      );
    } else {
      turnEvents.push(
        `Clean tactical extraction! ${params.protagonistName} evacuated the squad back to Star Gate Plaza (Floor 0) with zero casualties.`
      );
    }

    enc.isActive = false;
    enc.status = "retreat";
    enc.lastDiceRolls = diceRolls;
    enc.combatLog.push(...turnEvents);
    enc.combatTelemetrySummary = `[COMBAT EXTRACTED]: ${turnEvents.join(" ")}`;
    trustDelta -= 3;

    const retreatedState: LabyrinthState = {
      ...stateWithEnc,
      currentFloor: 0,
      masterTrust: Math.max(0, Math.min(100, (stateWithEnc.masterTrust ?? 35) + trustDelta)),
      roster: workingRoster,
      activeEncounter: null,
    };

    return {
      nextLabyrinthState: retreatedState,
      encounter: enc,
      protagonistHpDelta,
      protagonistMpDelta,
      expAwarded: 0,
      shardsAwarded: 0,
      trustDelta,
      newlyWoundedHeroines,
      newlyFallenHeroines,
      diceRolls,
      combatTelemetryBlock: buildCombatTelemetryBlock(
        enc,
        diceRolls,
        turnEvents,
        workingRoster,
        0,
        0
      ),
    };
  }

  // =========================================================================
  // 1. MASTER COMMAND SEAL RESOLUTION (IF APPLICABLE)
  // =========================================================================
  if (enc.masterSealOrder && !enc.masterSealOrder.resolved) {
    if (command.actionType === "SEAL_COMPLY") {
      trustDelta += enc.masterSealOrder.trustGainOnComply;
      sealPartyAtkBonus = 1.35;
      sealPartyDefPenalty = 1.3;
      enc.masterSealOrder = { ...enc.masterSealOrder, resolved: true };
      turnEvents.push(
        `Complied with the Master's Command Seal (+${enc.masterSealOrder.trustGainOnComply}% Master Trust; reckless +35% Party ATK / +30% incoming damage exposure).`
      );
    } else if (command.actionType === "SEAL_LOOPHOLE") {
      const loopholeMod =
        Math.floor(((params.protagonistStats.int || 12) - 10) / 2) +
        protagStar +
        metaBonusMod +
        2;
      const loopholeRoll = rollHiddenD20Check({
        seed: `${seed}:seal_loophole`,
        actorName: params.protagonistName,
        checkLabel: "Command Seal Loophole",
        statModifier: loopholeMod,
        difficultyClass: 13,
      });
      diceRolls.push(loopholeRoll);
      enc.masterSealOrder = { ...enc.masterSealOrder, resolved: true };

      if (
        loopholeRoll.outcome === "CRITICAL_BREACH" ||
        loopholeRoll.outcome === "CLEAN_HIT"
      ) {
        trustDelta += Math.max(2, Math.round(enc.masterSealOrder.trustGainOnComply * 0.75));
        sealPartyAtkBonus = 1.25;
        enc.activeShieldPool += 28;
        turnEvents.push(
          `Brilliant Command Seal Loophole! ${params.protagonistName} satisfied the literal console condition via feint (+${trustDelta}% Master Trust, +25% Party ATK, +28 Tactical Barrier, zero ally bait exposure!).`
        );
      } else {
        trustDelta -= 2;
        sealPartyAtkBonus = 1.15;
        turnEvents.push(
          `Partial Seal Loophole—the Master's console registered hesitation (-2% Trust), though ${params.protagonistName} still kept the frontline out of a blind suicide charge.`
        );
      }
    } else if (command.actionType === "SEAL_DEFY") {
      trustDelta += enc.masterSealOrder.trustLossOnDefy;
      enc.activeShieldPool += 25;
      enc.masterSealOrder = { ...enc.masterSealOrder, resolved: true };
      turnEvents.push(
        `Openly defied the Master's reckless Command Seal (${enc.masterSealOrder.trustLossOnDefy}% Master Trust) to shield the squad (+25 Guard Barrier; squad morale surged!).`
      );
    }
  }

  // =========================================================================
  // 2. PARTY ACTIONS: SWAP / SKILL / STUNT / STRIKE
  // =========================================================================
  let totalPlayerPhaseDamage = 0;
  let totalPoiseDamage = 0;
  let usedWeaknessTags: TacticalWeaknessTag[] = [];

  const rollHeroCrit = (hero: HeroRosterEntry, seedSuffix: string): boolean => {
    const baseCrit = hero.combatStats?.critRate ?? 12;
    const chronosCrit = chronosOddTurn ? 12 : 0;
    const negCrit = hero.negativeSwitchActive ? 30 : 0;
    const effCrit = Math.min(85, baseCrit + chronosCrit + negCrit);
    return seededRandomFloat(`${seed}:crit:${seedSuffix}`) * 100 < effCrit;
  };

  const cleansePartyConditions = () => {
    const cleansed = new Set<StarfallConditionType>([
      "BLEED",
      "POISON",
      "STUN",
      "HEX_WEAKEN",
    ]);
    const before = enc.activeConditions?.length || 0;
    enc.activeConditions = (enc.activeConditions || []).filter(
      (c) => !cleansed.has(c.type)
    );
    syncRosterConditions();
    if ((enc.activeConditions?.length || 0) < before) {
      turnEvents.push(
        `[CLEANSE] Restorative magic purged active status ailments from the squad!`
      );
    }
  };

  const heroSpdBonus = (hero?: HeroRosterEntry): number =>
    Math.floor((hero?.combatStats?.spd || 20) / 12);

  const applyDamageAndPoise = (
    rawDmg: number,
    rawPoise: number,
    tag?: TacticalWeaknessTag,
    sourceLabel?: string,
    attackerEntry?: HeroRosterEntry
  ) => {
    let dmg = rawDmg * sealPartyAtkBonus;
    let poise = rawPoise;

    if (enc.isEnemyBroken) {
      dmg *= 1.5;
    }

    const hitsWeakness = Boolean(tag && enc.enemyWeaknesses.includes(tag));
    const hitsResistance = Boolean(tag && enc.enemyResistances?.includes(tag));

    if (hitsWeakness && tag) {
      dmg *= 1.25;
      poise *= 1.65;
      usedWeaknessTags.push(tag);
    }

    if (hitsResistance && tag) {
      dmg *= 0.75;
      poise *= 0.7;
    }

    // Tier I (SUNKEN_RELIQUARY): Flooded brine conducts lightning/crystal/arcane blasts (+15% DMG)
    if (
      enc.themeId === "SUNKEN_RELIQUARY" &&
      (tag === "CRYSTAL_SHATTER" || tag === "ASTRAL_ARCANE")
    ) {
      dmg *= 1.15;
    }

    // Tier II (CHRONOS_FOUNDRY): Precision Core Interrupt / Pierce bonus
    if (
      enc.themeId === "CHRONOS_FOUNDRY" &&
      (tag === "CORE_INTERRUPT" || tag === "PIERCE_VITALS")
    ) {
      poise *= 1.2;
    }

    // Tier III (ECLIPSE_SANCTUM): +25% DMG on Holy Purge, Shadow Hex, or Negative Mana
    if (
      enc.themeId === "ECLIPSE_SANCTUM" &&
      (tag === "HOLY_PURGE" ||
        tag === "SHADOW_HEX" ||
        attackerEntry?.negativeSwitchActive)
    ) {
      dmg *= 1.25;
    }

    // Tier IV (ASTRAL_SINGULARITY): Rarity Inversion boosts 1★–3★ base-origin units (+20% DMG & Poise)
    const isLowOriginUnit = attackerEntry
      ? attackerEntry.baseStarRank <= 3
      : protagStar <= 3;
    if (enc.themeId === "ASTRAL_SINGULARITY" && isLowOriginUnit) {
      dmg *= 1.2;
      poise *= 1.2;
    }

    // Hero SPD & Dyad Passive combat bonuses
    if (attackerEntry) {
      if ((attackerEntry.combatStats?.spd || 20) > enc.enemySpd) {
        poise *= 1.1;
      }
      if (
        matchesHeroineName(attackerEntry.heroineName, "Vaelkor") &&
        (enc.enemyDef >= 20 || enc.isBoss)
      ) {
        poise *= 1.25;
      }
      if (
        (matchesHeroineName(attackerEntry.heroineName, "Mei Zhou") ||
          matchesHeroineName(attackerEntry.heroineName, "Onyxia Cryss")) &&
        (tag === "CRYSTAL_SHATTER" || tag === "BLUNT_STAGGER")
      ) {
        poise *= 1.15;
      }
    }

    const finalDmg = Math.max(4, Math.round(dmg));
    const finalPoise = Math.max(4, Math.round(poise));
    totalPlayerPhaseDamage += finalDmg;
    totalPoiseDamage += finalPoise;

    if (hitsWeakness && sourceLabel && tag) {
      turnEvents.push(
        `${sourceLabel} exploited ${enc.enemyName}'s [${tag}] weakness (${finalDmg} DMG, ${finalPoise} Poise shred)!`
      );
    } else if (hitsResistance && sourceLabel && tag) {
      turnEvents.push(
        `${enc.enemyName} resisted [${tag}] from ${sourceLabel} (-25% DMG, -30% Poise)!`
      );
    }
    return { finalDmg, finalPoise, hitsWeakness };
  };

  // --- CASE A: DEFENSIVE INTERCEPT SWAP OR OFFENSIVE CHAIN SWAP ---
  if (
    (command.actionType === "INTERCEPT_SWAP" ||
      command.actionType === "CHAIN_SWAP") &&
    enc.reserveHeroines.length > 0
  ) {
    const incomingName =
      enc.reserveHeroines.find((n) =>
        matchesHeroineName(n, command.swapInHeroineName)
      ) || enc.reserveHeroines[0];
    const outgoingName =
      enc.frontlineHeroines.find((n) =>
        matchesHeroineName(n, command.swapOutHeroineName)
      ) || enc.frontlineHeroines[0];

    const inIdx = workingRoster.findIndex((r) =>
      matchesHeroineName(r.heroineName, incomingName, r.heroineId)
    );
    const outIdx = workingRoster.findIndex((r) =>
      matchesHeroineName(r.heroineName, outgoingName, r.heroineId)
    );

    if (inIdx >= 0) {
      workingRoster[inIdx] = {
        ...workingRoster[inIdx],
        formationSlot: "FRONTLINE",
        swapCooldown: 2,
      };
      if (outIdx >= 0 && outIdx !== inIdx) {
        workingRoster[outIdx] = {
          ...workingRoster[outIdx],
          formationSlot: "RESERVE",
        };
      }
      refreshSquadLists();

      const inEntry = hydrateRosterEntryStats(workingRoster[inIdx], "FRONTLINE");
      workingRoster[inIdx] = inEntry;
      const inDossier = getHeroineDossier(inEntry.heroineName);
      const tagMove: HeroSkillMove = inDossier?.skillKit.tagAssistSkill || {
        id: "default_tag",
        name: "Vanguard Tag-Strike",
        mpCost: 0,
        cooldownTurns: 2,
        powerMultiplier: 1.25,
        poiseBreak: 24,
        description: "Rapid tag-in strike.",
      };

      const swapMod =
        Math.floor((inEntry.combatStats?.spd || 20) / 5) +
        inEntry.starRank +
        chronosModBonus +
        conditionModPenalty(inEntry.heroineName);
      const swapRoll = rollHiddenD20Check({
        seed: `${seed}:swap:${inEntry.heroineName}`,
        actorName: inEntry.heroineName,
        checkLabel:
          command.actionType === "INTERCEPT_SWAP"
            ? `Intercept Swap — ${tagMove.name}`
            : `Chain Swap — ${tagMove.name}`,
        statModifier: swapMod,
        difficultyClass: baseEnemyDc - 1,
      });
      diceRolls.push(swapRoll);

      if (command.actionType === "INTERCEPT_SWAP") {
        // Sunken Reliquary rewards narrow corridor shield/intercept blocks
        interceptMitigationFactor =
          enc.themeId === "SUNKEN_RELIQUARY" ? 0.45 : 0.6;
      }

      if (tagMove.isHeal) {
        const healAmt = Math.round((inEntry.combatStats?.maxHp || 100) * 0.28);
        protagonistHpDelta += Math.round(healAmt * 0.6);
        workingRoster = workingRoster.map((r) =>
          r.status === "DEPLOYED" || r.status === "WOUNDED"
            ? {
                ...r,
                currentHp: Math.min(
                  r.combatStats?.maxHp || 100,
                  (r.currentHp ?? r.combatStats?.maxHp ?? 100) + healAmt
                ),
              }
            : r
        );
        cleansePartyConditions();
        turnEvents.push(
          `${inEntry.heroineName} rotated in for ${outgoingName || "the frontline"} with [${tagMove.name}], restoring +${healAmt} Squad HP and bracing against incoming fire!`
        );
      } else {
        if (tagMove.isShield) {
          const shieldAmt = Math.round((inEntry.combatStats?.def || 20) * 1.9);
          enc.activeShieldPool += shieldAmt;
          turnEvents.push(
            `${inEntry.heroineName} slammed into the Vanguard with [${tagMove.name}], erecting a +${shieldAmt} Barrier!`
          );
        }
        if (tagMove.spawnsPhantom) {
          enc.phantomEchoesActive = Math.min(3, enc.phantomEchoesActive + 1);
        }
        if (tagMove.appliesHexSeal) {
          enc.hexSealsOnEnemy = Math.min(5, enc.hexSealsOnEnemy + 1);
        }

        const chainMult = command.actionType === "CHAIN_SWAP" ? 1.3 : 1.05;
        const baseAtk = inEntry.combatStats?.atk || 24;
        const defMult = matchesHeroineName(inEntry.heroineName, "Aurelle, the Seraph Lance")
          ? 0.16
          : 0.3;
        const swapCrit = rollHeroCrit(inEntry, `swap:${inEntry.heroineName}`);
        const critMult = swapCrit ? 1.35 : 1.0;
        const rawDmg =
          Math.max(10, baseAtk * tagMove.powerMultiplier * chainMult - enc.enemyDef * defMult) *
          outcomeDamageFactor(swapRoll.outcome) *
          critMult;
        const rawPoise =
          tagMove.poiseBreak * chainMult * outcomePoiseFactor(swapRoll.outcome);

        const res = applyDamageAndPoise(
          rawDmg,
          rawPoise,
          tagMove.weaknessTag,
          `${inEntry.heroineName}'s [${tagMove.name}]`,
          inEntry
        );
        turnEvents.push(
          `[PARTY SWAP] ${inEntry.heroineName} tagged in for ${
            outgoingName || "the Vanguard"
          } (${
            command.actionType === "INTERCEPT_SWAP"
              ? "-40% Incoming Damage Guard"
              : "Chain Burst"
          }) and landed [${tagMove.name}]${swapCrit ? " [CRIT!]" : ""} for ${res.finalDmg} DMG & ${res.finalPoise} Poise shred!`
        );
      }
    }
  } else if (
    command.actionType === "HEROINE_SKILL" ||
    command.actionType === "BOND_SPECIAL"
  ) {
    // --- CASE B: ACTIVE HEROINE SKILL OR BOND SPECIAL (OC KITS) ---
    const chosenName =
      enc.frontlineHeroines.find((n) =>
        matchesHeroineName(n, command.actorHeroineName)
      ) ||
      enc.frontlineHeroines[0] ||
      workingRoster.find((r) => r.status === "DEPLOYED")?.heroineName;

    const hIdx = workingRoster.findIndex((r) =>
      matchesHeroineName(r.heroineName, chosenName, r.heroineId)
    );

    if (hIdx >= 0) {
      const hero = hydrateRosterEntryStats(workingRoster[hIdx]);
      const dossier = getHeroineDossier(hero.heroineName);
      const isBond = command.actionType === "BOND_SPECIAL";
      const requestedMove: HeroSkillMove | undefined = isBond
        ? dossier?.skillKit.bondSpecial
        : dossier?.skillKit.activeSkill;
      const cooldownLeft = requestedMove
        ? hero.skillCooldowns?.[requestedMove.id] || 0
        : 0;
      const isCooldownFallback = Boolean(requestedMove && cooldownLeft > 0);
      const move: HeroSkillMove | undefined = isCooldownFallback
        ? dossier?.skillKit.basicAttack
        : requestedMove;

      if (move) {
        if (isCooldownFallback && requestedMove) {
          turnEvents.push(
            `[${requestedMove.name}] is recharging (${cooldownLeft}T left)—${hero.heroineName} struck with [${move.name}] instead!`
          );
        }

        const eclipseTax = !isCooldownFallback && enc.themeId === "ECLIPSE_SANCTUM" ? 2 : 0;
        const mpCost = Math.max(0, move.mpCost + eclipseTax);
        const curMp = hero.currentMp ?? hero.combatStats?.maxMp ?? 60;
        const effectiveCost = curMp >= mpCost ? mpCost : Math.floor(curMp * 0.5);
        const nextSkillCooldowns = { ...(hero.skillCooldowns || {}) };
        if (!isCooldownFallback && move.cooldownTurns > 0) {
          nextSkillCooldowns[move.id] = move.cooldownTurns;
        }
        workingRoster[hIdx] = {
          ...hero,
          currentMp: Math.max(0, curMp - effectiveCost),
          skillCooldowns: nextSkillCooldowns,
        };

        const negSwitchBonus = hero.negativeSwitchActive ? 1.45 : 1.0;
        const heroMod =
          Math.floor((hero.combatStats?.atk || 24) / 6) +
          hero.starRank +
          heroSpdBonus(hero) +
          chronosModBonus +
          conditionModPenalty(hero.heroineName) +
          (hero.negativeSwitchActive ? 3 : 0);

        const skillRoll = rollHiddenD20Check({
          seed: `${seed}:skill:${hero.heroineName}:${move.id}`,
          actorName: hero.heroineName,
          checkLabel: move.name,
          statModifier: heroMod,
          difficultyClass: isBond && !isCooldownFallback ? baseEnemyDc - 2 : baseEnemyDc,
        });
        diceRolls.push(skillRoll);

        // OC Special Mechanics!
        if (move.triggersNegativeSwitch) {
          workingRoster[hIdx] = {
            ...workingRoster[hIdx],
            negativeSwitchActive: true,
          };
          turnEvents.push(
            `[NEGATIVE SWITCH] ${hero.heroineName}'s dual consciousness inverted into lethal focus (+45% ATK & +30% CRIT overdrive)!`
          );
        }
        if (move.spawnsPhantom) {
          enc.phantomEchoesActive = Math.min(3, enc.phantomEchoesActive + (isBond && !isCooldownFallback ? 2 : 1));
          turnEvents.push(
            `[SEEING DOUBLE] ${hero.heroineName} wove ${isBond && !isCooldownFallback ? 2 : 1} hyper-speed phantom afterimage(s) across the frontline!`
          );
        }
        if (move.isShield) {
          const barrier = Math.round(
            ((hero.combatStats?.def || 22) * 2.1 + hero.starRank * 10) *
              (isBond && !isCooldownFallback ? 1.4 : 1.0)
          );
          enc.activeShieldPool += barrier;
          turnEvents.push(
            `${hero.heroineName} anchored [${move.name}], projecting a +${barrier} Aegis Barrier across the Vanguard!`
          );
        }
        if (move.isHeal) {
          const healAmt = Math.round(
            (hero.combatStats?.maxHp || 100) * (isBond && !isCooldownFallback ? 0.45 : 0.32)
          );
          protagonistHpDelta += Math.round(healAmt * 0.75);
          workingRoster = workingRoster.map((r) =>
            r.status === "DEPLOYED" || r.status === "WOUNDED"
              ? {
                  ...r,
                  currentHp: Math.min(
                    r.combatStats?.maxHp || 100,
                    (r.currentHp ?? r.combatStats?.maxHp ?? 100) + healAmt
                  ),
                }
              : r
          );
          cleansePartyConditions();
          turnEvents.push(
            `${hero.heroineName} channeled [${move.name}], restoring +${healAmt} HP to the deployed squad!`
          );
        }

        // Hex Seal Application & Detonation (Godiva / Abraxia / Sable synergy!)
        let hexDetonationBonus = 0;
        if (move.appliesHexSeal) {
          if (isBond && !isCooldownFallback && enc.hexSealsOnEnemy > 0) {
            hexDetonationBonus = enc.hexSealsOnEnemy * Math.round(28 + activeFloor * 1.4);
            turnEvents.push(
              `[HEX SEAL DETONATION] ${hero.heroineName} collapsed ${enc.hexSealsOnEnemy} cursed Hex Seal(s) on ${enc.enemyName} for +${hexDetonationBonus} true abyssal damage!`
            );
            enc.hexSealsOnEnemy = 0;
          } else {
            enc.hexSealsOnEnemy = Math.min(5, enc.hexSealsOnEnemy + (isBond && !isCooldownFallback ? 2 : 1));
            turnEvents.push(
              `[HEX SEAL] Branded ${enc.enemyName} with cursed Hex Seal (${enc.hexSealsOnEnemy}/5 active).`
            );
          }
        }

        if (move.powerMultiplier > 0) {
          const defMult = matchesHeroineName(hero.heroineName, "Aurelle, the Seraph Lance")
            ? 0.16
            : 0.28;
          const skillCrit = rollHeroCrit(hero, `skill:${hero.heroineName}:${move.id}`);
          const critMult = skillCrit ? 1.35 : 1.0;
          const rawDmg =
            (Math.max(
              12,
              (hero.combatStats?.atk || 25) *
                move.powerMultiplier *
                negSwitchBonus -
                enc.enemyDef * defMult
            ) *
              outcomeDamageFactor(skillRoll.outcome) +
              hexDetonationBonus) *
            critMult;
          const rawPoise =
            move.poiseBreak * outcomePoiseFactor(skillRoll.outcome);

          const res = applyDamageAndPoise(
            rawDmg,
            rawPoise,
            move.weaknessTag,
            `${hero.heroineName}'s [${move.name}]`,
            hero
          );
          turnEvents.push(
            `${hero.heroineName} unleashed [${move.name}]${skillCrit ? " [CRIT!]" : ""} (${skillRoll.outcome.replace(
              /_/g,
              " "
            )}: ${res.finalDmg} DMG, ${res.finalPoise} Poise shred)!`
          );
        }
      }
    }
  } else if (
    command.actionType === "TERRAIN_STUNT" ||
    command.actionType === "CUSTOM_STUNT"
  ) {
    // --- CASE C: ARCHITECTURAL TERRAIN EXPLOIT OR CUSTOM FREEFORM STUNT ---
    const terrainLabel =
      command.terrainTagUsed ||
      enc.terrainTags[0] ||
      "Labyrinth Architecture";
    const stuntBonus = command.actionType === "TERRAIN_STUNT" ? 3 : 2;
    const stuntRoll = rollHiddenD20Check({
      seed: `${seed}:stunt`,
      actorName: params.protagonistName,
      checkLabel:
        command.actionType === "TERRAIN_STUNT"
          ? `Terrain Stunt (${terrainLabel})`
          : "Tactical Field Stunt",
      statModifier: protagStatMod + stuntBonus,
      difficultyClass: baseEnemyDc - 1,
    });
    diceRolls.push(stuntRoll);

    // Pick the enemy's primary weakness if the stunt succeeds cleanly (representing ex-ranker environmental mastery!)
    const stuntTag =
      stuntRoll.outcome === "CRITICAL_BREACH" ||
      stuntRoll.outcome === "CLEAN_HIT"
        ? enc.enemyWeaknesses[0]
        : undefined;

    const baseProtagAtk = 20 + params.protagonistLevel * 2 + protagStar * 5;
    const rawDmg =
      Math.max(14, baseProtagAtk * 1.45 - enc.enemyDef * 0.25) *
      outcomeDamageFactor(stuntRoll.outcome);
    const rawPoise = 34 * outcomePoiseFactor(stuntRoll.outcome);

    const res = applyDamageAndPoise(
      rawDmg,
      rawPoise,
      stuntTag,
      `${params.protagonistName}'s [${terrainLabel}] exploit`
    );
    turnEvents.push(
      `${params.protagonistName} weaponized [${terrainLabel}] in ${enc.layoutName} (${stuntRoll.outcome.replace(
        /_/g,
        " "
      )}: ${res.finalDmg} DMG, ${res.finalPoise} Poise shred)!`
    );
  } else {
    // --- CASE D: PROTAGONIST BASIC STRIKE / SPECIFIC ROLE ABILITY ---
    const isRoleSkill = command.actionType === "ROLE_SKILL";
    const roleAbilityName = isRoleSkill
      ? (command.actorHeroineName || "Role Tactical Skill").trim()
      : "";
    const lowerAbility = roleAbilityName.toLowerCase();

    let mpCost = 0;
    let mult = 1.05;
    let poiseBase = 16;
    let roleWeaknessTag: TacticalWeaknessTag | undefined = undefined;
    let roleEffectNote = "";

    if (isRoleSkill) {
      if (lowerAbility.includes("deflection parry") || lowerAbility.includes("angle zero")) {
        mpCost = 15;
        enc.activeShieldPool += 22;
        interceptMitigationFactor = Math.min(interceptMitigationFactor, 0.65);
        mult = 1.25;
        poiseBase = 26;
        roleWeaknessTag = "CORE_INTERRUPT";
        roleEffectNote = "+22 Barrier & -35% Incoming DMG";
      } else if (lowerAbility.includes("interpose oath")) {
        mpCost = 20;
        enc.activeShieldPool += 30;
        interceptMitigationFactor = Math.min(interceptMitigationFactor, 0.65);
        mult = 1.2;
        poiseBase = 24;
        roleWeaknessTag = "BLUNT_STAGGER";
        roleEffectNote = "+30 Interpose Barrier & -35% Incoming DMG";
      } else if (lowerAbility.includes("leyline siphon ward")) {
        mpCost = 20;
        enc.activeShieldPool += 24;
        workingRoster = workingRoster.map((r) =>
          (r.status === "DEPLOYED" || r.status === "WOUNDED") &&
          (r.formationSlot || "FRONTLINE") === "FRONTLINE"
            ? {
                ...r,
                currentMp: Math.min(
                  r.combatStats?.maxMp || 65,
                  (r.currentMp ?? r.combatStats?.maxMp ?? 65) + 8
                ),
              }
            : r
        );
        mult = 1.15;
        poiseBase = 22;
        roleWeaknessTag = "ASTRAL_ARCANE";
        roleEffectNote = "+24 Starlight Barrier & +8 Frontline MP";
      } else if (lowerAbility.includes("mana-core seam sever")) {
        mpCost = 18;
        mult = 1.65;
        poiseBase = 38;
        roleWeaknessTag = enc.enemyWeaknesses.includes("PIERCE_VITALS")
          ? "PIERCE_VITALS"
          : enc.enemyWeaknesses[0] || "PIERCE_VITALS";
        roleEffectNote = "Critical Seam Strike";
      } else if (lowerAbility.includes("wire-step disengage")) {
        mpCost = 14;
        enc.phantomEchoesActive = Math.min(3, enc.phantomEchoesActive + 1);
        mult = 1.35;
        poiseBase = 24;
        roleWeaknessTag = "PIERCE_VITALS";
        roleEffectNote = "+1 Evasion Decoy";
      } else if (lowerAbility.includes("command seal loophole")) {
        mpCost = 20;
        enc.activeShieldPool += 20;
        mult = 1.4;
        poiseBase = 30;
        roleWeaknessTag = enc.enemyWeaknesses[0] || "CORE_INTERRUPT";
        roleEffectNote = "+20 Tactical Barrier";
      } else if (lowerAbility.includes("micro-cast interrupt")) {
        mpCost = 12;
        mult = 1.4;
        poiseBase = 36;
        roleWeaknessTag = "CORE_INTERRUPT";
        interceptMitigationFactor = Math.min(interceptMitigationFactor, 0.75);
        roleEffectNote = "Fast Cast-Interrupt & -25% Incoming DMG";
      } else {
        // Frame-Perfect Callout or generic Role Skill
        mpCost = lowerAbility.includes("callout") ? 15 : 12;
        mult = 1.4;
        poiseBase = 36;
        roleWeaknessTag = enc.enemyWeaknesses.includes("CORE_INTERRUPT")
          ? "CORE_INTERRUPT"
          : enc.enemyWeaknesses[0] || "CORE_INTERRUPT";
        interceptMitigationFactor = Math.min(interceptMitigationFactor, 0.75);
        roleEffectNote = "-25% Incoming DMG Callout";
      }
      protagonistMpDelta -= mpCost;
    }

    const atkRoll = rollHiddenD20Check({
      seed: `${seed}:protag_atk:${roleAbilityName}`,
      actorName: params.protagonistName,
      checkLabel: isRoleSkill
        ? roleAbilityName || "Role Tactical Skill"
        : "Vanguard Strike",
      statModifier: protagStatMod + (isRoleSkill ? 2 : 0),
      difficultyClass: baseEnemyDc,
    });
    diceRolls.push(atkRoll);

    const baseProtagAtk = 18 + params.protagonistLevel * 2 + protagStar * 4;
    const rawDmg =
      Math.max(10, baseProtagAtk * mult - enc.enemyDef * 0.3) *
      outcomeDamageFactor(atkRoll.outcome);
    const rawPoise = poiseBase * outcomePoiseFactor(atkRoll.outcome);

    const res = applyDamageAndPoise(
      rawDmg,
      rawPoise,
      roleWeaknessTag,
      `${params.protagonistName}'s ${isRoleSkill ? `[${roleAbilityName}]` : "Strike"}`
    );
    turnEvents.push(
      `${params.protagonistName} executed ${
        isRoleSkill
          ? `[${roleAbilityName}]${roleEffectNote ? ` (${roleEffectNote})` : ""}`
          : "a frontline strike"
      } (${atkRoll.outcome.replace(/_/g, " ")}: ${res.finalDmg} DMG, ${res.finalPoise} Poise shred).`
    );
  }

  // Coordinated Frontline Follow-Up Assist (from whichever frontline heroine didn't take the primary skill slot)
  const hasLyraFrontline = enc.frontlineHeroines.some((n) =>
    matchesHeroineName(n, "Lyra Nocturne")
  );
  for (const frontName of enc.frontlineHeroines) {
    if (
      (command.actionType === "HEROINE_SKILL" ||
        command.actionType === "BOND_SPECIAL") &&
      matchesHeroineName(frontName, command.actorHeroineName)
    ) {
      continue;
    }
    if (
      (command.actionType === "INTERCEPT_SWAP" ||
        command.actionType === "CHAIN_SWAP") &&
      matchesHeroineName(frontName, command.swapInHeroineName)
    ) {
      continue;
    }
    const fEntry = workingRoster.find((r) =>
      matchesHeroineName(r.heroineName, frontName, r.heroineId)
    );
    if (!fEntry || fEntry.status === "FALLEN") continue;
    const fDossier = getHeroineDossier(fEntry.heroineName);
    const basic = fDossier?.skillKit.basicAttack;
    const assistAtk =
      (fEntry.combatStats?.atk || 20) * (fEntry.negativeSwitchActive ? 1.35 : 1.0);
    const defMult = matchesHeroineName(fEntry.heroineName, "Aurelle, the Seraph Lance")
      ? 0.12
      : 0.2;
    const assistCrit = rollHeroCrit(fEntry, `assist:${fEntry.heroineName}`);
    const lyraBoost = hasLyraFrontline && !matchesHeroineName(fEntry.heroineName, "Lyra Nocturne")
      ? 1.25
      : 1.0;
    const rawAssistDmg =
      Math.max(6, assistAtk * 0.55 - enc.enemyDef * defMult) *
      lyraBoost *
      (assistCrit ? 1.35 : 1.0);
    const rawAssistPoise = Math.max(6, (basic?.poiseBreak || 12) * 0.55);
    const assistRes = applyDamageAndPoise(
      rawAssistDmg,
      rawAssistPoise,
      basic?.weaknessTag,
      `${fEntry.heroineName}'s [${basic?.name || "Basic Strike"}]`,
      fEntry
    );
    if (basic?.appliesHexSeal && enc.hexSealsOnEnemy < 5) {
      enc.hexSealsOnEnemy += 1;
    }
    turnEvents.push(
      `${fEntry.heroineName} followed up with [${basic?.name || "Basic Strike"}]${
        assistCrit ? " [CRIT!]" : ""
      } (+${assistRes.finalDmg} DMG, +${assistRes.finalPoise} Poise).`
    );
  }

  // Apply accumulated HP & Poise damage to Enemy!
  const wasAlreadyBroken = enc.isEnemyBroken;
  enc.enemyHp = Math.max(0, enc.enemyHp - totalPlayerPhaseDamage);

  // Check Telegraph Interrupt via Weakness Tag OR Poise Break!
  let telegraphInterrupted = false;
  if (
    enc.currentTelegraph.interruptibleBy &&
    enc.currentTelegraph.interruptibleBy.some((t) => usedWeaknessTags.includes(t))
  ) {
    telegraphInterrupted = true;
    totalPoiseDamage += 25;
  }

  if (!wasAlreadyBroken) {
    enc.enemyPoise = Math.max(0, enc.enemyPoise - totalPoiseDamage);
    if (enc.enemyPoise <= 0 && enc.enemyHp > 0) {
      enc.isEnemyBroken = true;
      enc.brokenTurnsRemaining = 1;
      telegraphInterrupted = true;
      turnEvents.push(
        `[POISE BREAK!!] ${enc.enemyName}'s guard shattered completely—its telegraphed [${enc.currentTelegraph.label}] collapsed and it is staggered (+50% vulnerability next turn)!`
      );
    } else if (telegraphInterrupted && enc.enemyHp > 0) {
      turnEvents.push(
        `[TELEGRAPH INTERRUPTED!] Countered ${enc.enemyName}'s [${enc.currentTelegraph.label}] via weakness Disruption!`
      );
    }
  } else {
    // Recover from previous turn's Poise Break at end of turn
    enc.brokenTurnsRemaining = Math.max(0, enc.brokenTurnsRemaining - 1);
    if (enc.brokenTurnsRemaining === 0) {
      enc.isEnemyBroken = false;
      enc.enemyPoise = enc.enemyMaxPoise;
    }
  }

  // =========================================================================
  // 3. CHECK ENEMY DEFEAT & VICTORY REWARDS
  // =========================================================================
  const finalizeVictoryReturn = (): StarfallCombatResolutionResult => {
    enc.isActive = false;
    enc.status = "victory";
    const expAwarded = enc.isThresholdGuardian
      ? 160 + activeFloor * 6
      : enc.isBoss
      ? 125 + activeFloor * 5
      : 42 + activeFloor * 3;
    const shardsAwarded = enc.isThresholdGuardian
      ? 90
      : enc.isBoss
      ? 60
      : 15;
    trustDelta += enc.isBoss ? 8 : 3;

    turnEvents.push(
      `[VICTORY!] ${enc.enemyName} (${enc.enemyTitle}) collapsed in ${enc.layoutName}! Earned +${expAwarded} EXP, +${shardsAwarded} Star Shards, and +${
        enc.isBoss ? 8 : 3
      }% Master Trust.`
    );

    enc.lastDiceRolls = diceRolls;
    enc.combatLog.push(...turnEvents);
    enc.combatTelemetrySummary = `[COMBAT VICTORY ON FLOOR ${activeFloor}]: Defeated ${enc.enemyName}. ${turnEvents.join(
      " "
    )}`;

    const nextHighest = Math.max(baseState.highestFloorCleared || 0, activeFloor);
    const nextState: LabyrinthState = {
      ...stateWithEnc,
      highestFloorCleared: nextHighest,
      starShards: (stateWithEnc.starShards || 0) + shardsAwarded,
      masterTrust: Math.max(
        0,
        Math.min(100, (stateWithEnc.masterTrust ?? 35) + trustDelta)
      ),
      roster: workingRoster,
      activeEncounter: null,
    };

    return {
      nextLabyrinthState: nextState,
      encounter: enc,
      protagonistHpDelta,
      protagonistMpDelta,
      expAwarded,
      shardsAwarded,
      trustDelta,
      newlyWoundedHeroines,
      newlyFallenHeroines,
      diceRolls,
      combatTelemetryBlock: buildCombatTelemetryBlock(
        enc,
        diceRolls,
        turnEvents,
        workingRoster,
        expAwarded,
        shardsAwarded
      ),
    };
  };

  if (enc.enemyHp <= 0) {
    return finalizeVictoryReturn();
  }

  // =========================================================================
  // 4. ENEMY COUNTER-ATTACK PHASE & TWO-STAGE PERMADEATH PROTECTION
  // =========================================================================
  if (!enc.isEnemyBroken && !telegraphInterrupted) {
    const intent = enc.currentTelegraph;
    if (intent.targetMode === "SELF_BUFF") {
      enc.enemyPoise = Math.min(enc.enemyMaxPoise, enc.enemyPoise + 25);
      if (intent.appliesCondition === "TIME_REWIND") {
        const rewindHeal = Math.round(enc.enemyMaxHp * 0.12);
        enc.enemyHp = Math.min(enc.enemyMaxHp, enc.enemyHp + rewindHeal);
        turnEvents.push(
          `[TIME REWIND] ${enc.enemyName} executed [${intent.label}], rewinding +${rewindHeal} HP & +25 Poise!`
        );
      } else {
        turnEvents.push(
          `${enc.enemyName} executed [${intent.label}], reinforcing its stance (+25 Poise).`
        );
      }
    } else {
      // Check Trinity's Seeing Double Phantom Dodge first!
      if (
        enc.phantomEchoesActive > 0 &&
        intent.targetMode !== "ENTIRE_PARTY"
      ) {
        enc.phantomEchoesActive -= 1;
        turnEvents.push(
          `[PHANTOM EVADE!] ${enc.enemyName}'s [${intent.label}] sliced harmlessly through a Seeing Double afterimage (${enc.phantomEchoesActive} echo remaining)!`
        );
      } else {
        // Roll Squad Evasion / Guard Save
        const leadHeroName = enc.frontlineHeroines[0];
        const leadEntry = workingRoster.find((r) =>
          matchesHeroineName(r.heroineName, leadHeroName, r.heroineId)
        );
        const evaBonus = Math.floor(
          ((leadEntry?.combatStats?.evasion || 14) +
            (leadEntry?.combatStats?.def || 18)) /
            7
        );
        const defenseRoll = rollHiddenD20Check({
          seed: `${seed}:enemy_atk:${enc.turnNumber}`,
          actorName: leadEntry?.heroineName || params.protagonistName,
          checkLabel: `Guard/Evade vs ${intent.label}`,
          statModifier:
            evaBonus +
            (interceptMitigationFactor < 1 ? 3 : 0) +
            conditionModPenalty(leadEntry?.heroineName || "PROTAGONIST"),
          difficultyClass: Math.max(10, 10 + Math.floor(enc.enemyAtk / 8)),
        });
        diceRolls.push(defenseRoll);

        let defFactor = 1.0;
        if (defenseRoll.outcome === "CRITICAL_BREACH") defFactor = 0.25; // Frame-perfect parry/dodge!
        else if (defenseRoll.outcome === "CLEAN_HIT") defFactor = 0.6;
        else if (defenseRoll.outcome === "GRAZE") defFactor = 0.9;
        else defFactor = 1.18;

        const hasGarrickFrontline = enc.frontlineHeroines.some((n) =>
          matchesHeroineName(n, "Garrick Ironbrow")
        );
        const hasRolandFrontline = enc.frontlineHeroines.some((n) =>
          matchesHeroineName(n, "Sir Roland Vance")
        );
        const isAoEIntent =
          intent.targetMode === "ALL_FRONTLINE" ||
          intent.targetMode === "ENTIRE_PARTY";
        const garrickWardMult = isAoEIntent && hasGarrickFrontline ? 0.8 : 1.0;
        const rolandBossMult = enc.isBoss && hasRolandFrontline ? 0.85 : 1.0;

        if (garrickWardMult < 1) {
          turnEvents.push(
            `[OLD IRON NEVER BREAKS] Garrick Ironbrow anchored the vanguard, reducing AoE impact by 20%!`
          );
        }
        if (rolandBossMult < 1) {
          turnEvents.push(
            `[CRIMSON MANTLE] Sir Roland Vance checked ${enc.enemyName}'s boss cleave (-15% DMG)!`
          );
        }

        let rawEnemyHit = Math.round(
          enc.enemyAtk *
            intent.damageMultiplier *
            defFactor *
            interceptMitigationFactor *
            sealPartyDefPenalty *
            garrickWardMult *
            rolandBossMult
        );

        // Absorb with Active Shield Pool (Wall of Aesthul / Sweet Dream / Seal Barrier)
        if (enc.activeShieldPool > 0 && rawEnemyHit > 0) {
          const absorbed = Math.min(enc.activeShieldPool, rawEnemyHit);
          enc.activeShieldPool -= absorbed;
          rawEnemyHit -= absorbed;
          turnEvents.push(
            `Vanguard Barrier absorbed ${absorbed} damage from [${intent.label}] (${enc.activeShieldPool} shield left).`
          );
        }

        // Distribute across targets based on targetMode
        let targetsFrontline: string[] = [];
        if (enc.frontlineHeroines.length > 0) {
          if (isAoEIntent) {
            targetsFrontline = [...enc.frontlineHeroines];
          } else if (intent.targetMode === "LOWEST_HP") {
            const frontlineRoster = enc.frontlineHeroines
              .map((fn) =>
                workingRoster.find((r) =>
                  matchesHeroineName(r.heroineName, fn, r.heroineId)
                )
              )
              .filter(Boolean) as HeroRosterEntry[];
            frontlineRoster.sort(
              (a, b) =>
                (a.currentHp ?? a.combatStats?.maxHp ?? 100) -
                (b.currentHp ?? b.combatStats?.maxHp ?? 100)
            );
            targetsFrontline = frontlineRoster[0]
              ? [frontlineRoster[0].heroineName]
              : [enc.frontlineHeroines[0]];
          } else {
            targetsFrontline = [enc.frontlineHeroines[0]];
          }
        }

        if (rawEnemyHit > 0) {
          // Protagonist takes a share on AoE or if frontline is empty
          if (targetsFrontline.length === 0 || isAoEIntent) {
            const pHit =
              targetsFrontline.length === 0
                ? rawEnemyHit
                : Math.max(4, Math.round(rawEnemyHit * 0.65));
            protagonistHpDelta -= pHit;
            turnEvents.push(
              `${params.protagonistName} took ${pHit} damage from [${intent.label}].`
            );
          }

          for (const tName of targetsFrontline) {
            const tIdx = workingRoster.findIndex((r) =>
              matchesHeroineName(r.heroineName, tName, r.heroineId)
            );
            if (tIdx < 0) continue;
            const tHero = workingRoster[tIdx];
            if (tHero.status === "FALLEN") continue;

            const heroMitigatedHit = Math.max(
              4,
              Math.round(
                rawEnemyHit *
                  (targetsFrontline.length > 1 ? 0.75 : 1.0) -
                  (tHero.combatStats?.def || 16) * 0.25
              )
            );
            const prevHp = tHero.currentHp ?? tHero.combatStats?.maxHp ?? 100;
            const nextHp = prevHp - heroMitigatedHit;

            if (nextHp > 0) {
              workingRoster[tIdx] = {
                ...tHero,
                currentHp: nextHp,
              };
              turnEvents.push(
                `${tHero.heroineName} weathered [${intent.label}] (-${heroMitigatedHit} HP -> ${nextHp}/${
                  tHero.combatStats?.maxHp || 100
                } HP).`
              );
            } else if (tHero.status !== "WOUNDED") {
              // STAGE 1 PROTECTION: DEPLOYED -> WOUNDED (Ally Rescue prevents cheap one-shot permadeath!)
              const rescuedStats = hydrateRosterEntryStats({
                ...tHero,
                status: "WOUNDED",
                currentHp: Math.max(
                  12,
                  Math.round((tHero.combatStats?.maxHp || 100) * 0.18)
                ),
              });
              workingRoster[tIdx] = rescuedStats;
              newlyWoundedHeroines.push(tHero.heroineName);
              turnEvents.push(
                `[ALLY RESCUE — CRITICAL WOUND!] ${tHero.heroineName} was knocked to 0 HP by [${intent.label}], but ${params.protagonistName} yanked her clear of the killing blow! She is now [WOUNDED] (-30% stats; swap her to Reserve immediately—another lethal hit before a Safe Zone will be fatal!).`
              );

              // Auto-emergency rotate a healthy Reserve heroine in if one is waiting!
              const healthyReserveIdx = workingRoster.findIndex(
                (r, idx) =>
                  idx !== tIdx &&
                  r.status === "DEPLOYED" &&
                  r.formationSlot === "RESERVE"
              );
              if (healthyReserveIdx >= 0) {
                workingRoster[tIdx] = {
                  ...workingRoster[tIdx],
                  formationSlot: "RESERVE",
                };
                workingRoster[healthyReserveIdx] = {
                  ...workingRoster[healthyReserveIdx],
                  formationSlot: "FRONTLINE",
                };
                turnEvents.push(
                  `[EMERGENCY COVER] ${workingRoster[healthyReserveIdx].heroineName} vaulted from Rearguard Reserve to shield the wounded ${tHero.heroineName}!`
                );
                refreshSquadLists();
              }
            } else {
              // STAGE 2: ALREADY WOUNDED + UNSHIELDED LETHAL BLOW -> TRUE PERMADEATH!
              const cause = `Fell on Floor ${activeFloor} shielding the Vanguard against ${enc.enemyName}'s ${intent.label}`;
              newlyFallenHeroines.push({ name: tHero.heroineName, cause });
              turnEvents.push(
                `[IRREVERSIBLE CASUALTY] Already [WOUNDED], ${tHero.heroineName} took the full brunt of ${enc.enemyName}'s [${intent.label}] and shattered into fading starlight on Floor ${activeFloor}...`
              );
            }
          }
        }

        // Apply Enemy Status Condition on un-parried strikes
        if (
          intent.appliesCondition &&
          defenseRoll.outcome !== "CRITICAL_BREACH"
        ) {
          if (intent.appliesCondition === "TIME_REWIND") {
            const rewindHeal = Math.round(enc.enemyMaxHp * 0.12);
            enc.enemyHp = Math.min(enc.enemyMaxHp, enc.enemyHp + rewindHeal);
            enc.enemyPoise = Math.min(enc.enemyMaxPoise, enc.enemyPoise + 25);
            turnEvents.push(
              `[TIME REWIND] ${enc.enemyName} reversed its wounds (+${rewindHeal} HP, +25 Poise)!`
            );
          } else if (intent.appliesCondition === "MANA_DRAIN") {
            protagonistMpDelta -= 10;
            workingRoster = workingRoster.map((r) =>
              (r.status === "DEPLOYED" || r.status === "WOUNDED") &&
              (targetsFrontline.length === 0 ||
                isAoEIntent ||
                targetsFrontline.some((fn) => matchesHeroineName(r.heroineName, fn)))
                ? { ...r, currentMp: Math.max(0, (r.currentMp ?? 40) - 12) }
                : r
            );
            turnEvents.push(
              `[MANA DRAIN] ${enc.enemyName}'s [${intent.label}] siphoned -10 MP (${params.protagonistName}) & -12 MP from targeted allies!`
            );
          } else {
            const condType = intent.appliesCondition;
            const condTarget =
              isAoEIntent
                ? "PARTY"
                : targetsFrontline[0] || "PROTAGONIST";
            const dur = condType === "STUN" ? 1 : 2;
            const nextConds = (enc.activeConditions || []).filter(
              (c) => !(c.type === condType && c.target === condTarget)
            );
            nextConds.push({
              type: condType,
              turnsRemaining: dur,
              target: condTarget,
            });
            enc.activeConditions = nextConds;
            syncRosterConditions();
            turnEvents.push(
              `[CONDITION INFLICTED: ${condType}] ${enc.enemyName}'s [${intent.label}] afflicted ${
                condTarget === "PARTY" ? "Frontline Squad" : condTarget
              } for ${dur} turn(s)!`
            );
          }
        }

        // Sir Roland Vance Dyad Passive: Silver Counter-Riposte on Clean/Crit Guard
        if (
          hasRolandFrontline &&
          (defenseRoll.outcome === "CLEAN_HIT" ||
            defenseRoll.outcome === "CRITICAL_BREACH")
        ) {
          const riposteDmg = Math.max(12, 20 + activeFloor * 2);
          const ripostePoise = 18;
          enc.enemyHp = Math.max(0, enc.enemyHp - riposteDmg);
          enc.enemyPoise = Math.max(0, enc.enemyPoise - ripostePoise);
          turnEvents.push(
            `[SILVER COUNTER-RIPOSTE] Sir Roland Vance parried [${intent.label}] and counter-thrust for ${riposteDmg} DMG & ${ripostePoise} Poise!`
          );
          if (enc.enemyHp <= 0) {
            return finalizeVictoryReturn();
          }
        }
      }
    }
  }

  // =========================================================================
  // 5. REARGUARD RESERVE RECOVERY & NEXT TURN TELEGRAPH
  // =========================================================================
  workingRoster = workingRoster.map((r) => {
    if (
      (r.status === "DEPLOYED" || r.status === "WOUNDED") &&
      r.formationSlot === "RESERVE"
    ) {
      const maxMp = r.combatStats?.maxMp || 65;
      const maxHp = r.combatStats?.maxHp || 95;
      const mpGain = Math.max(5, Math.round(maxMp * 0.08));
      const hpGain = Math.max(4, Math.round(maxHp * 0.04));
      return {
        ...r,
        currentMp: Math.min(maxMp, (r.currentMp ?? maxMp) + mpGain),
        currentHp: Math.min(maxHp, (r.currentHp ?? maxHp) + hpGain),
      };
    }
    return r;
  });

  // Apply Eclipse Sanctum Blood-Tax / Drain flavor (-2 MP on active cast) or Astral Singularity crit resonance
  let postTurnState: LabyrinthState = {
    ...stateWithEnc,
    masterTrust: Math.max(
      0,
      Math.min(100, (stateWithEnc.masterTrust ?? 35) + trustDelta)
    ),
    roster: workingRoster,
  };

  for (const fallen of newlyFallenHeroines) {
    postTurnState = resolveHeroCasualty(
      postTurnState,
      fallen.name,
      fallen.cause,
      [...enc.frontlineHeroines, ...enc.reserveHeroines]
    );
  }
  workingRoster = postTurnState.roster;
  refreshSquadLists();

  enc.turnNumber += 1;
  const enemyHpRatio = enc.enemyMaxHp > 0 ? enc.enemyHp / enc.enemyMaxHp : 0.5;
  enc.currentTelegraph = pickNextEnemyTelegraph(
    activeFloor,
    enc.turnNumber,
    enemyHpRatio,
    seed,
    enc.enemyId
  );
  enc.lastDiceRolls = diceRolls;
  enc.combatLog = [...enc.combatLog, ...turnEvents].slice(-12);
  enc.combatTelemetrySummary = buildCombatTelemetryBlock(
    enc,
    diceRolls,
    turnEvents,
    workingRoster,
    0,
    0
  );

  postTurnState = {
    ...postTurnState,
    activeEncounter: enc,
  };

  return {
    nextLabyrinthState: postTurnState,
    encounter: enc,
    protagonistHpDelta,
    protagonistMpDelta,
    expAwarded: 0,
    shardsAwarded: 0,
    trustDelta,
    newlyWoundedHeroines,
    newlyFallenHeroines,
    diceRolls,
    combatTelemetryBlock: enc.combatTelemetrySummary,
  };
}

function buildCombatTelemetryBlock(
  enc: StarfallCombatState,
  diceRolls: StarfallDiceRollRecord[],
  turnEvents: string[],
  roster: HeroRosterEntry[],
  expAwarded: number,
  shardsAwarded: number
): string {
  const rollLines = diceRolls.map((d) => `  • ${d.summaryText}`).join("\n");
  const squadLines = roster
    .filter((r) => r.status === "DEPLOYED" || r.status === "WOUNDED")
    .map(
      (r) =>
        `  • ${r.heroineName} [${r.formationSlot || "FRONTLINE"} | ${r.starRank}★ Lv.${
          r.level
        }${r.status === "WOUNDED" ? " | CRITICAL WOUNDED" : ""}${
          r.negativeSwitchActive ? " | NEGATIVE SWITCH ACTIVE" : ""
        }]: HP ${r.currentHp ?? r.combatStats?.maxHp ?? 100}/${
          r.combatStats?.maxHp ?? 100
        }, MP ${r.currentMp ?? r.combatStats?.maxMp ?? 60}/${
          r.combatStats?.maxMp ?? 60
        }`
    )
    .join("\n");

  return `
=== [DETERMINISTIC STARFALL COMBAT ENGINE TELEMETRY — NARRATE THIS OUTCOME VIVIDLY] ===
- Floor & Stratum: Floor ${enc.floor} — ${enc.themeName} | Room: ${enc.layoutName} (${enc.layoutGeometry})
- Enemy Status: ${enc.enemyName} (${enc.enemyTitle}) — HP ${enc.enemyHp}/${enc.enemyMaxHp} | Poise ${enc.enemyPoise}/${enc.enemyMaxPoise}${
    enc.isEnemyBroken ? " [POISE BROKEN / STAGGERED!]" : ""
  }${enc.hexSealsOnEnemy > 0 ? ` | Hex Seals: ${enc.hexSealsOnEnemy}/5` : ""}${
    enc.enemyResistances && enc.enemyResistances.length > 0
      ? ` | Resists: ${enc.enemyResistances.join(", ")}`
      : ""
  } | Status: ${enc.status.toUpperCase()}${
    enc.activeConditions && enc.activeConditions.length > 0
      ? `\n- Active Conditions: ${enc.activeConditions.map((c) => `${c.type} on ${c.target} (${c.turnsRemaining}T)`).join(", ")}`
      : ""
  }
- Hidden Tabletop Dice Rolls (Translate into visceral combat choreography—DO NOT print raw d20 math in story prose!):
${rollLines || "  • Direct tactical maneuver executed."}
- Turn Resolution Beat-by-Beat:
${turnEvents.map((e) => `  • ${e}`).join("\n")}
- Squad Vitality After Exchange:
${squadLines || "  • Solo Vanguard."}
${
  enc.status === "ongoing"
    ? `- NEXT ENEMY TELEGRAPH (Foreshadow this threat at the end of the beat!): [${enc.currentTelegraph.label}] — ${enc.currentTelegraph.telegraphText}`
    : expAwarded > 0
    ? `- Floor Clear Spoils: +${expAwarded} EXP, +${shardsAwarded} Star Shards.`
    : ""
}`.trim();
}
