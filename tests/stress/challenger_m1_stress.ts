/**
 * Empirical Stress Test Suite for Port Solaris Core Engine (Milestone 1)
 * Challenger 1: Adversarial boundary verification, invariant stress testing, and fuzzing.
 */

import {
  calculateDailyCafeRevenue,
  paydownDebt,
  getStarRatingForDebt,
  advanceAuditDay,
  AUDIT_MILESTONES,
  getScandalTier,
  adjustScandalHeat,
  applyTurnScandalDecay,
  normalizeRoomNumber,
  assignBoardingRoomTenant,
  BOARDING_HOUSE_ROOMS,
  getBpmZone,
  calculateBpmDelta,
  getShortCircuitDirective,
  resolveShowdownRound,
  detectKeepsakeJealousy,
  getFactionReputationTier,
  adjustFactionStanding,
  buildPortSolarisTurnDirective,
  PORT_SOLARIS_SHOP_ROLES,
  PREFERRED_SHOP_ROLES,
  STAR_REVENUE_MULTIPLIERS,
} from "../../lib/portSolarisEngine";
import {
  BoardingHouseState,
  ShopRole,
  KeepsakeItem,
  ShowdownContestType,
  CoastalStanceType,
  IslandFaction,
} from "../../types/port_solaris";
import { StoryCompanion } from "../../types/story";

interface TestReport {
  passed: number;
  failed: number;
  errors: string[];
  findings: string[];
}

const report: TestReport = {
  passed: 0,
  failed: 0,
  errors: [],
  findings: [],
};

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    report.passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    report.failed++;
    const errMsg = `[FAIL] ${testName}${details ? ` -> ${details}` : ""}`;
    report.errors.push(errMsg);
    console.error(`  ${errMsg}`);
  }
}

function recordFinding(title: string, description: string) {
  const findingStr = `[FINDING] ${title}: ${description}`;
  report.findings.push(findingStr);
  console.warn(`  ⚠️ ${findingStr}`);
}

function mockCompanion(partial: {
  id: string;
  name: string;
  affection?: number;
  affectionLevel?: number;
  role?: string;
}): StoryCompanion {
  return {
    id: partial.id,
    name: partial.name,
    title: partial.name,
    role: partial.role ?? "companion",
    color: "rose",
    personality: "Friendly",
    values: [],
    dislikes: [],
    highCompatibility: [],
    baseAffection: partial.affection ?? 20,
    affection: partial.affection ?? 20,
    affectionLevel: partial.affectionLevel ?? partial.affection ?? 20,
    romancePath: "uncommitted",
    expressionKey: "neutral",
    isPresent: true,
    encountered: true,
    seed: 1000,
    baseImageUrl: "",
    visualPrompt: "",
    expressions: {},
  };
}

console.log("===============================================================================");
console.log("STARTING EMPIRICAL CHALLENGER STRESS SUITE: Milestone 1 (lib/portSolarisEngine)");
console.log("===============================================================================\n");

// ============================================================================
// SUITE 1: Extreme Revenue Calculation & Clamping
// ============================================================================
console.log("--- SUITE 1: Extreme Revenue Calculation & Clamping ---");

// 1.1 Zero staff, zero tenants, zero star, zero scandal heat
{
  const emptyState: BoardingHouseState = {
    shopName: "The Stray Anchor",
    starRating: 0,
    daysUntilAudit: 30,
    dailyRevenue: 0,
    outstandingDebt: 5000,
    scandalHeat: 0,
    activeTenants: [],
  };
  const res = calculateDailyCafeRevenue(emptyState, [], {});
  assert(res.revenue === 100, "1.1 Base revenue with 0 staff, 0 tenants, 0★ is exactly 100", `Got ${res.revenue}`);
  assert(res.details.base === 100, "1.1 Details base is 100");
  assert(res.details.staff === 0, "1.1 Details staff is 0");
  assert(res.details.starMult === 1.0, "1.1 Details starMult is 1.0");
  assert(res.details.heatMult === 1.0, "1.1 Details heatMult is 1.0");
  assert(res.details.synergies === 1.0, "1.1 Details synergies is 1.0");
}

