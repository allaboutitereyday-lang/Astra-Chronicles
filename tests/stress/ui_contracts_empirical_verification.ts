/**
 * Empirical UI Contracts & Reducers Stress Verification Harness
 * Tests all pure UI contracts, formatters, and reducers under boundary & stress conditions.
 */

import {
  resolveSpotlightCompanion,
  isCompanionSpotlighted,
  getStageSpriteClasses,
  stageFocusTransitionReducer,
  StageFocusState,
  StageFocusAction,
} from "../../lib/portSolarisEngine";
import {
  formatShowdownVitals,
  ShowdownVitalsReadout,
} from "../../components/play/SectorClashHud";
import {
  characterModalReducer,
  CharacterModalState,
  CharacterModalAction,
} from "../../components/play/CharacterCardModal";
import { StoryCompanion } from "../../types/story";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testFailures: string[] = [];

function check(assertion: boolean, description: string, details?: string) {
  totalTests++;
  if (!assertion) {
    failedTests++;
    const msg = `FAIL: ${description}${details ? ` -> ${details}` : ""}`;
    testFailures.push(msg);
    console.error(`  [x] ${msg}`);
  } else {
    passedTests++;
    console.log(`  [v] ${description}`);
  }
}

console.log("======================================================================");
console.log("  EMPIRICAL UI CONTRACTS & REDUCERS VERIFICATION");
console.log("======================================================================\n");

// ----------------------------------------------------------------------------
// 1. resolveSpotlightCompanion & isCompanionSpotlighted
// ----------------------------------------------------------------------------
console.log("[SECTION 1] resolveSpotlightCompanion & isCompanionSpotlighted across 0, 1, 2, 4, 8, 12 Heroines");

// 1.0 Empty list
{
  const emptyList: StoryCompanion[] = [];
  const spotlight = resolveSpotlightCompanion(emptyList, "Vivienne Laurent", "Vivienne Laurent");
  check(spotlight === null, "Empty heroine list returns null spotlight");
  check(
    isCompanionSpotlighted("Vivienne Laurent", emptyList, "Vivienne Laurent", "Vivienne Laurent") === false,
    "Empty heroine list returns false for isCompanionSpotlighted"
  );
}

// 1.1 Single heroine
{
  const singleList: StoryCompanion[] = [
    { name: "Vivienne Laurent", isPresent: true, affection: 35 } as StoryCompanion,
  ];
  const spotlight = resolveSpotlightCompanion(singleList, "Narrator", null);
  check(spotlight?.name === "Vivienne Laurent", "Single heroine resolves to sole companion on Narrator turn");
  check(
    isCompanionSpotlighted("Vivienne Laurent", singleList, "Narrator", null) === true,
    "Single heroine is spotlighted"
  );
  check(
    isCompanionSpotlighted("Seraphina Vane", singleList, "Narrator", null) === false,
    "Absent heroine is not spotlighted in single heroine list"
  );
}

// 1.2 Multi-heroine cohorts (2, 4, 8, 12 heroines)
const masterRoster: StoryCompanion[] = [
  { name: "Seraphina Vane", isPresent: true, affection: 40 } as StoryCompanion,
  { name: "Vivienne Laurent", isPresent: true, affection: 35 } as StoryCompanion,
  { name: "Mia Bellini", isPresent: true, affection: 50 } as StoryCompanion,
  { name: "Colette Moreau", isPresent: true, affection: 30 } as StoryCompanion,
  { name: "Pippa Reyes", isPresent: true, affection: 45 } as StoryCompanion,
  { name: "Kaede Tachibana", isPresent: true, affection: 28 } as StoryCompanion,
  { name: "Roxy Vance", isPresent: true, affection: 38 } as StoryCompanion,
  { name: "Chloe Lin", isPresent: true, affection: 42 } as StoryCompanion,
  { name: "Nadia Saint-Clair", isPresent: true, affection: 33 } as StoryCompanion,
  { name: "Zuri Delacroix", isPresent: true, affection: 48 } as StoryCompanion,
  { name: "Aria Sterling", isPresent: true, affection: 25 } as StoryCompanion,
  { name: "Evelyn Cross", isPresent: true, affection: 22 } as StoryCompanion,
];

