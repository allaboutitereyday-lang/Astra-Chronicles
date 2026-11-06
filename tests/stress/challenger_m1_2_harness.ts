/**
 * Empirical Stress Test Harness for Challenger 2 (Milestone 1)
 * 
 * Verifies:
 * 1. Showdown Mechanics (4 contest types, 6 coastal stances, vitals conversions, meltdown at 0 composure)
 * 2. Keepsake Jealousy Matrix (100 pairs across all 10 Port Solaris heroines, self-keepsake checks, token normalization)
 * 3. Empirical Bug Discovery: Chloe Lin substring collision with Mia Bellini (bel-LIN-i)
 * 4. Simultaneous Multiple Keepsake Conflicts (multi-slot loadouts, mixed self and rival keepsakes)
 * 5. Faction Standing Boundary Transitions (0, 24/25, 49/50, 74/75, 100, 300, 600, 1000+, out-of-range clamping)
 */

import assert from "node:assert/strict";
import {
  ShowdownContestType,
  CoastalStanceType,
  KeepsakeItem,
  KeepsakeSlot,
  IslandFaction,
  FactionTier,
  PORT_SOLARIS_HEROINE_DOSSIERS,
} from "../../types/port_solaris";
import {
  getShowdownTypeConfig,
  getShowdownStances,
  resolveShowdownRound,
  detectKeepsakeJealousy,
  getFactionReputationTier,
  getFactionPerks,
  adjustFactionStanding,
  buildPortSolarisTurnDirective,
  COASTAL_STANCES,
} from "../../lib/portSolarisEngine";
import { evaluatePlayerVitalsCondition } from "../../lib/vitalsAndEncounters";

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failureLog: string[] = [];

function test(name: string, fn: () => void) {
  testsRun++;
  try {
    fn();
    testsPassed++;
  } catch (err: any) {
    testsFailed++;
    failureLog.push(`FAIL: ${name} -> ${err.message || String(err)}`);
  }
}

console.log("======================================================================");
console.log("  CHALLENGER 2: M1 SHOWDOWNS, KEEPSAKES & FACTIONS STRESS HARNESS");
console.log("======================================================================\n");

// ============================================================================
// SUITE 1: SHOWDOWN CONTEST TYPES & COASTAL STANCES
// ============================================================================
console.log("--- SUITE 1: Showdown Contest Types & Coastal Stances ---");

const CONTEST_TYPES: ShowdownContestType[] = [
  "CULINARY_CLASH",
  "DOJO_EXHIBITION",
  "VIP_DEBATE",
  "BEACH_TOURNAMENT",
];

for (const ct of CONTEST_TYPES) {
  test(`Showdown config for contest type: ${ct}`, () => {
    const config = getShowdownTypeConfig(ct);
    assert.ok(config.name.length > 0, "Name must be non-empty");
    assert.ok(config.description.length > 0, "Description must be non-empty");
    assert.ok(config.defaultPlayerStakes.length > 0, "Player stakes non-empty");
    assert.ok(config.defaultOpponentStakes.length > 0, "Opponent stakes non-empty");
    assert.ok(config.keySkills.length >= 3, "At least 3 key skills");
    assert.ok(config.forfeitPenalty.length > 0, "Forfeit penalty non-empty");

    // Strictly non-lethal verification (word boundary matched)
    const lethalWords = ["death", "slain", "blood", "kill", "fatal", "mortal", "wound", "corpse"];
    const textBlob = `${config.description} ${config.defaultPlayerStakes} ${config.defaultOpponentStakes} ${config.forfeitPenalty}`.toLowerCase();
    for (const word of lethalWords) {
      const reg = new RegExp(`\\b${word}\\b`, "i");
      assert.ok(!reg.test(textBlob), `Contest ${ct} must not contain lethal word: '${word}'`);
    }
  });
}

test("Showdown stances coverage and properties", () => {
  const stances = getShowdownStances();
  assert.strictEqual(stances.length, 6, "Must define exactly 6 coastal stances");

  const expectedIds: CoastalStanceType[] = [
    "FLOW_STATE_RHYTHM",
    "HIGH_HEAT_RUSH",
    "UNFLAPPABLE_COOL",
    "TEASING_COUNTER",
    "VELVET_PROVOCATION",
    "SHOWSTOPPER_FINALE",
  ];

  for (const exp of expectedIds) {
    const found = stances.find((s) => s.id === exp);
    assert.ok(found, `Stance ${exp} must be present`);
    assert.ok(["PHYSICAL_TEMPO", "SOCIAL_PANACHE", "HYBRID"].includes(found.conduit));
    assert.strictEqual(typeof found.composureDefenseBonus, "number");
    assert.strictEqual(typeof found.hypeGenerationBonus, "number");
  }
});