// 1.2 Full 5-staff roster with all preferred matches
{
  const fullState: BoardingHouseState = {
    shopName: "The Stray Anchor",
    starRating: 0,
    daysUntilAudit: 30,
    dailyRevenue: 0,
    outstandingDebt: 5000,
    scandalHeat: 0,
    activeTenants: [],
  };
  const companions: StoryCompanion[] = [
    mockCompanion({ id: "comp_mia", name: "Mia Bellini", affection: 40 }),
    mockCompanion({ id: "comp_colette", name: "Colette Moreau", affection: 30 }),
    mockCompanion({ id: "comp_seraphina", name: "Seraphina Vane", affection: 20 }),
    mockCompanion({ id: "comp_kaede", name: "Kaede Tachibana", affection: 20 }),
    mockCompanion({ id: "comp_vivienne", name: "Vivienne Laurent", affection: 20 }),
  ];
  const assignments: Record<ShopRole, string> = {
    CHEF: "Mia Bellini",
    MIXOLOGIST: "Colette Moreau",
    FLOOR_HOST: "Seraphina Vane",
    BOUNCER: "Kaede Tachibana",
    PROMOTER: "Vivienne Laurent",
  };
  const res = calculateDailyCafeRevenue(fullState, companions, assignments);
  assert(res.details.staff === 390, `1.2 Preferred staff total is 390 (got ${res.details.staff})`);
  assert(res.details.synergies === 1.55, `1.2 Synergies multiplier is 1.55 (got ${res.details.synergies})`);
  assert(res.revenue === 760, `1.2 Expected revenue with full roster is 760 (got ${res.revenue})`);
}

// 1.3 Star rating multipliers (0 to 5) and out-of-bound star values
{
  const stars: Array<0 | 1 | 2 | 3 | 4 | 5> = [0, 1, 2, 3, 4, 5];
  const expectedMults = [1.0, 1.5, 2.2, 3.0, 4.2, 6.0];
  stars.forEach((s, idx) => {
    const st: BoardingHouseState = {
      shopName: "The Stray Anchor",
      starRating: s,
      daysUntilAudit: 30,
      dailyRevenue: 0,
      outstandingDebt: 0,
      scandalHeat: 0,
      activeTenants: [],
    };
    const res = calculateDailyCafeRevenue(st, [], {});
    assert(
      res.details.starMult === expectedMults[idx],
      `1.3 Star rating ${s}★ yields multiplier ${expectedMults[idx]} (got ${res.details.starMult})`
    );
    assert(
      res.revenue === Math.round(100 * expectedMults[idx]),
      `1.3 Revenue for ${s}★ with base 100 is ${Math.round(100 * expectedMults[idx])} (got ${res.revenue})`
    );
  });

  const underflowState = { shopName: "The Stray Anchor", starRating: -5 as any, daysUntilAudit: 30, dailyRevenue: 0, outstandingDebt: 0, scandalHeat: 0, activeTenants: [] };
  const underRes = calculateDailyCafeRevenue(underflowState, [], {});
  assert(underRes.details.starMult === 1.0, "1.3 Adversarial star rating -5 clamped to 0★ (1.0x)", `Got ${underRes.details.starMult}`);

  const overflowState = { shopName: "The Stray Anchor", starRating: 99 as any, daysUntilAudit: 30, dailyRevenue: 0, outstandingDebt: 0, scandalHeat: 0, activeTenants: [] };
  const overRes = calculateDailyCafeRevenue(overflowState, [], {});
  assert(overRes.details.starMult === 6.0, "1.3 Adversarial star rating 99 clamped to 5★ (6.0x)", `Got ${overRes.details.starMult}`);
}

