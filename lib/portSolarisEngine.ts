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
  if (!identifier) return undefined;
  const target = identifier.trim().toLowerCase();
  return companions.find(
    (c) =>
      c.id.toLowerCase() === target ||
      c.name.toLowerCase() === target ||
      target.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(target)
  );
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
      if (assignee.toLowerCase().includes("roxy")) {
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

  if (clamped >= 100) {
    return {
      zone: "SHORT_CIRCUIT",
      label: "💥 100 BPM • SHORT-CIRCUIT!",
      color: "rose",
      badgeClass: "bg-rose-950/80 text-rose-300 border-rose-500 animate-pulse font-bold",
      description: "Total emotional meltdown! Facade shattered, helpless blushing, instant victory.",
      socialDefenseMultiplier: 0.0,
      affectionBonusMultiplier: 2.0,
    };
  }
  if (clamped >= 85) {
    return {
      zone: "FEVER_PITCH",
      label: "🔥 Fever Pitch",
      color: "amber",
      badgeClass: "bg-amber-950/80 text-amber-300 border-amber-500 animate-bounce font-semibold",
      description: "Rapid breathing, crimson blush along collarbone, audible heartbeat, stammering.",
      socialDefenseMultiplier: 0.5,
      affectionBonusMultiplier: 1.5,
    };
  }
  if (clamped >= 50) {
    return {
      zone: "BLUSH_ZONE",
      label: "💓 Blush Zone",
      color: "pink",
      badgeClass: "bg-pink-950/60 text-pink-300 border-pink-500 font-medium",
      description: "Averting eyes, twirling hair, nervous throat clearing, transparent excuses.",
      socialDefenseMultiplier: 0.75,
      affectionBonusMultiplier: 1.25,
    };
  }
  return {
    zone: "COMPOSED",
    label: "😎 Composed",
    color: "emerald",
    badgeClass: "bg-emerald-950/50 text-emerald-300 border-emerald-600 font-normal",
    description: "Aloof, poised, unbothered, full composure defenses active.",
    socialDefenseMultiplier: 1.0,
    affectionBonusMultiplier: 1.0,
  };
}

/**
 * Calculates live turn-by-turn BPM delta based on choices, romance, and contact.
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
  }
): {
  newBpm: number;
  zone: BpmZone;
  shortCircuited: boolean;
  delta: number;
} {
  const base = Math.max(40, Math.min(100, currentBpm || 50));
  let delta = 0;

  if (options?.isHeartToHeart) {
    // Cooldown relaxation scene on rooftop terrace or sunset pier
    delta -= 35;
  } else if (options?.isColdResponse) {
    // Aloof / business-only choice
    delta -= 8;
  } else {
    // Romantic / emotional stimulation
    if (isRomanceChoice) delta += 8;
    if (isBlushTrigger) delta += 10;
    if (options?.isPhysicalTouch) delta += 18;
    if (options?.isCaughtRedHanded) delta += 25;

    // Affection progression scaling
    if (affectionDelta > 0) {
      delta += Math.round(affectionDelta * 1.5);
    } else if (affectionDelta < 0) {
      delta += affectionDelta;
    } else if (!isRomanceChoice && !isBlushTrigger && !options?.isPhysicalTouch && !options?.isCaughtRedHanded) {
      // Passive resting decay
      delta -= 3;
    }
  }

  const raw = base + delta;
  const newBpm = Math.max(40, Math.min(100, raw));
  const shortCircuited = newBpm >= 100;
  const zoneInfo = getBpmZone(newBpm);

  return {
    newBpm,
    zone: zoneInfo.zone,
    shortCircuited,
    delta: newBpm - base,
  };
}

/**
 * Formulates the LLM short-circuit narrative directive when a heroine reaches 100 BPM.
 */
export function getShortCircuitDirective(heroineName: string): string {
  return `💥 100 BPM SHORT-CIRCUIT TRIGGER: ${heroineName}'s emotional composure has completely overloaded (100 BPM)! She cannot maintain her facade—she MUST react with overwhelming blush, stammering speech, hiding behind her hair/objects, or dropping her composure entirely. The protagonist wins the verbal confrontation and earns an exclusive Core Memory!`;
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
// 8. "CAUGHT RED-HANDED" KEEPSAKE JEALOUSY
// ============================================================================

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
  if (!activeHeroineName || NON_HEROINES.has(activeHeroineName.trim().toLowerCase()) || keepsakes.length === 0) {
    return { hasJealousy: false, bpmSpike: 0, composurePenalty: 0 };
  }

  const activeNorm = activeHeroineName.trim().toLowerCase().replace(/^comp_/, "");
  const activeTokens = activeNorm.split(/\s+/).filter(Boolean);

  for (const item of keepsakes) {
    const ownerId = item.giftedByHeroineId;
    if (!ownerId) continue;

    const ownerNorm = ownerId.trim().toLowerCase().replace(/^comp_/, "");
    const ownerTokens = ownerNorm.split(/\s+/).filter(Boolean);

    // Find clean display name of original owner
    let ownerDisplayName = ownerId;
    for (const [key, dossier] of Object.entries(PORT_SOLARIS_HEROINE_DOSSIERS)) {
      if (
        dossier.id.toLowerCase() === ownerId.toLowerCase() ||
        key.toLowerCase().includes(ownerNorm) ||
        dossier.name.toLowerCase().includes(ownerNorm) ||
        ownerNorm.includes(dossier.id.toLowerCase().replace(/^comp_/, ""))
      ) {
        ownerDisplayName = dossier.name;
        break;
      }
    }

    const ownerDisplayTokens = ownerDisplayName.toLowerCase().split(/\s+/).filter(Boolean);

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
    speakerBpm = 50,
    boardingHouseState,
    equippedKeepsakes = [],
    activeShowdown,
  } = params;

  const bpmZone = getBpmZone(speakerBpm);
  const jealousy = detectKeepsakeJealousy(equippedKeepsakes, activeSpeaker);

  const lines: string[] = [
    "--- PORT SOLARIS ROM-COM & ARTICLE 9 SHOWDOWN DIRECTIVE ---",
    `SETTING CONTEXT: Port Solaris — Sun-drenched coastal island of culinary rivalries, boarding house banters, fake-dating pacts, and Article 9 Showdowns. NO dark fantasy death, NO mortal bleeding, NO Eldritch void regressions.`,
    `ACTIVE SPEAKER BPM & BLUSH STATE: ${activeSpeaker} is currently at ${speakerBpm} BPM (${bpmZone.label}).`,
    `BEHAVIOR DIRECTIVE: ${bpmZone.description}`,
  ];

  if (speakerBpm >= 100) {
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
      `THE STRAY ANCHOR STATUS: ${boardingHouseState.starRating}★ Rating | Debt: ${boardingHouseState.outstandingDebt} Crowns | Days Until Audit: ${boardingHouseState.daysUntilAudit} | Scandal Heat: ${boardingHouseState.scandalHeat}%.`
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
    ? presentComps.find((c) => c.name.toLowerCase() === manualSpotlightName.toLowerCase())
    : null;
  if (manualComp) return manualComp;

  const speakerComp = presentComps.find((c) =>
    currentSpeaker.toLowerCase().includes(c.name.toLowerCase())
  );
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
  if (!spotlight) return false;
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
  const name = heroineName.toLowerCase();
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
        (c) => c.name.toLowerCase() === action.heroineName.toLowerCase()
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

