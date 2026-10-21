import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

if (!apiKey) {
  console.error("Missing OPENROUTER_API_KEY in .env.local");
  process.exit(1);
}

// Build a realistic payload like app/api/turn/route.ts
const systemPrompt = `You are the Game Master and roleplay engine for "Astra Chronicles", an immersive dark fantasy LitRPG visual novel.

CURRENT SCENE & NARRATIVE CONTEXT:
- Universe & Story: Astra Chronicles
- Setting: Imperial Capital Imperium
- Tone & Narration Style: Grimdark & Atmospheric
- Protagonist: Vaughn (Role: Vanguard, Level: 1)
- Active Stance: aggressive
- Active Synergies: None

COMPANION DOSSIERS:
1. Evelyn Abbandonato:
   - Role: Arcane Inquisitor & Aristocrat.
   - Persona: Smug, aristocratic, razor-sharp wit, calculating, observant.
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt

--- SCENE PRESENCE: HEROINES PRESENT ---
- The protagonist (Vaughn) is in the physical presence of: Evelyn Abbandonato.
- "speaker" MUST BE "Evelyn Abbandonato".
- "speaker" MUST NEVER BE "Vaughn".
- "state_updates.present_companions" MUST list ["Evelyn Abbandonato"].

--- MECHANICAL RULES ---
1. Speaker Attribution: "speaker" MUST BE "Evelyn Abbandonato".
2. Protagonist Action Depth ("player_execution"): When a preset choice is selected, "player_execution" MUST be an expansive, multi-sentence passage (minimum 3-6 sentences across 1-2 paragraphs) featuring Vaughn's physical movements, tactical posture, and spoken dialogue in quotation marks "...". It must NEVER be a single sentence or copy bracket tags.
3. Favor & Emotional Pacing: Set affection_delta to 0 by default; +1 or +2 on rare deep alignment.
4. Progression: Grant 15-40 EXP on meaningful actions.
5. Choices: Always generate 4 distinct engaging prompt options tagged with intent (e.g. "[Arcana]", "[Subterfuge]", "[Combat]", "[Inquire]").
6. Narrative Prose, Grammar & Markdown Formatting:
   - Maintain flawless literary grammar, correct punctuation, active voice, and rich sensory verbs.
   - ALL spoken dialogue in both "player_execution" and "narrative_text" MUST be enclosed in standard double quotation marks ("...").
   - Use *italics* for physical gestures and **bold** for impacts.
   - Structure "narrative_text" into 2 to 3 evocative paragraphs.

--- OUTPUT FORMAT ---
Respond strictly in valid JSON matching this schema:
{
  "speaker": "Evelyn Abbandonato",
  "player_execution": string,
  "narrative_text": string,
  "death_event": null,
  "timeline_echo_unlocked": null,
  "state_updates": {
    "current_location": "Imperial Capital Imperium",
    "mood": "Smug & Aristocratic",
    "expression_key": "smug",
    "affected_companion": "Evelyn Abbandonato",
    "affection_delta": 0,
    "present_companions": ["Evelyn Abbandonato"],
    "newly_encountered_heroines": []
  },
  "player_progression": {
    "exp_gained": 25,
    "hp_change": 0,
    "mp_change": 0,
    "new_ability_unlocked": null,
    "gear_granted": null,
    "items_dropped": null
  },
  "system_updates": {
    "plausibility_delta": 1,
    "plausibility_reason": "Grounded tactical approach.",
    "system_announcement": "System analysis: Causal balance intact.",
    "quest_updates": [],
    "new_quest": null
  },
  "new_memory_unlocked": null,
  "suggested_choices": ["string", "string", "string", "string"]
}`;

const userPrompt = `Selected Choice Vector: [Combat] Step between Evelyn and the approaching Inquisitor guard, drawing your heavy broadsword to bar the archway.
[CRITICAL DIRECTIVE: In "player_execution", generate a substantial 3-6 sentence narrative passage of Vaughn's physical movements, tactical stance, and spoken dialogue in quotation marks "...". Do NOT output bracket tags like [Combat] in "player_execution". Advance companion/world response in "narrative_text".]`;

async function testModel(modelName, modelId) {
  console.log(`\n======================================================`);
  console.log(`Testing ${modelName} (${modelId})`);
  console.log(`======================================================`);
  const t0 = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://astra-chronicles.local",
        "X-Title": "Astra Chronicles Test",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    console.log(`Response status: ${res.status} (${elapsed}s)`);

    if (!res.ok) {
      const err = await res.text();
      console.error(`Error: ${err}`);
      return null;
    }

    const json = await res.json();
    const rawContent = json.choices?.[0]?.message?.content || "";
    console.log(`Raw Content Length: ${rawContent.length} chars`);
    
    let parsed;
    try {
      let clean = rawContent.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim();
      parsed = JSON.parse(clean);
      console.log(`JSON Parsing: SUCCESS`);
    } catch (pe) {
      console.error(`JSON Parsing: FAILED! Error: ${pe.message}`);
      console.log(`First 300 chars of raw content:\n`, rawContent.slice(0, 300));
      return null;
    }

    console.log(`\n--- SPEAKER ---`);
    console.log(parsed.speaker);

    console.log(`\n--- PLAYER EXECUTION ---`);
    console.log(parsed.player_execution);

    console.log(`\n--- NARRATIVE TEXT ---`);
    console.log(parsed.narrative_text);

    console.log(`\n--- SUGGESTED CHOICES ---`);
    console.log(parsed.suggested_choices);

    console.log(`\n--- SYSTEM UPDATES ---`);
    console.log(parsed.system_updates);

    return { modelId, elapsed, parsed };
  } catch (e) {
    console.error(`Fetch exception:`, e.message);
    return null;
  }
}

async function run() {
  // Test current "orchestrated-hybrid" target: Euryale 70B
  await testModel("Euryale 70B (Current Hybrid Roleplay Model)", "sao10k/l3.1-euryale-70b");
  // Test DeepSeek V3
  await testModel("DeepSeek V3 (Control / Game Master)", "deepseek/deepseek-chat");
  // Test Hermes 3 70B
  await testModel("Hermes 3 70B (LitRPG Alternative)", "nousresearch/hermes-3-llama-3.1-70b");
}

run();

