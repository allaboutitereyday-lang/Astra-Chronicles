import fs from 'fs';

const CLICHE_PATTERNS = [
  /\s*The choice (of what happens next|is yours|now rests).*?([.!?]|$)/gi,
  /\s*What will (you|they|he|she|Vaughn) do next\??/gi,
  /\s*Only time will tell.*?([.!?]|$)/gi,
  /\s*.*?waits with bated breath to see how.*?proceeds?\.?/gi,
  /\s*The next (move|step|action) is (yours|up to you).*?([.!?]|$)/gi,
  /\s*The future hangs in the balance.*?([.!?]|$)/gi,
  /\s*How will (you|they|he|she|Vaughn) respond\??/gi,
];

function stripMetaCliches(text) {
  if (!text) return "";
  let cleaned = text;
  for (const pattern of CLICHE_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned.trim();
}

function normalizeSingleQuoteDialogue(text) {
  if (!text) return "";
  return text
    .replace(/(^|\n)\s*'([A-Z][^'\n]{2,}?[,!?…])'/g, '$1"$2"')
    .replace(/([\s*])'([A-Z][^'\n]{2,}?[,!?…])'/g, '$1"$2"')
    .replace(/([\s*])'([A-Z][^'\n]{2,}?\.)'/g, '$1"$2"');
}

