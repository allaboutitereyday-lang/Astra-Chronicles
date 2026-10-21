import {
  sanitizeVisualNovelProse,
  sanitizeSpokenDialogue,
  normalizeQuotes,
  balanceQuotationMarks,
  balanceMarkdownAsterisks,
} from '../lib/proseSanitizer.ts';

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

if (allPassed) {
  console.log("\nALL SANITIZER TESTS PASSED PERFECTLY!");
} else {
  process.exit(1);
}