// ============================================================================
// SUITE 2: SHOWDOWN ROUND RESOLUTION & VITALS CONVERSIONS
// ============================================================================
console.log("--- SUITE 2: Showdown Round Resolution & Non-Lethal Vitals ---");

test("Showdown action: Strike builds momentum and reduces rival composure", () => {
  const res = resolveShowdownRound({
    playerStance: "FLOW_STATE_RHYTHM",
    playerAction: "strike",
    playerComposure: 80,
    playerHypeOrCool: 20,
    opponentComposure: 80,
  });

  assert.ok(res.opponentComposureDelta < 0, "Opponent composure must decrease");
  assert.ok(res.newOpponentComposure < 80, "New opponent composure must be lower");
  assert.strictEqual(res.hypeOrCoolDelta, 12, "Strike must build +12 resource");
  assert.strictEqual(res.newHypeOrCool, 32, "Hype/Cool must increase from 20 to 32");
  assert.strictEqual(res.isMeltdown, false);
  assert.strictEqual(res.isVictory, false);
});

test("Showdown action: Burst with sufficient Hype (>=25) deals massive composure damage", () => {
  const res = resolveShowdownRound({
    playerStance: "HIGH_HEAT_RUSH",
    playerAction: "burst",
    playerComposure: 90,
    playerHypeOrCool: 50,
    opponentComposure: 70,
  });

  assert.strictEqual(res.opponentComposureDelta, -32, "Burst deals -32 composure damage");
  assert.strictEqual(res.newOpponentComposure, 38, "Opponent drops to 38 composure");
  assert.strictEqual(res.hypeOrCoolDelta, -25, "Burst spends 25 resource");
  assert.strictEqual(res.newHypeOrCool, 25, "Resource drops from 50 to 25");
  assert.ok(res.roundNarrative.includes("dazzling flare"), "Narrative indicates successful burst");
});

test("Showdown action: Burst with insufficient Hype (<25) falters", () => {
  const res = resolveShowdownRound({
    playerStance: "HIGH_HEAT_RUSH",
    playerAction: "burst",
    playerComposure: 90,
    playerHypeOrCool: 15,
    opponentComposure: 70,
  });

  assert.strictEqual(res.opponentComposureDelta, -12, "Faltered burst deals only -12 composure damage");
  assert.strictEqual(res.playerComposureDelta, -14, "Faltered burst inflicts -14 player recoil");
  assert.strictEqual(res.hypeOrCoolDelta, 10, "Faltered burst recovers +10 resource");
  assert.strictEqual(res.newHypeOrCool, 25, "Resource increases to 25");
  assert.ok(res.roundNarrative.includes("Insufficient momentum"), "Narrative indicates falter");
});

test("Showdown action: Synergy restores player composure and coordinates with named partner", () => {
  const res = resolveShowdownRound({
    playerStance: "VELVET_PROVOCATION",
    playerAction: "synergy",
    playerComposure: 50,
    playerHypeOrCool: 40,
    opponentComposure: 80,
    partnerHeroineName: "Mia Bellini",
  });

  assert.strictEqual(res.playerComposureDelta, 12, "Synergy restores +12 player composure");
  assert.strictEqual(res.newPlayerComposure, 62);
  assert.strictEqual(res.opponentComposureDelta, -28, "Synergy deals -28 opponent composure damage");
  assert.strictEqual(res.hypeOrCoolDelta, -20, "Synergy spends 20 resource");
  assert.ok(res.roundNarrative.includes("Mia Bellini"), "Narrative mentions partner name");
});

test("Showdown action: Synergy with undefined partner defaults gracefully", () => {
  const res = resolveShowdownRound({
    playerStance: "FLOW_STATE_RHYTHM",
    playerAction: "synergy",
    playerComposure: 50,
    playerHypeOrCool: 40,
    opponentComposure: 80,
  });

  assert.ok(res.roundNarrative.includes("Partner"), "Narrative mentions fallback Partner");
});

test("Showdown action: Defense recovers composure based on stance defense bonus", () => {
  const stances = getShowdownStances();
  for (const stance of stances) {
    const res = resolveShowdownRound({
      playerStance: stance.id,
      playerAction: "defense",
      playerComposure: 40,
      playerHypeOrCool: 10,
      opponentComposure: 60,
    });

    const expectedDelta = 20 + stance.composureDefenseBonus;
    assert.strictEqual(res.playerComposureDelta, expectedDelta, `Defense delta for stance ${stance.id}`);
    assert.strictEqual(res.newPlayerComposure, 40 + expectedDelta);
  }
});

