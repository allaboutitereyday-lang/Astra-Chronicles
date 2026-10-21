import {
  sanitizeVisualNovelProse,
  sanitizeSpokenDialogue,
  ensureChoiceIntentTag,
  normalizeQuotes,
  balanceQuotationMarks,
  balanceMarkdownAsterisks,
} from '../lib/proseSanitizer.ts';
import { HEROINE_INTRODUCTION_DOSSIERS } from '../lib/heroineDossiers.ts';

const testCases = [
  {
    name: "Duplicate Quotes",
    input: `[PERCI'S RESPONSE] ""I won't let you near me!"" she hisses.`,
    expected: `"I won't let you near me!" she hisses.`,
  },
  {
    name: "Mixed Nested Quotes",
    input: `She whispers, "'Don't touch me!'" and steps back.`,
    expected: `She whispers, "Don't touch me!" and steps back.`,
  },
  {
    name: "Unclosed Quote at Paragraph End",
    input: `*Perci backs into the corner.* "I know what you're planning.\n\nShe holds her breath.`,
    expectedMatches: [`"I know what you're planning."`],
  },
  {
    name: "Unbalanced Asterisks (Markdown)",
    input: `*Perci swallows hard and takes a step back. "Leave me alone."`,
    expectedMatches: [`*Perci swallows hard and takes a step back.* "Leave me alone."`],
  },
  {
    name: "Stray Bracket Tag and Spacing",
    input: `[Combat]   *She raises her dagger .*   ""Stay away !""`,
    expected: `*She raises her dagger.* "Stay away!"`,
  },
];

console.log("=== RUNNING PROSE SANITIZER TESTS ===");
let allPassed = true;

for (const tc of testCases) {
  const result = sanitizeVisualNovelProse(tc.input);
  console.log(`\nTest [${tc.name}]:`);
  console.log(`  Input:    ${tc.input}`);
  console.log(`  Output:   ${result}`);
  if (tc.expected && result !== tc.expected) {
    console.error(`  FAIL: Expected "${tc.expected}", got "${result}"`);
    allPassed = false;
  } else if (tc.expectedMatches) {
    for (const em of tc.expectedMatches) {
      if (!result.includes(em)) {
        console.error(`  FAIL: Expected output to contain "${em}"`);
        allPassed = false;
      }
    }
  } else {
    console.log(`  PASS!`);
  }
}

const dialogueTest = sanitizeSpokenDialogue(`*steps closer* I won't back down.`);
console.log(`\nTest [sanitizeSpokenDialogue]:`);
console.log(`  Result: ${dialogueTest}`);
if (dialogueTest === `*steps closer* "I won't back down."`) {
  console.log(`  PASS!`);
} else {
  console.error(`  FAIL! Got: ${dialogueTest}`);
  allPassed = false;
}

console.log("\n=== TESTING CHOICE INTENT GUIDELINE & STRIPPING ===");
const choiceTestCases = [
  {
    input: "Step forward and strike with broadsword",
    expectedTag: "[Combat/Aggressive]: Step forward and strike with broadsword",
  },
  {
    input: "[Combat] Step forward and strike with broadsword",
    expectedTag: "[Combat/Aggressive]: Step forward and strike with broadsword",
  },
  {
    input: "[Combat]: Step forward and strike with broadsword",
    expectedTag: "[Combat/Aggressive]: Step forward and strike with broadsword",
  },
  {
    input: "[Combat/Aggressive]: Step forward and strike with broadsword",
    expectedTag: "[Combat/Aggressive]: Step forward and strike with broadsword",
  },
  {
    input: "[Combat/Aggressive] Step forward and strike with broadsword",
    expectedTag: "[Combat/Aggressive]: Step forward and strike with broadsword",
  },
  {
    input: "[Arcana] Channel mana into fingertips",
    expectedTag: "[Arcana/Analytical]: Channel mana into fingertips",
  },
  {
    input: "[Subterfuge] Slip into the shadows",
    expectedTag: "[Subterfuge/Cunning]: Slip into the shadows",
  },
  {
    input: "[Inquire] Ask who signed the contract",
    expectedTag: "[Inquire/Diplomatic]: Ask who signed the contract",
  },
  {
    input: "[Composure] Stand tall and meet her gaze",
    expectedTag: "[Composure/Defiant]: Stand tall and meet her gaze",
  },
];

for (const ctc of choiceTestCases) {
  const tagged = ensureChoiceIntentTag(ctc.input);
  console.log(`Choice: "${ctc.input}" -> "${tagged}"`);
  if (tagged !== ctc.expectedTag) {
    console.error(`  FAIL: Expected "${ctc.expectedTag}", got "${tagged}"`);
    allPassed = false;
  }
  const stripped = tagged.replace(/^\[[^\]]+\](?::)?\s*/, "");
  if (stripped.startsWith(":")) {
    console.error(`  FAIL: Stripping left leading colon: "${stripped}"`);
    allPassed = false;
  }
}

console.log("\n=== VERIFYING HEROINE INTRODUCTION DOSSIERS ===");
const expectedHeroines = ["Evelyn Abbandonato", "Aria Shadowthorn", "Serena", "Morgana", "Perci"];
for (const h of expectedHeroines) {
  const dossier = HEROINE_INTRODUCTION_DOSSIERS[h];
  if (!dossier) {
    console.error(`FAIL: Missing dossier for ${h}`);
    allPassed = false;
    continue;
  }
  console.log(`Checking ${h}:`);
  console.log(`  Title: ${dossier.title}`);
  console.log(`  Location: ${dossier.defaultLocation}`);
  console.log(`  Encounter Setup: ${dossier.canonicalEncounter.slice(0, 60)}...`);
  console.log(`  Dialogue: "${dossier.signatureOpeningDialogue.slice(0, 60)}..."`);
  console.log(`  Choices: ${dossier.baselineChoices.length}`);
  
  if (dossier.baselineChoices.length !== 4) {
    console.error(`  FAIL: Dossier ${h} does not have exactly 4 choices`);
    allPassed = false;
  }
  for (const choice of dossier.baselineChoices) {
    if (!/^\[[A-Za-z]+\/[A-Za-z]+\]:\s*.+$/.test(choice)) {
      console.error(`  FAIL: Choice does not match [Tone/Action]: format: "${choice}"`);
      allPassed = false;
    }
  }
}

if (allPassed) {
  console.log("\nALL SANITIZER, CHOICE & DOSSIER TESTS PASSED PERFECTLY!");
} else {
  process.exit(1);
}

