/**
 * Port Solaris Core Game Engine
 * Pure, deterministic mechanics for:
 * 1. The Stray Anchor Café & Boarding House Sim (roles, revenue, debt, star upgrades, 30-day audit)
 * 2. Scandal Heat Meter (0-100%, foot traffic, decay, tiers)
 * 3. Upstairs Rooms 201-206 Management & Perks
 * 4. Live Heart-Rate BPM & Blush Gauge (40-100 BPM, tiers, 100 Short-Circuit)
 * 5. Showdowns & Wagers (Article 9 Non-Lethal Vitals, 6 Coastal Stances, Composure Meltdown)
 * 6. "Caught Red-Handed" Keepsake Jealousy Detection
 * 7. Island Faction Standing & Reputation Perks
 */

import {
  BoardingHouseState,
  IslandFaction,
  ShopRole,
  KeepsakeItem,
  KeepsakeSlot,
  BpmZone,
  ScandalTier,
  FactionTier,
  ShowdownContestType,
  CoastalStanceType,
  HeroineProfile,
  PORT_SOLARIS_HEROINE_DOSSIERS,
} from "@/types/port_solaris";
import { StoryCompanion } from "@/types/story";

// ============================================================================
// 1. CAFÉ MANAGEMENT & SHOP ROLES
// ============================================================================

export const PORT_SOLARIS_SHOP_ROLES: ShopRole[] = [
  "CHEF",
  "MIXOLOGIST",
  "FLOOR_HOST",
  "BOUNCER",
  "PROMOTER",
];

export const PREFERRED_SHOP_ROLES: Record<ShopRole, string[]> = {
  CHEF: ["Mia Bellini", "Zuri Delacroix", "comp_mia", "comp_zuri", "mia", "zuri"],
  MIXOLOGIST: ["Colette Moreau", "comp_colette", "colette"],
  FLOOR_HOST: [
    "Seraphina Vane",
    "Chloe Lin",
    "Nadia Saint-Clair",
    "comp_seraphina",
    "comp_chloe",
    "comp_nadia",
    "seraphina",
    "chloe",
    "nadia",
  ],
  BOUNCER: ["Kaede Tachibana", "comp_kaede", "kaede"],
  PROMOTER: [
    "Vivienne Laurent",
    "Pippa Reyes",
    "Roxy Vance",
    "comp_vivienne",
    "comp_pippa",
    "comp_roxy",
    "vivienne",
    "pippa",
    "roxy",
  ],
};

export const STAR_REVENUE_MULTIPLIERS: Record<number, number> = {
  0: 1.0, // 0★ Probation
  1: 1.5, // 1★ Provisional License
  2: 2.2, // 2★ Boardwalk Regular
  3: 3.0, // 3★ Island Spotlight
  4: 4.2, // 4★ Premier Coastal Lounge
  5: 6.0, // 5★ Grand Five-Star Landmark
};

export const DEBT_STAR_THRESHOLDS = [
  { star: 5 as const, maxDebt: 0, label: "5★ Grand Landmark (Deed Liberated)" },
  { star: 4 as const, maxDebt: 1000, label: "4★ Premier Coastal Lounge" },
  { star: 3 as const, maxDebt: 2000, label: "3★ Island Spotlight" },
  { star: 2 as const, maxDebt: 3000, label: "2★ Boardwalk Regular" },
  { star: 1 as const, maxDebt: 4000, label: "1★ Provisional License" },
  { star: 0 as const, maxDebt: 5000, label: "0★ Probation" },
];

/**
 * Creates the initial deterministic state for The Stray Anchor Café & Boarding House.
 */
export function createInitialBoardingHouseState(opts?: {
  outstandingDebt?: number;
  daysUntilAudit?: number;
  starRating?: 0 | 1 | 2 | 3 | 4 | 5;
}): BoardingHouseState {
  return {
    shopName: "The Stray Anchor",
    starRating: opts?.starRating ?? 0,
    daysUntilAudit: opts?.daysUntilAudit ?? 30,
    dailyRevenue: 165,
    outstandingDebt: opts?.outstandingDebt ?? 5000,
    scandalHeat: 15,
    activeTenants: ["comp_seraphina"],
    shopAssignments: {
      FLOOR_HOST: "Seraphina Vane",
    },
    roomAssignments: {
      201: "Seraphina Vane",
    },
    totalRevenueCollected: 0,
    totalDebtPaid: 0,
  };
}

/**
 * Creates initial Island Faction standings for Port Solaris.
 */
export function createInitialFactionStandings(): Record<IslandFaction, number> {
  return {
    PLATINUM_BOARD: 10,
    BOARDWALK_GUILD: 15,
    BREAKERS_UNION: 15,
    DRIFTWOOD_SYNDICATE: 12,
  };
}

/**
 * Checks whether a given companion name or ID has affinity/preference for a shop role.
 */
export function isPreferredRole(heroineIdOrName: string, role: ShopRole): boolean {
  if (!heroineIdOrName) return false;
  const list = PREFERRED_SHOP_ROLES[role] || [];
  const query = heroineIdOrName.trim().toLowerCase();
  return list.some((item) => {
    const candidate = item.trim().toLowerCase();
    return candidate === query || query.includes(candidate) || candidate.includes(query);
  });
}

/**
 * Normalizes shop assignments into a map of ShopRole -> companion identifier.
 */
function normalizeAssignments(
  shopAssignments: Record<string, ShopRole> | Partial<Record<ShopRole, string>>
): Partial<Record<ShopRole, string>> {
  const result: Partial<Record<ShopRole, string>> = {};
  for (const [key, val] of Object.entries(shopAssignments)) {
    if (!val) continue;
    // Case 1: Key is ShopRole, value is companion name/id
    if (PORT_SOLARIS_SHOP_ROLES.includes(key as ShopRole)) {
      result[key as ShopRole] = val as string;
    }
    // Case 2: Key is companion name/id, value is ShopRole
    else if (PORT_SOLARIS_SHOP_ROLES.includes(val as ShopRole)) {
      result[val as ShopRole] = key;
    }
  }
  return result;
}

/**
 * Finds a companion from list by ID or name substring.
 */
function findCompanion(
  identifier: string,
  companions: StoryCompanion[]
): StoryCompanion | undefined {
  if (!identifier || !Array.isArray(companions)) return undefined;
  const target = String(identifier).trim().toLowerCase();
  return companions.find((c) => {
    if (!c) return false;
    const cId = typeof c.id === "string" ? c.id.toLowerCase() : "";
    const cName = typeof c.name === "string" ? c.name.toLowerCase() : "";
    return (
      (Boolean(cId) && cId === target) ||
      (Boolean(cName) && (cName === target || target.includes(cName) || cName.includes(target)))
    );
  });
}

/**
 * Calculates daily shift revenue for The Stray Anchor Café & Boarding House.
 * Pure deterministic formula:
 * Revenue = (R_base + StaffContributions + OccupancyBonus) * M_star * M_heat * M_synergies
 */
export function calculateDailyCafeRevenue(
  state: BoardingHouseState,
  companions: StoryCompanion[] = [],
  shopAssignments: Record<string, ShopRole> | Partial<Record<ShopRole, string>> = {}
): {
  revenue: number;
  details: {
    base: number;
    staff: number;
    staffContribution?: number;
    starMult: number;
    heatMult: number;
    synergies: number;
    occupancyBonus: number;
  };
} {
  const R_BASE = 100;
  const roleMap = normalizeAssignments(shopAssignments);

  let staffContribution = 0;
  let hasChef = false;
  let hasMixologist = false;
  let hasFloorHost = false;
  let hasPromoter = false;
  let hasBouncer = false;
  let hasRoxyPromoter = false;

  for (const role of PORT_SOLARIS_SHOP_ROLES) {
    const assignee = roleMap[role];
    if (!assignee) continue;

    // Base contribution for filling a role
    let roleSubtotal = 40;

    // Preferred role bonus
    if (isPreferredRole(assignee, role)) {
      roleSubtotal += 25;
    }

    // Affection scaling: +floor(affection * 0.5)
    const comp = findCompanion(assignee, companions);
    const aff = comp?.affection ?? comp?.affectionLevel ?? 20;
    roleSubtotal += Math.floor(Math.max(0, aff) * 0.5);

    staffContribution += roleSubtotal;

    if (role === "CHEF") hasChef = true;
    if (role === "MIXOLOGIST") hasMixologist = true;
    if (role === "FLOOR_HOST") hasFloorHost = true;
    if (role === "BOUNCER") hasBouncer = true;
    if (role === "PROMOTER") {
      hasPromoter = true;
      if (typeof assignee === "string" && assignee.toLowerCase().includes("roxy")) {
        hasRoxyPromoter = true;
      }
    }
  }

  // Room occupancy bonus: +15 crowns per tenant living upstairs in rooms 201-206 (tracked in details)
  const tenantCount = Array.isArray(state.activeTenants) ? state.activeTenants.length : 0;
  const occupancyBonus = tenantCount * 15;

  // Star Multiplier (1.0x to 6.0x)
  const starRating = Math.max(0, Math.min(5, state.starRating ?? 0));
  const starMult = STAR_REVENUE_MULTIPLIERS[starRating] ?? 1.0;

  // Scandal Heat Foot-Traffic Multiplier
  const heat = Math.max(0, Math.min(100, state.scandalHeat ?? 0));
  let heatMult = 1.0 + (heat / 100) * 0.5;
  if (hasRoxyPromoter) {
    heatMult += 0.35; // Roxy Vance dyad passive: Front-Page Scandal Spin
  }

  // Dyad & Roster Synergies
  let synergySum = 0;
  if (hasChef && hasMixologist) synergySum += 0.15; // Culinary & Beverage pairing
  if (hasFloorHost && hasPromoter) synergySum += 0.15; // VIP draw & Boardwalk hype
  if (hasChef && hasMixologist && hasFloorHost && hasBouncer && hasPromoter) {
    synergySum += 0.25; // Complete 5-Role Full Roster
  }
  const synergiesMult = 1.0 + synergySum;

  const rawRevenue =
    (R_BASE + staffContribution + occupancyBonus) * starMult * heatMult * synergiesMult;
  const finalRevenue = Math.max(R_BASE, Math.round(rawRevenue));

  return {
    revenue: finalRevenue,
    details: {
      base: R_BASE,
      staff: staffContribution,
      staffContribution,
      starMult: Number(starMult.toFixed(2)),
      heatMult: Number(heatMult.toFixed(2)),
      synergies: Number(synergiesMult.toFixed(2)),
      occupancyBonus,
    },
  };
}