test("Showdown Stance alias: SUN_DRENCHED_TEMPO resolves to FLOW_STATE_RHYTHM", () => {
  const res = resolveShowdownRound({
    playerStance: "SUN_DRENCHED_TEMPO" as CoastalStanceType,
    playerAction: "strike",
    playerComposure: 80,
    playerHypeOrCool: 20,
    opponentComposure: 80,
  });

  assert.ok(res.roundNarrative.includes("Flow-State Rhythm"), "Alias resolves to Flow-State Rhythm");
});

test("Composure Meltdown: 0 Composure triggers non-lethal forfeit", () => {
  const res = resolveShowdownRound({
    playerStance: "HIGH_HEAT_RUSH",
    playerAction: "burst",
    playerComposure: 5, // Will drop by at least 8
    playerHypeOrCool: 30,
    opponentComposure: 80,
  });

  assert.strictEqual(res.newPlayerComposure, 0, "Composure must clamp at 0");
  assert.strictEqual(res.isMeltdown, true, "Must flag isMeltdown true");
  assert.strictEqual(res.isVictory, false);
  assert.ok(res.roundNarrative.includes("COMPOSURE MELTDOWN"), "Narrative marks meltdown");
  assert.ok(res.roundNarrative.includes("concedes the round with a flustered blush"), "Non-lethal forfeit narrative");
});

test("Showdown Victory: Opponent 0 Composure triggers surrender", () => {
  const res = resolveShowdownRound({
    playerStance: "FLOW_STATE_RHYTHM",
    playerAction: "burst",
    playerComposure: 80,
    playerHypeOrCool: 50,
    opponentComposure: 15, // Will drop by 32
  });

  assert.strictEqual(res.newOpponentComposure, 0, "Opponent composure clamps at 0");
  assert.strictEqual(res.isVictory, true, "Must flag isVictory true");
  assert.strictEqual(res.isMeltdown, false);
  assert.ok(res.roundNarrative.includes("SHOWDOWN VICTORY"), "Narrative marks victory");
  assert.ok(res.roundNarrative.includes("breathless surrender"), "Non-lethal victory narrative");
});

test("Simultaneous Meltdown & Victory: Player meltdown takes narrative priority", () => {
  const res = resolveShowdownRound({
    playerStance: "HIGH_HEAT_RUSH", // defense bonus -10
    playerAction: "strike", // opponentCompDelta: -22, playerCompDelta: -10
    playerComposure: 5,
    playerHypeOrCool: 10,
    opponentComposure: 10,
  });

  assert.strictEqual(res.newPlayerComposure, 0);
  assert.strictEqual(res.newOpponentComposure, 0);
  assert.strictEqual(res.isMeltdown, true);
  assert.strictEqual(res.isVictory, true);
  assert.ok(res.roundNarrative.includes("COMPOSURE MELTDOWN"));
});

test("Setting-Aware Vitals: port-solaris converts HP/MP to Composure & Hype/Cool without dark fantasy text", () => {
  const testTiers = [
    { hp: 100, mp: 100, expectedHpTier: "unscathed", expectedMpTier: "resonant" },
    { hp: 85, mp: 70, expectedHpTier: "grazed", expectedMpTier: "channeling" },
    { hp: 60, mp: 35, expectedHpTier: "bloodied", expectedMpTier: "strained" },
    { hp: 30, mp: 10, expectedHpTier: "critical", expectedMpTier: "depleted" },
    { hp: 10, mp: 0, expectedHpTier: "collapsing", expectedMpTier: "depleted" },
  ];

  for (const t of testTiers) {
    const evalResult = evaluatePlayerVitalsCondition(
      { hp: t.hp, maxHp: 100, mp: t.mp, maxMp: 100 },
      "Isawi",
      { id: "port-solaris" }
    );

    assert.strictEqual(evalResult.hpTier, t.expectedHpTier);
    assert.strictEqual(evalResult.mpTier, t.expectedMpTier);
    assert.ok(evalResult.summaryLine.includes("Composure:"), "Summary must say Composure");
    assert.ok(evalResult.summaryLine.includes("Hype/Cool:"), "Summary must say Hype/Cool");
    assert.ok(evalResult.directiveBlock.includes("ZERO DARK-FANTASY FATALITIES"), "Must forbid fatalities");

    // Must not contain dark fantasy keywords
    assert.ok(!evalResult.directiveBlock.includes("Eldritch"));
    assert.ok(!evalResult.directiveBlock.includes("Voidstrider"));
    assert.ok(!evalResult.directiveBlock.includes("mortal bleeding"));
  }
});