// 1.4 Scandal heat extremes & Roxy Vance dyad passive
{
  const heat0 = calculateDailyCafeRevenue({ shopName: "A", starRating: 0, daysUntilAudit: 30, dailyRevenue: 0, outstandingDebt: 0, scandalHeat: 0, activeTenants: [] });
  assert(heat0.details.heatMult === 1.0, "1.4 Heat 0% gives heatMult 1.0");

  const heat100 = calculateDailyCafeRevenue({ shopName: "A", starRating: 0, daysUntilAudit: 30, dailyRevenue: 0, outstandingDebt: 0, scandalHeat: 100, activeTenants: [] });
  assert(heat100.details.heatMult === 1.5, "1.4 Heat 100% gives heatMult 1.5");

  const heatUnderflow = calculateDailyCafeRevenue({ shopName: "A", starRating: 0, daysUntilAudit: 30, dailyRevenue: 0, outstandingDebt: 0, scandalHeat: -99, activeTenants: [] });
  assert(heatUnderflow.details.heatMult === 1.0, "1.4 Negative heat (-99) clamped to 0% -> 1.0x");

  const heatOverflow = calculateDailyCafeRevenue({ shopName: "A", starRating: 0, daysUntilAudit: 30, dailyRevenue: 0, outstandingDebt: 0, scandalHeat: 999, activeTenants: [] });
  assert(heatOverflow.details.heatMult === 1.5, "1.4 Extreme heat (999) clamped to 100% -> 1.5x");

  const roxyPromoter = calculateDailyCafeRevenue(
    { shopName: "A", starRating: 0, daysUntilAudit: 30, dailyRevenue: 0, outstandingDebt: 0, scandalHeat: 100, activeTenants: [] },
    [mockCompanion({ id: "comp_roxy", name: "Roxy Vance" })],
    { PROMOTER: "Roxy Vance" }
  );
  assert(roxyPromoter.details.heatMult === 1.85, "1.4 Roxy promoter adds +0.35 to heatMult (1.5 + 0.35 = 1.85)", `Got ${roxyPromoter.details.heatMult}`);
}

// 1.5 Negative income guard & adversarial affection
{
  const negativeAffComps: StoryCompanion[] = [
    mockCompanion({ id: "comp_mia", name: "Mia Bellini", affection: -100 }),
  ];
  const negAffRes = calculateDailyCafeRevenue(
    { shopName: "A", starRating: 0, daysUntilAudit: 30, dailyRevenue: 0, outstandingDebt: 0, scandalHeat: 0, activeTenants: [] },
    negativeAffComps,
    { CHEF: "Mia Bellini" }
  );
  assert(negAffRes.details.staff === 65, "1.5 Negative affection (-100) clamped to 0 bonus, base+preferred = 65", `Got ${negAffRes.details.staff}`);
  assert(negAffRes.revenue >= 100, "1.5 Revenue is never less than base 100");
}

// 1.6 Tenant Occupancy Bonus Discrepancy Probe
{
  const zeroTenants = calculateDailyCafeRevenue({ shopName: "A", starRating: 0, daysUntilAudit: 30, dailyRevenue: 0, outstandingDebt: 0, scandalHeat: 0, activeTenants: [] });
  const twoTenants = calculateDailyCafeRevenue({ shopName: "A", starRating: 0, daysUntilAudit: 30, dailyRevenue: 0, outstandingDebt: 0, scandalHeat: 0, activeTenants: ["comp_seraphina", "comp_colette"] });
  assert(
    twoTenants.revenue === zeroTenants.revenue + 30,
    "1.6 Two tenants upstairs add +30 crowns to daily revenue"
  );
}

console.log("\n--- SUITE 2: BPM Boundary Oscillations & Clamping ---");

// 2.1 Clamping at 40 and 100
{
  const under = calculateBpmDelta(40, 0, false, false, { isHeartToHeart: true });
  assert(under.newBpm === 40, "2.1 BPM clamped at minimum 40 on large reduction", `Got ${under.newBpm}`);
  assert(under.zone === "COMPOSED", "2.1 Zone at 40 is COMPOSED");

  const coldUnder = calculateBpmDelta(42, 0, false, false, { isColdResponse: true });
  assert(coldUnder.newBpm === 40, "2.1 BPM 42 - 8 clamped at 40", `Got ${coldUnder.newBpm}`);

  const over = calculateBpmDelta(95, 10, true, true, { isPhysicalTouch: true });
  assert(over.newBpm === 100, "2.1 BPM clamped at maximum 100 on large spike", `Got ${over.newBpm}`);
  assert(over.zone === "SHORT_CIRCUIT", "2.1 Zone at 100 is SHORT_CIRCUIT");
  assert(over.shortCircuited === true, "2.1 shortCircuited flag is true at 100 BPM");

  const caught = calculateBpmDelta(80, 0, false, false, { isCaughtRedHanded: true });
  assert(caught.newBpm === 100, "2.1 Caught red-handed (+25) from 80 BPM reaches 100 BPM", `Got ${caught.newBpm}`);
  assert(caught.shortCircuited === true, "2.1 Caught red-handed triggers short-circuit");
}

