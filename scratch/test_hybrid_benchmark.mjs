import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

// Test the enhanced sanitization logic
function cleanCliches(text) {
  if (!text) return "";
  const CLICHE_REGEX = /\s*(The choice (of what happens next|is yours|now rests).*?(\.|$)|What will (you|they|he|she) do next\??|Only time will tell.*?(\.|$)|.*?waits with bated breath to see how.*?proceeds?\.?|The next (move|step|action) is (yours|up to you).*?(\.|$))/gi;
  return text.replace(CLICHE_REGEX, "").trim();
}

function normalizeSingleQuoteDialogue(text) {
  if (!text) return "";
  // Convert 'Speech here,' she said -> "Speech here," she said
  // Match single quotes wrapping at least two words or ending in punctuation
  return text.replace(/(^|[\s*])'([A-Z][^'\n]{2,}?[,!?…])'([\s*]|$)/g, '$1"$2"$3')
             .replace(/([\s*])'([A-Z][^'\n]{2,}?\.)'([\s*]|$)/g, '$1"$2"$3');
}

function ensureChoiceTag(choice) {
  if (!choice) return "";
  const trimmed = choice.trim();
  if (/^\[.+?\]/.test(trimmed)) return trimmed;
  
  const lower = trimmed.toLowerCase();
  let tag = "[Tactics]";
  if (lower.includes("attack") || lower.includes("strike") || lower.includes("blade") || lower.includes("fight") || lower.includes("combat") || lower.includes("kill") || lower.includes("sword") || lower.includes("charge")) {
    tag = "[Combat]";
  } else if (lower.includes("spell") || lower.includes("magic") || lower.includes("arcana") || lower.includes("channel") || lower.includes("rune") || lower.includes("smoke") || lower.includes("enchant")) {
    tag = "[Arcana]";
  } else if (lower.includes("sneak") || lower.includes("hide") || lower.includes("shadow") || lower.includes("steal") || lower.includes("feign") || lower.includes("escape") || lower.includes("ambush")) {
    tag = "[Subterfuge]";
  } else if (lower.includes("ask") || lower.includes("inquire") || lower.includes("demand") || lower.includes("speak") || lower.includes("talk") || lower.includes("reason") || lower.includes("negotiate") || lower.includes("call out")) {
    tag = "[Inquire]";
  }
  return `${tag} ${trimmed}`;
}

async function runBenchmark() {
  console.log("==================================================================");
  console.log("SMART HYBRID LLM BENCHMARK & VERIFICATION");
  console.log("==================================================================");

  const testPayload = {
    model: "deepseek/deepseek-chat",
    messages: [
      {
        role: "system",
        content: `You are the Game Master for Astra Chronicles.
Protagonist: Vaughn (Vanguard).
Companion: Evelyn Abbandonato (Imperial Inquisitor, smug, calculating).

CRITICAL PROSE & QUALITY CONSTRAINTS:
1. Maintain literary dark fantasy prose with rich sensory verbs.
2. In "player_execution", generate a substantial 3-6 sentence narrative passage of Vaughn's physical movements, tactical stance, and spoken dialogue in quotation marks "...".
3. In "narrative_text", write 2-3 immersive paragraphs.
4. STRICT NEGATIVE CONSTRAINT: NEVER end narrative_text with meta-narration or clichés like "The choice is yours" or "hangs in the balance".
5. Every choice in "suggested_choices" MUST be prefixed with an intent tag (e.g. "[Combat]", "[Arcana]", "[Subterfuge]", "[Inquire]").
6. ALL spoken dialogue MUST use double quotation marks ("...").

Respond strictly in valid JSON:
{
  "speaker": "Evelyn Abbandonato",
  "player_execution": string,
  "narrative_text": string,
  "state_updates": {
    "current_location": "Imperial Capital Imperium",
    "mood": "Calculating",
    "expression_key": "smug",
    "affection_delta": 1
  },
  "suggested_choices": [string, string, string, string]
}`
      },
      {
        role: "user",
        content: "Selected Choice Vector: [Combat] Step between Evelyn and the approaching Inquisitor patrol, drawing your notched broadsword to hold the portcullis archway."
      }
    ],
    temperature: 0.75,
    max_tokens: 1500,
    response_format: { type: "json_object" }
  };

  const t0 = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://astra-chronicles.local",
      "X-Title": "Astra Chronicles Benchmark",
    },
    body: JSON.stringify(testPayload),
  });

  const latency = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`Latency: ${latency}s | HTTP Status: ${res.status}`);

  if (!res.ok) {
    console.error("Benchmark failed:", await res.text());
    return;
  }

  const json = await res.json();
  const rawContent = json.choices[0].message.content;
  const parsed = JSON.parse(rawContent.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim());

  console.log("\n1. SPEAKER ATTRIBUTION VERIFICATION:");
  console.log(`   Speaker: "${parsed.speaker}" -> ${parsed.speaker === "Evelyn Abbandonato" ? "PASS (Correct Companion)" : "FAIL"}`);

  console.log("\n2. PLAYER EXECUTION DEPTH & SUBSTANCE:");
  const sentences = parsed.player_execution.match(/[^.!?]+[.!?]+/g) || [];
  console.log(`   Sentence Count: ${sentences.length} sentences`);
  console.log(`   Has Spoken Quotes: ${parsed.player_execution.includes('"') ? "YES" : "NO"}`);
  console.log(`   Sample:\n   ${parsed.player_execution}`);

  console.log("\n3. NARRATIVE PROSE & CLICHE CHECK:");
  const hasCliches = /hangs in the balance|choice is yours|waits with bated breath/i.test(parsed.narrative_text);
  console.log(`   Contains Meta Clichés: ${hasCliches ? "FAIL (Cliché detected)" : "PASS (Clean literary ending)"}`);
  console.log(`   Sample:\n   ${parsed.narrative_text}`);

  console.log("\n4. SUGGESTED CHOICES WITH INTENT TAGS:");
  parsed.suggested_choices.forEach((c, idx) => {
    const tagged = ensureChoiceTag(c);
    const hasTag = /^\[.+?\]/.test(tagged);
    console.log(`   Choice ${idx + 1}: ${tagged} -> ${hasTag ? "PASS" : "FAIL"}`);
  });

  console.log("\n5. METRICS:");
  console.log(`   Tokens: ${json.usage.total_tokens} | Cost: $${json.usage.cost?.toFixed(6) || "N/A"}`);
  console.log("==================================================================");
}

runBenchmark();