function normalizeQuotes(text) {
  if (!text) return "";
  return text
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/"{3,}/g, '"')
    .replace(/""([^"\n]+)""/g, '"$1"')
    .replace(/""+/g, '"')
    .replace(/"'([^"\n]+?)'"/g, '"$1"')
    .replace(/'"([^'\n]+?)"'/g, '"$1"');
}

function ensureChoiceIntentTag(choice) {
  if (!choice) return "";
  const trimmed = choice.trim();
  if (/^\[.+?\]/.test(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  let tag = "[Tactics]";
  if (
    lower.includes("attack") ||
    lower.includes("strike") ||
    lower.includes("blade") ||
    lower.includes("fight") ||
    lower.includes("combat") ||
    lower.includes("kill") ||
    lower.includes("sword") ||
    lower.includes("charge") ||
    lower.includes("parry") ||
    lower.includes("block") ||
    lower.includes("draw")
  ) {
    tag = "[Combat]";
  } else if (
    lower.includes("spell") ||
    lower.includes("magic") ||
    lower.includes("arcana") ||
    lower.includes("channel") ||
    lower.includes("rune") ||
    lower.includes("smoke") ||
    lower.includes("enchant") ||
    lower.includes("focus")
  ) {
    tag = "[Arcana]";
  } else if (
    lower.includes("sneak") ||
    lower.includes("hide") ||
    lower.includes("shadow") ||
    lower.includes("steal") ||
    lower.includes("feign") ||
    lower.includes("escape") ||
    lower.includes("ambush") ||
    lower.includes("retreat") ||
    lower.includes("dodge")
  ) {
    tag = "[Subterfuge]";
  } else if (
    lower.includes("ask") ||
    lower.includes("inquire") ||
    lower.includes("demand") ||
    lower.includes("speak") ||
    lower.includes("talk") ||
    lower.includes("reason") ||
    lower.includes("negotiate") ||
    lower.includes("call out") ||
    lower.includes("question") ||
    lower.includes("whisper")
  ) {
    tag = "[Inquire]";
  }
  return `${tag} ${trimmed}`;
}

function sanitizeVisualNovelProse(rawText) {
  if (!rawText || typeof rawText !== "string") return "";
  let processed = rawText.trim();
  processed = processed.replace(/^\[[A-Z0-9\s'_—\-:]+\]\s*/i, "");
  processed = stripMetaCliches(processed);
  processed = normalizeSingleQuoteDialogue(processed);
  processed = normalizeQuotes(processed);
  return processed;
}

const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

if (!apiKey) {
  console.error("Missing OPENROUTER_API_KEY");
  process.exit(1);
}

// Exactly mirror app/api/turn/route.ts
async function simulateTurnApi({ action, companionName, companionPersona, stance }) {
  const model = "deepseek/deepseek-chat"; // orchestrated-hybrid resolved target
  const systemPrompt = `You are the Game Master, Narrator, and LitRPG Roleplay Engine for "Astra Chronicles", an immersive dark fantasy visual novel.

CURRENT SCENE & NARRATIVE CONTEXT:
- Universe & Story: Astra Chronicles
- Setting: Imperial Capital Imperium
- Tone & Narration Style: Grimdark & Atmospheric
- Protagonist: Vaughn (Role: Vanguard, Level: 1, HP: 100/100, MP: 50/50)
- Active Stance: ${stance}

COMPANION DOSSIERS:
1. ${companionName}:
   - Persona: ${companionPersona}
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt

--- SCENE PRESENCE: HEROINES PRESENT ---
- The protagonist (Vaughn) is in the physical presence of: ${companionName}.
- "speaker" MUST BE "${companionName}".
- "speaker" MUST NEVER BE "Vaughn".
- "state_updates.present_companions" MUST list ["${companionName}"].
- "state_updates.affected_companion" MUST BE "${companionName}".

--- MECHANICAL RULES ---
1. Speaker Attribution: "speaker" MUST NEVER BE "Vaughn".
2. Protagonist Action Depth ("player_execution"): When a preset choice is selected, "player_execution" MUST be an expansive, multi-sentence passage (minimum 3-6 sentences across 1-2 paragraphs) featuring Vaughn's physical movements, tactical posture, and spoken dialogue in quotation marks "...". It must NEVER be a single sentence or copy bracket tags.
3. Favor & Emotional Pacing: Set affection_delta to 0 by default; +1 or +2 on rare deep alignment.
4. Progression: Grant 15-40 EXP on meaningful actions.
5. Choices: Always generate 4 distinct, engaging prompt options for the next turn. Every single choice MUST be prefixed with an intent tag in brackets: "[Combat]", "[Arcana]", "[Subterfuge]", "[Inquire]", or "[Tactics]".
6. Narrative Prose, Grammar & Markdown Formatting:
   - Flawless literary grammar, active voice, rich sensory verbs.
   - MANDATORY QUOTATION MARKS: ALL spoken dialogue in both "player_execution" and "narrative_text" MUST be enclosed in standard double quotation marks ("...").
   - STRICT NEGATIVE CONSTRAINT: NEVER end "narrative_text" with meta-narration or question clichés such as "The choice of what happens next hangs in the balance", "What will you do next?", "The choice is yours", or "Only time will tell". Conclude cleanly on an active sensory beat or dialogue.
   - MARKDOWN IMMERSION: Use *italics* for physical gestures and **bold** for impacts.
   - Structure "narrative_text" into 2 to 3 evocative paragraphs.

--- OUTPUT FORMAT ---
Respond strictly in valid JSON matching this schema:
{
  "speaker": "${companionName}",
  "player_execution": string,
  "narrative_text": string,
  "death_event": null,
  "timeline_echo_unlocked": null,
  "state_updates": {
    "current_location": "Imperial Capital Imperium",
    "mood": string,
    "expression_key": "neutral" | "intrigued" | "flustered" | "smug" | "surprised" | "combat_ready" | "dangerous" | "hurt",
    "affected_companion": "${companionName}",
    "affection_delta": number,
    "present_companions": ["${companionName}"],
    "newly_encountered_heroines": []
  },
  "player_progression": {
    "exp_gained": number,
    "hp_change": number,
    "mp_change": number,
    "new_ability_unlocked": string | null,
    "gear_granted": null,
    "items_dropped": null
  },
  "system_updates": {
    "plausibility_delta": number,
    "plausibility_reason": string,
    "system_announcement": string,
    "quest_updates": [],
    "new_quest": null
  },
  "new_memory_unlocked": null,
  "suggested_choices": [string, string, string, string]
}`;

  const userPrompt = `Selected Choice Vector: ${action}\n[CRITICAL DIRECTIVE: In "player_execution", generate a substantial 3-6 sentence narrative passage of Vaughn's physical movements, tactical stance, and spoken dialogue in quotation marks "...". Do NOT output bracket tags like [Combat] in "player_execution". Advance companion/world response in "narrative_text".]`;

  const t0 = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://astra-chronicles.local",
      "X-Title": "Astra Chronicles",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.75,
      max_tokens: 2048,
      response_format: { type: "json_object" }
    })
  });

  const latency = ((Date.now() - t0) / 1000).toFixed(2);
  const data = await res.json();
  let content = data.choices[0].message.content;
  content = content.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim();

  let responseData = JSON.parse(content);

  // Apply API post-processors
  if (responseData.player_execution) {
    responseData.player_execution = sanitizeVisualNovelProse(responseData.player_execution);
  }
  if (!responseData.player_execution || responseData.player_execution.trim().split(/[.!?]+/).filter(Boolean).length < 2) {
    const cleanAct = action.replace(/^\[[^\]]+\]\s*/, "").trim();
    const stanceDesc = stance === "aggressive" ? "blade angled forward with relentless pressure" : "guard raised high and footing braced";
    responseData.player_execution = `Vaughn shifts weight and commits decisively to the tactical maneuver, ${stanceDesc}. The cold tension in the air crystallizes as every muscle tightens for immediate follow-through. "${cleanAct}"`;
  }

  if (responseData.narrative_text) {
    responseData.narrative_text = sanitizeVisualNovelProse(responseData.narrative_text);
  }

  if (Array.isArray(responseData.suggested_choices)) {
    responseData.suggested_choices = responseData.suggested_choices.map((c) =>
      ensureChoiceIntentTag(sanitizeVisualNovelProse(c))
    );
  }

  return { latency, responseData, usage: data.usage };
}

async function run() {
  console.log("================================================================================");
  console.log("SMART HYBRID LLM SYSTEM: FULL VERIFICATION SUITE");
  console.log("================================================================================");

  // Test Case 1: High Stakes Combat & Companion Defense (Evelyn)
  console.log("\n>>> RUNNING TEST CASE 1: Tactical Combat Defense (Evelyn)");
  const test1 = await simulateTurnApi({
    action: "[Combat] Interpose yourself with a low sweeping guard, driving your broadsword pommel into the nearest Inquisitor's breastplate to protect Evelyn.",
    companionName: "Evelyn Abbandonato",
    companionPersona: "Smug, calculating, aristocratic, razor-sharp intellect.",
    stance: "aggressive"
  });

  console.log(`Latency: ${test1.latency}s | Tokens: ${test1.usage.total_tokens}`);
  console.log(`Speaker: "${test1.responseData.speaker}" [Expected: Evelyn Abbandonato]`);
  console.log(`Player Execution sentences: ${test1.responseData.player_execution.split(/[.!?]+/).filter(Boolean).length}`);
  console.log(`Narrative Text length: ${test1.responseData.narrative_text.length} chars`);
  console.log(`Choices Generated:\n - ${test1.responseData.suggested_choices.join("\n - ")}`);

  // Test Case 2: Emotional & Tension-Filled Dialogue (Perci)
  console.log("\n>>> RUNNING TEST CASE 2: Intimate & High Tension Interrogation (Perci)");
  const test2 = await simulateTurnApi({
    action: "[Inquire] Step closer into the dim lantern light and reach out slowly toward Perci's trembling fox ears, speaking in a low, gentle rumble.",
    companionName: "Perci",
    companionPersona: "Anxious, hyper-vigilant Kitsune rogue, guarded, vulnerable.",
    stance: "neutral"
  });

  console.log(`Latency: ${test2.latency}s | Tokens: ${test2.usage.total_tokens}`);
  console.log(`Speaker: "${test2.responseData.speaker}" [Expected: Perci]`);
  console.log(`Player Execution sentences: ${test2.responseData.player_execution.split(/[.!?]+/).filter(Boolean).length}`);
  console.log(`Narrative Text length: ${test2.responseData.narrative_text.length} chars`);
  console.log(`Choices Generated:\n - ${test2.responseData.suggested_choices.join("\n - ")}`);

  console.log("\n================================================================================");
  console.log("VERIFICATION SCORECARD:");
  const test1ChoicesValid = test1.responseData.suggested_choices.every(c => /^\[.+?\]/.test(c));
  const test2ChoicesValid = test2.responseData.suggested_choices.every(c => /^\[.+?\]/.test(c));
  const test1NoCliche = !/hangs in the balance|choice is yours|waits with bated breath/i.test(test1.responseData.narrative_text);
  const test2NoCliche = !/hangs in the balance|choice is yours|waits with bated breath/i.test(test2.responseData.narrative_text);
  
  console.log(`1. Speaker Accuracy: ${test1.responseData.speaker === "Evelyn Abbandonato" && test2.responseData.speaker === "Perci" ? "100% PASS" : "FAIL"}`);
  console.log(`2. Intent Tags on Choices: ${test1ChoicesValid && test2ChoicesValid ? "100% PASS" : "FAIL"}`);
  console.log(`3. Zero Meta Clichés: ${test1NoCliche && test2NoCliche ? "100% PASS" : "FAIL"}`);
  console.log(`4. Player Execution Substance: ${test1.responseData.player_execution.length > 150 && test2.responseData.player_execution.length > 150 ? "100% PASS" : "FAIL"}`);
  console.log(`5. Average Latency: ${((parseFloat(test1.latency) + parseFloat(test2.latency)) / 2).toFixed(2)}s`);
  console.log("================================================================================");
}

run();