// 2.2 Zone boundaries verification (40, 49, 50, 84, 85, 99, 100)
{
  assert(getBpmZone(40).zone === "COMPOSED", "2.2 Zone at 40 is COMPOSED");
  assert(getBpmZone(49).zone === "COMPOSED", "2.2 Zone at 49 is COMPOSED");
  assert(getBpmZone(50).zone === "BLUSH_ZONE", "2.2 Zone at 50 is BLUSH_ZONE");
  assert(getBpmZone(84).zone === "BLUSH_ZONE", "2.2 Zone at 84 is BLUSH_ZONE");
  assert(getBpmZone(85).zone === "FEVER_PITCH", "2.2 Zone at 85 is FEVER_PITCH");
  assert(getBpmZone(99).zone === "FEVER_PITCH", "2.2 Zone at 99 is FEVER_PITCH");
  assert(getBpmZone(100).zone === "SHORT_CIRCUIT", "2.2 Zone at 100 is SHORT_CIRCUIT");

  assert(getBpmZone(40).socialDefenseMultiplier === 1.0, "2.2 COMPOSED social defense is 1.0");
  assert(getBpmZone(50).socialDefenseMultiplier === 0.75, "2.2 BLUSH_ZONE social defense is 0.75");
  assert(getBpmZone(85).socialDefenseMultiplier === 0.5, "2.2 FEVER_PITCH social defense is 0.5");
  assert(getBpmZone(100).socialDefenseMultiplier === 0.0, "2.2 SHORT_CIRCUIT social defense is 0.0");
}

// 2.3 Rapid alternating oscillations (100 iterations of romance vs cold)
{
  let currentBpm = 50;
  let allWithinBounds = true;
  for (let i = 0; i < 100; i++) {
    const resRomance = calculateBpmDelta(currentBpm, 0, true, false);
    currentBpm = resRomance.newBpm;
    if (currentBpm < 40 || currentBpm > 100) allWithinBounds = false;

    const resCold = calculateBpmDelta(currentBpm, 0, false, false, { isColdResponse: true });
    currentBpm = resCold.newBpm;
    if (currentBpm < 40 || currentBpm > 100) allWithinBounds = false;
  }
  assert(allWithinBounds, "2.3 100 alternating romance/cold turns strictly respect [40, 100] bounds");
  assert(currentBpm === 50, `2.3 Net 0 oscillation returns to 50 BPM (got ${currentBpm})`);
}

// 2.4 Rapid alternating high-amplitude oscillations (Physical touch +18 vs Heart-to-Heart -35)
{
  let currentBpm = 80;
  let allWithinBounds = true;
  for (let i = 0; i < 50; i++) {
    const spike = calculateBpmDelta(currentBpm, 0, false, false, { isPhysicalTouch: true });
    currentBpm = spike.newBpm;
    if (currentBpm < 40 || currentBpm > 100) allWithinBounds = false;

    const cool = calculateBpmDelta(currentBpm, 0, false, false, { isHeartToHeart: true });
    currentBpm = cool.newBpm;
    if (currentBpm < 40 || currentBpm > 100) allWithinBounds = false;
  }
  assert(allWithinBounds, "2.4 50 high-amplitude spike/cool cycles strictly respect [40, 100] bounds");
}

console.log("\n--- SUITE 3: Debt Paydown & Star Rating Upgrades ---");

// 3.1 Initial debt 5000 -> 0★
{
  assert(getStarRatingForDebt(5000) === 0, "3.1 5000 debt yields 0★");
  assert(getStarRatingForDebt(4001) === 0, "3.1 4001 debt yields 0★");
}

