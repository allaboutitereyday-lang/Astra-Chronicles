/**
 * Starfall Labyrinth Core Deterministic Engine
 * Pure, unit-testable mechanics for:
 * 1. Star Gate Gacha Summoning (12-Heroine Pool, Seeded RNG, 1★–5★ rates, 90-pull 5★ pity, Lobby-Only lock)
 * 2. Hard Star Level Caps (1★=20 .. 5★=60), Concrete Star Stat Scaling & Resonance Awakening (+1★ at 25/50/75/90% affection)
 * 3. Vanguard (2) & Rearguard Reserve (2) Formation Management + Safe-Zone Wound Recovery
 * 4. 100-Floor Shifting Strata Progression (4×25-Floor Themes, Safe Zones, Gate & Threshold Bosses, Beyond Memory)
 * 5. Two-Stage Wounded -> Irreversible Permadeath & Memorial Wall (Fallen heroes never return)
 * 6. Unseen Master Trust & Command Seal Telemetry + Anti-Hallucination Turn Directive Builder
 */

import {
  StarRank,
  StarfallOrigin,
  HeroStatus,
  FormationSlot,
  HeroCombatStats,
  FloorType,
  HeroRosterEntry,
  LabyrinthState,
  STARFALL_ORIGIN_PRESETS,
  STARFALL_HEROINE_DOSSIERS,
  STARFALL_COVENANT_RULES,
  STARFALL_FLOOR_CANON,
  STARFALL_ANTAGONIST_DOSSIERS,
} from "@/types/starfall_labyrinth";
import { StoryCompanion } from "@/types/story";
import {
  getRequiredExpForLevel,
  COMPANION_SHARED_EXP_RATIO,
} from "@/lib/progressionMechanics";
import {
  getCuratedStratumBestiarySummary,
  getTowerThemeForFloor,
  getFloorLayout,
} from "@/lib/starfallTowerThemes";

export const STAR_LEVEL_CAPS: Record<StarRank, number> = {
  1: 20,
  2: 30,
  3: 40,
  4: 50,
  5: 60,
};

export const STAR_STAT_MULTIPLIERS: Record<StarRank, number> = {
  1: 1.0,
  2: 1.18,
  3: 1.38,
  4: 1.62,
  5: 1.9,
};

export const SUMMON_RATES: Record<StarRank, number> = {
  5: 0.005, // 0.5%
  4: 0.045, // 4.5%
  3: 0.15,  // 15.0%
  2: 0.30,  // 30.0%
  1: 0.50,  // 50.0%
};

export const SUMMON_COST = 30;
export const SUMMON_TEN_COST = 300;
export const PITY_THRESHOLD = 90;
export const MAX_DEPLOYED_PARTY = 4; // Up to 4 heroines (2 Frontline + 2 Reserve) + Protagonist = 5-hero squad
export const MAX_FRONTLINE_HEROINES = 2;
export const MAX_RESERVE_HEROINES = 2;

export const DUPLICATE_SHARD_REFUND: Record<StarRank, number> = {
  1: 8,
  2: 12,
  3: 18,
  4: 24,
  5: 45,
};

export const AWAKENING_AFFECTION_MILESTONES = [25, 50, 75, 90] as const;

export const SUMMON_POOL_BY_STAR: Record<
  StarRank,
  { id: string; name: string; baseStarRank: StarRank; spriteSlug: string }[]
> = {
  1: [
    { id: "comp_pia", name: "Pia Hollis", baseStarRank: 1, spriteSlug: "pia_hollis" },
    { id: "comp_lotte", name: "Lotte Klein", baseStarRank: 1, spriteSlug: "lotte_klein" },
  ],
  2: [
    { id: "comp_sable", name: "Sable Ashgrove", baseStarRank: 2, spriteSlug: "sable_ashgrove" },
    { id: "comp_onyxia", name: "Onyxia Cryss", baseStarRank: 2, spriteSlug: "onyxia_cryss" },
    { id: "comp_vaelkor", name: "Vaelkor", baseStarRank: 2, spriteSlug: "vaelkor" },
  ],
  3: [
    { id: "comp_odette", name: "Dame Odette Varr", baseStarRank: 3, spriteSlug: "odette_varr" },
    { id: "comp_trinity", name: "Trinity Valoren", baseStarRank: 3, spriteSlug: "trinity_valoren" },
    { id: "comp_abraxia", name: "Abraxia", baseStarRank: 3, spriteSlug: "abraxia" },
    { id: "comp_garrick", name: "Garrick Ironbrow", baseStarRank: 3, spriteSlug: "garrick_ironbrow" },
  ],
  4: [
    { id: "comp_lyra", name: "Lyra Nocturne", baseStarRank: 4, spriteSlug: "lyra_nocturne" },
    { id: "comp_mei", name: "Mei Zhou", baseStarRank: 4, spriteSlug: "mei_zhou" },
    { id: "comp_godiva", name: "Godiva", baseStarRank: 4, spriteSlug: "godiva" },
    { id: "comp_roland", name: "Sir Roland Vance", baseStarRank: 4, spriteSlug: "roland_vance" },
  ],
  5: [
    { id: "comp_aurelle", name: "Aurelle, the Seraph Lance", baseStarRank: 5, spriteSlug: "aurelle_seraph" },
  ],
};

export interface SummonPullResult {
  pullNumber: number;
  heroineId: string;
  heroineName: string;
  spriteSlug?: string;
  summonQuote?: string;
  epithet?: string;
  starRank: StarRank;
  isNew: boolean;
  isDuplicate: boolean;
  isFallenEcho: boolean;
  isPityTriggered: boolean;
  shardsRefunded: number;
  awakenedToRank?: StarRank;
}

/**
 * Deterministic 32-bit FNV-1a string hash + Mulberry32 PRNG step.
 */