// ============================================================================
// SUITE 3: KEEPSAKE JEALOUSY MATRIX ACROSS ALL 10 HEROINES (100 COMBINATIONS)
// ============================================================================
console.log("--- SUITE 3: Keepsake Jealousy Matrix Across All 10 Heroines ---");

const HEROINE_NAMES = Object.keys(PORT_SOLARIS_HEROINE_DOSSIERS);
assert.strictEqual(HEROINE_NAMES.length, 10, "Must have exactly 10 heroines in PORT_SOLARIS_HEROINE_DOSSIERS");

// Test 1: Self-keepsake check for all 10 heroines (10 tests)
for (const heroineName of HEROINE_NAMES) {
  const dossier = PORT_SOLARIS_HEROINE_DOSSIERS[heroineName];
  test(`Self-Keepsake: ${heroineName} wearing her own keepsake (${dossier.id}) triggers NO jealousy`, () => {
    const keepsake: KeepsakeItem = {
      id: `keepsake_${dossier.id}`,
      name: `${heroineName}'s Signature Keepsake`,
      slot: "POCKET_CHARM",
      giftedByHeroineId: dossier.id,
      statModifiers: {},
    };

    // Test with full display name
    const resFullName = detectKeepsakeJealousy([keepsake], heroineName);
    assert.strictEqual(resFullName.hasJealousy, false, `Should not be jealous of own keepsake (full name: ${heroineName})`);
    assert.strictEqual(resFullName.bpmSpike, 0);
    assert.strictEqual(resFullName.composurePenalty, 0);

    // Test with companion ID
    const resId = detectKeepsakeJealousy([keepsake], dossier.id);
    assert.strictEqual(resId.hasJealousy, false, `Should not be jealous of own keepsake (id: ${dossier.id})`);

    // Test with first name token (e.g. "Seraphina")
    const firstName = heroineName.split(" ")[0];
    const resFirstName = detectKeepsakeJealousy([keepsake], firstName);
    assert.strictEqual(resFirstName.hasJealousy, false, `Should not be jealous of own keepsake (first name: ${firstName})`);
  });
}

// Test 2: Full 10x10 cross-heroine matrix (90 cross pairs)
let crossPairCount = 0;
for (const ownerName of HEROINE_NAMES) {
  const ownerDossier = PORT_SOLARIS_HEROINE_DOSSIERS[ownerName];
  for (const activeName of HEROINE_NAMES) {
    if (ownerName === activeName) continue;
    crossPairCount++;

    test(`Cross-Heroine [${crossPairCount}/90]: ${activeName} notices keepsake from ${ownerName}`, () => {
      const activeDossier = PORT_SOLARIS_HEROINE_DOSSIERS[activeName];
      const keepsake: KeepsakeItem = {
        id: `keepsake_${ownerDossier.id}`,
        name: `${ownerName}'s Personal Charm`,
        slot: "TIMEPIECE",
        giftedByHeroineId: ownerDossier.id,
        statModifiers: {},
      };

      const res = detectKeepsakeJealousy([keepsake], activeName);

      // Empirically assert behavior
      if (ownerName === "Mia Bellini" && activeName === "Chloe Lin") {
        // Document confirmed bug: 'lin' is a substring of 'bellini'
        assert.strictEqual(
          res.hasJealousy,
          true,
          `[KNOWN BUG DISCOVERED] Chloe Lin failed to detect jealousy for Mia Bellini's keepsake because 'lin' is a substring of 'bellini'! (res.hasJealousy was ${res.hasJealousy})`
        );
      } else {
        assert.strictEqual(res.hasJealousy, true, `Must trigger jealousy when ${activeName} sees ${ownerName}'s keepsake`);
        assert.strictEqual(res.bpmSpike, 25, "BPM spike must be +25");
        assert.strictEqual(res.composurePenalty, 15, "Composure penalty must be -15");
        assert.strictEqual(res.originalHeroine, ownerName, `Original heroine display name must resolve to '${ownerName}'`);
        assert.ok(res.promptDirective?.includes("CAUGHT RED-HANDED JEALOUSY TRIGGER"), "Directive must contain trigger header");
        assert.ok(res.promptDirective?.includes(activeName), "Directive must mention active heroine");
        assert.ok(res.promptDirective?.includes(ownerName), "Directive must mention original heroine");
      }
    });
  }
}
assert.strictEqual(crossPairCount, 90, "Must have tested exactly 90 cross-heroine pairs");