// 3.2 Stepwise debt paydown from 5000 to 0 crossing each threshold
{
  let st: BoardingHouseState = {
    shopName: "The Stray Anchor",
    starRating: 0,
    daysUntilAudit: 30,
    dailyRevenue: 0,
    outstandingDebt: 5000,
    scandalHeat: 0,
    activeTenants: [],
    totalDebtPaid: 0,
  };

  let res = paydownDebt(st, 1000);
  assert(res.remainingDebt === 4000, "3.2 Step 1 debt is 4000");
  assert(res.newStarRating === 1, "3.2 Step 1 star is 1★");
  assert(res.starUpgrade === true, "3.2 Step 1 triggers starUpgrade = true");
  assert(res.effectivePayment === 1000, "3.2 Step 1 effectivePayment is 1000");
  st = res.newState;

  res = paydownDebt(st, 500);
  assert(res.remainingDebt === 3500, "3.2 Step 1b debt is 3500");
  assert(res.newStarRating === 1, "3.2 Step 1b star remains 1★");
  assert(res.starUpgrade === false, "3.2 Step 1b starUpgrade is false");
  assert(res.effectivePayment === 500, "3.2 Step 1b effectivePayment is 500");
  st = res.newState;

  res = paydownDebt(st, 500);
  assert(res.remainingDebt === 3000, "3.2 Step 2 debt is 3000");
  assert(res.newStarRating === 2, "3.2 Step 2 star is 2★");
  assert(res.starUpgrade === true, "3.2 Step 2 triggers starUpgrade = true");
  st = res.newState;

  res = paydownDebt(st, 1000);
  assert(res.remainingDebt === 2000, "3.2 Step 3 debt is 2000");
  assert(res.newStarRating === 3, "3.2 Step 3 star is 3★");
  assert(res.starUpgrade === true, "3.2 Step 3 triggers starUpgrade = true");
  st = res.newState;

  res = paydownDebt(st, 1000);
  assert(res.remainingDebt === 1000, "3.2 Step 4 debt is 1000");
  assert(res.newStarRating === 4, "3.2 Step 4 star is 4★");
  assert(res.starUpgrade === true, "3.2 Step 4 triggers starUpgrade = true");
  st = res.newState;

  res = paydownDebt(st, 1000);
  assert(res.remainingDebt === 0, "3.2 Step 5 debt is exactly 0");
  assert(res.newStarRating === 5, "3.2 Step 5 star is 5★");
  assert(res.starUpgrade === true, "3.2 Step 5 triggers starUpgrade = true");
  st = res.newState;

  assert(st.totalDebtPaid === 5000, `3.2 Total debt paid accumulated accurately to 5000 (got ${st.totalDebtPaid})`);
}

// 3.3 Overpayment (>5,000)
{
  const startState: BoardingHouseState = {
    shopName: "The Stray Anchor",
    starRating: 0,
    daysUntilAudit: 30,
    dailyRevenue: 0,
    outstandingDebt: 5000,
    scandalHeat: 0,
    activeTenants: [],
    totalDebtPaid: 0,
  };
  const res = paydownDebt(startState, 10000);
  assert(res.remainingDebt === 0, "3.3 Overpayment of 10,000 leaves debt at 0 (never negative)", `Got ${res.remainingDebt}`);
  assert(res.effectivePayment === 5000, "3.3 Effective payment is capped to outstanding debt 5000", `Got ${res.effectivePayment}`);
  assert(res.newStarRating === 5, "3.3 Overpayment upgrades directly to 5★");
  assert(res.starUpgrade === true, "3.3 Overpayment triggers starUpgrade");
}

// 3.4 Negative payment attempts (-500, -999999)
{
  const startState: BoardingHouseState = {
    shopName: "The Stray Anchor",
    starRating: 1,
    daysUntilAudit: 20,
    dailyRevenue: 0,
    outstandingDebt: 4000,
    scandalHeat: 0,
    activeTenants: [],
  };
  const res = paydownDebt(startState, -500);
  assert(res.effectivePayment === 0, "3.4 Negative payment is clamped to 0", `Got ${res.effectivePayment}`);
  assert(res.remainingDebt === 4000, "3.4 Debt unchanged by negative payment attempt", `Got ${res.remainingDebt}`);
  assert(res.starUpgrade === false, "3.4 Negative payment triggers no starUpgrade");

  const resHugeNeg = paydownDebt(startState, -999999);
  assert(resHugeNeg.effectivePayment === 0, "3.4 Massive negative payment (-999999) clamped to 0");
  assert(resHugeNeg.remainingDebt === 4000, "3.4 Debt unchanged by massive negative payment");
}

console.log("\n--- SUITE 4: Audit Countdown Transitions & Milestones ---");