for (const scale of [2, 4, 8, 12]) {
  const cohort = masterRoster.slice(0, scale);
  check(cohort.length === scale, `Cohort of scale ${scale} initialized`);

  // Speaker matching
  const speakerName = cohort[1].name;
  const speakerSpotlight = resolveSpotlightCompanion(cohort, speakerName, null);
  check(
    speakerSpotlight?.name === speakerName,
    `Scale ${scale}: Active speaker '${speakerName}' gets spotlight`
  );

  // Exclusivity: exactly 1 companion spotlighted
  const spotlightFlags = cohort.map((c) => isCompanionSpotlighted(c.name, cohort, speakerName, null));
  const trueCount = spotlightFlags.filter(Boolean).length;
  check(
    trueCount === 1,
    `Scale ${scale}: Exactly 1 companion spotlighted for speaker turn (count: ${trueCount})`
  );

  // Manual player override (pick last heroine)
  const manualTarget = cohort[cohort.length - 1].name;
  const manualSpotlight = resolveSpotlightCompanion(cohort, speakerName, manualTarget);
  check(
    manualSpotlight?.name === manualTarget,
    `Scale ${scale}: Manual override '${manualTarget}' overrides active speaker '${speakerName}'`
  );

  // Mutual exclusivity under manual override
  const manualFlags = cohort.map((c) => isCompanionSpotlighted(c.name, cohort, speakerName, manualTarget));
  const manualTrueCount = manualFlags.filter(Boolean).length;
  check(
    manualTrueCount === 1,
    `Scale ${scale}: Exactly 1 companion spotlighted under manual override (count: ${manualTrueCount})`
  );

  // Invalid manual override (heroine not in cohort) falls back to active speaker
  const invalidManual = resolveSpotlightCompanion(cohort, speakerName, "NonExistent Heroine");
  check(
    invalidManual?.name === speakerName,
    `Scale ${scale}: Non-existent manual override falls back to active speaker '${speakerName}'`
  );

  // Narrator speaker (no match) with no manual override falls back to cohort[0]
  const narratorSpotlight = resolveSpotlightCompanion(cohort, "Narrator", null);
  check(
    narratorSpotlight?.name === cohort[0].name,
    `Scale ${scale}: Narrator speaker falls back to first present companion '${cohort[0].name}'`
  );
}

// ----------------------------------------------------------------------------
// 2. getStageSpriteClasses
// ----------------------------------------------------------------------------
console.log("\n[SECTION 2] getStageSpriteClasses full-size and visual emphasis contracts");
{
  const speakingClasses = getStageSpriteClasses(true);
  const idleClasses = getStageSpriteClasses(false);

  // Full-size invariants
  check(speakingClasses.includes("w-full"), "Speaking classes contain 'w-full'");
  check(speakingClasses.includes("h-full"), "Speaking classes contain 'h-full'");
  check(speakingClasses.includes("object-contain"), "Speaking classes contain 'object-contain'");
  check(speakingClasses.includes("object-bottom"), "Speaking classes contain 'object-bottom'");

  check(idleClasses.includes("w-full"), "Idle classes contain 'w-full'");
  check(idleClasses.includes("h-full"), "Idle classes contain 'h-full'");
  check(idleClasses.includes("object-contain"), "Idle classes contain 'object-contain'");
  check(idleClasses.includes("object-bottom"), "Idle classes contain 'object-bottom'");

  // Visual emphasis differentiation
  check(speakingClasses.includes("brightness-105"), "Speaking classes include brightness-105");
  check(speakingClasses.includes("animate-float-sway"), "Speaking classes include animate-float-sway");
  check(idleClasses.includes("brightness-95"), "Idle classes include brightness-95");
  check(!idleClasses.includes("animate-float-sway"), "Idle classes do NOT include animate-float-sway");
}