// ============================================================================
// 2. DEBT PAYDOWN & STAR RATING UPGRADES
// ============================================================================

/**
 * Calculates star rating earned for a given outstanding debt balance.
 */
export function getStarRatingForDebt(debt: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (debt <= 0) return 5;
  if (debt <= 1000) return 4;
  if (debt <= 2000) return 3;
  if (debt <= 3000) return 2;
  if (debt <= 4000) return 1;
  return 0;
}

/**
 * Executes a deterministic debt payment against the outstanding quota.
 * Handles clamping, excess prevention, and triggers star rating upgrades.
 */
export function paydownDebt(
  state: BoardingHouseState,
  amount: number
): {
  newState: BoardingHouseState;
  starUpgrade: boolean;
  previousStarRating: number;
  newStarRating: 0 | 1 | 2 | 3 | 4 | 5;
  effectivePayment: number;
  remainingDebt: number;
} {
  const currentDebt = Math.max(0, state.outstandingDebt ?? 5000);
  const payment = Math.max(0, Math.min(amount, currentDebt));
  const remainingDebt = Math.max(0, currentDebt - payment);

  const prevStar = (state.starRating ?? 0) as 0 | 1 | 2 | 3 | 4 | 5;
  const newStar = getStarRatingForDebt(remainingDebt);
  const starUpgrade = newStar > prevStar;

  const newState: BoardingHouseState = {
    ...state,
    outstandingDebt: remainingDebt,
    starRating: newStar,
    totalDebtPaid: (state.totalDebtPaid ?? 0) + payment,
  };

  return {
    newState,
    starUpgrade,
    previousStarRating: prevStar,
    newStarRating: newStar,
    effectivePayment: payment,
    remainingDebt,
  };
}

// ============================================================================
// 3. 30-DAY AUDIT COUNTDOWN & INSPECTIONS
// ============================================================================

export interface AuditMilestone {
  day: number;
  requiredStar: number;
  title: string;
  inspector: string;
  directive: string;
}

export const AUDIT_MILESTONES: AuditMilestone[] = [
  {
    day: 25,
    requiredStar: 0,
    title: "Sanitation & First-Shift Surprise Inspection",
    inspector: "Seraphina Vane",
    directive:
      "Seraphina Vane arrives with white gloves and clipboard to inspect kitchen prep tables. Maintain clean order and 0★ basic compliance.",
  },
  {
    day: 20,
    requiredStar: 1,
    title: "Mid-Term Audit Tribunal 1",
    inspector: "Platinum Board Auditors",
    directive:
      "The Platinum Board demands evidence of commercial viability. Requires at least 1★ (debt <= 4,000 Crowns) to prevent provisional license revocation.",
  },
  {
    day: 10,
    requiredStar: 2,
    title: "Audit Tribunal 2 & Health Certification",
    inspector: "Boardwalk Guild & Platinum Trust",
    directive:
      "Joint tribunal review. Requires at least 2★ (debt <= 3,000 Crowns) to unlock Boardwalk Festival rights and keep the terrace open.",
  },
  {
    day: 5,
    requiredStar: 3,
    title: "Final Notice Pre-Foreclosure Inspection",
    inspector: "Chief Auditor Laurent D'Artagnan",
    directive:
      "Urgent five-day countdown notice! Requires at least 3★ (debt <= 2,000 Crowns) or the deed faces foreclosure auction.",
  },
  {
    day: 0,
    requiredStar: 5,
    title: "Day 0 Final Star Ledger Audit",
    inspector: "Island Charter Article 9 Tribunal",
    directive:
      "Final settlement day! If debt is 0, deed is liberated as a 5-Star landmark. If debt remains, Article 9 Foreclosure Showdown begins!",
  },
];

/**
 * Advances the audit countdown by one day and returns scheduled alerts or foreclosure notices.
 */
export function advanceAuditDay(state: BoardingHouseState): {
  newState: BoardingHouseState;
  inspectionAlert?: string;
  isAuditDay: boolean;
  isForeclosure: boolean;
  isLiberated: boolean;
} {
  const currentDays = Math.max(0, state.daysUntilAudit ?? 30);
  if (currentDays <= 0) {
    return {
      newState: { ...state, daysUntilAudit: 0 },
      isAuditDay: false,
      isForeclosure: false,
      isLiberated: false,
    };
  }
  const nextDays = Math.max(0, currentDays - 1);
  const debt = state.outstandingDebt ?? 0;
  const star = state.starRating ?? 0;

  const milestone = AUDIT_MILESTONES.find((m) => m.day === nextDays);
  let inspectionAlert: string | undefined;
  let isForeclosure = false;
  let isLiberated = false;

  if (milestone) {
    if (nextDays === 0) {
      if (debt <= 0) {
        isLiberated = true;
        inspectionAlert =
          "🎉 DEED LIBERATED! The Stray Anchor has achieved 5-Star Grand Landmark status! The Platinum Board's eviction claim is permanently dissolved.";
      } else {
        isForeclosure = true;
        inspectionAlert = `⚠️ FORECLOSURE NOTICE: The 30-day lease has expired with ${debt} Crowns outstanding! Article 9 Foreclosure Showdown engaged.`;
      }
    } else {
      const meetsRequirement = star >= milestone.requiredStar;
      inspectionAlert = `📋 AUDIT ALERT [Day ${milestone.day}]: ${milestone.title} by ${milestone.inspector}. ${
        meetsRequirement
          ? "The Stray Anchor currently meets star tier criteria."
          : `WARNING: Requires ${milestone.requiredStar}★ (current: ${star}★). Settle debt urgently!`
      }`;
    }
  }

  const newState: BoardingHouseState = {
    ...state,
    daysUntilAudit: nextDays,
  };

  return {
    newState,
    inspectionAlert,
    isAuditDay: Boolean(milestone),
    isForeclosure,
    isLiberated,
  };
}

// ============================================================================
// 4. SCANDAL HEAT (0-100%)
// ============================================================================

/**
 * Returns the narrative tier and foot-traffic characteristics of a scandal heat value.
 */
export function getScandalTier(heat: number): {
  tier: ScandalTier;
  label: string;
  footTrafficMultiplier: number;
  jealousyRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  description: string;
} {
  const clamped = Math.max(0, Math.min(100, heat));
  if (clamped <= 30) {
    return {
      tier: "LOW",
      label: "Calm Boardwalk Waters (0–30%)",
      footTrafficMultiplier: 1.0,
      jealousyRisk: "LOW",
      description: "Low gossip heat. The café is safe from paparazzi, maintaining steady local trade.",
    };
  }
  if (clamped <= 60) {
    return {
      tier: "BUZZING",
      label: "Whispering Palms (31–60%)",
      footTrafficMultiplier: 1.2,
      jealousyRisk: "MODERATE",
      description: "Buzzing local whispers. Foot traffic is boosted by +20%, with mild jealousy risks.",
    };
  }
  if (clamped <= 85) {
    return {
      tier: "TABLOID",
      label: "The Solaris Siren Sensation (61–85%)",
      footTrafficMultiplier: 1.4,
      jealousyRisk: "HIGH",
      description: "Tabloid front-page sensation! +40% foot traffic, but paparazzi swarm the entrance.",
    };
  }
  return {
    tier: "WILDFIRE",
    label: "Five-Star Scandal Wildfire (86–100%)",
    footTrafficMultiplier: 1.5,
    jealousyRisk: "CRITICAL",
    description:
      "Media wildfire! Maximum +50% foot traffic, but mandatory bouncer checks to prevent multi-heroine confrontation.",
  };
}

/**
 * Adjusts scandal heat within [0, 100] and returns detailed tier effects.
 */
export function adjustScandalHeat(
  currentHeat: number,
  delta: number
): {
  newHeat: number;
  tier: ScandalTier;
  tierLabel: string;
  footTrafficMultiplier: number;
  description: string;
} {
  const newHeat = Math.max(0, Math.min(100, (currentHeat ?? 0) + delta));
  const info = getScandalTier(newHeat);
  return {
    newHeat,
    tier: info.tier,
    tierLabel: info.label,
    footTrafficMultiplier: info.footTrafficMultiplier,
    description: info.description,
  };
}

/**
 * Calculates natural scandal heat decay per turn or shift.
 */