// 4.1 Turn-by-turn simulation from day 30 down to day 0
{
  let state: BoardingHouseState = {
    shopName: "The Stray Anchor",
    starRating: 0,
    daysUntilAudit: 30,
    dailyRevenue: 0,
    outstandingDebt: 5000,
    scandalHeat: 0,
    activeTenants: [],
  };

  const milestoneDaysHit: number[] = [];

  for (let d = 30; d >= 1; d--) {
    const res = advanceAuditDay(state);
    state = res.newState;
    if (res.isAuditDay) {
      milestoneDaysHit.push(state.daysUntilAudit);
    }
  }

  assert(state.daysUntilAudit === 0, "4.1 Advanced exactly 30 days to day 0", `Got ${state.daysUntilAudit}`);
  assert(milestoneDaysHit.includes(25), "4.1 Milestone hit at Day 25");
  assert(milestoneDaysHit.includes(20), "4.1 Milestone hit at Day 20");
  assert(milestoneDaysHit.includes(10), "4.1 Milestone hit at Day 10");
  assert(milestoneDaysHit.includes(5), "4.1 Milestone hit at Day 5");
  assert(milestoneDaysHit.includes(0), "4.1 Milestone hit at Day 0");
}

// 4.2 Day 0 Settlement (Liberation vs Foreclosure)
{
  const successState: BoardingHouseState = {
    shopName: "The Stray Anchor",
    starRating: 5,
    daysUntilAudit: 1,
    dailyRevenue: 1000,
    outstandingDebt: 0,
    scandalHeat: 10,
    activeTenants: [],
  };
  const resSuccess = advanceAuditDay(successState);
  assert(resSuccess.isLiberated === true, "4.2 Day 0 with 0 debt triggers isLiberated === true");
  assert(resSuccess.isForeclosure === false, "4.2 Day 0 with 0 debt triggers isForeclosure === false");

  const failState: BoardingHouseState = {
    shopName: "The Stray Anchor",
    starRating: 2,
    daysUntilAudit: 1,
    dailyRevenue: 200,
    outstandingDebt: 2500,
    scandalHeat: 50,
    activeTenants: [],
  };
  const resFail = advanceAuditDay(failState);
  assert(resFail.isForeclosure === true, "4.2 Day 0 with remaining debt triggers isForeclosure === true");
  assert(resFail.isLiberated === false, "4.2 Day 0 with remaining debt triggers isLiberated === false");
}

// 4.3 Repeated advanceAuditDay calls at Day 0 (underflow clamping)
{
  const dayZeroState: BoardingHouseState = {
    shopName: "The Stray Anchor",
    starRating: 5,
    daysUntilAudit: 0,
    dailyRevenue: 0,
    outstandingDebt: 0,
    scandalHeat: 0,
    activeTenants: [],
  };
  const res = advanceAuditDay(dayZeroState);
  assert(res.newState.daysUntilAudit === 0, "4.3 Calling advanceAuditDay at day 0 clamps daysUntilAudit to 0 (no negative days)", `Got ${res.newState.daysUntilAudit}`);
  assert(res.isAuditDay === false, "4.3 Post-audit call returns isAuditDay === false");
}

console.log("\n--- SUITE 5: Scandal Heat Engine (0-100%) ---");

// 5.1 Clamping and adjustments
{
  const adj1 = adjustScandalHeat(50, 60);
  assert(adj1.newHeat === 100, "5.1 Heat clamped to 100 on overflow", `Got ${adj1.newHeat}`);
  assert(adj1.tier === "WILDFIRE", "5.1 Tier at 100 is WILDFIRE");

  const adj2 = adjustScandalHeat(20, -50);
  assert(adj2.newHeat === 0, "5.1 Heat clamped to 0 on underflow", `Got ${adj2.newHeat}`);
  assert(adj2.tier === "LOW", "5.1 Tier at 0 is LOW");
}

// 5.2 Scandal decay per turn (quiet vs loud, Kaede bouncer bonus)
{
  const quietDecay = applyTurnScandalDecay(50, true, false);
  assert(quietDecay === 47, "5.2 Quiet turn decays by 3 (50 -> 47)", `Got ${quietDecay}`);

  const loudDecay = applyTurnScandalDecay(50, false, false);
  assert(loudDecay === 49, "5.2 Loud turn decays by 1 (50 -> 49)", `Got ${loudDecay}`);

  const kaedeQuietDecay = applyTurnScandalDecay(50, true, true);
  assert(kaedeQuietDecay === 37, "5.2 Kaede bouncer adds +10 decay (3 + 10 = 13; 50 -> 37)", `Got ${kaedeQuietDecay}`);
}