// ----------------------------------------------------------------------------
// 3. stageFocusTransitionReducer
// ----------------------------------------------------------------------------
console.log("\n[SECTION 3] stageFocusTransitionReducer focus shifts & typewriter preservation");
{
  const testComps: StoryCompanion[] = [
    { name: "Vivienne Laurent", isPresent: true } as StoryCompanion,
    { name: "Seraphina Vane", isPresent: true } as StoryCompanion,
    { name: "Mia Bellini", isPresent: true } as StoryCompanion,
  ];

  const initialState: StageFocusState = {
    spotlightHeroineName: "Vivienne Laurent",
    isTypewriterActive: true,
  };

  // Switch focus to Seraphina while typewriter is running
  const switchedState = stageFocusTransitionReducer(initialState, {
    type: "SELECT_SPOTLIGHT",
    heroineName: "Seraphina Vane",
    presentComps: testComps,
  });

  check(
    switchedState.spotlightHeroineName === "Seraphina Vane",
    "Focus shifts to 'Seraphina Vane'"
  );
  check(
    switchedState.isTypewriterActive === true,
    "Active typewriter status is PRESERVED (isTypewriterActive: true) across focus shift"
  );

  // Attempt to select an absent heroine
  const absentState = stageFocusTransitionReducer(switchedState, {
    type: "SELECT_SPOTLIGHT",
    heroineName: "Roxy Vance",
    presentComps: testComps,
  });
  check(
    absentState.spotlightHeroineName === "Seraphina Vane",
    "Selecting non-present heroine leaves spotlight unchanged (no-op)"
  );
  check(
    absentState.isTypewriterActive === true,
    "Typewriter status preserved on invalid selection"
  );

  // Idempotent re-selection
  const reselectedState = stageFocusTransitionReducer(switchedState, {
    type: "SELECT_SPOTLIGHT",
    heroineName: "Seraphina Vane",
    presentComps: testComps,
  });
  check(
    reselectedState.spotlightHeroineName === "Seraphina Vane" && reselectedState.isTypewriterActive === true,
    "Idempotent re-selection preserves spotlight and typewriter status"
  );

  // Typewriter start and finish actions
  const stoppedTypewriter = stageFocusTransitionReducer(reselectedState, {
    type: "FINISH_TYPEWRITER",
  });
  check(
    stoppedTypewriter.isTypewriterActive === false,
    "FINISH_TYPEWRITER sets isTypewriterActive to false"
  );

  const restartedTypewriter = stageFocusTransitionReducer(stoppedTypewriter, {
    type: "START_TYPEWRITER",
  });
  check(
    restartedTypewriter.isTypewriterActive === true,
    "START_TYPEWRITER sets isTypewriterActive to true"
  );
}

// ----------------------------------------------------------------------------
// 4. formatShowdownVitals
// ----------------------------------------------------------------------------
console.log("\n[SECTION 4] formatShowdownVitals Article 9 vs Dark-Fantasy modes");
{
  // Showdown mode
  const showdownVitals = formatShowdownVitals({
    enemyHp: 75,
    enemyMaxHp: 100,
    playerHp: 85,
    playerMaxHp: 100,
    playerMp: 45,
    playerMaxMp: 50,
    isShowdown: true,
  });

  check(
    showdownVitals.enemyVitalLabel === "75% RIVAL COMPOSURE",
    `Showdown enemy vital: '${showdownVitals.enemyVitalLabel}' (expected: '75% RIVAL COMPOSURE')`
  );
  check(
    showdownVitals.playerPrimaryLabel === "85/100 COMPOSURE",
    `Showdown player primary: '${showdownVitals.playerPrimaryLabel}' (expected: '85/100 COMPOSURE')`
  );
  check(
    showdownVitals.playerSecondaryLabel === "45/50 HYPE",
    `Showdown player secondary: '${showdownVitals.playerSecondaryLabel}' (expected: '45/50 HYPE')`
  );
  check(
    showdownVitals.retreatLabel === "Concede Wager",
    `Showdown retreat label: '${showdownVitals.retreatLabel}' (expected: 'Concede Wager')`
  );

  // Strict check that dark-fantasy HP/MP/Disengage are not present in showdown readout
  check(
    !showdownVitals.playerPrimaryLabel.includes(" HP") &&
    !showdownVitals.playerSecondaryLabel.includes(" MP") &&
    !showdownVitals.enemyVitalLabel.includes(" HP") &&
    showdownVitals.retreatLabel !== "Disengage",
    "Showdown readout contains zero mortal dark-fantasy labels"
  );

  // Dark-fantasy mode
  const darkFantasyVitals = formatShowdownVitals({
    enemyHp: 200,
    enemyMaxHp: 300,
    playerHp: 60,
    playerMaxHp: 100,
    playerMp: 20,
    playerMaxMp: 50,
    isShowdown: false,
  });

  check(
    darkFantasyVitals.enemyVitalLabel === "200/300 HP",
    `Dark fantasy enemy vital: '${darkFantasyVitals.enemyVitalLabel}' (expected: '200/300 HP')`
  );
  check(
    darkFantasyVitals.playerPrimaryLabel === "60/100 HP",
    `Dark fantasy player primary: '${darkFantasyVitals.playerPrimaryLabel}' (expected: '60/100 HP')`
  );
  check(
    darkFantasyVitals.playerSecondaryLabel === "20/50 MP",
    `Dark fantasy player secondary: '${darkFantasyVitals.playerSecondaryLabel}' (expected: '20/50 MP')`
  );
  check(
    darkFantasyVitals.retreatLabel === "Disengage",
    `Dark fantasy retreat label: '${darkFantasyVitals.retreatLabel}' (expected: 'Disengage')`
  );

  // Boundary condition: 0 max HP / division safety
  const boundaryVitals = formatShowdownVitals({
    enemyHp: 0,
    enemyMaxHp: 0,
    playerHp: 0,
    playerMaxHp: 0,
    playerMp: 0,
    playerMaxMp: 0,
    isShowdown: false,
  });
  check(
    boundaryVitals.enemyVitalLabel === "0/1 HP" && boundaryVitals.playerPrimaryLabel === "0/1 HP",
    "Boundary zero maxHp safely clamped to Math.max(1, maxHp) without NaN or Infinity"
  );
}