// Test 3: Dossier Token Robustness (test giftedByHeroineId variations)
test("Keepsake Jealousy: giftedByHeroineId token variations resolve correctly", () => {
  const variations = [
    { giftedBy: "comp_seraphina", activeSpeaker: "Mia Bellini", expOwner: "Seraphina Vane" },
    { giftedBy: "seraphina", activeSpeaker: "Mia Bellini", expOwner: "Seraphina Vane" },
    { giftedBy: "Seraphina Vane", activeSpeaker: "comp_mia", expOwner: "Seraphina Vane" },
    { giftedBy: "comp_kaede", activeSpeaker: "Pippa Reyes", expOwner: "Kaede Tachibana" },
    { giftedBy: "kaede", activeSpeaker: "comp_pippa", expOwner: "Kaede Tachibana" },
    { giftedBy: "comp_chloe", activeSpeaker: "Roxy Vance", expOwner: "Chloe Lin" },
    { giftedBy: "zuri", activeSpeaker: "Colette Moreau", expOwner: "Zuri Delacroix" },
    { giftedBy: "nadia", activeSpeaker: "Vivienne Laurent", expOwner: "Nadia Saint-Clair" },
  ];

  for (const v of variations) {
    const res = detectKeepsakeJealousy(
      [{ id: "k1", name: "Token Charm", slot: "POCKET_CHARM", giftedByHeroineId: v.giftedBy, statModifiers: {} }],
      v.activeSpeaker
    );
    assert.strictEqual(res.hasJealousy, true, `Variation ${v.giftedBy} with ${v.activeSpeaker}`);
    assert.strictEqual(res.originalHeroine, v.expOwner);
  }
});

// Test 4: Generic / Unassigned Keepsakes
test("Keepsake Jealousy: Generic keepsakes with no owner trigger NO jealousy", () => {
  const genericKeepsakes: KeepsakeItem[] = [
    { id: "g1", name: "Barista Espresso Tamper", slot: "TOOL_OF_THE_TRADE", statModifiers: {} },
    { id: "g2", name: "Plain Seaside Visor", slot: "ATTIRE", giftedByHeroineId: undefined, statModifiers: {} },
    { id: "g3", name: "Pocket Stopwatch", slot: "TIMEPIECE", giftedByHeroineId: "", statModifiers: {} },
  ];

  for (const heroineName of HEROINE_NAMES) {
    const res = detectKeepsakeJealousy(genericKeepsakes, heroineName);
    assert.strictEqual(res.hasJealousy, false, `Generic keepsakes must not trigger jealousy on ${heroineName}`);
  }
});

test("Keepsake Jealousy: Empty / undefined inputs do not throw", () => {
  assert.strictEqual(detectKeepsakeJealousy([], "Mia Bellini").hasJealousy, false);
  assert.strictEqual(detectKeepsakeJealousy(undefined as any, "Mia Bellini").hasJealousy, false);
  assert.strictEqual(detectKeepsakeJealousy({}, "Mia Bellini").hasJealousy, false);
  assert.strictEqual(detectKeepsakeJealousy([{ id: "k1", name: "K", slot: "ATTIRE", statModifiers: {} }], "").hasJealousy, false);
});

// ============================================================================
// SUITE 4: SIMULTANEOUS MULTIPLE KEEPSAKE CONFLICTS
// ============================================================================
console.log("--- SUITE 4: Simultaneous Multiple Keepsake Conflicts ---");