console.log("\n--- SUITE 6: Boarding House Upstairs Rooms (201-206) & Boundary Defect ---");

// 6.1 Normalization and room assignments
{
  assert(normalizeRoomNumber(1) === 201, "6.1 Room key 1 normalized to 201");
  assert(normalizeRoomNumber(6) === 206, "6.1 Room key 6 normalized to 206");
  assert(normalizeRoomNumber(203) === 203, "6.1 Room 203 stays 203");

  const baseState: BoardingHouseState = {
    shopName: "The Stray Anchor",
    starRating: 1,
    daysUntilAudit: 25,
    dailyRevenue: 150,
    outstandingDebt: 4000,
    scandalHeat: 10,
    activeTenants: [],
  };

  // Affection < 50 rejection
  const rej = assignBoardingRoomTenant(baseState, 201, "comp_seraphina", 49);
  assert(rej.success === false, "6.1 Affection 49% rejected from boarding house move-in");

  // Affection >= 50 success
  const succ = assignBoardingRoomTenant(baseState, 201, "comp_seraphina", 50);
  assert(succ.success === true, "6.1 Affection 50% accepted for room 201");
  assert(succ.newState.activeTenants.includes("comp_seraphina"), "6.1 Seraphina added to activeTenants");

  // Adversarial Invalid Room Number Tests (Defect Verification)
  const norm999 = normalizeRoomNumber(999);
  assert(norm999 !== 201, `6.1 normalizeRoomNumber(999) must not fallback to 201 (got ${norm999})`);

  const invRoomAssign = assignBoardingRoomTenant(baseState, 999, "comp_kaede", 80);
  assert(
    invRoomAssign.success === false,
    "6.1 Room 999 must be rejected as invalid room",
    `assignBoardingRoomTenant accepted room 999 with success=${invRoomAssign.success}`
  );
}

console.log("\n--- SUITE 7: 'Caught Red-Handed' Keepsake Jealousy Detection ---");

// 7.1 Empty or matching keepsake
{
  const noKeepsakes = detectKeepsakeJealousy([], "Seraphina Vane");
  assert(noKeepsakes.hasJealousy === false, "7.1 Empty keepsakes yields no jealousy");

  const miasCharm: KeepsakeItem = {
    id: "mias_gingham_charm",
    name: "Mia's Hand-Stitched Gingham Charm",
    slot: "ATTIRE",
    giftedByHeroineId: "comp_mia",
    statModifiers: {},
  };
  const ownKeepsake = detectKeepsakeJealousy([miasCharm], "Mia Bellini");
  assert(ownKeepsake.hasJealousy === false, "7.1 Wearing Mia's keepsake while talking to Mia yields no jealousy");
}

// 7.2 Wearing Mia's keepsake while talking to Seraphina
{
  const miasCharm: KeepsakeItem = {
    id: "mias_gingham_charm",
    name: "Mia's Hand-Stitched Gingham Charm",
    slot: "ATTIRE",
    giftedByHeroineId: "comp_mia",
    statModifiers: {},
  };
  const jealousy = detectKeepsakeJealousy([miasCharm], "Seraphina Vane");
  assert(jealousy.hasJealousy === true, "7.2 Wearing Mia's keepsake while talking to Seraphina triggers jealousy");
  assert(jealousy.originalHeroine === "Mia Bellini", `7.2 Original owner resolved to Mia Bellini (got ${jealousy.originalHeroine})`);
  assert(jealousy.bpmSpike === 25, "7.2 Jealousy BPM spike is 25");
  assert(jealousy.composurePenalty === 15, "7.2 Jealousy composure penalty is 15");
}

console.log("\n--- SUITE 8: Showdowns & Wagers (Article 9 Non-Lethal Vitals) ---");