// ----------------------------------------------------------------------------
// 5. characterModalReducer
// ----------------------------------------------------------------------------
console.log("\n[SECTION 5] characterModalReducer actions & keyboard handling");
{
  const dummyComp = { name: "Vivienne Laurent", affection: 40 } as StoryCompanion;

  const closedState: CharacterModalState = { isOpen: false, companion: null };

  // OPEN_MODAL
  const openedState = characterModalReducer(closedState, {
    type: "OPEN_MODAL",
    companion: dummyComp,
  });
  check(
    openedState.isOpen === true && openedState.companion?.name === "Vivienne Laurent",
    "OPEN_MODAL sets isOpen: true and assigns companion"
  );

  // Non-Escape keys do NOT close modal
  const ignoredKeys = ["Enter", "Space", "Tab", "ArrowDown", "a", "x"];
  for (const k of ignoredKeys) {
    const stateAfterKey = characterModalReducer(openedState, {
      type: "HANDLE_KEY_DOWN",
      key: k,
    });
    check(
      stateAfterKey.isOpen === true && stateAfterKey.companion !== null,
      `HANDLE_KEY_DOWN with key '${k}' does NOT close modal`
    );
  }

  // Escape key closes modal
  const escapedState = characterModalReducer(openedState, {
    type: "HANDLE_KEY_DOWN",
    key: "Escape",
  });
  check(
    escapedState.isOpen === false && escapedState.companion === null,
    "HANDLE_KEY_DOWN with key 'Escape' closes modal (isOpen: false, companion: null)"
  );

  // CLOSE_MODAL explicit action
  const reOpenedState = characterModalReducer(closedState, {
    type: "OPEN_MODAL",
    companion: dummyComp,
  });
  const explicitlyClosedState = characterModalReducer(reOpenedState, {
    type: "CLOSE_MODAL",
  });
  check(
    explicitlyClosedState.isOpen === false && explicitlyClosedState.companion === null,
    "CLOSE_MODAL explicitly resets state to closed"
  );
}

console.log("\n======================================================================");
console.log(`TOTAL PURE CONTRACT ASSERTIONS: ${totalTests}`);
console.log(`PASSED:                         ${passedTests}`);
console.log(`FAILED:                         ${failedTests}`);
if (failedTests > 0) {
  console.log("FAILURES:");
  testFailures.forEach((f) => console.log(`  - ${f}`));
}
console.log(`STATUS:                         ${failedTests === 0 ? "ALL PURE UI CONTRACTS GREEN" : "FAILURES DETECTED"}`);
console.log("======================================================================");

process.exit(failedTests === 0 ? 0 : 1);