export function applyTurnScandalDecay(
  currentHeat: number,
  isQuietTurn: boolean = true,
  hasKaedeBouncer: boolean = false
): number {
  let decay = isQuietTurn ? 3 : 1;
  if (hasKaedeBouncer) {
    decay += 10; // Kaede Tachibana dyad: Shinai Sea-Breeze Guard
  }
  return Math.max(0, (currentHeat ?? 0) - decay);
}

// ============================================================================
// 5. BOARDING HOUSE UPSTAIRS ROOMS (201-206)
// ============================================================================

export interface BoardingRoomInfo {
  roomNumber: number; // 201 - 206
  roomKey: number; // 1 - 6
  name: string;
  defaultTenantName: string;
  defaultTenantId: string;
  perkDescription: string;
  dailyRevenueBonus: number;
}

export const BOARDING_HOUSE_ROOMS: Record<number, BoardingRoomInfo> = {
  201: {
    roomNumber: 201,
    roomKey: 1,
    name: "The Tsundere Heiress Suite",
    defaultTenantName: "Seraphina Vane",
    defaultTenantId: "comp_seraphina",
    perkDescription: "-20% audit penalties, VIP guest referrals (+30 Crowns/day)",
    dailyRevenueBonus: 30,
  },
  202: {
    roomNumber: 202,
    roomKey: 2,
    name: "The Shaded Arcade Den",
    defaultTenantName: "Chloe Lin",
    defaultTenantId: "comp_chloe",
    perkDescription: "-25% debt interest, forensic accounting cleanup (+25 Crowns/day)",
    dailyRevenueBonus: 25,
  },
  203: {
    roomNumber: 203,
    roomKey: 3,
    name: "The Tatami Sea-Breeze Room",
    defaultTenantName: "Kaede Tachibana",
    defaultTenantId: "comp_kaede",
    perkDescription: "+10 Composure each morning, -10% scandal heat decay per shift",
    dailyRevenueBonus: 20,
  },
  204: {
    roomNumber: 204,
    roomKey: 4,
    name: "The Tasting Parlor",
    defaultTenantName: "Colette Moreau",
    defaultTenantId: "comp_colette",
    perkDescription: "+20% bar shift revenue, supplies rare cocktail infusions",
    dailyRevenueBonus: 25,
  },
  205: {
    roomNumber: 205,
    roomKey: 5,
    name: "The Velvet Atelier",
    defaultTenantName: "Nadia Saint-Clair",
    defaultTenantId: "comp_nadia",
    perkDescription: "+30% VIP table prestige, sommelier appraisal bonus (+30 Crowns/day)",
    dailyRevenueBonus: 30,
  },
  206: {
    roomNumber: 206,
    roomKey: 6,
    name: "The Botanical Greenhouse Suite",
    defaultTenantName: "Zuri Delacroix",
    defaultTenantId: "comp_zuri",
    perkDescription: "+30% dessert tips, daily mood boost infusions (+25 Crowns/day)",
    dailyRevenueBonus: 25,
  },
};

/**
 * Normalizes room number from 1-6 or 201-206 to 201-206.
 */
export function normalizeRoomNumber(room: number): number | null {
  if (room >= 1 && room <= 6) return 200 + room;
  if (room >= 201 && room <= 206) return room;
  return null;
}

/**
 * Assigns a tenant to a room in the Boarding House.
 * Requires 50%+ affection (Intimacy Rank 3) for new move-ins.
 */
export function assignBoardingRoomTenant(
  state: BoardingHouseState,
  roomNumber: number,
  heroineId: string,
  heroineAffection: number = 50
): {
  success: boolean;
  reason?: string;
  newState: BoardingHouseState;
} {
  const normRoom = normalizeRoomNumber(roomNumber);
  if (!normRoom || !BOARDING_HOUSE_ROOMS[normRoom]) {
    return { success: false, reason: "Invalid room number (must be 201-206)", newState: state };
  }

  if (heroineAffection < 50) {
    return {
      success: false,
      reason: "Requires at least 50% Affection (Intimacy Rank 3) to move into the Boarding House.",
      newState: state,
    };
  }

  const roomMap = { ...(state.roomAssignments || {}) };
  roomMap[normRoom] = heroineId;

  const currentTenants = Array.isArray(state.activeTenants) ? [...state.activeTenants] : [];
  if (!currentTenants.includes(heroineId)) {
    currentTenants.push(heroineId);
  }

  const newState: BoardingHouseState = {
    ...state,
    roomAssignments: roomMap,
    activeTenants: currentTenants,
  };

  return {
    success: true,
    newState,
  };
}

// ============================================================================
// 6. LIVE HEART-RATE BPM & BLUSH GAUGE (40-100 BPM)
// ============================================================================

export function getBpmZone(bpm: number): {
  zone: BpmZone;
  label: string;
  color: string;
  badgeClass: string;
  description: string;
  socialDefenseMultiplier: number;
  affectionBonusMultiplier: number;
} {
  const clamped = Math.max(40, Math.min(100, bpm));

  if (clamped >= 96) {
    return {
      zone: "SHORT_CIRCUIT",
      label: "💥 100 BPM • SHORT-CIRCUIT!",
      color: "rose",
      badgeClass: "bg-rose-950/80 text-rose-300 border-rose-500 animate-pulse font-bold",
      description:
        "Emotional composure overloaded after sustained, earned romantic tension! Her guarded facade finally slips—momentary speechlessness, fierce blush, and a genuine emotional breakthrough.",
      socialDefenseMultiplier: 0.25,
      affectionBonusMultiplier: 1.5,
    };
  }
  if (clamped >= 83) {
    return {
      zone: "BLUSH_ZONE",
      label: "💓 Blush Zone",
      color: "pink",
      badgeClass: "bg-pink-950/60 text-pink-300 border-pink-500 font-medium",
      description:
        "Visibly flustered, pulse noticeably elevated, averting her gaze or offering sharp excuses to hide that the protagonist got under her skin.",
      socialDefenseMultiplier: 0.75,
      affectionBonusMultiplier: 1.2,
    };
  }
  if (clamped >= 69) {
    return {
      zone: "GUARDED_DEFLECTION",
      label: "⚡ Guarded & Intrigued",
      color: "amber",
      badgeClass: "bg-amber-950/60 text-amber-300 border-amber-500/60 font-medium",
      description:
        "Competitive awareness and sharp banter. She recognizes the protagonist's competence and pushes back with wit and high standards, keeping her romantic guard firmly up.",
      socialDefenseMultiplier: 0.9,
      affectionBonusMultiplier: 1.05,
    };
  }
  return {
    zone: "COMPOSED",
    label: "😎 Composed",
    color: "emerald",
    badgeClass: "bg-emerald-950/50 text-emerald-300 border-emerald-600 font-normal",
    description:
      "Poised, analytical, and in full control of her tempo. She maintains her standards, critiques flaws honestly, and is not easily flustered or impressed by ordinary moves.",
    socialDefenseMultiplier: 1.0,
    affectionBonusMultiplier: 1.0,
  };
}

/**
 * Returns the maximum BPM a heroine can reach during normal interaction based on her current Favor (affection).
 * Prevents low-affection or Ironclad heroines from prematurely hitting Blush Zone or 100 BPM Short-Circuit.
 */
export function getAffectionBpmCeiling(
  affection: number = 20,
  guardTier: "IRONCLAD" | "SELECTIVE" | "WARM_RIVAL" = "SELECTIVE"
): number {
  if (affection < 25) {
    return guardTier === "IRONCLAD" ? 72 : 76;
  }
  if (affection < 50) {
    return guardTier === "IRONCLAD" ? 85 : 89;
  }
  if (affection < 70 && guardTier === "IRONCLAD") {
    return 94;
  }
  return 100;
}

/**
 * Calculates live turn-by-turn BPM delta based on choices, romance, guard resistance, and affection ceiling.
 */
export function calculateBpmDelta(
  currentBpm: number,
  affectionDelta: number = 0,
  isRomanceChoice: boolean = false,
  isBlushTrigger: boolean = false,
  options?: {
    isPhysicalTouch?: boolean;
    isCaughtRedHanded?: boolean;
    isHeartToHeart?: boolean;
    isColdResponse?: boolean;
    affection?: number;
    guardTier?: "IRONCLAD" | "SELECTIVE" | "WARM_RIVAL";
    bypassAffectionCeiling?: boolean;
  }
): {
  newBpm: number;
  zone: BpmZone;
  shortCircuited: boolean;
  delta: number;
} {
  const affection = typeof options?.affection === "number" ? options.affection : 20;
  const guardTier = options?.guardTier || "SELECTIVE";
  const ceiling = options?.bypassAffectionCeiling
    ? 100
    : getAffectionBpmCeiling(affection, guardTier);

  // If she was previously at Short-Circuit (>= 96 BPM) or above her current affection ceiling,
  // apply natural post-spike composure recovery first so she never stays permanently locked at 100 BPM.
  const rawBase = Math.max(40, Math.min(100, currentBpm || 55));
  const base = rawBase >= 96 ? 76 : Math.min(rawBase, ceiling);

  let delta = 0;

  if (options?.isHeartToHeart) {
    // Cooldown relaxation scene on rooftop terrace or sunset pier
    delta -= 25;
  } else if (options?.isColdResponse) {
    // Aloof / business-only choice
    delta -= 8;
  } else {
    // Romantic / emotional stimulation (base increments before guard-tier resistance)
    if (isRomanceChoice) delta += 5;
    if (isBlushTrigger) delta += 4;
    if (options?.isPhysicalTouch) delta += 9;
    if (options?.isCaughtRedHanded) delta += 14;

    // Affection progression scaling
    if (affectionDelta > 0) {
      delta += Math.round(affectionDelta * 2);
    } else if (affectionDelta < 0) {
      delta += affectionDelta * 3;
    } else if (!isRomanceChoice && !isBlushTrigger && !options?.isPhysicalTouch && !options?.isCaughtRedHanded) {
      // Passive resting composure recovery toward ~56 BPM
      if (base > 58) {
        delta -= 5;
      } else if (base < 52) {
        delta += 2;
      }
    }

    // Apply Guard-Tier composure resistance to positive BPM spikes
    if (delta > 0) {
      const resistanceMultiplier =
        guardTier === "IRONCLAD" ? 0.45 : guardTier === "SELECTIVE" ? 0.7 : 1.0;
      delta = Math.max(1, Math.round(delta * resistanceMultiplier));
    }
  }

  const raw = base + delta;
  const newBpm = Math.max(40, Math.min(ceiling, raw));
  const shortCircuited = newBpm >= 96 && ceiling >= 96;
  const zoneInfo = getBpmZone(newBpm);

  return {
    newBpm,
    zone: zoneInfo.zone,
    shortCircuited,
    delta: newBpm - rawBase,
  };
}