export function hashSeedToUint32(seed: string): number {
  let h = 0x811c9dc5;
  const s = String(seed || "starfall-default-seed");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function seededRandomFloat(seed: string): number {
  let t = (hashSeedToUint32(seed) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Resolves the canonical dossier for a heroine name or ID.
 */
export function getHeroineDossier(nameOrId?: string | null) {
  if (!nameOrId) return undefined;
  if (STARFALL_HEROINE_DOSSIERS[nameOrId]) return STARFALL_HEROINE_DOSSIERS[nameOrId];
  return Object.values(STARFALL_HEROINE_DOSSIERS).find((d) =>
    matchesHeroineName(d.name, nameOrId, d.id)
  );
}

/**
 * Computes concrete combat stats for any Starfall heroine (or protagonist) given Star Rank, Level, Awakenings, and Wounded status.
 */
export function computeHeroCombatStats(params: {
  heroineName?: string;
  starRank: StarRank;
  level: number;
  awakenings?: number;
  isWounded?: boolean;
}): HeroCombatStats {
  const clampedStar = Math.max(1, Math.min(5, Math.round(params.starRank || 1))) as StarRank;
  const safeLevel = Math.max(1, Math.min(60, Math.round(params.level || 1)));
  const safeAwakenings = Math.max(0, Math.min(4, Math.round(params.awakenings || 0)));
  const dossier = getHeroineDossier(params.heroineName);
  const roleArch = dossier?.roleArchetype || "DUELIST";

  let baseHp = 95;
  let baseMp = 65;
  let baseAtk = 22;
  let baseDef = 16;
  let baseSpd = 20;
  let baseCrit = 10;
  let baseEva = 10;

  switch (roleArchetypeNormalize(roleArch)) {
    case "TANK":
      baseHp = 135;
      baseMp = 60;
      baseAtk = 20;
      baseDef = 28;
      baseSpd = 16;
      baseCrit = 8;
      baseEva = 8;
      break;
    case "HEALER":
      baseHp = 92;
      baseMp = 95;
      baseAtk = 18;
      baseDef = 17;
      baseSpd = 19;
      baseCrit = 8;
      baseEva = 12;
      break;
    case "ROGUE":
      baseHp = 88;
      baseMp = 65;
      baseAtk = 26;
      baseDef = 14;
      baseSpd = 28;
      baseCrit = 22;
      baseEva = 22;
      break;
    case "DUELIST":
      baseHp = 96;
      baseMp = 70;
      baseAtk = 26;
      baseDef = 16;
      baseSpd = 27;
      baseCrit = 20;
      baseEva = 24;
      break;
    case "GUNNER":
      baseHp = 94;
      baseMp = 75;
      baseAtk = 25;
      baseDef = 18;
      baseSpd = 23;
      baseCrit = 18;
      baseEva = 15;
      break;
    case "MAGE":
      baseHp = 86;
      baseMp = 105;
      baseAtk = 30;
      baseDef = 14;
      baseSpd = 21;
      baseCrit = 16;
      baseEva = 14;
      break;
    case "BRAWLER":
      baseHp = 118;
      baseMp = 68;
      baseAtk = 28;
      baseDef = 21;
      baseSpd = 22;
      baseCrit = 16;
      baseEva = 13;
      break;
    case "LANCER":
      baseHp = 116;
      baseMp = 80;
      baseAtk = 32;
      baseDef = 22;
      baseSpd = 25;
      baseCrit = 20;
      baseEva = 16;
      break;
  }

  const starMult = STAR_STAT_MULTIPLIERS[clampedStar] || 1.0;
  const levelMult = 1 + (safeLevel - 1) * 0.042;
  const awakenMult = 1 + safeAwakenings * 0.045;
  const woundedPenalty = params.isWounded ? 0.7 : 1.0;
  const totalMult = starMult * levelMult * awakenMult * woundedPenalty;

  return {
    maxHp: Math.max(40, Math.round(baseHp * totalMult)),
    maxMp: Math.max(30, Math.round(baseMp * (1 + (safeLevel - 1) * 0.028) * (1 + (clampedStar - 1) * 0.12))),
    atk: Math.max(8, Math.round(baseAtk * totalMult)),
    def: Math.max(6, Math.round(baseDef * totalMult)),
    spd: Math.max(8, Math.round(baseSpd * (1 + (clampedStar - 1) * 0.08 + (safeLevel - 1) * 0.02) * woundedPenalty)),
    critRate: Math.min(65, Math.round((baseCrit + (clampedStar - 1) * 3 + safeAwakenings * 2) * woundedPenalty)),
    evasion: Math.min(55, Math.round((baseEva + (clampedStar - 1) * 2 + safeAwakenings * 2) * woundedPenalty)),
  };
}

function roleArchetypeNormalize(r: string) {
  return r || "DUELIST";
}

/**
 * Hydrates combatStats, currentHp/Mp, and formationSlot on a HeroRosterEntry while preserving existing battlefield damage.
 */
export function hydrateRosterEntryStats(
  entry: HeroRosterEntry,
  preferredSlot?: FormationSlot
): HeroRosterEntry {
  if (!entry) return entry;
  const isWounded = entry.status === "WOUNDED";
  const stats = computeHeroCombatStats({
    heroineName: entry.heroineName,
    starRank: entry.starRank,
    level: entry.level || 1,
    awakenings: entry.awakenings || 0,
    isWounded,
  });

  const isActiveSquad = entry.status === "DEPLOYED" || entry.status === "WOUNDED";
  const slot: FormationSlot | undefined = isActiveSquad
    ? entry.formationSlot || preferredSlot || "FRONTLINE"
    : entry.formationSlot;

  const prevMaxHp = entry.combatStats?.maxHp || stats.maxHp;
  const prevHp = typeof entry.currentHp === "number" ? entry.currentHp : stats.maxHp;
  const hpRatio = prevMaxHp > 0 ? Math.min(1, Math.max(0, prevHp / prevMaxHp)) : 1;

  const nextHp =
    entry.status === "FALLEN"
      ? 0
      : typeof entry.currentHp === "number"
      ? Math.max(1, Math.min(stats.maxHp, stats.maxHp > prevMaxHp ? Math.round(hpRatio * stats.maxHp) : entry.currentHp))
      : stats.maxHp;

  const nextMp =
    entry.status === "FALLEN"
      ? 0
      : typeof entry.currentMp === "number"
      ? Math.max(0, Math.min(stats.maxMp, entry.currentMp))
      : stats.maxMp;

  return {
    ...entry,
    formationSlot: slot,
    combatStats: stats,
    currentHp: nextHp,
    currentMp: nextMp,
  };
}

/**
 * Balances Frontline (max 2) and Reserve (max 2) slots across all DEPLOYED/WOUNDED heroines in a roster.
 */
export function normalizeSquadFormations(roster: HeroRosterEntry[]): HeroRosterEntry[] {
  let frontlineCount = 0;
  let reserveCount = 0;

  return (roster || []).map((raw) => {
    if (raw.status !== "DEPLOYED" && raw.status !== "WOUNDED") {
      return hydrateRosterEntryStats(raw);
    }
    let desired: FormationSlot = raw.formationSlot || "FRONTLINE";
    // Wounded heroines default to Reserve if space is open
    if (raw.status === "WOUNDED" && !raw.formationSlot && reserveCount < MAX_RESERVE_HEROINES) {
      desired = "RESERVE";
    }
    if (desired === "FRONTLINE") {
      if (frontlineCount < MAX_FRONTLINE_HEROINES) {
        frontlineCount += 1;
      } else {
        desired = "RESERVE";
        reserveCount += 1;
      }
    } else {
      if (reserveCount < MAX_RESERVE_HEROINES) {
        reserveCount += 1;
      } else if (frontlineCount < MAX_FRONTLINE_HEROINES) {
        desired = "FRONTLINE";
        frontlineCount += 1;
      }
    }
    return hydrateRosterEntryStats({ ...raw, formationSlot: desired }, desired);
  });
}

/**
 * Restores WOUNDED status back to DEPLOYED and refills all living roster HP/MP at Safe Zones or Main Lobby.
 */
export function healRosterAtSafeZoneOrLobby(state: LabyrinthState): LabyrinthState {
  if (!state) return state;
  const healedRoster = normalizeSquadFormations(
    (state.roster || []).map((r) => {
      if (r.status === "FALLEN") return r;
      const restoredStatus: HeroStatus = r.status === "WOUNDED" ? "DEPLOYED" : r.status;
      const stats = computeHeroCombatStats({
        heroineName: r.heroineName,
        starRank: r.starRank,
        level: r.level || 1,
        awakenings: r.awakenings || 0,
        isWounded: false,
      });
      return {
        ...r,
        status: restoredStatus,
        combatStats: stats,
        currentHp: stats.maxHp,
        currentMp: stats.maxMp,
        swapCooldown: 0,
        skillCooldowns: {},
        activeConditions: [],
        negativeSwitchActive: false,
      };
    })
  );
  return {
    ...state,
    roster: healedRoster,
    activeEncounter: null,
  };
}

/**
 * Swaps a deployed heroine between FRONTLINE and RESERVE in the Barracks (auto-swapping with another teammate if the target row is full).
 */
export function toggleHeroFormationSlot(
  state: LabyrinthState,
  heroineName: string
): LabyrinthState {
  if (!state) return state;
  const roster = [...(state.roster || [])];
  const idx = roster.findIndex((r) =>
    matchesHeroineName(r.heroineName, heroineName, r.heroineId)
  );
  if (idx < 0) return state;
  const target = roster[idx];
  if (target.status !== "DEPLOYED" && target.status !== "WOUNDED") return state;

  const nextSlot: FormationSlot =
    target.formationSlot === "RESERVE" ? "FRONTLINE" : "RESERVE";

  const maxForSlot =
    nextSlot === "FRONTLINE" ? MAX_FRONTLINE_HEROINES : MAX_RESERVE_HEROINES;

  const occupantsInDest = roster
    .map((r, i) => ({ r, i }))
    .filter(
      ({ r, i }) =>
        i !== idx &&
        (r.status === "DEPLOYED" || r.status === "WOUNDED") &&
        (r.formationSlot || "FRONTLINE") === nextSlot
    );

  if (occupantsInDest.length >= maxForSlot) {
    // Trade slots with the last occupant in destination row
    const tradePartnerIdx = occupantsInDest[occupantsInDest.length - 1].i;
    roster[tradePartnerIdx] = {
      ...roster[tradePartnerIdx],
      formationSlot: target.formationSlot || "FRONTLINE",
    };
  }

  roster[idx] = {
    ...target,
    formationSlot: nextSlot,
  };

  return {
    ...state,
    roster: normalizeSquadFormations(roster),
  };
}

/**
 * Checks whether the player's active location is the Main Lobby (Star Gate Plaza),
 * where Star Gate summoning is exclusively accessible.
 */
export function isStarfallLobbyLocation(location?: string | null): boolean {
  if (!location || typeof location !== "string") return false;
  const loc = location.trim().toLowerCase();
  if (/\bfloor\s+[1-9]\d*\b/i.test(loc)) {
    return false;
  }
  return (
    loc.includes("star gate plaza") ||
    loc.includes("main lobby") ||
    loc.includes("floating lobby") ||
    loc.includes("lobby island") ||
    loc === "lobby" ||
    loc.includes("floor 0")
  );
}

/**
 * Checks whether a location string refers to an active Labyrinth dungeon floor/room
 * (as opposed to Star Gate Plaza or another Floating Lobby Island sanctuary).
 */
export function isStarfallDungeonLocation(location?: string | null): boolean {
  if (!location || typeof location !== "string") return false;
  if (isStarfallLobbyLocation(location)) return false;
  const loc = location.trim().toLowerCase();
  if (
    loc.includes("iron barracks") ||
    loc.includes("memorial wall") ||
    loc.includes("memorial sanctum") ||
    loc.includes("conduit chamber") ||
    loc.includes("master's console") ||
    loc.includes("lobby quarters") ||
    loc.includes("lobby ossuary")
  ) {
    return false;
  }
  if (/\b(?:floor|fl\.?|f)\s*[1-9]\d*\b/i.test(loc)) {
    return true;
  }
  return /\b(dungeon|labyrinth|stratum|tier\s*[i1234v]+|sunken\s*reliquary|verdant\s*antechamber|ossuary|chokepoint|antechamber|ascent|descent|crypt|catacomb|corridor|tunnel|chamber|vault|ruins|sanctum|nave|culvert|bridge|colonnade|spire|transfer\s*ring|trial|arena|gate|foundry|clocktower|singularity|bazaar|oasis)\b/i.test(
    loc
  );
}

/**
 * Parses a Labyrinth floor number from a location name or dungeon landmark if present.
 */
export function inferFloorFromLocation(
  location?: string | null,
  fallbackFloor: number = 0
): number {
  if (!location || typeof location !== "string") return fallbackFloor;
  if (isStarfallLobbyLocation(location)) return 0;
  const loc = location.trim().toLowerCase();
  if (
    loc.includes("iron barracks") ||
    loc.includes("memorial wall") ||
    loc.includes("memorial sanctum") ||
    loc.includes("conduit chamber") ||
    loc.includes("master's console") ||
    loc.includes("lobby quarters") ||
    loc.includes("lobby ossuary")
  ) {
    return 0;
  }
  const match = loc.match(/\b(?:floor|fl\.?)\s*(\d{1,3})\b/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      return parsed;
    }
  }
  if (loc.includes("gate of the hollow king") || loc.includes("hollow king")) {
    return 10;
  }
  if (loc.includes("clocktower ruins")) {
    return 25;
  }
  if (loc.includes("cinder horizon") || loc.includes("unwound sun")) {
    return 40;
  }
  if (loc.includes("crimson trial court")) {
    return 70;
  }
  if (loc.includes("administrator's crown") || loc.includes("starfall summit")) {
    return 100;
  }
  if (loc.includes("lantern bazaar")) {
    return fallbackFloor > 0 && fallbackFloor % 10 === 5 ? fallbackFloor : 5;
  }
  if (loc.includes("sky-sanctum") || loc.includes("lantern sky")) {
    return fallbackFloor >= 35 && fallbackFloor % 10 === 5 ? fallbackFloor : 35;
  }
  if (loc.includes("verdant antechamber")) {
    return fallbackFloor >= 1 && fallbackFloor <= 9 ? fallbackFloor : 1;
  }
  if (
    loc.includes("chronos foundry") ||
    loc.includes("escapement") ||
    loc.includes("slag")
  ) {
    return fallbackFloor >= 26 && fallbackFloor <= 50 ? fallbackFloor : 26;
  }
  if (
    loc.includes("eclipse sanctum") ||
    loc.includes("blood-moon") ||
    loc.includes("inquisition")
  ) {
    return fallbackFloor >= 51 && fallbackFloor <= 75 ? fallbackFloor : 51;
  }
  if (loc.includes("astral singularity") || loc.includes("void bridge")) {
    return fallbackFloor >= 76 && fallbackFloor <= 100 ? fallbackFloor : 76;
  }
  if (isStarfallDungeonLocation(loc)) {
    return fallbackFloor >= 1 ? fallbackFloor : 1;
  }
  return fallbackFloor;
}

/**
 * Classifies any floor (0-100) into its deterministic Covenant floor type.
 */
export function getFloorType(floor: number): FloorType {
  if (floor <= 0) return "LOBBY";
  if (floor % 10 === 0 || floor === 25 || floor === 50 || floor === 75 || floor === 100) {
    return "GATE_BOSS";
  }
  if (floor % 10 === 5) return "SAFE_ZONE";
  if (floor % 7 === 0) return "EVENT";
  return "COMBAT";
}

export function getFloorTypeLabel(floor: number): string {
  if (floor === 25 || floor === 50 || floor === 75 || floor === 100) {
    return "Stratum Threshold Boss";
  }
  const ft = getFloorType(floor);
  switch (ft) {
    case "LOBBY":
      return "Main Lobby";
    case "GATE_BOSS":
      return "Gate Boss";
    case "SAFE_ZONE":
      return "Safe Zone";
    case "EVENT":
      return "Anomaly Event";
    default:
      return "Combat";
  }
}

export function getStarLevelCap(starRank: StarRank = 1): number {
  const clamped = Math.max(1, Math.min(5, Math.round(starRank))) as StarRank;
  return STAR_LEVEL_CAPS[clamped] || 20;
}

/**
 * Null-safe companion/roster matcher.
 */
export function matchesHeroineName(
  candidateName?: string | null,
  targetName?: string | null,
  candidateId?: string | null
): boolean {
  const target = typeof targetName === "string" ? targetName.trim().toLowerCase() : "";
  if (!target) return false;
  const cId = typeof candidateId === "string" ? candidateId.trim().toLowerCase() : "";
  const cName = typeof candidateName === "string" ? candidateName.trim().toLowerCase() : "";
  if (cId && cId === target) return true;
  if (!cName) return false;
  if (cName === target) return true;
  const firstA = cName.split(/[\s,]+/)[0];
  const firstB = target.split(/[\s,]+/)[0];
  return Boolean(firstA && firstB && firstA.length >= 3 && firstA === firstB);
}

/**
 * Creates the initial deterministic LabyrinthState for a chosen StarfallOrigin
 * and starting heroine from the selected Act I node.
 */
export function createInitialLabyrinthState(
  originId: StarfallOrigin | string = "DISCARDED_EX_RANKER",
  opts?: {
    startingHeroineName?: string;
    seed?: string;
  }
): LabyrinthState {
  const preset =
    STARFALL_ORIGIN_PRESETS.find((o) => o.id === originId) ||
    STARFALL_ORIGIN_PRESETS[0];

  const starterName = opts?.startingHeroineName || "Pia Hollis";
  const dossier = getHeroineDossier(starterName) || STARFALL_HEROINE_DOSSIERS["Pia Hollis"];

  const initialEntry = hydrateRosterEntryStats(
    {
      heroineId: dossier.id,
      heroineName: dossier.name,
      starRank: dossier.baseStarRank,
      baseStarRank: dossier.baseStarRank,
      level: 1,
      exp: 0,
      maxExp: getRequiredExpForLevel(1),
      status: "DEPLOYED",
      formationSlot: "FRONTLINE",
      awakenings: 0,
      duplicateCount: 0,
    },
    "FRONTLINE"
  );

  return {
    currentFloor: 0, // Starts in Star Gate Plaza (Main Lobby) before Floor 1 deployment
    highestFloorCleared: 0,
    starShards: preset.startingStarShards,
    pityCounter: 0,
    totalPulls: 0,
    masterTrust: preset.startingMasterTrust,
    protagonistStarRank: preset.startingStarRank,
    isHiddenRarity: Boolean(preset.isHiddenRarity),
    metaKnowledgeCeiling: preset.metaKnowledgeCeiling,
    roster: [initialEntry],
    memorial: [],
    summonSeed: opts?.seed || `starfall_${String(originId || "ranker").toLowerCase()}_s09`,
    activeEncounter: null,
  };
}

/**
 * Rolls 1 or 10 deterministic Star Gate pulls across all 12 heroines.
 */
export function rollSummon(
  state: LabyrinthState,
  seed: string,
  count: 1 | 10,
  currentLocation?: string | null
): {
  results: SummonPullResult[];
  newState: LabyrinthState;
  error?: string;
} {
  if (typeof currentLocation === "string" && !isStarfallLobbyLocation(currentLocation)) {
    return {
      results: [],
      newState: state,
      error: "Summoning is locked outside Star Gate Plaza (Main Lobby).",
    };
  }

  const totalCost = count === 10 ? SUMMON_TEN_COST : SUMMON_COST;
  if ((state.starShards ?? 0) < totalCost) {
    return {
      results: [],
      newState: state,
      error: `Insufficient Star Shards (${state.starShards ?? 0} / ${totalCost} required).`,
    };
  }

  let workingShards = state.starShards - totalCost;
  let workingPity = state.pityCounter || 0;
  let workingTotalPulls = state.totalPulls || 0;
  const workingRoster: HeroRosterEntry[] = (state.roster || []).map((r) => ({ ...r }));
  const results: SummonPullResult[] = [];
  const effectiveSeed = seed || state.summonSeed || "starfall_seed";

  for (let i = 0; i < count; i++) {
    workingTotalPulls += 1;
    workingPity += 1;

    let rolledStar: StarRank = 1;
    let isPityTriggered = false;

    if (workingPity >= PITY_THRESHOLD) {
      rolledStar = 5;
      isPityTriggered = true;
      workingPity = 0;
    } else {
      const r = seededRandomFloat(`${effectiveSeed}:pull:${workingTotalPulls}:star`);
      if (r < SUMMON_RATES[5]) {
        rolledStar = 5;
        workingPity = 0;
      } else if (r < SUMMON_RATES[5] + SUMMON_RATES[4]) {
        rolledStar = 4;
      } else if (r < SUMMON_RATES[5] + SUMMON_RATES[4] + SUMMON_RATES[3]) {
        rolledStar = 3;
      } else if (r < SUMMON_RATES[5] + SUMMON_RATES[4] + SUMMON_RATES[3] + SUMMON_RATES[2]) {
        rolledStar = 2;
      } else {
        rolledStar = 1;
      }
    }

    const pool = SUMMON_POOL_BY_STAR[rolledStar];
    const pickFloat = seededRandomFloat(`${effectiveSeed}:pull:${workingTotalPulls}:unit`);
    const picked = pool[Math.min(pool.length - 1, Math.floor(pickFloat * pool.length))];
    const dossier = getHeroineDossier(picked.name);

    const existingIdx = workingRoster.findIndex((entry) =>
      matchesHeroineName(entry.heroineName, picked.name, entry.heroineId)
    );
    const isMemorialFallen =
      (existingIdx >= 0 && workingRoster[existingIdx].status === "FALLEN") ||
      (state.memorial || []).some((m) => matchesHeroineName(m?.name, picked.name));

    if (isMemorialFallen) {
      const refund = DUPLICATE_SHARD_REFUND[rolledStar] + 5;
      workingShards += refund;
      results.push({
        pullNumber: workingTotalPulls,
        heroineId: picked.id,
        heroineName: picked.name,
        spriteSlug: picked.spriteSlug,
        summonQuote: dossier?.summonQuote,
        epithet: dossier?.epithet,
        starRank: rolledStar,
        isNew: false,
        isDuplicate: false,
        isFallenEcho: true,
        isPityTriggered,
        shardsRefunded: refund,
      });
      continue;
    }

    if (existingIdx >= 0) {
      const current = workingRoster[existingIdx];
      const nextDupes = (current.duplicateCount || 0) + 1;
      const refund = DUPLICATE_SHARD_REFUND[rolledStar];
      workingShards += refund;

      let awakenedToRank: StarRank | undefined;
      let nextRank = current.starRank;
      let nextAwakenings = current.awakenings || 0;
      const canPromoteFromDupe =
        current.starRank < 5 && (rolledStar >= 4 || nextDupes % 2 === 0);
      if (canPromoteFromDupe) {
        nextRank = Math.min(5, current.starRank + 1) as StarRank;
        nextAwakenings = Math.min(4, nextAwakenings + 1);
        awakenedToRank = nextRank;
      }

      workingRoster[existingIdx] = hydrateRosterEntryStats({
        ...current,
        starRank: nextRank,
        awakenings: nextAwakenings,
        duplicateCount: nextDupes,
      });

      results.push({
        pullNumber: workingTotalPulls,
        heroineId: picked.id,
        heroineName: picked.name,
        spriteSlug: picked.spriteSlug,
        summonQuote: dossier?.summonQuote,
        epithet: dossier?.epithet,
        starRank: rolledStar,
        isNew: false,
        isDuplicate: true,
        isFallenEcho: false,
        isPityTriggered,
        shardsRefunded: refund,
        awakenedToRank,
      });
    } else {
      const deployedEntries = workingRoster.filter(
        (r) => r.status === "DEPLOYED" || r.status === "WOUNDED"
      );
      const initialStatus: HeroStatus =
        deployedEntries.length < MAX_DEPLOYED_PARTY ? "DEPLOYED" : "BENCHED";
      const frontlineCount = deployedEntries.filter(
        (r) => (r.formationSlot || "FRONTLINE") === "FRONTLINE"
      ).length;
      const initialSlot: FormationSlot | undefined =
        initialStatus === "DEPLOYED"
          ? frontlineCount < MAX_FRONTLINE_HEROINES
            ? "FRONTLINE"
            : "RESERVE"
          : undefined;

      workingRoster.push(
        hydrateRosterEntryStats(
          {
            heroineId: picked.id,
            heroineName: picked.name,
            starRank: picked.baseStarRank,
            baseStarRank: picked.baseStarRank,
            level: 1,
            exp: 0,
            maxExp: getRequiredExpForLevel(1),
            status: initialStatus,
            formationSlot: initialSlot,
            awakenings: 0,
            duplicateCount: 0,
          },
          initialSlot
        )
      );

      results.push({
        pullNumber: workingTotalPulls,
        heroineId: picked.id,
        heroineName: picked.name,
        spriteSlug: picked.spriteSlug,
        summonQuote: dossier?.summonQuote,
        epithet: dossier?.epithet,
        starRank: picked.baseStarRank,
        isNew: true,
        isDuplicate: false,
        isFallenEcho: false,
        isPityTriggered,
        shardsRefunded: 0,
      });
    }
  }

  return {
    results,
    newState: {
      ...state,
      starShards: workingShards,
      pityCounter: workingPity,
      totalPulls: workingTotalPulls,
      roster: normalizeSquadFormations(workingRoster),
    },
  };
}

/**
 * Applies Resonance Awakening (+1★ per affection milestone: 25, 50, 75, 90), capped at 5★.
 * Never modifies FALLEN entries.
 */
export function applyAwakening(
  entry: HeroRosterEntry,
  affection: number
): HeroRosterEntry {
  if (!entry || entry.status === "FALLEN") return entry;
  const safeAffection = Math.max(0, Math.min(100, affection || 0));
  const earnedMilestones = AWAKENING_AFFECTION_MILESTONES.filter(
    (m) => safeAffection >= m
  ).length;
  const baseRank = entry.baseStarRank || entry.starRank || 1;
  const nextAwakenings = Math.min(4, Math.max(entry.awakenings || 0, earnedMilestones));
  const nextStarRank = Math.min(5, baseRank + nextAwakenings) as StarRank;

  return hydrateRosterEntryStats({
    ...entry,
    awakenings: nextAwakenings,
    starRank: Math.max(entry.starRank, nextStarRank) as StarRank,
  });
}

/**
 * Applies EXP to a HeroRosterEntry using the steep 1.35x RPG curve while strictly enforcing STAR_LEVEL_CAPS.
 */
export function applyLevelGain(
  entry: HeroRosterEntry,
  expGained: number
): HeroRosterEntry {
  if (!entry || entry.status === "FALLEN") return entry;
  const cap = getStarLevelCap(entry.starRank);
  if (entry.level >= cap) {
    return hydrateRosterEntryStats({
      ...entry,
      level: cap,
      exp: 0,
      maxExp: getRequiredExpForLevel(cap),
    });
  }
  if (expGained <= 0) {
    const safeLvl = Math.max(1, entry.level || 1);
    return hydrateRosterEntryStats({
      ...entry,
      level: safeLvl,
      maxExp: getRequiredExpForLevel(safeLvl),
    });
  }

  let curLevel = Math.max(1, entry.level || 1);
  let curMaxExp = getRequiredExpForLevel(curLevel);
  let curExp = Math.max(0, (entry.exp || 0) + Math.round(expGained));

  while (curExp >= curMaxExp && curLevel < cap) {
    curExp -= curMaxExp;
    curLevel += 1;
    curMaxExp = getRequiredExpForLevel(curLevel);
  }

  if (curLevel >= cap) {
    curLevel = cap;
    curExp = 0;
    curMaxExp = getRequiredExpForLevel(cap);
  }

  return hydrateRosterEntryStats({
    ...entry,
    level: curLevel,
    exp: curExp,
    maxExp: curMaxExp,
  });
}

/**
 * Clamps protagonist level/exp progression against their current Star Rank level cap.
 */
export function clampProtagonistStarLevel(params: {
  level: number;
  exp: number;
  maxExp: number;
  starRank: StarRank;
}): { level: number; exp: number; maxExp: number; hitCap: boolean } {
  const cap = getStarLevelCap(params.starRank);
  if (params.level >= cap) {
    return {
      level: cap,
      exp: 0,
      maxExp: getRequiredExpForLevel(cap),
      hitCap: true,
    };
  }
  return {
    level: params.level,
    exp: params.exp,
    maxExp: getRequiredExpForLevel(params.level),
    hitCap: false,
  };
}

/**
 * Permanently marks a DEPLOYED/WOUNDED heroine as FALLEN and records her on the Memorial Wall.
 * Benched heroines or heroines not in the active deployment list are strictly protected.
 */
export function resolveHeroCasualty(
  state: LabyrinthState,
  name: string,
  cause: string,
  deployedNames?: string[]
): LabyrinthState {
  if (!state || !name || typeof name !== "string") return state;

  const targetIdx = (state.roster || []).findIndex((r) =>
    matchesHeroineName(r?.heroineName, name, r?.heroineId)
  );

  if (targetIdx >= 0) {
    const existing = state.roster[targetIdx];
    if (existing.status === "BENCHED" || existing.status === "FALLEN") {
      return state;
    }
  } else if (Array.isArray(deployedNames) && deployedNames.length > 0) {
    const isActuallyDeployed = deployedNames.some((dn) => matchesHeroineName(dn, name));
    if (!isActuallyDeployed) {
      return state;
    }
  } else {
    return state;
  }

  if (Array.isArray(deployedNames) && deployedNames.length > 0) {
    const isDeployed = deployedNames.some((dn) => matchesHeroineName(dn, name));
    if (!isDeployed) {
      return state;
    }
  }

  const casualtyFloor = Math.max(1, state.currentFloor || 1);
  const canonicalName =
    targetIdx >= 0 ? state.roster[targetIdx].heroineName : name.trim();
  const cleanCause =
    typeof cause === "string" && cause.trim()
      ? cause.trim()
      : `Fell in combat on Floor ${casualtyFloor}`;

  const nextRoster = (state.roster || []).map((r, idx) =>
    idx === targetIdx
      ? {
          ...r,
          status: "FALLEN" as HeroStatus,
          currentHp: 0,
          currentMp: 0,
          fallenOnFloor: casualtyFloor,
          fallenCause: cleanCause,
        }
      : r
  );

  const alreadyInMemorial = (state.memorial || []).some((m) =>
    matchesHeroineName(m?.name, canonicalName)
  );
  const nextMemorial = alreadyInMemorial
    ? state.memorial
    : [
        ...(state.memorial || []),
        {
          name: canonicalName,
          starRank: targetIdx >= 0 ? state.roster[targetIdx].starRank : undefined,
          level: targetIdx >= 0 ? state.roster[targetIdx].level : undefined,
          floor: casualtyFloor,
          cause: cleanCause,
        },
      ];

  return {
    ...state,
    roster: normalizeSquadFormations(nextRoster),
    memorial: nextMemorial,
  };
}

/**
 * Advances the squad to the next Labyrinth floor (1..100), awarding Star Shards,
 * scaled Floor Clear EXP, Safe Zone recovery, and reporting 25-Floor Theme & Boss milestones.
 */
export function advanceFloor(
  state: LabyrinthState,
  explicitTargetFloor?: number
): {
  newState: LabyrinthState;
  clearedFloor: number;
  isGateBoss: boolean;
  isThemeShift: boolean;
  beyondMemory: boolean;
  shardsAwarded: number;
  expAwarded: number;
  companionExpAwarded: number;
  clearedAll100: boolean;
} {
  const prevFloor = Math.max(0, state.currentFloor || 0);
  const clearedFloor = prevFloor === 0 ? 1 : prevFloor;
  const nextFloor =
    typeof explicitTargetFloor === "number" && explicitTargetFloor >= 0
      ? Math.min(100, explicitTargetFloor)
      : Math.min(100, Math.max(1, prevFloor + 1));

  const newHighest = Math.max(state.highestFloorCleared || 0, clearedFloor);
  const wasFirstTimeClear = newHighest > (state.highestFloorCleared || 0);
  const wasBossClear =
    clearedFloor > 0 &&
    (clearedFloor % 10 === 0 ||
      clearedFloor === 25 ||
      clearedFloor === 50 ||
      clearedFloor === 75 ||
      clearedFloor === 100);
  const wasSafeZoneFloor = clearedFloor > 0 && clearedFloor % 10 === 5 && !wasBossClear;
  const shardsAwarded = wasFirstTimeClear ? (wasBossClear ? 50 : 18) : 6;
  const clearedAll100 = clearedFloor >= 100 || newHighest >= 100;

  const prevTheme = getTowerThemeForFloor(clearedFloor);
  const nextTheme = getTowerThemeForFloor(nextFloor);
  const isThemeShift = nextFloor > 0 && prevTheme.id !== nextTheme.id;

  const firstClearExp = wasBossClear
    ? 150 + clearedFloor * 16
    : wasSafeZoneFloor
    ? 32 + clearedFloor * 4
    : 48 + clearedFloor * 6;
  const expAwarded = wasFirstTimeClear
    ? firstClearExp
    : Math.max(12, Math.round(firstClearExp * 0.25));

  const companionExpAwarded = Math.max(1, Math.round(expAwarded * COMPANION_SHARED_EXP_RATIO));
  const nextRoster = (state.roster || []).map((r) =>
    r.status === "DEPLOYED" || r.status === "WOUNDED"
      ? applyLevelGain(r, companionExpAwarded)
      : r
  );

  let newState: LabyrinthState = {
    ...state,
    currentFloor: nextFloor,
    highestFloorCleared: newHighest,
    starShards: (state.starShards || 0) + shardsAwarded,
    roster: normalizeSquadFormations(nextRoster),
    activeEncounter: null,
  };

  // Entering a Safe Zone (Floor 5, 15, 35...) or Main Lobby restores WOUNDED status and HP/MP!
  if (nextFloor === 0 || getFloorType(nextFloor) === "SAFE_ZONE") {
    newState = healRosterAtSafeZoneOrLobby(newState);
  }

  return {
    newState,
    clearedFloor,
    isGateBoss: getFloorType(nextFloor) === "GATE_BOSS",
    isThemeShift,
    beyondMemory: nextFloor > (state.metaKnowledgeCeiling || 40),
    shardsAwarded,
    expAwarded,
    companionExpAwarded,
    clearedAll100,
  };
}

/**
 * Clamps Master Trust adjustments between 0 and 100.
 */
export function adjustMasterTrust(
  state: LabyrinthState,
  delta: number
): LabyrinthState {
  const clampedDelta = Math.max(-25, Math.min(25, Math.round(delta || 0)));
  const nextTrust = Math.max(0, Math.min(100, (state.masterTrust ?? 35) + clampedDelta));
  return {
    ...state,
    masterTrust: nextTrust,
  };
}

/**
 * Synchronizes LabyrinthState roster entries with client party state (presence, affection awakenings, combat stats).
 */
export function syncRosterWithParty(
  state: LabyrinthState,
  partyMembers: Partial<StoryCompanion>[] = []
): LabyrinthState {
  if (!state) return state;
  const fallenNames = new Set(
    (state.memorial || []).map((m) => (m?.name || "").toLowerCase())
  );

  const nextRoster = (state.roster || []).map((entry) => {
    if (
      entry.status === "FALLEN" ||
      fallenNames.has((entry.heroineName || "").toLowerCase())
    ) {
      return { ...entry, status: "FALLEN" as HeroStatus, currentHp: 0, currentMp: 0 };
    }
    const matchingParty = (partyMembers || []).find((pm) =>
      matchesHeroineName(pm?.name, entry.heroineName, pm?.id)
    );
    if (!matchingParty) return hydrateRosterEntryStats(entry);

    const updated = applyAwakening(entry, matchingParty.affection ?? 0);
    // Preserve WOUNDED status if still deployed in dungeon
    const nextStatus: HeroStatus = !matchingParty.isPresent
      ? "BENCHED"
      : entry.status === "WOUNDED" || matchingParty.heroStatus === "WOUNDED"
      ? "WOUNDED"
      : "DEPLOYED";
    const syncedCap = getStarLevelCap(updated.starRank);
    const syncedLevel = Math.min(
      syncedCap,
      Math.max(updated.level || 1, matchingParty.level || 1)
    );
    const syncedExp =
      syncedLevel >= syncedCap
        ? 0
        : syncedLevel > (updated.level || 1)
        ? Math.max(0, matchingParty.exp ?? 0)
        : syncedLevel === (matchingParty.level || 1)
        ? Math.max(updated.exp || 0, matchingParty.exp || 0)
        : updated.exp || 0;

    return hydrateRosterEntryStats({
      ...updated,
      level: syncedLevel,
      exp: syncedExp,
      maxExp: getRequiredExpForLevel(syncedLevel),
      status: nextStatus,
      formationSlot: matchingParty.formationSlot || updated.formationSlot,
    });
  });

  // Register any present/encountered non-fallen companion in partyMembers into roster
  for (const pm of partyMembers || []) {
    if (!pm?.name) continue;
    const alreadyInRoster = nextRoster.some((r) =>
      matchesHeroineName(r.heroineName, pm.name, r.heroineId)
    );
    const isFallen =
      pm.heroStatus === "FALLEN" || fallenNames.has(pm.name.toLowerCase());
    if (!alreadyInRoster && (pm.isPresent || pm.encountered) && !isFallen) {
      const dossier = getHeroineDossier(pm.name);
      const baseRank = (pm.baseStarRank || pm.starRank || dossier?.baseStarRank || 1) as StarRank;
      const initLevel = Math.max(1, pm.level || 1);
      nextRoster.push(
        applyAwakening(
          hydrateRosterEntryStats({
            heroineId: pm.id || dossier?.id,
            heroineName: pm.name,
            starRank: baseRank,
            baseStarRank: baseRank,
            level: initLevel,
            exp: Math.max(0, pm.exp || 0),
            maxExp: getRequiredExpForLevel(initLevel),
            status: pm.isPresent ? "DEPLOYED" : "BENCHED",
            formationSlot: pm.formationSlot || (pm.isPresent ? "FRONTLINE" : undefined),
            awakenings: pm.awakenings || 0,
          }),
          pm.affection ?? 0
        )
      );
    }
  }

  return {
    ...state,
    roster: normalizeSquadFormations(nextRoster),
  };
}

/**
 * Builds the comprehensive Starfall Labyrinth Canon, 25-Floor Theme, Formation & Permadeath Turn Directive.
 */
export function buildStarfallTurnDirective(params: {
  protagonistName: string;
  protagonistLevel: number;
  labyrinthState: LabyrinthState;
  currentLocation: string;
  activeSpeaker?: string;
  deployedHeroines: string[];
}): string {
  const {
    protagonistName,
    protagonistLevel,
    labyrinthState,
    currentLocation,
    activeSpeaker,
    deployedHeroines,
  } = params;

  const effectiveFloor = inferFloorFromLocation(
    currentLocation,
    labyrinthState.currentFloor || 0
  );
  const floorTypeLabel = getFloorTypeLabel(effectiveFloor);
  const inMainLobby = isStarfallLobbyLocation(currentLocation);
  const beyondMemory = effectiveFloor > (labyrinthState.metaKnowledgeCeiling || 40);
  const protagStarLabel = labyrinthState.isHiddenRarity
    ? `?★ (Effective ${labyrinthState.protagonistStarRank}★)`
    : `${labyrinthState.protagonistStarRank}★`;
  const protagCap = getStarLevelCap(labyrinthState.protagonistStarRank);

  const activeTheme = getTowerThemeForFloor(effectiveFloor);
  const activeLayout = getFloorLayout(effectiveFloor, labyrinthState.summonSeed);
  const stratumBestiary = getCuratedStratumBestiarySummary(effectiveFloor);

  const matchingStratum =
    STARFALL_FLOOR_CANON.find(
      (f) => effectiveFloor >= f.minFloor && effectiveFloor <= f.maxFloor
    ) || STARFALL_FLOOR_CANON[0];

  const activeSquadEntries = (labyrinthState.roster || []).filter(
    (r) => r.status === "DEPLOYED" || r.status === "WOUNDED"
  );
  const frontlineSummary =
    activeSquadEntries
      .filter((r) => (r.formationSlot || "FRONTLINE") === "FRONTLINE")
      .map(
        (r) =>
          `${r.heroineName} (${r.starRank}★ Lv.${r.level}/${getStarLevelCap(r.starRank)}${
            r.status === "WOUNDED" ? " • ⚠️ CRITICALLY WOUNDED" : ""
          })`
      )
      .join(", ") ||
    deployedHeroines.slice(0, 2).join(", ") ||
    "Protagonist Solo Frontline";

  const reserveSummary =
    activeSquadEntries
      .filter((r) => r.formationSlot === "RESERVE")
      .map(
        (r) =>
          `${r.heroineName} (${r.starRank}★ Lv.${r.level} • Rearguard Reserve${
            r.status === "WOUNDED" ? " • ⚠️ WOUNDED" : ""
          })`
      )
      .join(", ") || "None in Rearguard";

  const benchedSummary =
    (labyrinthState.roster || [])
      .filter((r) => r.status === "BENCHED")
      .map(
        (r) =>
          `${r.heroineName} (${r.starRank}★ Lv.${r.level} — Safe in Lobby Barracks)`
      )
      .join(", ") || "None";

  const memorialSummary =
    (labyrinthState.memorial || []).length > 0
      ? labyrinthState.memorial
          .map((m) => `✝ ${m.name} (DIED PERMANENTLY on Floor ${m.floor}: ${m.cause})`)
          .join(" | ")
      : "None — Zero Casualties So Far";

  const speakerDossier = getHeroineDossier(activeSpeaker);

  const covenantQuickList = STARFALL_COVENANT_RULES.map(
    (r) => `  • Covenant ${r.ruleNumber} (${r.title}): ${r.canonSummary}`
  ).join("\n");

  const antagonistList = STARFALL_ANTAGONIST_DOSSIERS.map(
    (a) => `  • ${a.name} (${a.role}): ${a.description}`
  ).join("\n");

  const curatedBestiaryDirective = `     * CURATED STRATUM BESTIARY (ANTI-HALLUCINATION LOCK — ONLY USE THESE CANONICAL MONSTERS):
       - Common Monsters: ${stratumBestiary.commons.join(", ")}
       - Elite Threats: ${stratumBestiary.elites.join(", ")}
       - Gate/Threshold Bosses: ${stratumBestiary.bosses.join(", ")}
       - RULE: NEVER invent off-list enemy names! When naming or foreshadowing monsters on this stratum, use ONLY the exact enemy names listed above (or the Locked Floor Hostile below).`;

  const themeContextBlock =
    effectiveFloor > 0
      ? `   - Active 25-Floor Tower Theme (${activeTheme.floorRangeLabel}): "${activeTheme.name}"
     * Atmosphere: ${activeTheme.atmosphereSensory}
     * Environmental Law [${activeTheme.environmentalLawName}]: ${activeTheme.environmentalLawEffect}
     * Current Room Layout: "${activeLayout.name}" — ${activeLayout.geometrySummary} (Terrain: ${activeLayout.terrainTags.join(", ")})
${curatedBestiaryDirective}`
      : `   - Lobby Sanctuary: Star Gate Plaza atop your Master's large floating sky-island drifting in the astral cloud sea around the central Starfall Spire, with rival Masters' floating islands visible across the void (Next Climb Theme: ${activeTheme.name}).
${curatedBestiaryDirective}`;

  const encounterBlock =
    labyrinthState.activeEncounter && labyrinthState.activeEncounter.isActive
      ? `\n7. LIVE TACTICAL COMBAT TELEMETRY (STRICT ENEMY CANON LOCK — NARRATE IN PLAIN PROSE):
   - LOCKED FLOOR HOSTILE [${labyrinthState.activeEncounter.enemyTier || (labyrinthState.activeEncounter.isBoss ? "BOSS" : "COMMON")}]: "${labyrinthState.activeEncounter.enemyName}" (${labyrinthState.activeEncounter.enemyTitle}) — Phase: ${
          labyrinthState.activeEncounter.engagementPhase === "vicinity"
            ? "HOSTILE IN VICINITY (Party has sensed/spotted it or is sizing it up; they can scout/set up OR strike to engage)"
            : "ACTIVE COMBAT ENGAGED"
        }
   - Hostile Status: HP ${labyrinthState.activeEncounter.enemyHp}/${labyrinthState.activeEncounter.enemyMaxHp} | Poise ${labyrinthState.activeEncounter.enemyPoise}/${labyrinthState.activeEncounter.enemyMaxPoise}${labyrinthState.activeEncounter.isEnemyBroken ? " [STAGGERED / POISE BROKEN!]" : ""} | Weaknesses: ${labyrinthState.activeEncounter.enemyWeaknesses.join(", ")}
   - MANDATORY NAME LOCK: You MUST refer to this floor's hostile strictly as "${labyrinthState.activeEncounter.enemyName}" (never substitute a different monster name).
   - Next Enemy Telegraph: "${labyrinthState.activeEncounter.currentTelegraph.label}" — ${labyrinthState.activeEncounter.currentTelegraph.telegraphText}
   - Latest Turn Resolution: ${labyrinthState.activeEncounter.combatTelemetrySummary || "Encounter initiated."}`
      : "";

  return `--- STARFALL LABYRINTH CANON BIBLE, 25-FLOOR STRATA & PERMADEATH ENGINE (MANDATORY) ---
1. LIVE LABYRINTH TELEMETRY:
   - Active Location: ${currentLocation} (${
     effectiveFloor === 0
       ? "Floor 0 — Main Lobby Hub"
       : `Floor ${effectiveFloor} / 100 — [${floorTypeLabel.toUpperCase()}]`
   })
   - Stratum Canon: ${matchingStratum.stratumName} — ${matchingStratum.canonHazardsAndBoss}
${themeContextBlock}
   - Protagonist Status: ${protagonistName} [${protagStarLabel} • Lv.${protagonistLevel}/${protagCap}] | Highest Floor Cleared: ${labyrinthState.highestFloorCleared}/100
   - Star Gate Economy: ${labyrinthState.starShards} Star Shards | Pity Counter: ${labyrinthState.pityCounter}/${PITY_THRESHOLD} | Summon Access: ${
     inMainLobby
       ? "UNLOCKED (Currently in Star Gate Plaza Main Lobby)"
       : "LOCKED (Summoning is ONLY possible in Star Gate Plaza Main Lobby — never inside Labyrinth floors!)"
   }
   - Unseen Master Trust: ${labyrinthState.masterTrust}% (${
     labyrinthState.masterTrust <= 20
       ? "DANGEROUSLY LOW — Master is impatient and prone to reckless auto-battle Command Seals!"
       : labyrinthState.masterTrust >= 70
       ? "HIGH — Master trusts your shot-calling and grants tactical leeway."
       : "GUARDED — Master is watching your floor clear speed vs. survival."
   })
   - Active Frontline Vanguard: ${frontlineSummary}
   - Rearguard Reserve (Ready for Tag-Swap): ${reserveSummary}
   - Benched Roster (Safe in Lobby): ${benchedSummary}
   - Memorial Wall (PERMANENTLY DEAD): ${memorialSummary}

2. META-KNOWLEDGE CEILING RULE (FLOOR ${labyrinthState.metaKnowledgeCeiling} HORIZON):
   ${
     beyondMemory
       ? `- CRITICAL: Floor ${effectiveFloor} EXCEEDS ${protagonistName}'s pre-isekai memory ceiling (Floor ${labyrinthState.metaKnowledgeCeiling})! ${protagonistName} has ZERO foreknowledge of bosses, traps, or layouts here—portray genuine uncertainty and live tactical improvisation!`
       : `- Within Ranker Memory (Current Floor ${effectiveFloor} <= Ceiling Floor ${labyrinthState.metaKnowledgeCeiling}): ${protagonistName} remembers monster aggro cones, hidden Safe Zone caches, and boss phase transitions from playing 'Celestia Summons'—though real-life pain, stamina limits, and human fear still make execution razor-thin.`
   }

3. EIGHT IMMUTABLE LABYRINTH COVENANT LAWS:
${covenantQuickList}

4. IRREVERSIBLE PERMADEATH & MEMORIAL WALL ENFORCEMENT:
   - DEAD MEANS DEAD: Any heroine on the Memorial Wall (${memorialSummary}) has shattered into Star Ash forever. NEVER allow a fallen heroine to speak, appear alive, or return!
   - TWO-STAGE WOUNDED -> FALLEN STAKES: Only DEPLOYED/WOUNDED heroines can die in combat when taking an unmitigated lethal blow while already WOUNDED or via suicidal blunder. Never kill heroines randomly in Lobby, Safe Zones, or smart tactical play!
   - PROTAGONIST DEATH = FINAL GAME OVER: There is NO timeline regression in Starfall Labyrinth.

5. CANONICAL RIVALS & SYSTEM ENTITIES:
${antagonistList}
${
  speakerDossier
    ? `\n6. ACTIVE SPEAKER VOICE, WEAPONRY & INNER CONFLICT (${speakerDossier.name} — ${speakerDossier.epithet}):
   - Combat Kit: ${speakerDossier.skillKit.activeSkill.name} / ${speakerDossier.skillKit.tagAssistSkill.name} / Bond Special: ${speakerDossier.skillKit.bondSpecial.name} (${speakerDossier.dyadPassiveName})
   - Core Conflict: ${speakerDossier.actOneConflict}
   - Hidden Depth: ${speakerDossier.traumaAndSecret}
   - Spoken Cadence: ${speakerDossier.speechVoiceBrief}`
    : ""
}${encounterBlock}`;
}
