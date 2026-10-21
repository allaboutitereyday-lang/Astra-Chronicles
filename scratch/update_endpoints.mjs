import fs from 'fs';

// 1. Update app/api/generate-starting-gear/route.ts
let gear = fs.readFileSync('app/api/generate-starting-gear/route.ts', 'utf-8');
gear = gear.replace(
  /const FAST_LLM_MODELS = \[[\s\S]*?\];/,
  `const FAST_LLM_MODELS = [\n  "deepseek/deepseek-chat",\n  "nousresearch/hermes-3-llama-3.1-70b",\n  "sao10k/l3-lunaris-8b",\n];`
);
fs.writeFileSync('app/api/generate-starting-gear/route.ts', gear, 'utf-8');
console.log("Updated generate-starting-gear");

// 2. Update app/api/generate-combat-blurb/route.ts
let combat = fs.readFileSync('app/api/generate-combat-blurb/route.ts', 'utf-8');
if (!combat.includes('maxDuration')) {
  combat = combat.replace(
    'export const runtime = "nodejs";',
    'export const runtime = "nodejs";\nexport const maxDuration = 60;'
  );
}
combat = combat.replace(
  /const FALLBACK_MODELS = \[[\s\S]*?\];/,
  `const FALLBACK_MODELS = [\n  "deepseek/deepseek-chat",\n  "nousresearch/hermes-3-llama-3.1-70b",\n  "sao10k/l3-lunaris-8b",\n];`
);
fs.writeFileSync('app/api/generate-combat-blurb/route.ts', combat, 'utf-8');
console.log("Updated generate-combat-blurb");

// 3. Update app/api/generate-choices/route.ts
let choices = fs.readFileSync('app/api/generate-choices/route.ts', 'utf-8');
if (!choices.includes('maxDuration')) {
  choices = choices.replace(
    'export const runtime = "nodejs";',
    'export const runtime = "nodejs";\nexport const maxDuration = 60;'
  );
}
choices = choices.replace(
  /const FALLBACK_MODELS = \[[\s\S]*?\];/,
  `const FALLBACK_MODELS = [\n  "deepseek/deepseek-chat",\n  "nousresearch/hermes-3-llama-3.1-70b",\n  "sao10k/l3-lunaris-8b",\n];`
);
fs.writeFileSync('app/api/generate-choices/route.ts', choices, 'utf-8');
console.log("Updated generate-choices");