/**
 * Formulates the LLM short-circuit narrative directive when a heroine genuinely reaches 96-100 BPM at high Favor.
 */
export function getShortCircuitDirective(heroineName: string): string {
  return `💥 100 BPM SHORT-CIRCUIT TRIGGER: ${heroineName}'s emotional composure has genuinely overloaded after sustained romantic buildup! Her usual poised facade slips—she reacts with an unmistakable blush, a momentary catch in her voice, or looking away to hide her expression before trying to recover her pride.`;
}

// ============================================================================
// 7. SHOWDOWNS & WAGERS (ARTICLE 9 NON-LETHAL VITALS & STANCES)
// ============================================================================

export interface ShowdownStanceConfig {
  id: CoastalStanceType;
  name: string;
  conduit: "PHYSICAL_TEMPO" | "SOCIAL_PANACHE" | "HYBRID";
  description: string;
  composureDefenseBonus: number;
  hypeGenerationBonus: number;
  specialEffect: string;
}

export const COASTAL_STANCES: ShowdownStanceConfig[] = [
  {
    id: "FLOW_STATE_RHYTHM",
    name: "Flow-State Rhythm",
    conduit: "PHYSICAL_TEMPO",
    description: "Flow-state boardwalk rhythm: clean parries, steady kitchen tempo, balanced poise.",
    composureDefenseBonus: 10,
    hypeGenerationBonus: 15,
    specialEffect: "Generates +10 Hype each turn while maintaining steady Composure.",
  },
  {
    id: "HIGH_HEAT_RUSH",
    name: "High-Heat Rush",
    conduit: "PHYSICAL_TEMPO",
    description: "Aggressive flame searing and rapid strikes that trade poise for massive pressure.",
    composureDefenseBonus: -10,
    hypeGenerationBonus: 30,
    specialEffect: "Deals +35% Composure pressure to rival, but leaves player slightly vulnerable.",
  },
  {
    id: "UNFLAPPABLE_COOL",
    name: "Unflappable Cool",
    conduit: "SOCIAL_PANACHE",
    description: "Ice-cold patrician poise: deflecting critiques, sipping espresso, patient timing.",
    composureDefenseBonus: 25,
    hypeGenerationBonus: 5,
    specialEffect: "Slashes incoming Composure damage by 50% and clears all fluster.",
  },
  {
    id: "TEASING_COUNTER",
    name: "Teasing Counter",
    conduit: "SOCIAL_PANACHE",
    description: "Catching opponents in their own arrogant bluffs with devastating playful smirks.",
    composureDefenseBonus: 15,
    hypeGenerationBonus: 20,
    specialEffect: "Spikes opponent BPM by +20 and triggers immediate Blush Zone penalty.",
  },
  {
    id: "VELVET_PROVOCATION",
    name: "Velvet Provocation",
    conduit: "HYBRID",
    description: "Sensory mastery and high-society rhetoric that unravels rival concentration.",
    composureDefenseBonus: 10,
    hypeGenerationBonus: 25,
    specialEffect: "Saps 20 Hype/Cool from the opponent and converts it into player momentum.",
  },
  {
    id: "SHOWSTOPPER_FINALE",
    name: "Showstopper Finale",
    conduit: "HYBRID",
    description: "All-in spectacle move requiring 75+ Hype or Cool to instantly break rival poise.",
    composureDefenseBonus: 0,
    hypeGenerationBonus: 0,
    specialEffect: "Massive 50-point Composure burst; triggers instant Composure Meltdown if it lands.",
  },
];

export function getShowdownStances(): ShowdownStanceConfig[] {
  return COASTAL_STANCES;
}

export function getShowdownTypeConfig(contestType: ShowdownContestType): {
  name: string;
  description: string;
  defaultPlayerStakes: string;
  defaultOpponentStakes: string;
  keySkills: string[];
  forfeitPenalty: string;
} {
  switch (contestType) {
    case "CULINARY_CLASH":
      return {
        name: "Culinary Clash",
        description: "Knife skills, wok flames, aroma balance, and plating under judge scrutiny.",
        defaultPlayerStakes: "1-Week Dishwasher Shift & Recipe Forfeit",
        defaultOpponentStakes: "+1 Star Rating Progress & Exclusive Wholesale Supplier Contract",
        keySkills: ["Knife Speed", "Flavor Balance", "Plating Panache"],
        forfeitPenalty: "Comedically donning an oversized apron and washing pots for a week.",
      };
    case "DOJO_EXHIBITION":
      return {
        name: "Dojo Exhibition",
        description: "Shinai sparring, flow-state parries, footwork, and collarbone locks on the pier.",
        defaultPlayerStakes: "Sweeping Dojo Mats for a Fortnight",
        defaultOpponentStakes: "Old Pier Turf Rights & Honorary Dojo Master Key",
        keySkills: ["Flow-State Parry", "Shinai Strike", "Ring Awareness"],
        forfeitPenalty: "Admitting defeat with a bow and fetching giant parfaits for the victor.",
      };
    case "VIP_DEBATE":
      return {
        name: "VIP Debate",
        description: "Municipal bylaws, sommelier blind tastings, and high-society contract wit.",
        defaultPlayerStakes: "Public Apology in 'The Solaris Siren'",
        defaultOpponentStakes: "Audit Postponement & 5★ Landmark Endorsement",
        keySkills: ["Contract Precision", "Vintage Appraisal", "Patrician Poise"],
        forfeitPenalty: "Flustered stammering, admitting moral defeat, and paying the banquet tab.",
      };
    case "BEACH_TOURNAMENT":
      return {
        name: "Beach Tournament",
        description: "Two-on-two coastal beach volleyball, diving digs, and high-flying spikes.",
        defaultPlayerStakes: "Buying Sunset Rambla Gelato for the Whole Team",
        defaultOpponentStakes: "Prime Boardwalk Pop-Up Booth Rights & Mascot Trophy",
        keySkills: ["Diving Dig", "Setter Chemistry", "Mascot Spike"],
        forfeitPenalty: "Getting playfully buried in the sand up to the neck by the cheer squad.",
      };
    default:
      return {
        name: "Coastal Showdown",
        description: "Standard Article 9 friendly wager contest.",
        defaultPlayerStakes: "1-Week Dishwasher Shift",
        defaultOpponentStakes: "+1 Star Rating Progress",
        keySkills: ["Poise", "Tempo", "Panache"],
        forfeitPenalty: "Admitting defeat with a flustered blush.",
      };
  }
}

/**
 * Resolves a non-lethal Showdown round with Composure and Hype/Cool vitals.
 */