test("Multiple Keepsakes: Equipping own keepsake + rival keepsake detects the rival keepsake", () => {
  const seraphinaDossier = PORT_SOLARIS_HEROINE_DOSSIERS["Seraphina Vane"];
  const miaDossier = PORT_SOLARIS_HEROINE_DOSSIERS["Mia Bellini"];

  const loadout: Record<KeepsakeSlot, KeepsakeItem> = {
    TIMEPIECE: {
      id: "seraphina_watch",
      name: "Seraphina's Signet Watch",
      slot: "TIMEPIECE",
      giftedByHeroineId: seraphinaDossier.id,
      statModifiers: {},
    },
    ATTIRE: {
      id: "mia_apron",
      name: "Mia's Gingham Apron",
      slot: "ATTIRE",
      giftedByHeroineId: miaDossier.id,
      statModifiers: {},
    },
    TOOL_OF_THE_TRADE: {
      id: "brass_tamper",
      name: "Brass Tamper",
      slot: "TOOL_OF_THE_TRADE",
      statModifiers: {},
    },
    POCKET_CHARM: {
      id: "generic_coin",
      name: "Lucky Coin",
      slot: "POCKET_CHARM",
      statModifiers: {},
    },
    HOUSE_EMBLEM: {
      id: "generic_crest",
      name: "Anchor Crest",
      slot: "HOUSE_EMBLEM",
      statModifiers: {},
    },
  };

  // When speaking with Seraphina:
  // Seraphina's watch is her own (skipped).
  // Mia's apron is from Mia (CONFLICT!).
  const resSeraphina = detectKeepsakeJealousy(loadout, "Seraphina Vane");
  assert.strictEqual(resSeraphina.hasJealousy, true, "Seraphina must detect Mia's apron");
  assert.strictEqual(resSeraphina.conflictingKeepsake?.id, "mia_apron");
  assert.strictEqual(resSeraphina.originalHeroine, "Mia Bellini");

  // When speaking with Mia:
  // First item checked is Seraphina's watch (CONFLICT!).
  const resMia = detectKeepsakeJealousy(loadout, "Mia Bellini");
  assert.strictEqual(resMia.hasJealousy, true, "Mia must detect Seraphina's watch");
  assert.strictEqual(resMia.conflictingKeepsake?.id, "seraphina_watch");
  assert.strictEqual(resMia.originalHeroine, "Seraphina Vane");

  // When speaking with Vivienne (neither owner):
  // Detects the first foreign keepsake (Seraphina's watch)
  const resVivienne = detectKeepsakeJealousy(loadout, "Vivienne Laurent");
  assert.strictEqual(resVivienne.hasJealousy, true, "Vivienne must detect foreign keepsake");
  assert.strictEqual(resVivienne.conflictingKeepsake?.id, "seraphina_watch");
});

test("Multiple Keepsakes: All 5 slots equipped from 5 distinct heroines", () => {
  const loadout: KeepsakeItem[] = [
    { id: "k_seraphina", name: "Seraphina Watch", slot: "TIMEPIECE", giftedByHeroineId: "comp_seraphina", statModifiers: {} },
    { id: "k_mia", name: "Mia Apron", slot: "ATTIRE", giftedByHeroineId: "comp_mia", statModifiers: {} },
    { id: "k_colette", name: "Colette Shaker", slot: "TOOL_OF_THE_TRADE", giftedByHeroineId: "comp_colette", statModifiers: {} },
    { id: "k_kaede", name: "Kaede Wrist-Cord", slot: "POCKET_CHARM", giftedByHeroineId: "comp_kaede", statModifiers: {} },
    { id: "k_chloe", name: "Chloe Arcade Token", slot: "HOUSE_EMBLEM", giftedByHeroineId: "comp_chloe", statModifiers: {} },
  ];

  // Each of the 5 heroines should detect one of the OTHER 4 heroines' keepsakes
  const heroines = ["Seraphina Vane", "Mia Bellini", "Colette Moreau", "Kaede Tachibana", "Chloe Lin"];
  for (const h of heroines) {
    const res = detectKeepsakeJealousy(loadout, h);
    assert.strictEqual(res.hasJealousy, true, `${h} must detect jealousy`);
    assert.notStrictEqual(res.originalHeroine, h, `Detected conflicting owner must not be ${h}`);
  }

  // A 6th heroine (e.g. Pippa Reyes) should detect the first item
  const resPippa = detectKeepsakeJealousy(loadout, "Pippa Reyes");
  assert.strictEqual(resPippa.hasJealousy, true);
  assert.strictEqual(resPippa.conflictingKeepsake?.id, "k_seraphina");
});

test("Multiple Keepsakes: Substring bug causes false negative when Chloe Lin is paired with Mia's keepsake", () => {
  const loadoutWithMiaAndChloe: KeepsakeItem[] = [
    { id: "k_mia", name: "Mia Apron", slot: "ATTIRE", giftedByHeroineId: "comp_mia", statModifiers: {} },
    { id: "k_chloe", name: "Chloe Token", slot: "HOUSE_EMBLEM", giftedByHeroineId: "comp_chloe", statModifiers: {} },
  ];

  // When speaking with Chloe Lin:
  // 1st item: Mia's apron. Because 'lin' in 'bellini', isOwner evaluates to TRUE!
  // 2nd item: Chloe's token. isOwner evaluates to TRUE!
  // Result: hasJealousy is FALSE! Chloe Lin fails to detect Mia's keepsake!
  const res = detectKeepsakeJealousy(loadoutWithMiaAndChloe, "Chloe Lin");
  // Demonstrating the bug empirically:
  assert.strictEqual(
    res.hasJealousy,
    true,
    "[CONFIRMED BUG] Chloe Lin failed to detect Mia Bellini's keepsake in mixed loadout due to 'lin' substring match inside 'bellini'!"
  );
});