// 8.1 Non-lethal round resolution and Meltdown / Victory triggers
{
  const round1 = resolveShowdownRound({
    playerStance: "FLOW_STATE_RHYTHM",
    playerAction: "strike",
    playerComposure: 100,
    playerHypeOrCool: 10,
    opponentComposure: 100,
  });
  assert(round1.newOpponentComposure < 100, "8.1 Strike reduces opponent composure");
  assert(round1.hypeOrCoolDelta > 0, "8.1 Strike generates hype/cool momentum");

  const meltdownRound = resolveShowdownRound({
    playerStance: "HIGH_HEAT_RUSH",
    playerAction: "burst",
    playerComposure: 5,
    playerHypeOrCool: 5,
    opponentComposure: 50,
  });
  assert(meltdownRound.newPlayerComposure === 0, "8.1 Player composure clamped to 0");
  assert(meltdownRound.isMeltdown === true, "8.1 Composure 0 triggers isMeltdown === true");

  const victoryRound = resolveShowdownRound({
    playerStance: "SHOWSTOPPER_FINALE",
    playerAction: "strike",
    playerComposure: 80,
    playerHypeOrCool: 50,
    opponentComposure: 10,
  });
  assert(victoryRound.newOpponentComposure === 0, "8.1 Opponent composure clamped to 0");
  assert(victoryRound.isVictory === true, "8.1 Opponent 0 composure triggers isVictory === true");
}

console.log("\n--- SUITE 9: Faction Standing & Turn Directives ---");

// 9.1 Faction tier boundaries
{
  assert(getFactionReputationTier(0) === "NEUTRAL", "9.1 0 rep is NEUTRAL");
  assert(getFactionReputationTier(24) === "NEUTRAL", "9.1 24 rep is NEUTRAL");
  assert(getFactionReputationTier(25) === "RESPECTED", "9.1 25 rep is RESPECTED");
  assert(getFactionReputationTier(49) === "RESPECTED", "9.1 49 rep is RESPECTED");
  assert(getFactionReputationTier(50) === "HONORED", "9.1 50 rep is HONORED");
  assert(getFactionReputationTier(74) === "HONORED", "9.1 74 rep is HONORED");
  assert(getFactionReputationTier(75) === "EXALTED", "9.1 75 rep is EXALTED");
  assert(getFactionReputationTier(100) === "EXALTED", "9.1 100 rep is EXALTED");
}

// 9.2 Faction adjustments and bounds clamping
{
  const standing = adjustFactionStanding(undefined, "PLATINUM_BOARD", 50);
  assert(standing.PLATINUM_BOARD === 60, "9.2 Initial base 10 + 50 = 60");

  const overflow = adjustFactionStanding(standing, "PLATINUM_BOARD", 100);
  assert(overflow.PLATINUM_BOARD === 100, "9.2 Clamped to 100 on overflow");

  const underflow = adjustFactionStanding(standing, "PLATINUM_BOARD", -200);
  assert(underflow.PLATINUM_BOARD === 0, "9.2 Clamped to 0 on underflow");
}

// 9.3 Turn directive builder
{
  const directive = buildPortSolarisTurnDirective({
    activeSpeaker: "Seraphina Vane",
    speakerBpm: 100,
    boardingHouseState: {
      shopName: "The Stray Anchor",
      starRating: 1,
      daysUntilAudit: 20,
      dailyRevenue: 200,
      outstandingDebt: 4000,
      scandalHeat: 45,
      activeTenants: ["comp_seraphina"],
    },
    activeShowdown: {
      contestType: "VIP_DEBATE",
      opponentName: "Julian Sterling",
      playerStakes: "1-Week Dishwashing Shift",
      opponentStakes: "+1 Star Rating Endorsement",
    },
  });

  assert(directive.includes("NO dark fantasy death"), "9.3 Contains anti-dark-fantasy tone guard");
  assert(directive.includes("SHORT-CIRCUIT TRIGGER"), "9.3 Contains 100 BPM short-circuit trigger");
  assert(directive.includes("ACTIVE ARTICLE 9 SHOWDOWN"), "9.3 Contains active showdown details");
  assert(directive.includes("THE STRAY ANCHOR STATUS"), "9.3 Contains boarding house state status");
}

console.log("\n===============================================================================");
console.log(`STRESS SUITE COMPLETE: Passed: ${report.passed} | Failed: ${report.failed}`);
console.log(`TOTAL FINDINGS: ${report.findings.length}`);
console.log("===============================================================================");

if (report.findings.length > 0) {
  console.log("\nSUMMARY OF ADVERSARIAL FINDINGS:");
  report.findings.forEach((f) => console.log(`  - ${f}`));
}

if (report.failed > 0) {
  console.error("\nFAILURES DETECTED:");
  report.errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log("\nALL EMPIRICAL TESTS PASSED SATISFACTORILY!");
  process.exit(0);
}