export function resolveShowdownRound(params: {
  playerStance: CoastalStanceType;
  playerAction: "strike" | "burst" | "synergy" | "defense";
  playerComposure: number;
  playerHypeOrCool: number;
  opponentComposure: number;
  opponentStance?: CoastalStanceType;
  partnerHeroineName?: string;
}): {
  playerComposureDelta: number;
  opponentComposureDelta: number;
  hypeOrCoolDelta: number;
  newPlayerComposure: number;
  newOpponentComposure: number;
  newHypeOrCool: number;
  roundNarrative: string;
  isMeltdown: boolean;
  isVictory: boolean;
} {
  const {
    playerStance,
    playerAction,
    playerComposure,
    playerHypeOrCool,
    opponentComposure,
    partnerHeroineName,
  } = params;

  let playerCompDelta = 0;
  let opponentCompDelta = 0;
  let resourceDelta = 0;
  let narrative = "";

  const stance =
    COASTAL_STANCES.find(
      (s) => s.id === playerStance || (playerStance === "SUN_DRENCHED_TEMPO" && s.id === "FLOW_STATE_RHYTHM")
    ) || COASTAL_STANCES[0];

  switch (playerAction) {
    case "strike":
      opponentCompDelta = -18 - (stance.hypeGenerationBonus > 15 ? 4 : 0);
      playerCompDelta = -6 + Math.round(stance.composureDefenseBonus * 0.4);
      resourceDelta = 12;
      narrative = `Protagonist steps in with a crisp ${stance.name} maneuver, pressing the rival's poise while building momentum.`;
      break;
    case "burst":
      if (playerHypeOrCool >= 25) {
        opponentCompDelta = -32;
        playerCompDelta = -8;
        resourceDelta = -25;
        narrative = `A dazzling flare of coastal flair! The crowd roars as the rival stumbles into flustered retreat.`;
      } else {
        opponentCompDelta = -12;
        playerCompDelta = -14;
        resourceDelta = 10;
        narrative = `Insufficient momentum for a full burst! The move falters, leaving protagonist exposed.`;
      }
      break;
    case "synergy":
      const partner = partnerHeroineName || "Partner";
      opponentCompDelta = -28;
      playerCompDelta = 12; // Composure restore
      resourceDelta = -20;
      narrative = `Dynamic dyad coordination! Protagonist and ${partner} execute a synchronized display, rallying their composure!`;
      break;
    case "defense":
      playerCompDelta = 20 + stance.composureDefenseBonus;
      opponentCompDelta = -5;
      resourceDelta = 8;
      narrative = `Protagonist adopts an unshakeable poise, shrugging off the rival's critique and resetting the tempo.`;
      break;
  }

  const newPlayerComp = Math.max(0, Math.min(100, playerComposure + playerCompDelta));
  const newOpponentComp = Math.max(0, Math.min(100, opponentComposure + opponentCompDelta));
  const newResource = Math.max(0, Math.min(100, playerHypeOrCool + resourceDelta));

  const isMeltdown = newPlayerComp <= 0;
  const isVictory = newOpponentComp <= 0;

  if (isMeltdown) {
    narrative += ` [COMPOSURE MELTDOWN: Protagonist loses psychological footing and concedes the round with a flustered blush!]`;
  } else if (isVictory) {
    narrative += ` [SHOWDOWN VICTORY: Rival's composure shatters completely—they concede the wager in breathless surrender!]`;
  }

  return {
    playerComposureDelta: playerCompDelta,
    opponentComposureDelta: opponentCompDelta,
    hypeOrCoolDelta: resourceDelta,
    newPlayerComposure: newPlayerComp,
    newOpponentComposure: newOpponentComp,
    newHypeOrCool: newResource,
    roundNarrative: narrative,
    isMeltdown,
    isVictory,
  };
}

// ============================================================================
// 8. "CAUGHT RED-HANDED" KEEPSAKE JEALOUSY & CANONICAL KEEPSAKE CATALOG
// ============================================================================

export const PORT_SOLARIS_CANONICAL_KEEPSAKES: Record<
  string,
  KeepsakeItem & { description: string; effectLabel: string }
> = {
  "Seraphina Vane": {
    id: "keepsake_seraphina_watch",
    name: "Vintage Platinum Audit Pocket Watch",
    slot: "TIMEPIECE",
    giftedByHeroineId: "Seraphina Vane",
    description:
      "Seraphina's personal Vane-crested platinum pocket watch, engraved inside the lid with the exact minute of your first midnight ramen truce in Room 201.",
    effectLabel: "+25% Social Panache & -20% Audit Penalties (Triggers Jealousy if spotted by another heroine)",
    statModifiers: {
      maxComposure: 15,
      panachePower: 25,
      shopRevenueBonus: 20,
    },
    jealousyQuirk: {
      description: "Ticks with unmistakable Vane family precision; rival heroines immediately recognize her monogram.",
      composurePenaltyOnOtherDates: 15,
    },
  },
  "Vivienne Laurent": {
    id: "keepsake_vivienne_pearl",
    name: "Black Sand Pearl Cufflinks & Clause 7 Signet",
    slot: "HOUSE_EMBLEM",
    giftedByHeroineId: "Vivienne Laurent",
    description:
      "Bespoke black-sand pearl cufflinks from the Laurent Shipping Dynasty, worn by Vivienne's official Clause 7 betrothed escort.",
    effectLabel: "+30% VIP Prestige & Composure Reflection (Triggers Jealousy if spotted by another heroine)",
    statModifiers: {
      maxComposure: 20,
      panachePower: 30,
      shopRevenueBonus: 25,
    },
    jealousyQuirk: {
      description: "Bears the private Laurent betrothal crest—unmistakable proof of your Clause 7 pact.",
      composurePenaltyOnOtherDates: 18,
    },
  },
  "Mia Bellini": {
    id: "keepsake_mia_tamper",
    name: "Nonna Bellini's Brass Espresso Tamper & Seashell Ribbon",
    slot: "TOOL_OF_THE_TRADE",
    giftedByHeroineId: "Mia Bellini",
    description:
      "Heirloom brass espresso tamper wrapped in the braided Driftwood Cove seashell ribbon Mia kept since the summer you left.",
    effectLabel: "+30% Culinary Tempo Hype & +25 Morning Composure (Triggers Jealousy if spotted by another heroine)",
    statModifiers: {
      maxComposure: 25,
      tempoPower: 30,
      shopRevenueBonus: 20,
    },
    jealousyQuirk: {
      description: "Faintly scented with Mia's vanilla-brioche flour and tied with her childhood ribbon.",
      composurePenaltyOnOtherDates: 15,
    },
  },
  "Colette Moreau": {
    id: "keepsake_colette_tongs",
    name: "Silver Sugar-Tongs & Velvet Cellar Key of L'Étoile",
    slot: "TOOL_OF_THE_TRADE",
    giftedByHeroineId: "Colette Moreau",
    description:
      "Colette's prized sterling silver absinthe-and-sugar tongs paired with the private key to her Room 204 midnight tasting reserve.",
    effectLabel: "+35% Blush Zone Infliction & +25% Evening Bar Revenue (Triggers Jealousy if spotted by another heroine)",
    statModifiers: {
      tempoPower: 15,
      panachePower: 20,
      blushDamageBonus: 35,
      shopRevenueBonus: 25,
    },
    jealousyQuirk: {
      description: "Engraved with Colette's sommelier crest and a faint trace of her peach-bellini perfume.",
      composurePenaltyOnOtherDates: 15,
    },
  },
  "Pippa Reyes": {
    id: "keepsake_pippa_whistle",
    name: "Gold-Plated South-Shore Lifeguard Whistle on Braided Cord",
    slot: "POCKET_CHARM",
    giftedByHeroineId: "Pippa Reyes",
    description:
      "Pippa's championship South Beach whistle on a hand-braided neon cord she wove for her 'favorite Big Bro—and more.'",
    effectLabel: "+30 Starting Showdown Hype & +20 Physical Tempo (Triggers Jealousy if spotted by another heroine)",
    statModifiers: {
      maxComposure: 15,
      tempoPower: 25,
      blushDamageBonus: 20,
    },
    jealousyQuirk: {
      description: "Has Pippa's cheeky heart-shaped sticker stamped right on the brass barrel.",
      composurePenaltyOnOtherDates: 15,
    },
  },
  "Kaede Tachibana": {
    id: "keepsake_kaede_cord",
    name: "Woven Crimson Dojo Wrist-Cord & Harbour Seal Charm",
    slot: "POCKET_CHARM",
    giftedByHeroineId: "Kaede Tachibana",
    description:
      "A traditional silk kendo wrist-wrap blessed at the Tachibana shrine, with a tiny arcade harbour-seal charm tucked inside the knot.",
    effectLabel: "+25% Parry Composure Defense & -15% Scandal Heat (Triggers Jealousy if spotted by another heroine)",
    statModifiers: {
      maxComposure: 25,
      tempoPower: 25,
    },
    jealousyQuirk: {
      description: "Tied onto your wrist with a traditional martial-arts betrothal knot only Kaede knows.",
      composurePenaltyOnOtherDates: 15,
    },
  },
  "Roxy Vance": {
    id: "keepsake_roxy_film",
    name: "35mm Brass Film Canister ('DO NOT DEVELOP') & Press Badge",
    slot: "POCKET_CHARM",
    giftedByHeroineId: "Roxy Vance",
    description:
      "The sole undeveloped 35mm film roll containing Roxy's career-making scoop—which she handed over to you instead of printing.",
    effectLabel: "+35% Scandal-to-Foot-Traffic Conversion & +25 Panache (Triggers Jealousy if spotted by another heroine)",
    statModifiers: {
      panachePower: 25,
      blushDamageBonus: 25,
      shopRevenueBonus: 35,
    },
    jealousyQuirk: {
      description: "Stamped with Roxy's lipstick mark and 'EDITOR'S EXCLUSIVE PROPERTY' in red ink.",
      composurePenaltyOnOtherDates: 18,
    },
  },
  "Chloe Lin": {
    id: "keepsake_chloe_token",
    name: "Gold-Plated 99-Win Old Pier Arcade Token & Pastel Hoodie Drawstring",
    slot: "POCKET_CHARM",
    giftedByHeroineId: "Chloe Lin",
    description:
      "Chloe's undefeated Old Pier Arcade champion coin threaded onto a spare pastel drawstring from her favorite oversized nap hoodie.",
    effectLabel: "-25% Debt Interest (Clause 9B) & +25 Frame-Data Reflex (Triggers Jealousy if spotted by another heroine)",
    statModifiers: {
      maxComposure: 20,
      tempoPower: 15,
      panachePower: 20,
      shopRevenueBonus: 25,
    },
    jealousyQuirk: {
      description: "Engraved with 'PLAYER TWO RESERVED — ZERO' on the reverse face.",
      composurePenaltyOnOtherDates: 15,
    },
  },
  "Nadia Saint-Clair": {
    id: "keepsake_nadia_loupe",
    name: "24k Gold-Chain Jeweler's Loupe & Signed Charcoal Portrait",
    slot: "TIMEPIECE",
    giftedByHeroineId: "Nadia Saint-Clair",
    description:
      "Nadia's heirloom Platinum Trust appraisal loupe on a delicate gold chain, accompanied by a folded charcoal sketch of you from Room 205.",
    effectLabel: "+30% VIP Table Prestige & Clause 4B Cultural Merit (Triggers Jealousy if spotted by another heroine)",
    statModifiers: {
      maxComposure: 20,
      panachePower: 30,
      shopRevenueBonus: 30,
    },
    jealousyQuirk: {
      description: "Hangs from the exact gold spectacle chain design Nadia wears at every tasting.",
      composurePenaltyOnOtherDates: 16,
    },
  },
  "Zuri Delacroix": {
    id: "keepsake_zuri_spade",
    name: "Hand-Carved Olivewood Gelato Spade & Night-Blooming Orchid Vial",
    slot: "TOOL_OF_THE_TRADE",
    giftedByHeroineId: "Zuri Delacroix",
    description:
      "An heirloom Delacroix olivewood tasting spade paired with a glass pendant of Zuri's 'Blush-Zone Pistachio Matcha' essence.",
    effectLabel: "+30% Café Dessert Tips & +30% Blush Zone Infliction (Triggers Jealousy if spotted by another heroine)",
    statModifiers: {
      tempoPower: 20,
      panachePower: 15,
      blushDamageBonus: 30,
      shopRevenueBonus: 30,
    },
    jealousyQuirk: {
      description: "Gives off Zuri's unmistakable sweet matcha-and-vanilla orchid aroma.",
      composurePenaltyOnOtherDates: 16,
    },
  },
};