test("Multiple Keepsakes: Array permutation order independence", () => {
  const kA: KeepsakeItem = { id: "kA", name: "A Item", slot: "POCKET_CHARM", giftedByHeroineId: "comp_seraphina", statModifiers: {} };
  const kB: KeepsakeItem = { id: "kB", name: "B Item", slot: "TIMEPIECE", giftedByHeroineId: "comp_mia", statModifiers: {} };

  // Permutation 1: [kA, kB]
  const res1 = detectKeepsakeJealousy([kA, kB], "Kaede Tachibana");
  assert.strictEqual(res1.hasJealousy, true);

  // Permutation 2: [kB, kA]
  const res2 = detectKeepsakeJealousy([kB, kA], "Kaede Tachibana");
  assert.strictEqual(res2.hasJealousy, true);
});

// ============================================================================
// SUITE 5: FACTION STANDING BOUNDARY TRANSITIONS & TIER THRESHOLDS
// ============================================================================
console.log("--- SUITE 5: Faction Standing Boundary Transitions & Tiers ---");

test("Faction Reputation Tier: Exact boundaries 0..100", () => {
  const cases: [number, FactionTier][] = [
    [-50, "NEUTRAL"],
    [-1, "NEUTRAL"],
    [0, "NEUTRAL"],
    [10, "NEUTRAL"],
    [24, "NEUTRAL"],
    [25, "RESPECTED"],
    [30, "RESPECTED"],
    [49, "RESPECTED"],
    [50, "HONORED"],
    [65, "HONORED"],
    [74, "HONORED"],
    [75, "EXALTED"],
    [90, "EXALTED"],
    [100, "EXALTED"],
  ];

  for (const [rep, expTier] of cases) {
    const actual = getFactionReputationTier(rep);
    assert.strictEqual(actual, expTier, `Reputation ${rep} must yield ${expTier}`);
  }
});

test("Faction Reputation Tier: Extended & Out-of-Range values (0 to 1000+)", () => {
  // Testing boundary values mentioned in challenge dispatch: 0, 100, 300, 600, 1000+
  assert.strictEqual(getFactionReputationTier(0), "NEUTRAL", "Reputation 0 is NEUTRAL");
  assert.strictEqual(getFactionReputationTier(100), "EXALTED", "Reputation 100 is EXALTED");
  assert.strictEqual(getFactionReputationTier(300), "EXALTED", "Reputation 300 clamps to 100 -> EXALTED");
  assert.strictEqual(getFactionReputationTier(600), "EXALTED", "Reputation 600 clamps to 100 -> EXALTED");
  assert.strictEqual(getFactionReputationTier(1000), "EXALTED", "Reputation 1000 clamps to 100 -> EXALTED");
  assert.strictEqual(getFactionReputationTier(99999), "EXALTED", "Reputation 99999 clamps to 100 -> EXALTED");

  // Non-numeric edge cases
  assert.strictEqual(getFactionReputationTier(NaN), "NEUTRAL", "NaN defaults to NEUTRAL");
  assert.strictEqual(getFactionReputationTier(undefined as any), "NEUTRAL", "undefined defaults to NEUTRAL");
  assert.strictEqual(getFactionReputationTier(null as any), "NEUTRAL", "null defaults to NEUTRAL");
});

test("adjustFactionStanding: Clamping and baseline defaults", () => {
  // Undefined input uses default baselines: PLATINUM_BOARD: 10, BOARDWALK_GUILD: 15, etc.
  const init = adjustFactionStanding(undefined, "PLATINUM_BOARD", 0);
  assert.strictEqual(init.PLATINUM_BOARD, 10);
  assert.strictEqual(init.BOARDWALK_GUILD, 15);
  assert.strictEqual(init.BREAKERS_UNION, 10);
  assert.strictEqual(init.DRIFTWOOD_SYNDICATE, 10);

  // Normal increase
  const plus20 = adjustFactionStanding(init, "PLATINUM_BOARD", 20);
  assert.strictEqual(plus20.PLATINUM_BOARD, 30);
  assert.strictEqual(getFactionReputationTier(plus20.PLATINUM_BOARD), "RESPECTED");

  // Overflow increase clamped at 100
  const over = adjustFactionStanding(plus20, "PLATINUM_BOARD", 200);
  assert.strictEqual(over.PLATINUM_BOARD, 100);
  assert.strictEqual(getFactionReputationTier(over.PLATINUM_BOARD), "EXALTED");

  // Negative decrease clamped at 0
  const under = adjustFactionStanding(over, "PLATINUM_BOARD", -300);
  assert.strictEqual(under.PLATINUM_BOARD, 0);
  assert.strictEqual(getFactionReputationTier(under.PLATINUM_BOARD), "NEUTRAL");
});