/**
 * Generates canonical Port Solaris Romance & Article 9 Rival Milestone Quests (25%, 50%, 75%, 90%, 100%).
 * Replaces generic dark-fantasy "planar crisis" placeholders with coastal rom-com & rival boss storylines.
 */
export function buildPortSolarisRomanceMilestoneQuest(
  canonicalName: string,
  milestone: 25 | 50 | 75 | 90 | 100
): {
  id: string;
  title: string;
  description: string;
  difficulty: "D" | "C" | "B" | "A" | "S";
  objectives: Array<{ text: string; completed: boolean }>;
  rewards: {
    exp: number;
    gold: number;
    items?: string[];
    title?: string;
  };
} {
  const dossier = PORT_SOLARIS_HEROINE_DOSSIERS[canonicalName];
  const keepsake = PORT_SOLARIS_CANONICAL_KEEPSAKES[canonicalName];
  const rivalName = dossier?.rivalBossTieIn || "Chairman Alistair Vane's Auditors";
  const roomLabel =
    dossier?.isBoardingHouseTenant && dossier?.assignedRoomNumber
      ? `Room 20${dossier.assignedRoomNumber}`
      : "The Stray Anchor Rooftop Terrace";
  const roleLabel = (dossier?.preferredShopRole || "FLOOR_HOST").replace(/_/g, " ");
  const slug = canonicalName.toLowerCase().replace(/[^a-z0-9]/g, "_");

  switch (milestone) {
    case 25:
      return {
        id: `romance_${slug}_25`,
        title: `${canonicalName}: After-Hours Shift & First Blush (25% Bond)`,
        description: `The initial walls are starting to crack. Share a late-night ${roleLabel} shift or private tasting with ${canonicalName} at The Stray Anchor and push her Composure into The Blush Zone.`,
        difficulty: "D",
        objectives: [
          {
            text: `Work a late-night café shift or boardwalk outing alongside ${canonicalName}`,
            completed: false,
          },
          {
            text: `Crack ${canonicalName}'s guard during a quiet one-on-one moment in Driftwood Cove`,
            completed: false,
          },
        ],
        rewards: {
          exp: 110,
          gold: 150,
        },
      };
    case 50:
      return {
        id: `romance_${slug}_50`,
        title: `${canonicalName}: Thin Walls & ${roomLabel} Confessional (50% Bond)`,
        description: `Under Article 8, ${canonicalName} has become indispensable to The Stray Anchor. Uncover her hidden Core Memory during a midnight heart-to-heart in ${roomLabel}.`,
        difficulty: "C",
        objectives: [
          {
            text: `Meet ${canonicalName} after closing hours in ${roomLabel}`,
            completed: false,
          },
          {
            text: `Unlock ${canonicalName}'s canonical Core Memory and solidify your housemate pact`,
            completed: false,
          },
        ],
        rewards: {
          exp: 165,
          gold: 300,
          title: `${canonicalName.split(" ")[0]}'s Confidant`,
        },
      };
    case 75:
      return {
        id: `romance_${slug}_75`,
        title: `${canonicalName}: Article 9 Showdown vs. ${rivalName.split("(")[0].trim()} (75% Bond)`,
        description: `${rivalName} has issued a public Article 9 challenge targeting ${canonicalName}'s standing on Port Solaris. Stand beside her as her Dyad partner (${dossier?.dyadPassiveName || "Coastal Synergy"}) and shatter her rival's Composure in front of the whole island!`,
        difficulty: "B",
        objectives: [
          {
            text: `Accept the sanctioned Article 9 Turf Showdown against ${rivalName}`,
            completed: false,
          },
          {
            text: `Coordinate with ${canonicalName} (${dossier?.dyadPassiveName || "Dyad Synergy"}) to break the rival's Composure`,
            completed: false,
          },
        ],
        rewards: {
          exp: 220,
          gold: 500,
          title: `Champion of ${canonicalName.split(" ")[0]}`,
        },
      };
    case 90:
      return {
        id: `romance_${slug}_90`,
        title: `${canonicalName}: Midnight Rooftop Fever Pitch (90% Bond)`,
        description: `With the 30-day Star Audit reaching its climax, ${canonicalName}'s heart rate spikes whenever you're alone together. Share an unguarded midnight confession under the string lights of The Stray Anchor's rooftop terrace.`,
        difficulty: "A",
        objectives: [
          {
            text: `Invite ${canonicalName} up to the lantern-lit Rooftop Terrace after the evening rush`,
            completed: false,
          },
          {
            text: `Draw ${canonicalName} past her final defenses without letting her retreat behind her pride`,
            completed: false,
          },
        ],
        rewards: {
          exp: 260,
          gold: 650,
          title: `${canonicalName.split(" ")[0]}'s Heart-Stealer`,
        },
      };
    case 100:
    default:
      return {
        id: `romance_${slug}_100`,
        title: `${canonicalName}: Five-Star Sovereign & Driftwood Cove Fireworks (100% Bond)`,
        description: `True Route Finale. Under the High Summer festival fireworks over Driftwood Cove, seal your permanent Article 10 promise with ${canonicalName} and receive her personal Keepsake.`,
        difficulty: "S",
        objectives: [
          {
            text: `Share the 5-Star Island Sovereign fireworks finale alone with ${canonicalName}`,
            completed: false,
          },
          {
            text: `Accept ${canonicalName}'s personal Keepsake (${keepsake?.name || `${canonicalName}'s Keepsake`})`,
            completed: false,
          },
        ],
        rewards: {
          exp: 320,
          gold: 1000,
          items: [keepsake?.name || `${canonicalName}'s Keepsake`],
          title: `Consort of ${canonicalName}`,
        },
      };
  }
}

/**
 * Normalizes a list or map of keepsakes into an array of KeepsakeItem.
 */
function extractKeepsakes(
  input: KeepsakeItem[] | Partial<Record<KeepsakeSlot, KeepsakeItem>> | undefined
): KeepsakeItem[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return Object.values(input).filter((k): k is KeepsakeItem => Boolean(k && k.id));
}

/**
 * Checks whether an active heroine notices the player wearing another heroine's keepsake.
 * If triggered, returns narrative directive, BPM spike, and composure penalty.
 */
export function detectKeepsakeJealousy(
  equippedKeepsakes: KeepsakeItem[] | Partial<Record<KeepsakeSlot, KeepsakeItem>>,
  activeHeroineName: string
): {
  hasJealousy: boolean;
  conflictingKeepsake?: KeepsakeItem;
  originalHeroine?: string;
  promptDirective?: string;
  bpmSpike: number;
  composurePenalty: number;
} {
  const keepsakes = extractKeepsakes(equippedKeepsakes);
  const NON_HEROINES = new Set(["narrator", "player", "protagonist", "wanderer", "system"]);
  if (
    !activeHeroineName ||
    typeof activeHeroineName !== "string" ||
    NON_HEROINES.has(activeHeroineName.trim().toLowerCase()) ||
    keepsakes.length === 0
  ) {
    return { hasJealousy: false, bpmSpike: 0, composurePenalty: 0 };
  }

  const activeNorm = activeHeroineName.trim().toLowerCase().replace(/^comp_/, "");
  const activeTokens = activeNorm.split(/\s+/).filter(Boolean);

  for (const item of keepsakes) {
    const ownerId = item?.giftedByHeroineId;
    if (!ownerId || typeof ownerId !== "string") continue;

    const ownerNorm = ownerId.trim().toLowerCase().replace(/^comp_/, "");
    const ownerTokens = ownerNorm.split(/\s+/).filter(Boolean);

    // Find clean display name of original owner
    let ownerDisplayName = ownerId;
    for (const [key, dossier] of Object.entries(PORT_SOLARIS_HEROINE_DOSSIERS)) {
      const dId = (dossier?.id || "").toLowerCase();
      const dName = (dossier?.name || "").toLowerCase();
      if (
        (dId && dId === ownerId.toLowerCase()) ||
        key.toLowerCase().includes(ownerNorm) ||
        (dName && dName.includes(ownerNorm)) ||
        (dId && ownerNorm.includes(dId.replace(/^comp_/, "")))
      ) {
        ownerDisplayName = dossier.name;
        break;
      }
    }

    const ownerDisplayTokens = (ownerDisplayName || "").toLowerCase().split(/\s+/).filter(Boolean);

    const isOwner =
      ownerNorm === activeNorm ||
      activeTokens.some((t) => ownerTokens.includes(t) || ownerDisplayTokens.includes(t)) ||
      ownerTokens.some((t) => activeTokens.includes(t));

    if (!isOwner) {
      return {
        hasJealousy: true,
        conflictingKeepsake: item,
        originalHeroine: ownerDisplayName,
        bpmSpike: 25,
        composurePenalty: 15,
        promptDirective: `⚠️ CAUGHT RED-HANDED JEALOUSY TRIGGER: ${activeHeroineName} has visibly noticed that the protagonist is wearing "${item.name}", a personal keepsake gifted by ${ownerDisplayName}! She MUST react with immediate sharp jealousy, flustered pouting, or suspicious interrogation in her dialogue.`,
      };
    }
  }

  return { hasJealousy: false, bpmSpike: 0, composurePenalty: 0 };
}

// ============================================================================
// 9. ISLAND FACTION STANDING & REPUTATION TIERS
// ============================================================================

export const ISLAND_FACTIONS: IslandFaction[] = [
  "PLATINUM_BOARD",
  "BOARDWALK_GUILD",
  "BREAKERS_UNION",
  "DRIFTWOOD_SYNDICATE",
];

export function getFactionReputationTier(
  reputation: number
): "NEUTRAL" | "RESPECTED" | "HONORED" | "EXALTED" {
  const rep = Math.max(0, Math.min(100, reputation ?? 0));
  if (rep >= 75) return "EXALTED";
  if (rep >= 50) return "HONORED";
  if (rep >= 25) return "RESPECTED";
  return "NEUTRAL";
}

export function getFactionPerks(
  faction: IslandFaction,
  tier: FactionTier
): { title: string; perks: string[] } {
  const isNeutral = tier === "NEUTRAL";
  const isRespected = tier === "RESPECTED" || tier === "HONORED" || tier === "EXALTED";
  const isHonored = tier === "HONORED" || tier === "EXALTED";
  const isExalted = tier === "EXALTED";

  switch (faction) {
    case "PLATINUM_BOARD":
      return {
        title: "The Platinum Board (High-Society Trustees)",
        perks: [
          isNeutral ? "Standard audit inspection schedule" : "Audit penalty grace period (-20% fines)",
          isRespected ? "Access to Platinum Tramway & private sunset viewpoints" : "Tramway locked",
          isHonored ? "VIP Tasting Room bookings at The Stray Anchor" : "Tasting room locked",
          isExalted ? "5-Star Landmark deed endorsement & permanent immunity" : "Deed endorsement locked",
        ],
      };
    case "BOARDWALK_GUILD":
      return {
        title: "The Boardwalk Guild (Artisans & Bakers)",
        perks: [
          isNeutral ? "Standard wholesale rates" : "10% wholesale ingredient discount",
          isRespected ? "Shared artisan recipes & culinary synergy boosts" : "Secret recipes locked",
          isHonored ? "Prime pop-up booth at the Sunset Rambla Festival" : "Festival booth locked",
          isExalted ? "Master Artisan certification (+25% café base revenue)" : "Certification locked",
        ],
      };
    case "BREAKERS_UNION":
      return {
        title: "The Breakers Union (Dojo Sparrers & Dockers)",
        perks: [
          isNeutral ? "Standard pier access" : "Free bouncer reinforcement on rowdy shifts",
          isRespected ? "Access to Old Pier training mats & sparring kata" : "Mats locked",
          isHonored ? "Tournament sponsorship (+30 Hype in Beach/Dojo clashes)" : "Sponsorship locked",
          isExalted ? "Permanent beach patrol shield (-15% break-in risk)" : "Patrol locked",
        ],
      };
    case "DRIFTWOOD_SYNDICATE":
      return {
        title: "The Driftwood Syndicate (Arcade Savants & Fixers)",
        perks: [
          isNeutral ? "Standard arcade rates" : "Early audit schedule leaks & warnings",
          isRespected ? "Favorable wager odds & insider betting tips" : "Insider tips locked",
          isHonored ? "Positive headline spin in 'The Solaris Siren' (+35% foot traffic)" : "Spin locked",
          isExalted ? "Debt loophole slashing (-30% outstanding debt interest)" : "Loophole locked",
        ],
      };
  }
}

/**
 * Deterministically adjusts standing with an island faction, clamped [0, 100].
 */
export function adjustFactionStanding(
  currentStandings: Record<IslandFaction, number> | undefined,
  faction: IslandFaction,
  delta: number
): Record<IslandFaction, number> {
  const base: Record<IslandFaction, number> = {
    PLATINUM_BOARD: 10,
    BOARDWALK_GUILD: 15,
    BREAKERS_UNION: 10,
    DRIFTWOOD_SYNDICATE: 10,
    ...(currentStandings || {}),
  };
  base[faction] = Math.max(0, Math.min(100, (base[faction] ?? 0) + delta));
  return base;
}

// ============================================================================
// 10. TURN DIRECTIVE BUILDER FOR PORT SOLARIS
// ============================================================================

/**
 * Builds the complete prompt directive for Port Solaris LLM turns.
 * Ensures romantic comedy tone, live BPM tracking, non-lethal showdown rules,
 * and Caught Red-Handed warnings are enforced without dark-fantasy bleed.
 */