test("getFactionPerks: All 4 factions x 4 tiers generate non-empty unique perks", () => {
  const factions: IslandFaction[] = [
    "PLATINUM_BOARD",
    "BOARDWALK_GUILD",
    "BREAKERS_UNION",
    "DRIFTWOOD_SYNDICATE",
  ];
  const tiers: FactionTier[] = ["NEUTRAL", "RESPECTED", "HONORED", "EXALTED"];

  for (const f of factions) {
    for (const t of tiers) {
      const perks = getFactionPerks(f, t);
      assert.ok(perks.title.length > 0, `Title must be present for ${f} - ${t}`);
      assert.strictEqual(perks.perks.length, 4, `Must list 4 perk entries for ${f} - ${t}`);

      if (t === "EXALTED") {
        // At EXALTED tier, no perks should say "locked"
        for (const p of perks.perks) {
          assert.ok(!p.includes("locked"), `Perk should not be locked at EXALTED: ${p}`);
        }
      }
      if (t === "NEUTRAL") {
        // At NEUTRAL tier, the latter 3 perks must be locked
        assert.ok(perks.perks[1].includes("locked"), "Respected perk locked at NEUTRAL");
        assert.ok(perks.perks[2].includes("locked"), "Honored perk locked at NEUTRAL");
        assert.ok(perks.perks[3].includes("locked"), "Exalted perk locked at NEUTRAL");
      }
    }
  }
});

// ============================================================================
// SUITE 6: TURN DIRECTIVE INTEGRATION STRESS TEST
// ============================================================================
console.log("--- SUITE 6: Turn Directive Integration Stress Test ---");

test("buildPortSolarisTurnDirective with Showdown, Jealousy, and Boarding House State", () => {
  const keepsake: KeepsakeItem = {
    id: "seraphina_pen",
    name: "Monogrammed Platinum Fountain Pen",
    slot: "POCKET_CHARM",
    giftedByHeroineId: "comp_seraphina",
    statModifiers: {},
  };

  const directive = buildPortSolarisTurnDirective({
    activeSpeaker: "Mia Bellini",
    speakerBpm: 100, // Short-circuit
    equippedKeepsakes: [keepsake],
    activeShowdown: {
      contestType: "CULINARY_CLASH",
      opponentName: "Chef Dante Moretti",
      playerStakes: "1-Week Dishwashing Penalty",
      opponentStakes: "+1 Star Rating & Wholesaler Key",
    },
    boardingHouseState: {
      shopName: "The Stray Anchor",
      starRating: 2,
      daysUntilAudit: 18,
      dailyRevenue: 450,
      outstandingDebt: 2800,
      scandalHeat: 45,
      activeTenants: ["comp_seraphina", "comp_colette"],
    },
  });

  // Verify Rom-Com & Showdown headers
  assert.ok(directive.includes("--- PORT SOLARIS ROM-COM & ARTICLE 9 SHOWDOWN DIRECTIVE ---"));
  assert.ok(directive.includes("NO dark fantasy death"));

  // Verify 100 BPM Short-Circuit trigger
  assert.ok(directive.includes("100 BPM SHORT-CIRCUIT TRIGGER"));
  assert.ok(directive.includes("Mia Bellini"));

  // Verify Caught Red-Handed Jealousy directive
  assert.ok(directive.includes("CAUGHT RED-HANDED JEALOUSY TRIGGER"));
  assert.ok(directive.includes("Seraphina Vane"));
  assert.ok(directive.includes("Monogrammed Platinum Fountain Pen"));

  // Verify Active Showdown & Non-Lethal Rules
  assert.ok(directive.includes("ACTIVE ARTICLE 9 SHOWDOWN: CULINARY_CLASH"));
  assert.ok(directive.includes("Chef Dante Moretti"));
  assert.ok(directive.includes("Non-lethal Composure & Hype/Cool rules apply"));
  assert.ok(directive.includes("Composure Meltdown"));

  // Verify Stray Anchor status
  assert.ok(directive.includes("THE STRAY ANCHOR STATUS: 2★ Rating | Debt: 2800 Crowns"));
});

// ============================================================================
// SUMMARY REPORT
// ============================================================================
console.log("\n======================================================================");
console.log(`TOTAL TESTS RUN:    ${testsRun}`);
console.log(`PASSED:             ${testsPassed}`);
console.log(`FAILED:             ${testsFailed}`);
if (testsFailed > 0) {
  console.log("FAILURES / EMPIRICAL BUG REPRODUCTIONS:");
  for (const f of failureLog) {
    console.log(`  - ${f}`);
  }
}
console.log("======================================================================");

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