export function buildPortSolarisTurnDirective(params: {
  activeSpeaker: string;
  speakerBpm?: number;
  speakerAffection?: number;
  speakerGuardTier?: "IRONCLAD" | "SELECTIVE" | "WARM_RIVAL";
  boardingHouseState?: BoardingHouseState;
  equippedKeepsakes?: KeepsakeItem[];
  factionStanding?: Record<IslandFaction, number>;
  activeShowdown?: {
    contestType: ShowdownContestType;
    opponentName: string;
    playerStakes: string;
    opponentStakes: string;
  };
}): string {
  const {
    activeSpeaker,
    speakerBpm = 55,
    speakerAffection = 20,
    speakerGuardTier = "SELECTIVE",
    boardingHouseState,
    equippedKeepsakes = [],
    activeShowdown,
  } = params;

  const ceiling = getAffectionBpmCeiling(speakerAffection, speakerGuardTier);
  const effectiveBpm = Math.max(40, Math.min(ceiling, speakerBpm));
  const bpmZone = getBpmZone(effectiveBpm);
  const jealousy = detectKeepsakeJealousy(equippedKeepsakes, activeSpeaker);

  const speakerDossier =
    PORT_SOLARIS_HEROINE_DOSSIERS[activeSpeaker] ||
    Object.values(PORT_SOLARIS_HEROINE_DOSSIERS).find(
      (d) => activeSpeaker && d?.name && String(activeSpeaker).toLowerCase().includes(String(d.name).toLowerCase())
    );

  const daysLeft = boardingHouseState?.daysUntilAudit ?? 30;
  const nextMilestone =
    AUDIT_MILESTONES.find((m) => m.day <= daysLeft) || AUDIT_MILESTONES[AUDIT_MILESTONES.length - 1];

  const lines: string[] = [
    "--- PORT SOLARIS ROM-COM & ARTICLE 9 SHOWDOWN DIRECTIVE ---",
    `SETTING CONTEXT: Port Solaris — Sun-drenched coastal island of culinary rivalries, boarding house banters, fake-dating pacts, and Article 9 Showdowns. NO dark fantasy death, NO mortal bleeding, NO Eldritch void regressions.`,
    `CANONICAL WORLD & ANTI-HALLUCINATION GUARD (DO NOT INVENT OR CONTRADICT):`,
    `  * DEED & DEBT ORIGIN: The protagonist inherited "The Stray Anchor" (and his grandfather's brass espresso tamper) from his late Uncle Marco ('Skipper' Marco), who took out a 5,000 Solar Crown typhoon-restoration mortgage now held by Chairman Alistair Vane's Platinum Hospitality Conglomerate.`,
    `  * ARCHITECTURE & UPSTAIRS FLOORPLAN: 1st Floor = 40-seat Cove Patio, Open-Flame Kitchen & Colette's Evening Bar; 2nd Floor = 6 Tenant Bedrooms (Room 201: Seraphina Vane, Room 202: Chloe 'Zero' Lin, Room 203: Kaede Tachibana, Room 204: Colette Moreau [secretly writes romance novel 'Velvet Tides' as 'Lady Cerise'], Room 205: Nadia Saint-Clair, Room 206: Zuri Delacroix) + 1 Shared Bathroom (whose vintage brass water heater drops pressure when the espresso steamer runs); 3rd Floor = The Proprietor's Private Captain's Loft (Room 301) opening onto the Rooftop Laundry & Herb Terrace.`,
    `  * COMMUTER HEROINES (NON-BOARDERS): Mia Bellini lives 15ft across the cobblestone lane above her family bakery (Bellini Artisan Patisserie, founded by Nonna Bellini) and has a childhood spare key to your kitchen; Vivienne Laurent lives at Villa Laurent on Tier 5 (Platinum Cliffs) and sneaks down the Cliffside Funicular Tram under her Article 7 Clause 7A fake-fiancé pact; Pippa Reyes lives at the South-Shore Lifeguard Dorms (stores her surfboards under your deck); Roxy Vance lives above The Solaris Siren 35mm darkroom on Campus Terrace.`,
    `  * CHARTER ARTICLES (ONLY ARTICLES 1–10 EXIST — NEVER INVENT OTHER ARTICLE NUMBERS): Article 1 (5 Coastal Tiers & 4 Factions), Article 2 (Deeds & Solar Crowns), Article 3 (Non-Violence & Scandal Heat 0–100%), Article 4 (Star Ledger 0★–5★ & Clause 4B Cultural Merit), Article 5 (Sunset Rambla Supply & South-Shore Stages), Article 6 (Clause 6A 30-Day Eviction Rule & Clause 6B On-Site Resident Auditor forcing Seraphina into Room 201), Article 7 (Clause 7A Fake-Fiancé Exemption & Clause 7B VIP Immunity), Article 8 (Clause 8A Work-for-Rent Shifts & Clause 8B Rooftop Quiet Hours after 11 PM), Article 9 (Clause 9A Public Turf Showdowns, Clause 9B Chloe's Anti-Usury Interest Slash, Clause 9C All-In Deed Wager), Article 10 (5★ Island Sovereign Immunity).`,
    `ACTIVE SPEAKER BPM & COMPOSURE STATE: ${activeSpeaker} is currently at ${effectiveBpm} BPM (${bpmZone.label} — Favor: ${speakerAffection}%).`,
    `BEHAVIOR DIRECTIVE: ${bpmZone.description}`,
    `ANTI-SYCOPHANCY & COMPOSURE RULE: Heroines are NOT easily dazzled, slack-jawed, or breathless over routine actions. At <50% Favor, ${activeSpeaker} maintains her pride, critical standards, and agency—she pushes back, critiques flaws, or tests the protagonist rather than fawning over him or melting into instant worship.`,
  ];

  if (speakerDossier) {
    const residencyText =
      speakerDossier.isBoardingHouseTenant && speakerDossier.assignedRoomNumber
        ? `Live-in Tenant in Upstairs Room 20${speakerDossier.assignedRoomNumber}`
        : speakerDossier.name === "Mia Bellini"
        ? "Next-Door Neighbor above Bellini Artisan Patisserie (holds spare kitchen key)"
        : speakerDossier.name === "Vivienne Laurent"
        ? "Villa Laurent (Platinum Cliffs) • Clause 7A Fake-Fiancé Commuter"
        : speakerDossier.name === "Pippa Reyes"
        ? "South-Shore Lifeguard Dorms • Café Booth #4 Regular"
        : "Campus Terrace (The Solaris Siren Darkroom) • Barstool #7 Regular";
    lines.push(
      `ACTIVE SPEAKER CANON (${speakerDossier.name}): ${speakerDossier.epithet} | Residency: ${residencyText} | Preferred Café Role: ${speakerDossier.preferredShopRole} | Canonical Rival Boss: ${speakerDossier.rivalBossTieIn} | Dyad Passive: ${speakerDossier.dyadPassiveName} (${speakerDossier.dyadPassiveDescription}) | Core Memories: ${speakerDossier.unlockedCoreMemories.join(", ")}.`
    );
  }

  if (effectiveBpm >= 96 && ceiling >= 96) {
    lines.push(getShortCircuitDirective(activeSpeaker));
  }

  if (jealousy.hasJealousy && jealousy.promptDirective) {
    lines.push(jealousy.promptDirective);
  }

  if (activeShowdown) {
    lines.push(
      `ACTIVE ARTICLE 9 SHOWDOWN: ${activeShowdown.contestType} against ${activeShowdown.opponentName}.`,
      `STAKES: Player risks "${activeShowdown.playerStakes}" vs Opponent's "${activeShowdown.opponentStakes}".`,
      `RULES: Non-lethal Composure & Hype/Cool rules apply. At 0 Composure, the loser experiences a Composure Meltdown and concedes the wager with comedic forfeits (washing dishes, buying parfaits). NO physical fatalities.`
    );
  }

  if (boardingHouseState) {
    lines.push(
      `THE STRAY ANCHOR STATUS: ${boardingHouseState.starRating}★ Rating | Debt: ${boardingHouseState.outstandingDebt} / 5,000 Solar Crowns (Star Thresholds: 1★≤4,000, 2★≤3,000, 3★≤2,000, 4★≤1,000, 5★=0) | Days Until Audit: ${boardingHouseState.daysUntilAudit} (Next Tribunal: Day ${nextMilestone.day} "${nextMilestone.title}" by ${nextMilestone.inspector}, requires ${nextMilestone.requiredStar}★) | Scandal Heat: ${boardingHouseState.scandalHeat}%.`
    );
  }

  return lines.join("\n");
}

// ============================================================================
// 8. STAGE LAYOUT & MULTI-CHARACTER SPOTLIGHT ENGINE
// ============================================================================

/**
 * Resolves which companion should be spotlighted on stage.
 * Precedence:
 * 1. Manual player spotlight selection (if currently present).
 * 2. Active speaker companion (if currently present).
 * 3. First present companion fallback.
 * 4. null if no companions are present.
 */
export function resolveSpotlightCompanion<T extends { name: string } = StoryCompanion>(
  presentComps: T[],
  currentSpeaker: string,
  manualSpotlightName: string | null
): T | null {
  if (!presentComps || presentComps.length === 0) return null;
  const manualComp = manualSpotlightName
    ? presentComps.find((c) => (c?.name || "").toLowerCase() === manualSpotlightName.toLowerCase())
    : null;
  if (manualComp) return manualComp;

  const speakerLower = (currentSpeaker || "").toLowerCase();
  const speakerComp = speakerLower
    ? presentComps.find((c) => c?.name && speakerLower.includes(c.name.toLowerCase()))
    : null;
  if (speakerComp) return speakerComp;

  return presentComps[0] || null;
}

/**
 * Returns whether a specific companion is currently spotlighted.
 */
export function isCompanionSpotlighted<T extends { name: string } = StoryCompanion>(
  compName: string,
  presentComps: T[],
  currentSpeaker: string,
  manualSpotlightName: string | null
): boolean {
  const spotlight = resolveSpotlightCompanion(presentComps, currentSpeaker, manualSpotlightName);
  if (!spotlight || !spotlight.name || !compName) return false;
  return spotlight.name.toLowerCase() === compName.toLowerCase();
}

/**
 * Stage sprite styling contract: Guarantees full-size rendering (w-full h-full object-contain)
 * and active speaker visual emphasis (brightness-105 animate-float-sway).
 */
export function getStageSpriteClasses(isSpeaking: boolean): string {
  return `h-full w-full object-contain object-bottom filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.95)] cursor-pointer hover:brightness-105 transition-all duration-300 ${
    isSpeaking ? "animate-float-sway brightness-105" : "brightness-95"
  }`;
}

/**
 * Resolves ambient heroine aura styling based on character identity.
 */
export function getStageHeroineAura(heroineName: string): { background: string; auraClass: string } {
  const name = (heroineName || "").toLowerCase();
  if (name.includes("seraphina") || name.includes("evelyn") || name.includes("beatrix")) {
    return {
      background: "radial-gradient(circle, rgba(244,63,94,0.7) 0%, transparent 70%)",
      auraClass: "bg-rose-500",
    };
  }
  if (name.includes("vivienne") || name.includes("aria")) {
    return {
      background: "radial-gradient(circle, rgba(6,182,212,0.7) 0%, transparent 70%)",
      auraClass: "bg-cyan-500",
    };
  }
  if (name.includes("mia") || name.includes("pippa")) {
    return {
      background: "radial-gradient(circle, rgba(245,158,11,0.7) 0%, transparent 70%)",
      auraClass: "bg-amber-500",
    };
  }
  return {
    background: "radial-gradient(circle, rgba(168,85,247,0.7) 0%, transparent 70%)",
    auraClass: "bg-purple-500",
  };
}

/**
 * Pure state reducer for stage focus transitions and active typewriter preservation.
 */
export interface StageFocusState {
  spotlightHeroineName: string | null;
  isTypewriterActive: boolean;
}

export type StageFocusAction =
  | { type: "SELECT_SPOTLIGHT"; heroineName: string; presentComps: Array<{ name: string; [key: string]: any }> }
  | { type: "START_TYPEWRITER" }
  | { type: "FINISH_TYPEWRITER" };

export function stageFocusTransitionReducer(
  state: StageFocusState,
  action: StageFocusAction
): StageFocusState {
  switch (action.type) {
    case "SELECT_SPOTLIGHT": {
      const isPresent = action.presentComps.some(
        (c) => (c?.name || "").toLowerCase() === (action.heroineName || "").toLowerCase()
      );
      if (!isPresent) return state;
      // Focus transition updates spotlight while preserving active typewriter animation without freezing
      return {
        ...state,
        spotlightHeroineName: action.heroineName,
      };
    }
    case "START_TYPEWRITER":
      return { ...state, isTypewriterActive: true };
    case "FINISH_TYPEWRITER":
      return { ...state, isTypewriterActive: false };
    default:
      return state;
  }
}

